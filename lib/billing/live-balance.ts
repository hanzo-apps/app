/**
 * Live cloud-credit balance — ONE reactive source shared by every surface that
 * shows the customer's money (the sidebar wallet, and any future Wallet/Cost
 * page), so the number is the SAME everywhere and tracks the real per-org
 * commerce ledger the gateway debits.
 *
 * MIRRORED FROM console2's `src/lib/billing/live-balance.ts` (identical liveness
 * behavior): refetch on mount, on window focus/visibility, on a 30s poll while a
 * consumer is mounted + the tab is visible, and immediately after a balance-
 * affecting action. One in-flight request is de-duplicated.
 */
import { useEffect, useSyncExternalStore } from 'react';

import { ApiError, WalletApi, type CloudBalance } from '@/lib/api/wallet';

export type BalancePhase = 'idle' | 'loading' | 'ready' | 'noauth' | 'unconfigured' | 'error';

export interface BalanceSnapshot {
  phase: BalancePhase;
  balance: CloudBalance | null;
  error?: string;
  updatedAt: number;
}

const POLL_MS = 30_000;
const FRESH_MS = 4_000;
// Backoff bounds for the non-terminal failure phases (error / noauth /
// unconfigured). Without this, every consumer mount + the 30s poll + focus/
// visibility wakes re-fire at full cadence forever, so a signed-out session or a
// 5xx backend produces a steady 401/500 storm. On failure we cool down with
// exponential backoff (doubling from 5s, capped at 5min); a SUCCESS resets it.
const BACKOFF_MIN_MS = 5_000;
const BACKOFF_MAX_MS = 300_000;

let snapshot: BalanceSnapshot = { phase: 'idle', balance: null, updatedAt: 0 };
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;
let poller: ReturnType<typeof setInterval> | null = null;
let windowBound = false;
// Current backoff window (ms) and the earliest wall-clock time a retry is
// allowed. `0` means no cooldown (ready/idle/loading). Shared module state so
// every consumer + the poll + the focus/visibility wakes honor the SAME gate.
let backoffMs = 0;
let retryAfter = 0;

/** A phase that should not be hammered — retries are gated behind backoff. */
function isFailurePhase(p: BalancePhase): boolean {
  return p === 'error' || p === 'noauth' || p === 'unconfigured';
}

/** Grow the cooldown after a failure (exponential, capped). */
function noteFailure(): void {
  backoffMs = backoffMs === 0 ? BACKOFF_MIN_MS : Math.min(backoffMs * 2, BACKOFF_MAX_MS);
  retryAfter = Date.now() + backoffMs;
}

/** Clear the cooldown after a success (or an explicit auth-change reset). */
function clearBackoff(): void {
  backoffMs = 0;
  retryAfter = 0;
}

/** True while a failure cooldown is still in effect. */
function coolingDown(): boolean {
  return retryAfter > 0 && Date.now() < retryAfter;
}

function emit(): void {
  for (const l of listeners) l();
}

function set(next: Partial<BalanceSnapshot>): void {
  snapshot = { ...snapshot, ...next };
  emit();
}

export function getBalanceSnapshot(): BalanceSnapshot {
  return snapshot;
}

/** Spendable cents from a balance (available, falling back to total). */
export function spendableCents(b: CloudBalance | null): number | null {
  if (!b) return null;
  if (typeof b.available === 'number') return b.available;
  if (typeof b.balance === 'number') return b.balance;
  return null;
}

/**
 * Refresh the shared balance.
 * - `force` bypasses the 4s freshness window (used by the poll + focus wakes).
 * - `reset` clears any failure cooldown and retries immediately — the explicit
 *   user/auth-change entry point (login, a manual refresh, or a balance-
 *   affecting action). Every OTHER caller (mount, poll, focus/visibility) is
 *   gated behind the exponential backoff so a signed-out session or a 5xx
 *   backend yields a single request then a widening cooldown, not a storm.
 */
export function refreshBalance(opts: { force?: boolean; reset?: boolean } = {}): Promise<void> {
  if (inflight) return inflight;
  if (opts.reset) clearBackoff();
  if (!opts.reset && coolingDown()) return Promise.resolve();
  if (!opts.force && snapshot.phase === 'ready' && Date.now() - snapshot.updatedAt < FRESH_MS) {
    return Promise.resolve();
  }
  if (snapshot.phase === 'idle') set({ phase: 'loading' });
  inflight = (async () => {
    try {
      const value = await WalletApi.cloudBalance('');
      clearBackoff();
      set({ phase: 'ready', balance: value, error: undefined, updatedAt: Date.now() });
    } catch (e) {
      const code = e instanceof ApiError ? e.status : 0;
      noteFailure();
      if (code === 401 || code === 403) {
        set({ phase: 'noauth', balance: null, error: undefined, updatedAt: Date.now() });
      } else if (code === 404 || code === 501) {
        set({ phase: 'unconfigured', balance: null, error: undefined, updatedAt: Date.now() });
      } else {
        set({ phase: 'error', error: e instanceof Error ? e.message : 'Failed to load balance', updatedAt: Date.now() });
      }
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Explicit refresh: clears the failure cooldown and retries now. Use after a
 *  balance-affecting action or an auth change (login) so a signed-in user is
 *  never stuck in a stale noauth cooldown. */
export function invalidateBalance(): void {
  void refreshBalance({ force: true, reset: true });
}

function onWake(): void {
  if (typeof document !== 'undefined' && document.hidden) return;
  if (listeners.size === 0) return;
  void refreshBalance({ force: true });
}

function bindWindow(): void {
  if (windowBound || typeof window === 'undefined') return;
  windowBound = true;
  window.addEventListener('focus', onWake);
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onWake);
}

function startPoll(): void {
  if (poller || typeof window === 'undefined') return;
  poller = setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (listeners.size === 0) return;
    void refreshBalance({ force: true });
  }, POLL_MS);
}

function stopPoll(): void {
  if (poller) {
    clearInterval(poller);
    poller = null;
  }
}

export function subscribeBalance(listener: () => void): () => void {
  listeners.add(listener);
  bindWindow();
  startPoll();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stopPoll();
  };
}

/** React binding: the live shared balance plus a `refresh()`. Every consumer
 *  shows the SAME live number. */
export function useCloudBalance(): BalanceSnapshot & { refresh: () => void } {
  const snap = useSyncExternalStore(subscribeBalance, getBalanceSnapshot, getBalanceSnapshot);
  useEffect(() => {
    void refreshBalance();
  }, []);
  return { ...snap, refresh: invalidateBalance };
}
