/**
 * BYOK provider system — pins the CURRENT registry contract.
 *
 * Law: model lists are DYNAMIC — a provider that exposes a live /models
 * endpoint is discovery-first (`supportsModelDiscovery: true`) and its catalog
 * is whatever the endpoint returns for the user's key. A static `models` list
 * exists ONLY as the offline catalog for providers with no discovery endpoint
 * (openai-codex, gemini, minimax). We assert structure and flags, never a
 * snapshot of somebody's model zoo — those go stale by design.
 */

import { getAllProviders, getProvider, getDefaultModel } from '@/lib/llm/providers';
import type { ProviderId } from '@/lib/llm/providers/types';

const ALL_IDS: ProviderId[] = [
  'hanzo',
  'openrouter',
  'openai',
  'openai-codex',
  'anthropic',
  'groq',
  'gemini',
  'huggingface',
  'ollama',
  'lmstudio',
  'llamacpp',
  'sambanova',
  'minimax',
];

describe('BYOK Provider System Integration', () => {
  describe('Provider Registry', () => {
    it('configures exactly the ProviderId set', () => {
      const providers = getAllProviders();
      expect(providers.map((p) => p.id).sort()).toEqual([...ALL_IDS].sort());
    });

    it('every provider is fully described', () => {
      for (const p of getAllProviders()) {
        expect(p.id).toBeTruthy();
        expect(p.name).toBeTruthy();
        expect(p.description).toBeTruthy();
        expect(p.baseUrl).toMatch(/^https?:\/\//);
      }
    });

    it('local providers are the self-hosted trio', () => {
      const local = getAllProviders().filter((p) => p.isLocal).map((p) => p.id).sort();
      expect(local).toEqual(['llamacpp', 'lmstudio', 'ollama']);
      // Local runtimes never require a key.
      for (const id of local) expect(getProvider(id as ProviderId).apiKeyRequired).toBe(false);
    });

    it('every provider either discovers models live or ships a static catalog', () => {
      for (const p of getAllProviders()) {
        if (!p.supportsModelDiscovery) {
          expect(p.models?.length ?? 0).toBeGreaterThan(0);
        }
      }
    });

    it('cloud aggregators and first-party APIs are discovery-first', () => {
      // These expose live /models endpoints — their catalogs must stay dynamic.
      for (const id of ['hanzo', 'openrouter', 'openai', 'anthropic', 'groq', 'huggingface'] as ProviderId[]) {
        expect(getProvider(id).supportsModelDiscovery).toBe(true);
      }
    });

    it('every provider has a servable default model', () => {
      for (const id of ALL_IDS) {
        expect(getDefaultModel(id)).toBeTruthy();
      }
    });
  });

  describe('Hanzo Provider — the gateway is first-class', () => {
    it('points at api.hanzo.ai/v1 with live discovery', () => {
      const p = getProvider('hanzo');
      expect(p.baseUrl).toBe('https://api.hanzo.ai/v1');
      expect(p.supportsModelDiscovery).toBe(true);
      expect(p.apiKeyRequired).toBe(true);
    });
  });

  describe('OpenRouter Provider — latest third-party catalog', () => {
    it('uses the public openrouter.ai API with live discovery', () => {
      const p = getProvider('openrouter');
      expect(p.baseUrl).toBe('https://openrouter.ai/api/v1');
      expect(p.supportsModelDiscovery).toBe(true);
    });
  });

  describe('Anthropic Provider', () => {
    it('uses api.anthropic.com/v1 and discovers models live', () => {
      const p = getProvider('anthropic');
      expect(p.baseUrl).toBe('https://api.anthropic.com/v1');
      expect(p.apiKeyRequired).toBe(true);
      // Anthropic ships GET /v1/models — dynamic, not a hardcoded list.
      expect(p.supportsModelDiscovery).toBe(true);
    });
  });

  describe('Static-catalog providers (no discovery endpoint)', () => {
    it.each(['openai-codex', 'gemini', 'minimax'] as ProviderId[])(
      '%s ships a well-formed offline catalog',
      (id) => {
        const p = getProvider(id);
        expect(p.supportsModelDiscovery ?? false).toBe(false);
        expect(p.models!.length).toBeGreaterThan(0);
        for (const m of p.models!) {
          expect(m.id).toBeTruthy();
          expect(m.name).toBeTruthy();
          expect(m.contextLength).toBeGreaterThan(0);
        }
        // The provider's default must exist in its own catalog.
        expect(p.models!.some((m) => m.id === getDefaultModel(id))).toBe(true);
      },
    );
  });
});
