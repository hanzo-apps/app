"use client";

import { LoadingScreen } from "@/components/ui/loading-screen";
import { XStack, SizableText, Paragraph, YStack, Anchor } from '@hanzo/gui';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Label, Switch, Tabs, TabsList, TabsTrigger, TabsContent } from '@hanzo/ui';
import { useUser } from "@/hooks/useUser";
import { AppShell } from "@/components/app-shell";
import { ModelSelector } from "@/components/model-selector";
import { accent, panel, selected } from "@/lib/chrome";
import { configManager } from "@/lib/config/storage";
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
      <LoadingScreen>Loading settings...</LoadingScreen>
    );
  }

  // Show loading state while redirecting
  if (!user) {
    return (
      <LoadingScreen>Redirecting to login...</LoadingScreen>
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

                  {/* No theme picker: hanzo.app is dark-only and the theme is
                      FORCED in app/providers.tsx. A select offering Light and
                      System would write a preference nothing can honor. */}
                  <YStack rowGap="$4" maxWidth={448}>
                    <div>
                      <Label htmlFor="model-select" fontSize="$3" fontWeight="500" color="$color11" marginBottom="$2">
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

            {/* Cards ARE the panels here — an outer panel around them would be
                $color2 on $color2, a container you can only find by its edge. */}
            <TabsContent value="api-keys">
              <YStack rowGap="$4">
                <YStack {...panel} padding="$4">
                  <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
                    <SizableText fontSize="$3" fontWeight="500" color="$color11">OpenAI API Key</SizableText>
                    <a href="https://console.hanzo.ai/ai-accounts" target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline">Configure</Button></a>
                  </XStack>
                  <Paragraph fontSize="$1" color="$color11">Connect your OpenAI API key for GPT models</Paragraph>
                </YStack>

                <YStack {...panel} padding="$4">
                  <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
                    <SizableText fontSize="$3" fontWeight="500" color="$color11">Anthropic API Key</SizableText>
                    <a href="https://console.hanzo.ai/ai-accounts" target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline">Configure</Button></a>
                  </XStack>
                  <Paragraph fontSize="$1" color="$color11">Connect your Anthropic API key for Claude models</Paragraph>
                </YStack>

                <YStack {...panel} padding="$4">
                  <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
                    <SizableText fontSize="$3" fontWeight="500" color="$color11">Google AI API Key</SizableText>
                    <a href="https://console.hanzo.ai/ai-accounts" target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline">Configure</Button></a>
                  </XStack>
                  <Paragraph fontSize="$1" color="$color11">Connect your Google AI API key for Gemini models</Paragraph>
                </YStack>
              </YStack>
            </TabsContent>

            <TabsContent value="notifications">
              <YStack rowGap="$4">
                {["Email notifications", "Push notifications", "Project updates", "Marketing emails"].map((item) => (
                  <Label key={item} {...panel} alignItems="center" justifyContent="space-between" padding="$4" cursor="pointer">
                    <SizableText fontSize="$3" color="$color11">{item}</SizableText>
                    <Switch
                      checked={notifs[item] ?? true}
                      onCheckedChange={(v) => toggleNotif(item, !!v)}
  />
                  </Label>
                ))}
              </YStack>
            </TabsContent>

            {/* Password, MFA, sessions and account deletion are owned by IAM
                (the hanzo.id account page) — the ONE identity source. Link out
                rather than re-implement auth here. */}
            <TabsContent value="security">
              <YStack {...panel} rowGap="$3" padding="$5">
                <Anchor href="https://hanzo.id/account" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" width="100%" justifyContent="flex-start">
                    Change Password
                  </Button>
                </Anchor>
                <Anchor href="https://hanzo.id/account" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" width="100%" justifyContent="flex-start">
                    Enable Two-Factor Authentication
                  </Button>
                </Anchor>
                <Anchor href="https://hanzo.id/account" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" width="100%" justifyContent="flex-start">
                    Manage Sessions
                  </Button>
                </Anchor>
                <Anchor href="https://hanzo.id/account" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" width="100%" justifyContent="flex-start">
                    <SizableText color="$red9">Delete Account</SizableText>
                  </Button>
                </Anchor>
              </YStack>
            </TabsContent>

            <TabsContent value="billing">
              <YStack {...panel} rowGap="$4" padding="$5">
                {/* The plan is READ, never assumed. This panel used to hardcode
                    "Current Plan: Free" and "0 / 100 AI generations used this
                    month" — two assertions about a customer's account that
                    nothing had ever asked commerce about, shown identically to
                    someone paying us every month. A number nobody measured is
                    worse than no number, so the generations line is gone rather
                    than replaced with another guess; usage lives on /billing,
                    which actually reads it. */}
                <Paragraph fontSize="$3" color="$color">
                  {plan.phase === "loading"
                    ? "Current Plan: …"
                    : plan.phase === "unknown"
                      ? "Current Plan: unavailable"
                      : `Current Plan: ${plan.tier || "Free"}`}
                </Paragraph>
                {unpaid(plan) && (
                  <Button {...accent} width="100%" onClick={() => router.push("/billing")}>
                    Upgrade to Pro
                  </Button>
                )}
                <Anchor href="/billing">
                  <Button variant="outline" width="100%" justifyContent="flex-start">
                    Manage Billing
                  </Button>
                </Anchor>
              </YStack>
            </TabsContent>
          </Tabs>
    </AppShell>
  );
}