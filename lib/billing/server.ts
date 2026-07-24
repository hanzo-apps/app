/**
 * Server-side credit balance — the ONE place a route reads the caller's spendable
 * cents to gate a paid action. Forwards to the gateway `/v1/billing/balance` as
 * the signed-in user (their IAM bearer), the SAME real per-org ledger the
 * `/v1/wallet` BFF proxies and the gateway debits. Fail-closed: any non-2xx /
 * unreachable backend → null (the caller treats "unknown balance" as "no credits"
 * for a non-admin, never fabricates a balance).
 */
import 'server-only';

import { cloudBase } from '@/lib/org/server';

/** Spendable cents for the bearer's org (available, falling back to total); null on any failure. */
export async function spendableCents(token: string): Promise<number | null> {
  try {
    const res = await fetch(`${cloudBase()}/v1/billing/balance?currency=usd`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const b = (await res.json()) as { available?: number; balance?: number };
    if (typeof b.available === 'number') return b.available;
    if (typeof b.balance === 'number') return b.balance;
    return null;
  } catch {
    return null;
  }
}
