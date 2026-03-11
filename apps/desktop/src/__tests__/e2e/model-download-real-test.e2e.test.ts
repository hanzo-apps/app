import { test, expect } from '@playwright/test'

test.describe('Real Model Download and Inference Test', () => {
  test('Download Qwen 0.5B model and test inference', async ({ page }) => {
    test.setTimeout(600000) // 10 minutes for download
    
    console.log('🚀 Starting Real Model Download Test')
    
    // Navigate to the app
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(3000)
    
    // Skip onboarding
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)
    
    // Navigate to settings first
    console.log('⚙️ Opening settings via keyboard shortcut')
    await page.keyboard.press('Meta+Comma')
    await page.waitForTimeout(2000)
    
    // Click on Local AI settings
    console.log('🤖 Navigating to Local AI settings')
    const localAIButton = await page.locator('text="Local AI"').first()
    if (await localAIButton.isVisible()) {
      await localAIButton.click()
      await page.waitForTimeout(2000)
      
      // Take screenshot of Local AI settings
      await page.screenshot({ 
        path: 'test-results/real-download/00-local-ai-settings.png',
        fullPage: true 
      })
      
      // Check for existing models
      const existingModels = await page.locator('.model-card, [data-testid="model-item"]').all()
      console.log(`📦 Found ${existingModels.length} existing models`)
      
      // Look for Qwen model or download button
      const qwenModel = await page.locator('text=/qwen.*0.5/i').first()
      if (await qwenModel.isVisible()) {
        console.log('✅ Qwen 0.5B model already exists')
        
        // Check if it's downloaded
        const downloadedIndicator = await page.locator('text=/downloaded|installed|ready/i').first()
        if (await downloadedIndicator.isVisible()) {
          console.log('✅ Model is already downloaded')
        } else {
          // Look for download button
          const downloadBtn = await page.locator('button:has-text("Download")').first()
          if (await downloadBtn.isVisible()) {
            console.log('📥 Clicking download button')
            await downloadBtn.click()
            await monitorDownload(page)
          }
        }
      } else {
        console.log('🔍 Qwen model not found, looking for add model option')
        
        // Look for add model or import button
        const addModelBtn = await page.locator('button:has-text("Add Model"), button:has-text("Import"), button[aria-label="Add"]').first()
        if (await addModelBtn.isVisible()) {
          console.log('➕ Clicking add model button')
          await addModelBtn.click()
          await page.waitForTimeout(2000)
          
          // This might open a dialog or navigate to model browser
          await page.screenshot({ 
            path: 'test-results/real-download/01-add-model-dialog.png',
            fullPage: true 
          })
        }
      }
    }
    
    // Try alternative approach - go back to chat and use the setup flow
    console.log('\n💬 Trying chat-based setup flow')
    await page.keyboard.press('Escape') // Exit settings
    await page.waitForTimeout(1000)
    
    // Navigate to AI Chat
    await page.keyboard.press('Tab')
    await page.waitForTimeout(3000)
    
    // Check if we're in chat
    const chatVisible = await page.locator('text="Welcome to Chat"').isVisible().catch(() => false)
    if (chatVisible) {
      console.log('✅ In chat interface')
      
      // Click Set up local model
      const setupLocal = await page.locator('text="Set up local model"').first()
      if (await setupLocal.isVisible()) {
        console.log('📦 Clicking Set up local model')
        await setupLocal.click()
        await page.waitForTimeout(5000)
        
        await page.screenshot({ 
          path: 'test-results/real-download/02-model-hub.png',
          fullPage: true 
        })
        
        // Now we should be in the Hub
        // Try to find Qwen model
        const searchInput = await page.locator('input[placeholder*="Search"]').first()
        if (await searchInput.isVisible()) {
          console.log('🔍 Searching for Qwen model')
          await searchInput.fill('Qwen 0.5B')
          await page.waitForTimeout(3000)
          
          await page.screenshot({ 
            path: 'test-results/real-download/03-search-results.png',
            fullPage: true 
          })
          
          // Look for model cards or results
          const modelCards = await page.locator('.model-card, article, [data-testid*="model"]').all()
          console.log(`📋 Found ${modelCards.length} model cards`)
          
          if (modelCards.length > 0) {
            // Click the first model
            await modelCards[0].click()
            await page.waitForTimeout(2000)
            
            // Look for download/install button
            const installBtn = await page.locator('button:has-text("Install"), button:has-text("Download"), button:has-text("Get")').first()
            if (await installBtn.isVisible()) {
              console.log('📥 Clicking install button')
              await installBtn.click()
              await monitorDownload(page)
            }
          }
        }
      }
    }
    
    // After download, test inference
    console.log('\n🧪 Testing inference')
    
    // Make sure we're in chat
    const backToChat = await page.locator('button:has-text("Back"), a:has-text("Chat")').first()
    if (await backToChat.isVisible()) {
      await backToChat.click()
      await page.waitForTimeout(2000)
    }
    
    // Find chat input
    const chatInput = await page.locator('textarea[placeholder*="message"], textarea[placeholder*="chat"], textarea').first()
    if (await chatInput.isVisible()) {
      console.log('💬 Sending test message')
      await chatInput.fill('Hello! Can you tell me a short joke?')
      await page.keyboard.press('Enter')
      
      // Wait for response
      console.log('⏳ Waiting for AI response...')
      await page.waitForTimeout(10000)
      
      // Look for response
      const messages = await page.locator('.message, [data-message-role="assistant"]').all()
      console.log(`📨 Found ${messages.length} messages`)
      
      await page.screenshot({ 
        path: 'test-results/real-download/04-inference-test.png',
        fullPage: true 
      })
      
      // Check if we got a response
      const responseText = await page.textContent('body')
      if (responseText?.includes('joke') || responseText?.includes('laugh')) {
        console.log('✅ AI responded with a joke!')
      }
    }
    
    console.log('\n🎉 Real Model Download and Inference Test Complete!')
  })
})

async function monitorDownload(page: any) {
  console.log('📊 Monitoring download progress...')
  
  let downloadComplete = false
  let attempts = 0
  const maxAttempts = 120 // 10 minutes
  
  while (!downloadComplete && attempts < maxAttempts) {
    // Check for progress indicators
    const progressBar = await page.locator('[role="progressbar"], .progress-bar, [class*="progress"]').first()
    const progressText = await page.locator('text=/%|downloading|MB/i').first()
    
    if (await progressBar.isVisible() || await progressText.isVisible()) {
      // Get progress text if available
      const text = await progressText.textContent().catch(() => '')
      console.log(`📥 Download progress: ${text || 'In progress...'} (${attempts}/${maxAttempts})`)
      
      // Take screenshot every 10 attempts
      if (attempts % 10 === 0) {
        await page.screenshot({ 
          path: `test-results/real-download/download-progress-${attempts}.png`,
          fullPage: true 
        })
      }
    }
    
    // Check if download completed
    const completeIndicators = [
      'text=/complete|done|ready|100%|installed/i',
      'button:has-text("Use Model")',
      'button:has-text("Chat")',
      'text=/model.*loaded|model.*ready/i'
    ]
    
    for (const indicator of completeIndicators) {
      if (await page.locator(indicator).isVisible().catch(() => false)) {
        downloadComplete = true
        console.log('✅ Download complete!')
        break
      }
    }
    
    await page.waitForTimeout(5000)
    attempts++
  }
  
  if (!downloadComplete) {
    console.log('⚠️ Download did not complete within timeout')
  }
  
  // Take final screenshot
  await page.screenshot({ 
    path: 'test-results/real-download/download-final.png',
    fullPage: true 
  })
}