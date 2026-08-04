'use client';

import { YStack, XStack, SizableText, Paragraph } from '@hanzo/gui';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Label, Badge, Button, Input, Switch, Popover, PopoverContent, PopoverTrigger, toast } from '@hanzo/ui';
import { logger } from '@/lib/utils';
import {
  Loader2,
  Sparkles,
  Zap,
  Brain,
  Server,
  Cloud,
  Cpu,
  ChevronDown,
  Search,
  X,
  Lightbulb
} from 'lucide-react';
import { configManager } from '@/lib/config/storage';
import { ProviderId, ProviderModel } from '@/lib/llm/providers/types';
import { getProvider, getDefaultModel } from '@/lib/llm/providers/registry';
import { getAvailableModels } from '@/lib/llm/llm-client';
import {
  fetchAvailableModels,
  formatModelPrice
} from '@/lib/llm/models-api';
import { registerPricingFromProviderModels } from '@/lib/llm/pricing-cache';
import { track } from '@/lib/telemetry';

interface ModelSelectorProps {
  provider?: ProviderId;
  value?: string;
  onChange?: (modelId: string) => void;
  className?: string;
  hideModelDetails?: boolean;
  mode?: 'popover' | 'inline';
  skipGlobalSync?: boolean;
}

export function ModelSelector({ provider, value: _value, onChange, className, hideModelDetails, mode = 'popover', skipGlobalSync }: ModelSelectorProps) {
  const currentProvider = provider || configManager.getSelectedProvider();
  const providerConfig = getProvider(currentProvider);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [models, setModels] = useState<ProviderModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState('');
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  
  const getModelName = (model: ProviderModel) => {
    return model.name;
  };

  // Define loadModels before useEffects that use it
  const loadModels = useCallback(async () => {
    try {
      setLoading(true);
      
      const apiKey = configManager.getProviderApiKey(currentProvider);
      
      if (providerConfig.apiKeyRequired && !apiKey) {
        setNeedsApiKey(true);
        if (providerConfig.models) {
          setModels(providerConfig.models);
        } else {
          setModels([]);
        }
        return;
      }
      
      setNeedsApiKey(false);
      
      // Check cache first
      const cachedModels = configManager.getCachedModels(currentProvider);
      if (cachedModels) {
        const modelsFromCache = cachedModels.models as ProviderModel[];
        setModels(modelsFromCache);
        registerPricingFromProviderModels(currentProvider, modelsFromCache);
        return;
      }

      let loadedModels: ProviderModel[] = [];

      if (currentProvider === 'hanzo' || currentProvider === 'openrouter') {
        // Both publish a public catalogue with prices. One fetch, one adapter —
        // and it reads the SELECTED provider, so picking Hanzo can no longer
        // list a third party's model ids.
        loadedModels = await fetchAvailableModels(currentProvider);
      } else if (currentProvider === 'huggingface') {
        try {
          const hfResponse = await fetch('https://router.huggingface.co/v1/models');
          if (hfResponse.ok) {
            const hfData = await hfResponse.json();
            loadedModels = (hfData.data || []).map((model: any) => {
              const hfProviders = model.providers || [];
              const bestProvider = hfProviders.find((p: any) => p.supports_tools && p.status === 'live')
                || hfProviders.find((p: any) => p.status === 'live')
                || hfProviders[0];

              const contextLength = bestProvider?.context_length || 32768;
              const supportsFunctions = hfProviders.some((p: any) => p.supports_tools);
              const supportsVision = model.architecture?.input_modalities?.includes('image');

              let pricing: { input: number; output: number } | undefined;
              if (bestProvider?.pricing?.input != null && bestProvider?.pricing?.output != null) {
                pricing = {
                  input: bestProvider.pricing.input,
                  output: bestProvider.pricing.output,
                };
              }

              return {
                id: model.id,
                name: model.id.split('/').pop() || model.id,
                contextLength,
                supportsFunctions,
                supportsVision,
                pricing,
              } as ProviderModel;
            });
          }
        } catch (error) {
          logger.error('HuggingFace models fetch error:', error);
        }
        if (loadedModels.length > 0) {
          registerPricingFromProviderModels('huggingface', loadedModels);
        }
      } else if (providerConfig.supportsModelDiscovery) {
        // Try to discover models (we know API key exists at this point)
        const modelIds = await getAvailableModels(apiKey || undefined, currentProvider);
        loadedModels = modelIds.map(id => ({
          id,
          name: id.split('/').pop() || id,
          contextLength: 32000,
          supportsFunctions: true
        }));
      } else if (providerConfig.models) {
        // Use hardcoded models
        loadedModels = providerConfig.models;
      } else {
        loadedModels = [];
      }
      
      setModels(loadedModels);
      
      // Show warning for local providers with no models
      if (providerConfig.isLocal && loadedModels.length === 0) {
        toast.warning(
          `No models found in ${providerConfig.name}. Please load some models in the application.`,
          { duration: 5000 }
        );
      }
      
      // Cache the loaded models, and register whatever prices they carry so the
      // cost calculator quotes the provider's own numbers instead of a default.
      if (loadedModels.length > 0) {
        configManager.setCachedModels(currentProvider, loadedModels);
        registerPricingFromProviderModels(currentProvider, loadedModels);
      }
    } catch (error) {
      logger.error('Failed to load models:', error);
      
      // Show helpful message for local providers
      if (providerConfig.isLocal) {
        toast.error(
          `${providerConfig.name} server not running. Please start the server and load some models.`,
          { duration: 5000 }
        );
      }
      
      // Fall back to hardcoded models if available
      if (providerConfig.models) {
        setModels(providerConfig.models);
      }
    } finally {
      setLoading(false);
    }
  }, [currentProvider, providerConfig]);

  // Single effect to handle provider changes and model loading
  useEffect(() => {
    // Immediately clear models array to prevent stale state
    setModels([]);
    setSelectedModel('');
    setLoading(true);
    
    // Clear cache for this provider to get fresh models
    configManager.clearModelCache(currentProvider);
    
    // Load models immediately
    loadModels();
  }, [currentProvider, loadModels]);

  // Single effect to initialize selectedModel when models are loaded
  useEffect(() => {
    if (models.length === 0 || loading) return;

    // Get the saved model for this provider
    const savedModel = configManager.getProviderModel(currentProvider);
    // Check if saved model exists in loaded models
    if (savedModel && models.some(m => m.id === savedModel)) {
      setSelectedModel(savedModel);
      onChangeRef.current?.(savedModel);
    } else {
      // Nothing saved: take the provider's declared default, and only fall to
      // the head of the list if the provider does not serve it. Using models[0]
      // outright made display ORDER the default — on our own gateway that meant
      // opening on a resold `claude-*`/`gpt-*` rung instead of Enso.
      const preferred = getDefaultModel(currentProvider);
      const nextModel = models.some(m => m.id === preferred) ? preferred : models[0]?.id;
      if (nextModel) {
        setSelectedModel(nextModel);
        if (!skipGlobalSync) {
          configManager.setProviderModel(currentProvider, nextModel);
        }
        onChangeRef.current?.(nextModel);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models, loading, currentProvider]);

  // Method to refresh models (can be called externally)
  const _refreshModels = (forceRefresh = false) => {
    if (forceRefresh) {
      configManager.clearModelCache(currentProvider);
    }
    loadModels();
  };

  // Expose refresh method via ref or global method (for when API key is added)
  useEffect(() => {
    const handleApiKeyUpdate = () => {
      // Small delay to ensure config is saved
      setTimeout(() => {
        loadModels();
      }, 100);
    };

    // Listen for a custom event when API keys are updated
    window.addEventListener('apiKeyUpdated', handleApiKeyUpdate);
    
    return () => {
      window.removeEventListener('apiKeyUpdated', handleApiKeyUpdate);
    };
  }, [loadModels]);

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    if (!skipGlobalSync) {
      configManager.setProviderModel(currentProvider, modelId);
    }
    onChange?.(modelId);
    track('model_selected', { provider: currentProvider, model: modelId });
    if (mode === 'popover') {
      setOpen(false);
      setSearchQuery('');
    }
    // Load reasoning state for the new model
    setReasoningEnabled(configManager.getReasoningEnabled(modelId));
  };

  const handleReasoningToggle = (enabled: boolean) => {
    setReasoningEnabled(enabled);
    if (selectedModel) {
      configManager.setReasoningEnabled(selectedModel, enabled);
    }
  };

  // Sync reasoning state when selected model changes
  useEffect(() => {
    if (selectedModel) {
      setReasoningEnabled(configManager.getReasoningEnabled(selectedModel));
    }
  }, [selectedModel]);

  const getModelIcon = (model: ProviderModel) => {
    const id = model.id.toLowerCase();
    if (id.includes('deepseek')) return <Brain size={12} />;
    if (id.includes('claude')) return <Sparkles size={12} />;
    if (id.includes('gpt')) return <Zap size={12} />;
    if (id.includes('gemini')) return <Cloud size={12} />;
    if (id.includes('llama')) return <Server size={12} />;
    if (id.includes('qwen')) return <Cpu size={12} />;
    return null;
  };

  const getProviderColor = (modelId: string) => {
    const id = modelId.toLowerCase();
    if (id.includes('deepseek')) return 'bg-blue-500/10 text-blue-500';
    if (id.includes('claude')) return 'bg-orange-500/10 text-orange-500';
    if (id.includes('openai') || id.includes('gpt')) return 'bg-green-500/10 text-green-500';
    if (id.includes('qwen')) return 'bg-orange-500/10 text-orange-500';
    if (id.includes('google')) return 'bg-red-500/10 text-red-500';
    if (id.includes('meta')) return 'bg-indigo-500/10 text-indigo-500';
    return 'bg-neutral-500/10 text-neutral-500';
  };

  // Filter models based on search query
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return models;
    
    const query = searchQuery.toLowerCase();
    return models.filter(model => {
      const modelId = model.id.toLowerCase();
      const modelName = getModelName(model).toLowerCase();
      const providerName = model.id.split('/')[0].toLowerCase();
      
      return (
        modelId.includes(query) ||
        modelName.includes(query) ||
        providerName.includes(query)
      );
    });
  }, [models, searchQuery]);

  const selectedModelData = models.find(m => m.id === selectedModel);

  if (loading) {
    return (
      <YStack className={`${className}`}>
        <Label>AI Model</Label>
        <XStack alignItems="center" gap="$2" height="$7" paddingHorizontal="$3" borderWidth={1} borderRadius="$3" backgroundColor="$color3">
          <Loader2 size={16} />
          <SizableText fontSize="$3" color="$color11">Loading models...</SizableText>
        </XStack>
      </YStack>
    );
  }

  if (needsApiKey) {
    return (
      <YStack className={`${className}`}>
        <Label>AI Model</Label>
        <XStack alignItems="center" gap="$2" height="$7" paddingHorizontal="$3" borderWidth={1} borderRadius="$3" backgroundColor="$color3" borderColor="$orange3" $theme-dark={{ borderColor: "$orange11" }}>
          <SizableText fontSize="$3" color="$orange10" $theme-dark={{ color: "$orange8" }}>
            API key required for {providerConfig.name}
          </SizableText>
        </XStack>
        <Paragraph fontSize="$1" color="$color11" marginTop="$1">
          Set your API key in settings to load available models
        </Paragraph>
      </YStack>
    );
  }

  const renderModelItem = (model: ProviderModel) => (
    <Button
      key={model.id}
      onClick={() => handleModelSelect(model.id)}
      width="100%" justifyContent="flex-start" paddingHorizontal="$3" paddingVertical="$2" borderRadius="$5" {...(mode === 'inline'
        ? selectedModel === model.id
          ? { backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)", borderWidth: 1, borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)" }
          : { borderWidth: 1, borderColor: "transparent", hoverStyle: { backgroundColor: "var(--accent)" } }
        : selectedModel === model.id
          ? { backgroundColor: "var(--accent)" }
          : { hoverStyle: { backgroundColor: "var(--accent)" } })}
    >
      <YStack gap="$0.5">
        <XStack alignItems="center" gap="$2">
          {getModelIcon(model)}
          <SizableText fontWeight="500" fontSize="$3" {...{ color: selectedModel === model.id && mode === 'inline' ? "$color12" : undefined }}>
            {getModelName(model)}
          </SizableText>
          {currentProvider === 'openrouter' && (
            <Badge variant="secondary" className={`${getProviderColor(model.id)}`}>
              {model.id.split('/')[0]}
            </Badge>
          )}
        </XStack>
        <XStack alignItems="center" gap="$3">
          {model.contextLength !== undefined && (
            <SizableText fontSize="$1" color="$color11">Context: {Math.round(model.contextLength / 1000)}K</SizableText>
          )}
          {model.pricing && (
            model.pricing.input === 0 && model.pricing.output === 0 ? (
              <>
                <SizableText fontSize="$1" color="$color11">·</SizableText>
                <SizableText fontSize="$1" color="$color11">Free</SizableText>
              </>
            ) : (
              <>
                <SizableText fontSize="$1" color="$color11">·</SizableText>
                <SizableText fontSize="$1" color="$color11">
                  {formatModelPrice(model.pricing.input)}/K | {formatModelPrice(model.pricing.output)}/K
                </SizableText>
              </>
            )
          )}
          {!model.pricing && currentProvider !== 'openrouter' && (
            <>
              <SizableText fontSize="$1" color="$color11">·</SizableText>
              <SizableText fontSize="$1" color="$color11">Pricing varies</SizableText>
            </>
          )}
        </XStack>
      </YStack>
    </Button>
  );

  const modelDetailsSection = !hideModelDetails && selectedModelData && (
    <YStack marginTop="$1" maxHeight={150} paddingRight="$2" overflow="scroll">
      <SizableText fontWeight="500" marginBottom="$1" fontSize="$1" color="$color11">
        {selectedModelData.pricing ? (
          selectedModelData.pricing.input === 0 && selectedModelData.pricing.output === 0 ?
            'Free' :
            `Input: ${formatModelPrice(selectedModelData.pricing.input)}/K • Output: ${formatModelPrice(selectedModelData.pricing.output)}/K`
        ) : (
          'Pricing varies by provider'
        )}
      </SizableText>
      {selectedModelData.description && (
        <SizableText fontSize="$1" color="$color11">{selectedModelData.description}</SizableText>
      )}
    </YStack>
  );

  const reasoningSection = selectedModelData?.supportsReasoning && (
    <XStack marginTop="$3" alignItems="center" justifyContent="space-between" gap="$2" padding="$2" borderRadius="$3" backgroundColor="$color3" borderWidth={1}>
      <XStack alignItems="center" gap="$2">
        <Lightbulb size={16} />
        <div>
          <Label htmlFor="reasoning-toggle" fontSize="$3" fontWeight="500" cursor="pointer">
            Enable Reasoning
          </Label>
          <Paragraph fontSize="$1" color="$color11">
            Show step-by-step thinking process
          </Paragraph>
        </div>
      </XStack>
      <Switch
        id="reasoning-toggle"
        checked={reasoningEnabled}
        onCheckedChange={handleReasoningToggle}
  />
    </XStack>
  );

  // --- Inline mode ---
  if (mode === 'inline') {
    return (
      <YStack className={`${className}`}>
        <YStack borderWidth={1} borderRadius="$5" overflow="hidden">
          {/* Search bar */}
          <XStack alignItems="center" borderBottomWidth={1} paddingHorizontal="$3">
            <Search size={14} />
            <Input
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              height={36} borderWidth={0} backgroundColor="transparent" fontSize="$3" $theme-dark={{ backgroundColor: "transparent" }}
  />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                padding="$0"
              >
                <X size={12} />
              </Button>
            )}
          </XStack>
          {/* Model list */}
          <YStack maxHeight={240} padding="$1" overflow="scroll">
            {filteredModels.length === 0 ? (
              <YStack paddingVertical="$4.5">
                <SizableText textAlign="center" fontSize="$3" color="$color11">No models found</SizableText>
              </YStack>
            ) : (
              filteredModels.map(renderModelItem)
            )}
          </YStack>
        </YStack>
        {modelDetailsSection}
        {reasoningSection}
      </YStack>
    );
  }

  // --- Popover mode (default) ---
  return (
    <YStack className={`${className}`}>
      <Label htmlFor="model-select">AI Model</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            justifyContent="space-between" minWidth={200}
          >
            {selectedModelData ? (
              <XStack alignItems="center" gap="$2">
                {getModelIcon(selectedModelData)}
                <SizableText numberOfLines={1} fontWeight="400">{getModelName(selectedModelData)}</SizableText>
              </XStack>
            ) : (
              <SizableText color="$color11" fontWeight="400">Select a model...</SizableText>
            )}
            <ChevronDown size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          width="32rem" padding="$0"
          align="start"
          sideOffset={5}
        >
          <XStack alignItems="center" borderBottomWidth={1} paddingHorizontal="$3">
            <Search size={16} />
            <Input
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              height="$7" borderWidth={0}
  />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                padding="$0"
              >
                <X size={12} />
              </Button>
            )}
          </XStack>
          <YStack maxHeight={400} minHeight={300} overflow="scroll">
            {filteredModels.length === 0 ? (
              <YStack paddingVertical="$5">
                <SizableText textAlign="center" fontSize="$3" color="$color11">No models found</SizableText>
              </YStack>
            ) : (
              filteredModels.map((model) => (
                <Button
                  key={model.id}
                  onClick={() => handleModelSelect(model.id)}
                  width="100%" justifyContent="flex-start" paddingHorizontal="$3" paddingVertical="$3" hoverStyle={{ backgroundColor: "$color3" }} {...{ backgroundColor: selectedModel === model.id ? "$color3" : undefined }}
                >
                  <YStack gap="$1">
                    <XStack alignItems="center" gap="$2">
                      {getModelIcon(model)}
                      <SizableText fontWeight="500">{getModelName(model)}</SizableText>
                      {currentProvider === 'openrouter' && (
                        <Badge variant="secondary" className={`${getProviderColor(model.id)}`}>
                          {model.id.split('/')[0]}
                        </Badge>
                      )}
                    </XStack>
                    <XStack alignItems="center" gap="$3">
                      {model.contextLength !== undefined && (
                        <SizableText fontSize="$1" color="$color11">Context: {Math.round(model.contextLength / 1000)}K</SizableText>
                      )}
                      {model.pricing && (
                        model.pricing.input === 0 && model.pricing.output === 0 ? (
                          <>
                            <SizableText fontSize="$1" color="$color11">•</SizableText>
                            <SizableText fontSize="$1" color="$color11">Free</SizableText>
                          </>
                        ) : (
                          <>
                            <SizableText fontSize="$1" color="$color11">•</SizableText>
                            <SizableText fontSize="$1" color="$color11">
                              {formatModelPrice(model.pricing.input)}/K | {formatModelPrice(model.pricing.output)}/K
                            </SizableText>
                          </>
                        )
                      )}
                      {!model.pricing && currentProvider !== 'openrouter' && (
                        <>
                          <SizableText fontSize="$1" color="$color11">•</SizableText>
                          <SizableText fontSize="$1" color="$color11">Pricing varies</SizableText>
                        </>
                      )}
                    </XStack>
                  </YStack>
                </Button>
              ))
            )}
          </YStack>
        </PopoverContent>
      </Popover>
      {modelDetailsSection}
      {reasoningSection}
    </YStack>
  );
}
