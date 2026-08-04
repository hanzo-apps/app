"use client";

import { LoadingScreen } from "@/components/ui/loading-screen";
import { XStack, SizableText, Paragraph, YStack, H2, Anchor } from '@hanzo/gui';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Key, Bell, Palette, Shield, CreditCard } from "lucide-react";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label, Switch } from '@hanzo/ui';
import { useUser } from "@/hooks/useUser";
import { AppShell } from "@/components/app-shell";
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

  const tabs = [
    { id: "general", label: "General", icon: <Palette size={16} /> },
    { id: "api-keys", label: "API Keys", icon: <Key size={16} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
    { id: "security", label: "Security", icon: <Shield size={16} /> },
    { id: "billing", label: "Billing", icon: <CreditCard size={16} /> },
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
    <AppShell currentView="settings">
    <YStack flex={1} backgroundColor="$background" overflow="scroll">
      <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5" paddingVertical="$6">
        <YStack gap="$6" maxWidth={896} alignSelf="center">
          {/* Sidebar */}
          <YStack>
            <YStack rowGap="$1">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  width="100%" alignItems="center" gap="$3" paddingHorizontal="$3" paddingVertical="$2" borderRadius="$5" fontSize="$3" whiteSpace="nowrap" {...{ backgroundColor: activeTab === tab.id ? "$color3" : undefined, color: activeTab === tab.id ? "$color" : "$color11", borderWidth: activeTab === tab.id ? 1 : undefined, borderColor: activeTab === tab.id ? "$borderColor" : undefined, hoverStyle: activeTab === tab.id ? undefined : {"color":"$color","backgroundColor":"$color3"} }}
                >
                  {tab.icon}
                  {tab.label}
                </Button>
              ))}
            </YStack>
          </YStack>

          {/* Content */}
          <YStack>
            <YStack backgroundColor="$background" borderRadius="$5" borderWidth={1} borderColor="$borderColor" padding="$5">
              {activeTab === "general" && (
                <YStack rowGap="$5">
                  <H2 fontSize="$7" fontWeight="500" color="$color" marginBottom="$4">General Settings</H2>

                  {/* No theme picker: hanzo.app is dark-only and the theme is
                      FORCED in app/providers.tsx. A select offering Light and
                      System would write a preference nothing can honor. */}
                  <YStack rowGap="$4" maxWidth={448}>
                    <div>
                      <Label htmlFor="model-select" fontSize="$3" fontWeight="500" color="$color11" marginBottom="$2">
                        Default AI Model
                      </Label>
                      <Select
                        value={defaultModel}
                        onValueChange={(v) => {
                          setDefaultModelState(v);
                          configManager.setDefaultModel(v);
                        }}
                      >
                        <SelectTrigger id="model-select">
                          {/* `defaultModel` is "" until configManager reads back on
                              mount, and the native <select> showed an empty box in
                              that window. Name the state instead of drawing a blank. */}
                          <SelectValue placeholder="Enso (auto-route)" />
                        </SelectTrigger>
                        <SelectContent>
                          {models.map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Paragraph marginTop="$1.5" fontSize="$1" color="$color11">
                        Used when you don&apos;t pick a model in the composer.{" "}
                        <SizableText fontWeight="500" color="$color">Enso</SizableText> auto-routes to the best model per request.
                      </Paragraph>
                    </div>
                  </YStack>
                </YStack>
              )}

              {activeTab === "api-keys" && (
                <YStack rowGap="$5">
                  <H2 fontSize="$7" fontWeight="500" color="$color" marginBottom="$4">API Keys</H2>

                  <YStack rowGap="$4">
                    <YStack backgroundColor="$color3" borderRadius="$5" padding="$4" borderWidth={1} borderColor="$borderColor">
                      <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
                        <SizableText fontSize="$3" fontWeight="500" color="$color11">OpenAI API Key</SizableText>
                        <a href="https://console.hanzo.ai/ai-accounts" target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline">Configure</Button></a>
                      </XStack>
                      <Paragraph fontSize="$1" color="$color11">Connect your OpenAI API key for GPT models</Paragraph>
                    </YStack>

                    <YStack backgroundColor="$color3" borderRadius="$5" padding="$4" borderWidth={1} borderColor="$borderColor">
                      <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
                        <SizableText fontSize="$3" fontWeight="500" color="$color11">Anthropic API Key</SizableText>
                        <a href="https://console.hanzo.ai/ai-accounts" target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline">Configure</Button></a>
                      </XStack>
                      <Paragraph fontSize="$1" color="$color11">Connect your Anthropic API key for Claude models</Paragraph>
                    </YStack>

                    <YStack backgroundColor="$color3" borderRadius="$5" padding="$4" borderWidth={1} borderColor="$borderColor">
                      <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
                        <SizableText fontSize="$3" fontWeight="500" color="$color11">Google AI API Key</SizableText>
                        <a href="https://console.hanzo.ai/ai-accounts" target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline">Configure</Button></a>
                      </XStack>
                      <Paragraph fontSize="$1" color="$color11">Connect your Google AI API key for Gemini models</Paragraph>
                    </YStack>
                  </YStack>
                </YStack>
              )}

              {activeTab === "notifications" && (
                <YStack rowGap="$5">
                  <H2 fontSize="$7" fontWeight="500" color="$color" marginBottom="$4">Notification Preferences</H2>

                  <YStack rowGap="$4">
                    {["Email notifications", "Push notifications", "Project updates", "Marketing emails"].map((item) => (
                      <Label key={item} alignItems="center" justifyContent="space-between" padding="$4" backgroundColor="$color3" borderRadius="$5" borderWidth={1} borderColor="$borderColor" cursor="pointer">
                        <SizableText fontSize="$3" color="$color11">{item}</SizableText>
                        <Switch
                          checked={notifs[item] ?? true}
                          onCheckedChange={(v) => toggleNotif(item, !!v)}
  />
                      </Label>
                    ))}
                  </YStack>
                </YStack>
              )}

              {activeTab === "security" && (
                <YStack rowGap="$5">
                  <H2 fontSize="$7" fontWeight="500" color="$color" marginBottom="$4">Security Settings</H2>

                  {/* Password, MFA, sessions and account deletion are owned by
                      IAM (the hanzo.id account page) — the ONE identity
                      source. Link out rather than re-implement auth here. */}
                  <YStack rowGap="$4">
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
                      <Button variant="outline" width="100%" justifyContent="flex-start" color="$red9" hoverStyle={{ color: "$red8" }}>
                        Delete Account
                      </Button>
                    </Anchor>
                  </YStack>
                </YStack>
              )}

              {activeTab === "billing" && (
                <YStack rowGap="$5">
                  <H2 fontSize="$7" fontWeight="500" color="$color" marginBottom="$4">Billing & Usage</H2>

                  <YStack backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" borderRadius="$5" padding="$4">
                    {/* The plan is READ, never assumed. This panel used to hardcode
                        "Current Plan: Free" and "0 / 100 AI generations used this
                        month" — two assertions about a customer's account that
                        nothing had ever asked commerce about, shown identically to
                        someone paying us every month. A number nobody measured is
                        worse than no number, so the generations line is gone rather
                        than replaced with another guess; usage lives on /billing,
                        which actually reads it. */}
                    <Paragraph fontSize="$3" color="$color" marginBottom="$2">
                      {plan.phase === "loading"
                        ? "Current Plan: …"
                        : plan.phase === "unknown"
                          ? "Current Plan: unavailable"
                          : `Current Plan: ${plan.tier || "Free"}`}
                    </Paragraph>
                    {unpaid(plan) && (
                      <Button width="100%" onClick={() => router.push("/billing")}>
                        Upgrade to Pro
                      </Button>
                    )}
                  </YStack>

                  <YStack rowGap="$2">
                    <Anchor href="/billing">
                      <Button variant="outline" width="100%" justifyContent="flex-start">
                        Manage Billing
                      </Button>
                    </Anchor>
                  </YStack>
                </YStack>
              )}
            </YStack>
          </YStack>
        </YStack>
      </YStack>
    </YStack>
    </AppShell>
  );
}