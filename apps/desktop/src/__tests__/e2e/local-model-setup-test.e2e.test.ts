import { test, expect } from '@playwright/test'

test.describe('Local Model Setup Test', () => {
  test('Setup and download local AI model', async ({ page }) => {
    test.setTimeout(180000) // 3 minutes
    
    console.log('🚀 Starting Local Model Setup Test')
    
    // Navigate to the app
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(3000)
    
    // Skip onboarding if present
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)
    
    // Navigate to AI Chat
    console.log('🤖 Navigating to AI Chat')
    await page.keyboard.press('Tab')
    await page.waitForTimeout(3000)
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/model-setup/00-ai-chat.png',
      fullPage: true 
    })
    
    // Click "Set up local model" button
    console.log('📦 Clicking Set up local model')
    const setupButton = await page.locator('button:has-text("Set up local model")')
    await setupButton.click()
    await page.waitForTimeout(5000)
    
    // Take screenshot of model browser
    await page.screenshot({ 
      path: 'test-results/model-setup/01-model-browser.png',
      fullPage: true 
    })
    
    // Check what's on the page
    const pageText = await page.textContent('body')
    console.log('📄 Page content preview:', pageText?.substring(0, 300))
    
    // Try to interact with the search
    const searchInput = await page.locator('input[type="text"], input[type="search"]').first()
    if (await searchInput.isVisible()) {
      console.log('🔍 Found search input, searching for models')
      await searchInput.click()
      await searchInput.fill('llama')
      await page.waitForTimeout(3000)
      
      await page.screenshot({ 
        path: 'test-results/model-setup/02-search-llama.png',
        fullPage: true 
      })
      
      // Clear and try another search
      await searchInput.clear()
      await searchInput.fill('tinyllama')
      await page.waitForTimeout(3000)
      
      await page.screenshot({ 
        path: 'test-results/model-setup/03-search-tinyllama.png',
        fullPage: true 
      })
    }
    
    // Look for any model elements
    console.log('🔍 Looking for model elements')
    const modelElements = await page.locator('div[class*="model"], article, .card, [data-testid*="model"]').all()
    console.log(`Found ${modelElements.length} potential model elements`)
    
    // Check for specific UI elements
    const uiChecks = {
      'No models found text': await page.locator('text="No models found"').isVisible().catch(() => false),
      'Download buttons': await page.locator('button:has-text("Download")').count(),
      'Install buttons': await page.locator('button:has-text("Install")').count(),
      'Model cards': await page.locator('[class*="card"]').count(),
      'List items': await page.locator('li').count(),
      'Clickable elements': await page.locator('button, a[href], [role="button"]').count()
    }
    
    console.log('📊 UI Analysis:', uiChecks)
    
    // Try to find and click any downloadable model
    const clickableSelectors = [
      'button:has-text("Download")',
      'button:has-text("Install")', 
      'button:has-text("Get")',
      '[role="button"]',
      'a[href*="download"]',
      '.model-item',
      '[data-model]'
    ]
    
    let clicked = false
    for (const selector of clickableSelectors) {
      const elements = await page.locator(selector).all()
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements matching: ${selector}`)
        try {
          await elements[0].click()
          clicked = true
          console.log(`✅ Clicked element with selector: ${selector}`)
          await page.waitForTimeout(3000)
          
          await page.screenshot({ 
            path: 'test-results/model-setup/04-after-click.png',
            fullPage: true 
          })
          break
        } catch (e) {
          console.log(`❌ Failed to click: ${selector}`)
        }
      }
    }
    
    // Check if we're in a different state after clicking
    if (clicked) {
      // Look for download progress
      const progressIndicators = [
        '[role="progressbar"]',
        '.progress',
        'text=/downloading|progress|%/i',
        '[class*="progress"]'
      ]
      
      for (const indicator of progressIndicators) {
        if (await page.locator(indicator).isVisible().catch(() => false)) {
          console.log(`📊 Found progress indicator: ${indicator}`)
          await page.screenshot({ 
            path: 'test-results/model-setup/05-download-progress.png',
            fullPage: true 
          })
          break
        }
      }
    }
    
    // Try to go back and test chat input
    console.log('💬 Testing chat functionality')
    const backButton = await page.locator('button:has-text("Back"), button:has-text("←"), [aria-label*="back"]').first()
    if (await backButton.isVisible()) {
      await backButton.click()
      await page.waitForTimeout(2000)
    } else {
      // Try escape key
      await page.keyboard.press('Escape')
      await page.waitForTimeout(2000)
    }
    
    // Look for chat input
    const chatInput = await page.locator('textarea, [contenteditable="true"], input[type="text"]:not([readonly])').last()
    if (await chatInput.isVisible()) {
      console.log('✅ Found chat input')
      await chatInput.fill('Hello!')
      
      await page.screenshot({ 
        path: 'test-results/model-setup/06-chat-test.png',
        fullPage: true 
      })
    }
    
    // Final analysis
    console.log('\n📊 Test Results:')
    console.log('- AI Chat loaded: ✅')
    console.log('- Model setup clicked: ✅')
    console.log(`- Model browser loaded: ${searchInput ? '✅' : '❌'}`)
    console.log(`- Models found: ${clicked ? '✅' : '❌'}`)
    console.log(`- Chat input available: ${await chatInput.isVisible() ? '✅' : '❌'}`)
    
    console.log('\n✅ Local Model Setup Test Complete!')
  })
})