// Server-side Hanzo Commerce client.
// All payment processing flows through the Hanzo Commerce API (api.hanzo.ai/v1),
// which supports Square as the fiat payment processor and multiple crypto backends.
// Secrets are fetched from KMS -- never hardcoded.

const COMMERCE_API_URL = process.env.HANZO_COMMERCE_API_URL || 'https://api.hanzo.ai/v1';
const COMMERCE_API_KEY = process.env.HANZO_COMMERCE_API_KEY || '';
const COMMERCE_WEBHOOK_SECRET = process.env.HANZO_COMMERCE_WEBHOOK_SECRET || '';

/** Check if Commerce is configured. */
export function isCommerceConfigured(): boolean {
  return !!(COMMERCE_API_KEY && COMMERCE_WEBHOOK_SECRET);
}

// Plan product IDs managed in Commerce backend
export const COMMERCE_PRODUCTS = {
  credits: {
    productId: process.env.HANZO_CREDITS_PRODUCT_ID || '',
    name: 'Credits',
    description: 'Top up credits for usage-based billing',
  },
  pro: {
    productId: process.env.HANZO_PRO_PRODUCT_ID || '',
    name: 'Pro',
    prices: {
      monthly: process.env.HANZO_PRO_MONTHLY_PRICE_ID || '',
      yearly: process.env.HANZO_PRO_YEARLY_PRICE_ID || '',
    },
  },
  payAsYouGo: {
    productId: process.env.HANZO_PAY_AS_YOU_GO_PRODUCT_ID || '',
    prices: {
      usage: process.env.HANZO_PAY_AS_YOU_GO_USAGE_PRICE_ID || '',
    },
  },
};

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function commerceRequest<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${COMMERCE_API_URL}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${COMMERCE_API_KEY}`,
    'Content-Type': 'application/json',
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Commerce API error (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Customer management
// ---------------------------------------------------------------------------

interface CommerceCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

/** Get or create a customer in Commerce. */
export async function getOrCreateCustomer({
  userId,
  email,
  name,
}: {
  userId: string;
  email: string;
  name?: string;
}): Promise<CommerceCustomer> {
  // Search by email first
  try {
    const results = await commerceRequest<CommerceCustomer[]>(
      'GET',
      `/user?email=${encodeURIComponent(email)}&count=1`,
    );
    if (results && results.length > 0) {
      return results[0];
    }
  } catch {
    // Customer not found -- create below
  }

  // Create new customer
  return commerceRequest<CommerceCustomer>('POST', '/user', {
    email,
    name,
    metadata: { userId },
  });
}

// ---------------------------------------------------------------------------
// Checkout sessions
// ---------------------------------------------------------------------------

interface CheckoutSession {
  url: string;
  id: string;
}

/** Create a checkout session for subscription plans. */
export async function createCheckoutSession({
  customerId,
  priceId,
  mode = 'subscription',
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  customerId?: string;
  priceId: string;
  mode?: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<CheckoutSession> {
  return commerceRequest<CheckoutSession>('POST', '/checkout/charge', {
    customerId,
    planId: priceId,
    mode,
    successUrl,
    cancelUrl,
    paymentMethod: { type: 'card' },
    metadata,
  });
}

/** Create a checkout session for credit purchases. */
export async function createCreditsCheckoutSession({
  customerId,
  amount,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  customerId?: string;
  customerEmail?: string;
  amount: number;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<CheckoutSession> {
  return commerceRequest<CheckoutSession>('POST', '/checkout/charge', {
    customerId,
    items: [
      {
        productId: COMMERCE_PRODUCTS.credits.productId,
        quantity: 1,
        price: amount * 100, // cents
      },
    ],
    paymentMethod: { type: 'card' },
    successUrl,
    cancelUrl,
    metadata: {
      ...metadata,
      type: 'credits',
      amount: amount.toString(),
    },
  });
}

// ---------------------------------------------------------------------------
// Billing portal
// ---------------------------------------------------------------------------

interface PortalSession {
  url: string;
  expiresAt: string;
}

/** Get a billing portal URL for the customer. */
export async function createPortalSession({
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}): Promise<PortalSession> {
  return commerceRequest<PortalSession>('GET', `/billing/portal?returnUrl=${encodeURIComponent(returnUrl)}`);
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

interface SubscriptionStatus {
  id: string;
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  priceId: string;
}

/** Get active subscription for a customer. */
export async function getSubscriptionStatus(customerId: string): Promise<SubscriptionStatus | null> {
  try {
    const subs = await commerceRequest<Array<{
      id: string;
      status: string;
      currentPeriodEnd: string;
      cancelAtPeriodEnd: boolean;
      planId: string;
    }>>('GET', `/subscribe?customerId=${encodeURIComponent(customerId)}&count=1`);

    if (!subs || subs.length === 0) {
      return null;
    }

    const sub = subs[0];
    return {
      id: sub.id,
      status: sub.status,
      currentPeriodEnd: new Date(sub.currentPeriodEnd),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd || false,
      priceId: sub.planId,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

interface FormattedInvoice {
  id: string;
  number: string | null;
  amount: number;
  status: string;
  date: Date;
  pdfUrl: string | null;
  hostedUrl: string | null;
  description: string | null;
  period: { start: Date; end: Date } | null;
}

/** List invoices for the current authenticated user. */
export async function getCustomerInvoices({
  limit = 10,
}: {
  customerId: string;
  limit?: number;
}): Promise<{ invoices: FormattedInvoice[]; hasMore: boolean }> {
  try {
    const invoices = await commerceRequest<Array<{
      id: string;
      subscriptionId?: string;
      amount: number;
      status: string;
      paidAt?: string;
      dueDate?: string;
      createdAt: string;
    }>>('GET', `/invoices?count=${limit}`);

    return {
      invoices: (invoices || []).map((inv) => ({
        id: inv.id,
        number: inv.id,
        amount: inv.amount / 100,
        status: inv.status,
        date: new Date(inv.createdAt),
        pdfUrl: null,
        hostedUrl: null,
        description: null,
        period: null,
      })),
      hasMore: invoices.length >= limit,
    };
  } catch {
    return { invoices: [], hasMore: false };
  }
}

// ---------------------------------------------------------------------------
// Credits
// ---------------------------------------------------------------------------

/** Get customer credit balance from Commerce. */
export async function getCustomerCredits(customerId: string): Promise<{ credits: number }> {
  try {
    const usage = await commerceRequest<{ messages: number; tokens: number; cost: number }>(
      'GET',
      '/usage',
    );
    // Credits are tracked as the inverse of cost in cents
    // The Commerce API returns usage; credit balance is managed via credit grants
    const grants = await commerceRequest<Array<{ remainingCents: number }>>(
      'GET',
      `/user/${encodeURIComponent(customerId)}/credits`,
    ).catch(() => []);

    const totalCredits = (grants || []).reduce((sum, g) => sum + (g.remainingCents || 0), 0);
    return { credits: Math.round(totalCredits / 100) };
  } catch {
    return { credits: 0 };
  }
}

/** Update customer credits (add/remove). */
export async function updateCustomerCredits({
  customerId,
  credits,
  action = 'set',
}: {
  customerId: string;
  credits: number;
  action?: 'set' | 'increment' | 'decrement';
}): Promise<{ credits: number }> {
  const result = await commerceRequest<{ remainingCents: number }>(
    'POST',
    `/user/${encodeURIComponent(customerId)}/credits`,
    {
      amountCents: credits * 100,
      action,
    },
  );

  return { credits: Math.round(result.remainingCents / 100) };
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

import { createHmac, timingSafeEqual } from 'crypto';

/** Verify a Commerce webhook signature and return the parsed event. */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
): { id: string; type: string; data: Record<string, unknown> } {
  if (!COMMERCE_WEBHOOK_SECRET) {
    throw new Error('Commerce webhook secret not configured');
  }

  // Hanzo Commerce webhooks use HMAC-SHA256: timestamp.payload signed with secret
  const parts = parseSignatureHeader(signature);
  const timestamp = parts['t'];
  const sig = parts['v1'];

  if (!timestamp || !sig) {
    throw new Error('Invalid webhook signature header');
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac('sha256', COMMERCE_WEBHOOK_SECRET)
    .update(signedPayload)
    .digest('hex');

  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error('Webhook signature verification failed');
  }

  // Check timestamp tolerance (5 minutes)
  const ts = parseInt(timestamp, 10);
  if (Date.now() / 1000 - ts > 300) {
    throw new Error('Webhook timestamp too old');
  }

  return JSON.parse(payload);
}

function parseSignatureHeader(header: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of header.split(',')) {
    const [key, ...rest] = part.split('=');
    if (key && rest.length > 0) {
      result[key.trim()] = rest.join('=').trim();
    }
  }
  return result;
}
