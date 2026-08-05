'use client';

import { XStack, YStack, Anchor, SizableText, H2, Paragraph } from '@hanzo/gui';
import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger, toast } from '@hanzo/ui';
import { CheckCircle, ExternalLink, Key, Trash2 } from 'lucide-react';

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
        <XStack alignItems="flex-start" justifyContent="space-between">
          <div>
            <CardTitle fontSize="$6">{provider.name}</CardTitle>
            <CardDescription fontSize="$3" marginTop="$1">
              {provider.description}
            </CardDescription>
          </div>
          {hasKey && (
            <Badge variant="secondary">
              <CheckCircle size={12} />
              Configured
            </Badge>
          )}
        </XStack>
      </CardHeader>
      <CardContent rowGap="$4">
        {provider.apiKeyRequired && (
          <>
            <YStack rowGap="$2">
              <XStack alignItems="center" justifyContent="space-between">
                <Label htmlFor={`${provider.id}-key`}>API Key</Label>
                {provider.apiKeyHelpUrl && (
                  <Anchor display="flex"
                    href={provider.apiKeyHelpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    fontSize="$1" color="$blue9" alignItems="center" gap="$1" hoverStyle={{ color: "$blue10" }}
                  >
                    Get API Key
                    <ExternalLink size={12} />
                  </Anchor>
                )}
              </XStack>
              <XStack gap="$2">
                <Input
                  id={`${provider.id}-key`}
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKeyValue(e.target.value)}
                  placeholder={provider.apiKeyPlaceholder || 'Enter API key'}
                  flex={1}
  />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? 'Hide' : 'Show'}
                </Button>
              </XStack>
            </YStack>

            <XStack gap="$2">
              <Button
                flex={1}
                onClick={handleSave}
                disabled={!apiKey.trim()}
              >
                <Key size={16} />
                Save API Key
              </Button>
              {hasKey && (
                <Button
                  variant="outline"
                  onClick={handleRemove}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </XStack>
          </>
        )}

        {!provider.apiKeyRequired && (
          <YStack padding="$3" backgroundColor="$color3" borderRadius="$5">
            <Paragraph fontSize="$3" color="$color11">
              {provider.isLocal
                ? `This provider runs locally. Make sure ${provider.name} is running at ${provider.baseUrl}`
                : 'No API key required for this provider'}
            </Paragraph>
          </YStack>
        )}

        <YStack rowGap="$1">
          <XStack alignItems="center" gap="$2">
            <SizableText fontWeight="500" fontSize="$1" color="$color11">Base URL:</SizableText>
            <SizableText paddingHorizontal="$1.5" paddingVertical="$0.5" backgroundColor="$background" borderRadius="$2" fontSize="$1" color="$color11">
              {provider.baseUrl}
            </SizableText>
          </XStack>
          <XStack flexWrap="wrap" gap="$2" marginTop="$2">
            {provider.supportsFunctions && (
              <Badge variant="outline">Functions</Badge>
            )}
            {provider.supportsStreaming && (
              <Badge variant="outline">Streaming</Badge>
            )}
            {provider.supportsModelDiscovery && (
              <Badge variant="outline">Auto-discovery</Badge>
            )}
          </XStack>
        </YStack>
      </CardContent>
    </Card>
  );
}

export function ProviderSettings() {
  const [selectedProvider, setSelectedProviderState] = useState<ProviderId>('openai');
  const [validatingProvider, setValidatingProvider] = useState<ProviderId | null>(null);
  const [validationResults, setValidationResults] = useState<Record<ProviderId, boolean>>(() => ({} as Record<ProviderId, boolean>));

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
    <YStack rowGap="$5">
      <div>
        <H2 fontSize="$8" fontWeight="500" marginBottom="$2">Provider Settings</H2>
        <Paragraph color="$color11">
          Configure your AI provider API keys and settings. All keys are stored locally in your browser.
        </Paragraph>
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
                  <XStack alignItems="center" gap="$2">
                    {provider.name}
                    {hasApiKey(provider.id) && (
                      <CheckCircle size={12} />
                    )}
                  </XStack>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Provider Configuration */}
      <Tabs defaultValue="cloud" width="100%">
        <TabsList width="100%">
          <TabsTrigger value="cloud">Cloud Providers ({cloudProviders.length})</TabsTrigger>
          <TabsTrigger value="local">Local Providers ({localProviders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="cloud" rowGap="$4" marginTop="$4">
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

        <TabsContent value="local" rowGap="$4" marginTop="$4">
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
      <Card backgroundColor="$yellow1" borderColor="$yellow3">
        <CardContent paddingTop="$5">
          <XStack gap="$3">
            <Key size={20} />
            <YStack rowGap="$2">
              <Paragraph fontWeight="500" fontSize="$3" color="$yellow12">Security Notice</Paragraph>
              <YStack rowGap="$1">
                <SizableText fontSize="$3" color="$color11">API keys are stored locally in your browser's localStorage</SizableText>
                <SizableText fontSize="$3" color="$color11">Keys are never sent to Hanzo servers</SizableText>
                <SizableText fontSize="$3" color="$color11">Clear your browser data to remove stored keys</SizableText>
                <SizableText fontSize="$3" color="$color11">Use dedicated API keys with usage limits when possible</SizableText>
              </YStack>
            </YStack>
          </XStack>
        </CardContent>
      </Card>
    </YStack>
  );
}
