/**
 * The default provider is OURS, and the catalogue follows the selection.
 *
 * These two are one fact, not two: pointing a new user at `hanzo` while the
 * picker still listed openrouter.ai would offer `vendor/model` ids our gateway
 * does not serve. So the default is asserted here alongside the catalogue it
 * implies.
 *
 * Rows are verbatim samples of the two live shapes — api.hanzo.ai/v1/models and
 * openrouter.ai/api/v1/models — including the awkward ones: a Hanzo model with
 * no pricing and no context window at all, and OpenRouter's per-TOKEN price
 * strings, which are 1e6 away from the per-MILLION numbers everything
 * downstream reads.
 */

import { fetchAvailableModels } from '@/lib/llm/models-api';
import { DEFAULT_PROVIDER, getDefaultModel } from '@/lib/llm/providers/registry';
import { getSelectedProvider } from '@/lib/llm/providers/storage';
import { configManager } from '@/lib/config/storage';
import { DEFAULT_MODEL } from '@/lib/providers';
import type { ProviderId } from '@/lib/llm/providers/types';

// api.hanzo.ai/v1/models — bare ids, prices in USD per MILLION tokens, and most
// rows publishing neither a context window nor tool support.
const HANZO_ROWS = [
  {
    id: 'enso',
    object: 'model',
    created: 1785777643,
    owned_by: 'hanzo',
    premium: true,
    context_window: 1000000,
    pricing: { input: 4, output: 20 },
  },
  {
    // Verified present in the live catalog (GET https://api.hanzo.ai/v1/models),
    // and the builder's current DEFAULT_MODEL — enso cannot build until the zen
    // identity fix reaches its image (lib/providers.ts).
    id: 'anthropic-claude-opus-5',
    object: 'model',
    created: 1785777643,
    owned_by: 'anthropic',
    premium: true,
    context_window: 200000,
    pricing: { input: 15, output: 75 },
  },
  {
    id: 'claude-4.5-sonnet',
    object: 'model',
    created: 1785777643,
    owned_by: 'anthropic',
    premium: false,
    pricing: { input: 3, output: 15 },
  },
  {
    id: 'claude-haiku-4-5',
    object: 'model',
    created: 1785777643,
    owned_by: 'do-ai',
    premium: false,
    provider: 'do-ai',
    context_window: 200000,
    max_output_tokens: 8192,
    supports_vision: true,
    supports_tools: true,
    pricing: { input: 1, output: 5 },
  },
  // Publishes no pricing at all.
  { id: 'wan2-2-t2v-a14b', object: 'model', created: 1785777643, owned_by: 'do-ai', premium: false },
];

// openrouter.ai/api/v1/models — vendor/model ids, price STRINGS per token.
const OPENROUTER_ROWS = [
  {
    id: 'qwen/qwen3.8-max',
    canonical_slug: 'qwen/qwen3.8-max-20260803',
    name: 'Qwen: Qwen3.8 Max',
    created: 1785731612,
    description: 'Flagship model in the Qwen3.8 series.',
    context_length: 1000000,
    architecture: {
      input_modalities: ['text', 'image', 'video'],
      output_modalities: ['text'],
      tokenizer: 'Qwen',
      instruct_type: null,
    },
    pricing: { prompt: '0.000002', completion: '0.000006' },
    top_provider: { context_length: 1000000, max_completion_tokens: 131072, is_moderated: false },
    supported_parameters: ['tools', 'temperature', 'reasoning'],
  },
  // No tool support — the picker drives tools, so this must not be listed.
  {
    id: 'openai/dall-e-3',
    name: 'OpenAI: DALL-E 3',
    created: 1785731000,
    architecture: { input_modalities: ['text'], output_modalities: ['image'] },
    pricing: { prompt: '0.00004', completion: '0' },
    supported_parameters: ['temperature'],
  },
];

function respondWith(rows: unknown[]) {
  return jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({ data: rows }),
  });
}

describe('the default provider is Hanzo', () => {
  const env = process.env.NEXT_PUBLIC_DEFAULT_PROVIDER;

  beforeEach(() => {
    localStorage.clear();
    delete process.env.NEXT_PUBLIC_DEFAULT_PROVIDER;
  });

  afterAll(() => {
    if (env === undefined) delete process.env.NEXT_PUBLIC_DEFAULT_PROVIDER;
    else process.env.NEXT_PUBLIC_DEFAULT_PROVIDER = env;
  });

  it('points a user with no configuration at our own gateway', () => {
    expect(DEFAULT_PROVIDER).toBe('hanzo');
    expect(configManager.getSelectedProvider()).toBe('hanzo');
  });

  it('is the same answer in both stores that persist a selection', () => {
    // configManager and the settings panel's own store used to disagree
    // (openrouter vs openai). One constant now feeds both.
    expect(getSelectedProvider()).toBe(configManager.getSelectedProvider());
  });

  it('still honours NEXT_PUBLIC_DEFAULT_PROVIDER as an override', () => {
    process.env.NEXT_PUBLIC_DEFAULT_PROVIDER = 'groq';
    expect(configManager.getSelectedProvider()).toBe('groq');
  });

  it('yields to an explicit choice — OpenRouter stays fully available', () => {
    configManager.setSelectedProvider('openrouter');
    expect(configManager.getSelectedProvider()).toBe('openrouter');
    expect(configManager.getDefaultModel()).toBe('deepseek/deepseek-chat');
  });

  it('opens on a model the gateway actually serves', () => {
    // Not `deepseek/deepseek-chat`, which is an OpenRouter id.
    expect(getDefaultModel('hanzo')).toBe(DEFAULT_MODEL);
    expect(getDefaultModel('hanzo')).not.toContain('/');
    expect(HANZO_ROWS.some((row) => row.id === getDefaultModel('hanzo'))).toBe(true);
  });
});

