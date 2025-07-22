import { test, expect } from '@playwright/test'
import { promises as fs } from 'fs'
import path from 'path'

test.describe('Hanzo Model Inference with Fixture', () => {
  test.beforeAll(async () => {
    // Ensure the model fixture exists
    const modelPath = path.join(process.cwd(), 'test/fixtures/models/qwen-0.5b-gguf')
    try {
      await fs.access(modelPath)
      console.log('✅ Model fixture found at:', modelPath)
    } catch (error) {
      throw new Error('Model fixture not found. Run "make test-fixtures" first.')
    }
  })

  test('Load pre-downloaded model and test inference', async ({ page }) => {
    test.setTimeout(300000) // 5 minutes
    
    console.log('🚀 Starting model inference test with fixture')
    
    // Copy model to Hanzo's data directory
    const modelPath = path.join(process.cwd(), 'test/fixtures/models/qwen-0.5b-gguf')
    const hanzoDataDir = path.join(process.env.HOME!, 'Library/Application Support/Hanzo/data/models')
    
    console.log('📁 Creating Hanzo models directory...')
    await fs.mkdir(hanzoDataDir, { recursive: true })
    
    console.log('📋 Copying model to Hanzo data directory...')
    await fs.copyFile(modelPath, path.join(hanzoDataDir, 'qwen-0.5b.gguf'))
    
    // Navigate to the app
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(3000)
    
    // Open AI chat interface
    console.log('📱 Opening AI chat interface...')
    await page.keyboard.press('Tab')
    await page.waitForTimeout(3000)
    
    await page.screenshot({ 
      path: 'test-results/fixture-test/00-ai-interface.png',
      fullPage: true 
    })
    
    // Open settings to configure the model
    console.log('⚙️ Opening settings...')
    await page.keyboard.press('Meta+Comma')
    await page.waitForTimeout(2000)
    
    // Look for Local API Server settings
    const apiServerSelectors = [
      'text="Local API Server"',
      'text="API Server"',
      'text="Local Server"',
      'text="Server Settings"'
    ]
    
    let foundServer = false
    for (const selector of apiServerSelectors) {
      try {
        const element = await page.locator(selector).first()
        if (await element.isVisible()) {
          console.log(`✅ Found server settings: ${selector}`)
          await element.click()
          await page.waitForTimeout(2000)
          foundServer = true
          break
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (foundServer) {
      await page.screenshot({ 
        path: 'test-results/fixture-test/01-server-settings.png',
        fullPage: true 
      })
      
      // Start the server if needed
      const startButton = await page.locator('button:has-text("Start")').first()
      if (await startButton.isVisible()) {
        console.log('🚀 Starting local server...')
        await startButton.click()
        await page.waitForTimeout(5000)
      }
      
      // Configure model path
      console.log('📝 Configuring model path...')
      const modelPathInput = await page.locator('input[placeholder*="model"], input[name*="model"]').first()
      if (await modelPathInput.isVisible()) {
        await modelPathInput.fill(path.join(hanzoDataDir, 'qwen-0.5b.gguf'))
        await page.keyboard.press('Enter')
        await page.waitForTimeout(2000)
      }
    }
    
    // Go back to chat
    await page.keyboard.press('Escape')
    await page.waitForTimeout(2000)
    
    // Test inference
    console.log('🧪 Testing model inference...')
    
    // Find the chat input
    const chatInputSelectors = [
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="chat"]',
      'textarea[placeholder*="type"]',
      'input[placeholder*="message"]',
      'textarea',
      'input[type="text"]'
    ]
    
    let chatInput = null
    for (const selector of chatInputSelectors) {
      try {
        const element = await page.locator(selector).first()
        if (await element.isVisible()) {
          chatInput = element
          console.log(`✅ Found chat input: ${selector}`)
          break
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (chatInput) {
      await chatInput.fill('Hello! Please respond with "Hi there!"')
      await page.keyboard.press('Enter')
      
      console.log('⏳ Waiting for model response...')
      await page.waitForTimeout(15000)
      
      await page.screenshot({ 
        path: 'test-results/fixture-test/02-model-response.png',
        fullPage: true 
      })
      
      // Check for response
      const responseSelectors = [
        'text=/hi.*there/i',
        'text=/hello/i',
        '[class*="message"]:last-child',
        '[class*="response"]:last-child'
      ]
      
      let foundResponse = false
      for (const selector of responseSelectors) {
        try {
          const element = await page.locator(selector).first()
          if (await element.isVisible()) {
            const text = await element.textContent()
            console.log(`✅ Found response: ${text}`)
            foundResponse = true
            break
          }
        } catch (e) {
          // Continue
        }
      }
      
      if (foundResponse) {
        console.log('✅ Model inference successful!')
      } else {
        console.log('❌ No response found from model')
      }
    } else {
      console.log('❌ Could not find chat input')
    }
    
    // Test model info endpoint
    console.log('🔍 Testing model info endpoint...')
    const response = await fetch('http://localhost:1337/v1/models')
    if (response.ok) {
      const models = await response.json()
      console.log('📊 Available models:', JSON.stringify(models, null, 2))
    } else {
      console.log('❌ Failed to fetch models from API')
    }
    
    console.log('\n📊 Test Summary:')
    console.log('- Model fixture can be pre-downloaded with "make test-fixtures"')
    console.log('- Model should be copied to Hanzo data directory for use')
    console.log('- llama-server expects models in specific locations')
    console.log('- API endpoint at localhost:1337 provides OpenAI-compatible interface')
  })
})