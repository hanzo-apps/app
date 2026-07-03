/**
 * /v1/templates[/...] — same-origin BFF for the READ-ONLY Hanzo starter-kit
 * gallery (the real hanzoai/gallery catalog, ~69 templates).
 *
 * Unlike /v1/projects, this surface is PUBLIC reference content — there is no
 * tenant, no per-user data, and the cloud endpoint takes no bearer. So we do NOT
 * attach identity or scope: we just forward the GET to `<cloud>/v1/templates`
 * verbatim and stream the response back. Keeping the browser on a same-origin
 * path (rather than calling api.hanzo.ai directly) avoids CORS and lets a
 * standalone/in-cluster deploy retarget the cloud with CLOUD_API_URL.
 *
 * Surface (proxied verbatim to cloud, see cloud clients/templates):
 *   GET /v1/templates          list the catalog     -> { data: [Template] }
 *   GET /v1/templates/:slug    one template by slug  -> Template (404 if absent)
 *
 * Security: GET only (read-only), and the appended subpath is traversal-guarded
 * so a caller can NEVER escape the `/v1/templates` prefix to reach another cloud
 * surface. A malformed percent-escape is rejected 400, never a 500.
 */
import { type NextRequest, NextResponse } from 'next/server';

import { cloudBase } from '@/lib/org/server';

export const runtime = 'nodejs';

interface Ctx {
  params: Promise<{ path?: string[] }>;
}

/** Reject any traversal/escape so the forward stays under /v1/templates. */
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

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  const base = cleanSubpath(path);
  if (base === null) {
    return NextResponse.json({ error: 'invalid path' }, { status: 400 });
  }
  const qs = req.nextUrl.search || '';
  const url = `${cloudBase()}/v1/templates${base}${qs}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      // Reference content changes rarely — let the platform cache it briefly
      // rather than hammer the cloud on every browse.
      next: { revalidate: 300 },
    });
    const buf = await res.arrayBuffer();
    return new Response(buf, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
      },
    });
  } catch {
    return NextResponse.json({ error: 'templates backend unreachable' }, { status: 502 });
  }
}
