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
  /**
   * Which of the plan's published prices was chosen — the INDEX into the
   * catalog's `prices`, never an amount. 0 (the default) is the plan's base
   * price and is not sent.
   *
   * It travels exactly as the seat count does, and for the same reason: it is a
   * CHOICE, not money. commerce holds every price and refuses a level it did not
   * publish, so a hand-edited `level` can only ever select a different published
   * price — never invent one.
   */
  level?: number;
  /** Where pay returns the customer afterwards. Must be an allowlisted host. */
  returnUrl?: string;
}

/**
 * Whether a level is a real choice. Level 0 is the base price, which is what a
 * missing level already means, so sending it would put a parameter on every
 * checkout URL that changes nothing.
 */
function moved(level?: number): boolean {
  return level !== undefined && Number.isInteger(level) && level > 0;
}

/**
 * The in-app address of a plan the buyer has chosen: `/checkout?plan=pro`.
 *
 * A choice is a plan and a level — never an amount. That is what lets it ride
 * through sign-in in the open: it names nothing about money, nothing about the
 * person, and it means the same thing before and after. `/checkout` reads the
 * price from the catalog when the buyer arrives, so the address cannot go stale
 * and cannot be edited into a discount.
 */
export function checkoutPath({ plan, level }: { plan: string; level?: number }): string {
  const params = new URLSearchParams({ plan });
  if (moved(level)) params.set('level', String(level));
  return `/checkout?${params}`;
}

/**
 * Build the checkout URL for an intent. Throws on a non-positive or
 * non-finite amount: an ambiguous amount must refuse rather than send the
 * customer to a card form for an unknown sum.
 */
export function checkoutUrl({ amountUsd, plan, level, returnUrl }: CheckoutIntent): string {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    throw new RangeError(`checkout amount must be a positive dollar amount, got ${amountUsd}`);
  }

  const url = new URL('/confirm/card', PAY_ORIGIN);
  url.searchParams.set('amount', amountUsd.toFixed(2));
  if (plan) url.searchParams.set('plan', plan);
  if (moved(level)) url.searchParams.set('level', String(level));
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
