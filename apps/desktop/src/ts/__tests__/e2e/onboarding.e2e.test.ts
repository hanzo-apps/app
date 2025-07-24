import { test, expect } from '@playwright/test';

test.describe('Onboarding Tests', () => {
  test('Onboarding flow can be completed', async ({ browser }) => {
    // Create a fresh context to ensure onboarding shows
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check welcome screen
    await expect(page.locator('text=Welcome to Hanzo AI')).toBeVisible();
    await expect(page.locator('text=Your private AI assistant and productivity companion')).toBeVisible();
    
    // Continue through onboarding steps
    await page.keyboard.press('Enter'); // Go to local AI selection
    await page.waitForTimeout(500);
    
    // Check local AI selection screen
    await expect(page.locator('text=Choose Your Local AI Model')).toBeVisible();
    await expect(page.locator('text=Llama 3.2 (Recommended)')).toBeVisible();
    
    // Continue
    await page.keyboard.press('Enter'); // Go to Hanzo login
    await page.waitForTimeout(500);
    
    // Check login screen
    await expect(page.locator('text=Connect to Hanzo Cloud')).toBeVisible();
    await expect(page.locator('text=Sign in with Hanzo')).toBeVisible();
    
    // Continue
    await page.keyboard.press('Enter'); // Go to shortcuts
    await page.waitForTimeout(500);
    
    // Check shortcuts screen
    await expect(page.locator('text=Pick a global shortcut')).toBeVisible();
    
    // Continue
    await page.keyboard.press('Enter'); // Go to features
    await page.waitForTimeout(500);
    
    // Check features screen
    await expect(page.locator('text=Discover Hanzo Features')).toBeVisible();
    
    // Continue
    await page.keyboard.press('Enter'); // Go to quick actions
    await page.waitForTimeout(500);
    
    // Check quick actions screen
    await expect(page.locator('text=Here are some shortcuts to get you started')).toBeVisible();
    
    // Finish onboarding
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Should now be at search widget
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    
    await context.close();
  });
  
  test('Onboarding can be skipped with ESC', async ({ browser }) => {
    // Create a fresh context to ensure onboarding shows
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check onboarding is visible
    await expect(page.locator('text=Welcome to Hanzo AI')).toBeVisible();
    
    // Press ESC to skip
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Should now be at search widget
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    await expect(page.locator('text=Welcome to Hanzo AI')).not.toBeVisible();
    
    await context.close();
  });
  
  test('Onboarding state persists after completion', async ({ browser }) => {
    // First, complete onboarding
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    
    await page1.goto('/');
    await page1.waitForTimeout(2000);
    
    // Skip onboarding
    await page1.keyboard.press('Escape');
    await page1.waitForTimeout(500);
    
    // Close and create new context in same browser
    await context1.close();
    
    // Open app again in new context - onboarding should not show
    const context2 = await browser.newContext({
      storageState: undefined // Use default storage
    });
    const page2 = await context2.newPage();
    
    await page2.goto('/');
    await page2.waitForTimeout(2000);
    
    // Should go directly to search widget
    await expect(page2.locator('input[type="text"]').first()).toBeVisible();
    await expect(page2.locator('text=Welcome to Hanzo AI')).not.toBeVisible();
    
    await context2.close();
  });
});