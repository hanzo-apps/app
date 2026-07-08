"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Key, Bell, Palette, Shield, CreditCard } from "lucide-react";
import { Button } from "@hanzo/ui";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { HanzoLogo } from "@/components/HanzoLogo";

export default function SettingsPage() {
  // All hooks must be called unconditionally before any conditional returns
  const { user, loading } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General", icon: <Palette className="w-4 h-4" /> },
    { id: "api-keys", label: "API Keys", icon: <Key className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Shield className="w-4 h-4" /> },
    { id: "billing", label: "Billing", icon: <CreditCard className="w-4 h-4" /> },
  ];

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  // Use effect for navigation to avoid calling router.push during render
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <HanzoLogo className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-neutral-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <HanzoLogo className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-neutral-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell currentView="settings">
    <div className="flex-1 overflow-y-auto bg-black">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="col-span-3">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === tab.id
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="col-span-9">
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
              {activeTab === "general" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-medium text-white mb-4">General Settings</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Theme
                      </label>
                      <select className="w-full bg-neutral-800 text-white border border-neutral-700 rounded-lg px-4 py-2">
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="system">System</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Language
                      </label>
                      <select className="w-full bg-neutral-800 text-white border border-neutral-700 rounded-lg px-4 py-2">
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Default AI Model
                      </label>
                      <select className="w-full bg-neutral-800 text-white border border-neutral-700 rounded-lg px-4 py-2">
                        <option value="claude-3.5">Claude 3.5 Sonnet</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gemini">Gemini Pro</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "api-keys" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-medium text-white mb-4">API Keys</h2>

                  <div className="space-y-4">
                    <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-300">OpenAI API Key</span>
                        <Button size="sm" variant="outline">Configure</Button>
                      </div>
                      <p className="text-xs text-neutral-500">Connect your OpenAI API key for GPT models</p>
                    </div>

                    <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-300">Anthropic API Key</span>
                        <Button size="sm" variant="outline">Configure</Button>
                      </div>
                      <p className="text-xs text-neutral-500">Connect your Anthropic API key for Claude models</p>
                    </div>

                    <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-300">Google AI API Key</span>
                        <Button size="sm" variant="outline">Configure</Button>
                      </div>
                      <p className="text-xs text-neutral-500">Connect your Google AI API key for Gemini models</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-medium text-white mb-4">Notification Preferences</h2>

                  <div className="space-y-4">
                    {["Email notifications", "Push notifications", "Project updates", "Marketing emails"].map((item) => (
                      <label key={item} className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
                        <span className="text-sm text-neutral-300">{item}</span>
                        <input type="checkbox" className="toggle" defaultChecked />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-medium text-white mb-4">Security Settings</h2>

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
                  <h2 className="text-xl font-medium text-white mb-4">Billing & Usage</h2>

                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                    <p className="text-sm text-purple-300 mb-2">Current Plan: Free</p>
                    <p className="text-xs text-neutral-400 mb-4">0 / 100 AI generations used this month</p>
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