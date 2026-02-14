"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@hanzo/ui";
import {
  FolderOpen,
  Plus,
  ExternalLink,
  CreditCard,
  BarChart3,
  Cpu,
  Globe,
  LineChart,
  Wallet,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";

import { useUser } from "@/hooks/useUser";
import Header from "@/components/layout/header";
import { HanzoLogo } from "@/components/HanzoLogo";

// Placeholder project data
const PLACEHOLDER_PROJECTS = [
  {
    _id: "proj_1",
    title: "Landing Page Builder",
    status: "active" as const,
    updatedAt: "2 hours ago",
    deploys: 12,
  },
  {
    _id: "proj_2",
    title: "E-commerce Dashboard",
    status: "active" as const,
    updatedAt: "1 day ago",
    deploys: 5,
  },
  {
    _id: "proj_3",
    title: "AI Chat Widget",
    status: "draft" as const,
    updatedAt: "3 days ago",
    deploys: 0,
  },
];

// Placeholder usage data
const USAGE_STATS = [
  { label: "API Calls", value: "12,847", limit: "50,000", percent: 26 },
  { label: "Compute Hours", value: "34.2", limit: "100", percent: 34 },
  { label: "Storage", value: "2.1 GB", limit: "10 GB", percent: 21 },
];

const QUICK_LINKS = [
  {
    title: "Console",
    description: "Manage services and infrastructure",
    href: "https://console.hanzo.ai",
    icon: Cpu,
  },
  {
    title: "Platform",
    description: "Deploy and manage applications",
    href: "https://platform.hanzo.ai",
    icon: Globe,
  },
  {
    title: "Analytics",
    description: "View metrics and insights",
    href: "https://analytics.hanzo.ai",
    icon: LineChart,
  },
];

function WalletSection() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  if (!isConnected || !address) {
    return null;
  }

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const formattedBalance = balance
    ? `${parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)} ${balance.symbol}`
    : "Loading...";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Wallet</h3>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/50">Address</span>
          <span className="text-sm text-white/80 font-mono">{shortAddress}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/50">Balance</span>
          <span className="text-sm text-white font-medium">{formattedBalance}</span>
        </div>
      </div>
    </div>
  );
}

function UsageBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-white/10">
      <div
        className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading, logout } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center">
          <HanzoLogo className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center">
          <HanzoLogo className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome / User Info */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-12 h-12 rounded-full border border-white/10"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#fd4444] to-[#ff6b6b] flex items-center justify-center text-white text-lg font-bold">
                {(user.fullname || user.name || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome back, {user.fullname || user.name || "Developer"}
              </h1>
              <p className="text-white/50 text-sm">
                {user.email || user.username || user.id}
                {user.isPro && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    PRO
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
            Quick Links
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {QUICK_LINKS.map((link) => (
              <a
                key={link.title}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <link.icon className="w-5 h-5 text-white/70" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                </div>
                <h3 className="text-white font-medium">{link.title}</h3>
                <p className="text-sm text-white/40 mt-1">{link.description}</p>
              </a>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Projects - spans 2 columns */}
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider">
                Projects
              </h2>
              <Button
                onClick={() => router.push("/new")}
                size="sm"
                variant="outline"
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" />
                New
              </Button>
            </div>

            <div className="space-y-3">
              {PLACEHOLDER_PROJECTS.map((project) => (
                <Link
                  key={project._id}
                  href={`/projects/${project._id}`}
                  className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                      <FolderOpen className="w-5 h-5 text-white/60" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium group-hover:text-white/90">
                        {project.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            project.status === "active"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-white/10 text-white/50"
                          }`}
                        >
                          {project.status}
                        </span>
                        <span className="text-xs text-white/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {project.updatedAt}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                </Link>
              ))}

              <Link
                href="/projects"
                className="block text-center py-3 text-sm text-white/40 hover:text-white/60 transition-colors"
              >
                View all projects
              </Link>
            </div>
          </section>

          {/* Right sidebar */}
          <aside className="space-y-6">
            {/* Usage / Billing Summary */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Usage</h3>
              </div>

              <div className="space-y-4">
                {USAGE_STATS.map((stat) => (
                  <div key={stat.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-white/60">{stat.label}</span>
                      <span className="text-sm text-white/80">
                        {stat.value}{" "}
                        <span className="text-white/30">/ {stat.limit}</span>
                      </span>
                    </div>
                    <UsageBar percent={stat.percent} />
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white/50">Current Plan</span>
                  <span className="text-sm text-white font-medium">
                    {user.isPro ? "Pro" : "Free"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Billing Cycle</span>
                  <span className="text-sm text-white/70">Monthly</span>
                </div>
              </div>

              <Link
                href="/billing"
                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-white/10 text-sm text-white/60 hover:text-white hover:border-white/20 transition-all"
              >
                <CreditCard className="w-4 h-4" />
                Manage Billing
              </Link>
            </div>

            {/* Wallet (conditional on Web3 connection) */}
            <WalletSection />
          </aside>
        </div>
      </main>
    </div>
  );
}
