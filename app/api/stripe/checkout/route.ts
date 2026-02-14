import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, getOrCreateCustomer, STRIPE_PRODUCTS, isStripeConfigured } from '@/lib/stripe';
import { getUserSession } from '@/lib/session';

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
    const { plan, billing } = body;

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // Determine the price ID based on plan and billing cycle
    let priceId: string;

    if (plan === 'pay-as-you-go') {
      priceId = STRIPE_PRODUCTS.payAsYouGo.prices.usage;
    } else if (plan === 'pro') {
      priceId = billing === 'yearly'
        ? STRIPE_PRODUCTS.pro.prices.yearly
        : STRIPE_PRODUCTS.pro.prices.monthly;
    } else {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Create checkout session
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const session = await createCheckoutSession({
      customerId: customer.id,
      priceId,
      mode: plan === 'pay-as-you-go' ? 'subscription' : 'subscription',
      successUrl: `${origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        plan,
        billing: billing || 'monthly',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      // Redirect to pricing with error
      const origin = req.headers.get('origin') || 'http://localhost:3002';
      return NextResponse.redirect(`${origin}/pricing?error=payment_not_configured`);
    }

    const user = await getUserSession();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const plan = searchParams.get('plan');
    const billing = searchParams.get('billing');

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan is required' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // Determine the price ID based on plan and billing cycle
    let priceId: string;

    if (plan === 'pay-as-you-go') {
      priceId = STRIPE_PRODUCTS.payAsYouGo.prices.usage;
    } else if (plan === 'pro') {
      priceId = billing === 'yearly'
        ? STRIPE_PRODUCTS.pro.prices.yearly
        : STRIPE_PRODUCTS.pro.prices.monthly;
    } else {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Create checkout session
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const session = await createCheckoutSession({
      customerId: customer.id,
      priceId,
      mode: 'subscription',
      successUrl: `${origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        plan,
        billing: billing || 'monthly',
      },
    });

    // Redirect to checkout
    return NextResponse.redirect(session.url!);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const origin = req.headers.get('origin') || 'http://localhost:3002';
    return NextResponse.redirect(`${origin}/pricing?error=checkout_failed`);
  }
}