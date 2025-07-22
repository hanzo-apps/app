import { test, expect } from '@playwright/test'
import { spawn } from 'child_process'
import * as http from 'http'

// Mock backend server that simulates Zen/LM Studio API
class MockModelServer {
  private server: http.Server
  private port: number
  
  constructor(port: number = 1337) {
    this.port = port
  }
  
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
        
        if (req.method === 'OPTIONS') {
          res.writeHead(200)
          res.end()
          return
        }
        
        // Mock API responses
        if (req.url === '/v1/models' || req.url === '/models') {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            data: [
              {
                id: 'qwen-2.5-coder-0.5b-gguf',
                name: 'Qwen 2.5 Coder 0.5B',
                size: 367468544, // 350MB
                quantization: 'Q4_K_M',
                downloaded: false
              },
              {
                id: 'llama-3.2-1b-gguf',
                name: 'Llama 3.2 1B',
                size: 697932185, // 665MB
                quantization: 'Q4_K_M',
                downloaded: false
              },
              {
                id: 'phi-3.5-mini-3.8b-gguf',
                name: 'Phi 3.5 Mini',
                size: 3006477107, // 2.8GB
                quantization: 'Q4_K_M',
                downloaded: false
              }
            ]
          }))
        } else if (req.url?.startsWith('/v1/models/download') || req.url?.startsWith('/download')) {
          // Mock download initiation
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            status: 'downloading',
            progress: 0,
            model: req.url.split('/').pop()
          }))
        } else if (req.url === '/v1/chat/completions') {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            choices: [{
              message: {
                content: 'Hello from mock model server!'
              }
            }]
          }))
        } else {
          res.writeHead(404)
          res.end('Not found')
        }
      })
      
      this.server.listen(this.port, () => {
        console.log(`Mock model server running on port ${this.port}`)
        resolve()
      })
    })
  }
  
  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('Mock model server stopped')
        resolve()
      })
    })
  }
}

test.describe('Model Download with Backend', () => {
  let mockServer: MockModelServer
  
  test.beforeAll(async () => {
    // Start mock backend server
    mockServer = new MockModelServer(1337)
    await mockServer.start()
  })
  
  test.afterAll(async () => {
    // Stop mock backend server
    await mockServer.stop()
  })
  
  test('Test model download with backend running', async ({ page }) => {
    test.setTimeout(300000) // 5 minutes
    
    console.log('🚀 Starting Model Download Test with Backend')
    
    // Navigate to the app
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(3000)
    
    // Skip onboarding if present
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)
    
    // Open settings
    console.log('📱 Opening settings...')
    await page.keyboard.press('Meta+Comma')
    await page.waitForTimeout(2000)
    
    // Navigate to Local AI
    const localAIButton = await page.locator('text="Local AI"').first()
    await localAIButton.click()
    await page.waitForTimeout(3000)
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/model-backend/00-local-ai-with-backend.png',
      fullPage: true 
    })
    
    // Initialize runtime if needed
    const initButton = await page.locator('button:has-text("Initialize Runtime")').first()
    if (await initButton.isVisible()) {
      console.log('✅ Initializing runtime...')
      await initButton.click()
      await page.waitForTimeout(5000)
    }
    
    // Check if models are now visible
    console.log('🔍 Looking for models...')
    
    // Look for model names
    const modelNames = ['Qwen', 'Llama', 'Phi']
    let foundModels = 0
    
    for (const modelName of modelNames) {
      const modelElement = await page.locator(`text=/${modelName}/i`).first()
      if (await modelElement.isVisible()) {
        console.log(`✅ Found model: ${modelName}`)
        foundModels++
      }
    }
    
    console.log(`Found ${foundModels} models`)
    
    // Look for download buttons
    const downloadButtons = await page.locator('button').filter({ hasText: 'Download' }).all()
    console.log(`Found ${downloadButtons.length} download buttons`)
    
    if (downloadButtons.length > 0) {
      console.log('📥 Clicking first download button...')
      await downloadButtons[0].click()
      await page.waitForTimeout(3000)
      
      // Take screenshot of download in progress
      await page.screenshot({ 
        path: 'test-results/model-backend/01-download-started.png',
        fullPage: true 
      })
      
      // Look for progress indicators
      const progressIndicators = await page.locator('text=/%|downloading|progress/i').all()
      console.log(`Found ${progressIndicators.length} progress indicators`)
    }
    
    // Alternative: Try through chat interface
    console.log('\n📱 Trying through chat interface...')
    await page.keyboard.press('Escape') // Exit settings
    await page.waitForTimeout(1000)
    
    await page.keyboard.press('Tab') // Go to chat
    await page.waitForTimeout(3000)
    
    // Click Set up local model if visible
    const setupButton = await page.locator('text="Set up local model"').first()
    if (await setupButton.isVisible()) {
      console.log('📦 Clicking Set up local model...')
      await setupButton.click()
      await page.waitForTimeout(5000)
      
      await page.screenshot({ 
        path: 'test-results/model-backend/02-hub-with-backend.png',
        fullPage: true 
      })
      
      // Check if models are listed in hub
      const hubModels = await page.locator('button, [role="button"]').all()
      console.log(`Found ${hubModels.length} interactive elements in hub`)
      
      // Try to find and click a model
      for (const element of hubModels) {
        const text = await element.textContent().catch(() => '')
        if (text && (text.includes('Qwen') || text.includes('Download'))) {
          console.log(`Clicking: ${text}`)
          await element.click()
          await page.waitForTimeout(3000)
          break
        }
      }
    }
    
    // Final screenshot
    await page.screenshot({ 
      path: 'test-results/model-backend/03-final-state.png',
      fullPage: true 
    })
    
    console.log('\n🎉 Test complete!')
    console.log('Check test-results/model-backend/ for screenshots')
  })
})