import { test, expect } from '@playwright/test';

test.describe('Visual State Check', () => {
  test('capture current UI state', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'screenshots/current-state-full.png',
      fullPage: true 
    });
    
    // Check what's visible
    const bodyContent = await page.content();
    console.log('Page title:', await page.title());
    console.log('Body has content:', bodyContent.length > 500);
    
    // Check for any visible text
    const textContent = await page.textContent('body');
    console.log('Visible text:', textContent?.substring(0, 200));
    
    // Check for search input
    const searchInput = await page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]').count();
    console.log('Search inputs found:', searchInput);
    
    // Check for any buttons or interactive elements
    const buttons = await page.locator('button').count();
    console.log('Buttons found:', buttons);
    
    // Check for AI Chat or tabs
    const tabs = await page.locator('[role="tab"], button:has-text("AI"), button:has-text("Chat")').count();
    console.log('Tabs found:', tabs);
    
    // Take screenshot of just the viewport
    await page.screenshot({ 
      path: 'screenshots/current-state-viewport.png'
    });
    
    // Check computed styles
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontFamily: styles.fontFamily
      };
    });
    console.log('Body styles:', bodyStyles);
    
    // Check for main app container
    const appContainer = await page.locator('#root, .app, [data-app], main').count();
    console.log('App containers found:', appContainer);
    
    // Force click anywhere to ensure app is loaded
    await page.click('body');
    await page.waitForTimeout(1000);
    
    // Take another screenshot after interaction
    await page.screenshot({ 
      path: 'screenshots/current-state-after-click.png'
    });
  });
});