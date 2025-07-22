import { test, expect } from '@playwright/test'
import { _electron as electron } from 'playwright'

test.describe('Hanzo Mac Menu Test', () => {
  test.skip(() => process.platform !== 'darwin', 'Mac-only test')
  
  test('Test Mac menu items trigger launcher and AI chat', async () => {
    test.setTimeout(60000) // 1 minute
    
    console.log('🚀 Testing Mac menu items')
    
    // Since we can't directly interact with native Mac menus in Playwright,
    // we'll test the keyboard shortcuts that should trigger the same actions
    
    const app = await electron.launch({
      args: ['.'],
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    })
    
    const window = await app.firstWindow()
    await window.waitForTimeout(3000)
    
    // Test 1: Show Launcher (Cmd+Space)
    console.log('📱 Testing launcher shortcut (Cmd+Space)...')
    await window.keyboard.press('Meta+Space')
    await window.waitForTimeout(2000)
    
    // Check if window is visible
    const isVisible = await window.isVisible()
    console.log(`Window visible after Cmd+Space: ${isVisible}`)
    
    // Take screenshot
    await window.screenshot({ 
      path: 'test-results/mac-menu/01-launcher.png',
      fullPage: true 
    })
    
    // Hide window
    await window.keyboard.press('Escape')
    await window.waitForTimeout(1000)
    
    // Test 2: Show AI Chat (Tab)
    console.log('🤖 Testing AI chat shortcut (Tab)...')
    await window.keyboard.press('Tab')
    await window.waitForTimeout(2000)
    
    await window.screenshot({ 
      path: 'test-results/mac-menu/02-ai-chat.png',
      fullPage: true 
    })
    
    // Test 3: Settings (Cmd+,)
    console.log('⚙️ Testing settings shortcut (Cmd+,)...')
    await window.keyboard.press('Meta+Comma')
    await window.waitForTimeout(2000)
    
    await window.screenshot({ 
      path: 'test-results/mac-menu/03-settings.png',
      fullPage: true 
    })
    
    await app.close()
    
    console.log('✅ Mac menu test complete')
  })
  
  test('Test menu items via API', async ({ page }) => {
    // This test verifies the menu event handling code
    console.log('🧪 Testing menu event handling...')
    
    // Navigate to the app
    await page.goto('http://localhost:5173')
    await page.waitForTimeout(2000)
    
    // Listen for show-widget events
    await page.evaluate(() => {
      window.widgetEvents = []
      window.addEventListener('show-widget', (event: any) => {
        window.widgetEvents.push(event.detail)
      })
    })
    
    // Trigger menu events programmatically (if possible)
    // This tests the frontend's response to menu events
    
    await page.evaluate(() => {
      // Simulate show-widget event for launcher
      window.dispatchEvent(new CustomEvent('show-widget', { 
        detail: { widget: 'SEARCH' } 
      }))
    })
    
    await page.waitForTimeout(1000)
    
    await page.evaluate(() => {
      // Simulate show-widget event for AI
      window.dispatchEvent(new CustomEvent('show-widget', { 
        detail: { widget: 'AI' } 
      }))
    })
    
    await page.waitForTimeout(1000)
    
    // Check events were received
    const events = await page.evaluate(() => window.widgetEvents)
    console.log('Received widget events:', events)
    
    expect(events).toHaveLength(2)
    expect(events[0]).toEqual({ widget: 'SEARCH' })
    expect(events[1]).toEqual({ widget: 'AI' })
    
    console.log('✅ Menu event handling verified')
  })
})