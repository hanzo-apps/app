/**
 * Wallet / credit-balance client — the per-org cloud credit the gateway debits.
 *
 * MIRRORS console2's `src/lib/api/wallet.ts` shape: `cloudBalance()` reads the
 * REAL commerce balance (USD cents) for the CURRENT org through hanzo.app's own
 * same-origin `/v1/wallet` BFF (which forwards to the gateway `/v1/billing/balance`
 * as the signed-in user, scoped to their org). Identity is server-side; the
 * browser only sends its selected org (X-Org-Id) + its session cookie.
 */
import { currentOrg } from '@/lib/org-scope';

/** Money balance in USD cents (commerce shape). */
export interface CloudBalance {
  /** Total balance, cents. */
  balance?: number;
  /** Funds on hold, cents. */
  holds?: number;
  /** Spendable now, cents. */
  available?: number;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function orgHeader(): Record<string, string> {
  const org = currentOrg();
  return org ? { 'X-Org-Id': org } : {};
}

export const WalletApi = {
  /** The current org's cloud credit balance (USD cents). */
  cloudBalance: async (_user = '', currency = 'usd'): Promise<CloudBalance> => {
    const res = await fetch(`/v1/wallet?currency=${encodeURIComponent(currency)}`, {
      credentials: 'include',
      headers: { Accept: 'application/json', ...orgHeader() },
      cache: 'no-store',
    });
    if (!res.ok) {
      let msg = `balance failed (${res.status})`;
      try {
        const b = await res.json();
        msg = b?.error || msg;
      } catch {
        /* non-JSON */
      }
      throw new ApiError(res.status, msg);
    }
    return (await res.json()) as CloudBalance;
  },
};
