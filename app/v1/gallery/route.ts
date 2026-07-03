/**
 * /v1/gallery — the real template gallery catalog (the 72 site templates).
 *
 * Same-origin BFF so the browser never makes a cross-origin fetch to
 * gallery.hanzo.ai. Proxies the live gallery catalog (`gallery.hanzo.ai/
 * templates.json`) via `lib/gallery-catalog.getCatalog()` with a committed
 * build-time snapshot fallback (never empty). This is the CANONICAL builder
 * catalog surface — the gallery page, the /dev fork flow, the template-loader,
 * and the onboarding "popular picks" all read from here.
 *
 * One way: `/v1/gallery` (CTO law — same-origin `/v1/*`, never an `/api/`
 * prefix). Distinct from `/v1/templates`, which proxies the cloud's own project
 * templates (a different catalog).
 */
import { NextResponse } from 'next/server';
import { getCatalog } from '@/lib/gallery-catalog';

// Cache the catalog at the edge for an hour; keep serving a stale copy for a day
// while it revalidates so the gallery never blanks on a slow upstream.
export const revalidate = 3600;

export async function GET() {
  const catalog = await getCatalog();
  return NextResponse.json(catalog, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
