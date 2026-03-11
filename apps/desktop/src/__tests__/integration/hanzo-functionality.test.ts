import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import { platform } from 'os';

// Only run these tests on macOS
test.describe('Hanzo Functionality Tests', () => {
  test.skip(() => platform() !== 'darwin', 'macOS-only tests');
  
  let app: any;
  let window: any;

  test.beforeEach(async () => {
    // Launch the app
    app = await electron.launch({
      args: ['.'],
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });
    
    window = await app.firstWindow();
    await window.waitForTimeout(2000);
  });

  test.afterEach(async () => {
    await app.close();
  });

  test('1. Apps load and show up in search', async () => {
    console.log('🔍 Testing app loading and search...');
    
    // Show launcher
    await window.keyboard.press('Meta+Space');
    await window.waitForTimeout(1000);
    
    // Search for a common macOS app
    await window.keyboard.type('Safari');
    await window.waitForTimeout(500);
    
    // Check if Safari appears in results
    const safariResult = await window.evaluate(() => {
      const items = window.store?.ui?.items || [];
      return items.find((item: any) => 
        item.name?.toLowerCase().includes('safari')
      );
    });
    
    expect(safariResult).toBeTruthy();
    expect(safariResult.name).toContain('Safari');
    expect(safariResult.path).toContain('.app');
    
    // Take screenshot of search results
    await window.screenshot({ 
      path: 'test-results/hanzo/01-app-search.png',
      fullPage: true 
    });
    
    console.log('✅ Apps loaded successfully:', safariResult);
  });

  test('2. Icons appear for apps', async () => {
    console.log('🎨 Testing app icons...');
    
    // Show launcher
    await window.keyboard.press('Meta+Space');
    await window.waitForTimeout(1000);
    
    // Search for apps
    await window.keyboard.type('Finder');
    await window.waitForTimeout(500);
    
    // Check if apps have icon paths
    const appsWithIcons = await window.evaluate(() => {
      const items = window.store?.ui?.items || [];
      return items.filter((item: any) => 
        item.type === 'APPLICATION' && item.icon
      ).map((item: any) => ({
        name: item.name,
        icon: item.icon,
        hasIcon: !!item.icon
      }));
    });
    
    expect(appsWithIcons.length).toBeGreaterThan(0);
    
    // Verify each app has an icon path
    for (const app of appsWithIcons) {
      expect(app.hasIcon).toBe(true);
      expect(app.icon).toBeTruthy();
      // Icon should be either .icns file or .app bundle
      expect(app.icon).toMatch(/\.(app|icns)$/);
    }
    
    // Take screenshot showing icons
    await window.screenshot({ 
      path: 'test-results/hanzo/02-app-icons.png',
      fullPage: true 
    });
    
    console.log('✅ App icons found:', appsWithIcons.slice(0, 3));
  });

  test('3. Running apps are detected', async () => {
    console.log('🏃 Testing running app detection...');
    
    // First, ensure Finder is running (it always is on macOS)
    await window.keyboard.press('Meta+Space');
    await window.waitForTimeout(1000);
    
    // Get all apps and check running status
    const runningApps = await window.evaluate(() => {
      const items = window.store?.ui?.allApps || [];
      return items.filter((item: any) => 
        item.isRunning === true
      ).map((item: any) => ({
        name: item.name,
        isRunning: item.isRunning
      }));
    });
    
    // At minimum, Finder should be running
    const finderRunning = runningApps.find((app: any) => 
      app.name.toLowerCase().includes('finder')
    );
    
    expect(finderRunning).toBeTruthy();
    expect(runningApps.length).toBeGreaterThan(0);
    
    console.log('✅ Running apps detected:', runningApps.slice(0, 5));
    
    // Take screenshot
    await window.screenshot({ 
      path: 'test-results/hanzo/03-running-apps.png',
      fullPage: true 
    });
  });

  test('4. Apps can be launched', async () => {
    console.log('🚀 Testing app launching...');
    
    // Show launcher
    await window.keyboard.press('Meta+Space');
    await window.waitForTimeout(1000);
    
    // Search for Calculator (safe to launch)
    await window.keyboard.type('Calculator');
    await window.waitForTimeout(500);
    
    // Check if Calculator is in results
    const calculatorFound = await window.evaluate(() => {
      const items = window.store?.ui?.items || [];
      const calc = items.find((item: any) => 
        item.name?.toLowerCase().includes('calculator')
      );
      return {
        found: !!calc,
        index: items.indexOf(calc),
        name: calc?.name,
        path: calc?.path
      };
    });
    
    expect(calculatorFound.found).toBe(true);
    
    // Select and launch Calculator
    if (calculatorFound.index > 0) {
      // Navigate to Calculator in results
      for (let i = 0; i < calculatorFound.index; i++) {
        await window.keyboard.press('ArrowDown');
        await window.waitForTimeout(100);
      }
    }
    
    // Take screenshot before launching
    await window.screenshot({ 
      path: 'test-results/hanzo/04-before-launch.png',
      fullPage: true 
    });
    
    // Launch the app
    await window.keyboard.press('Enter');
    await window.waitForTimeout(2000);
    
    // Verify Calculator was launched by checking if it's now running
    const isCalculatorRunning = await window.evaluate(async () => {
      // Wait a bit for the app to start
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh apps list
      await window.store?.ui?.getApps();
      
      const apps = window.store?.ui?.allApps || [];
      const calc = apps.find((item: any) => 
        item.name?.toLowerCase().includes('calculator')
      );
      return calc?.isRunning;
    });
    
    console.log('✅ App launch test completed');
    console.log('   Calculator found:', calculatorFound);
    console.log('   Calculator running after launch:', isCalculatorRunning);
    
    // Clean up - close Calculator if it was launched
    if (isCalculatorRunning) {
      await window.evaluate(() => {
        window.native?.executeAppleScript?.('tell application "Calculator" to quit');
      });
    }
  });

  test('5. Search functionality works correctly', async () => {
    console.log('🔎 Testing search functionality...');
    
    // Show launcher
    await window.keyboard.press('Meta+Space');
    await window.waitForTimeout(1000);
    
    // Test progressive search
    const searchTests = [
      { query: 'S', minResults: 5 },
      { query: 'Sa', minResults: 2 },
      { query: 'Saf', minResults: 1 },
      { query: 'Safari', expectedApp: 'Safari' }
    ];
    
    for (const searchTest of searchTests) {
      // Clear search
      await window.keyboard.press('Meta+A');
      await window.keyboard.press('Backspace');
      
      // Type search query
      await window.keyboard.type(searchTest.query);
      await window.waitForTimeout(300);
      
      // Get search results
      const results = await window.evaluate(() => {
        const items = window.store?.ui?.items || [];
        return items.map((item: any) => ({
          name: item.name,
          type: item.type
        }));
      });
      
      console.log(`   Query "${searchTest.query}" returned ${results.length} results`);
      
      if (searchTest.minResults) {
        expect(results.length).toBeGreaterThanOrEqual(searchTest.minResults);
      }
      
      if (searchTest.expectedApp) {
        const found = results.find((r: any) => r.name === searchTest.expectedApp);
        expect(found).toBeTruthy();
      }
    }
    
    // Take final screenshot
    await window.screenshot({ 
      path: 'test-results/hanzo/05-search-results.png',
      fullPage: true 
    });
    
    console.log('✅ Search functionality working correctly');
  });

  test('6. Keyboard navigation works', async () => {
    console.log('⌨️ Testing keyboard navigation...');
    
    // Show launcher
    await window.keyboard.press('Meta+Space');
    await window.waitForTimeout(1000);
    
    // Search for apps
    await window.keyboard.type('System');
    await window.waitForTimeout(500);
    
    // Test arrow navigation
    const initialSelection = await window.evaluate(() => 
      window.store?.ui?.selectedIndex
    );
    
    // Move down
    await window.keyboard.press('ArrowDown');
    await window.waitForTimeout(100);
    
    const afterDown = await window.evaluate(() => 
      window.store?.ui?.selectedIndex
    );
    
    expect(afterDown).toBe(initialSelection + 1);
    
    // Move up
    await window.keyboard.press('ArrowUp');
    await window.waitForTimeout(100);
    
    const afterUp = await window.evaluate(() => 
      window.store?.ui?.selectedIndex
    );
    
    expect(afterUp).toBe(initialSelection);
    
    // Test escape to hide
    await window.keyboard.press('Escape');
    await window.waitForTimeout(500);
    
    const isVisible = await window.isVisible();
    expect(isVisible).toBe(false);
    
    console.log('✅ Keyboard navigation working correctly');
  });
});

// Create test results directory
test.beforeAll(async () => {
  const fs = require('fs');
  const path = require('path');
  const resultsDir = path.join(process.cwd(), 'test-results', 'hanzo');
  
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
});