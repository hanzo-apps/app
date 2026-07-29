'use client';

/**
 * OrgSwitcher + OrgGate — this app's render of the shared org-switcher contract.
 * The CANONICAL component is `OrgSwitcher` in `@hanzo/ui@8` (`@hanzo/gui`-based,
 * hoisted per hanzoai/ui#36); this stays a LOCAL Tailwind/Radix render (recorded
 * debt) because `@hanzo/ui` here is aliased to `@hanzo/ui-shadcn` and the
 * identity bar needs `direction="up"` + the personal badge/settings affordances
 * the hoisted popover doesn't carry. The LOGIC (`lib/org-scope.ts`) matches the
 * hoisted `orgScope` contract.
 *
 * OrgSwitcher: shows the org the builder is scoped to, filters the orgs the user
 * can see, switches IN PLACE (`switchOrg` persists + reloads so every module
 * refetches under the new X-Org-Id), and CREATEs a new org (→ `/onboard`). The org
 * list comes from `/v1/orgs` (a normal user sees their own org; a global admin
 * sees the switchable set) — never fabricated.
 *
 * OrgGate: a zero-org user is sent to onboarding (personal workspace default)
 * BEFORE building — a project is never created org-less; and a normal user is
 * hard-pinned to their home org (a stale switched scope is reset), matching the
 * server which pins them to their bearer owner.
 */
import { Image, SizableText, YStack, Paragraph, XStack, H1 } from '@hanzo/gui';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Check, ChevronsUpDown, Loader2, Plus, Search, Settings, Sparkles } from 'lucide-react';
import { Button, Input } from '@hanzo/ui';

import { useOrg } from '@/lib/org/client';
import { currentOrg, switchOrg, filterOrgs, isScopedAway, setCurrentOrg, getHomeOrg, orgDisplayName, titleCase } from '@/lib/org-scope';
import type { Org } from '@/lib/org/types';
import { resolveOrgLogo, isEmoji, isImageUrl } from '@/lib/avatar';

/**
 * The org's identity mark for the chrome. Renders, in priority (see
 * `resolveOrgLogo`): (a) an image if the resolved logo is a URL; (b) an emoji if
 * it's a short emoji string (full color — monochrome-safe); (c) the org's
 * initial in a neutral rounded square. `logo` is the server-supplied mark (from
 * `/v1/orgs`); a client-side override / known-default is layered on top of it.
 * ONE avatar, reused by the switcher AND the account menu.
 */
export function OrgAvatar({
  name,
  logo,
  className = "h-5 w-5 text-[11px]",
}: {
  name: string;
  logo?: string;
  className?: string;
}) {
  const resolved = resolveOrgLogo(name, logo);
  const [imgError, setImgError] = useState(false);
  // Reset the image-failed flag when the mark changes (list rows reuse instances).
  useEffect(() => setImgError(false), [resolved]);

  // (a) image logo — a rounded, cover-fit <img>; on load failure fall through.
  if (resolved && isImageUrl(resolved) && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote org logo, not a bundled asset
      <Image
        src={resolved}
        alt=""
        aria-hidden="true"
        onError={() => setImgError(true)}
        flexShrink={0} borderRadius="$3" borderWidth={1} borderColor="$borderColor" objectFit="cover" className={`${className}`}
  />
    );
  }
  // (b) emoji logo — centered + a touch larger, in full color. The glyph carries
  //     the color; the box stays borderless here (inline size beats the class).
  if (resolved && isEmoji(resolved)) {
    return (
      <SizableText
        flexShrink={0} alignItems="center" justifyContent="center" lineHeight={1} className={`${className}`}
        style={{ fontSize: "1.05rem" }}
        aria-hidden="true"
      >
        {resolved}
      </SizableText>
    );
  }
  // (c) fallback — the org's initial in a neutral rounded square (monochrome).
  const initial = (name || "").trim().charAt(0).toUpperCase() || "•";
  return (
    <SizableText
      flexShrink={0} alignItems="center" justifyContent="center" borderRadius="$3" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" fontWeight="600" color="$color" className={`${className}`}
      aria-hidden="true"
    >
      {initial}
    </SizableText>
  );
}

