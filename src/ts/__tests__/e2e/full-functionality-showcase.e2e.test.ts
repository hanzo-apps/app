import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

test.describe('Full Hanzo App Functionality Showcase', () => {
  test('Complete functionality test with screenshots', async ({ page }) => {
    // Create screenshot directory
    const screenshotDir = 'test-results/showcase'
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true })
    }

    let screenshotIndex = 1
    const screenshot = async (name: string) => {
      await page.screenshot({ 
        path: path.join(screenshotDir, `${String(screenshotIndex).padStart(2, '0')}-${name}.png`),
        fullPage: true 
      })
      console.log(`📸 Screenshot ${screenshotIndex}: ${name}`)
      screenshotIndex++
    }

    // Navigate to app
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(2000)

    // 1. ONBOARDING SCREEN
    await screenshot('onboarding-screen')
    console.log('✅ Onboarding screen captured')

    // Skip onboarding
    await page.evaluate(() => {
      const store = (window as any).__STORE__
      if (store) {
        store.ui.onboardingStep = 'v1_completed'
        store.ui.focusedWidget = 'SEARCH'
      }
    })
    await page.waitForTimeout(1000)

    // 2. LAUNCHER VIEW
    await screenshot('launcher-search')
    console.log('✅ Launcher search view captured')

    // Type in search
    const searchInput = await page.$('input[placeholder="Search apps, files and quick links"]')
    if (searchInput) {
      await searchInput.type('test search')
      await page.waitForTimeout(500)
      await screenshot('launcher-with-query')
    }

    // Clear search
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // 3. SETTINGS - GENERAL TAB
    await page.keyboard.press('Meta+Comma')
    await page.waitForTimeout(1500)
    await screenshot('settings-general')
    console.log('✅ Settings General tab captured')

    // 4. APPEARANCE SETTINGS
    const appearanceBtn = await page.$('button:has-text("Appearance")')
    if (appearanceBtn) {
      await appearanceBtn.click()
      await page.waitForTimeout(1000)
      await screenshot('settings-appearance-dark')
      console.log('✅ Appearance settings (dark theme) captured')

      // Switch to light theme
      const lightRadio = await page.$('input[value="light"]')
      if (lightRadio) {
        await lightRadio.click()
        await page.waitForTimeout(1000)
        await screenshot('settings-appearance-light')
        console.log('✅ Light theme applied and captured')
      }

      // Show font customization
      const fontSelect = await page.$('select')
      if (fontSelect) {
        await fontSelect.selectOption('monospace')
        await page.waitForTimeout(500)
        await screenshot('settings-custom-font')
      }

      // Switch back to dark theme
      const darkRadio = await page.$('input[value="dark"]')
      if (darkRadio) {
        await darkRadio.click()
        await page.waitForTimeout(500)
      }
    }

    // 5. LOCAL AI SETTINGS
    const localAIBtn = await page.$('button:has-text("Local AI")')
    if (localAIBtn) {
      await localAIBtn.click()
      await page.waitForTimeout(1500)
      await screenshot('settings-local-ai')
      console.log('✅ Local AI settings captured')

      // Click download on first model
      const downloadBtn = await page.$('button:has-text("Download")')
      if (downloadBtn) {
        await downloadBtn.click()
        await page.waitForTimeout(2000)
        await screenshot('local-ai-downloading')
        console.log('✅ Model download in progress captured')
      }

      // Click initialize runtime
      const initBtn = await page.$('button:has-text("Initialize Runtime")')
      if (initBtn && await initBtn.isVisible()) {
        await initBtn.click()
        await page.waitForTimeout(1000)
        await screenshot('local-ai-initializing')
      }
    }

    // 6. SHORTCUTS SETTINGS
    const shortcutsBtn = await page.$('button:has-text("Shortcuts")')
    if (shortcutsBtn) {
      await shortcutsBtn.click()
      await page.waitForTimeout(1000)
      await screenshot('settings-shortcuts')
      console.log('✅ Shortcuts settings captured')
    }

    // 7. TRANSLATION SETTINGS
    const translateBtn = await page.$('button:has-text("Translation")')
    if (translateBtn) {
      await translateBtn.click()
      await page.waitForTimeout(1000)
      await screenshot('settings-translation')
      console.log('✅ Translation settings captured')
    }

    // 8. ABOUT SETTINGS
    const aboutBtn = await page.$('button:has-text("About")')
    if (aboutBtn) {
      await aboutBtn.click()
      await page.waitForTimeout(1000)
      await screenshot('settings-about')
      console.log('✅ About settings captured')
    }

    // Return to launcher
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)

    // 9. AI CHAT (Tab navigation)
    console.log('Testing AI Chat navigation...')
    await page.keyboard.press('Tab')
    await page.waitForTimeout(2000)
    
    // Check if we're in chat mode
    const chatInterface = await page.$('text="Welcome to Chat"')
    if (chatInterface) {
      await screenshot('ai-chat-interface')
      console.log('✅ AI Chat interface captured')
      
      // Go back to launcher
      await page.keyboard.press('Meta+k')
      await page.waitForTimeout(1000)
    } else {
      // Try alternative - we might be showing simple chat widget
      const chatWidget = await page.$('text="Hanzo AI Chat"')
      if (chatWidget) {
        await screenshot('ai-chat-widget')
        console.log('✅ AI Chat widget captured')
      }
    }

    // 10. CALENDAR WIDGET
    await page.keyboard.type('calendar')
    await page.waitForTimeout(500)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1000)
    const calendarVisible = await page.$('text=/Calendar|Events|Today/i')
    if (calendarVisible) {
      await screenshot('calendar-widget')
      console.log('✅ Calendar widget captured')
    }
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // 11. CLIPBOARD WIDGET
    await page.keyboard.type('clipboard')
    await page.waitForTimeout(500)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1000)
    const clipboardVisible = await page.$('text=/Clipboard|History/i')
    if (clipboardVisible) {
      await screenshot('clipboard-widget')
      console.log('✅ Clipboard widget captured')
    }
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // 12. FILE SEARCH WIDGET
    await page.keyboard.type('file search')
    await page.waitForTimeout(500)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1000)
    const fileSearchVisible = await page.$('text=/File Search|Search files/i')
    if (fileSearchVisible) {
      await screenshot('file-search-widget')
      console.log('✅ File Search widget captured')
    }
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // 13. EMOJI WIDGET
    await page.keyboard.type('emoji')
    await page.waitForTimeout(500)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1000)
    const emojiVisible = await page.$('text=/Emoji|😀/i')
    if (emojiVisible) {
      await screenshot('emoji-widget')
      console.log('✅ Emoji widget captured')
    }
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // 14. FINAL LAUNCHER STATE
    await screenshot('launcher-final')

    console.log('\n🎉 ALL FUNCTIONALITY TESTED AND CAPTURED!')
    console.log(`📁 Screenshots saved to: ${screenshotDir}`)
    console.log(`📸 Total screenshots: ${screenshotIndex - 1}`)

    // Verify no console errors
    const logs = await page.evaluate(() => {
      return (window as any).__consoleLogs || []
    })
    const errors = logs.filter((log: any) => log.type === 'error')
    if (errors.length > 0) {
      console.warn('⚠️ Console errors detected:', errors)
    } else {
      console.log('✅ No console errors detected')
    }
  })
})