# BYOK (Bring Your Own Key) Provider System

Complete multi-provider system for Hanzo AI with localStorage API key management, rate limiting, retry logic, and dynamic model discovery.

## Features

✅ **8 LLM Providers**: OpenRouter, OpenAI, Anthropic, Groq, Google Gemini, SambaNova, Ollama, LM Studio
✅ **localStorage API Keys**: Secure local storage with `hanzo_api_key_` prefix
✅ **Rate Limiting**: Per-provider rate limiting with configurable windows
✅ **Retry Logic**: Exponential backoff for failed requests
✅ **Model Discovery**: Dynamic model fetching from provider APIs
✅ **API Key Validation**: Test keys before saving
✅ **@hanzo/ui Integration**: Beautiful settings UI components
✅ **TypeScript**: Full type safety throughout

## Installation

The provider system is already integrated into this project. To use it:

```typescript
import {
  getAllProviders,
  getProvider,
  setApiKey,
  chatCompletion
} from '@/lib/llm/providers';
```

## Quick Start

### 1. Configure an API Key

```typescript
import { setApiKey, validateApiKey } from '@/lib/llm/providers';

// Save OpenAI API key
setApiKey('openai', 'sk-...');

// Validate it
const result = await validateApiKey('openai', 'sk-...');
if (result.valid) {
  console.log('API key is valid!');
}
```

### 2. Fetch Available Models

```typescript
import { fetchModels, getApiKey } from '@/lib/llm/providers';

// Fetch models for OpenAI
const apiKey = getApiKey('openai');
const models = await fetchModels('openai', apiKey!);

console.log(`Found ${models.length} models`);
models.forEach(model => {
  console.log(`${model.name}: ${model.contextLength} tokens`);
});
```

### 3. Make a Chat Completion Request

```typescript
import { chatCompletion, getApiKey } from '@/lib/llm/providers';

const apiKey = getApiKey('openai');
const response = await chatCompletion(
  'openai',
  {
    model: 'gpt-4',
    messages: [
      { role: 'user', content: 'Hello, how are you?' }
    ],
    temperature: 0.7,
    max_tokens: 150
  },
  apiKey!
);

console.log(response.choices[0].message.content);
```

### 4. Use the Settings UI

```typescript
import { ProviderSettings, ModelSelector } from '@/components/settings';

// In your page/component
export default function SettingsPage() {
  return (
    <div>
      <ProviderSettings />
    </div>
  );
}
```

## Supported Providers

### Cloud Providers

| Provider | ID | Models | Features |
|----------|-----|---------|----------|
| **OpenRouter** | `openrouter` | 200+ models | Multi-provider access |
| **OpenAI** | `openai` | GPT-4, GPT-3.5 | Function calling, vision |
| **Anthropic** | `anthropic` | Claude 3.5 Sonnet, Opus, Haiku | 200K context, vision |
| **Groq** | `groq` | Llama, Mixtral | Ultra-fast inference |
| **Google Gemini** | `gemini` | Gemini 2.0, 1.5 Pro/Flash | 2M context, multimodal |
| **SambaNova** | `sambanova` | Various | High-performance chips |

### Local Providers

| Provider | ID | Default Port | Features |
|----------|-----|--------------|----------|
| **Ollama** | `ollama` | 11434 | Run models locally |
| **LM Studio** | `lmstudio` | 1234 | Tool use support |

## API Reference

### Provider Registry

```typescript
// Get all providers
const providers = getAllProviders(); // ProviderConfig[]

// Get specific provider
const openai = getProvider('openai'); // ProviderConfig

// Get cloud/local providers
const cloudProviders = getCloudProviders(); // ProviderConfig[]
const localProviders = getLocalProviders(); // ProviderConfig[]

// Check if API key required
const required = requiresApiKey('openai'); // boolean
```

### API Key Management

```typescript
// Set API key
setApiKey('openai', 'sk-...');

// Get API key
const key = getApiKey('openai'); // string | null

// Remove API key
removeApiKey('openai');

// Check if key exists
const has = hasApiKey('openai'); // boolean

// Get all keys
const keys = getAllApiKeys(); // Partial<Record<ProviderId, string>>

// Clear all keys
clearAllApiKeys();
```

### Provider Settings

```typescript
// Get settings
const settings = getProviderSettings(); // ProviderSettings | null

// Set settings
setProviderSettings({
  selectedProvider: 'anthropic',
  providerKeys: {},
  providerModels: {}
});

// Update settings
updateProviderSettings({ selectedProvider: 'groq' });

// Get/Set selected provider
const provider = getSelectedProvider(); // ProviderId
setSelectedProvider('anthropic');

// Get/Set selected model
const model = getSelectedModel('openai'); // string | null
setSelectedModel('openai', 'gpt-4');
```

### Client Utilities

```typescript
// Fetch models
const models = await fetchModels(
  'openai',
  'sk-...'
); // ProviderModel[]

// Chat completion
const response = await chatCompletion(
  'openai',
  {
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello' }]
  },
  'sk-...'
); // ChatCompletionResponse

// Validate API key
const result = await validateApiKey(
  'openai',
  'sk-...'
); // { valid: boolean; error?: string }

// Test local connection
const result = await testLocalConnection(
  'ollama'
); // { connected: boolean; error?: string }
```

### Import/Export

