'use client';

import { useState, useEffect } from 'react';
import { Button } from "@hanzo/ui";
import { Label } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hanzo/ui";
import { Loader2, RefreshCw, Info } from 'lucide-react';
import { toast } from 'sonner';

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
    <div className={`space-y-3 ${className || ''}`}>
      <div className="flex items-center justify-between">
        <Label>Model</Label>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRefresh}
          disabled={loading}
          className="h-8 px-2"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Select
        value={selectedModel}
        onValueChange={handleModelChange}
        disabled={loading || models.length === 0}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? 'Loading models...' : 'Select a model'} />
        </SelectTrigger>
        <SelectContent>
          {models.map(model => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                {model.description && (
                  <span className="text-xs text-muted-foreground">
                    {model.description}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && (
        <div className="text-xs text-red-500 flex items-start gap-2 p-2 bg-red-500/5 rounded">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Model Info */}
      {selectedModelInfo && (
        <div className="text-xs text-muted-foreground space-y-2 p-3 bg-muted/50 rounded-lg">
          <div className="font-medium">Model Information</div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">Context Length:</span>
              <div className="font-mono">
                {(selectedModelInfo.contextLength / 1000).toFixed(0)}K tokens
              </div>
            </div>
            {selectedModelInfo.maxTokens && (
              <div>
                <span className="text-muted-foreground">Max Output:</span>
                <div className="font-mono">
                  {(selectedModelInfo.maxTokens / 1000).toFixed(0)}K tokens
                </div>
              </div>
            )}
          </div>

          {selectedModelInfo.pricing && (
            <div>
              <span className="text-muted-foreground">Pricing (per 1M tokens):</span>
              <div className="flex gap-3 mt-1">
                <span className="text-xs">
                  Input: ${selectedModelInfo.pricing.input}
                </span>
                <span className="text-xs">
                  Output: ${selectedModelInfo.pricing.output}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-1 mt-2">
            {selectedModelInfo.supportsFunctions && (
              <Badge variant="outline" className="text-xs">Functions</Badge>
            )}
            {selectedModelInfo.supportsVision && (
              <Badge variant="outline" className="text-xs">Vision</Badge>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
