import { test, expect } from '@playwright/test'

test('Simple Local AI settings test', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5173')
  
  // Wait for any element to appear
  await page.waitForTimeout(3000)
  
  // Take a screenshot of current state
  await page.screenshot({ path: 'test-results/visual/local-ai/app-state.png' })
  
  // Try to bypass onboarding differently
  await page.evaluate(() => {
    // Access the store directly
    const store = (window as any).__STORE__
    if (store) {
      console.log('Store found, updating state')
      store.ui.onboardingStep = 'v1_completed'
      store.ui.focusedWidget = 'SEARCH'
    }
  })
  
  await page.waitForTimeout(1000)
  
  // Try keyboard shortcut
  await page.keyboard.press('Meta+Comma')
  await page.waitForTimeout(2000)
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/visual/local-ai/after-meta-comma.png' })
  
  // Look for any settings elements
  const settingsElements = await page.$$('text=/General|Settings|About/i')
  console.log(`Found ${settingsElements.length} settings elements`)
  
  // Try to find Local AI button using different selectors
  const localAISelectors = [
    'button:has-text("Local AI")',
    'text="Local AI"',
    '[role="button"]:has-text("Local AI")',
    'div:has-text("Local AI")'
  ]
  
  for (const selector of localAISelectors) {
    const element = await page.$(selector)
    if (element) {
      console.log(`Found Local AI element with selector: ${selector}`)
      await element.click()
      await page.waitForTimeout(1000)
      break
    }
  }
  
  // Final screenshot
  await page.screenshot({ path: 'test-results/visual/local-ai/final-state.png', fullPage: true })
})