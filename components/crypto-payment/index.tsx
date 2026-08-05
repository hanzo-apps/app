'use client'

import { SizableText, XStack, Paragraph, Anchor, YStack } from '@hanzo/gui';
import { glass } from "@/lib/chrome";
import { useState } from 'react'
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { parseUnits } from 'viem'
import { base, mainnet, arbitrum } from 'wagmi/chains'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Badge } from '@hanzo/ui';
import { Spinner } from '@/components/ui/spinner';
import { Wallet, Check, ExternalLink, Zap, ChevronDown } from 'lucide-react'
import { TREASURY_ADDRESS, USDC_ADDRESSES, ERC20_ABI, CREDIT_PRICING, CHAIN_INFO } from '@/lib/web3/config'

// Crypto credit top-ups are KILLED until the backend is real. `app/api/crypto/
// payment` is a 503 stub that credits NOTHING, so initiating an on-chain USDC
// transfer would take the user's money and add zero credits (money in, nothing
// out — with a false "Payment Complete!"). Do NOT flip this true until that route
// verifies the on-chain receipt (confirmations + replay-guard) AND credits the
// account, and until the success flow only reports success on that credited
// response. SHIP OR KILL IT — killed in code, one line to revive.
export const CRYPTO_PAYMENTS_ENABLED = false

const SUPPORTED_CHAINS = [
  { id: base.id, name: 'Base', icon: null },
  { id: mainnet.id, name: 'Ethereum', icon: null },
  { id: arbitrum.id, name: 'Arbitrum', icon: null },
] as const

type SupportedChainId = typeof base.id | typeof mainnet.id | typeof arbitrum.id

interface CryptoPaymentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (txHash: string, credits: number) => void
}

