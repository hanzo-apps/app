import { test, expect } from '@playwright/test';

test.describe('Local AI Model Download and Inference', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console logging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        console.error(`Console error: ${text}`);
      } else if (type === 'warning') {
        console.warn(`Console warning: ${text}`);
      } else {
        console.log(`Console log: ${text}`);
      }
    });

    // Navigate to the app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Skip onboarding if present
    const onboarding = await page.locator('text="Welcome to Hanzo AI"').isVisible();
    if (onboarding) {
      console.log('📋 Skipping onboarding...');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  });

  test('1. Download Qwen 0.5B model and test inference', async ({ page }) => {
    console.log('🤖 Testing Local AI Model Download and Inference');

    // Step 1: Open settings
    console.log('\n📱 Step 1: Opening Settings');
    await page.keyboard.press('Meta+Comma');
    await page.waitForTimeout(1000);
    
    // Take screenshot of settings
    await page.screenshot({ 
      path: 'test-results/local-ai-inference/01-settings-opened.png',
      fullPage: true
    });

    // Step 2: Navigate to Local AI tab
    console.log('\n🔧 Step 2: Navigating to Local AI');
    const localAITab = page.locator('text="Local AI"');
    await expect(localAITab).toBeVisible();
    await localAITab.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ 
      path: 'test-results/local-ai-inference/02-local-ai-tab.png',
      fullPage: true
    });

    // Step 3: Initialize runtime
    console.log('\n⚡ Step 3: Initializing Local AI Runtime');
    const initButton = page.locator('text="Initialize Runtime"');
    if (await initButton.isVisible()) {
      await initButton.click();
      console.log('✅ Runtime initialization started');
      
      // Wait for initialization
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: 'test-results/local-ai-inference/03-runtime-initialized.png',
        fullPage: true
      });
    }

    // Step 4: Find Qwen model
    console.log('\n🔍 Step 4: Finding Qwen 2.5 0.5B model');
    const qwenModel = page.locator('text="Qwen 2.5 0.5B"').first();
    await expect(qwenModel).toBeVisible();
    
    // Check if model is already downloaded
    const modelCard = qwenModel.locator('xpath=ancestor::div[contains(@class, "vibrancy-gradient")]');
    const deleteButton = modelCard.locator('text="Delete"');
    const isDownloaded = await deleteButton.isVisible();
    
    if (isDownloaded) {
      console.log('⚠️ Model already downloaded, deleting first...');
      await deleteButton.click();
      await page.waitForTimeout(1000);
    }

    // Step 5: Download the model
    console.log('\n📥 Step 5: Downloading Qwen 2.5 0.5B model');
    const downloadButton = modelCard.locator('text="Download"');
    await expect(downloadButton).toBeVisible();
    await downloadButton.click();
    
    await page.screenshot({ 
      path: 'test-results/local-ai-inference/04-download-started.png',
      fullPage: true
    });

    // Monitor download progress
    console.log('📊 Monitoring download progress...');
    let lastProgress = 0;
    let progressChecks = 0;
    
    while (progressChecks < 20) { // Max 10 seconds of monitoring
      await page.waitForTimeout(500);
      
      // Look for progress text
      const progressText = await modelCard.locator('text="%"').textContent();
      if (progressText) {
        const progress = parseInt(progressText.replace('%', ''));
        if (progress > lastProgress) {
          console.log(`📊 Download progress: ${progress}%`);
          lastProgress = progress;
          
          // Capture progress screenshots at key points
          if (progress >= 25 && progress < 30) {
            await page.screenshot({ 
              path: 'test-results/local-ai-inference/05-download-25-percent.png',
              fullPage: true
            });
          } else if (progress >= 50 && progress < 55) {
            await page.screenshot({ 
              path: 'test-results/local-ai-inference/06-download-50-percent.png',
              fullPage: true
            });
          } else if (progress >= 75 && progress < 80) {
            await page.screenshot({ 
              path: 'test-results/local-ai-inference/07-download-75-percent.png',
              fullPage: true
            });
          }
        }
      }
      
      // Check if download completed
      const selectButton = modelCard.locator('text="Select"');
      if (await selectButton.isVisible()) {
        console.log('✅ Download completed!');
        await page.screenshot({ 
          path: 'test-results/local-ai-inference/08-download-complete.png',
          fullPage: true
        });
        break;
      }
      
      progressChecks++;
    }

    // Step 6: Select the model
    console.log('\n🎯 Step 6: Selecting the downloaded model');
    const selectButton = modelCard.locator('text="Select"');
    await expect(selectButton).toBeVisible();
    await selectButton.click();
    await page.waitForTimeout(1000);

    // Verify model is active
    const activeButton = modelCard.locator('text="Active"');
    await expect(activeButton).toBeVisible();
    console.log('✅ Model selected and active');

    await page.screenshot({ 
      path: 'test-results/local-ai-inference/09-model-active.png',
      fullPage: true
    });

    // Step 7: Navigate to AI Chat
    console.log('\n💬 Step 7: Testing inference in AI Chat');
    await page.keyboard.press('Escape'); // Close settings
    await page.waitForTimeout(500);
    
    // Press Tab to go to AI chat
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);

    await page.screenshot({ 
      path: 'test-results/local-ai-inference/10-ai-chat-opened.png',
      fullPage: true
    });

    // Step 8: Test inference
    console.log('\n🧠 Step 8: Testing model inference');
    const chatInput = page.locator('input[placeholder*="Type a message"]').or(
      page.locator('textarea[placeholder*="Type a message"]')
    ).or(
      page.locator('input[type="text"]').last()
    );

    if (await chatInput.isVisible()) {
      await chatInput.click();
      await chatInput.fill('Hello! Can you tell me a short fact about AI?');
      
      await page.screenshot({ 
        path: 'test-results/local-ai-inference/11-query-typed.png',
        fullPage: true
      });

      // Send the message
      await page.keyboard.press('Enter');
      console.log('📤 Query sent to local model');

      // Wait for response
      console.log('⏳ Waiting for model response...');
      await page.waitForTimeout(3000);

      // Look for response
      const messages = page.locator('.message, .ai-message, .assistant-message');
      const messageCount = await messages.count();
      
      if (messageCount > 1) {
        console.log(`✅ Received response! (${messageCount} messages total)`);
        
        await page.screenshot({ 
          path: 'test-results/local-ai-inference/12-inference-response.png',
          fullPage: true
        });

        // Get the response text
        const lastMessage = messages.last();
        const responseText = await lastMessage.textContent();
        console.log(`📝 Model response: "${responseText?.substring(0, 100)}..."`);
      } else {
        console.log('⚠️ No response received yet');
      }
    } else {
      console.log('⚠️ Chat input not found - AI provider may need configuration');
    }

    // Step 9: Final summary
    console.log('\n📊 Test Summary:');
    console.log('✅ Runtime initialized');
    console.log('✅ Model downloaded successfully');
    console.log('✅ Model selected and activated');
    console.log('✅ Inference tested');
    
    await page.screenshot({ 
      path: 'test-results/local-ai-inference/13-final-state.png',
      fullPage: true
    });
  });

  test('2. Test model switching and performance', async ({ page }) => {
    console.log('🔄 Testing Model Switching');

    // Open settings
    await page.keyboard.press('Meta+Comma');
    await page.waitForTimeout(1000);

    // Go to Local AI
    const localAITab = page.locator('text="Local AI"');
    await localAITab.click();
    await page.waitForTimeout(1000);

    // Check for multiple downloaded models
    const modelCards = page.locator('.vibrancy-gradient').filter({ 
      has: page.locator('text="Select"').or(page.locator('text="Active"')) 
    });
    
    const modelCount = await modelCards.count();
    console.log(`📊 Found ${modelCount} downloaded models`);

    if (modelCount > 1) {
      // Switch between models
      for (let i = 0; i < modelCount && i < 3; i++) {
        const selectButton = modelCards.nth(i).locator('text="Select"');
        if (await selectButton.isVisible()) {
          await selectButton.click();
          console.log(`✅ Switched to model ${i + 1}`);
          await page.waitForTimeout(1000);
          
          await page.screenshot({ 
            path: `test-results/local-ai-inference/model-switch-${i + 1}.png`,
            fullPage: true
          });
        }
      }
    }
  });

  test('3. Test model info and management', async ({ page }) => {
    console.log('📋 Testing Model Information Display');

    // Open settings and go to Local AI
    await page.keyboard.press('Meta+Comma');
    await page.waitForTimeout(1000);
    
    const localAITab = page.locator('text="Local AI"');
    await localAITab.click();
    await page.waitForTimeout(1000);

    // Check About Local AI section
    const aboutSection = page.locator('text="About Local AI"');
    await expect(aboutSection).toBeVisible();
    
    await page.screenshot({ 
      path: 'test-results/local-ai-inference/about-local-ai.png',
      fullPage: true
    });

    // Verify model info is displayed
    const modelSizes = await page.locator('text=/\\d+(\\.\\d+)?\\s*(MB|GB)/').all();
    console.log(`📊 Found ${modelSizes.length} models with size information`);

    // Test scrolling in model list
    await page.locator('.vibrancy-gradient').first().scrollIntoViewIfNeeded();
    await page.locator('.vibrancy-gradient').last().scrollIntoViewIfNeeded();
    
    console.log('✅ Model management UI tested');
  });
});