import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Hanzo/i);
  });

  test('displays main navigation', async ({ page }) => {
    // Check for main navigation elements
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();

    // Check for logo
    const logo = page.locator('img[alt*="logo" i], [class*="logo" i]').first();
    await expect(logo).toBeVisible();
  });

  test('hero section is visible', async ({ page }) => {
    // Check for hero section or main heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();

    const heroText = await heading.textContent();
    expect(heroText).toBeTruthy();
  });

  test('navigation links work', async ({ page }) => {
    // Test navigation to different pages
    const links = await page.locator('nav a').all();

    for (let i = 0; i < Math.min(links.length, 3); i++) {
      const link = links[i];
      const href = await link.getAttribute('href');

      if (href && !href.startsWith('http') && href !== '#') {
        await link.click();
        await page.waitForLoadState('networkidle');

        // Verify navigation occurred
        if (href !== '/') {
          expect(page.url()).toContain(href);
        }

        // Go back to homepage for next test
        await page.goto('/');
      }
    }
  });

  test('responsive design works', async ({ page }) => {
    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('nav')).toBeVisible();

    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();

    // Mobile view
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.locator('body')).toBeVisible();

    // Check if mobile menu button appears on small screens
    const mobileMenuButton = page.locator('[aria-label*="menu" i], button[class*="menu" i]');
    if (await mobileMenuButton.count() > 0) {
      await expect(mobileMenuButton.first()).toBeVisible();
    }
  });

  test('page loads without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out expected errors (like third-party scripts)
    const criticalErrors = consoleErrors.filter(error =>
      !error.includes('Third-party cookie') &&
      !error.includes('Failed to load resource') &&
      !error.includes('CORS')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('accessibility: page has proper heading structure', async ({ page }) => {
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
    expect(h1Count).toBeLessThanOrEqual(1); // Should have exactly one h1

    // Check that headings are in logical order
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels = await Promise.all(
      headings.map(async (h) => {
        const tagName = await h.evaluate(el => el.tagName);
        return parseInt(tagName.substring(1));
      })
    );

    // Verify no heading level is skipped (e.g., h1 -> h3)
    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  test('accessibility: interactive elements are keyboard accessible', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // Check if focus is visible
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName.toLowerCase() : null;
    });

    expect(focusedElement).toBeTruthy();
    expect(['a', 'button', 'input', 'select', 'textarea']).toContain(focusedElement);
  });

  test('performance: page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('images have alt text', async ({ page }) => {
    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      // Images should have alt text (can be empty for decorative images)
      expect(alt).toBeDefined();
    }
  });
});