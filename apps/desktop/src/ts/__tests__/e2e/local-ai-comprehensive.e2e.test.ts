import { test, expect } from '@playwright/test'

test.describe('Local AI Comprehensive Test', () => {
  test('Full Local AI functionality test', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(2000)
    
    // Bypass onboarding
    await page.evaluate(() => {
      const store = (window as any).__STORE__
      if (store) {
        store.ui.onboardingStep = 'v1_completed'
        store.ui.focusedWidget = 'SETTINGS'
      }
    })
    
    await page.waitForTimeout(1000)
    
    // Look for Local AI button
    const localAIButton = await page.$('text="Local AI"')
    expect(localAIButton).toBeTruthy()
    
    // Click Local AI
    await localAIButton?.click()
    await page.waitForTimeout(1000)
    
    // Take screenshot of Local AI settings
    await page.screenshot({ 
      path: 'test-results/visual/local-ai/local-ai-dark-theme.png',
      fullPage: true 
    })
    
    // Verify content is visible
    await expect(page.getByText('Local AI Models')).toBeVisible()
    await expect(page.getByText('Download and run AI models locally')).toBeVisible()
    
    // Check for specific models
    await expect(page.getByText('Qwen 2.5 0.5B')).toBeVisible()
    await expect(page.getByText('Llama 3.2 1B')).toBeVisible()
    await expect(page.getByText('Phi 3.5 Mini')).toBeVisible()
    await expect(page.getByText('Mistral 7B')).toBeVisible()
    
    // Test download functionality
    const firstDownloadButton = page.getByRole('button', { name: 'Download' }).first()
    await firstDownloadButton.click()
    await page.waitForTimeout(1500)
    
    // Check for downloading state
    await expect(page.getByText('Downloading...')).toBeVisible()
    
    // Take screenshot during download
    await page.screenshot({ 
      path: 'test-results/visual/local-ai/local-ai-downloading.png',
      fullPage: true 
    })
    
    // Test light theme
    await page.getByRole('button', { name: 'Appearance' }).click()
    await page.waitForTimeout(500)
    await page.getByLabel('Light').click()
    await page.waitForTimeout(500)
    
    // Go back to Local AI
    await page.getByRole('button', { name: 'Local AI' }).click()
    await page.waitForTimeout(500)
    
    // Take light theme screenshot
    await page.screenshot({ 
      path: 'test-results/visual/local-ai/local-ai-light-theme.png',
      fullPage: true 
    })
    
    // Test initialize runtime
    const initButton = page.getByRole('button', { name: 'Initialize Runtime' })
    if (await initButton.isVisible()) {
      await initButton.click()
      await page.waitForTimeout(1000)
      
      // Check for initializing state
      const initializingText = page.getByText('Initializing...')
      if (await initializingText.isVisible()) {
        await page.screenshot({ 
          path: 'test-results/visual/local-ai/local-ai-initializing.png',
          fullPage: true 
        })
      }
    }
    
    console.log('✅ Local AI settings test completed successfully!')
  })
})