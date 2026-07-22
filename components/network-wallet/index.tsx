"use client";

/**
 * Wallet connect control (non-custodial, injected EIP-1193) — the ONE wallet
 * affordance in the builder, rendered INSIDE the top-left workspace menu.
 *
 * Uses the app's canonical web3 stack (`lib/web3/config` → a single `injected()`
 * connector which, via EIP-6963 auto-discovery, picks up LUX WALLET and any
 * other injected wallet). The heavy wagmi/viem bundle is loaded on demand behind
 * `WalletBoundary` (dynamic, ssr:false, code-split) so it stays OUT of the
 * builder's first-load tree and off the server — it only initializes when the
 * workspace menu actually renders this row.
 *
 * Monochrome by construction: connect = white/neutral; connected = a subtle
 * white surface with a semantic-green live dot; disconnect is the only muted
 * destructive affordance. No brand hue.
 */
import { Loader2, LogOut, Wallet } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

import { WalletBoundary } from "@/components/providers/WalletBoundary";

/** Truncate an EVM address for a glanceable, monospaced label. */
function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function WalletInner() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  // The canonical injected connector (LuxWallet via EIP-6963). `lib/web3/config`
  // registers exactly one, so `connectors[0]` is it — never a third-party SDK.
  const injectedConnector = connectors[0];

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
        <span
          className="size-1.5 shrink-0 rounded-full bg-green-500 shadow-[0_0_6px_0] shadow-green-500/60"
          aria-hidden
        />
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="text-[11px] font-medium text-muted-foreground">Wallet</span>
          <span className="truncate font-mono text-xs text-foreground">
            {shortAddress(address)}
          </span>
        </span>
        <button
          type="button"
          onClick={() => disconnect()}
          title="Disconnect wallet"
          aria-label="Disconnect wallet"
          className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <LogOut className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => injectedConnector && connect({ connector: injectedConnector })}
      disabled={isPending || !injectedConnector}
      className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground transition-colors duration-150 hover:border-foreground/20 hover:bg-accent hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
    >
      {isPending ? (
        <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none" />
      ) : (
        <Wallet className="size-4 shrink-0 text-muted-foreground" />
      )}
      <span className="flex-1 text-left">
        {isPending ? "Connecting…" : "Connect wallet"}
      </span>
    </button>
  );
}

/** Public API — unchanged name so any caller keeps working. Loads the wagmi
 *  stack lazily behind the boundary, then renders the connect/connected row. */
export function NetworkWallet() {
  return (
    <WalletBoundary>
      <WalletInner />
    </WalletBoundary>
  );
}