```typescript
// Export all settings and keys
const backup = exportSettings();
// { settings: ProviderSettings | null, apiKeys: {...} }

// Import settings and keys
importSettings({
  settings: { ... },
  apiKeys: { openai: 'sk-...', anthropic: 'sk-ant-...' }
});
```

## Error Handling

All API calls return `ProviderError` on failure:

```typescript
interface ProviderError {
  code: string;
  message: string;
  status?: number;
  provider: ProviderId;
}

try {
  await chatCompletion('openai', request, apiKey);
} catch (error) {
  const providerError = error as ProviderError;
  console.error(`${providerError.provider}: ${providerError.message}`);
}
```

### Error Codes

- `API_KEY_REQUIRED` - API key needed but not provided
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `CLIENT_ERROR` - 4xx error (bad request, invalid key, etc.)
- `SERVER_ERROR` - 5xx error from provider
- `FETCH_MODELS_FAILED` - Failed to fetch models
- `REQUEST_FAILED` - General request failure
- `MAX_RETRIES_EXCEEDED` - Request failed after retries

## Rate Limiting

Default rate limit: 60 requests per minute per provider

```typescript
// Customize rate limiting
const response = await chatCompletion(
  'openai',
  request,
  apiKey,
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }
);
```

## Security

- API keys stored in localStorage with `hanzo_api_key_` prefix
- Keys never sent to Hanzo servers
- Client-side only implementation
- Use dedicated API keys with usage limits
- Clear browser data to remove stored keys

## React Components

### ProviderSettings

Full provider configuration UI:

```tsx
import { ProviderSettings } from '@/components/settings';

<ProviderSettings />
```

Features:
- Cloud vs Local provider tabs
- API key input with show/hide
- Key validation
- Provider selection
- Help links for getting API keys
- Security notices

### ModelSelector

Dynamic model selector with auto-discovery:

```tsx
import { ModelSelector } from '@/components/settings';

<ModelSelector
  providerId="openai"
  value={selectedModel}
  onModelChange={(model) => console.log(model)}
/>
```

Features:
- Auto-fetch models from provider
- Model information (context, pricing)
- Capability badges (functions, vision)
- Refresh button
- Error handling

## Testing

Run the test suite:

```bash
pnpm test:unit -- tests/unit/lib/llm/providers
```

All tests passing:
- ✅ 17 integration tests
- ✅ Provider registry validation
- ✅ OpenAI configuration
- ✅ Anthropic configuration
- ✅ Local provider setup
- ✅ API key management
- ✅ Client utilities

## File Structure

```
lib/llm/providers/
├── index.ts           # Main exports
├── types.ts           # TypeScript types
├── registry.ts        # Provider configurations
├── client.ts          # API client utilities
├── storage.ts         # localStorage manager
└── README.md          # This file

components/settings/
├── provider-settings.tsx  # Settings UI
├── model-selector.tsx     # Model selector
└── index.tsx              # Component exports

tests/unit/lib/llm/providers/
├── integration.test.ts    # Integration tests
├── client.test.ts         # Client tests
└── storage.test.ts        # Storage tests
```

## Examples

### Example 1: Multi-Provider Chat

```typescript
async function chat(message: string) {
  const provider = getSelectedProvider();
  const apiKey = getApiKey(provider);
  const model = getSelectedModel(provider);

  if (!apiKey) {
    throw new Error('API key not configured');
  }

  const response = await chatCompletion(
    provider,
    {
      model: model || 'gpt-4',
      messages: [{ role: 'user', content: message }]
    },
    apiKey
  );

  return response.choices[0].message.content;
}
```

### Example 2: Provider Switcher

```typescript
import { useState } from 'react';
import { Select } from '@hanzo/ui';
import { getAllProviders, setSelectedProvider } from '@/lib/llm/providers';

export function ProviderSwitcher() {
  const [provider, setProvider] = useState(getSelectedProvider());

  const handleChange = (id: ProviderId) => {
    setProvider(id);
    setSelectedProvider(id);
  };

  return (
    <Select value={provider} onValueChange={handleChange}>
      {getAllProviders().map(p => (
        <SelectItem key={p.id} value={p.id}>
          {p.name}
        </SelectItem>
      ))}
    </Select>
  );
}
```

### Example 3: Streaming Response

```typescript
async function streamChat(message: string) {
  const provider = getSelectedProvider();
  const apiKey = getApiKey(provider);
  const config = getProvider(provider);

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: message }],
      stream: true
    })
  });

  const reader = response.body?.getReader();
  // Process streaming response...
}
```

## Provider-Specific Notes

### OpenAI
- Supports function calling and vision
- GPT-4 Turbo has 128K context
- Pricing varies by model

### Anthropic
- No `/models` endpoint (uses static models)
- Requires `x-api-key` header (not `Authorization`)
- Custom `anthropic-version` header
- 200K context window for all Claude 3 models

### OpenRouter
- Unified access to 200+ models
- Supports model discovery
- Pay-as-you-go pricing

### Local Providers (Ollama/LM Studio)
- No API key required
- Must be running locally
- Use `testLocalConnection()` to verify

## Next Steps

1. **Add more providers**: Extend `registry.ts` with new providers
2. **Add streaming support**: Implement SSE handling
3. **Add usage tracking**: Monitor token usage per provider
4. **Add cost estimation**: Calculate costs before requests
5. **Add model comparison**: Compare capabilities across providers

## Support

For issues or questions:
- Check error codes in console
- Verify API keys are valid
- Test local providers are running
- Review provider documentation

---

Built with ❤️ for Hanzo AI
