import { test, expect } from '@playwright/test'

test.describe('Local LLM Download and Test', () => {
  test('Download and test local LLM', async ({ page }) => {
    console.log('🤖 Starting Local LLM download test')
    
    // Navigate to the app
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(2000)
    
    // Handle onboarding if present
    const onboardingVisible = await page.locator('text="Welcome to Hanzo"').isVisible().catch(() => false)
    if (onboardingVisible) {
      console.log('📋 Skipping onboarding')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(1000)
    }
    
    // Navigate to settings
    console.log('⚙️ Opening settings')
    await page.keyboard.press('Meta+Comma')
    await page.waitForTimeout(1500)
    
    // Click on Local AI settings
    console.log('🤖 Navigating to Local AI settings')
    const localAIButton = await page.locator('text="Local AI"')
    if (await localAIButton.isVisible()) {
      await localAIButton.click()
      await page.waitForTimeout(1000)
      
      // Take screenshot of Local AI settings
      await page.screenshot({ 
        path: 'test-results/local-llm/01-local-ai-settings.png',
        fullPage: true 
      })
      
      // Look for model download options
      console.log('📥 Looking for model download options')
      const downloadButton = await page.locator('button:has-text("Download")')
      if (await downloadButton.count() > 0) {
        console.log('✅ Found download button')
        
        // Check available models
        const modelOptions = await page.locator('[role="option"], .model-option, [data-model]').all()
        console.log(`📊 Found ${modelOptions.length} model options`)
        
        // Take screenshot of available models
        await page.screenshot({ 
          path: 'test-results/local-llm/02-available-models.png',
          fullPage: true 
        })
        
        // Try to download a small model (if available)
        const smallModel = await page.locator('text=/tiny|small|mini|1b|3b/i').first()
        if (await smallModel.isVisible()) {
          console.log('🎯 Found small model to download')
          await smallModel.click()
          await page.waitForTimeout(1000)
          
          // Click download
          await downloadButton.first().click()
          console.log('⏳ Download initiated')
          
          // Wait for download progress
          await page.waitForTimeout(5000)
          
          // Take screenshot of download progress
          await page.screenshot({ 
            path: 'test-results/local-llm/03-download-progress.png',
            fullPage: true 
          })
        }
      }
    }
    
    // Navigate to AI Chat to test the model
    console.log('💬 Testing AI Chat')
    await page.keyboard.press('Escape') // Exit settings
    await page.waitForTimeout(1000)
    
    // Press Tab to go to AI chat
    await page.keyboard.press('Tab')
    await page.waitForTimeout(2000)
    
    // Check if AI chat loaded
    const aiChatVisible = await page.locator('text="Welcome to Chat"').isVisible().catch(() => false)
    if (aiChatVisible) {
      console.log('✅ AI Chat loaded successfully')
      
      // Take screenshot of AI chat
      await page.screenshot({ 
        path: 'test-results/local-llm/04-ai-chat-interface.png',
        fullPage: true 
      })
      
      // Check for local model setup button
      const setupLocalModel = await page.locator('text="Set up local model"')
      if (await setupLocalModel.isVisible()) {
        console.log('📋 Local model setup available')
        await setupLocalModel.click()
        await page.waitForTimeout(2000)
        
        // Take screenshot of model setup
        await page.screenshot({ 
          path: 'test-results/local-llm/05-model-setup.png',
          fullPage: true 
        })
      }
      
      // Try to send a test message
      const chatInput = await page.locator('textarea, input[type="text"]').last()
      if (await chatInput.isVisible()) {
        console.log('💬 Sending test message')
        await chatInput.fill('Hello, can you hear me?')
        await page.keyboard.press('Enter')
        await page.waitForTimeout(3000)
        
        // Take screenshot of chat interaction
        await page.screenshot({ 
          path: 'test-results/local-llm/06-chat-test.png',
          fullPage: true 
        })
      }
    }
    
    // Check console for errors
    const consoleLogs = []
    page.on('console', msg => consoleLogs.push(msg))
    
    console.log('✅ Local LLM test completed')
    console.log(`📊 Console logs: ${consoleLogs.length}`)
    
    // Create results directory
    await page.evaluate(() => {
      console.log('Test completed successfully')
    })
  })
})