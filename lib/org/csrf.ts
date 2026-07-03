/**
 * Same-origin CSRF guard for the cookie-authenticated BFFs.
 *
 * MIRRORED FROM console2's `bearer-proxy.ts` `sameOriginOK` (identical logic).
 * Our BFFs authenticate from the first-party httpOnly `hanzo_token` cookie, which
 * the browser auto-sends cross-site — so a cross-origin page could otherwise drive
 * a state change (publish a site, create an org, spend credits) as the victim.
 * On MUTATING methods (POST/PUT/PATCH/DELETE) we require two independent signals,
 * both fail-closed, BEFORE resolving identity:
 *   1. `Sec-Fetch-Site` (browser-set, JS-unforgeable): `cross-site` is refused.
 *   2. `Origin` host must equal `Host` (falling back to `Referer` host).
 * Safe methods (GET/HEAD/OPTIONS) are never gated. Defense in depth on top of the
 * cookie's own SameSite=Lax. PURE.
 */
import { type NextRequest, NextResponse } from 'next/server';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function hostOf(url: string | null): string {
  if (!url) return '';
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

export interface OriginSignals {
  host: string;
  origin: string | null;
  referer: string | null;
  /** `Sec-Fetch-Site` header value (browser-set, JS-unforgeable). */
  secFetchSite: string | null;
}

export function sameOriginOK(method: string, s: OriginSignals): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return true;
  const site = (s.secFetchSite ?? '').trim().toLowerCase();
  if (site === 'cross-site') return false;
  const h = (s.host ?? '').trim();
  if (!h) return false; // no Host to compare against — refuse a mutating request
  const o = hostOf(s.origin);
  if (o) return o === h;
  const r = hostOf(s.referer);
  if (r) return r === h;
  // No Origin/Referer: allow ONLY when fetch-metadata already affirmed same-origin.
  return site === 'same-origin';
}

/**
 * Guard a request from a route handler: returns a 403 `NextResponse` when a
 * mutating request is NOT same-origin, else null (proceed). Call at the TOP of a
 * mutating BFF, before resolving identity.
 */
export function requireSameOrigin(req: NextRequest): NextResponse | null {
  const ok = sameOriginOK(req.method, {
    host: req.headers.get('host') ?? '',
    origin: req.headers.get('origin'),
    referer: req.headers.get('referer'),
    secFetchSite: req.headers.get('sec-fetch-site'),
  });
  if (ok) return null;
  return NextResponse.json({ error: 'Cross-origin request refused.' }, { status: 403 });
}