describe('the catalogue follows the selected provider', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
  });

  it('asks the selected provider, not a hardcoded host', async () => {
    global.fetch = respondWith(HANZO_ROWS) as unknown as typeof fetch;
    await fetchAvailableModels('hanzo');
    expect(global.fetch).toHaveBeenCalledWith('https://api.hanzo.ai/v1/models');

    global.fetch = respondWith(OPENROUTER_ROWS) as unknown as typeof fetch;
    await fetchAvailableModels('openrouter');
    expect(global.fetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models');
  });

  it('returns Hanzo ids for a Hanzo selection — none of them namespaced', async () => {
    global.fetch = respondWith(HANZO_ROWS) as unknown as typeof fetch;

    const models = await fetchAvailableModels('hanzo');

    expect(models.length).toBe(HANZO_ROWS.length);
    for (const model of models) {
      expect(model.id).not.toContain('/');
    }
    expect(models.map((m) => m.id).sort()).toEqual(
      ['anthropic-claude-opus-5', 'claude-4.5-sonnet', 'claude-haiku-4-5', 'enso', 'wan2-2-t2v-a14b'],
    );
  });

  it('passes Hanzo prices through — they are already per million tokens', async () => {
    global.fetch = respondWith(HANZO_ROWS) as unknown as typeof fetch;

    const enso = (await fetchAvailableModels('hanzo')).find((m) => m.id === 'enso');

    expect(enso?.pricing).toEqual({ input: 4, output: 20 });
  });

  it('scales OpenRouter prices from per token to per million', async () => {
    global.fetch = respondWith(OPENROUTER_ROWS) as unknown as typeof fetch;

    const qwen = (await fetchAvailableModels('openrouter')).find((m) => m.id === 'qwen/qwen3.8-max');

    // '0.000002' USD/token is $2/MTok. Copying the string through would read $0.000002.
    expect(qwen?.pricing).toEqual({ input: 2, output: 6, reasoning: undefined });
  });

  it('leaves fields the provider never published undefined', async () => {
    global.fetch = respondWith(HANZO_ROWS) as unknown as typeof fetch;

    const models = await fetchAvailableModels('hanzo');
    const sonnet = models.find((m) => m.id === 'claude-4.5-sonnet');
    const media = models.find((m) => m.id === 'wan2-2-t2v-a14b');

    // The row states a price and nothing else. No invented context window, no
    // assumed tool support, no fabricated 4096/32000 placeholder.
    expect(sonnet?.contextLength).toBeUndefined();
    expect(sonnet?.maxTokens).toBeUndefined();
    expect(sonnet?.supportsFunctions).toBeUndefined();
    expect(sonnet?.supportsVision).toBeUndefined();
    expect(sonnet?.description).toBeUndefined();

    // And a row with no pricing block reports no price rather than a guess.
    expect(media?.pricing).toBeUndefined();
  });

  it('keeps the fields a provider does publish', async () => {
    global.fetch = respondWith(HANZO_ROWS) as unknown as typeof fetch;

    const haiku = (await fetchAvailableModels('hanzo')).find((m) => m.id === 'claude-haiku-4-5');

    expect(haiku).toMatchObject({
      contextLength: 200000,
      maxTokens: 8192,
      supportsFunctions: true,
      supportsVision: true,
      pricing: { input: 1, output: 5 },
    });
  });

  it('drops OpenRouter models that cannot emit text or take tools', async () => {
    global.fetch = respondWith(OPENROUTER_ROWS) as unknown as typeof fetch;

    const models = await fetchAvailableModels('openrouter');

    expect(models.map((m) => m.id)).toEqual(['qwen/qwen3.8-max']);
  });

  it('reports a failed catalogue instead of substituting another vendor', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    }) as unknown as typeof fetch;

    // The old fallback list handed back four OpenRouter ids at 2024 prices.
    await expect(fetchAvailableModels('hanzo')).rejects.toThrow(/503/);
  });

  it('never sends one provider a request for another provider s catalogue', async () => {
    const hosts: Record<string, string> = {
      hanzo: 'api.hanzo.ai',
      openrouter: 'openrouter.ai',
      groq: 'api.groq.com',
      anthropic: 'api.anthropic.com',
    };

    for (const [provider, host] of Object.entries(hosts)) {
      global.fetch = respondWith([]) as unknown as typeof fetch;
      await fetchAvailableModels(provider as ProviderId);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(host));
    }
  });
});
