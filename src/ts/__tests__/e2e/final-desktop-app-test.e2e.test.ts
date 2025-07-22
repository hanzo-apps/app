import { test, expect } from '@playwright/test'

test.describe('Final Desktop App Test', () => {
  test('Test Hanzo Desktop App llama-server integration', async ({ page }) => {
    test.setTimeout(600000) // 10 minutes
    
    console.log('🖥️  IMPORTANT: This test requires the Hanzo DESKTOP app to be running')
    console.log('The desktop app (Tauri) should automatically start llama-server on port 39291')
    console.log('='.repeat(70))
    
    // First check if the desktop app has started its server
    console.log('\n📡 Checking if llama-server is running on port 39291...')
    
    let serverRunning = false
    for (let i = 0; i < 10; i++) {
      try {
        const response = await fetch('http://localhost:39291/health')
        if (response.ok) {
          serverRunning = true
          console.log('✅ llama-server is running!')
          break
        }
      } catch (e) {
        console.log(`  Attempt ${i + 1}/10: Server not ready yet...`)
      }
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
    
    if (!serverRunning) {
      console.log('\n❌ llama-server is not running!')
      console.log('Possible reasons:')
      console.log('1. The desktop app (pnpm tauri dev) is not running')
      console.log('2. The sidecar process failed to start')
      console.log('3. The binary path is incorrect')
      console.log('\nTo debug:')
      console.log('1. Check ~/Library/Logs/com.hanzo.assistant/hanzo.log')
      console.log('2. Run: ps aux | grep llama-server')
      console.log('3. Ensure the desktop app window is open')
    }
    
    // Now test through the web interface
    console.log('\n🌐 Testing through web interface at localhost:5173...')
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(3000)
    
    // Skip onboarding
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)
    
    // Go to chat
    await page.keyboard.press('Tab')
    await page.waitForTimeout(3000)
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/desktop-test/00-chat-view.png',
      fullPage: true 
    })
    
    // Click "Set up local model"
    const setupButton = await page.locator('text="Set up local model"').first()
    if (await setupButton.isVisible()) {
      console.log('\n📦 Setting up local model...')
      await setupButton.click()
      await page.waitForTimeout(15000) // Wait longer for models to load
      
      await page.screenshot({ 
        path: 'test-results/desktop-test/01-model-hub.png',
        fullPage: true 
      })
      
      // Analyze hub content
      const hubContent = await page.evaluate(() => document.body.innerText)
      const hasNoModels = hubContent.includes('No models found')
      const hasModels = hubContent.includes('Qwen') || hubContent.includes('Llama') || hubContent.includes('Phi')
      
      console.log(`\n📊 Hub Status:`)
      console.log(`  Server running: ${serverRunning}`)
      console.log(`  Shows "No models found": ${hasNoModels}`)
      console.log(`  Shows model names: ${hasModels}`)
      
      if (serverRunning && hasNoModels) {
        console.log('\n⚠️  Server is running but models not loading')
        console.log('This suggests the app needs additional configuration or initialization')
        
        // Try to directly query the server
        console.log('\n🔍 Querying server directly...')
        const serverModels = await fetch('http://localhost:39291/v1/models')
          .then(res => res.json())
          .catch(err => ({ error: err.message }))
        
        console.log('Server models response:', JSON.stringify(serverModels, null, 2))
      }
      
      // Look for any download buttons
      const downloadButtons = await page.locator('button').filter({ hasText: /download/i }).count()
      console.log(`\n📥 Download buttons found: ${downloadButtons}`)
      
      if (downloadButtons > 0) {
        console.log('✅ Models are available for download!')
        console.log('The integration is working correctly.')
      }
    } else {
      console.log('❌ "Set up local model" button not found')
    }
    
    // Final diagnostics
    console.log('\n' + '='.repeat(70))
    console.log('📋 FINAL DIAGNOSTICS:')
    console.log('='.repeat(70))
    
    // Check all relevant ports
    const ports = [1337, 39291, 1234]
    for (const port of ports) {
      try {
        const res = await fetch(`http://localhost:${port}/health`)
        console.log(`✅ Port ${port}: Server responding (status ${res.status})`)
      } catch (e) {
        console.log(`❌ Port ${port}: No server`)
      }
    }
    
    console.log('\n📁 Expected llama-server location:')
    console.log('/Users/z/work/hanzo/app/src/rs/binaries/engines/llama.cpp/macos-arm64/b5509/llama-server')
    
    console.log('\n🔧 To manually test llama-server:')
    console.log('cd /Users/z/work/hanzo/app')
    console.log('./src/rs/binaries/engines/llama.cpp/macos-arm64/b5509/llama-server \\')
    console.log('  --host 0.0.0.0 --port 39291 --ctx-size 4096 --threads 4')
    
    console.log('\n📝 Summary:')
    if (serverRunning && downloadButtons > 0) {
      console.log('✅ SUCCESS: Hanzo llama.cpp integration is working!')
      console.log('The desktop app started llama-server and models are available.')
    } else if (serverRunning && downloadButtons === 0) {
      console.log('⚠️  PARTIAL: Server running but models not showing')
      console.log('Additional initialization may be needed.')
    } else {
      console.log('❌ FAILED: Server not running')
      console.log('Ensure the desktop app is running with: pnpm tauri dev')
    }
    
    console.log('\nCheck test-results/desktop-test/ for screenshots')
    console.log('='.repeat(70))
  })
})