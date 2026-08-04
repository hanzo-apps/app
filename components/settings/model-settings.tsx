'use client';

import { YStack, H3, Paragraph, SizableText, Anchor, XStack } from '@hanzo/gui';
import { useState, useEffect } from 'react';
import { configManager } from '@/lib/config/storage';
import { validateApiKey as checkApiKey } from '@/lib/llm/llm-client';
import { Button, Input, Label, Switch, toast, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator } from '@hanzo/ui';
import { Eye, EyeOff, Check, X, ExternalLink, Loader2, Lightbulb } from 'lucide-react';
import { ModelSelector } from '@/components/model-selector';
import { useProviderModels } from '@/lib/hooks/use-provider-models';
import { ProviderId } from '@/lib/llm/providers/types';
import { getAllProviders, getProvider } from '@/lib/llm/providers/registry';
import { CodexAuthPanel } from '@/components/settings/codex-auth-panel';
import { HFAuthPanel } from '@/components/settings/hf-auth-panel';
import { ConnectionBadge } from '@/components/settings/connection-badge';
import { checkHFCapabilities } from '@/lib/auth/hf-auth';
import { track } from '@/lib/telemetry';

interface ModelSettingsPanelProps {
  onClose?: () => void;
  onModelChange?: (modelId: string) => void;
  showJudgeModel?: boolean;
  onJudgeModelChange?: (modelId: string) => void;
}

