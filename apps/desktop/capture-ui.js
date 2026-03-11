const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173');
  
  console.log('Waiting for page load...');
  await page.waitForTimeout(5000);
  
  console.log('Taking screenshots...');
  await page.screenshot({ path: 'screenshots/ui-state-1.png', fullPage: true });
  
  // Try different selectors
  const selectors = [
    'input',
    'button', 
    '[role="tab"]',
    '.launcher',
    '#root',
    'main',
    '.app'
  ];
  
  for (const selector of selectors) {
    const count = await page.locator(selector).count();
    console.log(`${selector}: ${count} elements found`);
  }
  
  // Get page content
  const title = await page.title();
  console.log('Page title:', title);
  
  const bodyText = await page.textContent('body');
  console.log('Body text preview:', bodyText?.substring(0, 200).replace(/\s+/g, ' ').trim());
  
  // Check styles
  const styles = await page.evaluate(() => {
    return {
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
      rootBg: document.getElementById('root') ? window.getComputedStyle(document.getElementById('root')).backgroundColor : null,
      fonts: window.getComputedStyle(document.body).fontFamily
    };
  });
  console.log('Styles:', styles);
  
  await browser.close();
  console.log('Done! Check screenshots/ directory');
})();