/** The org selector for the builder/dashboard chrome. */
export function OrgSwitcher({ direction = "down" }: { direction?: "up" | "down" } = {}) {
  const { ctx, loading, createOrg } = useOrg();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const currentId = currentOrg() || ctx?.currentOrg || '';

  // Always include the current org so the switcher is meaningful even when the
  // list is a single entry (a normal user). Same shape as console2.
  const allOrgs = useMemo<Org[]>(() => {
    const orgs = ctx?.orgs ?? [];
    if (currentId && !orgs.some((o) => o.name === currentId)) {
      return [{ name: currentId, displayName: titleCase(currentId), isPersonal: false }, ...orgs];
    }
    return orgs;
  }, [ctx, currentId]);

  const currentName = orgDisplayName(allOrgs, currentId) || '…';
  const currentLogo = allOrgs.find((o) => o.name === currentId)?.logo;
  const filtered = useMemo(() => filterOrgs(allOrgs, query), [allOrgs, query]);

  const select = (org: Org) => {
    setOpen(false);
    switchOrg(org.name); // persists + reloads
  };

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    setErr(null);
    try {
      // createOrg switches into an additional org (or re-auths a zero-org user).
      await createOrg({ name });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create the organization.');
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <SizableText alignItems="center" gap="$2" borderRadius="$5" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$3" paddingVertical="$1.5" fontSize="$3" color="$color11" display="flex" flexDirection="row">
        <Building2 size={16} />
        <SizableText display="none">…</SizableText>
      </SizableText>
    );
  }
  if (!ctx) return null; // signed out — no org chrome

  return (
    <YStack position="relative">
      <Button
        onClick={() => setOpen((o) => !o)}
        alignItems="center" gap="$2" borderRadius="$5" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$3" paddingVertical="$1.5" fontSize="$3" color="$color" hoverStyle={{ backgroundColor: "$color3" }}
        title="Active organization"
      >
        <OrgAvatar name={currentName} logo={currentLogo} />
        <SizableText maxWidth="7.5rem" numberOfLines={1} fontWeight="500" color="$color">{currentName}</SizableText>
        {isScopedAway() && <SizableText borderRadius="$2" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$1" fontSize={10} color="$color11">scoped</SizableText>}
        <ChevronsUpDown size={14} color="$color11" />
      </Button>

      {open && (
        <>
          <YStack position="fixed" top={0} right={0} bottom={0} left={0} zIndex={40} onClick={() => setOpen(false)} />
          <YStack
            position="absolute" left="$0" zIndex={50} width={288} borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$2" elevation={6} {...{ bottom: direction === "up" ? "100%" : undefined, marginBottom: direction === "up" ? "$2" : undefined, marginTop: direction === "up" ? undefined : "$2" }}
          >
            {creating ? (
              <YStack rowGap="$2">
                <Paragraph fontSize="$3" fontWeight="500" color="$color">Create organization</Paragraph>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value.slice(0, 60))}
                  placeholder="Organization name"
                  width="100%" borderRadius="$3" borderWidth={1} borderColor="$borderColor" backgroundColor="transparent" paddingHorizontal="$2" paddingVertical="$1.5" fontSize="$3" outlineWidth={0} focusStyle={{ borderColor: "$color8" }}
                  onKeyDown={(e) => e.key === 'Enter' && void create()}
                  disabled={busy}
  />
                {err && <Paragraph fontSize="$1" color="$red8">{err}</Paragraph>}
                <XStack justifyContent="flex-end" gap="$2">
                  <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setErr(null); }} disabled={busy}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => void create()} disabled={busy || !newName.trim()}>
                    {busy ? <Loader2 size={16} /> : 'Create'}
                  </Button>
                </XStack>
              </YStack>
            ) : (
              <YStack rowGap="$1">
                <XStack alignItems="center" gap="$2" borderRadius="$3" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$2" paddingVertical="$1">
                  <Search size={14} color="$color11" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter organizations…"
                    flex={1} backgroundColor="transparent" fontSize="$3" outlineWidth={0} placeholderTextColor="$color11"
  />
                </XStack>
                <Paragraph paddingHorizontal="$2" paddingVertical="$1" fontSize={10} fontWeight="500" textTransform="uppercase" letterSpacing={0.4} color="$color11">
                  Organizations · {allOrgs.length}
                </Paragraph>
                <YStack maxHeight={256} overflow="scroll">
                  {filtered.length === 0 ? (
                    <Paragraph paddingHorizontal="$2" paddingVertical="$2" fontSize="$3" color="$color11">No organizations match &quot;{query}&quot;.</Paragraph>
                  ) : (
                    filtered.map((org) => {
                      const isCurrent = org.name === currentId;
                      return (
                        <Button
                          key={org.name}
                          onClick={() => select(org)}
                          width="100%" alignItems="center" gap="$2" borderRadius="$3" paddingHorizontal="$2" paddingVertical="$2" fontSize="$3" {...{ backgroundColor: isCurrent ? "$color3" : undefined, hoverStyle: isCurrent ? undefined : {"backgroundColor":"$color3"} }}
                        >
                          <OrgAvatar name={orgDisplayName(allOrgs, org.name)} logo={org.logo} />
                          <SizableText flex={1} numberOfLines={1} textAlign="left" color="$color">
                            {orgDisplayName(allOrgs, org.name)}
                          </SizableText>
                          {org.isPersonal && (
                            <SizableText borderRadius="$2" backgroundColor="$color3" paddingHorizontal="$1.5" paddingVertical="$0.5" fontSize={10} color="$color11">personal</SizableText>
                          )}
                          {isCurrent && <Check size={16} color="$color" />}
                        </Button>
                      );
                    })
                  )}
                </YStack>
                {/* The org's avatar/emoji picker lives on its own settings page
                    now (the switcher stays a switcher). */}
                <Link
                  href="/settings/organization"
                  onClick={() => setOpen(false)}
                ><SizableText marginTop="$1" width="100%" alignItems="center" gap="$2" borderRadius="$3" borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$2" paddingVertical="$2" fontSize="$3" color="$color" hoverStyle={{ backgroundColor: "$color3" }}>
                  <Settings size={16} />
                  Organization settings
                  <SizableText marginLeft="auto" color="$color11">→</SizableText>
                </SizableText></Link>
                <Button
                  onClick={() => { setCreating(true); setErr(null); }}
                  marginTop="$1" width="100%" alignItems="center" gap="$2" borderRadius="$3" borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$2" paddingVertical="$2" fontSize="$3" color="$color" hoverStyle={{ backgroundColor: "$color3" }}
                >
                  <Plus size={16} />
                  Create organization
                </Button>
              </YStack>
            )}
          </YStack>
        </>
      )}
    </YStack>
  );
}

