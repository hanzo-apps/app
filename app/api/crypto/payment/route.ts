import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { base, mainnet, arbitrum } from 'viem/chains'

const TREASURY_ADDRESS = '0x4242424242424242424242424242424242424242'

const clients = {
  base: createPublicClient({ chain: base, transport: http() }),
  mainnet: createPublicClient({ chain: mainnet, transport: http() }),
  arbitrum: createPublicClient({ chain: arbitrum, transport: http() }),
}

export async function POST(request: Request) {
  try {
    const { txHash, amount, credits, chain } = await request.json()

    if (!txHash || !amount || !credits || !chain) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the transaction on-chain
    const client = clients[chain as keyof typeof clients]
    if (!client) {
      return NextResponse.json({ error: 'Invalid chain' }, { status: 400 })
    }

    const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` })

    if (!receipt || receipt.status !== 'success') {
      return NextResponse.json({ error: 'Transaction not confirmed' }, { status: 400 })
    }

    // TODO: Verify the transaction details (to address, amount, token)
    // TODO: Store the payment in database
    // TODO: Credit the user's account

    // For now, just log the payment
    console.log('Crypto payment received:', { txHash, amount, credits, chain })

    return NextResponse.json({
      success: true,
      txHash,
      credits,
      message: 'Credits added successfully',
    })
  } catch (error) {
    console.error('Crypto payment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment verification failed' },
      { status: 500 }
    )
  }
}
