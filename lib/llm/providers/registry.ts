/**
 * Provider registry with configurations for all supported LLM providers
 */

import { ProviderId, ProviderConfig, ProviderModel } from './types';

// Gemini models configuration
const geminiModels: ProviderModel[] = [
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    description: 'Latest experimental Gemini model',
    contextLength: 1048576,
    maxTokens: 8192,
    supportsFunctions: true,
    supportsVision: true
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Advanced reasoning and analysis',
    contextLength: 2097152,
    maxTokens: 8192,
    supportsFunctions: true,
    supportsVision: true
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Fast and versatile',
    contextLength: 1048576,
    maxTokens: 8192,
    supportsFunctions: true,
    supportsVision: true
  }
];

// OpenAI models configuration
const openaiModels: ProviderModel[] = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Most capable GPT-4 model',
    contextLength: 128000,
    maxTokens: 4096,
    supportsFunctions: true,
    supportsVision: true,
    pricing: {
      input: 10,
      output: 30
    }
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Advanced reasoning and understanding',
    contextLength: 8192,
    maxTokens: 4096,
    supportsFunctions: true,
    pricing: {
      input: 30,
      output: 60
    }
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and cost-effective',
    contextLength: 16385,
    maxTokens: 4096,
    supportsFunctions: true,
    pricing: {
      input: 0.5,
      output: 1.5
    }
  }
];

// Anthropic models configuration
const anthropicModels: ProviderModel[] = [
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Most intelligent Claude model',
    contextLength: 200000,
    maxTokens: 8192,
    supportsFunctions: true,
    supportsVision: true,
    pricing: {
      input: 3,
      output: 15
    }
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    description: 'Powerful model for complex tasks',
    contextLength: 200000,
    maxTokens: 4096,
    supportsFunctions: true,
    supportsVision: true,
    pricing: {
      input: 15,
      output: 75
    }
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    description: 'Fast and affordable',
    contextLength: 200000,
    maxTokens: 4096,
    supportsFunctions: true,
    supportsVision: true,
    pricing: {
      input: 0.25,
      output: 1.25
    }
  }
];

// Provider configurations
export const providers: Record<ProviderId, ProviderConfig> = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access 200+ AI models through a unified API',
    apiKeyRequired: true,
    apiKeyPlaceholder: 'sk-or-v1-...',
    apiKeyHelpUrl: 'https://openrouter.ai/keys',
    baseUrl: 'https://openrouter.ai/api/v1',
    supportsModelDiscovery: true,
    supportsFunctions: true,
    supportsStreaming: true
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5 and other OpenAI models',
    apiKeyRequired: true,
    apiKeyPlaceholder: 'sk-...',
    apiKeyHelpUrl: 'https://platform.openai.com/api-keys',
    baseUrl: 'https://api.openai.com/v1',
    models: openaiModels,
    supportsModelDiscovery: true,
    supportsFunctions: true,
    supportsStreaming: true
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3.5 Sonnet, Haiku and Opus models',
    apiKeyRequired: true,
    apiKeyPlaceholder: 'sk-ant-...',
    apiKeyHelpUrl: 'https://console.anthropic.com/settings/keys',
    baseUrl: 'https://api.anthropic.com/v1',
    models: anthropicModels,
    customHeaders: {
      'anthropic-version': '2023-06-01'
    },
    supportsModelDiscovery: false, // Anthropic doesn't have a models endpoint
    supportsFunctions: true,
    supportsStreaming: true
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast inference with Llama and Mixtral models',
    apiKeyRequired: true,
    apiKeyPlaceholder: 'gsk_...',
    apiKeyHelpUrl: 'https://console.groq.com/keys',
    baseUrl: 'https://api.groq.com/openai/v1',
    supportsModelDiscovery: true,
    supportsFunctions: true,
    supportsStreaming: true
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Google\'s multimodal AI models',
    apiKeyRequired: true,
    apiKeyPlaceholder: 'AIza...',
    apiKeyHelpUrl: 'https://aistudio.google.com/apikey',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: geminiModels,
    supportsFunctions: true,
    supportsStreaming: true
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama',
    description: 'Run models locally with Ollama',
    apiKeyRequired: false,
    baseUrl: 'http://localhost:11434/v1',
    supportsModelDiscovery: true,
    supportsFunctions: true,
    supportsStreaming: true,
    isLocal: true
  },
  lmstudio: {
    id: 'lmstudio',
    name: 'LM Studio',
    description: 'Local model server with tool use support',
    apiKeyRequired: false,
    baseUrl: 'http://localhost:1234/v1',
    supportsModelDiscovery: true,
    supportsFunctions: true,
    supportsStreaming: true,
    isLocal: true
  },
  sambanova: {
    id: 'sambanova',
    name: 'SambaNova',
    description: 'High-performance AI chips for inference',
    apiKeyRequired: true,
    apiKeyPlaceholder: 'SambaNova API Key',
    apiKeyHelpUrl: 'https://cloud.sambanova.ai/apis',
    baseUrl: 'https://api.sambanova.ai/v1',
    supportsModelDiscovery: true,
    supportsFunctions: true,
    supportsStreaming: true
  },
};

/**
 * Get provider configuration by ID
 */
export function getProvider(id: ProviderId): ProviderConfig {
  return providers[id];
}

/**
 * Get all provider configurations
 */
export function getAllProviders(): ProviderConfig[] {
  return Object.values(providers);
}

/**
 * Get all cloud providers (non-local)
 */
export function getCloudProviders(): ProviderConfig[] {
  return Object.values(providers).filter(p => !p.isLocal);
}

/**
 * Get all local providers
 */
export function getLocalProviders(): ProviderConfig[] {
  return Object.values(providers).filter(p => p.isLocal);
}

/**
 * Check if provider requires API key
 */
export function requiresApiKey(id: ProviderId): boolean {
  return providers[id].apiKeyRequired;
}
