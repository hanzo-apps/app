import { test, expect, type Page } from '@playwright/test';

/**
 * /new deploy-hub + landing — critical-flow e2e.
 *
 * Runs against PLAYWRIGHT_BASE_URL (defaults to the local dev server via the
 * config webServer; point it at https://hanzo.app to verify the live deploy).
 *
 * The hub is auth-gated only client-side (middleware leaves `/new` public), so
 * we stub the same-origin BFF the page reads — `/v1/orgs` (org context) and
 * `/v1/git/accounts` (connected accounts) — to render the hub deterministically
 * without a real IAM session. Everything asserted here is pure client UI:
 * the composer's Build/Deploy toggle, the quick-start chips, the honest
 * "Connect a Git provider" CTA, the prompt→builder submit, and — the reason
 * this file exists — NO horizontal body scroll at a 390px phone width.
 */

const ORG_CTX = {
  orgs: [{ name: 'e2e', displayName: 'E2E', isPersonal: true }],
  currentOrg: 'e2e',
  homeOrg: 'e2e',
  isGlobalAdmin: false,
  needsOnboarding: false,
};

// GitHub not linked → the panel must show the honest Connect CTA, never fake rows.
const GIT_ACCOUNTS_DISCONNECTED = {
  connected: false,
  accounts: [],
  providers: [{ provider: 'gitlab', connectable: false }],
};

async function stubHubBff(page: Page) {
  await page.route('**/v1/orgs', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ORG_CTX) }),
  );
  await page.route('**/v1/git/accounts', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(GIT_ACCOUNTS_DISCONNECTED) }),
  );
}

const composer = (page: Page) => page.getByPlaceholder(/Describe the app you want/i);

function noBodyOverflow(page: Page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    return { scrollW: de.scrollWidth, clientW: de.clientWidth };
  });
}

test.describe('/new — deploy hub', () => {
  test.beforeEach(async ({ page }) => {
    await stubHubBff(page);
  });

  test('renders the composer + Import Git + Clone Template panels', async ({ page }) => {
    await page.goto('/new');
    await expect(composer(page)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Import Git Repository' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Clone a Template' })).toBeVisible();
    // The four quick-starts.
    for (const label of ['SaaS Dashboard', 'AI Chatbot', 'Landing Page', 'Internal Tool']) {
      await expect(page.getByRole('button', { name: label })).toBeVisible();
    }
  });

  test('composer toggles Build ↔ Deploy on a git URL', async ({ page }) => {
    await page.goto('/new');
    await composer(page).fill('a project management tool with a kanban board');
    // Plain text → BUILD.
    await expect(page.getByRole('button', { name: 'Build' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Deploy' })).toHaveCount(0);
    // Paste a repo URL → flips to DEPLOY.
    await composer(page).fill('https://github.com/hanzoai/app');
    await expect(page.getByRole('button', { name: 'Deploy' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Build' })).toHaveCount(0);
  });

  test('quick-start chip fills the composer and keeps Build', async ({ page }) => {
    await page.goto('/new');
    await page.getByRole('button', { name: 'AI Chatbot' }).click();
    await expect(composer(page)).toHaveValue(/AI chatbot app/i);
    await expect(page.getByRole('button', { name: 'Build' })).toBeVisible();
  });

  test('Import panel shows the honest Connect CTA when nothing is linked', async ({ page }) => {
    await page.goto('/new');
    await expect(page.getByRole('heading', { name: 'Connect a Git provider' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Connect GitHub/ })).toBeVisible();
    // The paste-URL fallback is always present; Import stays disabled until a valid URL.
    const paste = page.getByPlaceholder(/github\.com\/org\/repo/i);
    await expect(paste).toBeVisible();
    // exact: the panel also has an icon button titled "Import a project — …".
    const importBtn = page.getByRole('button', { name: 'Import', exact: true });
    await expect(importBtn).toBeDisabled();
    await paste.fill('https://github.com/hanzoai/app');
    await expect(importBtn).toBeEnabled();
  });

  test('prompt → Build submits toward the builder (never a dead click)', async ({ page }) => {
    await page.goto('/new');
    await composer(page).fill('a simple counter button');
    await page.getByRole('button', { name: 'Build' }).click();
    // /dev is edge-protected: an authed session lands on /dev?prompt=…, an anon
    // one is bounced to /login?redirect=%2Fdev. Either proves the composer fired.
    await page.waitForURL(/\/dev(\?|$)|\/login\?redirect=%2Fdev/, { timeout: 15000 });
    expect(page.url()).not.toContain('/new');
  });

  test('mobile 390px: no horizontal body scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/new');
    await expect(composer(page)).toBeVisible();
    const { scrollW, clientW } = await noBodyOverflow(page);
    expect(scrollW).toBeLessThanOrEqual(clientW + 1);
  });
});

test.describe('/ — landing', () => {
  // Structural pins, not marketing copy — the hero headline is a typewriter
  // that changes wording freely; the CONTRACT is: an h1 renders and the
  // build composer is usable above the fold.
  test('hero renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByPlaceholder(/./).first()).toBeVisible();
  });

  test('mobile 390px: no horizontal body scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    const { scrollW, clientW } = await noBodyOverflow(page);
    expect(scrollW).toBeLessThanOrEqual(clientW + 1);
  });
});
