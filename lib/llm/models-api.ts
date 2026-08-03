/**
 * The provider catalogue — one fetch, one shape.
 *
 * Every provider we discover models from serves an OpenAI-compatible
 * `GET <baseUrl>/models`, so the request is identical for all of them and only
 * the row differs. Two rows exist in the wild, and both are adapted here into
 * `ProviderModel` — the shape the picker, the model cache and the pricing cache
 * already read:
 *
 *   - OpenRouter: `vendor/model` ids; prices are STRINGS in USD per TOKEN.
 *   - OpenAI-compatible, our own gateway included: bare ids; prices are NUMBERS
 *     in USD per MILLION tokens.
 *
 * That unit difference is 1e6. Copying one row into the other's shape renders
 * every cost off by a factor of a million, so the conversion happens here, once,
 * and everything downstream is per-million.
 *
 * Fields a provider does not publish stay `undefined`. api.hanzo.ai states a
 * context window for 22 of its 107 models and tool support for 7; filling in the
 * rest would put confident numbers in the UI that no API ever said. Consumers
 * render what exists and omit what does not.
 */

import { getProvider } from '@/lib/llm/providers/registry';
import type { ProviderId, ProviderModel } from '@/lib/llm/providers/types';

/** A row from openrouter.ai/api/v1/models. */
interface OpenRouterRow {
  id: string;
  name?: string;
  created?: number;
  description?: unknown;
  context_length?: number;
  architecture?: { input_modalities?: string[]; output_modalities?: string[] };
  pricing?: { prompt?: string; completion?: string; internal_reasoning?: string };
  top_provider?: { max_completion_tokens?: number };
  supported_parameters?: string[];
}

/** An OpenAI-compatible row, plus the fields the Hanzo gateway adds to it. */
interface OpenAiRow {
  id: string;
  created?: number;
  context_window?: number;
  max_output_tokens?: number;
  supports_tools?: boolean;
  supports_vision?: boolean;
  pricing?: { input?: number; output?: number };
}

/** USD per token, as a string, → USD per million tokens. */
function perMillion(rate?: string): number | undefined {
  if (rate === undefined || rate === null) return undefined;
  const parsed = Number(rate);
  return Number.isFinite(parsed) ? parsed * 1_000_000 : undefined;
}

function fromOpenRouter(row: OpenRouterRow): ProviderModel {
  const input = perMillion(row.pricing?.prompt);
  const output = perMillion(row.pricing?.completion);

  return {
    id: row.id,
    name: row.name || row.id,
    // OpenRouter has served object descriptions; anything but a string would be
    // rendered as a React child and crash the picker.
    description: typeof row.description === 'string' ? row.description : undefined,
    contextLength: row.context_length,
    maxTokens: row.top_provider?.max_completion_tokens,
    supportsFunctions: row.supported_parameters?.includes('tools'),
    supportsVision: row.architecture?.input_modalities?.includes('image'),
    supportsReasoning: row.supported_parameters?.includes('reasoning'),
    pricing:
      input !== undefined && output !== undefined
        ? { input, output, reasoning: perMillion(row.pricing?.internal_reasoning) }
        : undefined,
  };
}

function fromOpenAi(row: OpenAiRow): ProviderModel {
  const input = row.pricing?.input;
  const output = row.pricing?.output;

  return {
    id: row.id,
    // The only name these gateways state is the id. Prettifying it here would
    // invent a label the API never published.
    name: row.id,
    contextLength: row.context_window,
    maxTokens: row.max_output_tokens,
    supportsFunctions: row.supports_tools,
    supportsVision: row.supports_vision,
    // Already per million tokens — pass through, do not scale.
    pricing:
      typeof input === 'number' && typeof output === 'number'
        ? { input, output }
        : undefined,
  };
}

/**
 * A model the builder can drive: it must emit text and take tools. Only
 * OpenRouter states either, and a row that stays silent is kept — absence of a
 * claim is not a claim of absence, and filtering on a field 100 of 107 Hanzo
 * models omit would empty the picker.
 */
function usable(row: OpenRouterRow): boolean {
  const outputs = row.architecture?.output_modalities;
  if (outputs && !outputs.includes('text')) return false;

  const params = row.supported_parameters;
  if (params && !params.includes('tools')) return false;

  return true;
}

const POPULAR = ['gpt-4', 'claude', 'deepseek', 'qwen'];

/** Familiar names first, then newest. Display order only — the picker's initial
 *  selection comes from the provider's declared default, not from this. */
function byPreference(a: { id: string; created?: number }, b: { id: string; created?: number }): number {
  const aPopular = POPULAR.some((p) => a.id.toLowerCase().includes(p));
  const bPopular = POPULAR.some((p) => b.id.toLowerCase().includes(p));

  if (aPopular && !bPopular) return -1;
  if (!aPopular && bPopular) return 1;

  return (b.created ?? 0) - (a.created ?? 0);
}

/**
 * The catalogue the given provider publishes, in the app's own model shape.
 *
 * Throws when the provider has no catalogue endpoint or the fetch fails —
 * callers own the fallback, because what to show instead depends on where the
 * picker is. There is deliberately no built-in default list: shipping one meant
 * a Hanzo user seeing four hardcoded OpenRouter ids at 2024 prices.
 */
export async function fetchAvailableModels(provider: ProviderId): Promise<ProviderModel[]> {
  const { baseUrl } = getProvider(provider);
  if (!baseUrl) {
    throw new Error(`Provider ${provider} publishes no catalogue endpoint`);
  }

  const response = await fetch(`${baseUrl}/models`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${provider} models: ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as { data?: unknown };
  const rows = (Array.isArray(body.data) ? body.data : []) as Array<{ id?: unknown; created?: number }>;

  const sorted = rows
    .filter((row): row is { id: string; created?: number } => typeof row.id === 'string')
    .sort(byPreference);

  return provider === 'openrouter'
    ? (sorted as OpenRouterRow[]).filter(usable).map(fromOpenRouter)
    : (sorted as OpenAiRow[]).map(fromOpenAi);
}

/**
 * Format model price with appropriate precision
 * @param price Price per million tokens
 * @param perK If true, show price per 1K tokens (default), otherwise per 1M
 */
export function formatModelPrice(price: number | undefined, perK: boolean = true): string {
  if (price === undefined || price === null) return '';

  const displayPrice = perK ? price / 1000 : price;

  if (displayPrice === 0) return 'free';

  if (displayPrice < 0.0001) {
    return `$${displayPrice.toFixed(5).replace(/\.?0+$/, '')}`;
  } else if (displayPrice < 0.001) {
    return `$${displayPrice.toFixed(4).replace(/\.?0+$/, '')}`;
  } else if (displayPrice < 0.01) {
    return `$${displayPrice.toFixed(3).replace(/\.?0+$/, '')}`;
  } else if (displayPrice < 0.1) {
    return `$${displayPrice.toFixed(3).replace(/\.?0+$/, '')}`;
  } else if (displayPrice < 1) {
    return `$${displayPrice.toFixed(2).replace(/\.?0+$/, '')}`;
  } else {
    return `$${displayPrice.toFixed(2)}`;
  }
}
