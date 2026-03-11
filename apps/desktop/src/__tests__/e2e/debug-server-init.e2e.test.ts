import { test, expect } from '@playwright/test'

test.describe('Debug Server Initialization', () => {
  test('Debug: Check server and model initialization', async ({ page }) => {
    test.setTimeout(300000) // 5 minutes
    
    console.log('🔍 Debug Test: Server and Model Initialization')
    console.log('='.repeat(50))
    
    // Navigate to the app
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(3000)
    
    // Skip onboarding
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)
    
    // Check console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text())
      }
    })
    
    // Check network requests
    page.on('request', request => {
      const url = request.url()
      if (url.includes('models') || url.includes('cortex') || url.includes('1337') || url.includes('39291')) {
        console.log('📡 Network Request:', request.method(), url)
      }
    })
    
    page.on('response', response => {
      const url = response.url()
      if (url.includes('models') || url.includes('cortex') || url.includes('1337') || url.includes('39291')) {
        console.log('📥 Network Response:', response.status(), url)
      }
    })
    
    // Go to settings
    console.log('\n📍 Opening Settings...')
    await page.keyboard.press('Meta+Comma')
    await page.waitForTimeout(3000)
    
    // Take screenshot of settings
    await page.screenshot({ 
      path: 'test-results/debug/00-settings.png',
      fullPage: true 
    })
    
    // List all visible text in settings
    console.log('\n📋 Settings Options:')
    const settingsText = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'))
      return buttons.map(b => b.textContent?.trim()).filter(t => t)
    })
    settingsText.forEach(text => console.log(`  - ${text}`))
    
    // Try to find Local AI or similar
    const localAIButton = await page.locator('button, [role="button"]').filter({ hasText: /local|ai|server|api/i }).first()
    if (await localAIButton.isVisible()) {
      const buttonText = await localAIButton.textContent()
      console.log(`\n✅ Found button: "${buttonText}"`)
      await localAIButton.click()
      await page.waitForTimeout(3000)
      
      await page.screenshot({ 
        path: 'test-results/debug/01-local-ai-settings.png',
        fullPage: true 
      })
      
      // Check what's visible in Local AI settings
      console.log('\n📋 Local AI Settings Content:')
      const localAIContent = await page.evaluate(() => {
        return document.body.innerText
      })
      
      // Look for specific elements
      const hasInitButton = localAIContent.includes('Initialize Runtime')
      const hasStartServer = localAIContent.includes('Start server')
      const hasModels = localAIContent.includes('Qwen') || localAIContent.includes('Llama')
      
      console.log(`  Has Initialize Runtime: ${hasInitButton}`)
      console.log(`  Has Start Server: ${hasStartServer}`)
      console.log(`  Has Model Names: ${hasModels}`)
      
      // If Initialize Runtime exists, click it
      if (hasInitButton) {
        console.log('\n📦 Clicking Initialize Runtime...')
        const initButton = await page.locator('button:has-text("Initialize Runtime")').first()
        await initButton.click()
        console.log('⏳ Waiting 20 seconds for initialization...')
        await page.waitForTimeout(20000)
        
        await page.screenshot({ 
          path: 'test-results/debug/02-after-init.png',
          fullPage: true 
        })
      }
    }
    
    // Check Hanzo data directory
    console.log('\n📂 Checking Hanzo Data Directory:')
    const dataInfo = await page.evaluate(async () => {
      // Try to get information about the data directory
      const paths = [
        '~/Library/Application Support/Hanzo/data/extensions/@zenhq/inference-cortex-extension',
        '~/Library/Application Support/com.hanzo.assistant/extensions',
      ]
      return { paths, platform: navigator.platform }
    })
    console.log('  Platform:', dataInfo.platform)
    
    // Go to chat and check for models
    console.log('\n📱 Going to Chat...')
    await page.keyboard.press('Escape') // Exit settings
    await page.waitForTimeout(1000)
    await page.keyboard.press('Tab') // Go to chat
    await page.waitForTimeout(3000)
    
    await page.screenshot({ 
      path: 'test-results/debug/03-chat-view.png',
      fullPage: true 
    })
    
    // Check for "Set up local model"
    const setupButton = await page.locator('text="Set up local model"').first()
    if (await setupButton.isVisible()) {
      console.log('✅ Found "Set up local model" button')
      await setupButton.click()
      console.log('⏳ Loading hub (waiting 20 seconds)...')
      await page.waitForTimeout(20000)
      
      await page.screenshot({ 
        path: 'test-results/debug/04-model-hub.png',
        fullPage: true 
      })
      
      // Check hub content
      const hubContent = await page.evaluate(() => document.body.innerText)
      console.log('\n📋 Hub Content Analysis:')
      console.log(`  Contains "No models found": ${hubContent.includes('No models found')}`)
      console.log(`  Contains "Qwen": ${hubContent.includes('Qwen')}`)
      console.log(`  Contains "Download": ${hubContent.includes('Download') || hubContent.includes('download')}`)
      
      // Count elements that might be model cards
      const potentialCards = await page.locator('div').filter({ hasText: /MB|GB|download/i }).count()
      console.log(`  Potential model cards: ${potentialCards}`)
    }
    
    // Final network check
    console.log('\n📡 Checking Server Endpoints:')
    const endpoints = [
      'http://localhost:1337/v1/models',
      'http://localhost:39291/v1/models',
      'http://localhost:1234/v1/models'
    ]
    
    for (const endpoint of endpoints) {
      try {
        const response = await page.evaluate(async (url) => {
          try {
            const res = await fetch(url, { method: 'GET' })
            return { 
              status: res.status, 
              ok: res.ok,
              headers: res.headers.get('content-type')
            }
          } catch (e) {
            return { error: e.toString() }
          }
        }, endpoint)
        console.log(`  ${endpoint}:`, response)
      } catch (e) {
        console.log(`  ${endpoint}: Failed to check`)
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('Debug test complete. Check test-results/debug/ for screenshots')
  })
})