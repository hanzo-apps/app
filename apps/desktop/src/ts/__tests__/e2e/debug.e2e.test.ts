import { test, expect } from '@playwright/test';

test.describe('Debug Tests', () => {
  test('Check app loads', async ({ page }) => {
    // Capture console messages
    const messages: string[] = [];
    page.on('console', msg => {
      messages.push(`${msg.type()}: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      messages.push(`ERROR: ${error.message}`);
    });
    
    // Go to page
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-full-page.png', fullPage: true });
    
    // Check if root element exists
    const root = await page.locator('#root');
    await expect(root).toBeVisible();
    
    // Check content
    const rootContent = await root.innerHTML();
    console.log('Root content length:', rootContent.length);
    
    // Check for any visible text
    const bodyText = await page.locator('body').textContent();
    console.log('Body text:', bodyText?.substring(0, 200));
    
    // Check CSS
    const hasStyles = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontFamily: styles.fontFamily,
        hasContent: document.body.innerHTML.length > 100
      };
    });
    
    console.log('Styles:', hasStyles);
    console.log('Console messages:', messages);
    
    // Check for React app
    const reactRoot = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        hasRoot: !!root,
        hasChildren: root ? root.children.length : 0,
        innerHTML: root ? root.innerHTML.substring(0, 200) : 'no root'
      };
    });
    
    console.log('React root:', reactRoot);
    
    // Look for search input
    const searchInputs = await page.locator('input').count();
    console.log('Input elements found:', searchInputs);
    
    // Try to find any elements with classes
    const elementsWithClasses = await page.evaluate(() => {
      const all = document.querySelectorAll('*[class]');
      return Array.from(all).slice(0, 10).map(el => ({
        tag: el.tagName,
        classes: el.className
      }));
    });
    
    console.log('Elements with classes:', elementsWithClasses);
    
    expect(messages.filter(m => m.includes('ERROR')).length).toBe(0);
  });
});