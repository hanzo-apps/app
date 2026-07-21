"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Key, Bell, Palette, Shield, CreditCard } from "lucide-react";
import { Button } from "@hanzo/ui";
import { useUser } from "@/hooks/useUser";
import { AppShell } from "@/components/app-shell";
import { HanzoLogo } from "@/components/HanzoLogo";

export default function SettingsPage() {
  // All hooks must be called unconditionally before any conditional returns
  const { user, loading } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");

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
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Theme
                      </label>
                      <select disabled className="w-full bg-muted text-foreground border border-border rounded-lg px-4 py-2 opacity-70 cursor-not-allowed">
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="system">System</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Language
                      </label>
                      <select disabled className="w-full bg-muted text-foreground border border-border rounded-lg px-4 py-2 opacity-70 cursor-not-allowed">
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Default AI Model
                      </label>
                      <select disabled className="w-full bg-muted text-foreground border border-border rounded-lg px-4 py-2 opacity-70 cursor-not-allowed">
                        <option value="zen5-coder">Zen 5 Coder</option>
                        <option value="zen5-pro">Zen 5 Pro</option>
                        <option value="zen3-omni">Zen 3 Omni</option>
                      </select>
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
                        <Button size="sm" variant="outline">Configure</Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Connect your OpenAI API key for GPT models</p>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Anthropic API Key</span>
                        <Button size="sm" variant="outline">Configure</Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Connect your Anthropic API key for Claude models</p>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Google AI API Key</span>
                        <Button size="sm" variant="outline">Configure</Button>
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

                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Enable Two-Factor Authentication
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Manage Sessions
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-400">
                      Delete Account
                    </Button>
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