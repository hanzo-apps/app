import { test, expect } from '@playwright/test'

test.describe('Final Model Download Test', () => {
  test('Complete model download flow', async ({ page }) => {
    test.setTimeout(600000) // 10 minutes
    
    console.log('🚀 Starting Final Model Download Test')
    console.log('⚠️  NOTE: This test assumes Zen or LM Studio is running on localhost:1337 or localhost:1234')
    console.log('⚠️  Please start Zen/LM Studio before running this test!')
    
    // Navigate to the app
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
      path: 'test-results/final-download/00-initial.png',
      fullPage: true 
    })
    
    // Look for "Set up local model" button
    const setupButton = await page.locator('text="Set up local model"').first()
    if (await setupButton.isVisible()) {
      console.log('✅ Found "Set up local model" button')
      await setupButton.click()
      await page.waitForTimeout(5000)
      
      // Screenshot hub page
      await page.screenshot({ 
        path: 'test-results/final-download/01-hub-page.png',
        fullPage: true 
      })
      
      // Wait longer for models to load
      console.log('⏳ Waiting for models to load from backend...')
      await page.waitForTimeout(15000)
      
      // Take another screenshot
      await page.screenshot({ 
        path: 'test-results/final-download/02-models-loaded.png',
        fullPage: true 
      })
      
      // Try to find and download the smallest model
      console.log('🔍 Looking for downloadable models...')
      
      // Method 1: Look for download buttons by text
      let downloadClicked = false
      const downloadTexts = ['Download', 'download', 'Install', 'Get']
      
      for (const text of downloadTexts) {
        const buttons = await page.locator(`button:has-text("${text}")`).all()
        console.log(`Found ${buttons.length} buttons with text "${text}"`)
        
        if (buttons.length > 0) {
          console.log(`📥 Clicking first ${text} button`)
          await buttons[0].click()
          downloadClicked = true
          break
        }
      }
      
      if (!downloadClicked) {
        // Method 2: Look for model cards and find download actions
        const modelCards = await page.locator('[class*="card"], [class*="Card"]').all()
        console.log(`Found ${modelCards.length} model cards`)
        
        for (const card of modelCards) {
          const cardText = await card.textContent()
          console.log(`Card contains: ${cardText?.substring(0, 100)}...`)
          
          // Look for download icon or button within this card
          const downloadButton = await card.locator('button, [role="button"], svg[class*="download"], svg[class*="Download"]').first()
          if (await downloadButton.isVisible()) {
            console.log('📥 Found download element in card, clicking...')
            await downloadButton.click()
            downloadClicked = true
            break
          }
        }
      }
      
      if (downloadClicked) {
        console.log('⏳ Download initiated, monitoring progress...')
        await page.waitForTimeout(5000)
        
        // Monitor download progress
        let downloadComplete = false
        let attempts = 0
        const maxAttempts = 60 // 5 minutes
        
        while (!downloadComplete && attempts < maxAttempts) {
          await page.waitForTimeout(5000)
          attempts++
          
          // Look for progress indicators
          const progressText = await page.locator('text=/%|downloading|progress/i').first().textContent().catch(() => '')
          if (progressText) {
            console.log(`  Progress: ${progressText}`)
          }
          
          // Check for completion
          const useButton = await page.locator('button:has-text("Use")').first()
          if (await useButton.isVisible()) {
            console.log('✅ Download complete! "Use" button appeared')
            downloadComplete = true
            
            // Click Use button
            await useButton.click()
            await page.waitForTimeout(3000)
            
            // Should be back in chat with model loaded
            await page.screenshot({ 
              path: 'test-results/final-download/03-model-loaded.png',
              fullPage: true 
            })
            
            // Try sending a message
            const messageInput = await page.locator('textarea, input[type="text"]').first()
            if (await messageInput.isVisible()) {
              console.log('📝 Testing inference...')
              await messageInput.fill('Hello, can you introduce yourself?')
              await page.keyboard.press('Enter')
              await page.waitForTimeout(10000)
              
              await page.screenshot({ 
                path: 'test-results/final-download/04-inference-test.png',
                fullPage: true 
              })
            }
          }
          
          // Periodic screenshots
          if (attempts % 6 === 0) {
            await page.screenshot({ 
              path: `test-results/final-download/progress-${attempts}.png`,
              fullPage: true 
            })
          }
        }
      } else {
        console.log('❌ Could not find any download buttons')
        console.log('This likely means:')
        console.log('1. Zen/LM Studio is not running on localhost:1337 or localhost:1234')
        console.log('2. The backend is not returning model data')
        console.log('3. The UI is not rendering download buttons')
      }
    } else {
      console.log('❌ "Set up local model" button not found')
      console.log('The app might already have models configured')
    }
    
    // Final screenshot
    await page.screenshot({ 
      path: 'test-results/final-download/final-state.png',
      fullPage: true 
    })
    
    console.log('\n📊 Test Summary:')
    console.log('- Check test-results/final-download/ for screenshots')
    console.log('- If no models appeared, ensure Zen/LM Studio is running')
    console.log('- The app expects backend at localhost:1337 or localhost:1234')
  })
})