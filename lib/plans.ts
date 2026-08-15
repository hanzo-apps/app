/**
 * The plan catalog — commerce is the ONE authority for what a plan costs.
 *
 * `GET /v1/billing/plans` is public and is the same catalog
 * `POST /v1/billing/subscribe/card` charges from: that endpoint ignores any
 * client-supplied amount and bills the catalog price. So the price we DISPLAY
 * must come from here too, or we show one number and charge another — the
 * exact ambiguity a money path must refuse.
 *
 * Prices are in minor units (USD cents), matching commerce's typed money
 * columns. Nothing here is hardcoded: a hardcoded price is a second authority.
 */
'use client';

import { useEffect, useState } from 'react';


export interface Plan {
  slug: string;
  name: string;
  /** One-line pitch, straight from the catalog row. */
  description: string;
  /** Monthly price, USD cents. */
  price: number;
  /** Annual price per month, USD cents. 0 when not offered. */
  priceAnnual: number;
  category: string;
  /** Feature bullets, straight from the catalog row. */
  features: string[];
  /** Billed per seat — the headline price is per seat, not per org. */
  perSeat: boolean;
  /** Not self-serve: talk to sales. Never send these to checkout. */
  contactSales: boolean;
  /**
   * Every price this plan is sold at, USD cents, ascending, `prices[0] === price`.
   * Empty for a plan sold at a single price, which is most of them.
   *
   * Checkout names the INDEX into this list (`level`), never a price — commerce
   * holds the prices and refuses a level it did not publish. So a surface that
   * lets someone choose renders a control over this array and passes back where
   * it landed; it never sends an amount, and it never knows one that did not
   * come from here.
   */
  prices: number[];
}

interface RawPlan {
  slug?: string;
  name?: string;
  description?: string;
  price?: number;
  priceAnnual?: number;
  category?: string;
  features?: unknown;
  perSeat?: boolean;
  contactSales?: boolean;
  prices?: unknown;
}

function normalize(p: RawPlan): Plan | null {
  if (!p.slug) return null;
  return {
    slug: p.slug,
    name: p.name || p.slug,
    description: p.description || '',
    price: typeof p.price === 'number' ? p.price : 0,
    priceAnnual: typeof p.priceAnnual === 'number' ? p.priceAnnual : 0,
    category: p.category || '',
    features: Array.isArray(p.features) ? p.features.filter((f): f is string => typeof f === 'string') : [],
    perSeat: Boolean(p.perSeat),
    contactSales: Boolean(p.contactSales),
    prices: ladder(p),
  };
}

/**
 * The ladder, taken only when the whole of it is sound: every entry a finite
 * positive number, and the first one the plan's own price.
 *
 * A partly-read ladder is worse than none. The index into it is what checkout
 * sends, so a list this app filtered or reordered would point at a different
 * price than the one it drew — and the customer would be charged the server's
 * reading of an index taken from ours. Dropping the whole ladder falls back to
 * the single price, which is exactly what every plan without one does.
 */
function ladder(p: RawPlan): number[] {
  if (!Array.isArray(p.prices) || p.prices.length === 0) return [];
  const rows = p.prices as unknown[];
  if (!rows.every((n): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0)) return [];
  if (rows[0] !== p.price) return [];
  return rows as number[];
}

/** Fetch the live catalog. Throws on transport/HTTP failure — never guesses.
 *  Same-origin: the gateway grants no CORS to app origins, so the browser goes
 *  through this app's `/v1/billing/plans` proxy of the same catalog. */
export async function fetchPlans(): Promise<Map<string, Plan>> {
  const res = await fetch('/v1/billing/plans', {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`plan catalog unavailable (${res.status})`);
  const body: unknown = await res.json();
  const rows: RawPlan[] = Array.isArray(body)
    ? (body as RawPlan[])
    : ((body as { plans?: RawPlan[] })?.plans ?? []);

  const out = new Map<string, Plan>();
  for (const row of rows) {
    const plan = normalize(row);
    if (plan) out.set(plan.slug, plan);
  }
  return out;
}

export interface PlanCatalog {
  plans: Map<string, Plan>;
  loading: boolean;
  /** Set when the catalog could not be read. Callers must refuse to sell. */
  error: string | null;
}

/**
 * The live catalog, for any surface that shows or sells a plan. While it is
 * loading — or if it failed — callers must NOT fall back to a local price;
 * they show the plan as temporarily unavailable instead.
 */
export function usePlans(): PlanCatalog {
  const [plans, setPlans] = useState<Map<string, Plan>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPlans()
      .then((p) => {
        if (cancelled) return;
        setPlans(p);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'plan catalog unavailable');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { plans, loading, error };
}

/** Render cents as a whole-dollar string when even, else with cents. */
export function usd(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}
