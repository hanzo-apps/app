/**
 * Test script for LLM router integration
 */

import { llmRouter } from './index'

async function testLLMRouter() {
  console.log('Testing LLM Router integration...')
  
  try {
    // Start the router
    console.log('Starting LLM router...')
    await llmRouter.start()
    
    // Check health
    console.log('Checking health...')
    const isHealthy = await llmRouter.isHealthy()
    console.log('Health check:', isHealthy ? '✅ Healthy' : '❌ Not healthy')
    
    if (isHealthy) {
      // Get available models
      console.log('Fetching available models...')
      const models = await llmRouter.getModels()
      console.log(`Found ${models.length} models:`)
      models.forEach((model: any) => {
        console.log(`  - ${model.id || model.model}`)
      })
    }
    
    // Test chat completion
    console.log('\nTesting chat completion...')
    const response = await fetch('http://localhost:4000/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-test'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Hello, this is a test!' }
        ],
        max_tokens: 100
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Chat completion successful')
      console.log('Response:', data.choices?.[0]?.message?.content || 'No response')
    } else {
      console.log('❌ Chat completion failed:', response.statusText)
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  } finally {
    // Stop the router
    console.log('\nStopping LLM router...')
    await llmRouter.stop()
    console.log('Test complete')
  }
}

// Run test if called directly
if (require.main === module) {
  testLLMRouter()
}