import { test, expect, type Page } from '@playwright/test';

/**
 * A buyer who picks Pro pays for Pro.
 *
 * Picking a plan while signed out used to send the buyer back to /pricing
 * afterwards, so the plan had to be picked a second time and the second pick
 * was a fresh one. The destination is now the checkout for the plan already
 * picked, and these pin that: the slug on the way out is the slug that was
 * pressed, for every tier — never the cheapest, never blank.
 *
 * IAM is not visited. The hand-off is stopped at the hop, so nothing here asks
 * hanzo.id for anything; what this app stored is read back on its own origin.
 */

// Marks every row this suite emits, so warehouse queries can leave them out.
const PRICING = '/pricing?utm_source=e2e&utm_medium=agent&utm_campaign=plan-carry';
const CHECKOUT = '/checkout?plan=pro&utm_source=e2e&utm_medium=agent&utm_campaign=plan-carry';

/** The personal ladder as the catalog publishes it — never a local list. */
async function ladder(page: Page): Promise<string[]> {
  const res = await page.request.get('/v1/billing/plans');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  const rows: { slug?: string; category?: string; contactSales?: boolean; price?: number }[] =
    Array.isArray(body) ? body : (body.plans ?? []);
  const personal = rows
    .filter((p) => p.slug && p.category === 'personal' && !p.contactSales && (p.price ?? 0) > 0)
    .map((p) => p.slug as string);
  expect(personal.length).toBeGreaterThan(1);
  return personal;
}

/**
 * Where this app would send the buyer after signing in. Read on the pricing
 * page: pressing sends the browser at IAM, and the answer belongs to this
 * origin whichever way that hop ended.
 */
async function destination(page: Page): Promise<string | null> {
  await page.goto(PRICING);
  return page.evaluate(() => window.localStorage.getItem('redirectAfterLogin'));
}

test.describe('a chosen plan survives sign-in', () => {
  test.beforeEach(async ({ page }) => {
    // Answer the hand-off here rather than at hanzo.id: nothing is asked of IAM,
    // and the hop still LANDS, so the next navigation is not racing a page that
    // never arrived.
    await page.route('https://hanzo.id/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<title>hand-off</title>' }),
    );
    await page.goto(PRICING);
    await page.evaluate(() => window.localStorage.removeItem('redirectAfterLogin'));
  });

  test('every tier carries its own slug to checkout', async ({ page }) => {
    for (const slug of await ladder(page)) {
      await page.goto(PRICING);
      await page.evaluate(() => window.localStorage.removeItem('redirectAfterLogin'));

      const card = page.getByTestId(`plan-${slug}`);
      await expect(card).toBeVisible();
      await card.getByRole('button', { name: 'Get started' }).click();
      await page.waitForURL(/hanzo\.id/);

      expect(await destination(page), `after pressing ${slug}`).toBe(`/checkout?plan=${slug}`);
    }
  });

  test('the destination is the checkout, never the list just used', async ({ page }) => {
    const [first] = await ladder(page);
    await page.getByTestId(`plan-${first}`).getByRole('button', { name: 'Get started' }).click();
    await page.waitForURL(/hanzo\.id/);
    expect(await destination(page)).not.toBe('/pricing');
  });

  test('checkout reached straight carries the plan through the same hand-off', async ({ page }) => {
    await page.goto(CHECKOUT);
    await page.waitForURL(/hanzo\.id/);
    expect(await destination(page)).toBe('/checkout?plan=pro');
  });
});
