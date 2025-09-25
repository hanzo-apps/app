import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Visual Regression Tests', () => {
  test('homepage visual consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for any animations to complete
    await page.waitForTimeout(1000);

    // Take Percy snapshot
    await percySnapshot(page, 'Homepage - Desktop');

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await percySnapshot(page, 'Homepage - Mobile');

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await percySnapshot(page, 'Homepage - Tablet');
  });

  test('dashboard visual consistency', async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([
      {
        name: 'hanzo-token',
        value: 'mock-auth-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await percySnapshot(page, 'Dashboard - Desktop');

    // Test responsive views
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await percySnapshot(page, 'Dashboard - Mobile');
  });

  test('auth page visual consistency', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await percySnapshot(page, 'Auth Page');
  });

  test('gallery page visual consistency', async ({ page }) => {
    await page.goto('/gallery');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await percySnapshot(page, 'Gallery - Desktop');

    // Test grid layout on different screen sizes
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    await percySnapshot(page, 'Gallery - Wide Screen');

    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await percySnapshot(page, 'Gallery - Mobile');
  });

  test('dark mode visual consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Toggle dark mode if available
    const darkModeToggle = page.locator('[aria-label*="theme"], [aria-label*="dark"], button:has-text("Dark")');

    if (await darkModeToggle.count() > 0) {
      await darkModeToggle.first().click();
      await page.waitForTimeout(1000);
      await percySnapshot(page, 'Homepage - Dark Mode');
    }
  });

  test('form states visual consistency', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Find a form input
    const input = page.locator('input[type="email"], input[type="text"]').first();

    if (await input.count() > 0) {
      // Focus state
      await input.focus();
      await percySnapshot(page, 'Form - Focused State');

      // Error state (trigger validation)
      await input.fill('invalid');
      await input.blur();
      await page.waitForTimeout(500);
      await percySnapshot(page, 'Form - Error State');

      // Filled state
      await input.fill('valid@example.com');
      await page.waitForTimeout(500);
      await percySnapshot(page, 'Form - Filled State');
    }
  });

  test('loading states visual consistency', async ({ page }) => {
    await page.goto('/');

    // Intercept API calls to simulate loading
    await page.route('**/api/**', async route => {
      await page.waitForTimeout(2000); // Simulate slow response
      await route.continue();
    });

    // Trigger a loading state (if available)
    const loadingTrigger = page.locator('button:has-text("Load"), button:has-text("Fetch")');

    if (await loadingTrigger.count() > 0) {
      const responsePromise = page.waitForResponse('**/api/**');
      await loadingTrigger.first().click();

      // Capture loading state
      await page.waitForTimeout(100);
      await percySnapshot(page, 'Loading State');

      await responsePromise;
    }
  });

  test('modal/dialog visual consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for buttons that might open modals
    const modalTriggers = await page.locator('button[aria-haspopup="dialog"], button:has-text("Open"), button:has-text("Show")').all();

    for (let i = 0; i < Math.min(modalTriggers.length, 2); i++) {
      const trigger = modalTriggers[i];
      await trigger.click();

      // Wait for modal to appear
      const dialog = page.locator('[role="dialog"], [class*="modal"], [class*="dialog"]');

      if (await dialog.count() > 0) {
        await dialog.first().waitFor({ state: 'visible' });
        await page.waitForTimeout(500);
        await percySnapshot(page, `Modal ${i + 1}`);

        // Close modal
        const closeButton = page.locator('[aria-label*="close"], button:has-text("Close")');
        if (await closeButton.count() > 0) {
          await closeButton.first().click();
          await page.waitForTimeout(500);
        }
      }
    }
  });
});