export function ModelSettingsPanel({ onClose, onModelChange, showJudgeModel, onJudgeModelChange }: ModelSettingsPanelProps) {
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>(() =>
    configManager.getSelectedProvider()
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [validatingKey, setValidatingKey] = useState(false);
  const [keyValid, setKeyValid] = useState<boolean | null>(null);
  const [currentApiKey, setCurrentApiKey] = useState('');
  const [apiKeyStored, setApiKeyStored] = useState(() => {
    const p = configManager.getSelectedProvider();
    return getProvider(p).apiKeyRequired ? !!configManager.getProviderApiKey(p) : false;
  });
  const [codexAvailable, setCodexAvailable] = useState(true);
  const [useSeparateChatModel, setUseSeparateChatModel] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`hanzo-app-use-separate-chat-model-${configManager.getSelectedProvider()}`);
      return stored === 'true';
    }
    return false;
  });

  // ONE catalog for the whole panel. The three pickers below choose from the
  // same provider, so they load it once between them rather than three times —
  // each picker used to fetch, cache and default independently.
  const catalog = useProviderModels(selectedProvider);
  const [codeModel, setCodeModel] = useState('');
  const [chatModel, setChatModel] = useState('');
  const [judgeModel, setJudgeModel] = useState('');

  // Each role starts on its own remembered model and falls back to the
  // provider's settled default, so a picker is never blank while a list exists.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setCodeModel(localStorage.getItem(`hanzo-app-code-model-${selectedProvider}`) || '');
    setChatModel(localStorage.getItem(`hanzo-app-chat-model-${selectedProvider}`) || '');
    setJudgeModel('');
  }, [selectedProvider]);

  const has = (id: string) => !!id && catalog.models.some((m) => m.value === id);
  const codeValue = has(codeModel) ? codeModel : catalog.selected;
  const chatValue = has(chatModel) ? chatModel : catalog.selected;
  const judgeValue = has(judgeModel) ? judgeModel : catalog.selected;

  // Reasoning is a property of the model doing the work, so it follows the code
  // model — and only appears for a model that can actually toggle it.
  const reasoningModel = catalog.raw.find((m) => m.id === codeValue);
  const [reasoning, setReasoning] = useState(false);
  useEffect(() => {
    if (codeValue) setReasoning(configManager.getReasoningEnabled(codeValue));
  }, [codeValue]);

  // Check if Codex is available (blocked on HF Spaces — HttpOnly cookies don't work)
  useEffect(() => {
    checkHFCapabilities().then(caps => {
      setCodexAvailable(caps.codexAvailable);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // Update API key when provider changes
    const key = configManager.getProviderApiKey(selectedProvider) || '';
    setCurrentApiKey(key);
    setKeyValid(null); // Reset validation
    const providerCfg = getProvider(selectedProvider);
    setApiKeyStored(providerCfg.apiKeyRequired ? !!key : false);

    // Load separate chat model setting for this provider
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`hanzo-app-use-separate-chat-model-${selectedProvider}`);
      setUseSeparateChatModel(stored === 'true');
    }
  }, [selectedProvider]);

  // Persist separate chat model setting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`hanzo-app-use-separate-chat-model-${selectedProvider}`, String(useSeparateChatModel));
    }
  }, [useSeparateChatModel, selectedProvider]);

  const handleProviderChange = (provider: ProviderId) => {
    setSelectedProvider(provider);
    configManager.setSelectedProvider(provider);
    track('provider_selected', { provider });
  };

  const handleApiKeyChange = (key: string) => {
    setCurrentApiKey(key);
    configManager.setProviderApiKey(selectedProvider, key);
    setKeyValid(null);
    configManager.clearModelCache(selectedProvider);
    window.dispatchEvent(new CustomEvent('apiKeyUpdated', {
      detail: { provider: selectedProvider, hasKey: !!key }
    }));
  };

  const validateApiKey = async () => {
    if (!currentApiKey) {
      toast.error('Please enter an API key');
      return;
    }

    setValidatingKey(true);
    try {
      const isValid = await checkApiKey(currentApiKey, selectedProvider);
      setKeyValid(isValid);
      
      if (isValid) {
        toast.success('API key is valid!');
      } else {
        toast.error('Invalid API key');
      }
    } catch {
      setKeyValid(false);
      toast.error('Failed to validate API key');
    } finally {
      setValidatingKey(false);
    }
  };

  const handleConnect = async () => {
    const key = currentApiKey.trim();
    if (!key) {
      toast.error('Please enter an API key');
      return;
    }
    setValidatingKey(true);
    try {
      const isValid = await checkApiKey(key, selectedProvider);
      if (isValid) {
        configManager.setProviderApiKey(selectedProvider, key);
        configManager.clearModelCache(selectedProvider);
        setApiKeyStored(true);
        setCurrentApiKey('');
        setKeyValid(null);
        toast.success('API key connected!');
        window.dispatchEvent(new CustomEvent('apiKeyUpdated', {
          detail: { provider: selectedProvider, hasKey: true }
        }));
      } else {
        toast.error('Invalid API key. Please check and try again.');
      }
    } catch {
      toast.error('Failed to validate API key');
    } finally {
      setValidatingKey(false);
    }
  };

  const handleApiKeyDisconnect = () => {
    configManager.setProviderApiKey(selectedProvider, '');
    configManager.clearModelCache(selectedProvider);
    setApiKeyStored(false);
    setCurrentApiKey('');
    setKeyValid(null);
    toast.success(`Disconnected from ${getProvider(selectedProvider).name}`);
    window.dispatchEvent(new CustomEvent('apiKeyUpdated', {
      detail: { provider: selectedProvider, hasKey: false }
    }));
  };

  const providerConfig = getProvider(selectedProvider);

  return (
    <YStack flex={1} minHeight={0} overflow="hidden">
      {/* Header */}
      <YStack flexShrink={0}>
        <H3 fontWeight="500" fontSize="$4" letterSpacing={-0.4}>Model Settings</H3>
        <Paragraph color="$color11" fontSize="$1" marginTop="$1">
          Configure your AI model and API connection
        </Paragraph>
      </YStack>

      {/* Scrollable content */}
      <YStack flex={1} minHeight={0} marginTop="$4.5" rowGap="$4.5" overflow="scroll">

      {/* Provider Selection */}
      <div>
        <Label htmlFor="provider" fontSize="$1" fontWeight="500" color="$color11">Provider</Label>
        <Select value={selectedProvider} onValueChange={handleProviderChange}>
          <SelectTrigger id="provider" marginTop="$2" height="fit-content" width="100%">
            <SelectValue placeholder="Select a provider">
              {selectedProvider && (
                <YStack>
                  <SizableText fontWeight="500">{providerConfig.name}</SizableText>
                  <SizableText fontSize="$1" color="$color11">
                    {providerConfig.description}
                  </SizableText>
                </YStack>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {getAllProviders()
              .filter(p => codexAvailable || p.id !== 'openai-codex')
              .map(provider => (
              <SelectItem key={provider.id} value={provider.id} paddingVertical="$2.5">
                <YStack>
                  <SizableText fontWeight="500">{provider.name}</SizableText>
                  <SizableText fontSize="$1" color="$color11">
                    {provider.description}
                  </SizableText>
                </YStack>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Auth: OAuth panel for Codex/HF, API key for others */}
      {providerConfig.usesOAuth ? (
        selectedProvider === 'huggingface' ? (
          <HFAuthPanel onAuthChange={() => {
            window.dispatchEvent(new CustomEvent('apiKeyUpdated', {
              detail: { provider: selectedProvider, hasKey: !!configManager.getProviderApiKey(selectedProvider) }
            }));
          }} />
        ) : (
          <CodexAuthPanel onAuthChange={() => {
            window.dispatchEvent(new CustomEvent('apiKeyUpdated', {
              detail: { provider: selectedProvider, hasKey: !!configManager.getProviderApiKey(selectedProvider) }
            }));
          }} />
        )
      ) : providerConfig.apiKeyRequired ? (
        apiKeyStored ? (
          <ConnectionBadge
            method="API Key"
            extra={(() => { const k = configManager.getProviderApiKey(selectedProvider); return k ? `···${k.slice(-4)}` : undefined; })()}
            info={providerConfig.apiKeyHelpUrl && (
              <Anchor
                href={providerConfig.apiKeyHelpUrl}
                target="_blank"
                rel="noopener noreferrer"
                color="$color12" alignItems="center" gap="$0.5" hoverStyle={{ textDecorationLine: "underline" }}
              >
                Manage on {providerConfig.name} <ExternalLink size={10} />
              </Anchor>
            )}
            onDisconnect={handleApiKeyDisconnect}
  />
        ) : (
          <div>
            <Label htmlFor="api-key">{providerConfig.name} API Key</Label>
            <XStack gap="$2" marginTop="$2">
              <YStack position="relative" flex={1}>
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  value={currentApiKey}
                  onChange={(e) => { setCurrentApiKey(e.target.value); setKeyValid(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && currentApiKey.trim()) handleConnect(); }}
                  placeholder={providerConfig.apiKeyPlaceholder || 'API Key'}
                  paddingRight="$7"
                  data-tour-id="provider-key-input"
                  disabled={validatingKey}
  />
                <Button
                  size="icon"
                  variant="ghost"
                  position="absolute" right="$1" top="$1" height={28} width={28}
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </Button>
              </YStack>
              <Button
                onClick={handleConnect}
                disabled={validatingKey || !currentApiKey.trim()}
                size="sm"
              >
                {validatingKey ? (
                  <>
                    <Loader2 size={12} />
                    Connecting...
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
            </XStack>
            {providerConfig.apiKeyHelpUrl && (
              <Paragraph fontSize="$3" color="$color11" marginTop="$2">
                Get your API key from{' '}
                <Anchor
                  href={providerConfig.apiKeyHelpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="$color12" alignItems="center" gap="$1" hoverStyle={{ textDecorationLine: "underline" }}
                >
                  {providerConfig.name} <ExternalLink size={12} />
                </Anchor>
              </Paragraph>
            )}
          </div>
        )
      ) : providerConfig.isLocal ? (
        <div>
          <Label htmlFor="api-key">
            {providerConfig.name} API Key
            <SizableText color="$color11" fontSize="$1" marginLeft="$1">(optional)</SizableText>
          </Label>
          <XStack gap="$2" marginTop="$2">
            <YStack position="relative" flex={1}>
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value={currentApiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder={providerConfig.apiKeyPlaceholder || 'API Key'}
                paddingRight="$7"
                data-tour-id="provider-key-input"
  />
              <Button
                size="icon"
                variant="ghost"
                position="absolute" right="$1" top="$1" height={28} width={28}
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </Button>
            </YStack>
            <Button
              onClick={validateApiKey}
              disabled={validatingKey || !currentApiKey}
              size="sm"
            >
              {validatingKey ? 'Validating...' : 'Validate'}
            </Button>
            {keyValid !== null && (
              <XStack alignItems="center">
                {keyValid ? (
                  <Check size={20} />
                ) : (
                  <X size={20} />
                )}
              </XStack>
            )}
          </XStack>
          <Paragraph fontSize="$3" color="$color11" marginTop="$2">
            API key is optional for {providerConfig.name}. Only needed if you&apos;ve configured authentication on your local server.
          </Paragraph>
        </div>
      ) : null}

      {!providerConfig.apiKeyRequired && providerConfig.isLocal && (
        <YStack padding="$3" borderWidth={1} borderRadius="$3" backgroundColor="$color3">
          <Paragraph fontSize="$3" color="$color11" fontWeight="500" marginBottom="$1">Local Provider</Paragraph>
          <Paragraph fontSize="$3" color="$color11">Make sure {providerConfig.name} is running on your machine.</Paragraph>
          <Paragraph fontSize="$3" color="$color11">Default endpoint: <SizableText fontSize="$1">{providerConfig.baseUrl}</SizableText></Paragraph>
          {selectedProvider === 'lmstudio' && (
            <YStack marginTop="$2">
              <Paragraph fontSize="$1" color="$color11" fontWeight="500">For tool use support:</Paragraph>
              <Paragraph fontSize="$1" color="$color11">• Load a model like qwen/qwen3-4b-thinking-2507</Paragraph>
              <Paragraph fontSize="$1" color="$color11">• Start the local server in LM Studio</Paragraph>
              <Paragraph fontSize="$1" color="$color11">• Models will be automatically discovered</Paragraph>
            </YStack>
          )}
        </YStack>
      )}

      {/* Divider */}
      <Separator borderColor="$borderColor" />

      {/* Code Model */}
      <div>
        <Label fontSize="$1" fontWeight="500" color="$color11">Code Model</Label>
        <YStack marginTop="$2">
          <ModelSelector
            models={catalog.models}
            value={codeValue}
            mode="inline"
            disabled={catalog.loading}
            onChange={(modelId) => {
              setCodeModel(modelId);
              catalog.select(modelId);
              if (typeof window !== 'undefined') {
                localStorage.setItem(`hanzo-app-code-model-${selectedProvider}`, modelId);
              }
              if (!useSeparateChatModel) {
                onModelChange?.(modelId);
              }
            }}
  />
        </YStack>
      </div>

      {/* Reasoning — only for a model that can toggle it. */}
      {reasoningModel?.supportsReasoning && (
        <XStack alignItems="center" justifyContent="space-between" gap="$2" padding="$2" borderRadius="$3" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor">
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
            checked={reasoning}
            onCheckedChange={(enabled) => {
              setReasoning(enabled);
              configManager.setReasoningEnabled(codeValue, enabled);
            }}
  />
        </XStack>
      )}

      {/* Separate Chat Model Toggle — hidden in judge mode */}
      {!showJudgeModel && (
        <XStack alignItems="center" justifyContent="space-between" gap="$3">
          <div>
            <YStack><SizableText fontSize="$3" fontWeight="500">Use different model for chat</SizableText></YStack>
            <Paragraph fontSize="$1" color="$color11" marginTop="$0.5">
              Select a separate (usually cheaper) model for chat/planning
            </Paragraph>
          </div>
          <Switch
            id="separate-chat-model"
            checked={useSeparateChatModel}
            onCheckedChange={(checked) => setUseSeparateChatModel(checked)}
  />
        </XStack>
      )}

      {/* Chat Model (conditional) — hidden in judge mode */}
      {!showJudgeModel && useSeparateChatModel && (
        <div>
          <Label fontSize="$1" fontWeight="500" color="$color11">Chat Model</Label>
          <YStack marginTop="$2">
            <ModelSelector
              models={catalog.models}
              value={chatValue}
              mode="inline"
              disabled={catalog.loading}
              onChange={(modelId) => {
                setChatModel(modelId);
                if (typeof window !== 'undefined') {
                  localStorage.setItem(`hanzo-app-chat-model-${selectedProvider}`, modelId);
                }
                onModelChange?.(modelId);
              }}
    />
          </YStack>
        </div>
      )}

      {/* Judge Model — shown only in benchmark mode */}
      {showJudgeModel && (
        <>
          <Separator borderColor="$borderColor" />
          <div>
            <Label fontSize="$1" fontWeight="500" color="$color11">
              Judge Model <SizableText textTransform="none" fontWeight="400">(optional)</SizableText>
            </Label>
            <Paragraph fontSize="$1" color="$color11" marginTop="$1" marginBottom="$2">
              Separate model for evaluating subjective test criteria
            </Paragraph>
            {/* The judge is a per-run choice, so it is deliberately NOT written
                back as the provider's model the way the code picker is. */}
            <ModelSelector
              models={catalog.models}
              value={judgeValue}
              mode="inline"
              disabled={catalog.loading}
              onChange={(modelId) => {
                setJudgeModel(modelId);
                onJudgeModelChange?.(modelId);
              }}
    />
          </div>
        </>
      )}

      </YStack>{/* end scrollable content */}

      {/* Footer */}
      {onClose && (
        <XStack flexShrink={0} justifyContent="flex-end" paddingTop="$4" borderTopWidth={1} marginTop="$4">
          <Button onClick={onClose} size="sm">
            Done
          </Button>
        </XStack>
      )}
    </YStack>
  );
}
