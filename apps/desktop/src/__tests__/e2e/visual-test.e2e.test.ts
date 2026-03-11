import { test, expect, Page } from '@playwright/test';

// Helper to wait and take screenshot
async function captureView(page: Page, name: string, waitTime: number = 1000) {
  await page.waitForTimeout(waitTime);
  await page.screenshot({ 
    path: `test-results/visual/${name}.png`,
    fullPage: true 
  });
  console.log(`✅ Captured: ${name}`);
}

// Helper to check if element exists
async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    const element = await page.locator(selector).first();
    return await element.isVisible({ timeout: 1000 });
  } catch {
    return false;
  }
}

test.describe('Hanzo App Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 800, height: 600 });
    
    // Navigate to app
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForTimeout(3000);
  });

  test('1. Capture all app states', async ({ page }) => {
    console.log('Starting visual capture of Hanzo app...');
    
    // 1. Initial state (might be onboarding)
    await captureView(page, '01-initial-state', 2000);
    
    // Check if we're in onboarding
    const hasOnboarding = await elementExists(page, 'text=Welcome to Hanzo AI') || 
                         await elementExists(page, 'text=Welcome to your new launcher');
    
    if (hasOnboarding) {
      console.log('Onboarding detected - capturing onboarding flow');
      
      // Capture onboarding screens
      await captureView(page, '02-onboarding-welcome');
      
      // Try to proceed through onboarding
      await page.keyboard.press('Enter');
      await captureView(page, '03-onboarding-step2', 1500);
      
      // Skip onboarding with ESC
      await page.keyboard.press('Escape');
      await captureView(page, '04-after-onboarding-skip', 1500);
    }
    
    // 2. Try to get to search view
    const hasSearchInput = await elementExists(page, 'input[type="text"]');
    if (hasSearchInput) {
      console.log('Search input found');
      await captureView(page, '05-search-view');
      
      // Type in search
      const searchInput = page.locator('input[type="text"]').first();
      await searchInput.click();
      await searchInput.type('test search');
      await captureView(page, '06-search-with-query');
      
      // Clear search
      await searchInput.clear();
    }
    
    // 3. Try keyboard shortcuts for different views
    console.log('Testing keyboard shortcuts...');
    
    // Settings (Cmd+,)
    await page.keyboard.press('Meta+Comma');
    await captureView(page, '07-settings-view', 1500);
    
    // Back to search (ESC)
    await page.keyboard.press('Escape');
    await captureView(page, '08-back-to-search');
    
    // 4. Try to access widgets via search
    const searchInput = page.locator('input[type="text"]').first();
    if (await searchInput.isVisible()) {
      // Calendar
      await searchInput.type('calendar');
      await captureView(page, '09-search-calendar');
      await page.keyboard.press('Enter');
      await captureView(page, '10-calendar-widget', 1500);
      await page.keyboard.press('Escape');
      
      // Clipboard
      await searchInput.clear();
      await searchInput.type('clipboard');
      await captureView(page, '11-search-clipboard');
      await page.keyboard.press('Enter');
      await captureView(page, '12-clipboard-widget', 1500);
      await page.keyboard.press('Escape');
      
      // Emoji picker
      await searchInput.clear();
      await searchInput.type('emoji');
      await captureView(page, '13-search-emoji');
      await page.keyboard.press('Enter');
      await captureView(page, '14-emoji-widget', 1500);
      await page.keyboard.press('Escape');
    }
    
    // 5. Check for any visible errors
    const bodyText = await page.locator('body').textContent();
    console.log('\n📋 Page content summary:');
    console.log(bodyText?.substring(0, 200) + '...');
    
    // 6. Check console for errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(1000);
    
    if (consoleErrors.length > 0) {
      console.log('\n⚠️  Console errors found:');
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('\n✅ No console errors');
    }
    
    // 7. Final state
    await captureView(page, '15-final-state');
    
    console.log('\n✅ Visual test complete! Check test-results/visual/ for screenshots');
  });

  test('2. Test glass morphism effects', async ({ page }) => {
    // Check if vibrancy effects are visible
    const vibrancyElement = page.locator('.vibrancy').first();
    
    if (await vibrancyElement.isVisible()) {
      const hasBlurEffect = await vibrancyElement.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.backdropFilter?.includes('blur') || 
               styles.webkitBackdropFilter?.includes('blur');
      });
      
      console.log('Glass morphism blur effect:', hasBlurEffect ? '✅ Active' : '❌ Not found');
      
      // Take close-up of vibrancy effect
      await vibrancyElement.screenshot({ 
        path: 'test-results/visual/glass-morphism-effect.png' 
      });
    }
  });
});