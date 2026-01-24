import { http, createConfig } from 'wagmi'
import { base, mainnet, arbitrum } from 'wagmi/chains'
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors'

// Hanzo treasury wallet for receiving payments
export const TREASURY_ADDRESS = '0xda93811b968ba9d3b69eef9b0178da651006cf5c' as const

// USDC contract addresses
export const USDC_ADDRESSES = {
  [mainnet.id]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  [arbitrum.id]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
} as const

// Credit pricing in USD
export const CREDIT_PRICING = {
  10: { credits: 10, bonus: 0 },
  25: { credits: 27, bonus: 2 },
  50: { credits: 55, bonus: 5 },
  100: { credits: 115, bonus: 15 },
} as const

export const wagmiConfig = createConfig({
  chains: [base, mainnet, arbitrum],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Hanzo' }),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || '' }),
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
