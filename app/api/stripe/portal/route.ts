import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCustomer, isStripeConfigured, stripe } from '@/lib/stripe';
import { getUserSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserSession();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Billing system not configured' },
        { status: 503 }
      );
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // Check if stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Billing portal not available' },
        { status: 503 }
      );
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    // Create a portal session for the customer
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${origin}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}