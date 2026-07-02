/**
 * /v1/templates[/:slug] — the read-only starter-kit gallery BFF.
 *
 * Forwards to the cloud `/v1/templates` surface (clients/templates), which serves
 * the 69-strong hanzoai/gallery catalog embedded in the unified `cloud` binary —
 * the SAME catalog console.hanzo.ai consumes. This is PUBLIC, read-only REFERENCE
 * content (no org data, no per-tenant storage), so — unlike the projects BFF — no
 * bearer/org is required or attached; the same-origin route only exists to avoid a
 * cross-origin fetch (CORS) from the browser and to keep the gateway host in
 * server config, not the client bundle.
 *
 * Surface (proxied verbatim to cloud `/v1/templates`):
 *   GET /v1/templates          list the starter-kit catalog  -> {data:[Template]}
 *   GET /v1/templates/:slug    one template by slug (404)     -> Template
 *
 * Security: the appended subpath is traversal-guarded (mirrors the projects BFF)
 * so a caller can never escape the `/v1/templates` prefix to reach another cloud
 * surface. Only GET is exposed — the catalog is immutable reference content.
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
    const lower = decodeURIComponent(s).toLowerCase();
    if (
      lower === '..' ||
      lower.includes('/') ||
      lower.includes('\\') ||
      lower.includes('%2e') ||
      lower.includes('%2f')
    ) {
      return null;
    }
  }
  return '/' + segments.map((s) => encodeURIComponent(s)).join('/');
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  const sub = cleanSubpath(path);
  if (sub === null) return NextResponse.json({ error: 'invalid path' }, { status: 400 });

  const url = `${cloudBase()}/v1/templates${sub}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    const buf = await res.arrayBuffer();
    return new Response(buf, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
    });
  } catch {
    return NextResponse.json({ error: 'templates backend unreachable' }, { status: 502 });
  }
}
