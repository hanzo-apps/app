/**
 * The signed-in caller's PLAN — ONE reactive source, shared by every surface that
 * offers an upgrade, so no two of them can disagree about what the customer has
 * already bought.
 *
 * Reads the same-origin `/v1/entitlements` BFF (→ gateway `/v1/entitlements`),
 * which answers `{ tier, apps }`: `tier` is the org's resolved subscription slug
 * and `""` means commerce named no plan.
 *
 * Three phases, and `unknown` is a real one: a request that never answered is
 * not evidence of a free account. An upgrade CTA renders on `ready` + no tier
 * and on nothing else — the failure mode this replaces was a static "Upgrade to
 * Pro" that never asked anyone anything.
 *
 * One in-flight request is de-duplicated and the answer is shared, so N mounts
 * cost one round-trip.
 */
'use client';

import { useEffect, useState } from 'react';

export type PlanPhase = 'loading' | 'ready' | 'unknown';

export interface Plan {
  phase: PlanPhase;
  /** Subscription slug; '' when commerce named no plan. Only meaningful on `ready`. */
  tier: string;
  /** Product → entitled. Only meaningful on `ready`. */
  apps: Record<string, boolean>;
}

const LOADING: Plan = { phase: 'loading', tier: '', apps: {} };

let plan: Plan = LOADING;
let inflight: Promise<void> | null = null;
const listeners = new Set<(p: Plan) => void>();

function set(next: Plan): void {
  plan = next;
  for (const l of listeners) l(next);
}

function load(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch('/v1/entitlements', {
        credentials: 'include',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) return set({ phase: 'unknown', tier: '', apps: {} });
      const b = (await res.json()) as { tier?: unknown; apps?: unknown };
      set({
        phase: 'ready',
        tier: typeof b.tier === 'string' ? b.tier : '',
        apps: (b.apps ?? {}) as Record<string, boolean>,
      });
    } catch {
      set({ phase: 'unknown', tier: '', apps: {} });
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** The shared plan. Every consumer sees the SAME answer. */
export function usePlan(): Plan {
  const [snapshot, setSnapshot] = useState(plan);
  useEffect(() => {
    listeners.add(setSnapshot);
    setSnapshot(plan);
    void load();
    return () => {
      listeners.delete(setSnapshot);
    };
  }, []);
  return snapshot;
}

/** True only when we KNOW the caller pays for nothing. Unknown never offers. */
export function unpaid(p: Plan): boolean {
  return p.phase === 'ready' && p.tier === '';
}
