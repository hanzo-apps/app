/**
 * Provider-specific types and interfaces for Hanzo BYOK system
 */

export type ProviderId =
  | 'openrouter'
  | 'openai'
  | 'anthropic'
  | 'groq'
  | 'gemini'
  | 'ollama'
  | 'lmstudio'
  | 'sambanova';

export interface ProviderModel {
  id: string;
  name: string;
  description?: string;
  contextLength: number;
  maxTokens?: number;
  supportsFunctions?: boolean;
  supportsVision?: boolean;
  pricing?: {
    input: number;  // per 1M tokens
    output: number; // per 1M tokens
    reasoning?: number;
  };
}

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  description: string;
  icon?: string;
  apiKeyRequired: boolean;
  apiKeyPlaceholder?: string;
  apiKeyHelpUrl?: string;
  baseUrl?: string;
  customHeaders?: Record<string, string>;
  models?: ProviderModel[];
  supportsModelDiscovery?: boolean;
  supportsFunctions?: boolean;
  supportsStreaming?: boolean;
  isLocal?: boolean;
}

export interface ProviderSettings {
  selectedProvider: ProviderId;
  providerKeys: Partial<Record<ProviderId, string>>;
  providerModels: Partial<Record<ProviderId, string>>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: any[];
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ProviderError {
  code: string;
  message: string;
  status?: number;
  provider: ProviderId;
}
