'use client';

import { YStack, XStack, SizableText } from '@hanzo/gui';
import { useState, useEffect } from 'react';
import { Button, Label, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, toast } from '@hanzo/ui';
import { Loader2, RefreshCw, Info } from 'lucide-react';

import {
  ProviderId,
  ProviderModel,
  fetchModels,
  getApiKey,
  getProvider,
  getSelectedModel,
  setSelectedModel
} from '@/lib/llm/providers';

interface ModelSelectorProps {
  providerId: ProviderId;
  value?: string;
  onModelChange?: (model: string) => void;
  className?: string;
}

export function ModelSelector({
  providerId,
  value,
  onModelChange,
  className
}: ModelSelectorProps) {
  const [models, setModels] = useState<ProviderModel[]>([]);
  const [selectedModel, setSelectedModelState] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provider = getProvider(providerId);

  useEffect(() => {
    loadModels();
    // Load saved model selection
    const saved = getSelectedModel(providerId);
    if (saved) {
      setSelectedModelState(saved);
    }
  }, [providerId]);

  useEffect(() => {
    if (value) {
      setSelectedModelState(value);
    }
  }, [value]);

  const loadModels = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiKey = getApiKey(providerId);

      // Check if API key is required but not provided
      if (provider.apiKeyRequired && !apiKey) {
        setError('API key required. Please configure in settings.');
        setLoading(false);
        return;
      }

      const fetchedModels = await fetchModels(providerId, apiKey || undefined);
      setModels(fetchedModels);

      // Auto-select first model if none selected
      if (!selectedModel && fetchedModels.length > 0) {
        const firstModel = fetchedModels[0].id;
        setSelectedModelState(firstModel);
        setSelectedModel(providerId, firstModel);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load models';
      setError(errorMessage);
      toast.error(`Failed to load models: ${errorMessage}`);

      // Use static models as fallback if available
      if (provider.models && provider.models.length > 0) {
        setModels(provider.models);
        if (!selectedModel && provider.models.length > 0) {
          const firstModel = provider.models[0].id;
          setSelectedModelState(firstModel);
          setSelectedModel(providerId, firstModel);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModelState(modelId);
    setSelectedModel(providerId, modelId);
    if (onModelChange) {
      onModelChange(modelId);
    }
    toast.success(`Switched to ${modelId}`);
  };

  const handleRefresh = () => {
    loadModels();
  };

  const selectedModelInfo = models.find(m => m.id === selectedModel);

  return (
    <YStack rowGap="$3" className={`${className || ''}`}>
      <XStack alignItems="center" justifyContent="space-between">
        <Label>Model</Label>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRefresh}
          disabled={loading}
          height="$6" paddingHorizontal="$2"
        >
          <RefreshCw size={12} />
        </Button>
      </XStack>

      <Select
        value={selectedModel}
        onValueChange={handleModelChange}
      >
        <SelectTrigger disabled={loading || models.length === 0}>
          <SelectValue placeholder={loading ? 'Loading models...' : 'Select a model'} />
        </SelectTrigger>
        <SelectContent>
          {models.map(model => (
            <SelectItem key={model.id} value={model.id}>
              <YStack>
                <SizableText fontWeight="500">{model.name}</SizableText>
                {model.description && (
                  <SizableText fontSize="$1" color="$color11">
                    {model.description}
                  </SizableText>
                )}
              </YStack>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && (
        <XStack alignItems="flex-start" gap="$2" padding="$2" backgroundColor="$red1" borderWidth={1} borderColor="$red3" borderRadius="$2">
          <Info size={12} />
          <SizableText fontSize="$1" color="$red11">{error}</SizableText>
        </XStack>
      )}

      {/* Model Info */}
      {selectedModelInfo && (
        <YStack rowGap="$2" padding="$3" backgroundColor="$color3" borderRadius="$5">
          <SizableText fontWeight="500" fontSize="$1" color="$color11">Model Information</SizableText>

          <YStack gap="$2">
            {selectedModelInfo.contextLength !== undefined && (
              <div>
                <SizableText fontSize="$1" color="$color11">Context Length:</SizableText>
                <SizableText fontFamily="$mono" fontSize="$1" color="$color11">
                  {(selectedModelInfo.contextLength / 1000).toFixed(0)}K tokens
                </SizableText>
              </div>
            )}
            {selectedModelInfo.maxTokens && (
              <div>
                <SizableText fontSize="$1" color="$color11">Max Output:</SizableText>
                <SizableText fontFamily="$mono" fontSize="$1" color="$color11">
                  {(selectedModelInfo.maxTokens / 1000).toFixed(0)}K tokens
                </SizableText>
              </div>
            )}
          </YStack>

          {selectedModelInfo.pricing && (
            <div>
              <SizableText fontSize="$1" color="$color11">Pricing (per 1M tokens):</SizableText>
              <XStack gap="$3" marginTop="$1">
                <SizableText fontSize="$1" color="$color11">
                  Input: ${selectedModelInfo.pricing.input}
                </SizableText>
                <SizableText fontSize="$1" color="$color11">
                  Output: ${selectedModelInfo.pricing.output}
                </SizableText>
              </XStack>
            </div>
          )}

          <XStack flexWrap="wrap" gap="$1" marginTop="$2">
            {selectedModelInfo.supportsFunctions && (
              <Badge variant="outline">Functions</Badge>
            )}
            {selectedModelInfo.supportsVision && (
              <Badge variant="outline">Vision</Badge>
            )}
          </XStack>
        </YStack>
      )}

      {loading && (
        <XStack alignItems="center" justifyContent="center" padding="$4">
          <Loader2 size={20} />
        </XStack>
      )}
    </YStack>
  );
}
