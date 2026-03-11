import { test, expect } from '@playwright/test'

test.describe('Hanzo Chat App Test', () => {
  test('Test Chat app with model downloads', async ({ page }) => {
    test.setTimeout(600000) // 10 minutes
    
    console.log('🚀 Starting Hanzo Chat App Test')
    console.log('📍 Connecting to Chat interface on port 1420')
    
    // Navigate to the Chat app directly
    await page.goto('http://localhost:1420')
    await page.waitForTimeout(5000)
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/chat-app/00-initial.png',
      fullPage: true 
    })
    
    // Check if we're in the Chat interface
    const chatElements = await page.locator('text=/chat|message|model|assistant/i').all()
    console.log(`Found ${chatElements.length} chat-related elements`)
    
    // Try to access settings
    console.log('📱 Trying to open settings...')
    
    // Try different ways to open settings
    const settingsAttempts = [
      () => page.keyboard.press('Meta+Comma'),
      () => page.locator('button[aria-label*="settings"], button[title*="settings"], [class*="settings"]').first().click(),
      () => page.locator('text=/settings|preferences/i').first().click(),
      () => page.locator('[data-testid*="settings"], [id*="settings"]').first().click()
    ]
    
    let settingsOpened = false
    for (const attempt of settingsAttempts) {
      try {
        await attempt()
        await page.waitForTimeout(2000)
        
        // Check if settings opened
        const settingsIndicators = await page.locator('text=/settings|preferences|configuration/i').all()
        if (settingsIndicators.length > 1) {
          settingsOpened = true
          console.log('✅ Settings opened')
          break
        }
      } catch (e) {
        // Continue to next attempt
      }
    }
    
    if (settingsOpened) {
      await page.screenshot({ 
        path: 'test-results/chat-app/01-settings.png',
        fullPage: true 
      })
      
      // Look for Local API Server option
      console.log('🔍 Looking for API Server settings...')
      const apiServerButton = await page.locator('text=/local.*api.*server|api.*server|server.*settings/i').first()
      
      if (await apiServerButton.isVisible()) {
        console.log('✅ Found API Server settings')
        await apiServerButton.click()
        await page.waitForTimeout(2000)
        
        await page.screenshot({ 
          path: 'test-results/chat-app/02-api-server.png',
          fullPage: true 
        })
        
        // Check server status and start if needed
        const startButton = await page.locator('button:has-text("Start"), button:has-text("start")').first()
        if (await startButton.isVisible()) {
          console.log('📡 Starting server...')
          
          // Set API key first
          const apiKeyInput = await page.locator('input[type="password"]').first()
          if (await apiKeyInput.isVisible()) {
            await apiKeyInput.fill('test-api-key')
          }
          
          await startButton.click()
          await page.waitForTimeout(5000)
          console.log('✅ Server start initiated')
        } else {
          console.log('✅ Server might already be running')
        }
      }
    }
    
    // Navigate back to main chat
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)
    
    // Look for model setup
    console.log('\n🔍 Looking for model setup...')
    
    // Check different locations for model setup
    const modelSetupSelectors = [
      'text="Set up local model"',
      'text=/download.*model|install.*model|get.*model/i',
      'button:has-text("Models")',
      'text="Hub"',
      '[data-testid*="model"], [id*="model-setup"]'
    ]
    
    let foundModelSetup = false
    for (const selector of modelSetupSelectors) {
      const element = await page.locator(selector).first()
      if (await element.isVisible()) {
        console.log(`✅ Found model setup: ${selector}`)
        await element.click()
        await page.waitForTimeout(5000)
        foundModelSetup = true
        break
      }
    }
    
    if (foundModelSetup) {
      await page.screenshot({ 
        path: 'test-results/chat-app/03-model-hub.png',
        fullPage: true 
      })
      
      // Wait for models to load
      console.log('⏳ Waiting for models to load...')
      await page.waitForTimeout(10000)
      
      // Look for model cards
      const modelCards = await page.locator('[class*="card"], [class*="Card"], [data-testid*="model"]').all()
      console.log(`Found ${modelCards.length} potential model cards`)
      
      // Look for download buttons
      const downloadButtons = await page.locator('button:has-text("Download"), button:has-text("download"), button:has-text("Get"), [aria-label*="download"]').all()
      console.log(`Found ${downloadButtons.length} download buttons`)
      
      if (downloadButtons.length > 0) {
        console.log('📥 Attempting to download first model...')
        await downloadButtons[0].click()
        await page.waitForTimeout(5000)
        
        // Check for progress
        const progressIndicators = await page.locator('text=/%|downloading|progress/i').all()
        if (progressIndicators.length > 0) {
          console.log('✅ Download started!')
          await page.screenshot({ 
            path: 'test-results/chat-app/04-download-progress.png',
            fullPage: true 
          })
        }
      }
    }
    
    // Final state
    await page.screenshot({ 
      path: 'test-results/chat-app/05-final.png',
      fullPage: true 
    })
    
    console.log('\n📊 Test Summary:')
    console.log('- Hanzo has two interfaces: main app (port 5173) and Chat (port 1420)')
    console.log('- Chat interface includes model management and Local API Server')
    console.log('- Built-in llama-server runs on port 39291')
    console.log('- Proxy server on port 1337 forwards to llama-server')
    console.log('- Check test-results/chat-app/ for screenshots')
  })
})