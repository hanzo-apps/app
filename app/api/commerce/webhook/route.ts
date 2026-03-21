import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, updateCustomerCredits } from '@/lib/commerce';

async function handleCheckoutCompleted(data: Record<string, unknown>) {
  const userId = data.userId as string | undefined;
  const customerId = data.customerId as string | undefined;
  const amount = typeof data.amount === 'number' ? data.amount / 100 : 0;

  if (!userId || typeof userId !== 'string' || !userId.match(/^[a-zA-Z0-9_-]+$/)) {
    console.error('Invalid userId in checkout event:', data.id);
    return;
  }

  if (customerId) {
    await updateCustomerCredits({
      customerId,
      credits: amount,
      action: 'increment',
    });
  }

  console.log(`Credited $${amount} to user ${userId}`);
}

async function handleSubscriptionUpdated(data: Record<string, unknown>) {
  console.log('Subscription %s status: %s', data.id, data.status);
}

async function handleInvoicePaid(data: Record<string, unknown>) {
  const customerId = data.customerId as string | undefined;
  const amount = typeof data.amount === 'number' ? data.amount / 100 : 0;
  console.log('Invoice %s paid: $%d from customer %s', data.id, amount, customerId);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-commerce-signature') || '';

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-commerce-signature header' },
        { status: 400 },
      );
    }

    let event: { id: string; type: string; data: Record<string, unknown> };

    try {
      event = verifyWebhookSignature(body, signature);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      case 'payment.completed':
        await handleCheckoutCompleted(event.data);
        break;

      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.canceled':
        await handleSubscriptionUpdated(event.data);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data);
        break;

      default:
        console.log(`Unhandled commerce event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
