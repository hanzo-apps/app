# LLM Router Setup Guide

The LLM Router provides unified access to 100+ LLM providers through a single OpenAI-compatible API. It runs automatically alongside Hanzo App.

## Overview

When you start Hanzo App, two services launch:
1. **MCP Server** - Exposes system tools to AI
2. **LLM Router** - Provides access to AI models

Together, they create a complete AI assistant experience.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Hanzo App  │────▶│  LLM Router  │────▶│ 100+ Providers  │
│   Chat UI   │     │ (Port 4000)  │     │ (OpenAI, etc)   │
└─────────────┘     └──────────────┘     └─────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │ Local Models │
                    │ (llama.cpp)  │
                    └──────────────┘
```

## Automatic Startup

The LLM Router starts automatically with Hanzo App:

```typescript
// In main.tsx
import { llmRouter } from './lib/llm-router'

// Start LLM router alongside the MCP server
llmRouter.start().catch(error => {
  console.error('Failed to start LLM router:', error)
})
```

## Configuration

### Basic Setup

The router uses `src/ts/chat/lib/llm-router/config.yaml`:

```yaml
model_list:
  # Local model (auto-detected)
  - model_name: "qwen-0.5b"
    litellm_params:
      model: "openai/qwen-0.5b"
      api_base: "http://localhost:8080/v1"
      api_key: "dummy"
    model_info:
      max_tokens: 2048
      
  # Cloud models (requires API keys)
  - model_name: "gpt-3.5-turbo"
    litellm_params:
      model: "gpt-3.5-turbo"
      api_key: "os.environ/OPENAI_API_KEY"
      
  - model_name: "claude-3.5-sonnet"
    litellm_params:
      model: "claude-3-5-sonnet-20241022"
      api_key: "os.environ/ANTHROPIC_API_KEY"

general_settings:
  master_key: "sk-hanzo-local"  # For local use
  
litellm_settings:
  drop_params: true
  set_verbose: false
```

### Environment Variables

Create `.env` in the app root:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Together AI (for open models)
TOGETHER_API_KEY=...

# Local models path (auto-detected)
HANZO_MODELS_PATH=~/Library/Application Support/Hanzo/data/models
```

## Local Model Support

### Automatic Model Detection

Hanzo App automatically detects and loads models from:
- `~/Library/Application Support/Hanzo/data/models/`

### Installing Local Models

1. **Quick Test Model**:
   ```bash
   make install-test-model
   ```
   This installs a small Qwen model for testing.

2. **Add Your Own Models**:
   ```bash
   # Copy GGUF models to the models directory
   cp your-model.gguf ~/Library/Application\ Support/Hanzo/data/models/
   ```

3. **Supported Formats**:
   - GGUF (recommended)
   - GGML (legacy)
   - Llama.cpp compatible models

### llama-server Integration

The app automatically manages llama-server:
- Starts when models are detected
- Stops when no models are available
- Configures optimal settings for your hardware

## Using the LLM Router

### In Hanzo App

The chat interface automatically uses the LLM router:

```typescript
// Already configured in ai.service.ts
const llmRouterEndpoint = 'http://localhost:4000/v1/chat/completions'
```

### API Access

The router exposes an OpenAI-compatible API:

```bash
# List available models
curl http://localhost:4000/v1/models

# Chat completion
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-hanzo-local" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Streaming Support

```javascript
const response = await fetch('http://localhost:4000/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sk-hanzo-local'
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Tell me a story' }],
    stream: true
  })
})

// Handle streaming response
const reader = response.body.getReader()
// ... process chunks
```

## Advanced Features

### Failover Configuration

```yaml
router_settings:
  routing_strategy: "simple-shuffle"
  fallbacks: 
    - "gpt-3.5-turbo"
    - "claude-instant"
    - "local-model"
```

### Cost Optimization

```yaml
router_settings:
  routing_strategy: "cost-based-routing"
  max_cost_per_request: 0.10
  prefer_local_models: true
```

### Load Balancing

```yaml
model_list:
  - model_name: "gpt-4"
    litellm_params:
      model: "gpt-4"
      api_key: ["key1", "key2", "key3"]  # Round-robin
```

### Rate Limiting

```yaml
litellm_settings:
  max_parallel_requests: 100
  request_timeout: 600
  rpm: 60  # requests per minute per model
```

## Monitoring

### Health Check

```bash
# Check if router is healthy
curl http://localhost:4000/health
```

### Logs

The router logs to:
- Console (development)
- `llm_server.log` (production)

### Metrics

Track usage and performance:
- Token usage per model
- Response times
- Error rates
- Cost tracking

## Troubleshooting

### Router Won't Start

1. **Check Python Environment**:
   ```bash
   cd ../llm
   python --version  # Should be 3.9+
   ```

2. **Install Dependencies**:
   ```bash
   cd ../llm
   make setup
   ```

3. **Port Conflict**:
   ```bash
   lsof -i :4000  # Check if port is in use
   ```

### Models Not Available

1. **Check Configuration**:
   - Verify API keys in `.env`
   - Check `config.yaml` syntax

2. **Test Direct Access**:
   ```bash
   curl http://localhost:4000/v1/models
   ```

3. **Check Logs**:
   Look for errors in console output

### Local Models Not Working

1. **Verify Model Path**:
   ```bash
   ls ~/Library/Application\ Support/Hanzo/data/models/
   ```

2. **Check llama-server**:
   ```bash
   ps aux | grep llama-server
   ```

3. **Test Model Loading**:
   ```bash
   curl http://localhost:8080/v1/models
   ```

## Integration with MCP

The LLM Router works seamlessly with MCP tools:

```typescript
// MCP tools can use AI
const aiAnalysisTool: MCPTool = {
  name: 'ai_analyze_file',
  description: 'Analyze file contents with AI',
  handler: async (args) => {
    const content = await readTextFile(args.path)
    
    const analysis = await fetch('http://localhost:4000/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Analyze this file:\n\n${content}`
        }]
      })
    })
    
    return analysis.choices[0].message.content
  }
}
```

## Performance Optimization

### 1. Use Local Models for Privacy

```yaml
router_settings:
  routing_strategy: "local-first"
  fallback_to_cloud: true
```

### 2. Enable Caching

```yaml
litellm_settings:
  enable_caching: true
  cache_ttl: 3600
```

### 3. Batch Requests

```javascript
// Process multiple prompts efficiently
const responses = await Promise.all(
  prompts.map(prompt => 
    llmRouter.complete({ messages: [{ role: 'user', content: prompt }] })
  )
)
```

## Security Best Practices

1. **API Key Management**:
   - Never commit API keys
   - Use environment variables
   - Rotate keys regularly

2. **Access Control**:
   - Local-only by default (127.0.0.1)
   - Use master key for authentication
   - Implement rate limiting

3. **Data Privacy**:
   - Use local models for sensitive data
   - Disable telemetry for cloud providers
   - Log sanitization

## Next Steps

- [Local AI Models Guide](./local-ai-models) - Set up more models
- [MCP Integration](./mcp-server-setup) - Connect with MCP tools
- [API Reference](../api-reference/llm-router) - Complete API docs
- [Provider Configuration](../developer/llm-providers) - Add new providers