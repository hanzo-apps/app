/**
 * Provider client utilities for making API calls with error handling,
 * rate limiting, and retry logic
 */

import {
  ProviderId,
  ProviderError,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ProviderModel
} from './types';
import { getProvider } from './registry';

// Rate limiting configuration
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const rateLimits = new Map<ProviderId, { count: number; resetAt: number }>();

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

/**
 * Create a provider-specific error
 */
export function createProviderError(
  provider: ProviderId,
  message: string,
  code: string = 'PROVIDER_ERROR',
  status?: number
): ProviderError {
  return {
    provider,
    message,
    code,
    status
  };
}

/**
 * Check rate limit for a provider
 */
function checkRateLimit(
  providerId: ProviderId,
  config: RateLimitConfig = { maxRequests: 60, windowMs: 60000 }
): boolean {
  const now = Date.now();
  const limit = rateLimits.get(providerId);

  if (!limit || now >= limit.resetAt) {
    rateLimits.set(providerId, {
      count: 1,
      resetAt: now + config.windowMs
    });
    return true;
  }

  if (limit.count >= config.maxRequests) {
    return false;
  }

  limit.count++;
  return true;
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoff(
  attempt: number,
  config: RetryConfig = defaultRetryConfig
): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch models from a provider
 */
export async function fetchModels(
  providerId: ProviderId,
  apiKey?: string
): Promise<ProviderModel[]> {
  const provider = getProvider(providerId);

  // Return static models if provider doesn't support discovery
  if (!provider.supportsModelDiscovery && provider.models) {
    return provider.models;
  }

  // Check if provider is local (no API key needed)
  if (!provider.isLocal && !apiKey) {
    throw createProviderError(
      providerId,
      'API key required for this provider',
      'API_KEY_REQUIRED'
    );
  }

  // Build request
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(provider.customHeaders || {})
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(`${provider.baseUrl}/models`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw createProviderError(
        providerId,
        `Failed to fetch models: ${response.statusText}`,
        'FETCH_MODELS_FAILED',
        response.status
      );
    }

    const data = await response.json();

    // Transform response to our model format
    const models: ProviderModel[] = (data.data || data.models || []).map((model: any) => ({
      id: model.id,
      name: model.name || model.id,
      description: model.description,
      contextLength: model.context_length || model.max_tokens || 4096,
      maxTokens: model.max_tokens,
      supportsFunctions: model.supports_functions,
      supportsVision: model.supports_vision
    }));

    return models;
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error; // Re-throw provider errors
    }
    throw createProviderError(
      providerId,
      error instanceof Error ? error.message : 'Unknown error fetching models',
      'FETCH_MODELS_ERROR'
    );
  }
}

/**
 * Make a chat completion request to a provider
 */
export async function chatCompletion(
  providerId: ProviderId,
  request: ChatCompletionRequest,
  apiKey?: string,
  retryConfig: RetryConfig = defaultRetryConfig
): Promise<ChatCompletionResponse> {
  const provider = getProvider(providerId);

  // Validate API key
  if (!provider.isLocal && !apiKey) {
    throw createProviderError(
      providerId,
      'API key required for this provider',
      'API_KEY_REQUIRED'
    );
  }

  // Check rate limit
  if (!checkRateLimit(providerId)) {
    throw createProviderError(
      providerId,
      'Rate limit exceeded',
      'RATE_LIMIT_EXCEEDED',
      429
    );
  }

  // Retry loop with exponential backoff
  let lastError: ProviderError | null = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(provider.customHeaders || {})
      };

      if (apiKey) {
        // Special handling for Anthropic
        if (providerId === 'anthropic') {
          headers['x-api-key'] = apiKey;
        } else {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
      }

      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Don't retry on client errors (4xx except 429)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw createProviderError(
            providerId,
            errorData.error?.message || response.statusText,
            'CLIENT_ERROR',
            response.status
          );
        }

        // Retry on server errors (5xx) and rate limits (429)
        throw createProviderError(
          providerId,
          errorData.error?.message || response.statusText,
          response.status === 429 ? 'RATE_LIMIT' : 'SERVER_ERROR',
          response.status
        );
      }

      const data: ChatCompletionResponse = await response.json();
      return data;

    } catch (error) {
      lastError = error instanceof Error && 'code' in error && 'provider' in error
        ? error as ProviderError
        : createProviderError(
            providerId,
            error instanceof Error ? error.message : 'Unknown error',
            'REQUEST_FAILED'
          );

      // Don't retry on client errors
      if (lastError.code === 'CLIENT_ERROR' || lastError.code === 'API_KEY_REQUIRED') {
        throw lastError;
      }

      // If this was the last retry, throw the error
      if (attempt === retryConfig.maxRetries) {
        throw lastError;
      }

      // Wait before retrying
      const delay = calculateBackoff(attempt, retryConfig);
      await sleep(delay);
    }
  }

  throw lastError || createProviderError(
    providerId,
    'Request failed after retries',
    'MAX_RETRIES_EXCEEDED'
  );
}

/**
 * Validate an API key by making a test request
 */
export async function validateApiKey(
  providerId: ProviderId,
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Try to fetch models as a validation check
    await fetchModels(providerId, apiKey);
    return { valid: true };
  } catch (error) {
    const providerError = error as ProviderError;
    return {
      valid: false,
      error: providerError.message || 'Invalid API key'
    };
  }
}

/**
 * Test connection to a local provider
 */
export async function testLocalConnection(
  providerId: ProviderId
): Promise<{ connected: boolean; error?: string }> {
  const provider = getProvider(providerId);

  if (!provider.isLocal) {
    return {
      connected: false,
      error: 'Provider is not a local provider'
    };
  }

  try {
    const response = await fetch(`${provider.baseUrl}/models`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    return {
      connected: response.ok
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    };
  }
}
