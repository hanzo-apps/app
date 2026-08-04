'use client';

import { SizableText, XStack, Paragraph, Anchor, YStack } from '@hanzo/gui';
import { useState, useEffect, useCallback } from 'react';
import { Button, Label, toast, Textarea } from '@hanzo/ui';
import { ExternalLink, Loader2, Terminal, TriangleAlert } from 'lucide-react';
import { ConnectionBadge } from '@/components/settings/connection-badge';
import { configManager } from '@/lib/config/storage';
import { parseCodexAuthJson, connectCodex, disconnectCodex, checkCodexStatus } from '@/lib/auth/codex-auth';

interface CodexAuthPanelProps {
  onAuthChange?: () => void;
}

export function CodexAuthPanel({ onAuthChange }: CodexAuthPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    !!configManager.getCodexAuth()
  );
  const [pasteValue, setPasteValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const auth = configManager.getCodexAuth();

  const dispatchAuthEvent = useCallback((hasKey: boolean) => {
    onAuthChange?.();
    window.dispatchEvent(new CustomEvent('apiKeyUpdated', {
      detail: { provider: 'openai-codex', hasKey }
    }));
  }, [onAuthChange]);

  // Reconcile localStorage vs HttpOnly cookie on mount
  useEffect(() => {
    let cancelled = false;

    async function reconcile() {
      try {
        const hasCookie = await checkCodexStatus();
        if (cancelled) return;

        const localAuth = configManager.getCodexAuth();

        if (localAuth && !hasCookie) {
          // localStorage present but cookie gone (e.g., expired) → stale
          configManager.clearCodexAuth();
          if (!cancelled) {
            setIsAuthenticated(false);
            dispatchAuthEvent(false);
          }
        } else if (!localAuth && hasCookie) {
          // Orphaned cookie, no localStorage → clean up
          await disconnectCodex();
          if (!cancelled) {
            setIsAuthenticated(false);
            dispatchAuthEvent(false);
          }
        }
      } catch {
        // Network error — leave state as-is
      }
    }

    reconcile();
    return () => { cancelled = true; };
  }, [dispatchAuthEvent]);

  const handlePasteToken = async () => {
    setIsLoading(true);
    try {
      const parsed = parseCodexAuthJson(pasteValue);

      // Send to server — stores refresh_token in HttpOnly cookie
      const serverResult = await connectCodex(parsed);

      // Store only non-sensitive fields in localStorage
      configManager.setCodexAuth(serverResult);
      setIsAuthenticated(true);
      setPasteValue('');
      toast.success('Token saved! Tokens will refresh automatically.');
      dispatchAuthEvent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await disconnectCodex();
      configManager.clearModelCache('openai-codex');
      setIsAuthenticated(false);
      toast.success('Disconnected from ChatGPT');
      dispatchAuthEvent(false);
    } catch {
      toast.error('Failed to disconnect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatExpiry = () => {
    if (!auth?.expires_at) return '';
    const diff = auth.expires_at - Math.floor(Date.now() / 1000);
    if (diff <= 0) return 'Expired (will auto-refresh)';
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  const warningBanner = (
    <YStack padding="$2.5" borderWidth={1} borderColor="$yellow3" borderRadius="$3" backgroundColor="$yellow1" rowGap="$1">
      <XStack alignItems="flex-start" gap="$2">
        <TriangleAlert size={14} />
        <div>
          <Paragraph fontSize="$1" color="$yellow11">
            <SizableText fontWeight="500" color="$yellow12">Use at your own risk.</SizableText>{' '}
            This routes requests through an unofficial backend using your ChatGPT session token. Your token is sent to ChatGPT servers but the usage is outside the intended Codex CLI.
          </Paragraph>
          <Paragraph marginTop="$1" fontSize="$1" color="$yellow11">
            OpenAI may restrict or revoke access to this endpoint at any time. For reliable, long-term use consider an{' '}
            <Anchor href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" color="$yellow12" hoverStyle={{ textDecorationLine: "underline" }}>OpenAI API key</Anchor>{' '}
            instead.
          </Paragraph>
        </div>
      </XStack>
    </YStack>
  );

  // --- Authenticated state ---
  if (isAuthenticated && auth) {
    return (
      <YStack rowGap="$3">
        {warningBanner}

        <ConnectionBadge
          method="ChatGPT"
          extra={auth.user_email}
          info={auth.expires_at ? `Expires in ${formatExpiry()}` : undefined}
          onDisconnect={handleDisconnect}
          disconnecting={isLoading}
  />
      </YStack>
    );
  }

  // --- Unauthenticated state ---
  return (
    <YStack rowGap="$3">
      <Label>ChatGPT Authentication</Label>
      <Paragraph fontSize="$1" color="$color11">
        Use your ChatGPT Plus/Pro subscription instead of an API key.
        Tokens refresh automatically once connected.
      </Paragraph>

      {warningBanner}

      <YStack padding="$3" borderWidth={1} borderRadius="$3" backgroundColor="$color3" rowGap="$3">
        <XStack alignItems="center" gap="$2">
          <Terminal size={16} />
          <SizableText fontSize="$3" fontWeight="500">Setup Instructions</SizableText>
        </XStack>

        <YStack rowGap="$2">
          <SizableText fontSize="$1" color="$color11">
            Install the{' '}
            <Anchor display="inline-flex"
              href="https://github.com/openai/codex"
              target="_blank"
              rel="noopener noreferrer"
              color="$color12" alignItems="center" gap="$0.5" hoverStyle={{ textDecorationLine: "underline" }}
            >
              Codex CLI <ExternalLink size={10} />
            </Anchor>
            {': '}
            <SizableText backgroundColor="$color3" paddingHorizontal="$1" borderRadius="$2">npm i -g @openai/codex</SizableText>
          </SizableText>
          <SizableText fontSize="$1" color="$color11">
            Run <SizableText backgroundColor="$color3" paddingHorizontal="$1" borderRadius="$2">codex login</SizableText> and follow the browser prompts
          </SizableText>
          <SizableText fontSize="$1" color="$color11">
            Copy your token by running:<br />
            <SizableText backgroundColor="$color3" paddingHorizontal="$1" borderRadius="$2" userSelect="all">cat ~/.codex/auth.json | pbcopy</SizableText>
            <SizableText color="$color11" marginLeft="$1">(macOS)</SizableText>
            <br />
            <SizableText backgroundColor="$color3" paddingHorizontal="$1" borderRadius="$2" userSelect="all">cat ~/.codex/auth.json | xclip -sel c</SizableText>
            <SizableText color="$color11" marginLeft="$1">(Linux)</SizableText>
          </SizableText>
          <SizableText fontSize="$1" color="$color11">
            Paste below with <SizableText backgroundColor="$color3" paddingHorizontal="$1" borderRadius="$2">Cmd+V</SizableText> / <SizableText backgroundColor="$color3" paddingHorizontal="$1" borderRadius="$2">Ctrl+V</SizableText>
          </SizableText>
        </YStack>
      </YStack>

      <YStack rowGap="$2">
        <Label htmlFor="codex-token" fontSize="$1">Auth Token JSON</Label>
        <Textarea
          id="codex-token"
          width="100%" height="$12" fontSize="$1" fontFamily="$mono" padding="$2" borderRadius="$3" borderWidth={1} backgroundColor="$background" className="resize-none"
          placeholder={'{\n  "access_token": "ey...",\n  "refresh_token": "v1.ey...",\n  "expires_at": 1234567890\n}'}
          value={pasteValue}
          onChange={(e) => setPasteValue(e.target.value)}
  />
        <Button
          size="sm"
          onClick={handlePasteToken}
          disabled={!pasteValue.trim() || isLoading}
        >
          {isLoading && <Loader2 size={12} />}
          Save Token
        </Button>
      </YStack>
    </YStack>
  );
}
