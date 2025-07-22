import { test, expect, Page } from '@playwright/test';

// Helper to take screenshot with description
async function screenshot(page: Page, name: string, description: string = '') {
  await page.screenshot({ 
    path: `test-results/visual/basic/${name}.png`,
    fullPage: true 
  });
  console.log(`📸 ${name}: ${description || 'Screenshot taken'}`);
}

// Helper to wait for element with timeout
async function waitForElement(page: Page, selector: string, timeout: number = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    console.log(`⚠️ Element not found: ${selector}`);
    return false;
  }
}

test.describe('Hanzo Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 800, height: 600 });
    
    // Navigate to app
    await page.goto('/');
    console.log('🌐 Navigated to app');
    
    // Wait for app to load
    await page.waitForTimeout(3000);
    await screenshot(page, '00-initial-load', 'Initial app load');
    
    // Handle onboarding if present
    const onboardingTexts = [
      'Welcome to Hanzo AI',
      'Welcome to your new launcher',
      'Welcome to Hanzo'
    ];
    
    for (const text of onboardingTexts) {
      const hasOnboarding = await page.locator(`text=${text}`).isVisible().catch(() => false);
      if (hasOnboarding) {
        console.log('🎯 Onboarding detected, skipping...');
        await screenshot(page, '00a-onboarding', 'Onboarding screen');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
        break;
      }
    }
  });

  test('1. Basic Search Functionality', async ({ page }) => {
    console.log('\n=== Testing Basic Search ===\n');
    
    // Check what's visible on the page
    const bodyText = await page.locator('body').textContent();
    console.log('Page content preview:', bodyText?.substring(0, 200));
    
    // Try different selectors for search input
    const searchSelectors = [
      'input[type="text"]',
      'input[placeholder*="Search"]',
      'input[placeholder*="search"]',
      '[data-testid="search-input"]',
      '.search-input',
      'input'
    ];
    
    let searchInput = null;
    for (const selector of searchSelectors) {
      if (await waitForElement(page, selector, 2000)) {
        searchInput = page.locator(selector).first();
        console.log(`✅ Found search input with selector: ${selector}`);
        break;
      }
    }
    
    if (!searchInput) {
      console.log('❌ No search input found');
      await screenshot(page, '01-no-search-input', 'No search input found');
      return;
    }
    
    // Test search input
    await searchInput.click();
    await searchInput.clear();
    await searchInput.type('test');
    await screenshot(page, '02-search-test', 'Typed "test" in search');
    
    // Clear and try math
    await searchInput.clear();
    await searchInput.type('2+2');
    await page.waitForTimeout(500);
    await screenshot(page, '03-search-math', 'Math expression 2+2');
    
    // Clear search
    await searchInput.clear();
    await screenshot(page, '04-search-cleared', 'Search cleared');
  });

  test('2. Keyboard Navigation', async ({ page }) => {
    console.log('\n=== Testing Keyboard Navigation ===\n');
    
    // Try Cmd+, for settings
    console.log('Pressing Cmd+, for settings...');
    await page.keyboard.press('Meta+Comma');
    await page.waitForTimeout(1500);
    await screenshot(page, '05-cmd-comma', 'After Cmd+,');
    
    // Check if settings is visible
    const settingsVisible = await page.locator('text=Settings').isVisible().catch(() => false) ||
                           await page.locator('text=General').isVisible().catch(() => false);
    
    if (settingsVisible) {
      console.log('✅ Settings opened');
      
      // Try to navigate settings tabs
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(500);
      await screenshot(page, '06-settings-arrow-right', 'Settings tab navigation');
    } else {
      console.log('⚠️ Settings not visible');
    }
    
    // Press ESC to go back
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await screenshot(page, '07-after-escape', 'After pressing ESC');
  });

  test('3. Widget Access', async ({ page }) => {
    console.log('\n=== Testing Widget Access ===\n');
    
    // Find search input
    const searchInput = page.locator('input').first();
    const hasInput = await searchInput.isVisible().catch(() => false);
    
    if (!hasInput) {
      console.log('❌ No input found for widget search');
      return;
    }
    
    // Test calendar widget
    console.log('Searching for calendar...');
    await searchInput.click();
    await searchInput.clear();
    await searchInput.type('calendar');
    await screenshot(page, '08-search-calendar', 'Searching for calendar');
    
    // Try to open calendar
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    await screenshot(page, '09-calendar-widget', 'Calendar widget');
    
    // Back to search
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Test emoji widget
    console.log('Searching for emoji...');
    await searchInput.clear();
    await searchInput.type('emoji');
    await screenshot(page, '10-search-emoji', 'Searching for emoji');
    
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    await screenshot(page, '11-emoji-widget', 'Emoji widget');
  });

  test('4. Console Error Check', async ({ page }) => {
    console.log('\n=== Checking for Console Errors ===\n');
    
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore some known non-critical errors
        if (!text.includes('[object Promise]') && 
            !text.includes('ResizeObserver') &&
            !text.includes('favicon')) {
          errors.push(text);
        }
      }
    });
    
    // Navigate through the app
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);
    await screenshot(page, '12-after-tab', 'After pressing Tab');
    
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    if (errors.length > 0) {
      console.log('\n⚠️ Console errors found:');
      errors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('\n✅ No critical console errors');
    }
  });

  test('5. Glass Morphism Check', async ({ page }) => {
    console.log('\n=== Testing Glass Morphism Effects ===\n');
    
    // Look for vibrancy elements
    const vibrancyElements = await page.locator('.vibrancy').all();
    console.log(`Found ${vibrancyElements.length} vibrancy elements`);
    
    if (vibrancyElements.length > 0) {
      const firstVibrancy = vibrancyElements[0];
      const hasBlur = await firstVibrancy.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.backdropFilter?.includes('blur') || 
               styles.webkitBackdropFilter?.includes('blur');
      });
      
      console.log(`Glass morphism blur: ${hasBlur ? '✅ Active' : '❌ Not found'}`);
      
      await firstVibrancy.screenshot({ 
        path: 'test-results/visual/basic/13-glass-morphism.png' 
      });
    }
    
    // Final app state
    await screenshot(page, '14-final-state', 'Final app state');
    
    console.log('\n✅ Basic functionality test complete');
  });
});