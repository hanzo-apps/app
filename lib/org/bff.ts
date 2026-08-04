/**
 * The ONE org-scoped BFF forwarder.
 *
 * Every `app/v1/<surface>/[[...path]]/route.ts` needs the same four things: a
 * traversal guard so a caller cannot escape its prefix to reach another cloud
 * surface, a CSRF check before any identity work, the user's IAM bearer plus the
 * admin cross-org stamp, and a verbatim pass-through of status/body/content-type.
 * That was copied per route, which meant a fix to the guard had to be found in
 * three places and would be missed in the fourth.
 *
 * Callers declare only what actually differs — the cloud prefix and which verbs
 * exist — and get handlers back:
 *
 *   const h = bffRoutes({ prefix: '/v1/skills' })
 *   export const GET = h.GET
 *   export const POST = h.POST
 */
import { type NextRequest, NextResponse } from 'next/server';

import { cloudBase, resolveScope } from '@/lib/org/server';
import { requireSameOrigin } from '@/lib/org/csrf';

export interface BffCtx {
  params: Promise<{ path?: string[] }>;
}

/**
 * Reject any traversal/escape so the forward stays under the declared prefix. A
 * malformed percent-escape (decodeURIComponent throws) is treated as hostile →
 * rejected as invalid, never surfaced as a 500.
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

function jsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export interface BffOptions {
  /** Canonical cloud prefix, e.g. '/v1/skills'. */
  prefix: string;
  /**
   * Extra prefixes tried when the canonical one 404s — for a mid-rename cloud
   * where the surface has not moved yet. A 404 on the LAST prefix is
   * authoritative and returned as-is.
   */
  fallbacks?: readonly string[];
}

/**
 * Forward one request to the org-scoped cloud surface as the user.
 *
 * Attaches the user's IAM bearer (the gateway derives the tenant from its owner
 * claim — the authoritative org scope). For a global admin that has switched
 * scope, also stamps X-Org-Id; cloud honors it only for admin-org members, so
 * stamping is always safe.
 */
async function forward(
  req: NextRequest,
  opts: BffOptions,
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

  const prefixes = [opts.prefix, ...(opts.fallbacks ?? [])];
  let lastRes: Response | null = null;
  for (let i = 0; i < prefixes.length; i++) {
    try {
      const res = await fetch(`${cloudBase()}${prefixes[i]}${subpath}`, {
        method: init.method,
        headers,
        body: init.body ?? undefined,
        cache: 'no-store',
        redirect: 'manual',
      });
      // A 404 on a non-final prefix means cloud may still be on the next one.
      // Every other status is authoritative.
      if (res.status === 404 && i < prefixes.length - 1) {
        lastRes = res;
        continue;
      }
      const location = res.headers.get('location');
      const outHeaders: Record<string, string> = {
        'Content-Type': res.headers.get('content-type') || 'application/json',
      };
      if (location) outHeaders['Location'] = location;
      return new Response(await res.arrayBuffer(), { status: res.status, headers: outHeaders });
    } catch {
      lastRes = null; // network error on this prefix — try the next
    }
  }
  if (lastRes) {
    return new Response(await lastRes.arrayBuffer(), {
      status: lastRes.status,
      headers: { 'Content-Type': lastRes.headers.get('content-type') || 'application/json' },
    });
  }
  return jsonError(`${opts.prefix} backend unreachable`, 502);
}

async function proxy(
  req: NextRequest,
  ctx: BffCtx,
  opts: BffOptions,
  method: string,
  withBody: boolean,
): Promise<Response> {
  // CSRF first: a cross-origin mutating request is refused BEFORE any identity
  // or forward work. A GET is a no-op here.
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const { path } = await ctx.params;
  const base = cleanSubpath(path);
  if (base === null) return NextResponse.json({ error: 'invalid path' }, { status: 400 });
  const subpath = base + (req.nextUrl.search || '');

  let body: BodyInit | null = null;
  let contentType: string | undefined;
  if (withBody) {
    contentType = req.headers.get('content-type') || undefined;
    const buf = await req.arrayBuffer();
    body = buf.byteLength ? buf : null;
  }
  return forward(req, opts, subpath, { method, body, contentType });
}

/** Handlers for every verb. A route re-exports only the ones its surface has —
 *  exporting a verb cloud does not serve would answer 404/405 from cloud, which
 *  is honest but noisier than simply not offering it. */
export function bffRoutes(opts: BffOptions) {
  return {
    GET: (req: NextRequest, ctx: BffCtx) => proxy(req, ctx, opts, 'GET', false),
    POST: (req: NextRequest, ctx: BffCtx) => proxy(req, ctx, opts, 'POST', true),
    PUT: (req: NextRequest, ctx: BffCtx) => proxy(req, ctx, opts, 'PUT', true),
    PATCH: (req: NextRequest, ctx: BffCtx) => proxy(req, ctx, opts, 'PATCH', true),
    DELETE: (req: NextRequest, ctx: BffCtx) => proxy(req, ctx, opts, 'DELETE', false),
  };
}
