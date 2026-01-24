'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { base } from 'wagmi/chains'
import { Button } from '@hanzo/ui'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@hanzo/ui'
import { Badge } from '@hanzo/ui'
import { Wallet, Loader2, Check, ExternalLink, Zap } from 'lucide-react'
import { TREASURY_ADDRESS, USDC_ADDRESSES, ERC20_ABI, CREDIT_PRICING } from '@/lib/web3/config'

interface CryptoPaymentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (txHash: string, credits: number) => void
}

export function CryptoPayment({ open, onOpenChange, onSuccess }: CryptoPaymentProps) {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [step, setStep] = useState<'select' | 'confirm' | 'pending' | 'success'>('select')

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const creditOptions = [
    { amount: 10, credits: 10, bonus: 0 },
    { amount: 25, credits: 27, bonus: 2, popular: true },
    { amount: 50, credits: 55, bonus: 5 },
    { amount: 100, credits: 115, bonus: 15 },
  ]

  const handlePayment = async () => {
    if (!selectedAmount || !address) return

    setStep('pending')

    try {
      writeContract({
        address: USDC_ADDRESSES[base.id] as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [TREASURY_ADDRESS, parseUnits(selectedAmount.toString(), 6)], // USDC has 6 decimals
        chainId: base.id,
      })
    } catch (error) {
      console.error('Payment failed:', error)
      setStep('confirm')
    }
  }

  // Watch for transaction success
  if (isSuccess && step === 'pending') {
    setStep('success')
    const pricing = CREDIT_PRICING[selectedAmount as keyof typeof CREDIT_PRICING]
    if (pricing && hash) {
      // Record the payment
      fetch('/api/crypto/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: hash,
          amount: selectedAmount,
          credits: pricing.credits,
          chain: 'base',
        }),
      }).then(() => {
        onSuccess?.(hash, pricing.credits)
      })
    }
  }

  const handleClose = () => {
    setStep('select')
    setSelectedAmount(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-[#1a1a1a] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Wallet className="w-5 h-5 mr-2" />
            {step === 'success' ? 'Payment Complete!' : 'Purchase Credits with Crypto'}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {step === 'success'
              ? 'Your credits have been added to your account'
              : 'Pay with USDC on Base network'}
          </DialogDescription>
        </DialogHeader>

        {step === 'success' ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-lg font-medium mb-2">
              +{CREDIT_PRICING[selectedAmount as keyof typeof CREDIT_PRICING]?.credits} credits added!
            </p>
            {hash && (
              <a
                href={`https://basescan.org/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/60 hover:text-white flex items-center justify-center gap-1"
              >
                View transaction <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <Button onClick={handleClose} className="mt-6">
              Done
            </Button>
          </div>
        ) : !isConnected ? (
          <div className="py-6 space-y-3">
            <p className="text-sm text-white/60 text-center mb-4">Connect your wallet to continue</p>
            {connectors.map((connector) => (
              <Button
                key={connector.uid}
                onClick={() => connect({ connector })}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {connector.name}
              </Button>
            ))}
          </div>
        ) : step === 'select' ? (
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
              <Button variant="ghost" size="sm" onClick={() => disconnect()} className="text-white/60 hover:text-white">
                Disconnect
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {creditOptions.map((option) => (
                <div
                  key={option.amount}
                  onClick={() => setSelectedAmount(option.amount)}
                  className={`relative p-4 rounded-lg cursor-pointer transition-all border ${
                    selectedAmount === option.amount
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-white/10 hover:border-white/30 bg-[#0a0a0a]'
                  }`}
                >
                  {option.popular && (
                    <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs">
                      Popular
                    </Badge>
                  )}
                  <div className="text-xl font-bold">${option.amount}</div>
                  <div className="flex items-center text-sm text-white/60 mt-1">
                    <Zap className="w-3 h-3 mr-1" />
                    {option.credits} credits
                  </div>
                  {option.bonus > 0 && (
                    <Badge variant="secondary" className="mt-2 text-xs bg-white/10">
                      +{Math.round((option.bonus / (option.credits - option.bonus)) * 100)}% bonus
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            <Button
              onClick={() => setStep('confirm')}
              disabled={!selectedAmount}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
            >
              Continue
            </Button>
          </div>
        ) : step === 'confirm' ? (
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-lg bg-[#0a0a0a] border border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-white/60">Amount</span>
                <span className="font-bold">${selectedAmount} USDC</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-white/60">Credits</span>
                <span className="font-bold text-green-500">
                  +{CREDIT_PRICING[selectedAmount as keyof typeof CREDIT_PRICING]?.credits}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-white/60">Network</span>
                <span className="text-sm">Base</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('select')}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Back
              </Button>
              <Button
                onClick={handlePayment}
                disabled={isPending}
                className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pay Now'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-violet-500" />
            <p className="text-lg font-medium">
              {isConfirming ? 'Confirming transaction...' : 'Waiting for wallet...'}
            </p>
            <p className="text-sm text-white/60 mt-2">
              Please confirm the transaction in your wallet
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
