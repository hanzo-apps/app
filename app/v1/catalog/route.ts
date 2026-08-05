/**
 * /v1/catalog — the community/build catalog, same-origin.
 *
 * The community page fetched `api.hanzo.ai/v1/catalog` straight from the
 * browser; the gateway sends no CORS grant for app origins, so on any origin
 * the gateway doesn't allow (localhost first among them) the fetch failed and
 * the page said "Couldn't load the community feed" about its own network. The
 * catalog is public data — proxy it server-side, the same pattern
 * /v1/billing/plans settled. The query string passes through untouched: the
 * upstream owns the axes, this route owns only the origin.
 */
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.HANZO_API_BASE_URL || 'https://api.hanzo.ai';

export const revalidate = 60;

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.search;
  const res = await fetch(`${API_BASE}/v1/catalog${qs}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    return NextResponse.json(
      { message: `catalog unavailable (${res.status})` },
      { status: 502 },
    );
  }
  const body: unknown = await res.json();
  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
    },
  });
}
