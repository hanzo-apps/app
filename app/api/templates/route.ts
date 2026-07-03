import { NextResponse } from 'next/server';
import { getCatalog } from '@/lib/gallery-catalog';

// Same-origin catalog endpoint for the client (avoids cross-origin fetch to
// gallery.hanzo.ai). Proxies the live gallery catalog with a build-time snapshot
// fallback. Cached at the edge for an hour.
export const revalidate = 3600;

export async function GET() {
  const catalog = await getCatalog();
  return NextResponse.json(catalog, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
