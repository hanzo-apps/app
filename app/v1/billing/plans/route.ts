/**
 * /v1/billing/plans — the live plan catalog, same-origin.
 *
 * The pricing page used to fetch `api.hanzo.ai/v1/billing/plans` straight from
 * the browser; the gateway sends no CORS grant for app origins, so the fetch
 * failed and every card showed "—". The catalog is public data — this proxies
 * it server-side (the same shape commerce charges from) with a short edge
 * cache, so a price the page shows is always one checkout would bill.
 */
import { NextResponse } from 'next/server';

const API_BASE = process.env.HANZO_API_BASE_URL || 'https://api.hanzo.ai';

export const revalidate = 300;

export async function GET() {
  const res = await fetch(`${API_BASE}/v1/billing/plans`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    return NextResponse.json(
      { message: `plan catalog unavailable (${res.status})` },
      { status: 502 },
    );
  }
  const body: unknown = await res.json();
  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
