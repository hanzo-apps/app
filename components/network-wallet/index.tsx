"use client";

/**
 * Network + wallet cluster (non-custodial, injected EIP-1193).
 *
 * The web3 primitives for this live in `@hanzo/ui`'s `network` / `wallet`
 * entry points. The `@hanzo/ui` version installed in this app (5.5.x) does
 * NOT ship those subpaths, so statically importing them breaks the build.
 * Rather than pin a divergent UI version or fork the primitives (a parallel
 * system), this renders nothing until the shared kit ships the wallet entry
 * points again — the builder's identity is carried by the org switcher +
 * account menu (credit balance included), which is the canonical bottom-left
 * cluster (mirrors hanzo.chat / console). The public API is unchanged so any
 * caller keeps working the day the primitives return.
 *
 * To re-enable, once `@hanzo/ui` exports `./network` + `./wallet`:
 *   import { NetworkSwitcher } from "@hanzo/ui/network";
 *   import { injectedEvmAdapter, WalletMenu } from "@hanzo/ui/wallet";
 *   const walletAdapter = injectedEvmAdapter();
 *   return (
 *     <div className="hidden items-center gap-2 md:flex">
 *       <NetworkSwitcher />
 *       <WalletMenu adapter={walletAdapter} />
 *     </div>
 *   );
 */
export function NetworkWallet() {
  return null;
}
