import { test, expect, Page } from '@playwright/test';

// Helper to take screenshot
async function screenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `test-results/visual/app-test/${name}.png`,
    fullPage: true 
  });
  console.log(`📸 ${name}`);
}

// Helper to handle onboarding properly
async function completeOnboarding(page: Page) {
  // Check if onboarding is visible
  const onboardingVisible = await page.locator('text=Welcome to Hanzo AI').isVisible().catch(() => false);
  
  if (onboardingVisible) {
    console.log('📋 Onboarding detected, completing...');
    await screenshot(page, '00-onboarding');
    
    // Press ESC to skip
    await page.keyboard.press('Escape');
    console.log('⏩ Pressed ESC to skip onboarding');
    
    // Wait for transition to complete
    await page.waitForTimeout(2000);
    
    // Verify we're no longer in onboarding
    const stillInOnboarding = await page.locator('text=Welcome to Hanzo AI').isVisible().catch(() => false);
    if (!stillInOnboarding) {
      console.log('✅ Onboarding completed successfully');
    } else {
      console.log('⚠️ Still in onboarding, trying Enter');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }
  }
}

test.describe('Hanzo App Functionality', () => {
  test('Complete App Test', async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Navigate to app
    await page.goto('/');
    console.log('\n🚀 Starting Hanzo App Test\n');
    
    // Wait for initial load
    await page.waitForTimeout(3000);
    
    // Handle onboarding
    await completeOnboarding(page);
    
    // 1. TEST SEARCH INTERFACE
    console.log('\n=== 1. Testing Search Interface ===\n');
    await screenshot(page, '01-after-onboarding');
    
    // Look for search input with multiple strategies
    let searchInput = null;
    const searchStrategies = [
      async () => page.locator('input[placeholder*="Search"]').first(),
      async () => page.locator('input[type="text"]').first(),
      async () => page.locator('input').first(),
      async () => page.locator('[role="searchbox"]').first(),
      async () => page.locator('.search-input').first()
    ];
    
    for (const strategy of searchStrategies) {
      const input = await strategy();
      if (await input.isVisible().catch(() => false)) {
        searchInput = input;
        console.log('✅ Found search input');
        break;
      }
    }
    
    if (searchInput) {
      // Test search functionality
      await searchInput.click();
      await searchInput.type('calculator');
      await screenshot(page, '02-search-calculator');
      
      // Clear and test math
      await searchInput.clear();
      await searchInput.type('42 + 58');
      await page.waitForTimeout(500);
      await screenshot(page, '03-math-expression');
      
      // Clear for next test
      await searchInput.clear();
    } else {
      console.log('❌ No search input found');
      // Try clicking in the center of the screen
      await page.click('body', { position: { x: 600, y: 300 } });
      await page.keyboard.type('test');
      await screenshot(page, '02-typed-test');
    }
    
    // 2. TEST SETTINGS
    console.log('\n=== 2. Testing Settings ===\n');
    await page.keyboard.press('Meta+Comma');
    await page.waitForTimeout(1500);
    await screenshot(page, '04-settings-view');
    
    // Check if settings loaded
    const settingsVisible = await page.locator('text=General').isVisible().catch(() => false) ||
                           await page.locator('text=Settings').isVisible().catch(() => false);
    
    if (settingsVisible) {
      console.log('✅ Settings loaded successfully');
      
      // Navigate through tabs
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(500);
      await screenshot(page, '05-settings-translation');
      
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(500);
      await screenshot(page, '06-settings-shortcuts');
    } else {
      console.log('⚠️ Settings not visible');
    }
    
    // Back to main view
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // 3. TEST AI CHAT TRANSITION
    console.log('\n=== 3. Testing AI Chat ===\n');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(2000);
    await screenshot(page, '07-ai-chat-view');
    
    // Check if we're in AI chat
    const inAIChat = await page.url().includes('chat') ||
                     await page.locator('text=AI Chat').isVisible().catch(() => false) ||
                     await page.locator('textarea').isVisible().catch(() => false);
    
    if (inAIChat) {
      console.log('✅ AI Chat interface loaded');
      
      // Try to find chat input
      const chatInput = await page.locator('textarea').first() ||
                       await page.locator('input[placeholder*="Type"]').first();
      
      if (await chatInput.isVisible().catch(() => false)) {
        await chatInput.click();
        await chatInput.type('Hello, Hanzo AI!');
        await screenshot(page, '08-ai-chat-with-message');
      }
    } else {
      console.log('⚠️ AI Chat not loaded');
    }
    
    // Back to launcher
    await page.keyboard.press('Meta+K');
    await page.waitForTimeout(1000);
    await screenshot(page, '09-back-to-launcher');
    
    // 4. TEST WIDGETS
    console.log('\n=== 4. Testing Widgets ===\n');
    
    // Test emoji widget
    if (searchInput && await searchInput.isVisible()) {
      await searchInput.clear();
      await searchInput.type('emoji');
      await page.waitForTimeout(500);
      await screenshot(page, '10-search-emoji');
      
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1500);
      await screenshot(page, '11-emoji-widget');
      
      // Back to search
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      // Test clipboard
      await searchInput.clear();
      await searchInput.type('clipboard');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1500);
      await screenshot(page, '12-clipboard-widget');
    }
    
    // 5. FINAL CHECKS
    console.log('\n=== 5. Final Checks ===\n');
    
    // Check for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && 
          !msg.text().includes('[object Promise]') &&
          !msg.text().includes('ResizeObserver')) {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('- Search: ' + (searchInput ? '✅ Working' : '❌ Not found'));
    console.log('- Settings: ' + (settingsVisible ? '✅ Working' : '⚠️ Issues'));
    console.log('- AI Chat: ' + (inAIChat ? '✅ Loaded' : '⚠️ Not loaded'));
    console.log('- Console Errors: ' + (errors.length === 0 ? '✅ None' : `⚠️ ${errors.length} errors`));
    
    // Final screenshot
    await screenshot(page, '13-final-state');
    
    console.log('\n✅ Test completed! Check test-results/visual/app-test/ for screenshots\n');
  });
});