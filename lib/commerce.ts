// Server-side Hanzo Commerce client.
// All payment processing flows through the Hanzo Commerce API (api.hanzo.ai/v1),
// which supports Square as the fiat payment processor and multiple crypto backends.
//
// IAM-native, per-user, fail-closed:
//   Every user-scoped call is made AS the logged-in user by forwarding that
//   user's IAM access token (from the `hanzo_token` cookie via getUserSession()).
//   There is NO shared service/admin API key in this surface — Commerce is
//   already IAM-native and meters/credits the token's `sub`. A call with no
//   user token throws (fail-closed) rather than silently acting as an admin.
//   The only remaining server secret is the webhook HMAC secret (KMS-sourced),
//   used solely to VERIFY inbound webhooks — never as an identity.

const COMMERCE_API_URL = process.env.HANZO_COMMERCE_API_URL || 'https://api.hanzo.ai/v1';
const COMMERCE_WEBHOOK_SECRET = process.env.HANZO_COMMERCE_WEBHOOK_SECRET || '';

/**
 * Whether the Commerce integration is wired for this deployment. Gated on the
 * webhook secret (provisioned from KMS in prod) — the one server-side secret
 * the integration requires end-to-end. NOT gated on any admin API key: there
 * is none. Per-request authorization is the user's own IAM token.
 */
export function isCommerceConfigured(): boolean {
  return !!COMMERCE_WEBHOOK_SECRET;
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
// HTTP helper — per-user, fail-closed
// ---------------------------------------------------------------------------

/** Raised when a user-scoped Commerce call is attempted without an IAM token. */
export class CommerceAuthError extends Error {
  constructor(message = 'Commerce requires an authenticated user token') {
    super(message);
    this.name = 'CommerceAuthError';
  }
}

/**
 * Make a Commerce request AS the given user. `token` is the user's IAM access
 * token; it is forwarded verbatim as the bearer so Commerce attributes the
 * request to that user. An empty token fails closed.
 */
async function commerceRequest<T = unknown>(
  token: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  if (!token) {
    throw new CommerceAuthError();
  }

  const url = `${COMMERCE_API_URL}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
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

/**
 * Get or create the Commerce customer for the calling user. Runs as the user
 * (their IAM token), so Commerce resolves/creates the record keyed to the
 * token's `sub` — no cross-user lookups, no admin key.
 */
export async function getOrCreateCustomer({
  token,
  userId,
  email,
  name,
}: {
  token: string;
  userId: string;
  email: string;
  name?: string;
}): Promise<CommerceCustomer> {
  // Resolve the caller's own customer record first.
  try {
    const results = await commerceRequest<CommerceCustomer[]>(
      token,
      'GET',
      `/user?email=${encodeURIComponent(email)}&count=1`,
    );
    if (results && results.length > 0) {
      return results[0];
    }
  } catch (err) {
    if (err instanceof CommerceAuthError) throw err;
    // Customer not found -- create below
  }

  return commerceRequest<CommerceCustomer>(token, 'POST', '/user', {
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

/** Create a checkout session for subscription plans (as the user). */
export async function createCheckoutSession({
  token,
  customerId,
  priceId,
  mode = 'subscription',
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  token: string;
  customerId?: string;
  priceId: string;
  mode?: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<CheckoutSession> {
  return commerceRequest<CheckoutSession>(token, 'POST', '/checkout/charge', {
    customerId,
    planId: priceId,
    mode,
    successUrl,
    cancelUrl,
    paymentMethod: { type: 'card' },
    metadata,
  });
}

/** Create a checkout session for credit purchases (as the user). */
export async function createCreditsCheckoutSession({
  token,
  customerId,
  amount,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  token: string;
  customerId?: string;
  customerEmail?: string;
  amount: number;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<CheckoutSession> {
  return commerceRequest<CheckoutSession>(token, 'POST', '/checkout/charge', {
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

/** Get a billing portal URL for the calling user. */
export async function createPortalSession({
  token,
  returnUrl,
}: {
  token: string;
  customerId: string;
  returnUrl: string;
}): Promise<PortalSession> {
  return commerceRequest<PortalSession>(
    token,
    'GET',
    `/billing/portal?returnUrl=${encodeURIComponent(returnUrl)}`,
  );
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

/** Get active subscription for the calling user. */
export async function getSubscriptionStatus(
  token: string,
  customerId: string,
): Promise<SubscriptionStatus | null> {
  try {
    const subs = await commerceRequest<Array<{
      id: string;
      status: string;
      currentPeriodEnd: string;
      cancelAtPeriodEnd: boolean;
      planId: string;
    }>>(token, 'GET', `/subscribe?customerId=${encodeURIComponent(customerId)}&count=1`);

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
  } catch (err) {
    if (err instanceof CommerceAuthError) throw err;
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

/** List invoices for the calling user. */
export async function getCustomerInvoices({
  token,
  limit = 10,
}: {
  token: string;
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
    }>>(token, 'GET', `/invoices?count=${limit}`);

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
  } catch (err) {
    if (err instanceof CommerceAuthError) throw err;
    return { invoices: [], hasMore: false };
  }
}

// ---------------------------------------------------------------------------
// Credits
// ---------------------------------------------------------------------------

/** Get the calling user's credit balance from Commerce. */
export async function getCustomerCredits(
  token: string,
  customerId: string,
): Promise<{ credits: number }> {
  try {
    const grants = await commerceRequest<Array<{ remainingCents: number }>>(
      token,
      'GET',
      `/user/${encodeURIComponent(customerId)}/credits`,
    );

    const totalCredits = (grants || []).reduce((sum, g) => sum + (g.remainingCents || 0), 0);
    return { credits: Math.round(totalCredits / 100) };
  } catch (err) {
    if (err instanceof CommerceAuthError) throw err;
    return { credits: 0 };
  }
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
