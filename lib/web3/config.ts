import { http, createConfig } from 'wagmi'
import { base, mainnet, arbitrum } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Hanzo treasury wallet for receiving payments
export const TREASURY_ADDRESS = '0xda93811b968ba9d3b69eef9b0178da651006cf5c' as const

// USDC contract addresses
export const USDC_ADDRESSES = {
  [mainnet.id]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  [arbitrum.id]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
} as const

// Credit pricing in USD - amount -> credits mapping
export const CREDIT_PRICING = {
  10: { credits: 1000, bonus: 0 },
  25: { credits: 2750, bonus: 250 },
  50: { credits: 6000, bonus: 1000 },
  100: { credits: 13000, bonus: 3000 },
} as const

// Chain metadata for UI display
export const CHAIN_INFO = {
  [mainnet.id]: { name: 'Ethereum', explorer: 'https://etherscan.io' },
  [base.id]: { name: 'Base', explorer: 'https://basescan.org' },
  [arbitrum.id]: { name: 'Arbitrum', explorer: 'https://arbiscan.io' },
} as const

// ONE wallet connector: `injected()` — which via EIP-6963 auto-discovery picks
// up LUX WALLET (our own wallet, github.com/luxwallet — the extension registers
// an EIP-6963 provider on window.ethereum with its rdns) as well as any other
// injected wallet the user has. This is our canonical, native path.
//
// The third-party connectors are DELIBERATELY EXCLUDED:
//   • `walletConnect` — its Core eagerly opens relay/verify/explorer/pulse
//     sockets the moment WagmiProvider mounts, flooding the console with CSP
//     violations on every load even when nobody connects.
//   • `coinbaseWallet` — a third-party wallet SDK; not ours. LuxWallet is the
//     canonical Hanzo/Lux wallet, and MetaMask etc. still connect via injected.
// So the app uses our own wallet, not a third-party connector bolted on.
export const wagmiConfig = createConfig({
  chains: [base, mainnet, arbitrum],
  connectors: [
    injected(),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
  },
})

// ERC20 ABI for USDC transfers
export const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const
