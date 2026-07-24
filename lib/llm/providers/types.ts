/**
 * Provider-specific types and interfaces
 */

export type ProviderId =
  | 'hanzo'
  | 'openrouter'
  | 'openai'
  | 'openai-codex'
  | 'anthropic'
  | 'groq'
  | 'gemini'
  | 'huggingface'
  | 'ollama'
  | 'lmstudio'
  | 'sambanova'
  | 'minimax'
  | 'llamacpp';

export interface ProviderModel {
  id: string;
  name: string;
  description?: string;
  contextLength: number;
  maxTokens?: number;
  supportsFunctions?: boolean;
  supportsVision?: boolean;
  supportsReasoning?: boolean;  // Model supports toggleable reasoning (thinking tokens)
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
  usesOAuth?: boolean;
}

export interface CodexAuthData {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // Unix timestamp in seconds
  user_email?: string;
}

export interface HFAuthData {
  access_token: string;
  username?: string;
  expires_at?: number;  // OAuth tokens expire, API keys don't
}


/** A chat message in the OpenAI-compatible wire shape every provider speaks. */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

/** OpenAI-compatible /chat/completions request body (passed through verbatim). */
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  [key: string]: unknown;
}

/** OpenAI-compatible /chat/completions response (as returned by the provider). */
export interface ChatCompletionResponse {
  id?: string;
  model?: string;
  choices: Array<{
    index?: number;
    message?: ChatMessage;
    delta?: Partial<ChatMessage>;
    finish_reason?: string | null;
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  [key: string]: unknown;
}

/** Normalized provider error (see client.createProviderError). */
export interface ProviderError {
  provider: ProviderId;
  message: string;
  code: string;
  status?: number;
}

/** Persisted BYOK settings (localStorage) — see storage.ts. */
export interface ProviderSettings {
  selectedProvider: ProviderId;
  providerKeys: Partial<Record<ProviderId, string>>;
  providerModels: Partial<Record<ProviderId, string>>;
}
