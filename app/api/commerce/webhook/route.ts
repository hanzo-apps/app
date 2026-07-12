import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/commerce';

// Observe-only. The credit ledger lives in Commerce and is mutated by Commerce
// when the user's JWT-authenticated checkout is paid — there is NO admin-keyed
// write-back from here (that was the non-IAM-native double-entry path). The
// webhook is authenticated by HMAC and used for side effects/observability.
async function handleCheckoutCompleted(data: Record<string, unknown>) {
  const userId = data.userId as string | undefined;
  const amount = typeof data.amount === 'number' ? data.amount / 100 : 0;

  if (!userId || typeof userId !== 'string' || !userId.match(/^[a-zA-Z0-9_-]+$/)) {
    console.error('Invalid userId in checkout event:', data.id);
    return;
  }

  console.log(`payment.completed: $${amount} for user ${userId} (credited by Commerce)`);
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

// App Router route handlers read the raw request body directly (see req.text()
// above), so no body-parser opt-out is needed. The legacy Pages-Router
// `export const config = { api: { bodyParser: false } }` is not a valid
// route-segment config in Next 16 and hard-fails the production build.
