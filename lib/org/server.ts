/**
 * Server-only org resolution + the projects trust boundary.
 *
 * hanzo.app already holds the user's IAM bearer (the httpOnly `hanzo_token`
 * cookie, minted by our OAuth callback). The cloud gateway validates that JWT
 * and derives the tenant STRICTLY from its `owner` claim (a non-admin bearer can
 * never widen scope — cloud `middleware_identity.go` strips client X-Org-Id and
 * re-mints it from the verified token). So:
 *
 *   - The org a call is scoped/billed to == the bearer owner. We forward the
 *     bearer; the gateway is the AUTHORITATIVE enforcer. Decoding the owner here
 *     is for DISPLAY + routing (which org to show, whether to onboard) only —
 *     a forged/edited token changes nothing, because the gateway re-verifies.
 *   - A global admin (member of the `admin` org) is the one principal cloud lets
 *     cross orgs via an explicit X-Org-Id; we stamp it ONLY for that case.
 *
 * Least privilege: the browser never chooses its own tenant. This module reads
 * WHO the caller is from their own bearer, pins a normal user to their home org,
 * and forwards. Fail-closed everywhere.
 */
import 'server-only';

import { decodeJwt } from 'jose';
import type { NextRequest } from 'next/server';

import { fetchIamUser } from '@/lib/auth';
import { ADMIN_ORG } from '@/lib/org/policy';
import type { Org, OrgContext } from '@/lib/org/types';

const TOKEN_COOKIE = 'hanzo_token';

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

/** The resolved caller identity for org purposes (from their own bearer). */
export interface OrgIdentity {
  /** The raw IAM bearer we forward to cloud (the `hanzo_token`). */
  token: string;
  /** IAM subject / user id. */
  sub: string;
  /** Username / login name. */
  name: string;
  /** Email, when the token/userinfo carries it. */
  email: string;
  /** The user's IAM home org (bearer `owner` claim); '' when unassigned. */
  homeOrg: string;
  /** Human display name for the home org, when the token carries it. */
  homeOrgDisplay: string;
  /**
   * True for an `admin`-org member (may act across tenants). ONLY ever true on
   * the VALIDATED path (IAM userinfo proved the bearer genuinely IAM-signed) —
   * NEVER set from an unverified `decodeJwt`, so a forged unsigned JWT
   * `{"owner":"admin","isGlobalAdmin":true}` can never drive a privileged
   * decision here.
   */
  isGlobalAdmin: boolean;
  /** True once the bearer was validated against IAM (userinfo). */
  validated: boolean;
}

/**
 * Read the IAM bearer. In PRODUCTION the BFFs are COOKIE-ONLY (the httpOnly
 * `hanzo_token` set by our OAuth callback) — a client-supplied `Authorization`
 * header is IGNORED, so a caller can never inject a bearer to make this server a
 * confused deputy that stamps a privileged cross-org header on its behalf. The
 * header is honored ONLY outside production, for local curl/testing. (Note: even
 * so, a value read here is NEVER trusted for privilege — admin status requires
 * IAM validation; see resolveOrgIdentity.)
 */
export function readBearer(req: NextRequest): string | null {
  const cookie = req.cookies.get(TOKEN_COOKIE)?.value;
  if (cookie) return cookie;
  if (process.env.NODE_ENV !== 'production') {
    const header = req.headers.get('authorization');
    if (header) return header.startsWith('Bearer ') ? header.slice(7) : header;
  }
  return null;
}

/**
 * Read the IAM bearer for the CROSS-ORIGIN Edit-widget routes (`/v1/me`,
 * `/v1/suggest`, `/v1/edit`). Unlike `readBearer` (cookie-only in production, to
 * keep the same-origin BFFs from being a confused deputy), these routes are
 * cross-origin BY DESIGN: the widget is installed on OTHER Hanzo origins where a
 * SameSite=Lax `hanzo_token` cookie does NOT ride a cross-site fetch, so the
 * widget forwards the host app's IAM token as `Authorization: Bearer`. Cookie
 * first (same-origin hanzo.app), else the header.
 *
 * This is SAFE only where identity is ALWAYS IAM-validated (userinfo — a forged
 * token yields null, never admin) and NO cross-org `X-Org-Id` is stamped from it.
 * The three widget routes satisfy both: they validate the bearer and act solely
 * as the validated caller, on the caller's OWN repo token + home org.
 */
