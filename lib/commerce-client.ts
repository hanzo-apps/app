// Client-side Commerce utilities.
// No Stripe.js or third-party payment SDKs -- checkout redirects are handled
// server-side by the Commerce API which manages the Square payment flow.

/** Format a price for display. */
export function formatPrice(amount: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
