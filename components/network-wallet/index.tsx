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
import { Button } from '@hanzo/ui';
import { XStack, SizableText } from '@hanzo/gui';
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
      <XStack alignItems="center" gap="$2" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3" paddingVertical="$2">
        <SizableText
          width="$1.5" height="$1.5" flexShrink={0} borderRadius="$10" backgroundColor="$green9" shadowColor="$shadowColor"
          aria-hidden
  />
        <SizableText minWidth={0} flex={1} flexDirection="column" lineHeight="1.25">
          <SizableText fontSize={11} fontWeight="500" color="$color11">Wallet</SizableText>
          <SizableText numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color">
            {shortAddress(address)}
          </SizableText>
        </SizableText>
        <Button
          type="button"
          onClick={() => disconnect()}
          title="Disconnect wallet"
          aria-label="Disconnect wallet"
          group
          width={28} height={28} flexShrink={0} alignItems="center" justifyContent="center" borderRadius="$3" hoverStyle={{ backgroundColor: "$color3" }} focusVisibleStyle={{ outlineWidth: 0 }}
        >
          <SizableText color="$color11" $group-hover={{ color: "$color" }}>
            <LogOut size={14} />
          </SizableText>
        </Button>
      </XStack>
    );
  }

  return (
    <Button
      type="button"
      onClick={() => injectedConnector && connect({ connector: injectedConnector })}
      disabled={isPending || !injectedConnector}
      width="100%" alignItems="center" gap="$2" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3" paddingVertical="$2" hoverStyle={{ borderColor: "$color", backgroundColor: "$color3" }} disabledStyle={{ opacity: 0.5 }} focusVisibleStyle={{ outlineWidth: 0 }}
    >
      {isPending ? (
        <Loader2 size={16} color="$color11" />
      ) : (
        <Wallet size={16} color="$color11" />
      )}
      <SizableText flex={1} textAlign="left" fontSize="$3" color="$color">
        {isPending ? "Connecting…" : "Connect wallet"}
      </SizableText>
    </Button>
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
