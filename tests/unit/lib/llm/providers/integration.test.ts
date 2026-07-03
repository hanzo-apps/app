/**
 * Integration test demonstrating BYOK provider system
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  getAllProviders,
  getCloudProviders,
  getLocalProviders,
  getProvider,
  requiresApiKey
} from '@/lib/llm/providers';

describe('BYOK Provider System Integration', () => {
  describe('Provider Registry', () => {
    it('should have all 8 providers configured', () => {
      const providers = getAllProviders();
      expect(providers.length).toBe(8);

      const providerIds = providers.map(p => p.id).sort();
      expect(providerIds).toEqual([
        'anthropic',
        'gemini',
        'groq',
        'lmstudio',
        'ollama',
        'openai',
        'openrouter',
        'sambanova'
      ]);
    });

    it('should separate cloud and local providers', () => {
      const cloudProviders = getCloudProviders();
      const localProviders = getLocalProviders();

      expect(cloudProviders.length).toBe(6); // openrouter, openai, anthropic, groq, gemini, sambanova
      expect(localProviders.length).toBe(2); // ollama, lmstudio

      // Verify no overlap
      const cloudIds = new Set(cloudProviders.map(p => p.id));
      const localIds = new Set(localProviders.map(p => p.id));

      cloudIds.forEach(id => {
        expect(localIds.has(id)).toBe(false);
      });
    });

    it('should correctly identify providers requiring API keys', () => {
      expect(requiresApiKey('openai')).toBe(true);
      expect(requiresApiKey('anthropic')).toBe(true);
      expect(requiresApiKey('groq')).toBe(true);
      expect(requiresApiKey('ollama')).toBe(false);
      expect(requiresApiKey('lmstudio')).toBe(false);
    });
  });

  describe('OpenAI Provider', () => {
    const provider = getProvider('openai');

    it('should have correct configuration', () => {
      expect(provider.id).toBe('openai');
      expect(provider.name).toBe('OpenAI');
      expect(provider.apiKeyRequired).toBe(true);
      expect(provider.baseUrl).toBe('https://api.openai.com/v1');
      expect(provider.supportsModelDiscovery).toBe(true);
      expect(provider.supportsFunctions).toBe(true);
      expect(provider.supportsStreaming).toBe(true);
    });

    it('should have OpenAI models configured', () => {
      expect(provider.models).toBeDefined();
      expect(provider.models!.length).toBeGreaterThan(0);

      const gpt4 = provider.models!.find(m => m.id === 'gpt-4');
      expect(gpt4).toBeDefined();
      expect(gpt4!.contextLength).toBe(8192);
      expect(gpt4!.supportsFunctions).toBe(true);
    });

    it('should have pricing information', () => {
      const gpt4 = provider.models!.find(m => m.id === 'gpt-4');
      expect(gpt4!.pricing).toBeDefined();
      expect(gpt4!.pricing!.input).toBeGreaterThan(0);
      expect(gpt4!.pricing!.output).toBeGreaterThan(0);
    });
  });

  describe('Anthropic Provider', () => {
    const provider = getProvider('anthropic');

    it('should have correct configuration', () => {
      expect(provider.id).toBe('anthropic');
      expect(provider.name).toBe('Anthropic');
      expect(provider.apiKeyRequired).toBe(true);
      expect(provider.baseUrl).toBe('https://api.anthropic.com/v1');
      expect(provider.supportsModelDiscovery).toBe(false); // Anthropic doesn't have /models endpoint
      expect(provider.supportsFunctions).toBe(true);
      expect(provider.supportsStreaming).toBe(true);
    });

    it('should have custom headers for Anthropic API', () => {
      expect(provider.customHeaders).toBeDefined();
      expect(provider.customHeaders!['anthropic-version']).toBe('2023-06-01');
    });

    it('should have Claude models configured', () => {
      expect(provider.models).toBeDefined();
      expect(provider.models!.length).toBeGreaterThan(0);

      const sonnet = provider.models!.find(m => m.id === 'claude-3-5-sonnet-20241022');
      expect(sonnet).toBeDefined();
      expect(sonnet!.name).toBe('Claude 3.5 Sonnet');
      expect(sonnet!.contextLength).toBe(200000);
      expect(sonnet!.supportsFunctions).toBe(true);
      expect(sonnet!.supportsVision).toBe(true);
    });

    it('should have all Claude 3 family models', () => {
      const modelNames = provider.models!.map(m => m.name);
      expect(modelNames).toContain('Claude 3.5 Sonnet');
      expect(modelNames).toContain('Claude 3 Opus');
      expect(modelNames).toContain('Claude 3 Haiku');
    });
  });

  describe('OpenRouter Provider', () => {
    const provider = getProvider('openrouter');

    it('should support model discovery for 200+ models', () => {
      expect(provider.supportsModelDiscovery).toBe(true);
      expect(provider.baseUrl).toBe('https://openrouter.ai/api/v1');
    });

    it('should have correct API key format', () => {
      expect(provider.apiKeyPlaceholder).toBe('sk-or-v1-...');
    });
  });

  describe('Local Providers', () => {
    it('should configure Ollama correctly', () => {
      const provider = getProvider('ollama');
      expect(provider.isLocal).toBe(true);
      expect(provider.apiKeyRequired).toBe(false);
      expect(provider.baseUrl).toBe('http://localhost:11434/v1');
      expect(provider.supportsModelDiscovery).toBe(true);
    });

    it('should configure LM Studio correctly', () => {
      const provider = getProvider('lmstudio');
      expect(provider.isLocal).toBe(true);
      expect(provider.apiKeyRequired).toBe(false);
      expect(provider.baseUrl).toBe('http://localhost:1234/v1');
      expect(provider.supportsModelDiscovery).toBe(true);
    });
  });

  describe('Provider Capabilities', () => {
    it('should have all cloud providers supporting streaming', () => {
      const cloudProviders = getCloudProviders();
      cloudProviders.forEach(provider => {
        expect(provider.supportsStreaming).toBe(true);
      });
    });

    it('should have help URLs for all providers requiring keys', () => {
      const providers = getAllProviders();
      providers.forEach(provider => {
        if (provider.apiKeyRequired) {
          expect(provider.apiKeyHelpUrl).toBeDefined();
          expect(provider.apiKeyHelpUrl).toMatch(/^https?:\/\//);
        }
      });
    });

    it('should have function support for most providers', () => {
      const providers = getAllProviders();
      const withFunctions = providers.filter(p => p.supportsFunctions);
      expect(withFunctions.length).toBeGreaterThanOrEqual(7);
    });
  });
});
