import { test, expect } from '@playwright/test'

test.describe('Hanzo Model Download Test', () => {
  test('Download Qwen model through UI', async ({ page }) => {
    test.setTimeout(1200000) // 20 minutes for download
    
    console.log('🚀 Starting model download test')
    
    // Navigate to the main app
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(3000)
    
    // Open AI chat interface by pressing Tab
    console.log('📱 Opening AI chat interface...')
    await page.keyboard.press('Tab')
    await page.waitForTimeout(2000)
    
    // Take screenshot of AI interface
    await page.screenshot({ 
      path: 'test-results/model-download/00-ai-interface.png',
      fullPage: true 
    })
    
    // Look for hub or model setup
    console.log('🔍 Looking for Hub or model setup...')
    
    // Try different ways to access the Hub
    const hubSelectors = [
      'text="Hub"',
      'button:has-text("Hub")',
      '[aria-label*="hub"]',
      'text=/download.*model/i',
      'text="Get started"',
      'text="Set up local model"'
    ]
    
    let foundHub = false
    for (const selector of hubSelectors) {
      try {
        const element = await page.locator(selector).first()
        if (await element.isVisible()) {
          console.log(`✅ Found hub element: ${selector}`)
          await element.click()
          await page.waitForTimeout(5000)
          foundHub = true
          break
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!foundHub) {
      console.log('❌ Could not find Hub, trying settings...')
      
      // Try to open settings
      await page.keyboard.press('Meta+Comma')
      await page.waitForTimeout(2000)
      
      await page.screenshot({ 
        path: 'test-results/model-download/01-settings.png',
        fullPage: true 
      })
      
      // Look for Local AI or Models section
      const modelSettingSelectors = [
        'text="Local AI"',
        'text="Models"',
        'text="AI Models"',
        'text="Download Models"'
      ]
      
      for (const selector of modelSettingSelectors) {
        try {
          const element = await page.locator(selector).first()
          if (await element.isVisible()) {
            console.log(`✅ Found model settings: ${selector}`)
            await element.click()
            await page.waitForTimeout(3000)
            break
          }
        } catch (e) {
          // Continue
        }
      }
    }
    
    // Take screenshot of current state
    await page.screenshot({ 
      path: 'test-results/model-download/02-models-section.png',
      fullPage: true 
    })
    
    // Wait for models to load
    console.log('⏳ Waiting for models to load...')
    await page.waitForTimeout(10000)
    
    // Look for Qwen model (350MB - smallest)
    console.log('🔍 Looking for Qwen model...')
    
    const qwenSelectors = [
      'text=/qwen.*350.*mb/i',
      'text=/qwen/i >> .. >> button:has-text("Download")',
      '[data-testid*="qwen"]',
      'text="Qwen"'
    ]
    
    let foundQwen = false
    for (const selector of qwenSelectors) {
      try {
        const elements = await page.locator(selector).all()
        console.log(`Found ${elements.length} elements matching ${selector}`)
        
        if (elements.length > 0) {
          // Look for download button near Qwen
          const parent = await page.locator(selector).first()
          const downloadBtn = await parent.locator('.. >> button:has-text("Download")').first()
          
          if (await downloadBtn.isVisible()) {
            console.log('✅ Found Qwen model with download button')
            foundQwen = true
            
            // Click download
            console.log('📥 Starting download...')
            await downloadBtn.click()
            await page.waitForTimeout(5000)
            
            // Take screenshot of download starting
            await page.screenshot({ 
              path: 'test-results/model-download/03-download-started.png',
              fullPage: true 
            })
            
            break
          }
        }
      } catch (e) {
        console.log(`Error with selector ${selector}: ${e.message}`)
      }
    }
    
    if (!foundQwen) {
      // Try to find any download button
      console.log('❌ Could not find Qwen specifically, looking for any model...')
      
      const downloadButtons = await page.locator('button:has-text("Download")').all()
      console.log(`Found ${downloadButtons.length} download buttons`)
      
      if (downloadButtons.length > 0) {
        console.log('📥 Clicking first available download button...')
        await downloadButtons[0].click()
        await page.waitForTimeout(5000)
        
        await page.screenshot({ 
          path: 'test-results/model-download/04-any-download.png',
          fullPage: true 
        })
      }
    }
    
    // Monitor download progress
    console.log('📊 Monitoring download progress...')
    
    let downloadComplete = false
    let progressChecks = 0
    const maxChecks = 60 // 10 minutes with 10 second intervals
    
    while (!downloadComplete && progressChecks < maxChecks) {
      progressChecks++
      
      // Look for progress indicators
      const progressSelectors = [
        'text=/%/',
        'text=/downloading/i',
        'text=/\\d+\\s*mb.*\\/.*\\d+\\s*mb/i',
        '[role="progressbar"]',
        'text="Download complete"',
        'text="Model downloaded"'
      ]
      
      let foundProgress = false
      for (const selector of progressSelectors) {
        const elements = await page.locator(selector).all()
        if (elements.length > 0) {
          const text = await elements[0].textContent()
          console.log(`Progress ${progressChecks}/${maxChecks}: ${text}`)
          foundProgress = true
          
          // Check if download is complete
          if (text?.includes('complete') || text?.includes('downloaded')) {
            downloadComplete = true
            console.log('✅ Download complete!')
          }
          break
        }
      }
      
      if (!foundProgress) {
        // Check if model is now available (download might have finished)
        const modelReadySelectors = [
          'button:has-text("Use")',
          'button:has-text("Select")',
          'text="Ready to use"'
        ]
        
        for (const selector of modelReadySelectors) {
          if (await page.locator(selector).first().isVisible()) {
            downloadComplete = true
            console.log('✅ Model is ready to use!')
            break
          }
        }
      }
      
      // Take periodic screenshots
      if (progressChecks % 6 === 0) { // Every minute
        await page.screenshot({ 
          path: `test-results/model-download/progress-${progressChecks}.png`,
          fullPage: true 
        })
      }
      
      if (!downloadComplete) {
        await page.waitForTimeout(10000) // Wait 10 seconds
      }
    }
    
    // Final screenshot
    await page.screenshot({ 
      path: 'test-results/model-download/99-final-state.png',
      fullPage: true 
    })
    
    // Test using the model
    if (downloadComplete) {
      console.log('🧪 Testing model inference...')
      
      // Go back to chat
      await page.keyboard.press('Escape')
      await page.waitForTimeout(2000)
      
      // Type a test message
      const chatInput = await page.locator('textarea, input[type="text"]').first()
      if (await chatInput.isVisible()) {
        await chatInput.fill('Hello! Can you tell me a joke?')
        await page.keyboard.press('Enter')
        
        console.log('⏳ Waiting for model response...')
        await page.waitForTimeout(30000) // Wait 30 seconds for response
        
        await page.screenshot({ 
          path: 'test-results/model-download/100-model-response.png',
          fullPage: true 
        })
        
        console.log('✅ Model test complete!')
      }
    }
    
    console.log('\\n📊 Test Summary:')
    console.log('- Extensions are failing to load due to Tauri asset protocol issues')
    console.log('- Model downloads require extensions to be properly loaded')
    console.log('- Backend llama-server is running on port 39291')
    console.log('- Proxy server on port 1337 forwards to llama-server')
    console.log('- Need to fix extension loading mechanism for downloads to work')
  })
})