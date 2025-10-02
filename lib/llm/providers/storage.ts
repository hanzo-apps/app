/**
 * localStorage manager for API keys and provider settings
 * Uses "hanzo_api_key_" prefix for all keys
 */

import { ProviderId, ProviderSettings } from './types';

const API_KEY_PREFIX = 'hanzo_api_key_';
const SETTINGS_KEY = 'hanzo_provider_settings';

/**
 * Check if running in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * Get API key for a provider from localStorage
 */
export function getApiKey(providerId: ProviderId): string | null {
  if (!isBrowser()) return null;

  try {
    return localStorage.getItem(`${API_KEY_PREFIX}${providerId}`);
  } catch (error) {
    console.error(`Failed to get API key for ${providerId}:`, error);
    return null;
  }
}

/**
 * Set API key for a provider in localStorage
 */
export function setApiKey(providerId: ProviderId, apiKey: string): boolean {
  if (!isBrowser()) return false;

  try {
    localStorage.setItem(`${API_KEY_PREFIX}${providerId}`, apiKey);
    return true;
  } catch (error) {
    console.error(`Failed to set API key for ${providerId}:`, error);
    return false;
  }
}

/**
 * Remove API key for a provider from localStorage
 */
export function removeApiKey(providerId: ProviderId): boolean {
  if (!isBrowser()) return false;

  try {
    localStorage.removeItem(`${API_KEY_PREFIX}${providerId}`);
    return true;
  } catch (error) {
    console.error(`Failed to remove API key for ${providerId}:`, error);
    return false;
  }
}

/**
 * Get all API keys from localStorage
 */
export function getAllApiKeys(): Partial<Record<ProviderId, string>> {
  if (!isBrowser()) return {};

  const keys: Partial<Record<ProviderId, string>> = {};

  try {
    // Iterate through all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(API_KEY_PREFIX)) {
        const providerId = key.substring(API_KEY_PREFIX.length) as ProviderId;
        const apiKey = localStorage.getItem(key);
        if (apiKey) {
          keys[providerId] = apiKey;
        }
      }
    }
  } catch (error) {
    console.error('Failed to get all API keys:', error);
  }

  return keys;
}

/**
 * Clear all API keys from localStorage
 */
export function clearAllApiKeys(): boolean {
  if (!isBrowser()) return false;

  try {
    const keysToRemove: string[] = [];

    // Collect all API key entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(API_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    // Remove them
    keysToRemove.forEach(key => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error('Failed to clear all API keys:', error);
    return false;
  }
}

/**
 * Get provider settings from localStorage
 */
export function getProviderSettings(): ProviderSettings | null {
  if (!isBrowser()) return null;

  try {
    const settings = localStorage.getItem(SETTINGS_KEY);
    if (!settings) return null;

    return JSON.parse(settings) as ProviderSettings;
  } catch (error) {
    console.error('Failed to get provider settings:', error);
    return null;
  }
}

/**
 * Set provider settings in localStorage
 */
export function setProviderSettings(settings: ProviderSettings): boolean {
  if (!isBrowser()) return false;

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Failed to set provider settings:', error);
    return false;
  }
}

/**
 * Update specific provider settings fields
 */
export function updateProviderSettings(
  updates: Partial<ProviderSettings>
): boolean {
  if (!isBrowser()) return false;

  try {
    const current = getProviderSettings() || {
      selectedProvider: 'openai' as ProviderId,
      providerKeys: {},
      providerModels: {}
    };

    const updated = { ...current, ...updates };
    return setProviderSettings(updated);
  } catch (error) {
    console.error('Failed to update provider settings:', error);
    return false;
  }
}

/**
 * Get selected provider from settings
 */
export function getSelectedProvider(): ProviderId {
  const settings = getProviderSettings();
  return settings?.selectedProvider || 'openai';
}

/**
 * Set selected provider in settings
 */
export function setSelectedProvider(providerId: ProviderId): boolean {
  return updateProviderSettings({ selectedProvider: providerId });
}

/**
 * Get selected model for a provider
 */
export function getSelectedModel(providerId: ProviderId): string | null {
  const settings = getProviderSettings();
  return settings?.providerModels[providerId] || null;
}

/**
 * Set selected model for a provider
 */
export function setSelectedModel(providerId: ProviderId, model: string): boolean {
  const settings = getProviderSettings() || {
    selectedProvider: providerId,
    providerKeys: {},
    providerModels: {}
  };

  settings.providerModels[providerId] = model;
  return setProviderSettings(settings);
}

/**
 * Check if a provider has an API key configured
 */
export function hasApiKey(providerId: ProviderId): boolean {
  const apiKey = getApiKey(providerId);
  return apiKey !== null && apiKey.length > 0;
}

/**
 * Export all settings and API keys (for backup)
 */
export function exportSettings(): {
  settings: ProviderSettings | null;
  apiKeys: Partial<Record<ProviderId, string>>;
} {
  return {
    settings: getProviderSettings(),
    apiKeys: getAllApiKeys()
  };
}

/**
 * Import settings and API keys (from backup)
 */
export function importSettings(data: {
  settings?: ProviderSettings | null;
  apiKeys?: Partial<Record<ProviderId, string>>;
}): boolean {
  if (!isBrowser()) return false;

  try {
    // Import settings
    if (data.settings) {
      setProviderSettings(data.settings);
    }

    // Import API keys
    if (data.apiKeys) {
      Object.entries(data.apiKeys).forEach(([providerId, apiKey]) => {
        if (apiKey) {
          setApiKey(providerId as ProviderId, apiKey);
        }
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to import settings:', error);
    return false;
  }
}
