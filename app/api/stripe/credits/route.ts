import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateCustomer,
  createCreditsCheckoutSession,
  getCustomerCredits,
  isStripeConfigured
} from '@/lib/stripe';
import { getUserSession } from '@/lib/session';

// GET - Get current credit balance
export async function GET(req: NextRequest) {
  try {
    // Check if user is logged in
    const user = await getUserSession();
    
    if (!user) {
      return NextResponse.json({
        credits: 5, // Default $5 free credits for non-authenticated users
        message: 'Free trial credits',
      });
    }

    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      // Even without Stripe, give logged-in users their free credits
      return NextResponse.json({
        credits: 5, // $5 free credits
        message: 'Free trial credits',
      });
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // Get credit balance from Stripe
    const { credits } = await getCustomerCredits(customer.id);

    return NextResponse.json({ credits });
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}

// POST - Create checkout session to purchase credits
export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 503 }
      );
    }

    const user = await getUserSession();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { amount } = body; // Amount in dollars

    if (!amount || amount < 5) {
      return NextResponse.json(
        { error: 'Minimum credit purchase is $5' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    // Create checkout session for credits
    const session = await createCreditsCheckoutSession({
      customerId: customer.id,
      amount,
      successUrl: `${origin}/billing?credits_added=true&amount=${amount}`,
      cancelUrl: `${origin}/billing?canceled=true`,
      metadata: {
        userId: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating credits checkout:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}