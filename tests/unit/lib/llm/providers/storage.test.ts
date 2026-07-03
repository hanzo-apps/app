/**
 * Tests for localStorage manager
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  getApiKey,
  setApiKey,
  removeApiKey,
  getAllApiKeys,
  clearAllApiKeys,
  getProviderSettings,
  setProviderSettings,
  getSelectedProvider,
  setSelectedProvider,
  hasApiKey,
  exportSettings,
  importSettings
} from '@/lib/llm/providers/storage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('Provider Storage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('API Key Management', () => {
    it('should set and get API key', () => {
      const result = setApiKey('openai', 'sk-test123');
      expect(result).toBe(true);

      const key = getApiKey('openai');
      expect(key).toBe('sk-test123');
    });

    it('should use correct prefix for keys', () => {
      setApiKey('openai', 'test-key');
      expect(localStorageMock.getItem('hanzo_api_key_openai')).toBe('test-key');
    });

    it('should remove API key', () => {
      setApiKey('openai', 'test-key');
      expect(getApiKey('openai')).toBe('test-key');

      const result = removeApiKey('openai');
      expect(result).toBe(true);
      expect(getApiKey('openai')).toBe(null);
    });

    it('should check if API key exists', () => {
      expect(hasApiKey('openai')).toBe(false);

      setApiKey('openai', 'test-key');
      expect(hasApiKey('openai')).toBe(true);
    });

    it('should get all API keys', () => {
      setApiKey('openai', 'key1');
      setApiKey('anthropic', 'key2');
      setApiKey('groq', 'key3');

      const keys = getAllApiKeys();
      expect(keys.openai).toBe('key1');
      expect(keys.anthropic).toBe('key2');
      expect(keys.groq).toBe('key3');
    });

    it('should clear all API keys', () => {
      setApiKey('openai', 'key1');
      setApiKey('anthropic', 'key2');
      localStorageMock.setItem('other-key', 'value');

      clearAllApiKeys();

      expect(getApiKey('openai')).toBe(null);
      expect(getApiKey('anthropic')).toBe(null);
      expect(localStorageMock.getItem('other-key')).toBe('value');
    });
  });

  describe('Provider Settings', () => {
    it('should set and get provider settings', () => {
      const settings = {
        selectedProvider: 'anthropic' as const,
        providerKeys: {},
        providerModels: {}
      };

      const result = setProviderSettings(settings);
      expect(result).toBe(true);

      const retrieved = getProviderSettings();
      expect(retrieved?.selectedProvider).toBe('anthropic');
    });

    it('should handle null settings', () => {
      const settings = getProviderSettings();
      expect(settings).toBe(null);
    });

    it('should get and set selected provider', () => {
      const result = setSelectedProvider('groq');
      expect(result).toBe(true);

      const provider = getSelectedProvider();
      expect(provider).toBe('groq');
    });

    it('should return default provider if none set', () => {
      const provider = getSelectedProvider();
      expect(provider).toBe('openai');
    });
  });

  describe('Import/Export', () => {
    it('should export all settings and keys', () => {
      setApiKey('openai', 'key1');
      setApiKey('anthropic', 'key2');
      setSelectedProvider('anthropic');

      const exported = exportSettings();

      expect(exported.apiKeys.openai).toBe('key1');
      expect(exported.apiKeys.anthropic).toBe('key2');
      expect(exported.settings?.selectedProvider).toBe('anthropic');
    });

    it('should import settings and keys', () => {
      const data = {
        settings: {
          selectedProvider: 'groq' as const,
          providerKeys: {},
          providerModels: {}
        },
        apiKeys: {
          openai: 'imported-key1',
          anthropic: 'imported-key2'
        }
      };

      const result = importSettings(data);
      expect(result).toBe(true);

      expect(getApiKey('openai')).toBe('imported-key1');
      expect(getApiKey('anthropic')).toBe('imported-key2');
      expect(getSelectedProvider()).toBe('groq');
    });

    it('should handle partial imports', () => {
      const result = importSettings({
        apiKeys: { openai: 'test-key' }
      });

      expect(result).toBe(true);
      expect(getApiKey('openai')).toBe('test-key');
    });
  });
});
