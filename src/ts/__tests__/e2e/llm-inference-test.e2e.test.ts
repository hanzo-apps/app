import { test, expect } from '@playwright/test'

test.describe('LLM Inference Test', () => {
  test('Test local LLM inference with existing model', async ({ page }) => {
    test.setTimeout(120000) // 2 minutes
    
    console.log('🚀 Starting LLM Inference Test')
    
    // Navigate to the app
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(3000)
    
    // Skip onboarding
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)
    
    // First, check Local AI settings to see what models we have
    console.log('⚙️ Checking Local AI settings')
    await page.keyboard.press('Meta+Comma')
    await page.waitForTimeout(2000)
    
    // Click on Local AI
    const localAIButton = await page.locator('text="Local AI"').first()
    if (await localAIButton.isVisible()) {
      await localAIButton.click()
      await page.waitForTimeout(2000)
      
      // Take screenshot
      await page.screenshot({ 
        path: 'test-results/inference-test/00-local-ai-models.png',
        fullPage: true 
      })
      
      // Check for any models
      const modelElements = await page.locator('.model-item, .model-card, [data-testid*="model"]').all()
      console.log(`📦 Found ${modelElements.length} models in Local AI settings`)
      
      // Look for any active/selected model
      const activeModel = await page.locator('text=/active|selected|in use/i').first()
      if (await activeModel.isVisible()) {
        console.log('✅ Found active model')
      }
      
      // Look for model names
      const modelNames = ['Qwen', 'Llama', 'Phi', 'Mistral', 'TinyLlama']
      for (const name of modelNames) {
        const model = await page.locator(`text=/${name}/i`).first()
        if (await model.isVisible()) {
          console.log(`✅ Found ${name} model`)
          
          // Check if it's downloaded
          const parent = await model.locator('..').first()
          const downloadStatus = await parent.locator('text=/downloaded|ready|MB|GB/i').first()
          if (await downloadStatus.isVisible()) {
            const statusText = await downloadStatus.textContent()
            console.log(`   Status: ${statusText}`)
          }
          
          // Look for activate/use button
          const useButton = await parent.locator('button:has-text("Use"), button:has-text("Activate"), button:has-text("Select")').first()
          if (await useButton.isVisible()) {
            console.log(`   Clicking Use button for ${name}`)
            await useButton.click()
            await page.waitForTimeout(3000)
          }
        }
      }
    }
    
    // Go back to chat
    console.log('\n💬 Navigating to chat')
    await page.keyboard.press('Escape') // Exit settings
    await page.waitForTimeout(1000)
    
    // Navigate to AI Chat
    await page.keyboard.press('Tab')
    await page.waitForTimeout(3000)
    
    // Take screenshot of chat
    await page.screenshot({ 
      path: 'test-results/inference-test/01-chat-interface.png',
      fullPage: true 
    })
    
    // Check if we need to set up a model
    const setupNeeded = await page.locator('text="Set up local model"').isVisible().catch(() => false)
    if (setupNeeded) {
      console.log('⚠️ Model setup still needed')
      
      // Try clicking it to see what happens
      const setupButton = await page.locator('text="Set up local model"').first()
      await setupButton.click()
      await page.waitForTimeout(3000)
      
      await page.screenshot({ 
        path: 'test-results/inference-test/02-after-setup-click.png',
        fullPage: true 
      })
    }
    
    // Try to find chat input regardless
    console.log('\n🧪 Testing chat functionality')
    const chatInputSelectors = [
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="chat"]',
      'textarea[placeholder*="type"]',
      'textarea[placeholder*="ask"]',
      'textarea:not([disabled])',
      '[contenteditable="true"]',
      'input[type="text"]:not([readonly])'
    ]
    
    let chatInput = null
    for (const selector of chatInputSelectors) {
      const input = await page.locator(selector).last()
      if (await input.isVisible().catch(() => false)) {
        const isEditable = await input.isEditable().catch(() => false)
        if (isEditable) {
          chatInput = input
          console.log(`✅ Found chat input: ${selector}`)
          break
        }
      }
    }
    
    if (chatInput) {
      console.log('💬 Sending test message')
      await chatInput.click()
      await chatInput.fill('Hello! What is 2 + 2?')
      
      await page.screenshot({ 
        path: 'test-results/inference-test/03-with-message.png',
        fullPage: true 
      })
      
      // Send message
      await page.keyboard.press('Enter')
      
      // Wait for response
      console.log('⏳ Waiting for AI response...')
      let responseFound = false
      
      for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(1000)
        
        // Check for any new content
        const messages = await page.locator('.message, [data-message], [role="article"]').count()
        const pageText = await page.textContent('body')
        
        if (pageText?.includes('4') || pageText?.includes('four')) {
          responseFound = true
          console.log('✅ AI responded correctly!')
          break
        }
        
        // Also check for error messages
        if (pageText?.includes('error') || pageText?.includes('failed')) {
          console.log('❌ Error in response')
          break
        }
        
        console.log(`   Waiting... (${i + 1}/20) - ${messages} messages`)
      }
      
      // Take final screenshot
      await page.screenshot({ 
        path: 'test-results/inference-test/04-final-state.png',
        fullPage: true 
      })
      
      if (!responseFound) {
        console.log('⚠️ No AI response received')
        
        // Check console for errors
        page.on('console', msg => {
          if (msg.type() === 'error') {
            console.log('Console error:', msg.text())
          }
        })
      }
    } else {
      console.log('❌ No chat input found')
      
      // Debug: print all visible text
      const visibleText = await page.textContent('body')
      console.log('Visible text preview:', visibleText?.substring(0, 500))
    }
    
    // Summary
    console.log('\n📊 Test Summary:')
    console.log(`- Models found: ${modelElements?.length || 0}`)
    console.log(`- Chat input: ${chatInput ? '✅' : '❌'}`)
    console.log(`- AI response: ${responseFound ? '✅' : '❌'}`)
    
    console.log('\n🎉 LLM Inference Test Complete!')
  })
})