'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from '@hanzo/ui';

import { configManager } from '@/lib/config/storage';
import { getAvailableModels } from '@/lib/llm/llm-client';
import { fetchAvailableModels } from '@/lib/llm/models-api';
import { registerPricingFromProviderModels } from '@/lib/llm/pricing-cache';
import { getDefaultModel, getProvider } from '@/lib/llm/providers/registry';
import type { ProviderId, ProviderModel } from '@/lib/llm/providers/types';
import { buildModelsFrom, type ModelOption } from '@/lib/providers';

/**
 * The catalog of ONE bring-your-own-key provider, and the model chosen from it.
 *
 * This is the loading half of what used to be welded into the picker component.
 * A picker that fetches can only ever serve the one source it fetches from, so
 * every new source grew a new picker — which is how this app came to have four.
 * Fetching lives here, drawing lives in components/model-selector, and they meet
 * at a list.
 *
 * The gateway catalog has its own hook (lib/hooks/use-models) because it is a
 * different source with different caching, not a different kind of thing: both
 * hand back `ModelOption[]`, so both feed the same picker.
 */
export type UseProviderModels = {
  models: ModelOption[];
  /** The full provider records, for details the picker does not show. */
  raw: ProviderModel[];
  selected: string;
  select: (id: string) => void;
  loading: boolean;
  /** The provider needs a key and none is set — the list is whatever it ships. */
  needsKey: boolean;
  reload: () => void;
};

/** Provider records → the one catalog shape, so BYOK models group and mark too. */
function shape(models: ProviderModel[]): ModelOption[] {
  return buildModelsFrom(
    models.map((m) => ({
      id: m.id,
      description: m.description,
      context_window: m.contextLength,
    }))
  );
}

/**
 * Hugging Face's router lists one model many times over — once per serving
 * route, each with its own context window, tool support and price. The model is
 * the thing being chosen, so one route has to speak for it: the best live route
 * that supports tools, else any live route, else whatever is listed.
 */
type HfRoute = {
  status?: string;
  supports_tools?: boolean;
  context_length?: number;
  pricing?: { input?: number; output?: number };
};
type HfModel = {
  id: string;
  providers?: HfRoute[];
  architecture?: { input_modalities?: string[] };
};

function fromHuggingFace(model: HfModel): ProviderModel {
  const routes = model.providers ?? [];
  const best =
    routes.find((r) => r.supports_tools && r.status === 'live') ??
    routes.find((r) => r.status === 'live') ??
    routes[0];
  const { input, output } = best?.pricing ?? {};
  return {
    id: model.id,
    name: model.id.split('/').pop() || model.id,
    contextLength: best?.context_length ?? 32768,
    supportsFunctions: routes.some((r) => Boolean(r.supports_tools)),
    supportsVision: Boolean(model.architecture?.input_modalities?.includes('image')),
    ...(input != null && output != null ? { pricing: { input, output } } : {}),
  };
}

async function discover(provider: ProviderId): Promise<ProviderModel[]> {
  const config = getProvider(provider);
  const apiKey = configManager.getProviderApiKey(provider);

  // Both publish a public catalogue with prices. One fetch, one adapter — and it
  // reads the SELECTED provider, so picking Hanzo cannot list a third party's ids.
  if (provider === 'hanzo' || provider === 'openrouter') {
    return fetchAvailableModels(provider);
  }

  if (provider === 'huggingface') {
    const response = await fetch('https://router.huggingface.co/v1/models');
    if (!response.ok) return [];
    const body: { data?: HfModel[] } = await response.json();
    return (body.data ?? []).map(fromHuggingFace);
  }

  if (config.supportsModelDiscovery) {
    const ids = await getAvailableModels(apiKey || undefined, provider);
    return ids.map((id) => ({
      id,
      name: id.split('/').pop() || id,
      contextLength: 32000,
      supportsFunctions: true,
    }));
  }

  return config.models ?? [];
}

export function useProviderModels(
  provider: ProviderId,
  options: { persist?: boolean } = {}
): UseProviderModels {
  const { persist = true } = options;
  const [raw, setRaw] = useState<ProviderModel[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [needsKey, setNeedsKey] = useState(false);

  const load = useCallback(async () => {
    const config = getProvider(provider);
    setLoading(true);
    try {
      const apiKey = configManager.getProviderApiKey(provider);
      if (config.apiKeyRequired && !apiKey) {
        setNeedsKey(true);
        setRaw(config.models ?? []);
        return;
      }
      setNeedsKey(false);

      const cached = configManager.getCachedModels(provider);
      if (cached) {
        const list = cached.models as ProviderModel[];
        setRaw(list);
        registerPricingFromProviderModels(provider, list);
        return;
      }

      const list = await discover(provider);
      setRaw(list);
      if (list.length > 0) {
        configManager.setCachedModels(provider, list);
        registerPricingFromProviderModels(provider, list);
      } else if (config.isLocal) {
        toast.warning(
          `No models found in ${config.name}. Please load some models in the application.`,
          { duration: 5000 }
        );
      }
    } catch {
      if (getProvider(provider).isLocal) {
        toast.error(
          `${getProvider(provider).name} server not running. Please start the server and load some models.`,
          { duration: 5000 }
        );
      }
      setRaw(getProvider(provider).models ?? []);
    } finally {
      setLoading(false);
    }
  }, [provider]);

  // Switching provider must clear the previous provider's list first: the picker
  // briefly showed the OLD provider's ids under the NEW provider's name.
  useEffect(() => {
    setRaw([]);
    setSelected('');
    setLoading(true);
    configManager.clearModelCache(provider);
    void load();
  }, [provider, load]);

  useEffect(() => setModels(shape(raw)), [raw]);

  // An API key arriving elsewhere in settings unlocks the list here.
  useEffect(() => {
    const onKey = () => void load();
    window.addEventListener('apiKeyUpdated', onKey);
    return () => window.removeEventListener('apiKeyUpdated', onKey);
  }, [load]);

  const select = useCallback(
    (id: string) => {
      setSelected(id);
      if (persist) configManager.setProviderModel(provider, id);
    },
    [provider, persist]
  );

  // Settle on a model once the list lands: the saved one if it is still served,
  // else the provider's DECLARED default. Never `models[0]` — taking the head of
  // the list makes display order the default, which on our own gateway opened on
  // a resold frontier tier instead of Enso.
  useEffect(() => {
    if (loading || models.length === 0 || selected) return;
    const saved = configManager.getProviderModel(provider);
    if (saved && models.some((m) => m.value === saved)) {
      setSelected(saved);
      return;
    }
    const preferred = getDefaultModel(provider);
    const next = models.some((m) => m.value === preferred) ? preferred : models[0]?.value;
    if (next) select(next);
  }, [models, loading, selected, provider, select]);

  return { models, raw, selected, select, loading, needsKey, reload: load };
}