export function readWidgetBearer(req: NextRequest): string | null {
  const cookie = req.cookies.get(TOKEN_COOKIE)?.value;
  if (cookie) return cookie;
  const header = req.headers.get('authorization');
  if (header) return header.startsWith('Bearer ') ? header.slice(7) : header;
  return null;
}

/** Claims we read off a Casdoor access-token JWT (best-effort, unverified). */
interface OwnerClaims {
  owner?: string;
  name?: string;
  email?: string;
  displayName?: string;
  isGlobalAdmin?: boolean;
  exp?: number;
}

/**
 * Decode the org-relevant claims from a bearer WITHOUT verifying the signature.
 * Safe because (a) the token is our own httpOnly cookie minted by the OAuth
 * callback and (b) the gateway re-verifies + re-derives the tenant downstream —
 * this decode only decides what we DISPLAY / whether to onboard. Returns null
 * for a non-JWT (e.g. the dev mock token) or an expired token.
 */
export function decodeOwner(token: string): OwnerClaims | null {
  try {
    const claims = decodeJwt(token) as OwnerClaims;
    if (claims.exp && claims.exp * 1000 < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}

/** True on a localhost dev request (mirrors lib/auth.ts's dev affordance). */
function isLocalDev(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'development') return false;
  const host = req.headers.get('host') || '';
  return host.includes('localhost') || host.includes('127.0.0.1');
}

/**
 * Resolve the caller's org identity from their bearer. `validate: true` confirms
 * the token is live via IAM userinfo (used on the cold /v1/orgs load); the hot
 * paths (BFF forward, billing attribution) skip the round-trip and rely on the
 * gateway's downstream verification. Returns null when unauthenticated.
 */
export async function resolveOrgIdentity(
  req: NextRequest,
  opts: { validate?: boolean; bearer?: string } = {},
): Promise<OrgIdentity | null> {
  // `opts.bearer` is the widget-route opt-in (a caller that already read the
  // cross-origin bearer via `readWidgetBearer`); every other caller falls through
  // to the cookie-only `readBearer`, so their behavior is byte-identical.
  const token = opts.bearer ?? readBearer(req);
  if (!token) {
    // Dev affordance: localhost with no token acts in a local workspace org so
    // the builder is usable without an IAM round-trip in development.
    if (isLocalDev(req)) {
      return {
        token: 'local-dev-token',
        sub: 'local-dev-user',
        name: 'local',
        email: '',
        homeOrg: 'local',
        homeOrgDisplay: 'Local Workspace',
        isGlobalAdmin: false,
        validated: false,
      };
    }
    return null;
  }

  const claims = decodeOwner(token);

  // Authoritative liveness check (revocation-aware). On the hot path (validate
  // off) we do NOT round-trip IAM — but then we also do NOT trust any privileged
  // claim: isGlobalAdmin stays FALSE unless the bearer was validated here.
  let sub = claims?.name || '';
  let email = claims?.email || '';
  let name = claims?.name || '';
  let validated = false;
  if (opts.validate) {
    const info = await fetchIamUser(token);
    if (!info) {
      // A live localhost dev session may carry the mock token — keep it usable.
      if (isLocalDev(req) && token === 'local-dev-token') {
        return {
          token,
          sub: 'local-dev-user',
          name: 'local',
          email: '',
          homeOrg: 'local',
          homeOrgDisplay: 'Local Workspace',
          isGlobalAdmin: false,
          validated: false,
        };
      }
      return null;
    }
    // userinfo 200 ⇒ the bearer is genuinely IAM-signed + not revoked, so the
    // claims decoded from that SAME token are authoritative.
    validated = true;
    sub = info.sub;
    name = info.preferred_username || info.name || info.sub;
    email = info.email || email;
  }

  const homeOrg = (claims?.owner || '').trim();
  // Privilege is granted ONLY from a validated bearer — never from an
  // unverified decodeJwt (a forged unsigned JWT decodes fine but fails userinfo).
  const isGlobalAdmin = validated && (homeOrg === ADMIN_ORG || claims?.isGlobalAdmin === true);

  return {
    token,
    sub: sub || homeOrg || 'user',
    name: name || sub || 'user',
    email,
    homeOrg,
    homeOrgDisplay: claims?.displayName || homeOrg,
    isGlobalAdmin,
    validated,
  };
}

/**
 * The scoping decision for a BFF request — the ONE place cross-org is authorized.
 *
 * Default scope is the caller's home org (the bearer owner; the gateway re-derives
 * it, so this is always safe). A DIFFERENT org (`X-Org-Id`) is honored ONLY after
 * IAM validation proves the caller is a global admin — so a forged unsigned JWT or
 * a client-set header can never make this server stamp `X-Org-Id: victim-org`. The
 * common case (no header / own org) pays NO validation round-trip; only an actual
 * cross-org request triggers the authoritative check.
 */
export interface Scope {
  /** The bearer to forward upstream. */
  token: string;
  /** The caller's home org (bearer owner). */
  homeOrg: string;
  /** The org to scope/attribute this call to (owner, or a validated admin's target). */
  org: string;
  /** True only when a validated global admin is acting cross-org. */
  crossOrg: boolean;
}

export async function resolveScope(req: NextRequest): Promise<Scope | null> {
  const base = await resolveOrgIdentity(req); // hot path: isGlobalAdmin=false
  if (!base) return null;
  const requested = req.headers.get('x-org-id')?.trim();
  if (!requested || requested === base.homeOrg) {
    return { token: base.token, homeOrg: base.homeOrg, org: base.homeOrg, crossOrg: false };
  }
  // A cross-org request MUST be a validated global admin.
  const v = await resolveOrgIdentity(req, { validate: true });
  if (v?.isGlobalAdmin) {
    return { token: v.token, homeOrg: v.homeOrg, org: requested, crossOrg: true };
  }
  // Forged / unauthorized cross-org header — ignore it, pin to owner.
  return { token: base.token, homeOrg: base.homeOrg, org: base.homeOrg, crossOrg: false };
}

/**
 * The effective org for an ALREADY-VALIDATED identity (used by routes that call
 * `resolveOrgIdentity({validate:true})` — /v1/orgs, /onboard, /v1/publish). A
 * cross-org `X-Org-Id` is honored only when the VALIDATED identity is a global
 * admin. NEVER call this with a non-validated identity (isGlobalAdmin is false
 * there, so it fail-closes to the home org anyway). Hot paths use `resolveScope`.
 */
export function effectiveOrg(req: NextRequest, id: OrgIdentity): string {
  if (id.validated && id.isGlobalAdmin) {
    const override = req.headers.get('x-org-id')?.trim();
    if (override) return override;
  }
  return id.homeOrg;
}

/** Resolve the full, honest org context for the /v1/orgs surface. */
export async function resolveOrgContext(req: NextRequest): Promise<OrgContext | null> {
  const id = await resolveOrgIdentity(req, { validate: true });
  if (!id) return null;

  const current = effectiveOrg(req, id);
  const orgs: Org[] = [];

  if (id.homeOrg) {
    orgs.push({
      name: id.homeOrg,
      displayName: id.homeOrgDisplay || id.homeOrg,
      // A personal org's slug is (by our onboarding) the user's own handle. We
      // can't authoritatively read isPersonal from the token, so we surface the
      // org honestly and let the selector label it neutrally.
      isPersonal: id.homeOrg === id.name,
    });
  }

  // A global admin scoped to a non-home org: surface that org too so the switch
  // is visible. (The full tenant list is an admin-only console concern; we do
  // NOT fabricate a membership list a normal user does not have.)
  if (id.isGlobalAdmin && current && current !== id.homeOrg) {
    orgs.push({ name: current, displayName: current, isPersonal: false });
  }

  return {
    orgs,
    currentOrg: current,
    homeOrg: id.homeOrg,
    isGlobalAdmin: id.isGlobalAdmin,
    needsOnboarding: !id.homeOrg,
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
