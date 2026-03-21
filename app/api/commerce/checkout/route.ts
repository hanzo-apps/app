import { NextRequest, NextResponse } from 'next/server';
import {
  createCheckoutSession,
  createCreditsCheckoutSession,
  getOrCreateCustomer,
  COMMERCE_PRODUCTS,
  isCommerceConfigured,
} from '@/lib/commerce';
import { getUserSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    if (!isCommerceConfigured()) {
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 503 },
      );
    }

    const user = await getUserSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { plan, billing, amount, type } = body;

    const customer = await getOrCreateCustomer({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    // Credit purchase flow
    if (type === 'credits' && amount) {
      if (amount < 5) {
        return NextResponse.json({ error: 'Minimum credit purchase is $5' }, { status: 400 });
      }

      const session = await createCreditsCheckoutSession({
        customerId: customer.id,
        amount,
        successUrl: body.successUrl || `${origin}/billing?credits_added=true&amount=${amount}`,
        cancelUrl: body.cancelUrl || `${origin}/billing?canceled=true`,
        metadata: { userId: user.id },
      });

      return NextResponse.json({ url: session.url });
    }

    // Subscription plan flow
    if (!plan) {
      return NextResponse.json({ error: 'Plan is required' }, { status: 400 });
    }

    let priceId: string;

    if (plan === 'pay-as-you-go') {
      priceId = COMMERCE_PRODUCTS.payAsYouGo.prices.usage;
    } else if (plan === 'pro') {
      priceId =
        billing === 'yearly'
          ? COMMERCE_PRODUCTS.pro.prices.yearly
          : COMMERCE_PRODUCTS.pro.prices.monthly;
    } else {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const session = await createCheckoutSession({
      customerId: customer.id,
      priceId,
      mode: 'subscription',
      successUrl: `${origin}/billing?success=true&session_id=${'{CHECKOUT_SESSION_ID}'}`,
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
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!isCommerceConfigured()) {
      const origin = req.headers.get('origin') || 'http://localhost:3002';
      return NextResponse.redirect(`${origin}/pricing?error=payment_not_configured`);
    }

    const user = await getUserSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const plan = searchParams.get('plan');
    const billing = searchParams.get('billing');

    if (!plan) {
      return NextResponse.json({ error: 'Plan is required' }, { status: 400 });
    }

    const customer = await getOrCreateCustomer({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    let priceId: string;

    if (plan === 'pay-as-you-go') {
      priceId = COMMERCE_PRODUCTS.payAsYouGo.prices.usage;
    } else if (plan === 'pro') {
      priceId =
        billing === 'yearly'
          ? COMMERCE_PRODUCTS.pro.prices.yearly
          : COMMERCE_PRODUCTS.pro.prices.monthly;
    } else {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const session = await createCheckoutSession({
      customerId: customer.id,
      priceId,
      mode: 'subscription',
      successUrl: `${origin}/billing?success=true&session_id=${'{CHECKOUT_SESSION_ID}'}`,
      cancelUrl: `${origin}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        plan,
        billing: billing || 'monthly',
      },
    });

    return NextResponse.redirect(session.url!);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const origin = req.headers.get('origin') || 'http://localhost:3002';
    return NextResponse.redirect(`${origin}/pricing?error=checkout_failed`);
  }
}
