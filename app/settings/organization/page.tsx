"use client";

/**
 * Organization settings — the proper home for the org's identity mark (moved
 * OUT of the OrgSwitcher dropdown, which stays a switcher). Shows the current
 * org and an emoji picker that live-previews via <OrgAvatar> and persists via
 * the shared `lib/avatar` override (localStorage) until IAM carries a real org
 * `logo` through `/v1/orgs`. Monochrome; matches the dashboard chrome.
 */
import { Label, Input } from '@hanzo/ui';
import { XStack, YStack, H1, Paragraph, SizableText } from '@hanzo/gui';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { HanzoLogo } from "@/components/HanzoLogo";
import { OrgAvatar } from "@/components/org-switcher";
import { OrgProvider, useOrg } from "@/lib/org/client";
import { currentOrg, orgDisplayName } from "@/lib/org-scope";
import { readOrgLogoOverride, setOrgLogoOverride, isEmoji } from "@/lib/avatar";
import { useUser } from "@/hooks/useUser";

function OrganizationSettingsInner() {
  const { ctx, loading } = useOrg();

  // The effective org (mirrors OrgSwitcher): a localStorage scope override wins,
  // else the server's current org.
  const currentId = currentOrg() || ctx?.currentOrg || "";
  const org = ctx?.orgs.find((o) => o.name === currentId);
  const name = orgDisplayName(ctx?.orgs ?? [], currentId) || "…";
  const serverLogo = org?.logo;

  // The client-side emoji override (localStorage) — the value of the picker.
  // Seeded from storage when the scope changes; OrgAvatar reads the same
  // override FIRST, so the preview updates the moment a valid emoji is set.
  const [emoji, setEmoji] = useState("");
  useEffect(() => setEmoji(readOrgLogoOverride(currentId)), [currentId]);

  if (loading) {
    return (
      <XStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
        <Loader2 size={32} color="$color11" />
      </XStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background" overflow="scroll">
      <YStack alignSelf="center" maxWidth={672} paddingHorizontal="$5" paddingVertical="$7">
        <H1 fontSize="$8" fontWeight="500" color="$color">Organization settings</H1>
        <Paragraph marginTop="$1" fontSize="$3" color="$color11">
          Personalize how {name} appears across Hanzo.
        </Paragraph>

        <YStack marginTop="$6" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" padding="$5">
          {/* Current org — avatar live-previews the picked emoji. */}
          <XStack alignItems="center" gap="$4">
            <OrgAvatar name={name} logo={serverLogo} className="h-12 w-12 text-lg" />
            <YStack minWidth={0}>
              <SizableText numberOfLines={1} fontWeight="500" color="$color" display="flex" flexDirection="column">{name}</SizableText>
              {currentId && (
                <SizableText numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color11" display="flex" flexDirection="column">{currentId}</SizableText>
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

          <Paragraph marginTop="$5" borderTopWidth={1} borderColor="$borderColor" paddingTop="$4" fontSize="$1" lineHeight={1.625} color="$color11">
            An uploaded image logo will be supported once Hanzo IAM carries it for your
            organization. Until then, this emoji is stored on this device.
          </Paragraph>
        </YStack>
      </YStack>
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
      <XStack minHeight="100%" alignItems="center" justifyContent="center" backgroundColor="$background">
        <SizableText textAlign="center" display="flex" flexDirection="column">
          <HanzoLogo className="mx-auto mb-4 h-12 w-12 animate-pulse text-foreground" />
          <Paragraph color="$color11">
            {loading ? "Loading settings..." : "Redirecting to login..."}
          </Paragraph>
        </SizableText>
      </XStack>
    );
  }

  return (
    <AppShell currentView="settings">
      <OrgProvider>
        <OrganizationSettingsInner />
      </OrgProvider>
    </AppShell>
  );
}
