"use client";

import { LoadingScreen } from "@/components/ui/loading-screen";
import { XStack, SizableText, Paragraph, YStack } from '@hanzo/ui';
// `Anchor` is not on @hanzo/ui's barrel yet — the dts build drops it, the
// same way it drops the GuiElement type. Tracked; everything else in this
// file comes from @hanzo/ui.
import { Anchor } from '@hanzo/gui';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Label, Switch, Tabs, TabsList, TabsTrigger, TabsContent } from '@hanzo/ui';
import { useUser } from "@/hooks/useUser";
import { AppShell } from "@/components/app-shell";
import { ModelSelector } from "@/components/model-selector";
import { accent, panel, rows, row, selected } from "@/lib/chrome";
import { ExternalLink } from "lucide-react";
import { configManager } from "@/lib/config/storage";
import { Appearance } from "@hanzo/appearance";
import { useModels } from "@/lib/hooks/use-models";
import { usePlan, unpaid } from "@/lib/billing/entitlements";

export default function SettingsPage() {
  // All hooks must be called unconditionally before any conditional returns
  const { user, loading } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const { models } = useModels();
  const plan = usePlan();
  const [defaultModel, setDefaultModelState] = useState("");
  const [notifs, setNotifs] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setDefaultModelState(configManager.getDefaultModel());
    setNotifs(configManager.getSettings().notifications ?? {});
  }, []);
  // Persist notification prefs client-side (a future notifications service reads them).
  const toggleNotif = (key: string, value: boolean) => {
    const next = { ...notifs, [key]: value };
    setNotifs(next);
    configManager.setSetting("notifications", next);
  };

  // The section names. They were a vertical stack of Buttons styled
  // `secondary`/`ghost` — a third tab treatment, next to the dashboard's and
  // billing's. One treatment now: the same Tabs the dashboard uses.
  const tabs = [
    { id: "general", label: "General" },
    { id: "api-keys", label: "API Keys" },
    { id: "notifications", label: "Notifications" },
    { id: "security", label: "Security" },
    { id: "billing", label: "Billing" },
  ];

  // Use effect for navigation to avoid calling router.push during render
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <LoadingScreen>Loading settings…</LoadingScreen>
    );
  }

  // Show loading state while redirecting
  if (!user) {
    return (
      <LoadingScreen>Taking you to sign in…</LoadingScreen>
    );
  }

  return (
    <AppShell currentView="settings" title="Settings" subtitle="Your preferences for this account">
      <Tabs value={activeTab} onValueChange={setActiveTab} width="100%">
        <XStack marginBottom="$5" flexWrap="wrap" alignItems="center" gap="$3" borderBottomWidth={1} borderColor="$borderColor" paddingBottom="$3">
          <TabsList backgroundColor="transparent" padding="$0">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} {...selected(activeTab === tab.id)}>{tab.label}</TabsTrigger>
            ))}
          </TabsList>
        </XStack>

        {/* Each section's heading is the tab you clicked to get here, so the
            panels no longer repeat it back ("General" → "General Settings"). */}
            <TabsContent value="general">
              <YStack {...panel} padding="$5">
                <YStack rowGap="$5">

                  {/* APPEARANCE — the @hanzo/appearance panel (text size,
                      density, accent), the SAME screen hanzo.chat and the
                      console mount, so "the same product" keeps looking like
                      it. It was built and documented as the shared panel and
                      mounted NOWHERE on this route — the one page called
                      Settings had no appearance settings. Every knob it shows
                      is real: @hanzo/design publishes the ramps these multiply.
                      Still no theme picker beside it: hanzo.app is dark-only,
                      and a Light option would write a preference nothing can
                      honor. */}
                  <YStack rowGap="$2" maxWidth={448}>
                    <Label fontSize="$3" fontWeight="500" color="$color">
                      Appearance
                    </Label>
                    <Appearance />
                  </YStack>

                  {/* No theme picker: hanzo.app is dark-only and the theme is
                      FORCED in app/providers.tsx. A select offering Light and
                      System would write a preference nothing can honor. */}
                  <YStack rowGap="$4" maxWidth={448}>
                    <div>
                      {/* `$color`, not `$color11`. The label names the setting
                          and the line under it explains the setting, so they
                          are not the same thing and must not be the same grey —
                          at $color11 both came out identical and the row had no
                          first thing to read. */}
                      <Label htmlFor="model-select" fontSize="$3" fontWeight="500" color="$color" marginBottom="$2">
                        Default AI Model
                      </Label>
                      {/* The one picker (components/model-selector): grouped by
                          family, marked, searchable. A flat Select listed all 70
                          models as one alphabetical column, so "Claude Haiku 4.5"
                          sat next to "Claude Haiku 4 5" with nothing to tell them
                          apart. `defaultModel` is "" until configManager reads
                          back on mount; the placeholder names that state rather
                          than drawing a blank box. */}
                      <ModelSelector
                        models={models}
                        value={defaultModel}
                        placeholder="Enso (auto-route)"
                        data-testid="default-model"
                        onChange={(v) => {
                          setDefaultModelState(v);
                          configManager.setDefaultModel(v);
                        }}
  />
                      <Paragraph marginTop="$1.5" fontSize="$1" color="$color11">
                        Used when you don&apos;t pick a model in the composer.{" "}
                        <SizableText fontWeight="500" color="$color">Enso</SizableText> auto-routes to the best model per request.
                      </Paragraph>
                    </div>
                  </YStack>
                </YStack>
              </YStack>
            </TabsContent>

            {/* One card, three rows. These were three separate panels — three
                cards, twelve edges, for three lines that say the same thing
                about three providers. A set reads as a set. */}
            <TabsContent value="api-keys">
              <YStack {...rows}>
                {[
                  { name: "OpenAI", detail: "GPT models" },
                  { name: "Anthropic", detail: "Claude models" },
                  { name: "Google AI", detail: "Gemini models" },
                ].map((provider) => (
                  <XStack key={provider.name} {...row}>
                    <YStack minWidth={0} rowGap="$1">
                      <SizableText fontSize="$3" fontWeight="500" color="$color">{provider.name} API key</SizableText>
                      <Paragraph fontSize="$1" color="$color11">Connect your own key for {provider.detail}</Paragraph>
                    </YStack>
                    <a href="https://console.hanzo.ai/ai-accounts" target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline">Configure</Button></a>
                  </XStack>
                ))}
              </YStack>
            </TabsContent>

            {/* The four-cards-for-four-toggles case, and the reason `rows`
                exists. Each switch used to be its own panel, so four related
                preferences read as four unrelated decisions. */}
            <TabsContent value="notifications">
              <YStack {...rows}>
                {[
                  { name: "Email notifications", detail: "Product news and account activity" },
                  { name: "Push notifications", detail: "Alerts on this device" },
                  { name: "Project updates", detail: "Builds, deploys and comments" },
                  { name: "Marketing emails", detail: "Occasional launches and offers" },
                ].map((item) => (
                  <Label key={item.name} {...row} display="flex" cursor="pointer">
                    <YStack minWidth={0} rowGap="$1">
                      <SizableText fontSize="$3" fontWeight="500" color="$color">{item.name}</SizableText>
                      <Paragraph fontSize="$1" color="$color11">{item.detail}</Paragraph>
                    </YStack>
                    <Switch
                      checked={notifs[item.name] ?? true}
                      onCheckedChange={(v) => toggleNotif(item.name, !!v)}
  />
                  </Label>
                ))}
              </YStack>
            </TabsContent>

            {/* Password, MFA, sessions and account deletion are owned by IAM
                (the hanzo.id account page) — the ONE identity source. Link out
                rather than re-implement auth here. */}
            {/* Four stacked full-width outline buttons was a stack of four
                identical loud rectangles for four things you rarely do. As
                rows they say what they are, and the destination — IAM, not
                this app — is stated once above them instead of four times. */}
            <TabsContent value="security">
              <YStack rowGap="$3">
                <Paragraph fontSize="$1" color="$color11">
                  Your password, two-factor devices and sessions live with your Hanzo
                  identity, so these open hanzo.id.
                </Paragraph>
                <YStack {...rows}>
                  {[
                    { name: "Password", detail: "Change the password on your Hanzo account" },
                    { name: "Two-factor authentication", detail: "Add a second step when signing in" },
                    { name: "Sessions", detail: "Review and sign out other devices" },
                    { name: "Delete account", detail: "Permanently close this account", danger: true },
                  ].map((item) => (
                    <Anchor
                      key={item.name}
                      href="https://hanzo.id/account"
                      target="_blank"
                      rel="noopener noreferrer"
                      textDecorationLine="none"
                      {...row}
                      hoverStyle={{ backgroundColor: "$color3" }}
                    >
                      <YStack minWidth={0} rowGap="$1">
                        <SizableText fontSize="$3" fontWeight="500" color={item.danger ? "$red10" : "$color"}>{item.name}</SizableText>
                        <Paragraph fontSize="$1" color="$color11">{item.detail}</Paragraph>
                      </YStack>
                      <ExternalLink size={14} color="var(--muted-foreground)" />
                    </Anchor>
                  ))}
                </YStack>
              </YStack>
            </TabsContent>

            {/* One subject, one action — the last tab still laying itself out
                by hand. It offered TWO full-width bars that both went to
                /billing: an accent "Upgrade to Pro" and an outline "Manage
                Billing", stacked 16px apart, 862px wide each, one label
                centred and the other flush left (justify-content center vs
                flex-start — measured). Two controls for one destination cannot
                agree on anything; one control has nothing to disagree with,
                and WHICH one it is, is the plan. */}
            <TabsContent value="billing">
              <YStack {...rows}>
                <XStack {...row}>
                  <YStack minWidth={0} rowGap="$1">
                    <SizableText fontSize="$3" fontWeight="500" color="$color">Plan</SizableText>
                    {/* The plan is READ, never assumed. This panel used to
                        hardcode "Current Plan: Free" and "0 / 100 AI
                        generations used this month" — two assertions about a
                        customer's account that nothing had ever asked commerce
                        about, shown identically to someone paying us every
                        month. `unknown` stays its own answer: a request that
                        never landed is not evidence of a free account. Usage
                        lives on /billing, which actually reads it. */}
                    <Paragraph fontSize="$1" color="$color11">
                      {plan.phase === "loading"
                        ? "…"
                        : plan.phase === "unknown"
                          ? "Unavailable"
                          : plan.tier || "Free"}
                    </Paragraph>
                  </YStack>
                  {/* The loud one appears only when we KNOW the caller pays for
                      nothing; loading and unknown get the neutral action. */}
                  {unpaid(plan) ? (
                    <Button size="sm" {...accent} onClick={() => router.push("/billing")}>
                      Upgrade to Pro
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => router.push("/billing")}>
                      Manage billing
                    </Button>
                  )}
                </XStack>
              </YStack>
            </TabsContent>
          </Tabs>
    </AppShell>
  );
}