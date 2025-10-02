/**
 * Tests for provider client utilities
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  fetchModels,
  chatCompletion,
  validateApiKey,
  testLocalConnection,
  createProviderError
} from '@/lib/llm/providers/client';
import { ProviderId, ChatCompletionRequest } from '@/lib/llm/providers/types';

// Mock fetch
global.fetch = jest.fn() as jest.Mock;

describe('Provider Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProviderError', () => {
    it('should create a provider error with all fields', () => {
      const error = createProviderError(
        'openai',
        'Test error',
        'TEST_ERROR',
        400
      );

      expect(error.provider).toBe('openai');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.status).toBe(400);
    });

    it('should use default code if not provided', () => {
      const error = createProviderError('openai', 'Test error');
      expect(error.code).toBe('PROVIDER_ERROR');
    });
  });

  describe('fetchModels', () => {
    it('should return static models for providers without discovery', async () => {
      const models = await fetchModels('anthropic');
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty('id');
      expect(models[0]).toHaveProperty('name');
    });

    it('should throw error if API key required but not provided', async () => {
      await expect(fetchModels('openai')).rejects.toMatchObject({
        code: 'API_KEY_REQUIRED'
      });
    });
  });

  describe('chatCompletion', () => {
    const mockRequest: ChatCompletionRequest = {
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello' }]
    };

    it('should require API key for non-local providers', async () => {
      await expect(
        chatCompletion('openai', mockRequest)
      ).rejects.toMatchObject({
        code: 'API_KEY_REQUIRED'
      });
    });
  });

  describe('testLocalConnection', () => {
    it('should reject non-local providers', async () => {
      const result = await testLocalConnection('openai' as ProviderId);
      expect(result.connected).toBe(false);
      expect(result.error).toContain('not a local provider');
    });
  });
});
