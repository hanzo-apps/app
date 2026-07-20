"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@hanzo/ui";
import {
  FolderOpen,
  Clock,
  Circle,
  BarChart3,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";

import { useUser } from "@/hooks/useUser";
import { useProjects } from "@/hooks/useProjects";
import { AppShell } from "@/components/app-shell";
import { HanzoLogo } from "@/components/HanzoLogo";
import { BuildComposer } from "@/components/build-composer";
import { ProjectThumb } from "@/components/project-thumb";
import { builderLink, liveUrlOf } from "@/lib/api/projects";
import { relativeTime } from "@/lib/projects-view";
import { statusOf } from "@/lib/project-status";
import { markProjectOpened, orderByRecentlyOpened } from "@/lib/recent-projects";
import Reveal from "@/components/landing/reveal";
import {
  snapshotCatalog,
  popularTemplates,
  type GalleryTemplate,
} from "@/lib/gallery-catalog";

/** Dashboard project row — every field from the real /v1/projects record. */
interface DashProject {
  id: string;
  slug: string;
  org?: string;
  name: string;
  status: string;
  liveUrl: string | null;
  updatedAtIso: string | null;
}

export default function DashboardPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  // REAL projects: the org-scoped cloud list (client-side; survives reloads and
  // devices). ONE shared source with the sidebar + palette (hooks/useProjects).
  const { projects: apiProjects, loading: projectsLoading } = useProjects();
  const [templates] = useState<GalleryTemplate[]>(() =>
    popularTemplates(snapshotCatalog().templates, 8),
  );
  const [tab, setTab] = useState("mine");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const projects = useMemo<DashProject[]>(
    () =>
      apiProjects.map((p) => ({
        id: p.id || p.slug,
        slug: p.slug,
        org: p.org,
        name: p.name || p.slug,
        status: p.status || "draft",
        liveUrl: liveUrlOf(p),
        updatedAtIso: p.updatedAt ? new Date(p.updatedAt * 1000).toISOString() : null,
      })),
    [apiProjects],
  );
  const showSkeleton = projectsLoading && projects.length === 0;

  const recentlyViewed = useMemo(
    () => orderByRecentlyOpened(projects, (p) => p.slug || p.id),
    [projects],
  );

  const openProject = (p: DashProject) => {
    markProjectOpened(p.slug || p.id);
    router.push(builderLink(p.slug || p.id, p.org));
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <HanzoLogo className="mx-auto mb-4 h-12 w-12 animate-pulse text-white" />
          <p className="text-white/40">
            {loading ? "Loading your workspace…" : "Redirecting to login…"}
          </p>
        </div>
      </div>
    );
  }

  const greetingName = user.fullname || user.name || "there";

  return (
    <AppShell currentView="dashboard">
      <div className="flex-1 overflow-y-auto bg-black">
        {/* ── Hero viewport: ONLY the centered composer until you scroll ── */}
        <section className="relative flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4">
          <BuildComposer greetingName={greetingName} showPill />

          {/* Scroll invitation — the projects panel waits below the fold. */}
          <button
            type="button"
            onClick={() =>
              document
                .getElementById("projects-panel")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="group absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-white/35 transition-colors hover:text-white/70"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
              Your projects
            </span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </button>
        </section>

        {/* ── Projects: a rounded panel that slides up as you scroll ── */}
        <section id="projects-panel" className="mx-auto max-w-6xl scroll-mt-6 px-4 pb-24 sm:px-6">
          <Reveal>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/50 md:p-8">
              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <TabsList className="bg-transparent p-0">
                    <TabsTrigger value="mine" className="data-[state=active]:bg-white/10">
                      My projects
                    </TabsTrigger>
                    <TabsTrigger value="recent" className="data-[state=active]:bg-white/10">
                      Recently viewed
                    </TabsTrigger>
                    <TabsTrigger value="visitors" className="data-[state=active]:bg-white/10">
                      Most visitors today
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="data-[state=active]:bg-white/10">
                      Templates
                    </TabsTrigger>
                  </TabsList>

                  <Link
                    href={tab === "templates" ? "/resources" : "/projects"}
                    className="text-sm text-white/50 transition-colors hover:text-white"
                  >
                    Browse all →
                  </Link>
                </div>

                {/* My projects */}
                <TabsContent value="mine">
                  {showSkeleton ? (
                    <ProjectsSkeleton />
                  ) : projects.length === 0 ? (
                    <EmptyProjects />
                  ) : (
                    <ProjectGrid projects={projects} onOpen={openProject} />
                  )}
                </TabsContent>

                {/* Recently viewed — the real local "opened here" signal. */}
                <TabsContent value="recent">
                  {showSkeleton ? (
                    <ProjectsSkeleton />
                  ) : recentlyViewed.length === 0 ? (
                    <EmptyState
                      icon={Clock}
                      title="No recently viewed projects"
                      body="Projects you open will show up here, most recent first."
                    />
                  ) : (
                    <ProjectGrid projects={recentlyViewed} onOpen={openProject} />
                  )}
                </TabsContent>

                {/* Most visitors today — honest: per-project traffic analytics isn't
                    wired into this list yet, so we don't fabricate numbers. */}
                <TabsContent value="visitors">
                  <EmptyState
                    icon={BarChart3}
                    title="Visitor analytics coming to your dashboard"
                    body="Once your apps are published and receiving traffic, your busiest projects today will rank here. Live traffic is captured per deployment."
                    action={{ label: "View analytics", href: "https://analytics.hanzo.ai" }}
                  />
                </TabsContent>

                {/* Templates — a peek at the gallery; Browse all → /resources. */}
                <TabsContent value="templates">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {templates.map((t) => (
                      <Link
                        key={t.slug}
                        href="/resources"
                        className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-all hover:-translate-y-0.5 hover:border-white/25"
                      >
                        <div className="relative aspect-[16/10] overflow-hidden bg-white/[0.02]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={t.screenshotUrl}
                            alt={`${t.displayName} preview`}
                            loading="lazy"
                            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.04]"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.opacity = "0";
                            }}
                          />
                        </div>
                        <div className="p-3">
                          <p className="truncate text-sm font-medium text-white/85">{t.displayName}</p>
                          <p className="truncate text-xs text-white/35">{t.category}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </Reveal>
        </section>
      </div>
    </AppShell>
  );
}

