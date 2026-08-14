"use client";

import { LoadingScreen } from "@/components/ui/loading-screen";
/**
 * Organization settings — the proper home for the org's identity mark (moved
 * OUT of the OrgSwitcher dropdown, which stays a switcher). Shows the current
 * org and an emoji picker that live-previews via <OrgMark> and persists via
 * the shared `lib/avatar` override (localStorage) until IAM carries a real org
 * `logo` through `/v1/orgs`. Monochrome; matches the dashboard chrome.
 */
import { Label, Input } from '@hanzo/ui';
import { XStack, YStack, Paragraph, SizableText } from '@hanzo/ui';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { panel } from "@/lib/chrome";
import { OrgMark } from "@hanzo/ui/product";
import { useOrg } from "@/lib/org/client";
import { currentOrg, display, orgDisplayName } from "@/lib/org-scope";
import { readOrgLogoOverride, setOrgLogoOverride, isEmoji } from "@/lib/avatar";
import { useUser } from "@/hooks/useUser";
import { Spinner } from "@/components/ui/spinner";

function OrganizationSettingsInner() {
  const { ctx, loading } = useOrg();

  // The effective org (mirrors OrgSwitcher): a localStorage scope override wins,
  // else the server's current org.
  const currentId = currentOrg() || ctx?.currentOrg || "";
  const org = ctx?.orgs.find((o) => o.name === currentId);
  const name = orgDisplayName(ctx?.orgs ?? [], currentId) || "…";
  const serverLogo = org?.logo;

  // The client-side emoji override (localStorage) — the value of the picker.
  // Seeded from storage when the scope changes; OrgMark reads the same
  // override FIRST, so the preview updates the moment a valid emoji is set.
  const [emoji, setEmoji] = useState("");
  useEffect(() => setEmoji(readOrgLogoOverride(currentId)), [currentId]);

  if (loading) {
    return (
      <XStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
        <Spinner size={32} />
      </XStack>
    );
  }

  return (
        <YStack {...panel} padding="$5">
          {/* Current org — avatar live-previews the picked emoji. */}
          <XStack alignItems="center" gap="$4">
            <OrgMark org={display({ name: currentId, logo: serverLogo })} size={48} />
            <YStack minWidth={0}>
              <SizableText numberOfLines={1} fontWeight="500" color="$color">{name}</SizableText>
              {currentId && (
                <SizableText numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color11">{currentId}</SizableText>
              )}
            </YStack>
          </XStack>

          {/* Emoji picker — persists to the shared override. */}
          <YStack marginTop="$5">
            <Label htmlFor="org-emoji" marginBottom="$2" fontSize="$3" fontWeight="500" color="$color">
              Emoji
            </Label>
            <XStack alignItems="center" gap="$3">
              <Input
                id="org-emoji"
                value={emoji}
                onChange={(e) => {
                  const v = e.target.value.slice(0, 4);
                  setEmoji(v);
                  // Persist only a real emoji (or a clear) — never garbage.
                  if (!v || isEmoji(v)) setOrgLogoOverride(currentId, v);
                }}
                placeholder="⚡"
                maxLength={4}
                aria-label={`Set an emoji for ${name}`}
                disabled={!currentId}
                width="$10" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="transparent" paddingHorizontal="$2" paddingVertical="$2" textAlign="center" fontSize="$6" outlineWidth={0} focusStyle={{ borderColor: "$color" }} disabledStyle={{ opacity: 0.4 }}
  />
              <Paragraph fontSize="$1" color="$color11">
                Pick a single emoji to represent the org. Leave empty to fall back to the
                org&apos;s initial.
              </Paragraph>
            </XStack>
          </YStack>

          <Paragraph marginTop="$5" borderTopWidth={1} borderColor="$borderColor" paddingTop="$4" fontSize="$1" lineHeight="1.625" color="$color11">
            An uploaded image logo will be supported once Hanzo IAM carries it for your
            organization. Until then, this emoji is stored on this device.
          </Paragraph>
        </YStack>
  );
}

export default function OrganizationSettingsPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <LoadingScreen>{loading ? "Loading settings…" : "Taking you to sign in…"}</LoadingScreen>
    );
  }

  // No OrgProvider here: AppShell already scopes the whole shell to ONE, and a
  // nested second one gave the sidebar's switcher and this page separate copies
  // of the same org state.
  return (
    <AppShell
      currentView="settings"
      title="Organization"
      subtitle="How your organization appears across Hanzo"
    >
      <OrganizationSettingsInner />
    </AppShell>
  );
}
