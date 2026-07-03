"use client";

import { useEffect, useState } from "react";
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
import { WalletBoundary } from "@/components/providers/WalletBoundary";
import Header from "@/components/layout/header";
import { HanzoLogo } from "@/components/HanzoLogo";
import { getProjects } from "@/app/actions/projects";
import {
  toDashboardProject,
  relativeTime,
  type DashboardProject,
  type BaseProjectRow,
} from "@/lib/projects-view";
import { buildUsage } from "@/lib/usage";

// Real Hanzo surfaces — the same control plane the console links to.
const QUICK_LINKS = [
  {
    title: "Console",
    description: "Manage your Hanzo Cloud projects",
    href: "https://console.hanzo.ai",
    icon: Cpu,
  },
  {
    title: "Platform",
    description: "Deploy and operate services",
    href: "https://platform.hanzo.ai",
    icon: Globe,
  },
  {
    title: "Analytics",
    description: "Product metrics and insights",
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
        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-white/70" />
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

export default function DashboardPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  // null = still loading; [] = loaded, none. Never fabricated.
  const [projects, setProjects] = useState<DashboardProject[] | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getProjects();
        if (cancelled) return;
        const rows = (res?.ok ? res.projects : []) as unknown as BaseProjectRow[];
        setProjects(rows.map(toDashboardProject));
      } catch {
        if (!cancelled) setProjects([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center">
          <HanzoLogo className="w-12 h-12 mx-auto mb-4 animate-pulse text-white" />
          <p className="text-white/40">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center">
          <HanzoLogo className="w-12 h-12 mx-auto mb-4 animate-pulse text-white" />
          <p className="text-white/40">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const usage = buildUsage(projects?.length ?? 0);

  return (
    <div className="min-h-screen bg-neutral-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome / User Info */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-12 h-12 rounded-full border border-white/10"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white text-lg font-bold">
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
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-white/80 border border-white/20">
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

            {projects === null ? (
              <ProjectsSkeleton />
            ) : projects.length === 0 ? (
              <EmptyProjects onCreate={() => router.push("/new")} />
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.spaceId || project.id}`}
                    className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <FolderOpen className="w-5 h-5 text-white/60" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium group-hover:text-white/90">
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          {project.spaceId && (
                            <span className="text-xs text-white/40 font-mono">
                              {project.spaceId}
                            </span>
                          )}
                          <span className="text-xs text-white/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {relativeTime(project.updatedAt)}
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
            )}
          </section>

          {/* Right sidebar */}
          <aside className="space-y-6">
            {/* Usage / Plan Summary */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white/70" />
                </div>
                <h3 className="text-lg font-semibold text-white">Usage</h3>
              </div>

              <div className="space-y-4">
                {usage.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-white/60">{metric.label}</span>
                    <span className="text-sm text-white/80">
                      {metric.value}
                      {metric.limit != null && (
                        <span className="text-white/30"> / {metric.limit}</span>
                      )}
                      {metric.unit ? ` ${metric.unit}` : ""}
                    </span>
                  </div>
                ))}
              </div>

              {!usage.metered && usage.note && (
                <p className="mt-4 text-xs text-white/35 leading-relaxed">
                  {usage.note}
                </p>
              )}

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

            {/* Wallet (conditional on Web3 connection) — web3 stack scoped here */}
            <WalletBoundary>
              <WalletSection />
            </WalletBoundary>
          </aside>
        </div>
      </main>
    </div>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
        >
          <div className="w-10 h-10 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-40 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-3 w-24 rounded bg-white/[0.04] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyProjects({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
        <FolderOpen className="h-6 w-6 text-white/50" />
      </div>
      <h3 className="text-white font-medium">No projects yet</h3>
      <p className="mx-auto mt-1 max-w-xs text-sm text-white/40">
        Describe what you want to build and Hanzo will generate it. Your projects
        will appear here.
      </p>
      <Button onClick={onCreate} size="sm" variant="outline" className="mt-5 gap-1.5">
        <Plus className="w-4 h-4" />
        Create your first project
      </Button>
    </div>
  );
}
