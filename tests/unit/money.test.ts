import { usd } from '@/lib/money';

// ONE money formatter, and it takes CENTS.
//
// There were four: `fmtUsd` written out identically in three components, `usd`
// in lib/plans.ts disagreeing with them about whether $20 keeps its cents, and
// a `formatPrice` nothing called that took DOLLARS — so `formatPrice(2000)`
// rendered "$2,000" beside `usd(2000)` rendering "$20". A second unit is a 100×
// error waiting for somebody to reach for the wrong name.

describe('usd', () => {
  it('takes cents, never dollars', () => {
    // The whole reason the deleted `formatPrice` was a hazard rather than a
    // duplicate: same shape of call, answer off by a hundred.
    expect(usd(2000)).toBe('$20.00');
    expect(usd(5)).toBe('$0.05');
    expect(usd(199_900)).toBe('$1999.00');
  });

  it('states the cents by default, because money that moved is exact', () => {
    // A wallet reading "$20" looks like an approximation of an amount that is
    // not approximate.
    expect(usd(2000)).toBe('$20.00');
    expect(usd(0)).toBe('$0.00');
  });

  it('trims a round amount only when asked — the marketing register', () => {
    expect(usd(2000, 'trim')).toBe('$20');
    expect(usd(0, 'trim')).toBe('$0');
    // Not round: the cents stay in both registers, or the number is wrong.
    expect(usd(2050, 'trim')).toBe('$20.50');
    expect(usd(2050)).toBe('$20.50');
  });

  it('puts the sign before the dollar, not inside the number', () => {
    // "$-5.00" is what a naive template produces and it reads as a typo.
    expect(usd(-500)).toBe('-$5.00');
    expect(usd(-2000, 'trim')).toBe('-$20');
  });

  it('renders a non-number as zero rather than "$NaN"', () => {
    // A balance that has not loaded is a real state, and "$NaN" on a wallet is
    // the kind of thing a customer screenshots.
    expect(usd(Number.NaN)).toBe('$0.00');
    expect(usd(Number.POSITIVE_INFINITY)).toBe('$0.00');
  });
});
