import { test, expect, Page } from '@playwright/test';

async function screenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `test-results/visual/bypass/${name}.png`,
    fullPage: true 
  });
  console.log(`📸 ${name}`);
}

test.describe('Hanzo App - Bypass Onboarding', () => {
  test('Test app with onboarding bypassed', async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    
    console.log('\n🚀 Testing Hanzo App with onboarding bypass\n');
    
    // Navigate to app with onboarding already completed
    await page.addInitScript(() => {
      // Set localStorage to bypass onboarding
      localStorage.setItem('@ui.store', JSON.stringify({
        onboardingStep: 'v1_skipped',
        focusedWidget: 'SEARCH',
        globalShortcut: 'command',
        showWindowOn: 'screenWithFrontmost',
        calendarEnabled: true,
        showAllDayEvents: true,
        launchAtLogin: true,
        useBackgroundOverlay: true,
        mediaKeyForwardingEnabled: true,
        reduceTransparency: false
      }));
    });
    
    // Navigate to app
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForTimeout(3000);
    await screenshot(page, '01-initial-load-bypassed');
    
    // Check if we're in the search view
    const bodyText = await page.locator('body').textContent();
    console.log('Page content:', bodyText?.substring(0, 300));
    
    // Try to interact with the app
    console.log('\n=== Testing Search ===\n');
    
    // Click in the center to focus
    await page.click('body', { position: { x: 600, y: 400 } });
    await page.keyboard.type('hello world');
    await screenshot(page, '02-typed-hello-world');
    
    // Clear with Cmd+A and Delete
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Delete');
    
    // Try math
    await page.keyboard.type('100 / 5');
    await page.waitForTimeout(500);
    await screenshot(page, '03-math-expression');
    
    // Test settings
    console.log('\n=== Testing Settings ===\n');
    await page.keyboard.press('Meta+Comma');
    await page.waitForTimeout(1500);
    await screenshot(page, '04-settings');
    
    // Check if settings content is visible
    const settingsText = await page.locator('body').textContent();
    if (settingsText?.includes('General') || settingsText?.includes('Settings')) {
      console.log('✅ Settings loaded successfully');
    } else {
      console.log('⚠️ Settings content not visible');
    }
    
    // Back to search
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // Test Tab to AI
    console.log('\n=== Testing AI Chat Transition ===\n');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(2000);
    await screenshot(page, '05-after-tab');
    
    // Check URL or content for AI chat
    const url = page.url();
    console.log('Current URL:', url);
    
    if (url.includes('chat')) {
      console.log('✅ Successfully navigated to AI chat');
    } else {
      console.log('⚠️ Not in AI chat view');
    }
    
    // Final screenshot
    await screenshot(page, '06-final-state');
    
    console.log('\n✅ Test completed\n');
  });
  
  test('Test direct widget access', async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    
    console.log('\n🚀 Testing direct widget access\n');
    
    // Bypass onboarding and set initial widget
    await page.addInitScript(() => {
      localStorage.setItem('@ui.store', JSON.stringify({
        onboardingStep: 'v1_completed',
        focusedWidget: 'SEARCH',
        query: '',
        selectedIndex: 0
      }));
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Test accessing different widgets programmatically
    console.log('Testing widget navigation...');
    
    // Settings widget
    await page.evaluate(() => {
      // Try to trigger settings widget directly
      window.dispatchEvent(new KeyboardEvent('keydown', { 
        key: ',', 
        metaKey: true,
        bubbles: true 
      }));
    });
    await page.waitForTimeout(1000);
    await screenshot(page, '07-settings-direct');
    
    // Check visible elements
    const visibleElements = await page.evaluate(() => {
      const elements = [];
      document.querySelectorAll('*').forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.display !== 'none' && 
            styles.visibility !== 'hidden' && 
            el.textContent?.trim()) {
          elements.push({
            tag: el.tagName,
            text: el.textContent.substring(0, 50),
            className: el.className
          });
        }
      });
      return elements.slice(0, 20); // First 20 visible elements
    });
    
    console.log('\nVisible elements:');
    visibleElements.forEach(el => {
      console.log(`- ${el.tag}: "${el.text}" (${el.className})`);
    });
    
    console.log('\n✅ Direct widget test completed\n');
  });
});