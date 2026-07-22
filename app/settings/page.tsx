"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Key, Bell, Palette, Shield, CreditCard } from "lucide-react";
import { Button } from "@hanzo/ui";
import { useUser } from "@/hooks/useUser";
import { AppShell } from "@/components/app-shell";
import { HanzoLogo } from "@/components/HanzoLogo";
import { configManager } from "@/lib/config/storage";
import { useModels } from "@/lib/hooks/use-models";

export default function SettingsPage() {
  // All hooks must be called unconditionally before any conditional returns
  const { user, loading } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  // Theme is owned by the ONE controller (next-themes); this select drives it
  // directly — same source the in-app settings panel + sonner read.
  const { theme, setTheme } = useTheme();
  const { models } = useModels();
  const [mounted, setMounted] = useState(false);
  const [defaultModel, setDefaultModelState] = useState("");
  useEffect(() => {
    setMounted(true);
    setDefaultModelState(configManager.getDefaultModel());
  }, []);

  const tabs = [
    { id: "general", label: "General", icon: <Palette className="w-4 h-4 shrink-0" /> },
    { id: "api-keys", label: "API Keys", icon: <Key className="w-4 h-4 shrink-0" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4 shrink-0" /> },
    { id: "security", label: "Security", icon: <Shield className="w-4 h-4 shrink-0" /> },
    { id: "billing", label: "Billing", icon: <CreditCard className="w-4 h-4 shrink-0" /> },
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <HanzoLogo className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <HanzoLogo className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell currentView="settings">
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-4xl mx-auto">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "bg-accent text-foreground border border-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="col-span-12 md:col-span-6">
            <div className="bg-card rounded-lg border border-border p-6">
              {activeTab === "general" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-medium text-foreground mb-4">General Settings</h2>

                  <div className="space-y-4 max-w-md">
                    <div>
                      <label htmlFor="theme-select" className="block text-sm font-medium text-muted-foreground mb-2">
                        Theme
                      </label>
                      <select
                        id="theme-select"
                        value={mounted ? (theme ?? "system") : "system"}
                        onChange={(e) => setTheme(e.target.value)}
                        className="w-full bg-muted text-foreground border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                      <p className="mt-1.5 text-xs text-muted-foreground">Applies instantly across the app.</p>
                    </div>

                    <div>
                      <label htmlFor="model-select" className="block text-sm font-medium text-muted-foreground mb-2">
                        Default AI Model
                      </label>
                      <select
                        id="model-select"
                        value={defaultModel}
                        onChange={(e) => {
                          setDefaultModelState(e.target.value);
                          configManager.setDefaultModel(e.target.value);
                        }}
                        className="w-full bg-muted text-foreground border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {models.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Used when you don&apos;t pick a model in the composer.{" "}
                        <span className="font-medium text-foreground">Enso</span> auto-routes to the best model per request.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "api-keys" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-medium text-foreground mb-4">API Keys</h2>

                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">OpenAI API Key</span>
                        <a href="https://console.hanzo.ai/ai-accounts" target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline">Configure</Button></a>
                      </div>
                      <p className="text-xs text-muted-foreground">Connect your OpenAI API key for GPT models</p>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Anthropic API Key</span>
                        <a href="https://console.hanzo.ai/ai-accounts" target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline">Configure</Button></a>
                      </div>
                      <p className="text-xs text-muted-foreground">Connect your Anthropic API key for Claude models</p>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Google AI API Key</span>
                        <a href="https://console.hanzo.ai/ai-accounts" target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline">Configure</Button></a>
                      </div>
                      <p className="text-xs text-muted-foreground">Connect your Google AI API key for Gemini models</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-medium text-foreground mb-4">Notification Preferences</h2>

                  <div className="space-y-4">
                    {["Email notifications", "Push notifications", "Project updates", "Marketing emails"].map((item) => (
                      <label key={item} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                        <span className="text-sm text-muted-foreground">{item}</span>
                        <input type="checkbox" className="toggle" defaultChecked />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-medium text-foreground mb-4">Security Settings</h2>

                  {/* Password, MFA, sessions and account deletion are owned by
                      IAM (hanzo.id / Casdoor account page) — the ONE identity
                      source. Link out rather than re-implement auth here. */}
                  <div className="space-y-4">
                    <a href="https://hanzo.id/account" target="_blank" rel="noopener noreferrer" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        Change Password
                      </Button>
                    </a>
                    <a href="https://hanzo.id/account" target="_blank" rel="noopener noreferrer" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        Enable Two-Factor Authentication
                      </Button>
                    </a>
                    <a href="https://hanzo.id/account" target="_blank" rel="noopener noreferrer" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        Manage Sessions
                      </Button>
                    </a>
                    <a href="https://hanzo.id/account" target="_blank" rel="noopener noreferrer" className="block">
                      <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-400">
                        Delete Account
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              {activeTab === "billing" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-medium text-foreground mb-4">Billing & Usage</h2>

                  <div className="bg-muted border border-border rounded-lg p-4">
                    <p className="text-sm text-foreground mb-2">Current Plan: Free</p>
                    <p className="text-xs text-muted-foreground mb-4">0 / 100 AI generations used this month</p>
                    <Button className="w-full">Upgrade to Pro</Button>
                  </div>

                  <div className="space-y-2">
                    <a href="/billing" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        Manage Billing
                      </Button>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </AppShell>
  );
}