function ProjectGrid({
  projects,
  onOpen,
}: {
  projects: DashProject[];
  onOpen: (p: DashProject) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => {
        // ONE four-state status map (live/building/error/draft) — a failed deploy
        // never looks like an untouched draft. See lib/project-status.
        const st = statusOf(p.status);
        return (
          <button
            key={p.id}
            onClick={() => onOpen(p)}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.03]"
          >
            {/* Real thumbnail: the live site itself (inert); monogram otherwise. */}
            <div className="relative">
              <ProjectThumb name={p.name} liveUrl={p.liveUrl} />
              <ArrowUpRight className="absolute right-3 top-3 h-4 w-4 text-white/20 transition-colors group-hover:text-white/60" />
            </div>
            <div className="p-4">
              <h3 className="truncate text-sm font-medium text-white">{p.name}</h3>
              <div className="mt-1.5 flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] uppercase tracking-wide ${st.text}`}
                >
                  <Circle className={`h-1.5 w-1.5 ${st.dot.replace("bg-", "fill-")}`} />
                  {st.label}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-white/30">
                  <Clock className="h-3 w-3" />
                  {relativeTime(p.updatedAtIso)}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="aspect-video animate-pulse bg-white/[0.05]" />
          <div className="space-y-2 p-4">
            <div className="h-3.5 w-32 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-3 w-24 animate-pulse rounded bg-white/[0.04]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyProjects() {
  return (
    <EmptyState
      icon={FolderOpen}
      title="No projects yet"
      body="Describe what you want to build in the composer above and Hanzo will generate it. Your projects appear here."
    />
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
        <Icon className="h-6 w-6 text-white/50" />
      </div>
      <h3 className="font-medium text-white">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-white/40">{body}</p>
      {action && (
        <a
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
        >
          {action.label}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
