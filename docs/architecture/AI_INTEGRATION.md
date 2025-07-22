# AI Integration Guide

This guide explains how to integrate the AI capabilities from Jan into the Koan app.

## Architecture Overview

The AI integration consists of:
1. **AI Widget** - The chat interface (already implemented)
2. **AI Backend** - Local inference engine from Jan
3. **Model Management** - Download and manage AI models
4. **API Gateway** - OpenAI-compatible API

## Setup Instructions

### 1. Install AI Dependencies

```bash
# Add AI-related dependencies
yarn add @janhq/core axios
```

### 2. Set Up Local Inference

The AI core from Jan has been copied to `src/ai/`. To enable local inference:

1. Set up Cortex server (from Jan)
2. Configure model endpoints
3. Update the AI widget to use real inference

### 3. Configure AI Service

Create `src/services/ai.service.ts`:

```typescript
import { ChatMessage } from '../ai/types'

class AIService {
  private baseURL = 'http://localhost:1337/v1' // Cortex default
  
  async sendMessage(message: string): Promise<string> {
    // Implement OpenAI-compatible API call
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'zen', // Our custom model name
        messages: [{ role: 'user', content: message }],
      }),
    })
    
    const data = await response.json()
    return data.choices[0].message.content
  }
}

export const aiService = new AIService()
```

### 4. Update AI Widget

Update `src/widgets/ai.widget.tsx` to use the real AI service instead of mock responses.

### 5. Model Management

Implement model downloading and management:
- Use Jan's extension system for model downloads
- Store models in app data directory
- Provide UI for model selection

## Cloud Fallback

For platforms that can't run local models:
1. Use OpenAI API as fallback
2. Implement provider selection
3. Handle API key management securely

## Performance Optimization

- Implement response streaming
- Add caching for common queries
- Use smaller models on mobile devices
- Implement context pruning for long conversations

## Security Considerations

- Never store API keys in code
- Use secure storage for credentials
- Implement rate limiting
- Add content filtering where needed