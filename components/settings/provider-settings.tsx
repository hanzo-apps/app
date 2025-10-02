'use client';

import { useState, useEffect } from 'react';
import { Button } from "@hanzo/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import { Label } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hanzo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hanzo/ui";
import { Loader2, CheckCircle, XCircle, ExternalLink, Key, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  ProviderId,
  ProviderConfig,
  getAllProviders,
  getCloudProviders,
  getLocalProviders,
  getApiKey,
  setApiKey,
  removeApiKey,
  getSelectedProvider,
  setSelectedProvider,
  validateApiKey,
  testLocalConnection,
  hasApiKey
} from '@/lib/llm/providers';

interface ProviderCardProps {
  provider: ProviderConfig;
  onValidate: (providerId: ProviderId) => void;
  onRemove: (providerId: ProviderId) => void;
  isValidating: boolean;
}

function ProviderCard({ provider, onValidate, onRemove, isValidating }: ProviderCardProps) {
  const [apiKey, setApiKeyValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const hasKey = hasApiKey(provider.id);

  useEffect(() => {
    const storedKey = getApiKey(provider.id);
    if (storedKey) {
      setApiKeyValue(storedKey);
    }
  }, [provider.id]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    if (setApiKey(provider.id, apiKey)) {
      toast.success(`API key saved for ${provider.name}`);
      onValidate(provider.id);
    } else {
      toast.error('Failed to save API key');
    }
  };

  const handleRemove = () => {
    if (removeApiKey(provider.id)) {
      setApiKeyValue('');
      toast.success(`API key removed for ${provider.name}`);
      onRemove(provider.id);
    } else {
      toast.error('Failed to remove API key');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{provider.name}</CardTitle>
            <CardDescription className="text-sm mt-1">
              {provider.description}
            </CardDescription>
          </div>
          {hasKey && (
            <Badge className="bg-green-500/10 text-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Configured
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {provider.apiKeyRequired && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`${provider.id}-key`}>API Key</Label>
                {provider.apiKeyHelpUrl && (
                  <a
                    href={provider.apiKeyHelpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    Get API Key
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  id={`${provider.id}-key`}
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKeyValue(e.target.value)}
                  placeholder={provider.apiKeyPlaceholder || 'Enter API key'}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? 'Hide' : 'Show'}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={!apiKey.trim()}
              >
                <Key className="w-4 h-4 mr-2" />
                Save API Key
              </Button>
              {hasKey && (
                <Button
                  variant="outline"
                  onClick={handleRemove}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </>
        )}

        {!provider.apiKeyRequired && (
          <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
            <p>
              {provider.isLocal
                ? `This provider runs locally. Make sure ${provider.name} is running at ${provider.baseUrl}`
                : 'No API key required for this provider'}
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">Base URL:</span>
            <code className="px-1.5 py-0.5 bg-background rounded text-xs">
              {provider.baseUrl}
            </code>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {provider.supportsFunctions && (
              <Badge variant="outline" className="text-xs">Functions</Badge>
            )}
            {provider.supportsStreaming && (
              <Badge variant="outline" className="text-xs">Streaming</Badge>
            )}
            {provider.supportsModelDiscovery && (
              <Badge variant="outline" className="text-xs">Auto-discovery</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProviderSettings() {
  const [selectedProvider, setSelectedProviderState] = useState<ProviderId>('openai');
  const [validatingProvider, setValidatingProvider] = useState<ProviderId | null>(null);
  const [validationResults, setValidationResults] = useState<Record<ProviderId, boolean>>({});

  useEffect(() => {
    const current = getSelectedProvider();
    setSelectedProviderState(current);
  }, []);

  const handleProviderChange = (providerId: ProviderId) => {
    setSelectedProviderState(providerId);
    setSelectedProvider(providerId);
    toast.success(`Switched to ${providerId}`);
  };

  const handleValidate = async (providerId: ProviderId) => {
    setValidatingProvider(providerId);

    const provider = getAllProviders().find(p => p.id === providerId);
    if (!provider) return;

    try {
      if (provider.isLocal) {
        const result = await testLocalConnection(providerId);
        setValidationResults(prev => ({ ...prev, [providerId]: result.connected }));

        if (result.connected) {
          toast.success(`Connected to ${provider.name}`);
        } else {
          toast.error(`Could not connect to ${provider.name}: ${result.error}`);
        }
      } else {
        const apiKey = getApiKey(providerId);
        if (!apiKey) {
          toast.error('No API key configured');
          return;
        }

        const result = await validateApiKey(providerId, apiKey);
        setValidationResults(prev => ({ ...prev, [providerId]: result.valid }));

        if (result.valid) {
          toast.success(`API key validated for ${provider.name}`);
        } else {
          toast.error(`Invalid API key: ${result.error}`);
        }
      }
    } catch (error) {
      toast.error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setValidationResults(prev => ({ ...prev, [providerId]: false }));
    } finally {
      setValidatingProvider(null);
    }
  };

  const handleRemove = (providerId: ProviderId) => {
    setValidationResults(prev => {
      const updated = { ...prev };
      delete updated[providerId];
      return updated;
    });
  };

  const cloudProviders = getCloudProviders();
  const localProviders = getLocalProviders();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Provider Settings</h2>
        <p className="text-muted-foreground">
          Configure your AI provider API keys and settings. All keys are stored locally in your browser.
        </p>
      </div>

      {/* Active Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Active Provider</CardTitle>
          <CardDescription>
            Select which provider to use for AI requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedProvider} onValueChange={handleProviderChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>
              {getAllProviders().map(provider => (
                <SelectItem key={provider.id} value={provider.id}>
                  <div className="flex items-center gap-2">
                    {provider.name}
                    {hasApiKey(provider.id) && (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Provider Configuration */}
      <Tabs defaultValue="cloud" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cloud">Cloud Providers ({cloudProviders.length})</TabsTrigger>
          <TabsTrigger value="local">Local Providers ({localProviders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="cloud" className="space-y-4 mt-4">
          {cloudProviders.map(provider => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onValidate={handleValidate}
              onRemove={handleRemove}
              isValidating={validatingProvider === provider.id}
            />
          ))}
        </TabsContent>

        <TabsContent value="local" className="space-y-4 mt-4">
          {localProviders.map(provider => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onValidate={handleValidate}
              onRemove={handleRemove}
              isValidating={validatingProvider === provider.id}
            />
          ))}
        </TabsContent>
      </Tabs>

      {/* Security Notice */}
      <Card className="bg-yellow-500/5 border-yellow-500/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Key className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm space-y-2">
              <p className="font-medium text-yellow-600">Security Notice</p>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                <li>API keys are stored locally in your browser's localStorage</li>
                <li>Keys are never sent to Hanzo servers</li>
                <li>Clear your browser data to remove stored keys</li>
                <li>Use dedicated API keys with usage limits when possible</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
