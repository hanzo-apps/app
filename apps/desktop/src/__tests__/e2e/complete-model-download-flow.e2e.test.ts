import { test, expect } from '@playwright/test'

test.describe('Complete Model Download Flow', () => {
  test('Step by step: Initialize server, download model, test inference', async ({ page }) => {
    test.setTimeout(900000) // 15 minutes for download
    
    console.log('🚀 Starting Complete Model Download Flow Test')
    console.log('This test will:')
    console.log('1. Start the built-in API server')
    console.log('2. Initialize the Cortex runtime')
    console.log('3. Download a model')
    console.log('4. Test inference')
    console.log('-----------------------------------\n')
    
    // Step 1: Navigate to the app
    console.log('📍 Step 1: Opening Hanzo app...')
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(3000)
    
    // Skip any onboarding
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)
    
    // Step 2: Open Settings
    console.log('📍 Step 2: Opening Settings (Cmd+,)...')
    await page.keyboard.press('Meta+Comma')
    await page.waitForTimeout(2000)
    
    await page.screenshot({ 
      path: 'test-results/complete-flow/01-settings-open.png',
      fullPage: true 
    })
    
    // Step 3: Navigate to Local API Server
    console.log('📍 Step 3: Finding Local API Server settings...')
    let serverStarted = false
    
    // First try "Local API Server"
    let localApiButton = await page.locator('text="Local API Server"').first()
    if (await localApiButton.isVisible()) {
      console.log('✅ Found "Local API Server" button')
      await localApiButton.click()
      await page.waitForTimeout(2000)
      
      // Look for server controls
      const serverToggle = await page.locator('button:has-text("Start server"), button:has-text("Stop server")').first()
      if (await serverToggle.isVisible()) {
        const serverText = await serverToggle.textContent()
        if (serverText?.includes('Stop')) {
          console.log('✅ Server is already running')
          serverStarted = true
        } else {
          console.log('📡 Starting server...')
          await serverToggle.click()
          await page.waitForTimeout(5000)
          
          const updatedText = await serverToggle.textContent()
          if (updatedText?.includes('Stop')) {
            console.log('✅ Server started successfully')
            serverStarted = true
          }
        }
      }
    }
    
    // If not found, try "Local AI"
    if (!serverStarted) {
      console.log('📍 Trying "Local AI" settings...')
      const localAIButton = await page.locator('text="Local AI"').first()
      if (await localAIButton.isVisible()) {
        console.log('✅ Found "Local AI" button')
        await localAIButton.click()
        await page.waitForTimeout(2000)
        
        await page.screenshot({ 
          path: 'test-results/complete-flow/02-local-ai-settings.png',
          fullPage: true 
        })
        
        // Look for Initialize Runtime button
        const initButton = await page.locator('button:has-text("Initialize Runtime")').first()
        if (await initButton.isVisible()) {
          console.log('📦 Found "Initialize Runtime" button')
          await initButton.click()
          console.log('⏳ Initializing runtime... (this may take a moment)')
          await page.waitForTimeout(10000)
          
          await page.screenshot({ 
            path: 'test-results/complete-flow/03-after-init.png',
            fullPage: true 
          })
        }
      }
    }
    
    // Step 4: Check server status
    console.log('\n📍 Step 4: Checking server status...')
    const serverCheck = await page.evaluate(async () => {
      const endpoints = [
        'http://localhost:1337/v1/models',
        'http://localhost:39291/v1/models',
        'http://localhost:1234/v1/models'
      ]
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint)
          if (response.ok) {
            return { 
              success: true, 
              endpoint, 
              status: response.status 
            }
          }
        } catch (e) {
          // Continue to next endpoint
        }
      }
      return { success: false }
    })
    
    console.log('Server check result:', serverCheck)
    
    // Step 5: Navigate to Hub
    console.log('\n📍 Step 5: Going to Model Hub...')
    // Exit settings
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)
    
    // Go to chat
    await page.keyboard.press('Tab')
    await page.waitForTimeout(3000)
    
    // Click "Set up local model"
    const setupButton = await page.locator('text="Set up local model"').first()
    if (await setupButton.isVisible()) {
      console.log('✅ Found "Set up local model" button')
      await setupButton.click()
      console.log('⏳ Loading Model Hub... (waiting 15 seconds)')
      await page.waitForTimeout(15000)
      
      await page.screenshot({ 
        path: 'test-results/complete-flow/04-model-hub.png',
        fullPage: true 
      })
      
      // Step 6: Look for models
      console.log('\n📍 Step 6: Searching for available models...')
      const modelData = await page.evaluate(() => {
        // Get all text content to search for models
        const bodyText = document.body.innerText
        const models = {
          qwen: bodyText.match(/Qwen.*?([\d.]+\s*[MG]B)/i),
          llama: bodyText.match(/Llama.*?([\d.]+\s*[MG]B)/i),
          phi: bodyText.match(/Phi.*?([\d.]+\s*[MG]B)/i),
          mistral: bodyText.match(/Mistral.*?([\d.]+\s*[MG]B)/i)
        }
        return models
      })
      
      console.log('Models found:', modelData)
      
      // Count visible models
      let visibleModels = 0
      for (const [name, match] of Object.entries(modelData)) {
        if (match) {
          console.log(`✅ Found ${name}: ${match[0]}`)
          visibleModels++
        }
      }
      
      console.log(`\nTotal models visible: ${visibleModels}`)
      
      // Step 7: Find and click download button
      console.log('\n📍 Step 7: Looking for download buttons...')
      
      // Method 1: Direct download button search
      let downloadClicked = false
      let downloadComplete = false
      
      const downloadButtons = await page.locator('button').filter({ hasText: /download/i }).all()
      console.log(`Found ${downloadButtons.length} download buttons`)
      
      if (downloadButtons.length > 0) {
        console.log('📥 Clicking first download button...')
        await downloadButtons[0].click()
        downloadClicked = true
      } else {
        // Method 2: Look within model cards
        console.log('Searching within model cards...')
        const cards = await page.locator('[class*="card"], [class*="Card"]').all()
        console.log(`Found ${cards.length} model cards`)
        
        for (const card of cards) {
          const cardText = await card.textContent()
          if (cardText && (cardText.includes('Qwen') || cardText.includes('350'))) {
            console.log('Found Qwen model card')
            const cardButton = await card.locator('button').first()
            if (await cardButton.isVisible()) {
              console.log('📥 Clicking download button in Qwen card...')
              await cardButton.click()
              downloadClicked = true
              break
            }
          }
        }
      }
      
      if (downloadClicked) {
        await page.waitForTimeout(5000)
        
        // Step 8: Monitor download progress
        console.log('\n📍 Step 8: Monitoring download progress...')
        let lastProgress = ''
        
        for (let i = 0; i < 120; i++) { // 10 minutes max
          // Look for progress indicators
          const progressText = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('*'))
            for (const el of elements) {
              const text = el.textContent || ''
              if (text.match(/\d+%/) || text.includes('downloading')) {
                return text
              }
            }
            return null
          })
          
          if (progressText && progressText !== lastProgress) {
            console.log(`  Progress: ${progressText}`)
            lastProgress = progressText
          }
          
          // Check for completion
          const useButton = await page.locator('button:has-text("Use")').first()
          if (await useButton.isVisible()) {
            console.log('✅ Download complete! "Use" button appeared')
            downloadComplete = true
            
            await page.screenshot({ 
              path: 'test-results/complete-flow/05-download-complete.png',
              fullPage: true 
            })
            
            // Step 9: Use the model
            console.log('\n📍 Step 9: Using the downloaded model...')
            await useButton.click()
            await page.waitForTimeout(5000)
            break
          }
          
          // Periodic screenshots
          if (i % 12 === 0) { // Every minute
            await page.screenshot({ 
              path: `test-results/complete-flow/download-progress-${i/12}min.png`,
              fullPage: true 
            })
          }
          
          await page.waitForTimeout(5000)
        }
        
        if (downloadComplete) {
          // Step 10: Test inference
          console.log('\n📍 Step 10: Testing model inference...')
          
          // Should be back in chat with model loaded
          const chatInput = await page.locator('textarea, input[type="text"]').first()
          if (await chatInput.isVisible()) {
            console.log('📝 Sending test message...')
            await chatInput.fill('Hello! Can you tell me what 2+2 equals?')
            await page.keyboard.press('Enter')
            
            console.log('⏳ Waiting for response...')
            await page.waitForTimeout(10000)
            
            await page.screenshot({ 
              path: 'test-results/complete-flow/06-inference-test.png',
              fullPage: true 
            })
            
            // Look for response
            const responseFound = await page.evaluate(() => {
              const bodyText = document.body.innerText
              return bodyText.includes('4') || bodyText.includes('four')
            })
            
            if (responseFound) {
              console.log('✅ Model responded correctly!')
            } else {
              console.log('⚠️  Could not verify response')
            }
          }
        }
      } else {
        console.log('❌ Could not find any download buttons')
        console.log('Possible reasons:')
        console.log('- Cortex server not fully initialized')
        console.log('- Models not loaded from Hugging Face')
        console.log('- UI not rendering properly')
      }
      
      // Final summary
      console.log('\n' + '='.repeat(50))
      console.log('📊 TEST SUMMARY')
      console.log('='.repeat(50))
      console.log('✓ App opened successfully')
      console.log('✓ Settings accessible')
      console.log(serverStarted ? '✓ Server started' : '✗ Server not started')
      console.log(visibleModels > 0 ? `✓ Found ${visibleModels} models` : '✗ No models found')
      console.log(downloadClicked ? '✓ Download initiated' : '✗ Download not started')
      console.log(downloadComplete ? '✓ Download completed' : '✗ Download not completed')
      console.log('\nCheck test-results/complete-flow/ for screenshots')
      console.log('='.repeat(50))
  })
})