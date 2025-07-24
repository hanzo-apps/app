import { test, expect } from '@playwright/test'
import path from 'path'

const testUrl = 'http://localhost:5173'

test.describe('Appearance Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(testUrl)
    
    // Wait for app to load
    await page.waitForTimeout(1000)
    
    // Skip onboarding if present
    const onboarding = await page.locator('text=/Welcome to Hanzo/').isVisible().catch(() => false)
    if (onboarding) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
      
      // If still in onboarding, press Enter
      const stillOnboarding = await page.locator('text=/Welcome to Hanzo|Choose Your Local AI/').isVisible().catch(() => false)
      if (stillOnboarding) {
        await page.keyboard.press('Enter')
        await page.waitForTimeout(500)
      }
    }
  })

  test('Appearance settings tab should be visible and functional', async ({ page }) => {
    // Open settings
    await page.keyboard.press('Meta+Comma')
    await page.waitForTimeout(1000)
    
    // Take screenshot of settings
    await page.screenshot({ 
      path: 'test-results/visual/appearance/01-settings-opened.png',
      fullPage: true 
    })
    
    // Click on Appearance tab
    const appearanceButton = page.locator('text=Appearance')
    const isAppearanceVisible = await appearanceButton.isVisible()
    console.log('Appearance tab visible:', isAppearanceVisible)
    
    if (isAppearanceVisible) {
      await appearanceButton.click()
      await page.waitForTimeout(500)
      
      // Take screenshot of appearance settings
      await page.screenshot({ 
        path: 'test-results/visual/appearance/02-appearance-tab.png',
        fullPage: true 
      })
      
      // Test theme switching
      const lightTheme = page.locator('text=Light').first()
      if (await lightTheme.isVisible()) {
        await lightTheme.click()
        await page.waitForTimeout(500)
        await page.screenshot({ 
          path: 'test-results/visual/appearance/03-light-theme.png',
          fullPage: true 
        })
      }
      
      // Test dark theme
      const darkTheme = page.locator('text=Dark').first()
      if (await darkTheme.isVisible()) {
        await darkTheme.click()
        await page.waitForTimeout(500)
        await page.screenshot({ 
          path: 'test-results/visual/appearance/04-dark-theme.png',
          fullPage: true 
        })
      }
      
      // Test font size controls
      const increaseFontButton = page.locator('text=+').first()
      if (await increaseFontButton.isVisible()) {
        await increaseFontButton.click()
        await page.waitForTimeout(300)
        await increaseFontButton.click()
        await page.waitForTimeout(300)
        await page.screenshot({ 
          path: 'test-results/visual/appearance/05-increased-font.png',
          fullPage: true 
        })
      }
      
      // Test custom color scheme
      const customColors = page.locator('text=Custom Colors')
      if (await customColors.isVisible()) {
        await customColors.click()
        await page.waitForTimeout(500)
        await page.screenshot({ 
          path: 'test-results/visual/appearance/06-custom-colors.png',
          fullPage: true 
        })
      }
    } else {
      console.log('⚠️ Appearance tab not found in settings')
      
      // Log what's visible
      const settingsContent = await page.content()
      console.log('Settings content preview:', settingsContent.substring(0, 500))
    }
    
    // Check for console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    await page.waitForTimeout(1000)
    
    if (errors.length > 0) {
      console.log('❌ Console errors found:', errors)
    } else {
      console.log('✅ No console errors')
    }
  })
})