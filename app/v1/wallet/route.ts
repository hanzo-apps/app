/**
 * /v1/wallet — the per-org cloud credit balance BFF.
 *
 * Forwards to the gateway `/v1/billing/balance` as the signed-in user (their IAM
 * bearer), so the balance is the REAL per-org credit the gateway debits — scoped
 * to the caller's org (owner claim; a global admin may target another via
 * X-Org-Id). Honest states: 401/403 → the caller's auth surfaces it; 404/501 →
 * "not available" (billing not routed / unconfigured on this deployment). Never
 * fabricates a balance.
 */
import { type NextRequest, NextResponse } from 'next/server';

import { cloudBase, resolveScope } from '@/lib/org/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const scope = await resolveScope(req);
  if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currency = req.nextUrl.searchParams.get('currency') || 'usd';
  const headers: Record<string, string> = {
    Authorization: `Bearer ${scope.token}`,
    Accept: 'application/json',
  };
  // Stamp X-Org-Id ONLY for a validated global admin acting cross-org.
  if (scope.crossOrg) headers['X-Org-Id'] = scope.org;

  try {
    const res = await fetch(
      `${cloudBase()}/v1/billing/balance?currency=${encodeURIComponent(currency)}`,
      { headers, cache: 'no-store' },
    );
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
    });
  } catch {
    return NextResponse.json({ error: 'billing backend unreachable' }, { status: 502 });
  }
}
