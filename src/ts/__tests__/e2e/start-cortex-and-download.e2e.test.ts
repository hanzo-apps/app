import { test, expect } from '@playwright/test'
import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'

const execAsync = promisify(exec)

test.describe('Start Cortex and Download Model', () => {
  let cortexProcess: any = null
  
  test.beforeAll(async () => {
    console.log('🚀 Starting Cortex backend...')
    
    // Try to find cortex binary
    const cortexPath = '/Users/z/work/hanzo/app/extensions/inference-cortex-extension/bin/mac/cortex'
    
    try {
      // Make cortex executable
      await execAsync(`chmod +x "${cortexPath}"`)
      
      // Start cortex server
      cortexProcess = spawn(cortexPath, ['--port', '1337'], {
        detached: false,
        stdio: 'pipe'
      })
      
      cortexProcess.stdout.on('data', (data: Buffer) => {
        console.log(`Cortex: ${data.toString()}`)
      })
      
      cortexProcess.stderr.on('data', (data: Buffer) => {
        console.error(`Cortex Error: ${data.toString()}`)
      })
      
      // Wait for cortex to start
      await new Promise(resolve => setTimeout(resolve, 5000))
      console.log('✅ Cortex should be running on port 1337')
      
    } catch (error) {
      console.error('Failed to start Cortex:', error)
      // Continue anyway - maybe it's already running
    }
  })
  
  test.afterAll(async () => {
    if (cortexProcess) {
      console.log('Stopping Cortex...')
      cortexProcess.kill()
    }
  })
  
  test('Download model with Cortex running', async ({ page }) => {
    test.setTimeout(600000) // 10 minutes for download
    
    console.log('🚀 Starting Model Download Test with Cortex')
    
    // Navigate to the app
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(3000)
    
    // Skip onboarding
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)
    
    // Go directly to chat to see "Set up local model"
    await page.keyboard.press('Tab')
    await page.waitForTimeout(3000)
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: 'test-results/cortex-download/00-initial-chat.png',
      fullPage: true 
    })
    
    // Click "Set up local model"
    const setupButton = await page.locator('text="Set up local model"').first()
    if (await setupButton.isVisible()) {
      console.log('📦 Clicking Set up local model...')
      await setupButton.click()
      await page.waitForTimeout(5000)
      
      // Take screenshot of hub
      await page.screenshot({ 
        path: 'test-results/cortex-download/01-hub-page.png',
        fullPage: true 
      })
      
      // Wait for models to load
      console.log('⏳ Waiting for models to load...')
      await page.waitForTimeout(10000)
      
      // Take another screenshot
      await page.screenshot({ 
        path: 'test-results/cortex-download/02-hub-loaded.png',
        fullPage: true 
      })
      
      // Try different ways to find models
      console.log('🔍 Looking for models...')
      
      // Method 1: Look for model cards
      const modelCards = await page.locator('.hub-model-card-step, [class*="card"]').all()
      console.log(`Found ${modelCards.length} model cards`)
      
      // Method 2: Look for download buttons
      const downloadButtons = await page.locator('button:has-text("Download"), button:has-text("download")').all()
      console.log(`Found ${downloadButtons.length} download buttons`)
      
      // Method 3: Look for specific model names
      const modelNames = ['Qwen', 'Llama', 'Phi', 'Mistral', 'nano']
      for (const name of modelNames) {
        const modelElement = await page.locator(`text=/${name}/i`).first()
        if (await modelElement.isVisible()) {
          console.log(`✅ Found model: ${name}`)
          
          // Look for download button near this model
          const nearbyButton = await modelElement.locator('xpath=ancestor::*[contains(@class, "card") or contains(@class, "Card")]//button[contains(text(), "Download") or contains(text(), "download")]').first()
          if (await nearbyButton.isVisible()) {
            console.log(`📥 Found download button for ${name}`)
            await nearbyButton.click()
            await page.waitForTimeout(5000)
            
            // Monitor download
            await monitorDownload(page)
            break
          }
        }
      }
      
      // If no models found, try refreshing
      if (downloadButtons.length === 0) {
        console.log('🔄 No models found, refreshing page...')
        await page.reload()
        await page.waitForTimeout(10000)
        
        await page.screenshot({ 
          path: 'test-results/cortex-download/03-after-refresh.png',
          fullPage: true 
        })
      }
    } else {
      console.log('❌ "Set up local model" button not found')
      
      // Try settings approach
      console.log('📱 Trying via Settings...')
      await page.keyboard.press('Meta+Comma')
      await page.waitForTimeout(2000)
      
      const localAIButton = await page.locator('text="Local AI"').first()
      if (await localAIButton.isVisible()) {
        await localAIButton.click()
        await page.waitForTimeout(3000)
        
        await page.screenshot({ 
          path: 'test-results/cortex-download/04-local-ai-settings.png',
          fullPage: true 
        })
      }
    }
    
    // Final screenshot
    await page.screenshot({ 
      path: 'test-results/cortex-download/05-final-state.png',
      fullPage: true 
    })
    
    console.log('🎉 Test complete!')
  })
})

async function monitorDownload(page: any) {
  console.log('📊 Monitoring download...')
  
  let downloadComplete = false
  let attempts = 0
  const maxAttempts = 120 // 10 minutes
  
  while (!downloadComplete && attempts < maxAttempts) {
    await page.waitForTimeout(5000)
    attempts++
    
    // Look for progress indicators
    const progressElements = await page.locator('[class*="progress"], [class*="Progress"], text=/%|downloading/i').all()
    
    for (const element of progressElements) {
      const text = await element.textContent().catch(() => '')
      if (text) {
        console.log(`  Progress: ${text}`)
      }
    }
    
    // Check for completion
    const completed = await page.locator('text=/complete|downloaded|ready|100%|Use/i').isVisible().catch(() => false)
    if (completed) {
      downloadComplete = true
      console.log('✅ Download appears complete!')
      
      await page.screenshot({ 
        path: `test-results/cortex-download/download-complete.png`,
        fullPage: true 
      })
    }
    
    // Take periodic screenshots
    if (attempts % 12 === 0) { // Every minute
      await page.screenshot({ 
        path: `test-results/cortex-download/progress-${attempts}.png`,
        fullPage: true 
      })
    }
  }
  
  return downloadComplete
}