'use client';

/**
 * OrgGate — an org must exist before anything is built in it.
 *
 * A zero-org user gets onboarding (a personal workspace by default) BEFORE the
 * builder, so a project is never created org-less; and a normal user is
 * hard-pinned to their home org, which resets a stale switched scope to match
 * the server — it pins them to their bearer `owner` regardless of what the
 * client asked for.
 *
 * This is a GATE, not a switcher. It used to share a file with one, which is why
 * it is worth saying: `OrgSwitcher` chooses among orgs the user already has, and
 * comes from `@hanzo/ui/product`. This decides whether they have one at all, and
 * that decision is hanzo.app's own — it is bound to this app's onboarding route.
 */
import { XStack, YStack, Paragraph, SizableText, H1 } from '@hanzo/ui';
import { Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button, Input } from '@hanzo/ui';

import { useOrg } from '@/lib/org/client';
import { currentOrg, setCurrentOrg, getHomeOrg, isScopedAway } from '@/lib/org-scope';
import { Spinner } from '@/components/ui/spinner';

export function OrgGate({ children }: { children: React.ReactNode }) {
  const { ctx, loading } = useOrg();

  // Hard-pin a non-global-admin to their home org (reset a stale switched scope),
  // matching the server which pins them to their bearer owner. The reload is
  // guarded on `currentOrg() !== owner`, so it never loops.
  useEffect(() => {
    if (!ctx || !ctx.homeOrg) return;
    if (!ctx.isSuperAdmin && isScopedAway()) {
      setCurrentOrg(ctx.homeOrg);
      if (typeof window !== 'undefined' && currentOrg() !== getHomeOrg()) window.location.reload();
    }
  }, [ctx]);

  if (loading) {
    return (
      <XStack alignItems="center" justifyContent="center" paddingVertical="$12">
        <Spinner size={32} />
      </XStack>
    );
  }

  if (!ctx) return <>{children}</>; // signed out — caller's auth handles it
  if (ctx.needsOnboarding) return <OnboardingPanel />;
  return <>{children}</>;
}

/** First-run onboarding: create a personal org (personal billing) to start. */
function OnboardingPanel() {
  const { createOrg } = useOrg();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState<'personal' | 'named' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (opts: { name?: string; personal?: boolean }) => {
    setBusy(opts.personal ? 'personal' : 'named');
    setError(null);
    try {
      await createOrg(opts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create organization');
      setBusy(null);
    }
  };

  return (
    <YStack alignSelf="center" maxWidth={448} paddingHorizontal="$4" paddingVertical="$10">
      <XStack alignSelf="center" marginBottom="$5" height="$9" width="$9" alignItems="center" justifyContent="center" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3">
        <Sparkles size={28} />
      </XStack>
      <H1 marginBottom="$2" fontSize="$8" fontWeight="500" textAlign="center">Set up your workspace</H1>
      <Paragraph marginBottom="$6" fontSize="$3" color="$color11" textAlign="center">
        Every project belongs to an organization — that&apos;s where it&apos;s billed and
        shared. Start with a personal workspace, or name a team organization.
      </Paragraph>

      <Button width="100%" onClick={() => run({ personal: true })} disabled={busy !== null}>
        {busy === 'personal' ? <Spinner size={16} /> : 'Continue with a personal workspace'}
      </Button>

      <SizableText marginVertical="$4" textAlign="center" fontSize="$1" letterSpacing={0.4} color="$color11">or</SizableText>

      <Input
        value={name}
        onChangeText={(t) => setName(t.slice(0, 60))}
        placeholder="Team organization name"
        marginBottom="$2" width="100%" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="transparent" paddingHorizontal="$3" paddingVertical="$2" fontSize="$3" outlineWidth={0} focusStyle={{ borderColor: "$color8" }}
        disabled={busy !== null}
      />
      <Button
        variant="outline"
        width="100%"
        onClick={() => run({ name: name.trim() })}
        disabled={busy !== null || name.trim().length < 2}
      >
        {busy === 'named' ? <Spinner size={16} /> : 'Create team organization'}
      </Button>

      {error && <Paragraph marginTop="$4" fontSize="$3" color="$red8" textAlign="center">{error}</Paragraph>}
    </YStack>
  );
}
