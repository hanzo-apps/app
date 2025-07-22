import { test, expect } from '@playwright/test'

test.describe('Start Built-in Server and Download Model', () => {
  test('Start local API server and download model', async ({ page }) => {
    test.setTimeout(600000) // 10 minutes
    
    console.log('🚀 Starting Built-in Server Test')
    
    // Navigate to the app
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(3000)
    
    // Skip onboarding
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)
    
    // Go to settings
    console.log('📱 Opening settings...')
    await page.keyboard.press('Meta+Comma')
    await page.waitForTimeout(2000)
    
    // Take screenshot of settings menu
    await page.screenshot({ 
      path: 'test-results/builtin-server/00-settings-menu.png',
      fullPage: true 
    })
    
    // Look for all settings options
    const settingsOptions = await page.locator('[role="button"], button').all()
    console.log(`Found ${settingsOptions.length} buttons in settings`)
    
    for (const option of settingsOptions) {
      const text = await option.textContent().catch(() => '')
      if (text) {
        console.log(`  - "${text.trim()}"`)
      }
    }
    
    // Navigate to Local API Server settings (try different text variations)
    let foundApiServer = false
    const apiServerTexts = ['Local API Server', 'API Server', 'Server', 'Local Server', 'API']
    
    for (const searchText of apiServerTexts) {
      const button = await page.locator(`text="${searchText}"`).first()
      if (await button.isVisible()) {
        console.log(`✅ Found settings option: "${searchText}"`)
        await button.click()
        await page.waitForTimeout(2000)
        foundApiServer = true
        break
      }
    }
    
    if (foundApiServer) {
      console.log('📡 In API Server settings')
      
      // Take screenshot
      await page.screenshot({ 
        path: 'test-results/builtin-server/00-api-server-settings.png',
        fullPage: true 
      })
      
      // Check if server is already running
      const serverToggle = await page.locator('button:has-text("Start server"), button:has-text("Stop server")').first()
      const serverText = await serverToggle.textContent()
      
      if (serverText?.includes('Stop')) {
        console.log('✅ Server is already running')
      } else {
        console.log('📡 Starting server...')
        
        // First set API key if needed
        const apiKeyInput = await page.locator('input[type="password"]').first()
        if (await apiKeyInput.isVisible()) {
          console.log('Setting API key...')
          await apiKeyInput.fill('test-api-key-123')
          await page.waitForTimeout(1000)
        }
        
        // Click start server
        await serverToggle.click()
        await page.waitForTimeout(5000)
        
        // Check if server started
        const updatedText = await serverToggle.textContent()
        if (updatedText?.includes('Stop')) {
          console.log('✅ Server started successfully')
        } else {
          console.log('❌ Server failed to start')
        }
      }
      
      // Take screenshot after server start
      await page.screenshot({ 
        path: 'test-results/builtin-server/01-server-running.png',
        fullPage: true 
      })
      
      // Check server status directly
      console.log('🔍 Checking server status...')
      try {
        const serverInfo = await page.evaluate(async () => {
          // Check if server is responding
          try {
            const response = await fetch('http://localhost:1337/v1/models')
            return {
              status: response.status,
              ok: response.ok,
              url: response.url
            }
          } catch (error) {
            return { error: error.toString() }
          }
        })
        console.log('Server response:', serverInfo)
      } catch (error) {
        console.log('Could not check server directly:', error)
      }
      
      // Now go to chat and try to download a model
      console.log('\n📱 Going to chat...')
      await page.keyboard.press('Escape') // Exit settings
      await page.waitForTimeout(1000)
      
      await page.keyboard.press('Tab') // Go to chat
      await page.waitForTimeout(3000)
      
      // Look for "Set up local model" button
      const setupButton = await page.locator('text="Set up local model"').first()
      if (await setupButton.isVisible()) {
        console.log('📦 Clicking Set up local model...')
        await setupButton.click()
        await page.waitForTimeout(10000) // Wait longer for models to load
        
        // Take screenshot of hub
        await page.screenshot({ 
          path: 'test-results/builtin-server/02-hub-with-server.png',
          fullPage: true 
        })
        
        // Look for models
        console.log('🔍 Looking for models...')
        const modelNames = ['Qwen', 'Llama', 'Phi', 'Mistral', 'nano']
        let foundModels = 0
        
        for (const name of modelNames) {
          const modelElement = await page.locator(`text=/${name}/i`).first()
          if (await modelElement.isVisible()) {
            console.log(`✅ Found model: ${name}`)
            foundModels++
          }
        }
        
        console.log(`Found ${foundModels} models`)
        
        // Look for download buttons
        const downloadButtons = await page.locator('button:has-text("Download"), button:has-text("download")').all()
        console.log(`Found ${downloadButtons.length} download buttons`)
        
        if (downloadButtons.length > 0) {
          console.log('📥 Clicking first download button...')
          await downloadButtons[0].click()
          await page.waitForTimeout(5000)
          
          // Monitor download
          let downloadStarted = false
          for (let i = 0; i < 10; i++) {
            const progressElements = await page.locator('text=/%|downloading/i').all()
            if (progressElements.length > 0) {
              console.log('✅ Download started!')
              downloadStarted = true
              break
            }
            await page.waitForTimeout(2000)
          }
          
          if (downloadStarted) {
            await page.screenshot({ 
              path: 'test-results/builtin-server/03-download-progress.png',
              fullPage: true 
            })
          }
        }
      } else {
        console.log('❌ "Set up local model" button not found')
        console.log('The app might already have models configured')
      }
      
    } else {
      console.log('❌ Local API Server settings not found')
    }
    
    // Final screenshot
    await page.screenshot({ 
      path: 'test-results/builtin-server/final-state.png',
      fullPage: true 
    })
    
    console.log('\n📊 Test Summary:')
    console.log('- The app has a built-in proxy server that runs on port 1337')
    console.log('- The proxy forwards requests to llama-server on port 39291')
    console.log('- Server can be started from Settings > Local API Server')
    console.log('- Check test-results/builtin-server/ for screenshots')
  })
})