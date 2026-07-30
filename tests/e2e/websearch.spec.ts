import { test, expect, type Page } from '@playwright/test';

/**
 * Chat-mode native web search: the composer's globe toggles search, a send
 * round-trips GET /v1/websearch?q=… and the reply renders as numbered source
 * pills + a cited answer ([n] markers matching the pills).
 *
 * The upstream (cloud /v1/websearch/search) needs a key or a real session, so
 * the app's own /v1/websearch route is mocked at the browser edge — the test
 * proves the CLIENT round-trip: query out, sources + citations rendered.
 */

const MOCK_RESULTS = {
  ok: true,
  query: 'hanzo ai',
  results: [
    {
      url: 'https://hanzo.ai',
      title: 'Hanzo AI — frontier AI cloud',
      snippet: 'Hanzo AI builds frontier AI and foundational models.',
    },
    {
      url: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
      title: 'Artificial intelligence - Wikipedia',
      snippet: 'AI is intelligence demonstrated by machines.',
    },
    {
      url: 'https://docs.hanzo.ai/models',
      title: 'Models — Hanzo Docs',
      snippet: 'The Zen model family powers Hanzo Cloud inference.',
    },
  ],
};

async function runSearch(page: Page): Promise<string> {
  let searchedUrl = '';
  await page.route(/\/v1\/websearch\?/, async (route) => {
    searchedUrl = route.request().url();
    await route.fulfill({ json: MOCK_RESULTS });
  });

  await page.goto('/chat');

  // Composer affordance: the globe toggles web search on.
  const globe = page.getByRole('button', { name: 'Search the web' });
  await expect(globe).toBeVisible();
  await globe.click();
  await expect(globe).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Web search on — results arrive as cited sources')).toBeVisible();

  // Send a query.
  const composer = page.getByPlaceholder('Search the web...');
  await composer.fill('hanzo ai');
  await composer.press('Enter');

  // Source pills: numbered, linking out, labeled by host.
  const sources = page.getByTestId('search-sources');
  await expect(sources).toBeVisible();
  const pills = sources.locator('a');
  await expect(pills).toHaveCount(3);
  await expect(pills.nth(0)).toContainText('hanzo.ai');
  await expect(pills.nth(0)).toHaveAttribute('href', 'https://hanzo.ai');
  await expect(pills.nth(1)).toContainText('en.wikipedia.org');

  // Cited answer: the claims carry [n] markers matching the pills.
  await expect(page.getByText('Here\'s what the web says about "hanzo ai"')).toBeVisible();
  await expect(
    page.getByText('Hanzo AI builds frontier AI and foundational models. [1]'),
  ).toBeVisible();
  await expect(page.getByText('AI is intelligence demonstrated by machines. [2]')).toBeVisible();

  return searchedUrl;
}

test.describe('Chat web search', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    // The /chat edge gate only checks cookie PRESENCE (liveness); local dev
    // grants the loopback session server-side. Stub it so the page renders.
    await context.addCookies([
      { name: 'hanzo_iam_access_token', value: 'e2e', url: baseURL ?? 'http://localhost:3000' },
    ]);
  });

  test('query round-trips /v1/websearch into source pills + cited answer (desktop)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const searchedUrl = await runSearch(page);
    expect(searchedUrl).toContain('/v1/websearch?q=hanzo%20ai');
  });

  test('query round-trips /v1/websearch into source pills + cited answer (390px)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const searchedUrl = await runSearch(page);
    expect(searchedUrl).toContain('/v1/websearch?q=hanzo%20ai');
  });
});
