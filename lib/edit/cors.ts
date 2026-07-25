/**
 * CORS for the Hanzo Edit widget routes (`/v1/me`, `/v1/suggest`, `/v1/edit`).
 *
 * The widget is a drop-in served from hanzo.app but RUNS on every Hanzo app's
 * origin, so these three routes are cross-origin BY DESIGN (unlike the builder's
 * same-origin BFFs, which are CSRF-gated). We therefore:
 *   - reflect the request Origin ONLY when it belongs to the Hanzo family
 *     (so the first-party `hanzo_token` cookie may ride a same-site request and
 *     no unrelated site can read a credentialed response), and
 *   - always allow an `Authorization` bearer, which is how a DIFFERENT-site Hanzo
 *     app authenticates (a SameSite=Lax cookie does not ride a cross-site fetch),
 *
 * The real security boundary is IAM validation + the credits/admin gate in the
 * route — CORS only controls which browsers may READ the response. A non-Hanzo
 * origin gets no `Access-Control-Allow-Origin` (browser blocks the read) but may
 * still call with an explicit bearer.
 *
 * PURE. Extend the allowlist for a new brand via `EDIT_ALLOWED_ORIGIN_SUFFIXES`
 * (comma-separated host suffixes) — no code change.
 *
 * ⚠ TENANT NAMESPACES ARE NOT US. `<slug>.hanzo.app` is the ONE serve for
 * user-published sites, so a subdomain there is ATTACKER-AUTHORED content, not a
 * Hanzo origin. Suffix-matching `hanzo.app` handed every published tenant site a
 * credentialed, readable channel to `/v1/edit` on the visitor's first-party
 * cookie — i.e. any site a superadmin visited could act as them. The apex is us;
 * its subdomains are not. That distinction is enforced FIRST, below.
 */

/**
 * Namespaces that serve USER-PUBLISHED content. A subdomain of one of these is
 * never a Hanzo origin, no matter what else matches. Checked before everything.
 */
const TENANT_SUFFIXES = ['hanzo.app'];

/** Host suffixes trusted to send the first-party cookie credentialed. */
const DEFAULT_SUFFIXES = [
  'hanzo.ai',
  'hanzo.app',
  'hanzo.id',
  'hanzo.bot',
  'hanzo.network',
  'hanzo.computer',
  'lux.network',
  'zoo.ngo',
  'zoo.network',
  'pars.network',
];

/** Dev-only origins — never credentialed in production. */
const DEV_SUFFIXES = ['localhost'];

function allowedSuffixes(): string[] {
  const extra = (process.env.EDIT_ALLOWED_ORIGIN_SUFFIXES || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const dev = process.env.NODE_ENV === 'production' ? [] : DEV_SUFFIXES;
  return [...DEFAULT_SUFFIXES, ...dev, ...extra];
}

/** True when the host is a SUBDOMAIN of a tenant-serving namespace (the apex
 *  itself is ours; `<slug>.hanzo.app` is somebody's published site). */
export function isTenantOrigin(host: string): boolean {
  return TENANT_SUFFIXES.some((s) => host !== s && host.endsWith('.' + s));
}

/** Is `origin` a Hanzo-family origin (exact apex or a subdomain)? */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  let host: string;
  try {
    host = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }
  // Tenant content first, and it is absolute: a published site can never be
  // credentialed, even if a brand suffix would otherwise match it.
  if (isTenantOrigin(host)) return false;
  return allowedSuffixes().some((s) => host === s || host.endsWith('.' + s));
}

/**
 * CORS headers for a widget-route response. Reflects an allowlisted Origin with
 * credentials; otherwise emits no allow-origin (a bearer-only caller still works,
 * it just can't use the cookie). `Vary: Origin` keeps caches honest.
 */
export function corsHeaders(origin: string | null): Record<string, string> {
  const h: Record<string, string> = {
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '600',
  };
  if (isAllowedOrigin(origin)) {
    h['Access-Control-Allow-Origin'] = origin as string;
    h['Access-Control-Allow-Credentials'] = 'true';
  }
  return h;
}

/** Preflight responder — 204 with the CORS headers. */
export function preflight(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

/** Attach CORS headers to an existing JSON body → a Response. */
export function withCors(origin: string | null, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}
