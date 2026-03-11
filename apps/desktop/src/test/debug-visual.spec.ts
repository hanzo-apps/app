import { test, expect } from '@playwright/test';

test.describe('Debug Visual Issues', () => {
  test('check console errors and app state', async ({ page }) => {
    // Collect console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Collect page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });
    
    // Navigate to the app
    await page.goto('http://localhost:5173');
    
    // Wait for either app to load or timeout
    await page.waitForTimeout(5000);
    
    // Print console messages
    console.log('\n=== Console Messages ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    // Print page errors
    console.log('\n=== Page Errors ===');
    pageErrors.forEach(err => console.log(err));
    
    // Check if React root exists
    const hasReactRoot = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        exists: !!root,
        hasChildren: root ? root.children.length > 0 : false,
        innerHTML: root ? root.innerHTML.substring(0, 200) : null
      };
    });
    console.log('\n=== React Root ===');
    console.log(hasReactRoot);
    
    // Check for any visible content
    const bodyContent = await page.evaluate(() => {
      return {
        childCount: document.body.children.length,
        textContent: document.body.textContent?.trim().substring(0, 200),
        hasApp: !!document.querySelector('.app, [data-app], #app, main'),
        hasSidebar: !!document.querySelector('[class*="sidebar"], aside'),
        hasHanzoText: document.body.textContent?.includes('Hanzo')
      };
    });
    console.log('\n=== Body Content ===');
    console.log(bodyContent);
    
    // Check computed styles on body
    const bodyStyles = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.body);
      return {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        backgroundColor: styles.backgroundColor,
        color: styles.color
      };
    });
    console.log('\n=== Body Styles ===');
    console.log(bodyStyles);
    
    // Take screenshot with annotations
    await page.screenshot({ 
      path: 'screenshots/debug-state.png',
      fullPage: true 
    });
    
    // Try to find any React components
    const reactComponents = await page.evaluate(() => {
      const findReactComponent = (elem: Element): any => {
        for (const key in elem) {
          if (key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber')) {
            return true;
          }
        }
        return false;
      };
      
      const elements = document.querySelectorAll('*');
      let reactCount = 0;
      elements.forEach(el => {
        if (findReactComponent(el)) reactCount++;
      });
      
      return { reactComponentsFound: reactCount };
    });
    console.log('\n=== React Components ===');
    console.log(reactComponents);
    
    // Check network requests
    const failedRequests = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter((entry: any) => entry.responseStatus >= 400 || entry.responseStatus === 0)
        .map((entry: any) => ({
          name: entry.name,
          status: entry.responseStatus
        }));
    });
    console.log('\n=== Failed Network Requests ===');
    console.log(failedRequests);
  });
});