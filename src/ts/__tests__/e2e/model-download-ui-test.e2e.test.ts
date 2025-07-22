import { test, expect } from '@playwright/test'

test.describe('Model Download UI Test', () => {
  test('Test model download UI components', async ({ page }) => {
    test.setTimeout(300000) // 5 minutes
    
    console.log('🚀 Starting Model Download UI Test')
    
    // Navigate to the app
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(3000)
    
    // Skip onboarding
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)
    
    // Method 1: Try through Local AI settings
    console.log('\n📱 Method 1: Via Local AI Settings')
    await page.keyboard.press('Meta+Comma')
    await page.waitForTimeout(2000)
    
    const localAIButton = await page.locator('text="Local AI"').first()
    await localAIButton.click()
    await page.waitForTimeout(3000)
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/model-ui/00-local-ai-page.png',
      fullPage: true 
    })
    
    // Look for the Initialize Runtime button
    const initButton = await page.locator('button:has-text("Initialize Runtime")').first()
    if (await initButton.isVisible()) {
      console.log('✅ Found Initialize Runtime button')
      await initButton.click()
      await page.waitForTimeout(5000)
      
      // Check if runtime started
      const runtimeStatus = await page.locator('text=/ready|running|initialized/i').first()
      if (await runtimeStatus.isVisible()) {
        console.log('✅ Runtime initialized')
      }
      
      await page.screenshot({ 
        path: 'test-results/model-ui/01-after-init.png',
        fullPage: true 
      })
    }
    
    // Look for model items with better selectors
    console.log('\n🔍 Looking for model items...')
    
    // Method A: Look for model containers
    const modelContainers = await page.locator('div').filter({ hasText: /Qwen|Llama|Phi|Mistral/i }).all()
    console.log(`Found ${modelContainers.length} potential model containers`)
    
    // Method B: Look for download buttons directly
    const downloadButtons = await page.locator('button').filter({ hasText: 'Download' }).all()
    console.log(`Found ${downloadButtons.length} download buttons`)
    
    if (downloadButtons.length > 0) {
      console.log('📥 Clicking first download button')
      await downloadButtons[0].click()
      await page.waitForTimeout(5000)
      
      // Monitor download
      await monitorDownload(page, 'model-ui')
    } else {
      console.log('❌ No download buttons found in Local AI settings')
    }
    
    // Method 2: Try through Chat setup flow
    console.log('\n📱 Method 2: Via Chat Setup Flow')
    await page.keyboard.press('Escape') // Exit settings
    await page.waitForTimeout(1000)
    
    await page.keyboard.press('Tab') // Go to chat
    await page.waitForTimeout(3000)
    
    // Click Set up local model
    const setupButton = await page.locator('text="Set up local model"').first()
    if (await setupButton.isVisible()) {
      console.log('📦 Clicking Set up local model')
      await setupButton.click()
      await page.waitForTimeout(5000)
      
      await page.screenshot({ 
        path: 'test-results/model-ui/02-hub-page.png',
        fullPage: true 
      })
      
      // In the Hub, try different approaches
      console.log('🔍 Searching for models in Hub...')
      
      // Approach 1: Clear search and wait
      const searchInput = await page.locator('input[placeholder*="Search"]').first()
      if (await searchInput.isVisible()) {
        await searchInput.clear()
        await page.waitForTimeout(3000)
        
        // Approach 2: Search for specific model
        await searchInput.fill('qwen')
        await page.waitForTimeout(5000)
        
        await page.screenshot({ 
          path: 'test-results/model-ui/03-search-qwen.png',
          fullPage: true 
        })
        
        // Look for any clickable model results
        const modelResults = await page.locator('button, [role="button"], a[href], .clickable, [onclick]').all()
        console.log(`Found ${modelResults.length} clickable elements`)
        
        // Try clicking elements that might be models
        for (const element of modelResults) {
          const text = await element.textContent().catch(() => '')
          if (text && (text.includes('Qwen') || text.includes('Download') || text.includes('Install'))) {
            console.log(`Clicking element with text: ${text}`)
            await element.click()
            await page.waitForTimeout(3000)
            break
          }
        }
      }
    }
    
    // Method 3: Direct API approach (if UI is not working)
    console.log('\n📱 Method 3: Checking for API endpoints')
    
    // Listen for network requests
    const modelRequests = []
    page.on('request', request => {
      const url = request.url()
      if (url.includes('model') || url.includes('hub') || url.includes('hugging')) {
        modelRequests.push({
          url: url,
          method: request.method(),
          postData: request.postData()
        })
      }
    })
    
    // Refresh the Hub page to capture requests
    await page.reload()
    await page.waitForTimeout(5000)
    
    console.log(`\n📊 Captured ${modelRequests.length} model-related requests:`)
    modelRequests.forEach((req, i) => {
      console.log(`  ${i + 1}. ${req.method} ${req.url.substring(0, 100)}`)
    })
    
    // Final UI state check
    console.log('\n📊 Final UI Analysis:')
    
    const uiState = {
      'Search input visible': await page.locator('input[type="search"], input[placeholder*="Search"]').isVisible().catch(() => false),
      'No models text': await page.locator('text="No models found"').isVisible().catch(() => false),
      'Download buttons': await page.locator('button:has-text("Download")').count(),
      'Model names visible': await page.locator('text=/Qwen|Llama|Phi|Mistral/i').count(),
      'Loading indicators': await page.locator('.loading, [class*="spinner"], text=/loading/i').count()
    }
    
    console.log('UI State:', uiState)
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'test-results/model-ui/04-final-state.png',
      fullPage: true 
    })
    
    console.log('\n🎉 Model Download UI Test Complete!')
  })
})

async function monitorDownload(page: any, prefix: string) {
  console.log('📊 Monitoring download progress...')
  
  let downloadComplete = false
  let attempts = 0
  const maxAttempts = 60 // 5 minutes
  
  while (!downloadComplete && attempts < maxAttempts) {
    await page.waitForTimeout(5000)
    attempts++
    
    // Check for progress
    const progressText = await page.locator('text=/%|MB\/s|downloading/i').first().textContent().catch(() => '')
    if (progressText) {
      console.log(`  Progress: ${progressText}`)
    }
    
    // Check for completion
    const completed = await page.locator('text=/complete|downloaded|ready|100%/i').isVisible().catch(() => false)
    if (completed) {
      downloadComplete = true
      console.log('✅ Download complete!')
    }
    
    // Take screenshot every 20 seconds
    if (attempts % 4 === 0) {
      await page.screenshot({ 
        path: `test-results/${prefix}/progress-${attempts}.png`,
        fullPage: true 
      })
    }
  }
  
  return downloadComplete
}