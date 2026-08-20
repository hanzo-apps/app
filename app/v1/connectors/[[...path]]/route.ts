/**
 * /v1/connectors[/...] — the ONE canonical, org-scoped connectors BFF.
 *
 * "Connectors" is the canonical product AND endpoint name. This is the single
 * shared, org-scoped connector store: the SAME rows are read/written by hanzo.app
 * (`/connectors`) and console.hanzo.ai — there is no second copy. This route
 * forwards to the cloud connectors surface as the signed-in user (their IAM
 * bearer); the cloud gateway derives the tenant from the bearer `owner` claim (it
 * re-mints X-Org-Id from the verified token and strips any client-supplied one),
 * so every connect/disconnect is org-scoped WITHOUT the browser ever choosing its
 * own tenant (least privilege). Identical trust model to the /v1/projects BFF.
 *
 * ONE name, end to end: this route, cloud's endpoint, cloud's package and the KMS
 * namespace a token is sealed under all say `connectors`. There is no
 * `/v1/integrations` anywhere in the path any more — see CLOUD_PREFIX below for
 * why the fallback that used to be here was never doing what it claimed.
 *
 * Surface (proxied verbatim to cloud `/v1/connectors`):
 *   GET  /v1/connectors                       list catalog + org status
 *                                             -> { providers: [providerView] }
 *   GET  /v1/connectors/:provider             one provider -> providerView
 *   POST /v1/connectors/:provider/connect     begin connect -> { authorizeUrl }
 *                                             (or apikey body { token, accountId })
 *   POST /v1/connectors/:provider/disconnect  -> { disconnected: true }
 *   POST /v1/connectors/:provider/verify      re-check apikey connection
 *   GET  /v1/connectors/github/repos          repos for the connected GitHub
 *   POST /v1/connectors/github/repos/import   import repos
 *
 * NOTE: the OAuth `:provider/callback` is PUBLIC + state-authed and the provider
 * redirects to it DIRECTLY at api.hanzo.ai (never through this BFF) — this route
 * is only the browser-initiated list/connect/disconnect leg.
 *
 * Security: the appended subpath is traversal-guarded so a caller can NEVER escape
 * the `/v1/connectors` prefix to reach another cloud surface (e.g. /v1/iam), and
 * mutating verbs are same-origin (CSRF) guarded before any identity work.
 */
import { type NextRequest, NextResponse } from 'next/server';

import { cloudBase, resolveScope } from '@/lib/org/server';
import { requireSameOrigin } from '@/lib/org/csrf';

export const runtime = 'nodejs';

interface Ctx {
  params: Promise<{ path?: string[] }>;
}

/** Reject any traversal/escape so the forward stays under /v1/connectors. A
 *  malformed percent-escape (decodeURIComponent throws) is treated as hostile
 *  → rejected as invalid (400), never a 500. (Same guard as the /v1/projects
 *  and /v1/templates routes — the established per-route convention.) */
function cleanSubpath(segments: string[] | undefined): string | null {
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

/** Build the forward subpath (guarded) + preserve the original query string. */
async function subpathOf(req: NextRequest, ctx: Ctx): Promise<string | null> {
  const { path } = await ctx.params;
  const base = cleanSubpath(path);
  if (base === null) return null;
  const qs = req.nextUrl.search || '';
  return base + qs;
}

/** The cloud prefix. ONE name, end to end: cloud's package, its endpoint, its KMS
 *  namespace and this app's route all say `connectors`.
 *
 *  This was a LIST — the canonical prefix and a legacy `/v1/integrations` alias,
 *  tried in order — written to stay green while cloud "completed the same rename
 *  in parallel". Cloud had not started it: main carried neither prefix, so both
 *  legs 404'd and the fallback only doubled the latency of failing. Cloud serves
 *  /v1/connectors now, so the second name is gone rather than left as a thing to
 *  keep working. */
const CLOUD_PREFIX = '/v1/connectors';

/**
 * Forward to the org-scoped cloud connectors surface as the user.
 *
 * Attaches the user's IAM bearer (the gateway derives the tenant from its owner
 * claim — the authoritative org scope). For a GLOBAL ADMIN that has switched
 * scope, also stamps `X-Org-Id` (cloud honors it only for admin-org members; for
 * anyone else it is ignored, so stamping is always safe). Mirrors
 * `forwardProjects` — the same shared identity/scope primitives.
 */
async function forwardConnectors(
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
  if (scope.crossOrg) headers['X-Org-Id'] = scope.org;

  try {
    const res = await fetch(`${cloudBase()}${CLOUD_PREFIX}${subpath}`, {
      method: init.method,
      headers,
      body: init.body ?? undefined,
      cache: 'no-store',
      redirect: 'manual',
    });
    // Every status is authoritative now, 404 included: with one prefix a 404
    // means the connector does not exist, which is an answer the reader needs
    // rather than a reason to ask somewhere else.
    const location = res.headers.get('location');
    const outHeaders: Record<string, string> = {
      'Content-Type': res.headers.get('content-type') || 'application/json',
    };
    if (location) outHeaders['Location'] = location;
    const buf = await res.arrayBuffer();
    return new Response(buf, { status: res.status, headers: outHeaders });
  } catch {
    return jsonError('connectors backend unreachable', 502);
  }
}

async function proxy(req: NextRequest, ctx: Ctx, method: string, withBody: boolean) {
  // CSRF: a cross-origin mutating request (POST) is refused BEFORE any
  // identity/forward work. GET is a no-op here.
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const sub = await subpathOf(req, ctx);
  if (sub === null) return NextResponse.json({ error: 'invalid path' }, { status: 400 });

  let body: BodyInit | null = null;
  let contentType: string | undefined;
  if (withBody) {
    contentType = req.headers.get('content-type') || undefined;
    const buf = await req.arrayBuffer();
    body = buf.byteLength ? buf : null;
  }

  return forwardConnectors(req, sub, { method, body, contentType });
}

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx, 'GET', false);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx, 'POST', true);
}

function jsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
