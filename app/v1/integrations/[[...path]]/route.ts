/**
 * /v1/integrations[/...] — the org-scoped Connectors BFF.
 *
 * A THIN same-origin proxy to the ONE shared connector store on cloud
 * (`/v1/integrations`) — the IDENTICAL endpoint console.hanzo.ai reads, so a
 * connector an org creates in either surface is the same record (one way, one
 * store per org). We forward the signed-in user's IAM bearer; the cloud gateway
 * derives the tenant from its `owner` claim, so every list/connect/disconnect is
 * org-scoped WITHOUT the browser choosing its own tenant (least privilege).
 *
 * Surface (proxied verbatim to cloud `/v1/integrations`):
 *   GET  /v1/integrations                 list (org)  → { providers: [...] }
 *   GET  /v1/integrations/:id             get one
 *   POST /v1/integrations/:id/connect     → { authorizeUrl }
 *   POST /v1/integrations/:id/disconnect
 *
 * Mirrors the /v1/projects trust boundary (resolveScope + bearer forward, admin
 * X-Org-Id only for a validated global admin). The subpath is traversal-guarded
 * so a caller can never escape the `/v1/integrations` prefix.
 */
import { type NextRequest, NextResponse } from 'next/server';

import { resolveScope, cloudBase } from '@/lib/org/server';
import { requireSameOrigin } from '@/lib/org/csrf';

export const runtime = 'nodejs';

interface Ctx {
  params: Promise<{ path?: string[] }>;
}

/** Reject any traversal/escape so the forward stays under /v1/integrations. */
function cleanSubpath(segments: string[] | undefined): string | null {
  if (!segments || segments.length === 0) return '';
  for (const s of segments) {
    if (!s) continue;
    let decoded: string;
    try {
      decoded = decodeURIComponent(s);
    } catch {
      return null;
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

async function subpathOf(req: NextRequest, ctx: Ctx): Promise<string | null> {
  const { path } = await ctx.params;
  const base = cleanSubpath(path);
  if (base === null) return null;
  const qs = req.nextUrl.search || '';
  return base + qs;
}

async function forward(
  req: NextRequest,
  sub: string,
  init: { method: string; body?: BodyInit | null; contentType?: string },
): Promise<Response> {
  const scope = await resolveScope(req);
  if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${scope.token}`,
    Accept: 'application/json',
  };
  if (init.contentType) headers['Content-Type'] = init.contentType;
  if (scope.crossOrg) headers['X-Org-Id'] = scope.org;

  try {
    const res = await fetch(`${cloudBase()}/v1/integrations${sub}`, {
      method: init.method,
      headers,
      body: init.body ?? undefined,
      cache: 'no-store',
    });
    const buf = await res.arrayBuffer();
    return new Response(buf, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
    });
  } catch {
    return NextResponse.json({ error: 'connectors backend unreachable' }, { status: 502 });
  }
}

async function proxy(req: NextRequest, ctx: Ctx, method: string, withBody: boolean) {
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
  return forward(req, sub, { method, body, contentType });
}

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx, 'GET', false);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx, 'POST', true);
}
