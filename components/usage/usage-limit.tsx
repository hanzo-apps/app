'use client';

/**
 * UsageLimitProvider — the ONE mount of the "Need more usage?" modal.
 *
 * Mounted once at the app root (app/providers). Any surface can raise the modal
 * with `useUsageLimit().raise()` when a metered action reports an out-of-credit
 * signal (a 402 from the gateway/cloud) — so the same honest paywall serves the
 * whole app instead of each feature shipping its own.
 *
 * `useUsageLimit()` outside the provider returns a no-op `raise`, so a metered
 * action never throws just because the modal isn't mounted on that surface.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { UsageLimitDialog } from './UsageLimitDialog';

interface UsageLimitApi {
  /** Open the "Need more usage?" modal. */
  raise: () => void;
}

const UsageLimitContext = createContext<UsageLimitApi | null>(null);

export function UsageLimitProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const raise = useCallback(() => setOpen(true), []);
  const api = useMemo<UsageLimitApi>(() => ({ raise }), [raise]);

  return (
    <UsageLimitContext.Provider value={api}>
      {children}
      {/* Mounted only while open. This provider wraps the ROOT layout, so an
          always-mounted dialog rendered on every page — and @hanzo/ui's Dialog
          runs DialogSheetController -> useAdaptIsActive -> useMedia even when
          closed, which throws during prerender ("Cannot create proxy with a
          non-object as target or handler"). That took down pages that import
          nothing themselves, which is what made it hard to find. A closed modal
          has nothing to render, so gating the mount costs nothing. */}
      {open && <UsageLimitDialog open={open} onOpenChange={setOpen} />}
    </UsageLimitContext.Provider>
  );
}

export function useUsageLimit(): UsageLimitApi {
  return useContext(UsageLimitContext) ?? { raise: () => {} };
}

export default UsageLimitProvider;
