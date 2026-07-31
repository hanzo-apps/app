import { NextResponse, type NextRequest } from 'next/server'
import { session } from '@/lib/iam'

// Crypto payment processing is not yet implemented.
// When ready, this endpoint must:
//   1. Verify on-chain receipt (tx confirmed, correct to-address, correct token, correct amount)
//   2. Check for replay (tx hash not already credited)
//   3. Store payment record in database
//   4. Credit the user's account
//
// Until all of the above are in place, this endpoint returns 503.

export async function POST(req: NextRequest) {
  const user = await session(req)

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return NextResponse.json(
    { error: 'Crypto payments are not yet available. Please use card payment.' },
    { status: 503 }
  )
}
