import { test, expect } from '@playwright/test'
import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'

test.describe('Hanzo LLaMA Integration Test', () => {
  test.setTimeout(600000) // 10 minutes for all tests
  let llamaProcess: ChildProcess | null = null
  
  test.beforeAll(async () => {
    console.log('🚀 Setting up Hanzo llama.cpp integration test')
    
    // First, ensure we have a test model
    const modelPath = '/Users/z/work/hanzo/app/models/qwen2.5-0.5b-instruct-q4_k_m.gguf'
    if (!fs.existsSync(modelPath)) {
      console.log('❌ Test model not found. Please run: cd /Users/z/work/hanzo/app && mkdir -p models && curl -L -o models/qwen2.5-0.5b-instruct-q4_k_m.gguf "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf?download=true"')
      throw new Error('Test model not found')
    }
    
    // Kill any existing llama-server processes
    console.log('🧹 Cleaning up any existing llama-server processes...')
    try {
      await new Promise<void>((resolve) => {
        const killProcess = spawn('pkill', ['-f', 'llama-server'])
        killProcess.on('exit', () => resolve())
      })
    } catch (e) {
      // Ignore errors - process might not exist
    }
    
    // Start llama-server with the test model
    console.log('🚀 Starting llama-server on port 39291...')
    const llamaServerPath = '/Users/z/work/hanzo/app/src/rs/binaries/engines/llama.cpp/macos-arm64/b5509/llama-server'
    
    llamaProcess = spawn(llamaServerPath, [
      '--host', '0.0.0.0',
      '--port', '39291',
      '--ctx-size', '4096',
      '--threads', '4',
      '--parallel', '2',
      '--model', modelPath
    ])
    
    llamaProcess.stdout?.on('data', (data) => {
      console.log(`[llama-server]: ${data.toString().trim()}`)
    })
    
    llamaProcess.stderr?.on('data', (data) => {
      console.error(`[llama-server error]: ${data.toString().trim()}`)
    })
    
    // Wait for server to be ready
    console.log('⏳ Waiting for server to initialize...')
    let serverReady = false
    for (let i = 0; i < 30; i++) {
      try {
        const response = await fetch('http://localhost:39291/health')
        const data = await response.json()
        if (data.status === 'ok') {
          serverReady = true
          console.log('✅ Server is ready!')
          break
        } else if (data.error?.message === 'Loading model') {
          console.log(`  Attempt ${i + 1}: Still loading model...`)
        }
      } catch (e) {
        console.log(`  Attempt ${i + 1}: Server not responding yet...`)
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    if (!serverReady) {
      throw new Error('Server failed to start within 30 seconds')
    }
    
    // Verify the model is loaded
    const modelsResponse = await fetch('http://localhost:39291/v1/models')
    const modelsData = await modelsResponse.json()
    console.log('📋 Available models:', JSON.stringify(modelsData.data.map(m => m.id), null, 2))
  })
  
  test.afterAll(async () => {
    if (llamaProcess) {
      console.log('🛑 Stopping llama-server...')
      llamaProcess.kill()
      llamaProcess = null
    }
  })
  
  test('Complete E2E Flow: Server → Hub → Download → Inference', async ({ page }) => {
    test.setTimeout(600000) // 10 minutes
    
    console.log('\n===========================================')
    console.log('🧪 HANZO LLAMA.CPP INTEGRATION TEST')
    console.log('===========================================\n')
    
    // Step 1: Navigate to the app
    console.log('📍 Step 1: Opening Hanzo app...')
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(3000)
    
    // Skip onboarding
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)
    
    // Go to chat
    await page.keyboard.press('Tab')
    await page.waitForTimeout(3000)
    
    await page.screenshot({ 
      path: 'test-results/hanzo-integration/00-initial-view.png',
      fullPage: true 
    })
    
    // Step 2: Open model hub
    console.log('\n📍 Step 2: Opening Model Hub...')
    const setupButton = await page.locator('text="Set up local model"').first()
    expect(await setupButton.isVisible()).toBeTruthy()
    
    await setupButton.click()
    console.log('⏳ Loading Model Hub...')
    await page.waitForTimeout(10000)
    
    await page.screenshot({ 
      path: 'test-results/hanzo-integration/01-model-hub.png',
      fullPage: true 
    })
    
    // Step 3: Verify models are shown
    console.log('\n📍 Step 3: Verifying models are displayed...')
    const hubContent = await page.evaluate(() => document.body.innerText)
    
    console.log('Hub contains "No models found":', hubContent.includes('No models found'))
    console.log('Hub contains "Qwen":', hubContent.includes('Qwen'))
    console.log('Hub contains "Llama":', hubContent.includes('Llama'))
    console.log('Hub contains "Phi":', hubContent.includes('Phi'))
    
    // Count download buttons
    const downloadButtons = await page.locator('button:has-text("Download")').all()
    console.log(`\n✅ Found ${downloadButtons.length} models available for download`)
    expect(downloadButtons.length).toBeGreaterThan(0)
    
    // Step 4: Download a model
    console.log('\n📍 Step 4: Downloading a model...')
    const firstDownloadButton = downloadButtons[0]
    
    // Get model name before clicking
    const modelCard = await firstDownloadButton.locator('..').locator('..')
    const modelName = await modelCard.locator('h3').first().textContent()
    console.log(`📥 Downloading model: ${modelName}`)
    
    await firstDownloadButton.click()
    console.log('⏳ Download started...')
    
    // Monitor download progress
    let downloadComplete = false
    for (let i = 0; i < 60; i++) { // Wait up to 3 minutes
      await page.waitForTimeout(3000)
      
      // Look for progress indicator
      const progressElements = await page.locator('text=/%/').all()
      if (progressElements.length > 0) {
        const progress = await progressElements[0].textContent()
        console.log(`  Progress: ${progress}`)
      }
      
      // Check if "Use" button appeared
      const useButtons = await page.locator('button:has-text("Use")').all()
      if (useButtons.length > 0) {
        downloadComplete = true
        console.log('✅ Download complete!')
        
        await page.screenshot({ 
          path: 'test-results/hanzo-integration/02-download-complete.png',
          fullPage: true 
        })
        
        // Step 5: Use the model
        console.log('\n📍 Step 5: Selecting the downloaded model...')
        await useButtons[0].click()
        await page.waitForTimeout(5000)
        
        break
      }
    }
    
    expect(downloadComplete).toBeTruthy()
    
    // Step 6: Test inference
    console.log('\n📍 Step 6: Testing inference with the model...')
    
    // Look for chat input
    const chatInput = await page.locator('textarea[placeholder*="message"], textarea[placeholder*="Message"], textarea').first()
    expect(await chatInput.isVisible()).toBeTruthy()
    
    await chatInput.fill('What is 2 + 2? Please answer with just the number.')
    
    await page.screenshot({ 
      path: 'test-results/hanzo-integration/03-before-inference.png',
      fullPage: true 
    })
    
    // Send the message
    await page.keyboard.press('Enter')
    console.log('⏳ Waiting for AI response...')
    
    // Wait for response
    let responseReceived = false
    for (let i = 0; i < 30; i++) { // Wait up to 30 seconds
      await page.waitForTimeout(1000)
      
      // Check for response in the chat
      const messages = await page.locator('.message, [class*="message"], [data-testid*="message"]').all()
      if (messages.length > 1) { // More than just the user message
        responseReceived = true
        console.log('✅ AI response received!')
        break
      }
    }
    
    expect(responseReceived).toBeTruthy()
    
    await page.screenshot({ 
      path: 'test-results/hanzo-integration/04-inference-complete.png',
      fullPage: true 
    })
    
    // Final verification
    console.log('\n📍 Step 7: Final verification...')
    
    // Check that llama-server is still running
    const serverHealth = await fetch('http://localhost:39291/health')
      .then(res => res.json())
      .catch(e => ({ error: e.message }))
    
    console.log('Server health:', serverHealth)
    expect(serverHealth.status).toBe('ok')
    
    // Summary
    console.log('\n===========================================')
    console.log('✅ HANZO LLAMA.CPP INTEGRATION TEST PASSED')
    console.log('===========================================')
    console.log('Summary:')
    console.log('1. ✅ llama-server started successfully')
    console.log('2. ✅ Model Hub displayed available models')
    console.log('3. ✅ Model download functionality works')
    console.log('4. ✅ Downloaded model can be selected')
    console.log('5. ✅ Inference works with the model')
    console.log('\nThe Hanzo app successfully integrates with llama.cpp!')
    console.log('Check test-results/hanzo-integration/ for screenshots')
  })
  
  test('Verify Server API Endpoints', async () => {
    console.log('\n📍 Testing llama-server API endpoints...')
    
    // Test /v1/models
    const modelsResponse = await fetch('http://localhost:39291/v1/models')
    const modelsData = await modelsResponse.json()
    expect(modelsData.data).toBeDefined()
    expect(modelsData.data.length).toBeGreaterThan(0)
    console.log('✅ /v1/models endpoint working')
    
    // Test /v1/chat/completions
    const chatResponse = await fetch('http://localhost:39291/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelsData.data[0].id,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 50
      })
    })
    const chatData = await chatResponse.json()
    expect(chatData.choices).toBeDefined()
    console.log('✅ /v1/chat/completions endpoint working')
    
    // Test /v1/completions
    const completionResponse = await fetch('http://localhost:39291/v1/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelsData.data[0].id,
        prompt: 'The capital of France is',
        max_tokens: 10
      })
    })
    const completionData = await completionResponse.json()
    expect(completionData.choices).toBeDefined()
    console.log('✅ /v1/completions endpoint working')
    
    console.log('\n✅ All API endpoints verified!')
  })
})