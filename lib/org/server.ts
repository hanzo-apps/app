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
 * Forward a request to the org-scoped cloud `/v1/projects` surface as the user.
 *
 * Attaches the user's IAM bearer (the gateway derives the tenant from its owner
 * claim — the authoritative org scope + billing attribution). For a GLOBAL ADMIN
 * that has switched scope, also stamps `X-Org-Id` (cloud honors it only for
 * admin-org members; for anyone else it is ignored, so stamping is always safe).
 * The caller passes an already-authorized `subpath` (e.g. "" or "/my-site").
 */
export async function forwardProjects(
  req: NextRequest,
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

  const url = `${cloudBase()}/v1/projects${subpath}`;
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
      },
    });
  } catch {
    return jsonError('projects backend unreachable', 502);
  }
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
