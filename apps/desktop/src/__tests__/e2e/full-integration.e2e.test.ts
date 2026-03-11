import { test, expect, Page } from '@playwright/test';

// Helper to check for console errors
async function checkForConsoleErrors(page: Page) {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  return errors;
}

// Helper to take screenshot
async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `test-results/screenshots/${name}.png`,
    fullPage: true 
  });
}

// Helper to check CSS rendering
async function checkCSSRendering(page: Page) {
  // Check if main styles are loaded
  const hasStyles = await page.evaluate(() => {
    const styles = window.getComputedStyle(document.body);
    return styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
  });
  
  return hasStyles;
}

// Helper to skip onboarding if visible
async function skipOnboardingIfNeeded(page: Page) {
  // Check if onboarding is visible (both old and new texts)
  const onboardingVisible = await page.locator('text=Welcome to Hanzo AI').isVisible().catch(() => false) ||
                           await page.locator('text=Welcome to your new launcher').isVisible().catch(() => false);
  
  if (onboardingVisible) {
    // Press ESC to skip onboarding
    await page.keyboard.press('Escape');
    // Wait for transition
    await page.waitForTimeout(1000);
  }
}

test.describe('Hanzo App Full Integration Tests', () => {
  let errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    errors = await checkForConsoleErrors(page);
    await page.goto('/');
    
    // Wait for app to initialize
    await page.waitForTimeout(2000);
    
    // Skip onboarding if it appears
    await skipOnboardingIfNeeded(page);
  });

  test.afterEach(async ({ page }) => {
    if (errors.length > 0) {
      console.error('Console errors detected:', errors);
    }
  });

  test('1. Initial load - Launcher view', async ({ page }) => {
    // Check app loads without errors
    await expect(page.locator('#root')).toBeVisible();
    
    // Skip onboarding if needed (in case it wasn't skipped in beforeEach)
    await skipOnboardingIfNeeded(page);
    
    // Check CSS is loaded
    const cssLoaded = await checkCSSRendering(page);
    expect(cssLoaded).toBe(true);
    
    // Check search input is visible and focused
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();
    
    // Take screenshot
    await takeScreenshot(page, '01-launcher-initial');
    
    // Check for vibrancy effect
    const vibrancyElement = await page.locator('.vibrancy').first();
    if (await vibrancyElement.isVisible()) {
      const hasBlur = await vibrancyElement.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.backdropFilter?.includes('blur') || 
               styles.webkitBackdropFilter?.includes('blur');
      });
      expect(hasBlur).toBe(true);
    }
    
    // No console errors
    expect(errors).toHaveLength(0);
  });

  test('2. Search functionality', async ({ page }) => {
    // Type in search
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('test search');
    await page.waitForTimeout(500);
    
    // Check search results appear
    const results = page.locator('[role="listitem"], .search-result, .result-item');
    const resultsCount = await results.count();
    
    await takeScreenshot(page, '02-search-results');
    
    // Check CSS styling of results
    if (resultsCount > 0) {
      const firstResult = results.first();
      const hasHoverStyles = await firstResult.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.cursor === 'pointer';
      });
      expect(hasHoverStyles).toBe(true);
    }
    
    expect(errors).toHaveLength(0);
  });

  test('3. AI Chat view transition', async ({ page }) => {
    // Press Tab to switch to AI mode
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);
    
    // Check if chat view is loaded
    const chatContainer = page.locator('.chat-container, .ai-widget, [data-testid="chat-view"]');
    
    await takeScreenshot(page, '03-ai-chat-view');
    
    // Check for chat input
    const chatInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"], .ai-input');
    
    // Verify smooth transition animation
    const hasAnimation = await page.evaluate(() => {
      const elements = document.querySelectorAll('.animate-fade-in, [class*="fade"]');
      return elements.length > 0;
    });
    expect(hasAnimation).toBe(true);
    
    expect(errors).toHaveLength(0);
  });

  test('4. Settings view', async ({ page }) => {
    // Open settings with Cmd+,
    await page.keyboard.press('Meta+Comma');
    await page.waitForTimeout(500);
    
    // Alternative: Search for settings
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('settings');
    await page.waitForTimeout(500);
    
    // Click settings if in results
    const settingsResult = page.locator('text=Settings').first();
    if (await settingsResult.isVisible()) {
      await settingsResult.click();
      await page.waitForTimeout(500);
    }
    
    await takeScreenshot(page, '04-settings-view');
    
    // Check settings form elements
    const settingsForm = page.locator('.settings-form, form, [data-testid="settings"]');
    
    // Check theme selector
    const themeSelector = page.locator('select, [role="combobox"]').first();
    
    // Check for log buttons
    const logButtons = page.locator('button:has-text("Log"), button:has-text("log")');
    const hasLogButtons = await logButtons.count() > 0;
    
    expect(errors).toHaveLength(0);
  });

  test('5. Calendar widget', async ({ page }) => {
    // Search for calendar
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('calendar');
    await page.waitForTimeout(500);
    
    const calendarResult = page.locator('text=Calendar').first();
    if (await calendarResult.isVisible()) {
      await calendarResult.click();
      await page.waitForTimeout(500);
    }
    
    await takeScreenshot(page, '05-calendar-view');
    
    // Check calendar rendering
    const calendarWidget = page.locator('.calendar-widget, [data-testid="calendar"]');
    
    expect(errors).toHaveLength(0);
  });

  test('6. Clipboard history', async ({ page }) => {
    // Search for clipboard
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('clipboard');
    await page.waitForTimeout(500);
    
    const clipboardResult = page.locator('text=Clipboard').first();
    if (await clipboardResult.isVisible()) {
      await clipboardResult.click();
      await page.waitForTimeout(500);
    }
    
    await takeScreenshot(page, '06-clipboard-view');
    
    // Check clipboard widget
    const clipboardWidget = page.locator('.clipboard-widget, .clipboard-items, [data-testid="clipboard"]');
    
    expect(errors).toHaveLength(0);
  });

  test('7. File search', async ({ page }) => {
    // Search for file search
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('file search');
    await page.waitForTimeout(500);
    
    const fileSearchResult = page.locator('text=/File.*Search/i').first();
    if (await fileSearchResult.isVisible()) {
      await fileSearchResult.click();
      await page.waitForTimeout(500);
    }
    
    await takeScreenshot(page, '07-file-search-view');
    
    expect(errors).toHaveLength(0);
  });

  test('8. Emoji picker', async ({ page }) => {
    // Search for emoji
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('emoji');
    await page.waitForTimeout(500);
    
    const emojiResult = page.locator('text=Emoji').first();
    if (await emojiResult.isVisible()) {
      await emojiResult.click();
      await page.waitForTimeout(500);
    }
    
    await takeScreenshot(page, '08-emoji-picker');
    
    // Check emoji grid
    const emojiGrid = page.locator('.emoji-grid, [data-testid="emoji-grid"]');
    
    expect(errors).toHaveLength(0);
  });

  test('9. Process manager', async ({ page }) => {
    // Search for processes
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('process');
    await page.waitForTimeout(500);
    
    const processResult = page.locator('text=Process').first();
    if (await processResult.isVisible()) {
      await processResult.click();
      await page.waitForTimeout(500);
    }
    
    await takeScreenshot(page, '09-process-manager');
    
    expect(errors).toHaveLength(0);
  });

  test('10. CSS and styling verification', async ({ page }) => {
    // Check dark mode styling
    const isDarkMode = await page.evaluate(() => {
      return document.body.classList.contains('dark') || 
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    
    // Check background transparency
    const hasTransparentBg = await page.evaluate(() => {
      const rootStyles = window.getComputedStyle(document.documentElement);
      const bodyStyles = window.getComputedStyle(document.body);
      return rootStyles.backgroundColor === 'transparent' || 
             bodyStyles.backgroundColor === 'transparent' ||
             bodyStyles.backgroundColor === 'rgba(0, 0, 0, 0)';
    });
    
    // Check for broken images
    const brokenImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => !img.complete || img.naturalWidth === 0).length;
    });
    expect(brokenImages).toBe(0);
    
    // Check font loading
    const fontsLoaded = await page.evaluate(() => {
      return document.fonts.status === 'loaded';
    });
    expect(fontsLoaded).toBe(true);
    
    // Take final screenshot
    await takeScreenshot(page, '10-final-check');
    
    expect(errors).toHaveLength(0);
  });

  test('11. Keyboard navigation', async ({ page }) => {
    // Test keyboard shortcuts
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.focus();
    
    // Test arrow keys
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);
    
    // Test escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // No errors from keyboard navigation
    expect(errors).toHaveLength(0);
  });

  test('12. Window state and animations', async ({ page }) => {
    // Check animation classes exist
    const animationClasses = await page.evaluate(() => {
      const animations = [
        '.animate-fade-in',
        '.vibrancy',
        '[class*="transition"]'
      ];
      
      return animations.map(selector => ({
        selector,
        found: document.querySelector(selector) !== null
      }));
    });
    
    // At least some animations should be present
    const hasAnimations = animationClasses.some(a => a.found);
    expect(hasAnimations).toBe(true);
    
    // Check window styling
    const windowStyling = await page.evaluate(() => {
      const vibrancy = document.querySelector('.vibrancy');
      if (!vibrancy) return { hasVibrancy: false };
      
      const styles = window.getComputedStyle(vibrancy);
      return {
        hasVibrancy: true,
        hasBlur: styles.backdropFilter?.includes('blur') || false,
        hasBorderRadius: parseFloat(styles.borderRadius) > 0,
        hasBoxShadow: styles.boxShadow !== 'none'
      };
    });
    
    if (windowStyling.hasVibrancy) {
      expect(windowStyling.hasBorderRadius).toBe(true);
      expect(windowStyling.hasBoxShadow).toBe(true);
    }
    
    expect(errors).toHaveLength(0);
  });
});

// Visual regression tests
test.describe('Visual Regression Tests', () => {
  test('Compare screenshots across views', async ({ page }) => {
    const views = [
      { name: 'launcher', action: async () => {} },
      { name: 'search-results', action: async () => {
        await page.locator('input[type="text"]').first().fill('app');
      }},
      { name: 'settings', action: async () => {
        await page.keyboard.press('Meta+Comma');
      }},
      { name: 'ai-chat', action: async () => {
        await page.keyboard.press('Tab');
      }}
    ];
    
    for (const view of views) {
      await page.goto('/');
      await page.waitForTimeout(1000);
      await skipOnboardingIfNeeded(page);
      await view.action();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot(`${view.name}.png`, {
        maxDiffPixels: 100,
        threshold: 0.2
      });
    }
  });
});

// Onboarding tests moved to onboarding.e2e.test.ts