export function CryptoPayment({ open, onOpenChange, onSuccess }: CryptoPaymentProps) {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [selectedChainId, setSelectedChainId] = useState<SupportedChainId>(base.id)
  const [step, setStep] = useState<'select' | 'confirm' | 'pending' | 'success'>('select')
  const [chainMenuOpen, setChainMenuOpen] = useState(false)

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const creditOptions = [
    { amount: 10, credits: 1000, bonus: 0 },
    { amount: 25, credits: 2750, bonus: 250, popular: true },
    { amount: 50, credits: 6000, bonus: 1000 },
    { amount: 100, credits: 13000, bonus: 3000 },
  ]

  const handlePayment = async () => {
    // Disabled: never initiate an on-chain transfer while the backend can't credit it.
    if (!CRYPTO_PAYMENTS_ENABLED) return
    if (!selectedAmount || !address) return

    // Switch chain if needed
    if (chain?.id !== selectedChainId) {
      try {
        switchChain({ chainId: selectedChainId })
      } catch (error) {
        console.error('Chain switch failed:', error)
        return
      }
    }

    setStep('pending')

    try {
      writeContract({
        address: USDC_ADDRESSES[selectedChainId] as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [TREASURY_ADDRESS, parseUnits(selectedAmount.toString(), 6)],
        chainId: selectedChainId,
      })
    } catch (error) {
      console.error('Payment failed:', error)
      setStep('confirm')
    }
  }

  // Watch for transaction success. Guarded by CRYPTO_PAYMENTS_ENABLED (inert while
  // killed). When revived, the account must be credited ONLY on a backend-confirmed
  // receipt: setStep('success')/onSuccess move inside the res.ok branch so a 503
  // stub can never show "Payment Complete!" or grant credits. (A proper revive
  // should also move this out of render into a useEffect to avoid a double-fetch.)
  if (CRYPTO_PAYMENTS_ENABLED && isSuccess && step === 'pending') {
    const pricing = CREDIT_PRICING[selectedAmount as keyof typeof CREDIT_PRICING]
    if (pricing && hash) {
      const chainName = SUPPORTED_CHAINS.find(c => c.id === selectedChainId)?.name || 'base'
      fetch('/v1/crypto/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: hash,
          amount: selectedAmount,
          credits: pricing.credits,
          chain: chainName.toLowerCase(),
        }),
      }).then((res) => {
        if (!res.ok) return   // backend did not credit — do NOT claim success
        setStep('success')
        onSuccess?.(hash, pricing.credits)
      }).catch(() => {})
    }
  }

  const handleClose = () => {
    setStep('select')
    setSelectedAmount(null)
    onOpenChange(false)
  }

  const selectedChainInfo = CHAIN_INFO[selectedChainId]
  const explorerUrl = selectedChainInfo?.explorer

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent maxWidth={512} backgroundColor="$background" borderColor="$borderColor">
        <DialogHeader>
          <DialogTitle display="flex" alignItems="center" fontSize="$7">
            <Wallet size={20} />
            {step === 'success' ? 'Payment Complete!' : 'Purchase Credits with USDC'}
          </DialogTitle>
          <DialogDescription color="$color11">
            {step === 'success'
              ? 'Your credits have been added to your account'
              : 'Pay with USDC on Base, Ethereum, or Arbitrum'}
          </DialogDescription>
        </DialogHeader>

        {step === 'success' ? (
          <YStack paddingVertical="$6">
            <XStack width="$10" height="$10" borderRadius="$10" backgroundColor="$green9" alignItems="center" justifyContent="center" alignSelf="center" marginBottom="$4">
              <Check size={32} />
            </XStack>
            <Paragraph fontSize="$6" fontWeight="500" marginBottom="$2" textAlign="center">
              +{CREDIT_PRICING[selectedAmount as keyof typeof CREDIT_PRICING]?.credits.toLocaleString()} credits added!
            </Paragraph>
            {hash && (
              <Anchor display="flex"
                href={`${explorerUrl}/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                fontSize="$3" color="$color11" alignItems="center" justifyContent="center" gap="$1" hoverStyle={{ color: "$color" }}
              >
                View on {selectedChainInfo?.name} <ExternalLink size={12} />
              </Anchor>
            )}
            <Button onClick={handleClose} marginTop="$5">
              Done
            </Button>
          </YStack>
        ) : !isConnected ? (
          <YStack paddingVertical="$5" rowGap="$3">
            <Paragraph fontSize="$3" color="$color11" textAlign="center" marginBottom="$4">Connect your wallet to continue</Paragraph>
            {connectors.map((connector) => (
              <Button
                key={connector.uid}
                onClick={() => connect({ connector })}
                variant="outline"
                width="100%" borderColor="$borderColor" hoverStyle={{ backgroundColor: "$color3" }}
              >
                <Wallet size={16} />
                {connector.name}
              </Button>
            ))}
          </YStack>
        ) : step === 'select' ? (
          <YStack paddingVertical="$4" rowGap="$4">
            <XStack alignItems="center" justifyContent="space-between">
              <SizableText color="$color11" fontSize="$3">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</SizableText>
              <Button variant="ghost" size="sm" onClick={() => disconnect()}>
                Disconnect
              </Button>
            </XStack>

            {/* Chain selector */}
            <YStack position="relative">
              <Button
                onClick={() => setChainMenuOpen(!chainMenuOpen)}
                width="100%" alignItems="center" justifyContent="space-between" padding="$3" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" hoverStyle={{ borderColor: "$color" }}
              >
                <SizableText fontSize="$3">
                  Network: <SizableText fontWeight="500">{SUPPORTED_CHAINS.find(c => c.id === selectedChainId)?.name}</SizableText>
                </SizableText>
                <ChevronDown size={16} />
              </Button>
              {chainMenuOpen && (
                <YStack {...glass(2)} position="absolute" top="100%" left="$0" right="$0" marginTop="$1" borderRadius="$5" borderWidth={1} overflow="hidden" zIndex={10}>
                  {SUPPORTED_CHAINS.map((c) => (
                    <Button
                      key={c.id}
                      onClick={() => { setSelectedChainId(c.id); setChainMenuOpen(false) }}
                      width="100%" justifyContent="flex-start" paddingHorizontal="$4" paddingVertical="$3" hoverStyle={{ backgroundColor: "$color3" }} backgroundColor={selectedChainId === c.id ? "$color3" : undefined}
                    >
                      {c.name}
                    </Button>
                  ))}
                </YStack>
              )}
            </YStack>

            <YStack gap="$3">
              {creditOptions.map((option) => (
                <YStack
                  key={option.amount}
                  onClick={() => setSelectedAmount(option.amount)}
                  position="relative" padding="$4" borderRadius="$5" cursor="pointer" borderWidth={1} {...{ borderColor: selectedAmount === option.amount ? "$purple9" : "$borderColor", backgroundColor: selectedAmount === option.amount ? "$purple9" : "$background", hoverStyle: selectedAmount === option.amount ? undefined : {"borderColor":"$color"} }}
                >
                  {option.popular && (
                    <YStack position="absolute" top={-2} right={-2}>
                      <Badge>Popular</Badge>
                    </YStack>
                  )}
                  <YStack><SizableText fontSize="$7" fontWeight="500">${option.amount}</SizableText></YStack>
                  <XStack alignItems="center" marginTop="$1">
                    <Zap size={12} />
                    <SizableText fontSize="$3" color="$color11">
                      {option.credits.toLocaleString()} credits
                    </SizableText>
                  </XStack>
                  {option.bonus > 0 && (
                    <YStack marginTop="$2">
                      <Badge variant="secondary">+{option.bonus.toLocaleString()} bonus</Badge>
                    </YStack>
                  )}
                </YStack>
              ))}
            </YStack>

            <Button
              onClick={() => setStep('confirm')}
              disabled={!selectedAmount}
              width="100%"
            >
              Continue
            </Button>
          </YStack>
        ) : step === 'confirm' ? (
          <YStack paddingVertical="$4" rowGap="$4">
            <YStack padding="$4" borderRadius="$5" backgroundColor="$background" borderWidth={1} borderColor="$borderColor">
              <XStack justifyContent="space-between" alignItems="center">
                <SizableText color="$color11">Amount</SizableText>
                <SizableText fontWeight="500">${selectedAmount} USDC</SizableText>
              </XStack>
              <XStack justifyContent="space-between" alignItems="center" marginTop="$2">
                <SizableText color="$color11">Credits</SizableText>
                <SizableText fontWeight="500" color="$green9">
                  +{CREDIT_PRICING[selectedAmount as keyof typeof CREDIT_PRICING]?.credits.toLocaleString()}
                </SizableText>
              </XStack>
              <XStack justifyContent="space-between" alignItems="center" marginTop="$2">
                <SizableText color="$color11">Network</SizableText>
                <SizableText fontSize="$3">{SUPPORTED_CHAINS.find(c => c.id === selectedChainId)?.name}</SizableText>
              </XStack>
              <XStack justifyContent="space-between" alignItems="center" marginTop="$2">
                <SizableText color="$color11">Treasury</SizableText>
                <SizableText fontSize="$1" fontFamily="$mono" color="$color11">
                  {TREASURY_ADDRESS.slice(0, 6)}...{TREASURY_ADDRESS.slice(-4)}
                </SizableText>
              </XStack>
            </YStack>

            <XStack gap="$3">
              <Button
                variant="outline"
                onClick={() => setStep('select')}
                flex={1} borderColor="$borderColor" hoverStyle={{ backgroundColor: "$color3" }}
              >
                Back
              </Button>
              <Button
                onClick={handlePayment}
                disabled={isPending}
                flex={1}
              >
                {isPending ? <Spinner size={16} /> : 'Pay Now'}
              </Button>
            </XStack>
          </YStack>
        ) : (
          <YStack paddingVertical="$6">
            <Spinner size={48} />
            <Paragraph fontSize="$6" fontWeight="500" textAlign="center">
              {isConfirming ? 'Confirming transaction...' : 'Waiting for wallet...'}
            </Paragraph>
            <Paragraph fontSize="$3" color="$color11" marginTop="$2" textAlign="center">
              Please confirm the transaction in your wallet
            </Paragraph>
          </YStack>
        )}
      </DialogContent>
    </Dialog>
  )
}
