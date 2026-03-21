import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { env } from '@/lib/security/env-validation';
import { sanitizeMongoInput } from '@/lib/security/input-validation';

const webhookSecret = env.STRIPE_WEBHOOK_SECRET || '';

async function handleCheckoutSessionCompleted(session: any) {
  // Sanitize and validate metadata
  const userId = sanitizeMongoInput(session.metadata?.userId);
  const amount = session.amount_total / 100; // Convert from cents

  if (!userId || typeof userId !== 'string' || !userId.match(/^[a-zA-Z0-9_-]+$/)) {
    console.error('Invalid userId in checkout session metadata:', session.id);
    return;
  }

  // Use Stripe customer metadata to track credits (matches lib/stripe.ts pattern)
  const { updateCustomerCredits } = await import('@/lib/stripe');
  await updateCustomerCredits({
    customerId: session.customer,
    credits: amount,
    action: 'increment',
  });

  console.log(`Credited $${amount} to user ${userId} (customer ${session.customer})`);
}

async function handleSubscriptionUpdated(subscription: any) {
  // Log subscription lifecycle events.
  // Subscription state is queried live from Stripe via getSubscriptionStatus()
  // in lib/stripe.ts, so no local database update is needed.
  console.log('Subscription %s status: %s', subscription.id, subscription.status);
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  const customerId = invoice.customer;
  const amount = invoice.amount_paid / 100;
  console.log('Invoice %s paid: $%d from customer %s', invoice.id, amount, customerId);
}

export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe || !webhookSecret) {
      console.error('Stripe webhook not properly configured');
      return NextResponse.json(
        { error: 'Webhook handler not configured' },
        { status: 503 }
      );
    }

    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event;
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
        
      case 'payment_intent.succeeded':
        console.log('Payment intent succeeded:', event.data.object.id);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Disable body parsing for webhook endpoint
export const config = {
  api: {
    bodyParser: false,
  },
};