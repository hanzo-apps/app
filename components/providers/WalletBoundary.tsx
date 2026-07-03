'use client';

/**
 * Wallet stack boundary — the ONE place the web3 stack (wagmi + WalletConnect +
 * Coinbase connectors + viem) is allowed to load. Mount it around the small
 * surfaces that actually use a wallet (dashboard balance, crypto top-up) so the
 * ~120 KB connector bundle stays OUT of the global tree (landing + builder) and
 * off the server (no SSR indexedDB access → no prerender warning).
 *
 * Client-only + code-split: the provider chunk is fetched on demand when a
 * wallet surface mounts, not on first paint of every route.
 */
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const Web3Provider = dynamic(
  () => import('./Web3Provider').then((m) => m.Web3Provider),
  { ssr: false },
);

export function WalletBoundary({ children }: { children: ReactNode }) {
  return <Web3Provider>{children}</Web3Provider>;
}
