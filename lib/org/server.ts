/**
 * Server-only org resolution + the projects trust boundary.
 *
 * Identity comes from `lib/iam.ts` — one verified session, never a decode. The
 * cloud gateway then re-derives the tenant from that same bearer's HOME org —
 * `orgs[0].org`, NEVER the `owner` claim, which carries the APPLICATION's org
 * (a non-admin bearer can never widen scope: cloud `middleware_identity.go`
 * strips a client-set X-Org-Id and re-mints it from the verified token). We read
 * the SAME claim here, so what this app shows is what the gateway bills. So:
 *
 *   - The org a call is scoped/billed to == the bearer's home org. We forward the
 *     bearer; the gateway is the AUTHORITATIVE enforcer.
 *   - A global admin (member of the `admin` org) is the one principal cloud lets
 *     cross orgs via an explicit X-Org-Id; we stamp it ONLY for that case, and
 *     only off a signature-checked claim.
 *
 * Least privilege: the browser never chooses its own tenant. Fail-closed
 * everywhere.
 */
import 'server-only';

import type { NextRequest } from 'next/server';

import { session, type Session } from '@/lib/iam';
import { parseOwnerRepo } from '@/lib/git/sync';
import { requireSameOrigin } from '@/lib/org/csrf';
import type { Org, OrgContext } from '@/lib/org/types';

const trim = (s: string) => s.replace(/\/+$/, '');

/**
 * Cloud base that serves the org-scoped `/v1/projects` surface. In-cluster
 * deployments override with CLOUD_API_URL (avoids the public-gateway egress
 * 403); the public gateway is the safe default for a standalone deploy.
 */
export function cloudBase(): string {
  return trim(
    process.env.CLOUD_API_URL ||
      process.env.HANZO_API_URL ||
      'https://api.hanzo.ai',
  );
}

/**
 * The scoping decision for a BFF request — the ONE place cross-org is authorized.
 *
 * Default scope is the caller's own org (their HOME org from the signed `orgs`
 * claim; the gateway re-derives it the same way, so this is always safe). A DIFFERENT org (`X-Org-Id`) is honored
 * only for a global admin, and "global admin" is now read off a signature-checked
 * claim — so neither a forged JWT nor a client-set header can make this server
 * stamp `X-Org-Id: victim-org`.
 */
export interface Scope {
  /** The bearer to forward upstream. */
  token: string;
  /** The org to scope/attribute this call to (the caller's, or an admin's target). */
  org: string;
  /** True only when a global admin is acting cross-org. */
  crossOrg: boolean;
}

export async function resolveScope(req: NextRequest): Promise<Scope | null> {
  const id = await session(req);
  if (!id) return null;
  const org = effectiveOrg(req, id);
  return { token: id.token, org, crossOrg: org !== id.org };
}

/**
 * The org a verified caller is acting in: their own, unless they are a global
 * sudo who asked for another via `X-Org-Id`.
 */
export function effectiveOrg(req: NextRequest, id: Session): string {
  if (id.isSuperAdmin) {
    const override = req.headers.get('x-org-id')?.trim();
    if (override) return override;
  }
  return id.org;
}

/** Resolve the full, honest org context for the /v1/orgs surface. */
export async function resolveOrgContext(req: NextRequest): Promise<OrgContext | null> {
  const id = await session(req);
  if (!id) return null;

  const current = effectiveOrg(req, id);
  const orgs: Org[] = [];

  if (id.org) {
    orgs.push({
      name: id.org,
      displayName: id.orgDisplay || id.org,
      // A personal org's slug is (by our onboarding) the user's own handle. We
      // can't authoritatively read isPersonal from the token, so we surface the
      // org honestly and let the selector label it neutrally.
      isPersonal: id.org === id.name,
    });
  }

  // A global admin scoped to a non-home org: surface that org too so the switch
  // is visible. (The full tenant list is an admin-only console concern; we do
  // NOT fabricate a membership list a normal user does not have.)
  if (id.isSuperAdmin && current && current !== id.org) {
    orgs.push({ name: current, displayName: current, isPersonal: false });
  }

  return {
    orgs,
    currentOrg: current,
    homeOrg: id.org,
    isAdmin: id.isAdmin,
    isSuperAdmin: id.isSuperAdmin,
    needsOnboarding: !id.org,
  };
}

/**
 * Forward a request to one org-scoped cloud surface as the user.
 *
 * `prefix` is the cloud surface this call may reach — "/v1/projects",
 * "/v1/todo" — and it is the ONLY thing that varies between BFFs, so it is a
 * parameter rather than a second copy of this function. The caller passes an
 * already-authorized `subpath` (e.g. "" or "/my-site"); `proxy` below is what
 * authorizes one off the wire.
 *
 * Attaches the user's IAM bearer (the gateway derives the tenant from its owner
 * claim — the authoritative org scope + billing attribution). For a GLOBAL ADMIN
 * that has switched scope, also stamps `X-Org-Id` (cloud honors it only for
 * admin-org members; for anyone else it is ignored, so stamping is always safe).
 */
