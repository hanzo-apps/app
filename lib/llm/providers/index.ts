/**
 * Hanzo BYOK (Bring Your Own Key) Provider System
 *
 * Supports 8 LLM providers with localStorage API key management,
 * rate limiting, retry logic, and dynamic model discovery.
 */

// Export types
export type {
  ProviderId,
  ProviderModel,
  ProviderConfig,
  ProviderSettings,
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ProviderError
} from './types';

// Export registry functions
export {
  providers,
  getProvider,
  getAllProviders,
  getCloudProviders,
  getLocalProviders,
  requiresApiKey
} from './registry';

// Export client utilities
export {
  fetchModels,
  chatCompletion,
  validateApiKey,
  testLocalConnection,
  createProviderError
} from './client';

// Export storage utilities
export {
  getApiKey,
  setApiKey,
  removeApiKey,
  getAllApiKeys,
  clearAllApiKeys,
  getProviderSettings,
  setProviderSettings,
  updateProviderSettings,
  getSelectedProvider,
  setSelectedProvider,
  getSelectedModel,
  setSelectedModel,
  hasApiKey,
  exportSettings,
  importSettings
} from './storage';
