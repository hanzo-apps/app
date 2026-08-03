import { configManager, type ProviderPricingEntry } from '@/lib/config/storage';
import type { ProviderId, ProviderModel } from '@/lib/llm/providers/types';

const OPENROUTER_PROVIDER: ProviderId = 'openrouter';

export function registerPricingFromProviderModels(
  provider: ProviderId,
  models: ProviderModel[]
): void {
  if (!Array.isArray(models) || models.length === 0) {
    return;
  }

  const pricingMap: Record<string, ProviderPricingEntry> = {};

  for (const model of models) {
    if (!model?.pricing) {
      continue;
    }

    const entry: ProviderPricingEntry = {
      input: model.pricing.input,
      output: model.pricing.output,
      reasoning: model.pricing.reasoning
    };

    if (!Number.isFinite(entry.input) || !Number.isFinite(entry.output)) {
      continue;
    }

    pricingMap[model.id] = entry;
    pricingMap[`${provider}/${model.id}`] = entry;
  }

  if (provider === OPENROUTER_PROVIDER) {
    for (const [modelId, entry] of Object.entries(pricingMap)) {
      const slug = modelId.split('/').pop();
      if (slug && !pricingMap[slug]) {
        pricingMap[slug] = entry;
      }
    }
  }

  if (Object.keys(pricingMap).length > 0) {
    configManager.setProviderPricing(provider, pricingMap);
  }
}