export async function forward(
  req: NextRequest,
  prefix: string,
  subpath: string,
  init: { method: string; body?: BodyInit | null; contentType?: string },
): Promise<Response> {
  const scope = await resolveScope(req);
  if (!scope) return jsonError('Unauthorized', 401);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${scope.token}`,
    Accept: 'application/json',
  };
  if (init.contentType) headers['Content-Type'] = init.contentType;

  // Stamp X-Org-Id ONLY for a validated global admin acting cross-org.
  if (scope.crossOrg) headers['X-Org-Id'] = scope.org;

  const url = `${cloudBase()}${prefix}${subpath}`;
  try {
    const res = await fetch(url, {
      method: init.method,
      headers,
      body: init.body ?? undefined,
      cache: 'no-store',
    });
    // Stream the upstream response through unchanged (status + body + type).
    const buf = await res.arrayBuffer();
    return new Response(buf, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return jsonError(`${prefix} backend unreachable`, 502);
  }
}

/**
 * Reject any traversal/escape so a forward stays under its prefix. A malformed
 * percent-escape (decodeURIComponent throws) is treated as hostile → rejected as
 * invalid, never a 500.
 *
 * This is the guard that keeps a catch-all BFF from being an open relay onto the
 * whole cloud: without it, `/v1/todo/../iam/users` would reach `/v1/iam`. It
 * lives here, once, because a security check with two copies is a security check
 * with one stale copy.
 */
export function cleanSubpath(segments: string[] | undefined): string | null {
  if (!segments || segments.length === 0) return '';
  for (const s of segments) {
    if (!s) continue;
    let decoded: string;
    try {
      decoded = decodeURIComponent(s);
    } catch {
      return null; // malformed % escape → reject
    }
    const lower = decoded.toLowerCase();
    const raw = s.toLowerCase();
    if (
      lower === '..' ||
      lower.includes('/') ||
      lower.includes('\\') ||
      raw.includes('%2e') ||
      raw.includes('%2f') ||
      raw.includes(';')
    ) {
      return null;
    }
  }
  return '/' + segments.map((s) => encodeURIComponent(s)).join('/');
}

/**
 * Serve one catch-all BFF call: guard the subpath, refuse a cross-origin
 * mutation, carry the body through unchanged, forward as the caller.
 *
 * Every `/v1/<surface>/[[...path]]` route is this function plus a prefix, so the
 * traversal guard and the CSRF gate cannot drift apart between surfaces.
 */
export async function proxy(
  req: NextRequest,
  segments: string[] | undefined,
  prefix: string,
  method: string,
  withBody: boolean,
): Promise<Response> {
  // CSRF: a cross-origin mutating request is refused BEFORE any identity or
  // forward work. GET is a no-op here.
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const base = cleanSubpath(segments);
  if (base === null) return jsonError('invalid path', 400);
  const sub = base + (req.nextUrl.search || '');

  let body: BodyInit | null = null;
  let contentType: string | undefined;
  if (withBody) {
    // Pass the body through unchanged (JSON, or a binary deploy artifact).
    // Reading as an ArrayBuffer preserves tars.
    contentType = req.headers.get('content-type') || undefined;
    const buf = await req.arrayBuffer();
    body = buf.byteLength ? buf : null;
  }

  return forward(req, prefix, sub, { method, body, contentType });
}

function jsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Ensure a source property (`owner/repo`) is registered as a project in the
 * org-scoped shared store — so every editable Hanzo property "ties back" and
 * shows in hanzo.app's projects list. IDEMPOTENT: lists the caller's projects
 * and only creates when no project already links the same repo.
 *
 * Called from the CROSS-ORIGIN `/v1/register` widget route, so it takes the
 * already-verified bearer explicitly (not `req`): the cloud gateway
 * derives the tenant from that bearer's HOME org (orgs[0].org), so the project lands in the
 * caller's home org WITHOUT the browser choosing a tenant. Fail-open (never
 * throws): registration is a convenience, not a gate — a failure just means the
 * property isn't auto-listed yet.
 */
export async function ensureProjectForRepo(
  bearer: string,
  input: { repo: string; name: string; slug: string },
): Promise<{ registered: boolean; existed: boolean; slug: string }> {
  const parsed = parseOwnerRepo(input.repo);
  if (!parsed) return { registered: false, existed: false, slug: input.slug };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${bearer}`,
    Accept: 'application/json',
  };
  const base = `${cloudBase()}/v1/projects`;

  try {
    // 1) Already linked? Match on the stored repo URL's owner/repo (host-agnostic).
    const listRes = await fetch(base, { headers, cache: 'no-store' });
    if (listRes.ok) {
      const list = (await listRes.json().catch(() => [])) as Array<{
        slug?: string;
        repo?: { url?: string };
      }>;
      if (Array.isArray(list)) {
        const match = list.find((p) => {
          const u = p?.repo?.url;
          if (!u) return false;
          const pr = parseOwnerRepo(u);
          return !!pr && pr.owner.toLowerCase() === parsed.owner.toLowerCase() && pr.repo.toLowerCase() === parsed.repo.toLowerCase();
        });
        if (match) return { registered: false, existed: true, slug: match.slug || input.slug };
      }
    }

    // 2) Not present → create it (org derived from the bearer, server-side).
    const createRes = await fetch(base, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: input.name, slug: input.slug, repo: { url: input.repo } }),
      cache: 'no-store',
    });
    if (createRes.ok) {
      const created = (await createRes.json().catch(() => null)) as { slug?: string } | null;
      return { registered: true, existed: false, slug: created?.slug || input.slug };
    }
    // A slug collision (409) means the property is effectively already tracked.
    if (createRes.status === 409) return { registered: false, existed: true, slug: input.slug };
    return { registered: false, existed: false, slug: input.slug };
  } catch {
    return { registered: false, existed: false, slug: input.slug };
  }
}
