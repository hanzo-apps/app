/**
 * The ONE server-side answer to "who is calling?".
 *
 * hanzo.app has no session of its own. The only credential that exists is the
 * IAM access token the @hanzo/iam SDK obtains by OIDC PKCE against hanzo.id, and
 * the only thing this module does is VERIFY it: RS256 signature against IAM's
 * JWKS, `iss` pinned to the discovered issuer, `exp`/`nbf` honored. A token that
 * fails any of those is not a caller.
 *
 * AUDIENCE gates PRIVILEGE, not existence. Every Hanzo surface authenticates
 * against the same hanzo.id under its own client, and the cross-origin Edit
 * widget forwards its host app's token — so a token minted for another Hanzo app
 * is a real person and may act as themselves. What it may NOT do is elevate:
 * staff/sudo require a token minted for OUR client (`aud`/`azp`), which is the
 * confused-deputy guard. Two different questions, answered separately.
 *
 * Everything downstream reads identity from here, so there is exactly one trust
 * decision in the app. Two properties fall out of that:
 *
 *   - No unverified decode. The hot path used to run `decodeJwt` and believe the
 *     `owner` claim, so a JWT with a forged signature resolved to a real org.
 *   - No userinfo round-trip. Verification is local against a cached key set, so
 *     identity costs nothing on the hot path and there is no longer any reason
 *     for a caller to skip it.
 *
 * Transport is deliberately not a trust input: `Authorization: Bearer` first,
 * else the SDK's session cookie (a top-level navigation can send nothing else).
 * Which pipe the token arrived through changes nothing about what it grants.
 */
import 'server-only';

import { validateToken } from '@hanzo/iam/auth';
import { SESSION_COOKIE, getBearerToken, type HeaderCarrier } from '@hanzo/iam/server';

import { isStaffAdmin, isSuperAdmin } from '@/lib/org/policy';

export { SESSION_COOKIE, type HeaderCarrier };

/** Thrown by {@link requireSession}; route handlers map it to a 401. */
export const UNAUTHORIZED = 'Unauthorized';

/**
 * IAM binding. `IAM_URL` is the name the deployment actually sets. Read fresh
 * (not a module-load const) so it is deterministically testable.
 */
function config() {
  return {
    serverUrl: process.env.IAM_URL || 'https://hanzo.id',
    clientId: process.env.IAM_CLIENT_ID || 'hanzo-app',
  };
}

/** Did IAM mint this token for OUR client? The elevation guard. */
function mintedForApp(claims: { aud?: unknown; azp?: unknown }, clientId: string): boolean {
  const aud = claims.aud;
  return (Array.isArray(aud) ? aud.includes(clientId) : aud === clientId) || claims.azp === clientId;
}

/** A verified caller. Every field is derived from a signature-checked claim. */
export interface Session {
  /** The verified bearer, forwarded upstream unchanged. */
  token: string;
  /** IAM subject — the stable user id. */
  sub: string;
  /** Display name. */
  name: string;
  /** Email, when the token carries one. */
  email: string;
  /** The caller's org — the verified `owner` claim; '' when unassigned. */
  org: string;
  /** Human label for that org, when the token carries one. */
  orgDisplay: string;
  /** STAFF — may edit any Hanzo surface live, unmetered. */
  isAdmin: boolean;
  /** SUDO — may act ACROSS tenants. Strictly narrower than {@link isAdmin}. */
  isSuperAdmin: boolean;
}

/** The raw bearer as presented, unverified. Never a trust input on its own. */
export function bearer(req: HeaderCarrier): string | null {
  return getBearerToken(req, { cookieName: SESSION_COOKIE }) ?? null;
}

function header(req: HeaderCarrier, name: string): string {
  const h = req.headers as { get?(n: string): string | null } & Record<string, unknown>;
  if (typeof h.get === 'function') return h.get(name) ?? '';
  const v = h[name];
  return typeof v === 'string' ? v : '';
}

/**
 * Local `next dev` with no IAM round-trip. Gated on the dev build AND a loopback
 * Host, so it cannot exist in the production image (NODE_ENV=production).
 */
function localDev(req: HeaderCarrier): Session | null {
  if (process.env.NODE_ENV !== 'development') return null;
  const host = header(req, 'host');
  if (!host.includes('localhost') && !host.includes('127.0.0.1')) return null;
  return {
    token: '',
    sub: 'local-dev-user',
    name: 'local',
    email: '',
    org: 'local',
    orgDisplay: 'Local Workspace',
    isAdmin: false,
    isSuperAdmin: false,
  };
}

/**
 * Resolve the verified caller, or null. `token` lets a caller that already holds
 * a bearer verify that one instead of re-reading the request.
 */
export async function session(
  req: HeaderCarrier,
  token = bearer(req),
): Promise<Session | null> {
  if (!token) return localDev(req);

  const cfg = config();
  // Audience is checked below as a PRIVILEGE input, so it must not also decide
  // whether the token verifies at all.
  const result = await validateToken(token, { ...cfg, allowMissingAudience: true });
  if (!result.ok) return null;

  const claims = result.claims as {
    owner?: unknown;
    displayName?: unknown;
    isAdmin?: unknown;
    email?: unknown;
    name?: unknown;
    preferred_username?: unknown;
    aud?: unknown;
    azp?: unknown;
  };
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  // The org is the `owner` claim, NOT the SDK's `result.owner`: IAM issues an
  // opaque uuid `sub`, so the SDK's "org prefix of sub" derivation resolves to
  // "unknown" for every real token.
  const org = str(claims.owner);
  const email = str(claims.email) || result.email || '';
  const authority = { owner: org, isAdmin: claims.isAdmin === true, email };
  const ours = mintedForApp(claims, cfg.clientId);

  return {
    token,
    sub: result.userId,
    name: str(claims.name) || str(claims.preferred_username) || result.userId,
    email,
    org,
    orgDisplay: str(claims.displayName) || org,
    isAdmin: ours && isStaffAdmin(authority),
    isSuperAdmin: ours && isSuperAdmin(authority),
  };
}

/** {@link session}, or throw {@link UNAUTHORIZED}. */
export async function requireSession(req: HeaderCarrier): Promise<Session> {
  const s = await session(req);
  if (!s) throw new Error(UNAUTHORIZED);
  return s;
}
