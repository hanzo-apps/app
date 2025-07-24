import { test, expect } from '@playwright/test'

test.describe('Local AI Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Bypass onboarding and set initial state
    await page.addInitScript(() => {
      const initialState = {
        onboardingStep: 'v1_completed',
        focusedWidget: 'SEARCH',
        query: '',
        selectedIndex: 0,
        theme: 'dark',
        fontFamily: 'system',
        fontSize: 14,
        colorScheme: 'monochrome'
      }
      localStorage.setItem('@ui.store', JSON.stringify(initialState))
    })
    
    await page.goto('http://localhost:5173')
    
    // Wait for app to load
    await page.waitForSelector('input[placeholder="Search apps, files and quick links"]', { timeout: 10000 })
    await page.waitForTimeout(500)
  })

  test('Local AI settings tab should be accessible and functional', async ({ page }) => {
    // Navigate to settings using keyboard shortcut
    await page.keyboard.press('Meta+Comma')
    await page.waitForTimeout(2000)
    
    // Wait for settings to appear - check for any settings tab
    const generalTab = page.getByRole('button', { name: 'General' })
    await expect(generalTab).toBeVisible({ timeout: 5000 })

    // Click on Local AI tab
    const localAIButton = page.getByRole('button', { name: 'Local AI' })
    await expect(localAIButton).toBeVisible({ timeout: 5000 })
    await localAIButton.click()

    // Wait for Local AI content to load
    await page.waitForTimeout(500)

    // Check that the Local AI page is visible
    await expect(page.getByText('Local AI Models')).toBeVisible()
    await expect(page.getByText('Download and run AI models locally')).toBeVisible()

    // Check runtime status
    await expect(page.getByText('Local AI Runtime')).toBeVisible()
    const initButton = page.getByRole('button', { name: 'Initialize Runtime' })
    await expect(initButton).toBeVisible()

    // Check model list
    await expect(page.getByText('Available Models')).toBeVisible()
    
    // Check specific models
    await expect(page.getByText('Qwen 2.5 0.5B')).toBeVisible()
    await expect(page.getByText('350 MB')).toBeVisible()
    await expect(page.getByText('Ultra-lightweight model for basic tasks and testing')).toBeVisible()

    await expect(page.getByText('Llama 3.2 1B')).toBeVisible()
    await expect(page.getByText('665 MB')).toBeVisible()

    // Test download button
    const downloadButtons = page.getByRole('button', { name: 'Download' })
    const firstDownloadButton = downloadButtons.first()
    await expect(firstDownloadButton).toBeVisible()

    // Click download to test the UI (it will simulate download)
    await firstDownloadButton.click()
    
    // Wait a bit to see progress
    await page.waitForTimeout(1000)
    
    // Check for downloading state
    await expect(page.getByText('Downloading...')).toBeVisible()
    
    // Check info section
    await expect(page.getByText('About Local AI')).toBeVisible()
    await expect(page.getByText(/Models run entirely on your device/)).toBeVisible()

    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/visual/local-ai/local-ai-settings.png',
      fullPage: true 
    })

    // Test theme in Local AI settings
    await page.keyboard.press('Escape') // Go back to launcher
    await page.waitForTimeout(300)
    
    // Switch to light theme
    await page.keyboard.press('Meta+Comma')
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: 'Appearance' }).click()
    await page.waitForTimeout(300)
    await page.getByLabel('Light').click()
    await page.waitForTimeout(300)
    
    // Go back to Local AI
    await page.getByRole('button', { name: 'Local AI' }).click()
    await page.waitForTimeout(500)
    
    // Take light theme screenshot
    await page.screenshot({ 
      path: 'test-results/visual/local-ai/local-ai-settings-light.png',
      fullPage: true 
    })
  })

  test('Initialize runtime functionality', async ({ page }) => {
    // First make sure we're in the launcher
    await page.waitForSelector('input[placeholder="Search apps, files and quick links"]')
    
    // Navigate to settings
    await page.evaluate(() => {
      const store = window.__STORE__
      if (store && store.ui) {
        store.ui.focusWidget('SETTINGS')
      }
    })
    await page.waitForTimeout(1000)
    
    // Click on Local AI tab
    await page.getByRole('button', { name: 'Local AI' }).click()
    await page.waitForTimeout(500)

    // Click initialize runtime
    const initButton = page.getByRole('button', { name: 'Initialize Runtime' })
    await initButton.click()

    // Check for initializing state
    await expect(page.getByText('Initializing...')).toBeVisible()
    
    // Wait for initialization to complete (simulated)
    await page.waitForTimeout(2500)
    
    // Check for ready state
    await expect(page.getByText('Ready')).toBeVisible()
  })
})