import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    // Try to access a protected route
    await page.goto('/dashboard');

    // Should be redirected to auth page
    await expect(page).toHaveURL(/auth|login|signin/i);
  });

  test('login page has required elements', async ({ page }) => {
    await page.goto('/auth');

    // Check for essential auth elements
    const authContainer = page.locator('[class*="auth"], [id*="auth"]').first();
    await expect(authContainer).toBeVisible();

    // Check for sign in button or link
    const signInButton = page.locator('button:has-text("Sign"), a:has-text("Sign")').first();
    await expect(signInButton).toBeVisible();
  });

  test('handles authentication errors gracefully', async ({ page }) => {
    await page.goto('/auth');

    // Mock API response for failed auth
    await page.route('**/api/auth/**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' }),
      });
    });

    // Try to authenticate (click sign in if available)
    const signInButton = page.locator('button:has-text("Sign in"), button:has-text("Login")');
    if (await signInButton.count() > 0) {
      await signInButton.first().click();

      // Should show error message or stay on auth page
      await expect(page).toHaveURL(/auth|login|signin/i);
    }
  });

  test('authenticated users can access protected routes', async ({ page, context }) => {
    // Set a mock auth cookie
    await context.addCookies([
      {
        name: 'hanzo-token',
        value: 'mock-auth-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Mock successful auth check
    await page.route('**/api/auth/check', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          user: {
            id: 'test-user',
            name: 'Test User',
            email: 'test@example.com',
          },
        }),
      });
    });

    // Navigate to a protected route
    await page.goto('/dashboard');

    // Should not be redirected to auth
    await expect(page).not.toHaveURL(/auth|login|signin/i);
  });

  test('logout clears authentication', async ({ page, context }) => {
    // Set initial auth cookie
    await context.addCookies([
      {
        name: 'hanzo-token',
        value: 'mock-auth-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/');

    // Look for logout button
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout"), a:has-text("Sign out")');

    if (await logoutButton.count() > 0) {
      // Mock logout API
      await page.route('**/api/auth/logout', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await logoutButton.first().click();

      // Check that cookie is cleared
      const cookies = await context.cookies();
      const authCookie = cookies.find(c => c.name === 'hanzo-token');
      expect(authCookie).toBeUndefined();
    }
  });

  test('auth state persists across page refreshes', async ({ page, context }) => {
    // Set auth cookie
    await context.addCookies([
      {
        name: 'hanzo-token',
        value: 'persistent-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Mock auth check
    await page.route('**/api/auth/check', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          user: { id: 'persistent-user', name: 'Persistent User' },
        }),
      });
    });

    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/auth|login|signin/i);

    // Refresh page
    await page.reload();

    // Should still be authenticated
    await expect(page).not.toHaveURL(/auth|login|signin/i);
  });

  test('handles session expiry', async ({ page }) => {
    await page.goto('/dashboard');

    // Mock expired session response
    await page.route('**/api/auth/check', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: false,
          message: 'Session expired',
        }),
      });
    });

    // Trigger auth check (reload or navigation)
    await page.reload();

    // Should redirect to auth
    await expect(page).toHaveURL(/auth|login|signin/i);
  });
});