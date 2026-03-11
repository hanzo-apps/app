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
    
    // Click on AI Assistant
    await page.waitForSelector('text=AI Assistant', { timeout: 10000 });
    await page.click('text=AI Assistant');
    await page.waitForTimeout(1000);
    
    // 2. AI Chat View  
    await page.screenshot({ 
      path: 'screenshots/02-ai-chat-view.png',
      fullPage: true 
    });
    console.log('✅ Captured AI chat view');
    
    // Click on Terminal
    await page.click('text=Terminal');
    await page.waitForTimeout(1000);
    
    // 3. Logs View
    await page.screenshot({ 
      path: 'screenshots/03-logs-view.png',
      fullPage: true 
    });
    console.log('✅ Captured terminal view');
    
    // Click on Email
    await page.click('text=Email');
    await page.waitForTimeout(1000);
    
    // 4. Email View
    await page.screenshot({ 
      path: 'screenshots/04-email-view.png',
      fullPage: true 
    });
    console.log('✅ Captured email view');
    
    // Click on Contacts
    await page.click('text=Contacts');
    await page.waitForTimeout(1000);
    
    // 5. Contacts View
    await page.screenshot({ 
      path: 'screenshots/05-contacts-view.png',
      fullPage: true 
    });
    console.log('✅ Captured contacts view');
    
    // Click on Settings
    await page.click('text=Settings');
    await page.waitForTimeout(1000);
    
    // 6. Settings View
    await page.screenshot({ 
      path: 'screenshots/06-settings-view.png',
      fullPage: true 
    });
    console.log('✅ Captured settings view');
    
    // Overall app in dark mode (should be default)
    await page.screenshot({ 
      path: 'screenshots/07-dark-mode-overall.png',
      fullPage: true 
    });
    console.log('✅ Captured dark mode overall');
    
    console.log('\n✅ All screenshots captured! Check the screenshots/ directory');
  });
});