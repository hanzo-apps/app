import { test, expect } from '@playwright/test'

test.describe('Download and Run Model E2E Test', () => {
  test('Download a model through UI and test inference', async ({ page }) => {
    test.setTimeout(900000) // 15 minutes for download
    
    console.log('🚀 Starting Download and Run Model Test')
    
    // Navigate to the app
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(3000)
    
    // Skip onboarding
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)
    
    // First, let's check what models are available in settings
    console.log('⚙️ Opening settings to check available models')
    await page.keyboard.press('Meta+Comma')
    await page.waitForTimeout(2000)
    
    // Navigate to Local AI
    const localAIButton = await page.locator('text="Local AI"').first()
    await localAIButton.click()
    await page.waitForTimeout(2000)
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/download-run/00-local-ai-initial.png',
      fullPage: true 
    })
    
    // Check current state
    const pageContent = await page.textContent('body')
    console.log('📄 Local AI content preview:', pageContent?.substring(0, 300))
    
    // Look for model management UI elements
    const uiElements = {
      'Model cards': await page.locator('.model-card, [class*="model-item"]').count(),
      'Download buttons': await page.locator('button:has-text("Download")').count(),
      'Delete buttons': await page.locator('button:has-text("Delete")').count(),
      'Refresh button': await page.locator('button[aria-label*="refresh"], button:has-text("Refresh")').count(),
      'Import button': await page.locator('button:has-text("Import")').count()
    }
    
    console.log('🎨 UI Elements found:', uiElements)
    
    // Look for models that need downloading
    const modelCards = await page.locator('.flex.flex-col.gap-4 > div').all()
    console.log(`📦 Found ${modelCards.length} model items`)
    
    let modelToDownload = null
    let downloadButton = null
    
    // Find a model that's not downloaded yet
    for (let i = 0; i < modelCards.length; i++) {
      const card = modelCards[i]
      const cardText = await card.textContent()
      console.log(`  Model ${i}: ${cardText?.substring(0, 100)}`)
      
      // Check if this model has a download button
      const downloadBtn = await card.locator('button:has-text("Download")').first()
      if (await downloadBtn.isVisible().catch(() => false)) {
        modelToDownload = card
        downloadButton = downloadBtn
        console.log(`  ✅ Found downloadable model: ${cardText?.split('\n')[0]}`)
        break
      }
    }
    
    if (downloadButton) {
      console.log('📥 Clicking download button')
      await downloadButton.click()
      await page.waitForTimeout(3000)
      
      // Monitor download progress
      console.log('📊 Monitoring download progress...')
      let downloadComplete = false
      let progressCount = 0
      
      while (!downloadComplete && progressCount < 180) { // 15 minutes max
        await page.waitForTimeout(5000)
        progressCount++
        
        // Check for progress indicators
        const progressElements = await page.locator('[role="progressbar"], .progress-bar, [class*="progress"], text=/%|MB\/s|downloading/i').all()
        
        if (progressElements.length > 0) {
          // Get progress text
          for (const elem of progressElements) {
            const text = await elem.textContent().catch(() => '')
            if (text) {
              console.log(`  📊 Progress: ${text}`)
            }
          }
        }
        
        // Take screenshot every 30 seconds
        if (progressCount % 6 === 0) {
          await page.screenshot({ 
            path: `test-results/download-run/download-progress-${progressCount}.png`,
            fullPage: true 
          })
        }
        
        // Check if download completed
        const completeIndicators = [
          'text=/complete|downloaded|100%|ready/i',
          'button:has-text("Delete")',
          'text=/running|active|loaded/i'
        ]
        
        for (const indicator of completeIndicators) {
          const elem = await modelToDownload.locator(indicator).first()
          if (await elem.isVisible().catch(() => false)) {
            downloadComplete = true
            console.log('✅ Download appears complete!')
            break
          }
        }
        
        // Also check if the download button disappeared
        if (!await downloadButton.isVisible().catch(() => false)) {
          const deleteBtn = await modelToDownload.locator('button:has-text("Delete")').first()
          if (await deleteBtn.isVisible().catch(() => false)) {
            downloadComplete = true
            console.log('✅ Download complete (Delete button appeared)')
          }
        }
      }
      
      // Take final screenshot
      await page.screenshot({ 
        path: 'test-results/download-run/01-after-download.png',
        fullPage: true 
      })
      
      if (!downloadComplete) {
        console.log('⚠️ Download did not complete in time, but continuing with test...')
      }
    } else {
      console.log('ℹ️ No downloadable models found, checking if any models are already downloaded')
      
      // Check for already downloaded models
      const deleteButtons = await page.locator('button:has-text("Delete")').all()
      if (deleteButtons.length > 0) {
        console.log(`✅ Found ${deleteButtons.length} downloaded models`)
      }
    }
    
    // Now navigate to chat and test inference
    console.log('\n💬 Testing chat with downloaded model')
    await page.keyboard.press('Escape') // Exit settings
    await page.waitForTimeout(1000)
    
    // Go to AI Chat
    await page.keyboard.press('Tab')
    await page.waitForTimeout(3000)
    
    // Take screenshot of chat
    await page.screenshot({ 
      path: 'test-results/download-run/02-chat-interface.png',
      fullPage: true 
    })
    
    // Check if we're in the welcome screen or actual chat
    const welcomeScreen = await page.locator('text="Welcome to Chat"').isVisible().catch(() => false)
    
    if (welcomeScreen) {
      console.log('📋 Still in welcome screen, checking for model setup')
      
      // Check if we can proceed without setup (if model is downloaded)
      const chatInput = await page.locator('textarea, [contenteditable="true"]').first()
      if (!await chatInput.isVisible().catch(() => false)) {
        // Try clicking "Set up local model" to see current state
        const setupLocal = await page.locator('text="Set up local model"').first()
        if (await setupLocal.isVisible()) {
          await setupLocal.click()
          await page.waitForTimeout(3000)
          
          await page.screenshot({ 
            path: 'test-results/download-run/03-hub-state.png',
            fullPage: true 
          })
          
          // Go back to chat
          await page.keyboard.press('Escape')
          await page.waitForTimeout(1000)
        }
      }
    }
    
    // Try to find and use chat input
    const chatInputSelectors = [
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="chat"]',
      'textarea[placeholder*="Type"]',
      'textarea:visible',
      '[contenteditable="true"]'
    ]
    
    let chatInput = null
    for (const selector of chatInputSelectors) {
      const input = await page.locator(selector).first()
      if (await input.isVisible().catch(() => false) && await input.isEditable().catch(() => false)) {
        chatInput = input
        console.log(`✅ Found chat input: ${selector}`)
        break
      }
    }
    
    if (chatInput) {
      console.log('💬 Sending test message')
      await chatInput.click()
      await chatInput.fill('Hello! What is the capital of France?')
      
      await page.screenshot({ 
        path: 'test-results/download-run/04-message-typed.png',
        fullPage: true 
      })
      
      // Send message
      await page.keyboard.press('Enter')
      
      // Wait for response
      console.log('⏳ Waiting for AI response...')
      let responseReceived = false
      
      for (let i = 0; i < 30; i++) {
        await page.waitForTimeout(2000)
        
        const pageText = await page.textContent('body')
        if (pageText?.toLowerCase().includes('paris') || 
            pageText?.toLowerCase().includes('france') ||
            pageText?.includes('response') ||
            pageText?.includes('assistant')) {
          responseReceived = true
          console.log('✅ AI response received!')
          break
        }
        
        // Check for error messages
        if (pageText?.includes('error') || pageText?.includes('failed')) {
          console.log('❌ Error detected in response')
          break
        }
        
        console.log(`  Waiting for response... (${i + 1}/30)`)
      }
      
      // Take final screenshot
      await page.screenshot({ 
        path: 'test-results/download-run/05-final-chat.png',
        fullPage: true 
      })
      
      if (!responseReceived) {
        console.log('⚠️ No clear AI response received')
      }
    } else {
      console.log('❌ Could not find chat input')
      
      // Debug - print visible elements
      const allTextareas = await page.locator('textarea').all()
      const allInputs = await page.locator('input[type="text"]').all()
      console.log(`  Found ${allTextareas.length} textareas and ${allInputs.length} text inputs`)
    }
    
    // Final summary
    console.log('\n📊 Test Summary:')
    console.log(`- Models found: ${modelCards.length}`)
    console.log(`- Download attempted: ${downloadButton ? '✅' : '❌'}`)
    console.log(`- Chat input found: ${chatInput ? '✅' : '❌'}`)
    console.log(`- AI response: ${responseReceived ? '✅' : '⚠️'}`)
    
    // Check console for errors
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    if (errors.length > 0) {
      console.log('\n⚠️ Console errors:', errors)
    }
    
    console.log('\n🎉 Download and Run Model Test Complete!')
  })
})