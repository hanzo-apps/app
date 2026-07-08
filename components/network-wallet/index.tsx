"use client";

/**
 * The app's network + wallet cluster — the shared @hanzo/ui pair over the
 * web custody model (injected EIP-1193, non-custodial). ONE adapter
 * instance per surface; selection persists in the shared network store,
 * so every consumer of `getNetwork()` follows the switcher.
 */
import { NetworkSwitcher } from "@hanzo/ui/network";
import { injectedEvmAdapter, WalletMenu } from "@hanzo/ui/wallet";

const walletAdapter = injectedEvmAdapter();

export function NetworkWallet() {
  return (
    <div className="hidden items-center gap-2 md:flex">
      <NetworkSwitcher />
      <WalletMenu adapter={walletAdapter} />
    </div>
  );
}
