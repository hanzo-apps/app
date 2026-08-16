/**
 * A plan sold at a chosen level, on this side of the wire.
 *
 * commerce publishes every price a plan is sold at and refuses a level it did
 * not publish. This app's job is narrower and worth pinning anyway: read the
 * ladder faithfully or not at all, and hand checkout the INDEX rather than an
 * amount. Both halves of that are how the number on the card and the number on
 * the card form come to be the same number.
 */
import { checkoutPath, checkoutUrl } from '@/lib/pay';

// normalize is module-private, so the ladder is exercised through fetchPlans —
// which is also the only way it is ever reached in the app.
import { fetchPlans, usd } from '@/lib/plans';

const MAX = {
  slug: 'max',
  name: 'Max',
  description: 'Enso orchestration.',
  price: 9900,
  priceAnnual: 8325,
  category: 'personal',
  features: ['Enso orchestration'],
  prices: [9900, 19900, 29900, 39900, 49900, 59900, 69900, 79900, 89900, 99900],
};

function serve(rows: unknown[]) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => rows,
  }) as unknown as typeof fetch;
}

describe('the price ladder off the catalog', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reads every published price, in order', async () => {
    serve([MAX]);
    const plans = await fetchPlans();
    expect(plans.get('max')?.prices).toEqual(MAX.prices);
    // The first position is the plan's own price, which is what makes an index
    // into this list mean the same thing here and at commerce.
    expect(plans.get('max')?.prices[0]).toBe(plans.get('max')?.price);
  });

  it('is empty for a plan sold at a single price', async () => {
    serve([{ slug: 'pro', price: 4900 }]);
    const plans = await fetchPlans();
    expect(plans.get('pro')?.prices).toEqual([]);
    expect(plans.get('pro')?.price).toBe(4900);
  });

  it('drops a ladder that does not start at the plan price', async () => {
    // The index is what checkout sends. A ladder whose first entry is not the
    // base price means this app and commerce disagree about what level 0 costs,
    // so the whole list is refused and the plan is sold at its one known price.
    serve([{ ...MAX, prices: [12345, 19900, 29900] }]);
    const plans = await fetchPlans();
    expect(plans.get('max')?.prices).toEqual([]);
    expect(plans.get('max')?.price).toBe(9900);
  });

  it('drops a ladder carrying anything that is not a positive number', async () => {
    for (const bad of [
      [9900, '19900', 29900],
      [9900, null, 29900],
      [9900, 0, 29900],
      [9900, -19900],
      [9900, Number.NaN],
      'nonsense',
    ]) {
      serve([{ ...MAX, prices: bad }]);
      const plans = await fetchPlans();
      expect(plans.get('max')?.prices).toEqual([]);
    }
  });

  it('renders the top of the ladder as whole dollars', () => {
    expect(usd(99900)).toBe('$999');
    expect(usd(9900)).toBe('$99');
  });
});

describe('handing the choice to checkout', () => {
  it('sends the level, never a level-derived price the server has to trust', () => {
    const url = new URL(checkoutUrl({ amountUsd: 299, plan: 'max', level: 2 }));
    expect(url.searchParams.get('plan')).toBe('max');
    expect(url.searchParams.get('level')).toBe('2');
    // The amount rides along as the number the customer was shown. commerce
    // re-derives what it charges from the level, so this is a display fact.
    expect(url.searchParams.get('amount')).toBe('299.00');
  });

  it('omits the level when the base price was chosen', () => {
    for (const level of [0, undefined]) {
      const url = new URL(checkoutUrl({ amountUsd: 99, plan: 'max', level }));
      expect(url.searchParams.has('level')).toBe(false);
    }
  });

  it('omits a level that is not a whole number, rather than sending junk', () => {
    for (const level of [1.5, Number.NaN, -1]) {
      const url = new URL(checkoutUrl({ amountUsd: 99, plan: 'max', level }));
      expect(url.searchParams.has('level')).toBe(false);
    }
  });
});

/**
 * The choice has to survive sign-in, because a buyer sent back to the price
 * list chooses again — and a second choice is a fresh one.
 */
describe('the address a choice is carried to', () => {
  it('names the plan, so the destination after signing in is that plan', () => {
    expect(checkoutPath({ plan: 'pro' })).toBe('/checkout?plan=pro');
  });

  it('carries the level with it', () => {
    expect(checkoutPath({ plan: 'max', level: 2 })).toBe('/checkout?plan=max&level=2');
  });

  it('reads the same as the pay URL about which levels are a real choice', () => {
    for (const level of [0, undefined, 1.5, Number.NaN, -1]) {
      expect(checkoutPath({ plan: 'max', level })).toBe('/checkout?plan=max');
    }
  });

  // No amount, no identity — just which plan. That is what makes it safe to put
  // in a URL that goes through IAM and back.
  it('says nothing about money or the person', () => {
    const path = checkoutPath({ plan: 'pro', level: 3 });
    expect(path).not.toMatch(/amount|price|\$|email|token|user/i);
  });

  // Same-origin, single-slash: a stored destination is checked before it is
  // followed, and this is the shape that passes.
  it('is an in-app path the login redirect will accept', () => {
    const path = checkoutPath({ plan: 'pro' });
    expect(path.startsWith('/')).toBe(true);
    expect(path.startsWith('//')).toBe(false);
    expect(path.startsWith('/\\')).toBe(false);
  });
});
