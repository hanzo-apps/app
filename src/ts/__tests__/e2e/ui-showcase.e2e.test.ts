import { test, expect } from '@playwright/test';

test.describe('Hanzo App UI Showcase', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('domcontentloaded');
    
    // Skip onboarding
    const onboarding = await page.locator('text="Welcome to Hanzo AI"').isVisible();
    if (onboarding) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  });

  test('Complete UI showcase with sexy styling', async ({ page }) => {
    console.log('🎨 Showcasing Hanzo\'s Sexy UI');

    // 1. Launcher with search glow effect
    console.log('\n📱 1. Launcher View');
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'test-results/ui-showcase/01-launcher-sexy.png',
      fullPage: true
    });

    // Type to see search glow
    await page.keyboard.type('calculator');
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'test-results/ui-showcase/02-search-glow-effect.png',
      fullPage: true
    });

    // Clear search
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');

    // 2. Settings with glass morphism
    console.log('\n⚙️ 2. Settings View');
    await page.keyboard.press('Meta+Comma');
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'test-results/ui-showcase/03-settings-glass.png',
      fullPage: true
    });

    // 3. Appearance settings with sexy controls
    console.log('\n🎨 3. Appearance Settings');
    const appearanceTab = page.locator('text="Appearance"');
    if (await appearanceTab.isVisible()) {
      await appearanceTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: 'test-results/ui-showcase/04-appearance-sexy-controls.png',
        fullPage: true
      });

      // Show light theme
      const lightRadio = page.locator('input[type="radio"][name="theme"]').nth(1);
      await lightRadio.click();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: 'test-results/ui-showcase/05-light-theme.png',
        fullPage: true
      });

      // Show dark theme
      const darkRadio = page.locator('input[type="radio"][name="theme"]').nth(2);
      await darkRadio.click();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: 'test-results/ui-showcase/06-dark-theme.png',
        fullPage: true
      });

      // Show custom colors
      const customColorRadio = page.locator('input[type="radio"][name="colorScheme"]').nth(1);
      if (await customColorRadio.isVisible()) {
        await customColorRadio.click();
        await page.waitForTimeout(500);
        await page.screenshot({ 
          path: 'test-results/ui-showcase/07-custom-colors-panel.png',
          fullPage: true
        });
      }
    }

    // 4. Local AI settings
    console.log('\n🤖 4. Local AI Settings');
    const localAITab = page.locator('text="Local AI"');
    if (await localAITab.isVisible()) {
      await localAITab.click();
      await page.waitForTimeout(1000);
      
      // Scroll to show model cards
      const scrollContainer = page.locator('.overflow-y-auto').first();
      await scrollContainer.evaluate(el => el.scrollTop = 100);
      
      await page.screenshot({ 
        path: 'test-results/ui-showcase/08-local-ai-models.png',
        fullPage: true
      });

      // Initialize runtime for sexy button
      const initButton = page.locator('text="Initialize Runtime"');
      if (await initButton.isVisible()) {
        await initButton.hover();
        await page.waitForTimeout(300);
        await page.screenshot({ 
          path: 'test-results/ui-showcase/09-gradient-button-hover.png',
          fullPage: true
        });
      }
    }

    // 5. Go back to launcher and show widget hover effects
    console.log('\n✨ 5. Widget Hover Effects');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    await page.keyboard.type('app');
    await page.waitForTimeout(500);
    
    // Hover over first result
    const firstResult = page.locator('.widget-item').first();
    if (await firstResult.isVisible()) {
      await firstResult.hover();
      await page.waitForTimeout(300);
      await page.screenshot({ 
        path: 'test-results/ui-showcase/10-widget-hover-effect.png',
        fullPage: true
      });
    }

    // 6. AI Chat view
    console.log('\n💬 6. AI Chat View');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);
    
    // Check if we're in AI chat
    const chatInput = page.locator('input[placeholder*="Type"], textarea[placeholder*="Type"]').first();
    if (await chatInput.isVisible()) {
      await page.screenshot({ 
        path: 'test-results/ui-showcase/11-ai-chat-interface.png',
        fullPage: true
      });
    }

    console.log('\n🎉 UI Showcase Complete!');
    console.log('✅ Glass morphism effects');
    console.log('✅ Gradient buttons');
    console.log('✅ Search glow effect');
    console.log('✅ Sexy radio buttons');
    console.log('✅ Widget hover animations');
    console.log('✅ Beautiful theme switching');
  });
});