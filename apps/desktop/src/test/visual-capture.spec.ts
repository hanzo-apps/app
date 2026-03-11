import { test } from '@playwright/test';

test.describe('Visual Capture', () => {
  test('capture current app state', async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // Navigate to the app
    await page.goto('http://localhost:5173');
    
    // Wait for app to load
    await page.waitForTimeout(3000);
    
    // Capture whatever is visible
    await page.screenshot({ 
      path: 'screenshots/current-state.png',
      fullPage: true 
    });
    
    console.log('✅ Captured current app state');
    
    // Try to find any clickable elements
    const clickableElements = await page.locator('button, [role="button"], a').all();
    console.log(`Found ${clickableElements.length} clickable elements`);
    
    // Log visible text content
    const textContent = await page.evaluate(() => document.body.innerText);
    console.log('Visible text:', textContent.substring(0, 200));
  });
});