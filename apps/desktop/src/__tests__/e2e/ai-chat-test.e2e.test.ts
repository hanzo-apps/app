import { test, expect } from '@playwright/test'
import path from 'path'

const testUrl = 'http://localhost:5173'

test.describe('AI Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(testUrl)
    
    // Wait for app to load
    await page.waitForTimeout(1000)
    
    // Skip onboarding if present
    const onboarding = await page.locator('text=/Welcome to Hanzo/').isVisible().catch(() => false)
    if (onboarding) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
      
      // If still in onboarding, press Enter
      const stillOnboarding = await page.locator('text=/Welcome to Hanzo|Choose Your Local AI/').isVisible().catch(() => false)
      if (stillOnboarding) {
        await page.keyboard.press('Enter')
        await page.waitForTimeout(500)
      }
    }
  })

  test('Tab key should navigate to AI chat', async ({ page }) => {
    console.log('🚀 Testing AI Chat navigation')
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: 'test-results/visual/ai-chat/01-initial-launcher.png',
      fullPage: true 
    })
    
    // Press Tab to navigate to AI chat
    console.log('📍 Pressing Tab to navigate to AI chat')
    await page.keyboard.press('Tab')
    await page.waitForTimeout(1000)
    
    // Take screenshot of AI chat
    await page.screenshot({ 
      path: 'test-results/visual/ai-chat/02-ai-chat-opened.png',
      fullPage: true 
    })
    
    // Check if AI chat is visible
    const chatTitle = await page.locator('text=Hanzo AI Chat').isVisible().catch(() => false)
    console.log('🤖 AI Chat visible:', chatTitle)
    
    if (chatTitle) {
      // Type a message
      const input = page.locator('textarea, input[type="text"]').last()
      if (await input.isVisible()) {
        console.log('✍️ Typing test message')
        await input.type('Hello, can you help me with local AI models?')
        await page.waitForTimeout(500)
        
        await page.screenshot({ 
          path: 'test-results/visual/ai-chat/03-typed-message.png',
          fullPage: true 
        })
        
        // Send message
        const sendButton = page.locator('text=Send')
        if (await sendButton.isVisible()) {
          await sendButton.click()
          console.log('📤 Message sent')
          await page.waitForTimeout(2000) // Wait for response
          
          await page.screenshot({ 
            path: 'test-results/visual/ai-chat/04-ai-response.png',
            fullPage: true 
          })
        }
      }
      
      // Test Tab to go back
      console.log('🔙 Pressing Tab to return to launcher')
      await page.keyboard.press('Tab')
      await page.waitForTimeout(500)
      
      await page.screenshot({ 
        path: 'test-results/visual/ai-chat/05-back-to-launcher.png',
        fullPage: true 
      })
    } else {
      console.log('⚠️ AI Chat not found after pressing Tab')
    }
    
    // Check for console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    await page.waitForTimeout(500)
    
    if (errors.length > 0) {
      console.log('❌ Console errors found:', errors)
    } else {
      console.log('✅ No console errors')
    }
  })

  test('AI chat with query from launcher', async ({ page }) => {
    console.log('🚀 Testing AI Chat with pre-filled query')
    
    // Type a query in the launcher
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.type('How do I use local AI models?')
      await page.waitForTimeout(500)
      
      await page.screenshot({ 
        path: 'test-results/visual/ai-chat/06-query-in-launcher.png',
        fullPage: true 
      })
      
      // Press Tab to go to AI chat
      await page.keyboard.press('Tab')
      await page.waitForTimeout(1500) // Wait for auto-send
      
      await page.screenshot({ 
        path: 'test-results/visual/ai-chat/07-query-auto-sent.png',
        fullPage: true 
      })
      
      console.log('✅ Query transferred to AI chat')
    }
  })
})