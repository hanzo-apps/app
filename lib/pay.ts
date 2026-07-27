/**
 * The ONE checkout path.
 *
 * hanzo.app never renders a card field, never holds a Square credential and
 * never speaks to a payment processor. `pay.hanzo.ai` is the single live Square
 * surface for the platform wallet: it runs the Square Web Payments SDK in the
 * browser, tokenizes the card, and posts the resulting single-use nonce to
 * commerce —
 *
 *   one-off top-up   POST /v1/billing/topup/token     credits the org ledger
 *   plan             POST /v1/billing/subscribe/card  vaults the card, charges
 *                                                     the first period at the
 *                                                     SERVER-AUTHORITATIVE plan
 *                                                     price, creates the sub
 *
 * Both are idempotent server-side (X-Idempotency-Key, else the single-use
 * nonce), and both resolve the wallet from the caller's own IAM identity. So we
 * hand off; we never re-implement. A second card form in this app would be a
 * second payment integration, a second place for money bugs to live, and a
 * second PCI surface.
 *
 * This module is deliberately pure URL construction: no fetch, no secret, no
 * state. That is the entire client-side contract with checkout.
 */

/** The live Square surface. Overridable only to point at a different deploy. */
export const PAY_ORIGIN = (
  process.env.NEXT_PUBLIC_HANZO_PAY_URL || 'https://pay.hanzo.ai'
).replace(/\/+$/, '');

export interface CheckoutIntent {
  /**
   * Amount in whole US dollars. For a plan this is the catalog price we showed
   * the customer — the server still charges its own authoritative price, so the
   * two must agree or the customer sees one number and pays another.
   */
  amountUsd: number;
  /**
   * Plan slug (`pro`, `team`, …). Present ⇒ a recurring card-on-file
   * subscription. Absent ⇒ a one-off top-up of `amountUsd`.
   */
  plan?: string;
  /** Where pay returns the customer afterwards. Must be an allowlisted host. */
  returnUrl?: string;
}

/**
 * Build the checkout URL for an intent. Throws on a non-positive or
 * non-finite amount: an ambiguous amount must refuse rather than send the
 * customer to a card form for an unknown sum.
 */
export function checkoutUrl({ amountUsd, plan, returnUrl }: CheckoutIntent): string {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    throw new RangeError(`checkout amount must be a positive dollar amount, got ${amountUsd}`);
  }

  const url = new URL('/confirm/card', PAY_ORIGIN);
  url.searchParams.set('amount', amountUsd.toFixed(2));
  if (plan) url.searchParams.set('plan', plan);
  if (returnUrl) url.searchParams.set('returnUrl', returnUrl);
  return url.toString();
}

/** Where checkout should return to — this app's billing page. */
export function billingReturnUrl(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/billing`;
}

/**
 * Send the browser to checkout. A full navigation, not `window.open`: a popup
 * is blocked whenever the click is not perfectly trusted, and a silently
 * blocked popup is exactly the "button does nothing" failure this replaces.
 */
export function goToCheckout(intent: CheckoutIntent): void {
  window.location.href = checkoutUrl(intent);
}
