import { test, expect } from '@playwright/test'

test.describe('AI Chat Exploration', () => {
  test('Explore AI chat and model options', async ({ page }) => {
    test.setTimeout(120000) // 2 minutes
    
    console.log('🚀 Starting AI Chat Exploration')
    
    // Navigate to the app
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(3000)
    
    // Skip onboarding
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)
    
    // Navigate to AI Chat
    console.log('🤖 Navigating to AI Chat')
    await page.keyboard.press('Tab')
    await page.waitForTimeout(3000)
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/ai-exploration/00-initial.png',
      fullPage: true 
    })
    
    // Get all visible text
    const visibleText = await page.textContent('body')
    console.log('📄 Visible text:', visibleText?.replace(/\s+/g, ' ').substring(0, 500))
    
    // Find all buttons
    const buttons = await page.locator('button').all()
    console.log(`\n🔘 Found ${buttons.length} buttons:`)
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent()
      const isVisible = await buttons[i].isVisible()
      console.log(`  Button ${i}: "${text?.trim()}" (visible: ${isVisible})`)
    }
    
    // Find all clickable elements
    const clickables = await page.locator('button, a[href], [role="button"], [onclick]').all()
    console.log(`\n🖱️ Found ${clickables.length} clickable elements`)
    
    // Look for specific elements
    const elements = {
      'Set up local model button': await page.locator('button:has-text("Set up local model")').count(),
      'Set up remote provider button': await page.locator('button:has-text("Set up remote provider")').count(),
      'Any setup button': await page.locator('button:has-text("Set up")').count(),
      'Model-related text': await page.locator('text=/model|llm|ai/i').count(),
      'Input fields': await page.locator('input, textarea').count(),
      'Settings links': await page.locator('a[href*="settings"], button:has-text("Settings")').count()
    }
    
    console.log('\n📊 Element analysis:', elements)
    
    // Try clicking the "Set up local model" button if it exists
    const setupLocalButton = await page.locator('button:has-text("Set up local model")').first()
    if (await setupLocalButton.isVisible().catch(() => false)) {
      console.log('\n✅ Found "Set up local model" button, clicking...')
      await setupLocalButton.click()
      await page.waitForTimeout(5000)
      
      await page.screenshot({ 
        path: 'test-results/ai-exploration/01-after-local-setup-click.png',
        fullPage: true 
      })
      
      // Check what appeared
      const newPageText = await page.textContent('body')
      console.log('📄 New page content:', newPageText?.replace(/\s+/g, ' ').substring(0, 300))
    } else {
      console.log('\n❌ "Set up local model" button not found or not visible')
    }
    
    // Try clicking the "Set up remote provider" button
    const setupRemoteButton = await page.locator('button:has-text("Set up remote provider")').first()
    if (await setupRemoteButton.isVisible().catch(() => false)) {
      console.log('\n✅ Found "Set up remote provider" button, clicking...')
      await setupRemoteButton.click()
      await page.waitForTimeout(3000)
      
      await page.screenshot({ 
        path: 'test-results/ai-exploration/02-after-remote-setup-click.png',
        fullPage: true 
      })
    }
    
    // Try to navigate to settings through the sidebar
    console.log('\n⚙️ Trying to access settings...')
    const settingsButton = await page.locator('button:has-text("Settings"), a:has-text("Settings"), [aria-label*="settings"]').first()
    if (await settingsButton.isVisible().catch(() => false)) {
      await settingsButton.click()
      await page.waitForTimeout(2000)
      
      await page.screenshot({ 
        path: 'test-results/ai-exploration/03-settings.png',
        fullPage: true 
      })
      
      // Look for Local AI in settings
      const localAIOption = await page.locator('text="Local AI"').first()
      if (await localAIOption.isVisible().catch(() => false)) {
        console.log('✅ Found Local AI in settings, clicking...')
        await localAIOption.click()
        await page.waitForTimeout(2000)
        
        await page.screenshot({ 
          path: 'test-results/ai-exploration/04-local-ai-settings.png',
          fullPage: true 
        })
      }
    }
    
    // Check for any model-related UI
    const modelUI = {
      'Model dropdown': await page.locator('select, [role="combobox"]').count(),
      'Model cards': await page.locator('[class*="model"], [data-model]').count(),
      'Download buttons': await page.locator('button:has-text("Download")').count(),
      'Hub link': await page.locator('a[href*="hub"], a[href*="hugging"], text=/hub/i').count()
    }
    
    console.log('\n🤖 Model UI elements:', modelUI)
    
    // Try to find chat input
    const chatInputs = await page.locator('textarea, input[type="text"]:not([readonly]), [contenteditable="true"]').all()
    console.log(`\n💬 Found ${chatInputs.length} potential chat inputs`)
    
    if (chatInputs.length > 0) {
      const lastInput = chatInputs[chatInputs.length - 1]
      if (await lastInput.isVisible()) {
        console.log('✅ Chat input is available')
        await lastInput.fill('Test message')
        
        await page.screenshot({ 
          path: 'test-results/ai-exploration/05-with-message.png',
          fullPage: true 
        })
      }
    }
    
    console.log('\n✅ AI Chat Exploration Complete!')
  })
})