/**
 * Server-side credit balance — the ONE place a route reads the caller's spendable
 * cents to gate a paid action. Forwards to the gateway `/v1/billing/balance` as
 * the signed-in user (their IAM bearer), the SAME real per-org ledger the
 * `/v1/wallet` BFF proxies and the gateway debits.
 *
 * IT RETURNS A REASON, NOT JUST A NUMBER. This used to answer `number | null` and
 * collapse EVERY failure into `null` — a 401, a 403, an unreachable backend and a
 * genuine $0 were one indistinguishable value, and callers rendered all four as
 * "$0.00 / add credits". So a funded customer whose session had merely gone stale
 * was told they were out of money: an answer that is both WRONG and BLAMES THEM,
 * while the real fault (their token) went unlogged and therefore unfixed.
 *
 * "Cannot read the balance" and "the balance is zero" are different facts, so they
 * are different values here and a caller must handle them apart. Fail-closed is
 * preserved — {@link funded} still refuses anything that is not a known positive
 * balance — but the REASON now survives to the UI and to the log.
 */
import 'server-only';

import { cloudBase } from '@/lib/org/server';

/**
 * The answer to "what can this caller spend?".
 *
 *   - `ok`          — the ledger answered; `cents` is real (0 IS a real answer).
 *   - `noauth`      — 401/403: the caller's SESSION failed, so their money is
 *                     unknown. Never render as $0.00 — the remedy is signing in,
 *                     not paying.
 *   - `unavailable` — anything else (5xx, 404/501 unrouted, network, or a 200
 *                     carrying no amount): unknown, and the remedy is OURS.
 */
export type Spendable =
  | { state: 'ok'; cents: number }
  | { state: 'noauth'; status: number }
  | { state: 'unavailable'; status: number };

/** Spendable cents when KNOWN, else null — for display, which must show "—", not "$0". */
export function knownCents(s: Spendable): number | null {
  return s.state === 'ok' ? s.cents : null;
}

/** May this caller be charged? Only a KNOWN positive balance qualifies (fail-closed). */
export function funded(s: Spendable): boolean {
  return s.state === 'ok' && s.cents > 0;
}

/** Read the bearer's spendable balance from the real per-org ledger. */
export async function spendable(token: string): Promise<Spendable> {
  let res: Response;
  try {
    res = await fetch(`${cloudBase()}/v1/billing/balance?currency=usd`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch (e) {
    console.error('[billing] balance unreachable', e);
    return { state: 'unavailable', status: 0 };
  }

  if (res.status === 401 || res.status === 403) {
    // The gateway refused the IDENTITY, not the payment. Logged WITH the status so a
    // broken token/org binding is visible to us, instead of being silently rendered
    // as a customer who has no money.
    console.error('[billing] balance refused the caller', { status: res.status });
    return { state: 'noauth', status: res.status };
  }
  if (!res.ok) {
    console.error('[billing] balance read failed', { status: res.status });
    return { state: 'unavailable', status: res.status };
  }

  const b = (await res.json().catch(() => null)) as
    | { available?: number; balance?: number }
    | null;
  const cents =
    typeof b?.available === 'number' ? b.available
    : typeof b?.balance === 'number' ? b.balance
    : null;
  if (cents === null) {
    // A 200 whose body carries no amount is NOT a zero balance. The live gateway
    // answers some refusals with a non-balance body, which is exactly how a failure
    // used to be laundered into "$0.00".
    console.error('[billing] balance response carried no amount', { status: res.status });
    return { state: 'unavailable', status: res.status };
  }
  return { state: 'ok', cents };
}
