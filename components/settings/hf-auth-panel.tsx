'use client';

import { YStack, Anchor, Paragraph, XStack, SizableText } from '@hanzo/gui';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Input, Label, toast } from '@hanzo/ui';
import { ExternalLink, Eye, EyeOff } from 'lucide-react';
import { ConnectionBadge } from '@/components/settings/connection-badge';
import { configManager } from '@/lib/config/storage';
import { validateApiKey } from '@/lib/llm/llm-client';
import { checkHFCapabilities, loginHF } from '@/lib/auth/hf-auth';
import type { HFCapabilities } from '@/lib/auth/hf-auth';
import { Spinner } from '@/components/ui/spinner';

interface HFAuthPanelProps {
  onAuthChange?: () => void;
}

export function HFAuthPanel({ onAuthChange }: HFAuthPanelProps) {
  const [oauthAvailable, setOauthAvailable] = useState(false);
  const [oauthUsername, setOauthUsername] = useState<string>();
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(() => !!configManager.getHFAuth());
  const capabilitiesRef = useRef<HFCapabilities | null>(null);

  const dispatchAuthEvent = useCallback((hasKey: boolean) => {
    onAuthChange?.();
    window.dispatchEvent(new CustomEvent('apiKeyUpdated', {
      detail: { provider: 'huggingface', hasKey }
    }));
  }, [onAuthChange]);

  // Check OAuth capabilities on mount, sync stored auth state
  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Check stored auth (may have been set by app-level OAuth handler)
      const hfAuth = configManager.getHFAuth();
      if (hfAuth) {
        setIsConnected(true);
        if (hfAuth.username) setOauthUsername(hfAuth.username);
      }

      // Fetch capabilities
      try {
        const capabilities = await checkHFCapabilities();
        if (cancelled) return;
        capabilitiesRef.current = capabilities;
        setOauthAvailable(capabilities.oauthAvailable);
      } catch {
        // Network error — leave state as-is
      }
    }

    init();

    // Listen for auth changes from app-level OAuth handler
    const handleAuthUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.provider === 'huggingface') {
        const hfAuth = configManager.getHFAuth();
        setIsConnected(detail.hasKey);
        if (hfAuth?.username) setOauthUsername(hfAuth.username);
      }
    };
    window.addEventListener('apiKeyUpdated', handleAuthUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener('apiKeyUpdated', handleAuthUpdate);
    };
  }, []);

  const handleOAuthLogin = async () => {
    // Fetch capabilities if we don't have them yet
    let caps = capabilitiesRef.current;
    if (!caps) {
      try {
        caps = await checkHFCapabilities();
        capabilitiesRef.current = caps;
      } catch {
        toast.error('Failed to connect. Please try again.');
        return;
      }
    }

    if (!caps.clientId) {
      toast.error('OAuth is not configured on this instance.');
      return;
    }

    await loginHF(caps.clientId, caps.scopes);
  };

  const handleConnect = async () => {
    const key = tokenInput.trim();
    if (!key) {
      toast.error('Please enter an access token');
      return;
    }
    setIsConnecting(true);
    try {
      const isValid = await validateApiKey(key, 'huggingface');
      if (isValid) {
        configManager.setHFAuth({ access_token: key });
        setIsConnected(true);
        setTokenInput('');
        toast.success('Connected to HuggingFace');
        dispatchAuthEvent(true);
      } else {
        toast.error('Invalid token. Check that it has "Inference Providers" permission.');
      }
    } catch {
      toast.error('Failed to validate token. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsLoading(true);
    try {
      configManager.clearHFAuth();
      configManager.clearModelCache('huggingface');
      setIsConnected(false);
      setOauthUsername(undefined);
      setTokenInput('');
      toast.success('Disconnected from HuggingFace');
      dispatchAuthEvent(false);
    } catch {
      toast.error('Failed to disconnect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Connected state (OAuth or validated API key) ---
  if (isConnected) {
    return (
      <YStack rowGap="$3">
        <ConnectionBadge
          method={oauthUsername ? 'OAuth' : 'API Key'}
          extra={oauthUsername}
          info={
            <>
              Free tier: $0.10/month in free inference credits.{' '}
              <Anchor display="inline-flex"
                href="https://huggingface.co/pricing"
                target="_blank"
                rel="noopener noreferrer"
                color="$color12" alignItems="center" gap="$0.5" hoverStyle={{ textDecorationLine: "underline" }}
              >
                Upgrade <ExternalLink size={10} />
              </Anchor>
            </>
          }
          onDisconnect={handleDisconnect}
          disconnecting={isLoading}
  />
      </YStack>
    );
  }

  // --- Unauthenticated state ---
  return (
    <YStack rowGap="$3">
      <Label>HuggingFace Authentication</Label>
      <Paragraph fontSize="$1" color="$color11">
        Use your HuggingFace account for free AI inference ($0.10/month free credits).
      </Paragraph>

      {/* OAuth button — only on HF Spaces */}
      {oauthAvailable && (
        <>
          <Button
            onClick={handleOAuthLogin}
            width="100%" gap="$2"
            variant="outline"
          >
            Sign in with HuggingFace
          </Button>

          <YStack position="relative">
            <XStack position="absolute" top={0} right={0} bottom={0} left={0} alignItems="center">
              <SizableText width="100%" borderTopWidth={1} />
            </XStack>
            <SizableText position="relative" justifyContent="center" fontSize="$1" display="flex" flexDirection="row">
              <SizableText backgroundColor="$background" paddingHorizontal="$2" color="$color11">
                Or use an access token
              </SizableText>
            </SizableText>
          </YStack>
        </>
      )}

      {/* API key input — always available */}
      <div>
        <Label htmlFor="hf-token" fontSize="$1">Access Token</Label>
        <XStack gap="$2" marginTop="$1.5">
          <YStack position="relative" flex={1}>
            <Input
              id="hf-token"
              type={showToken ? 'text' : 'password'}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && tokenInput.trim()) handleConnect(); }}
              placeholder="hf_..."
              paddingRight="$7"
              disabled={isConnecting}
  />
            <Button
              size="icon"
              variant="ghost"
              position="absolute" right="$1" top="$1" height={28} width={28}
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </YStack>
          <Button
            onClick={handleConnect}
            disabled={isConnecting || !tokenInput.trim()}
            size="sm"
          >
            {isConnecting ? (
              <>
                <Spinner size={12} />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </Button>
        </XStack>
      </div>

      <SizableText padding="$3" borderWidth={1} borderRadius="$3" backgroundColor="$color3" fontSize="$1" color="$color11" rowGap="$2" display="flex" flexDirection="column">
        <Paragraph fontWeight="500">How to get an access token:</Paragraph>
        <YStack rowGap="$1">
          <li>
            Go to{' '}
            <Anchor display="inline-flex"
              href="https://huggingface.co/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              color="$color12" alignItems="center" gap="$0.5" hoverStyle={{ textDecorationLine: "underline" }}
            >
              huggingface.co/settings/tokens <ExternalLink size={10} />
            </Anchor>
          </li>
          <li>Create a new token with &quot;Make calls to Inference Providers&quot; permission</li>
          <li>Paste the token above and click Connect</li>
        </YStack>
        {!oauthAvailable && (
          <Paragraph color="$color11" marginTop="$1">
            OAuth sign-in is available when deployed on HuggingFace Spaces.
          </Paragraph>
        )}
      </SizableText>
    </YStack>
  );
}
