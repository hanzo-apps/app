"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/web3/config";
import { type ReactNode, useState } from "react";

/**
 * Web3 provider wrapping children with WagmiProvider and QueryClientProvider.
 * Uses wagmi config from lib/web3/config.ts (Base, Mainnet, Arbitrum chains).
 */
export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