/**
 * Gate that requires an org before rendering children. Mirrors console2's OrgGate:
 * a zero-org user gets onboarding; a signed-in user with an org proceeds, and a
 * stale switched scope is reset for a non-global-admin (they can only build in
 * their own org). While loading it renders a spinner; signed out → children.
 */
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
        <Loader2 size={32} color="$color11" />
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
    <SizableText alignSelf="center" maxWidth={448} paddingHorizontal="$4" paddingVertical="$10" textAlign="center" display="flex" flexDirection="column">
      <XStack alignSelf="center" marginBottom="$5" height="$9" width="$9" alignItems="center" justifyContent="center" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3">
        <Sparkles size={28} color="$color" />
      </XStack>
      <H1 marginBottom="$2" fontSize="$8" fontWeight="500">Set up your workspace</H1>
      <Paragraph marginBottom="$6" fontSize="$3" color="$color11">
        Every project belongs to an organization — that&apos;s where it&apos;s billed and
        shared. Start with a personal workspace, or name a team organization.
      </Paragraph>

      <Button width="100%" onClick={() => run({ personal: true })} disabled={busy !== null}>
        {busy === 'personal' ? <Loader2 size={16} /> : 'Continue with a personal workspace'}
      </Button>

      <SizableText marginVertical="$4" fontSize="$1" textTransform="uppercase" letterSpacing={0.4} color="$color11" display="flex" flexDirection="column">or</SizableText>

      <Input
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 60))}
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
        {busy === 'named' ? <Loader2 size={16} /> : 'Create team organization'}
      </Button>

      {error && <Paragraph marginTop="$4" fontSize="$3" color="$red8">{error}</Paragraph>}
    </SizableText>
  );
}
