import { test, expect, Page } from '@playwright/test';

// Helper to wait and take screenshot
async function captureWidget(page: Page, name: string, waitTime: number = 1500) {
  await page.waitForTimeout(waitTime);
  await page.screenshot({ 
    path: `test-results/visual/widgets/${name}.png`,
    fullPage: true 
  });
  console.log(`✅ Captured widget: ${name}`);
}

// Helper to search and open widget
async function openWidget(page: Page, searchTerm: string, widgetName: string) {
  // Clear search and type new term
  const searchInput = page.locator('input[type="text"]').first();
  await searchInput.click();
  await searchInput.clear();
  await searchInput.type(searchTerm);
  await page.waitForTimeout(500);
  
  // Press Enter to open first result
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  
  // Capture the widget
  await captureWidget(page, widgetName);
  
  // Return to search
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
}

test.describe('Hanzo Widget Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 800, height: 600 });
    
    // Navigate to app
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForTimeout(3000);
    
    // Skip onboarding if present
    const hasOnboarding = await page.locator('text=Welcome to Hanzo AI').isVisible().catch(() => false);
    if (hasOnboarding) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }
  });

  test('Capture all widget views', async ({ page }) => {
    console.log('Starting widget capture...\n');
    
    // Create widgets directory
    await page.evaluate(() => {
      // This is just to ensure the test runs
    });
    
    // 1. Search Widget (default view)
    await captureWidget(page, '01-search-widget');
    
    // 2. Settings Widget
    console.log('\n📱 Testing Settings Widget...');
    await page.keyboard.press('Meta+Comma');
    await captureWidget(page, '02-settings-widget', 2000);
    
    // Navigate through settings tabs
    await page.keyboard.press('ArrowRight');
    await captureWidget(page, '02a-settings-translation');
    
    await page.keyboard.press('ArrowRight');
    await captureWidget(page, '02b-settings-shortcuts');
    
    await page.keyboard.press('ArrowRight');
    await captureWidget(page, '02c-settings-about');
    
    // Back to search
    await page.keyboard.press('Escape');
    
    // 3. AI Chat Widget
    console.log('\n🤖 Testing AI Chat Widget...');
    await openWidget(page, 'ai chat', '03-ai-chat-widget');
    
    // 4. Calendar Widget
    console.log('\n📅 Testing Calendar Widget...');
    await openWidget(page, 'calendar', '04-calendar-widget');
    
    // 5. Clipboard History Widget
    console.log('\n📋 Testing Clipboard Widget...');
    await openWidget(page, 'clipboard', '05-clipboard-widget');
    
    // 6. Emoji Picker Widget
    console.log('\n😊 Testing Emoji Widget...');
    await openWidget(page, 'emoji', '06-emoji-widget');
    
    // 7. File Search Widget
    console.log('\n📁 Testing File Search Widget...');
    await openWidget(page, 'file search', '07-file-search-widget');
    
    // 8. Process Manager Widget
    console.log('\n⚙️ Testing Process Manager Widget...');
    await openWidget(page, 'process', '08-process-widget');
    
    // 9. Scratchpad Widget
    console.log('\n📝 Testing Scratchpad Widget...');
    await openWidget(page, 'scratchpad', '09-scratchpad-widget');
    
    // 10. Translation Widget
    console.log('\n🌐 Testing Translation Widget...');
    await openWidget(page, 'translate', '10-translation-widget');
    
    // 11. Create Item Widget
    console.log('\n➕ Testing Create Item Widget...');
    await openWidget(page, 'create', '11-create-item-widget');
    
    console.log('\n✅ All widgets captured successfully!');
  });

  test('Test widget interactions', async ({ page }) => {
    console.log('Testing widget interactions...\n');
    
    // Test search functionality
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.type('calculator');
    await captureWidget(page, 'search-calculator-query');
    
    // Try math expression
    await searchInput.clear();
    await searchInput.type('2+2');
    await captureWidget(page, 'search-math-expression');
    
    // Test emoji search
    await searchInput.clear();
    await searchInput.type(':smile');
    await captureWidget(page, 'search-emoji-shortcode');
    
    console.log('✅ Interaction tests complete!');
  });

  test('Test keyboard navigation', async ({ page }) => {
    console.log('Testing keyboard navigation...\n');
    
    // Test arrow key navigation in search results
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.type('test');
    await page.waitForTimeout(500);
    
    // Navigate down
    await page.keyboard.press('ArrowDown');
    await captureWidget(page, 'navigation-arrow-down');
    
    // Navigate up
    await page.keyboard.press('ArrowUp');
    await captureWidget(page, 'navigation-arrow-up');
    
    // Test Tab to AI chat
    await searchInput.clear();
    await page.keyboard.press('Tab');
    await captureWidget(page, 'navigation-tab-to-ai', 2000);
    
    console.log('✅ Navigation tests complete!');
  });
});