/**
 * Money, in cents, rendered once.
 *
 * There were four of these: `fmtUsd` written out three times identically in
 * three components, `usd` in `lib/plans.ts` disagreeing with all of them about
 * whether $20 keeps its cents, and a `formatPrice` in `lib/commerce-client.ts`
 * with nothing calling it. So the same balance read "$20.00" in the workspace
 * menu and the same plan read "$20" on the pricing page — defensible apart,
 * arbitrary together, and nobody chose it.
 *
 * CENTS, always, and an integer. A dollars-taking formatter beside a
 * cents-taking one is a 100× error waiting for someone to reach for the wrong
 * name — `formatPrice(2000)` rendered "$2,000" where `usd(2000)` rendered "$20".
 * That one is deleted rather than converted: nothing called it, and a second
 * unit is the hazard whatever it is named.
 */

/** `exact` keeps the cents on a round amount: "$20.00". `trim` drops them: "$20". */
export type Cents = 'exact' | 'trim';

/**
 * "$20.00" / "$20", from an integer number of cents.
 *
 * `exact` is the default because most of what this app shows is a BALANCE or a
 * charge, and money that has moved is stated to the cent — "$20" for a wallet
 * reads like an approximation of an amount that is not approximate. A price on
 * a marketing page is the other case, and asks for `trim`.
 */
export function usd(cents: number, style: Cents = 'exact'): string {
  const safe = Number.isFinite(cents) ? cents : 0;
  const sign = safe < 0 ? '-' : '';
  const abs = Math.abs(safe);
  const whole = abs % 100 === 0;
  const body = style === 'trim' && whole ? String(abs / 100) : (abs / 100).toFixed(2);
  return `${sign}$${body}`;
}
