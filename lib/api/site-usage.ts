/**
 * Site usage & billing client — what per-project settings can state TRUTHFULLY
 * about money and consumption.
 *
 * Reads the same-origin BFFs that already exist (`/v1/usage`,
 * `/v1/commerce/subscription`). The live credit balance is NOT here — it has
 * ONE home, `useCloudBalance` (lib/billing/live-balance), shared with the
 * sidebar wallet and /billing so every surface shows the same number.
 *
 * Per-site attribution does not exist yet: the platform meters per-app
 * consumption internally but exposes no user-facing per-project query (see
 * lib/usage.ts — `metered:false` until it ships). This client returns the
 * account-level truth and the section says so; no invented per-site figures.
 */
import type { AccountUsage } from '@/lib/usage';

export interface Plan {
  name: string;
  status: string;
  /** ISO date the current period renews — or, when `cancelAtPeriodEnd`, ends. */
  renewsAt?: string;
  cancelAtPeriodEnd: boolean;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

/** Account usage — honest shape: `metered:false` + note until metering ships. */
export async function fetchUsage(): Promise<AccountUsage> {
  const data = await get<{ usage?: AccountUsage }>('/v1/usage');
  if (!data?.usage) throw new Error('malformed usage response');
  return data.usage;
}

/**
 * The org's subscription. `null` means none — pay as you go, a real state and
 * not an error (the commerce BFF returns `{subscription:null}` for it).
 */
export async function fetchPlan(): Promise<Plan | null> {
  const data = await get<{
    subscription?: {
      plan?: string;
      priceId?: string;
      status?: string;
      currentPeriodEnd?: string;
      cancelAtPeriodEnd?: boolean;
    } | null;
  }>('/v1/commerce/subscription');
  const s = data?.subscription;
  if (!s) return null;
  return {
    name: s.plan || s.priceId || 'Subscription',
    status: s.status || 'active',
    renewsAt: s.currentPeriodEnd,
    cancelAtPeriodEnd: !!s.cancelAtPeriodEnd,
  };
}
