import { test, expect } from '@playwright/test';

test.describe('Hanzo App Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to match our app size
    await page.setViewportSize({ width: 800, height: 600 });
    
    // Navigate to the app
    await page.goto('http://localhost:5173');
    
    // Wait for app to load
    await page.waitForTimeout(2000);
  });

  test('capture all views', async ({ page }) => {
    // 1. Launcher View (default)
    await page.screenshot({ 
      path: 'screenshots/01-launcher-view.png',
      fullPage: true 
    });
    console.log('✅ Captured launcher view');
    
    """    // Click on AI Chat tab
    await page.waitForSelector('text=AI Chat', { timeout: 10000 });
    await page.click('text=AI Chat');
    await page.waitForTimeout(1000);""
    
    // 2. AI Chat View  
    await page.screenshot({ 
      path: 'screenshots/02-ai-chat-view.png',
      fullPage: true 
    });
    console.log('✅ Captured AI chat view');
    
    // Click on Logs tab
    await page.click('text=Logs');
    await page.waitForTimeout(1000);
    
    // 3. Logs View
    await page.screenshot({ 
      path: 'screenshots/03-logs-view.png',
      fullPage: true 
    });
    console.log('✅ Captured logs view');
    
    // Go back to launcher and test search
    await page.click('text=Launcher');
    await page.waitForTimeout(500);
    
    // Type in search
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.click();
    await searchInput.type('terminal');
    await page.waitForTimeout(500);
    
    // 4. Search Results
    await page.screenshot({ 
      path: 'screenshots/04-search-results.png',
      fullPage: true 
    });
    console.log('✅ Captured search results');
    
    // Clear search
    await searchInput.clear();
    
    // Test dark mode (should be default)
    await page.screenshot({ 
      path: 'screenshots/05-dark-mode.png',
      fullPage: true 
    });
    console.log('✅ Captured dark mode');
    
    console.log('\n✅ All screenshots captured! Check the screenshots/ directory');
  });
});