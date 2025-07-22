import { test, expect } from '@playwright/test'
import { spawn, ChildProcess } from 'child_process'
import * as fs from 'fs'
import * as http from 'http'
import * as url from 'url'

test.describe('Hanzo Full E2E Integration Test', () => {
  test.setTimeout(600000) // 10 minutes for all tests
  let llamaProcess: ChildProcess | null = null
  let proxyServer: http.Server | null = null
  
  test.beforeAll(async () => {
    console.log('🚀 Setting up Hanzo full integration test')
    
    // Ensure model exists
    const modelPath = '/Users/z/work/hanzo/app/models/qwen2.5-0.5b-instruct-q4_k_m.gguf'
    if (!fs.existsSync(modelPath)) {
      throw new Error('Test model not found. Please download it first.')
    }
    
    // Kill any existing processes
    console.log('🧹 Cleaning up any existing processes...')
    try {
      await new Promise<void>((resolve) => {
        const killLlama = spawn('pkill', ['-f', 'llama-server'])
        killLlama.on('exit', () => resolve())
      })
    } catch (e) {
      // Ignore errors
    }
    
    // Start llama-server
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
      const msg = data.toString().trim()
      if (msg) console.log(`[llama-server]: ${msg}`)
    })
    
    llamaProcess.stderr?.on('data', (data) => {
      const msg = data.toString().trim()
      if (msg && !msg.includes('llama_model_loader')) {
        console.error(`[llama-server error]: ${msg}`)
      }
    })
    
    // Wait for llama-server to be ready
    console.log('⏳ Waiting for llama-server to initialize...')
    let llamaReady = false
    for (let i = 0; i < 30; i++) {
      try {
        const response = await fetch('http://localhost:39291/health')
        const data = await response.json()
        if (data.status === 'ok') {
          llamaReady = true
          console.log('✅ llama-server is ready!')
          break
        }
      } catch (e) {
        // Server not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    if (!llamaReady) {
      throw new Error('llama-server failed to start')
    }
    
    // Create proxy server on port 1337
    console.log('🚀 Starting proxy server on port 1337...')
    proxyServer = http.createServer(async (req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      
      if (req.method === 'OPTIONS') {
        res.writeHead(200)
        res.end()
        return
      }
      
      const parsedUrl = url.parse(req.url || '', true)
      console.log(`[proxy] ${req.method} ${parsedUrl.pathname}`)
      
      // Handle model hub requests
      if (parsedUrl.pathname?.includes('/v1/models/hub')) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          data: [
            {
              id: "qwen2.5-0.5b-instruct",
              model: "Qwen/Qwen2.5-0.5B-Instruct-GGUF:q4_k_m",
              name: "Qwen2.5 0.5B Instruct Q4_K_M",
              size: 468000000,
              description: "Qwen2.5 is the latest series of Qwen large language models",
              object: "model",
              created: Date.now(),
              owned_by: "Qwen",
              downloadUrl: "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf",
              capabilities: ["chat", "completion"]
            },
            {
              id: "qwen2.5-1.5b-instruct",
              model: "Qwen/Qwen2.5-1.5B-Instruct-GGUF:q4_k_m",
              name: "Qwen2.5 1.5B Instruct Q4_K_M",
              size: 1020000000,
              description: "Larger Qwen2.5 model for more complex tasks",
              object: "model",
              created: Date.now(),
              owned_by: "Qwen",
              downloadUrl: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
              capabilities: ["chat", "completion"]
            },
            {
              id: "llama-3.2-1b-instruct",
              model: "bartowski/Llama-3.2-1B-Instruct-GGUF:Q4_K_M",
              name: "Llama 3.2 1B Instruct",
              size: 763000000,
              description: "Llama 3.2 1B is a lightweight, multilingual model",
              object: "model",
              created: Date.now(),
              owned_by: "Meta",
              downloadUrl: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf",
              capabilities: ["chat", "completion"]
            }
          ]
        }))
        return
      }
      
      // Forward all other requests to llama-server
      const options = {
        hostname: 'localhost',
        port: 39291,
        path: req.url,
        method: req.method,
        headers: req.headers
      }
      
      const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode!, proxyRes.headers)
        proxyRes.pipe(res)
      })
      
      proxyReq.on('error', (err) => {
        console.error('[proxy error]:', err)
        res.writeHead(500)
        res.end('Proxy error')
      })
      
      req.pipe(proxyReq)
    })
    
    await new Promise<void>((resolve) => {
      proxyServer!.listen(1337, () => {
        console.log('✅ Proxy server is listening on port 1337')
        resolve()
      })
    })
    
    // Wait for everything to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000))
  })
  
  test.afterAll(async () => {
    console.log('🛑 Cleaning up...')
    
    if (proxyServer) {
      await new Promise<void>((resolve) => {
        proxyServer!.close(() => resolve())
      })
      proxyServer = null
    }
    
    if (llamaProcess) {
      llamaProcess.kill()
      llamaProcess = null
    }
  })
  
  test('Complete Hanzo App E2E Test', async ({ page }) => {
    console.log('\n================================================')
    console.log('🧪 HANZO APP FULL E2E INTEGRATION TEST')
    console.log('================================================\n')
    
    // Step 1: Open the app
    console.log('📍 Step 1: Opening Hanzo app...')
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/full-integration/00-app-loaded.png',
      fullPage: true 
    })
    
    // Skip onboarding if present
    const escapeKey = page.keyboard.press('Escape')
    await Promise.race([
      escapeKey,
      page.waitForTimeout(1000)
    ])
    
    // Navigate to chat
    await page.keyboard.press('Tab')
    await page.waitForTimeout(3000)
    
    // Step 2: Open Model Hub
    console.log('\n📍 Step 2: Opening Model Hub...')
    
    // Look for setup button
    const setupButton = await page.locator('button:has-text("Set up local model")').first()
    if (await setupButton.isVisible()) {
      await setupButton.click()
      console.log('⏳ Loading Model Hub...')
    } else {
      // Try alternative ways to open hub
      const hubButton = await page.locator('button:has-text("Hub"), button:has-text("Models")').first()
      if (await hubButton.isVisible()) {
        await hubButton.click()
      }
    }
    
    // Wait for hub to load
    await page.waitForTimeout(5000)
    
    await page.screenshot({ 
      path: 'test-results/full-integration/01-model-hub.png',
      fullPage: true 
    })
    
    // Step 3: Verify models are displayed
    console.log('\n📍 Step 3: Checking for available models...')
    
    // Wait for models to load
    let modelsFound = false
    for (let i = 0; i < 10; i++) {
      const downloadButtons = await page.locator('button:has-text("Download")').all()
      if (downloadButtons.length > 0) {
        modelsFound = true
        console.log(`✅ Found ${downloadButtons.length} models available for download`)
        
        // Log model names
        const modelCards = await page.locator('[class*="model"], [data-testid*="model"]').all()
        for (const card of modelCards.slice(0, 3)) {
          const text = await card.textContent()
          console.log(`  - ${text?.split('\n')[0]}`)
        }
        
        break
      }
      await page.waitForTimeout(2000)
    }
    
    if (!modelsFound) {
      // Check page content for debugging
      const pageContent = await page.evaluate(() => document.body.innerText)
      console.log('Page content includes:', {
        'No models': pageContent.includes('No models'),
        'Qwen': pageContent.includes('Qwen'),
        'Llama': pageContent.includes('Llama'),
        'Download': pageContent.includes('Download')
      })
      
      await page.screenshot({ 
        path: 'test-results/full-integration/debug-no-models.png',
        fullPage: true 
      })
    }
    
    expect(modelsFound).toBeTruthy()
    
    // Step 4: Download a model
    console.log('\n📍 Step 4: Downloading a model...')
    const firstDownloadButton = await page.locator('button:has-text("Download")').first()
    await firstDownloadButton.click()
    
    // Monitor download progress
    console.log('⏳ Download started, monitoring progress...')
    let downloadComplete = false
    
    for (let i = 0; i < 60; i++) { // Wait up to 3 minutes
      await page.waitForTimeout(3000)
      
      // Check for progress indicators
      const progressText = await page.locator('text=/\\d+%/').first().textContent().catch(() => null)
      if (progressText) {
        console.log(`  Progress: ${progressText}`)
      }
      
      // Check if "Use" button appeared
      const useButtons = await page.locator('button:has-text("Use")').all()
      if (useButtons.length > 0) {
        downloadComplete = true
        console.log('✅ Download complete!')
        break
      }
    }
    
    await page.screenshot({ 
      path: 'test-results/full-integration/02-download-status.png',
      fullPage: true 
    })
    
    expect(downloadComplete).toBeTruthy()
    
    // Step 5: Use the downloaded model
    console.log('\n📍 Step 5: Selecting the downloaded model...')
    const useButton = await page.locator('button:has-text("Use")').first()
    await useButton.click()
    
    await page.waitForTimeout(5000)
    
    // Step 6: Test inference
    console.log('\n📍 Step 6: Testing AI inference...')
    
    // Find chat input
    const chatInput = await page.locator('textarea, input[type="text"]').last()
    await chatInput.fill('Hello! Can you tell me what 2 + 2 equals?')
    
    await page.screenshot({ 
      path: 'test-results/full-integration/03-before-chat.png',
      fullPage: true 
    })
    
    // Send message
    await page.keyboard.press('Enter')
    
    // Wait for AI response
    console.log('⏳ Waiting for AI response...')
    let responseReceived = false
    
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000)
      
      // Look for AI response
      const messages = await page.locator('[class*="message"], [role="article"]').all()
      if (messages.length > 1) {
        responseReceived = true
        const lastMessage = await messages[messages.length - 1].textContent()
        console.log('✅ AI responded:', lastMessage?.substring(0, 100) + '...')
        break
      }
    }
    
    await page.screenshot({ 
      path: 'test-results/full-integration/04-after-chat.png',
      fullPage: true 
    })
    
    expect(responseReceived).toBeTruthy()
    
    // Final summary
    console.log('\n================================================')
    console.log('✅ HANZO APP E2E TEST COMPLETED SUCCESSFULLY!')
    console.log('================================================')
    console.log('Summary:')
    console.log('✅ App launched successfully')
    console.log('✅ llama-server running on port 39291')
    console.log('✅ Proxy server running on port 1337')
    console.log('✅ Model Hub displayed available models')
    console.log('✅ Model download functionality works')
    console.log('✅ Downloaded model can be selected')
    console.log('✅ AI inference works with local model')
    console.log('\n✨ All frontend functionality tested and working!')
    console.log('📸 Screenshots saved in test-results/full-integration/')
  })
})