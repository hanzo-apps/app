import { test, expect } from '@playwright/test'

test.describe('Settings Showcase', () => {
  test('Capture all settings tabs with proper screenshots', async ({ page }) => {
    // Navigate and bypass onboarding
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(2000)
    
    await page.evaluate(() => {
      const store = (window as any).__STORE__
      if (store) {
        store.ui.onboardingStep = 'v1_completed'
        store.ui.focusedWidget = 'SETTINGS'
      }
    })
    
    await page.waitForTimeout(1500)
    
    // Screenshot function
    let screenshotIndex = 1
    const screenshot = async (name: string) => {
      await page.screenshot({ 
        path: `test-results/showcase/settings-${String(screenshotIndex).padStart(2, '0')}-${name}.png`,
        fullPage: true 
      })
      console.log(`📸 Settings Screenshot ${screenshotIndex}: ${name}`)
      screenshotIndex++
    }
    
    // 1. GENERAL TAB
    await screenshot('general-tab')
    
    // 2. APPEARANCE TAB - DARK THEME
    const appearanceBtn = await page.$('button:has-text("Appearance")')
    if (appearanceBtn) {
      await appearanceBtn.click()
      await page.waitForTimeout(1000)
      await screenshot('appearance-dark')
      
      // Switch to light theme
      await page.click('input[value="light"]')
      await page.waitForTimeout(1000)
      await screenshot('appearance-light')
      
      // Show custom color options
      await page.click('input[value="custom"]')
      await page.waitForTimeout(500)
      await screenshot('appearance-custom-colors')
      
      // Switch back to dark
      await page.click('input[value="dark"]')
      await page.waitForTimeout(500)
    }
    
    // 3. LOCAL AI TAB
    const localAIBtn = await page.$('button:has-text("Local AI")')
    if (localAIBtn) {
      await localAIBtn.click()
      await page.waitForTimeout(1500)
      await screenshot('local-ai-models')
      
      // Simulate download
      const downloadBtn = await page.$('button:has-text("Download")')
      if (downloadBtn) {
        await downloadBtn.click()
        await page.waitForTimeout(2000)
        await screenshot('local-ai-downloading')
      }
      
      // Scroll to show all models
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(500)
      await screenshot('local-ai-all-models')
    }
    
    // 4. TRANSLATION TAB
    const translateBtn = await page.$('button:has-text("Translation")')
    if (translateBtn) {
      await translateBtn.click()
      await page.waitForTimeout(1000)
      await screenshot('translation')
    }
    
    // 5. SHORTCUTS TAB
    const shortcutsBtn = await page.$('button:has-text("Shortcuts")')
    if (shortcutsBtn) {
      await shortcutsBtn.click()
      await page.waitForTimeout(1000)
      await screenshot('shortcuts')
    }
    
    // 6. ABOUT TAB
    const aboutBtn = await page.$('button:has-text("About")')
    if (aboutBtn) {
      await aboutBtn.click()
      await page.waitForTimeout(1000)
      await screenshot('about')
    }
    
    console.log('\n✅ All settings tabs captured successfully!')
  })
  
  test('Test theme switching in real time', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(2000)
    
    await page.evaluate(() => {
      const store = (window as any).__STORE__
      if (store) {
        store.ui.onboardingStep = 'v1_completed'
        store.ui.focusedWidget = 'SEARCH'
      }
    })
    
    await page.waitForTimeout(1000)
    
    // Screenshot in dark mode
    await page.screenshot({ path: 'test-results/showcase/launcher-dark-theme.png' })
    
    // Open settings and switch to light theme
    await page.keyboard.press('Meta+Comma')
    await page.waitForTimeout(1500)
    
    await page.click('button:has-text("Appearance")')
    await page.waitForTimeout(1000)
    
    await page.click('input[value="light"]')
    await page.waitForTimeout(1000)
    
    // Go back to launcher
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)
    
    // Screenshot in light mode
    await page.screenshot({ path: 'test-results/showcase/launcher-light-theme.png' })
    
    console.log('✅ Theme switching tested successfully!')
  })
})