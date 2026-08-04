"use client";

import { LoadingScreen } from "@/components/ui/loading-screen";
import { XStack, SizableText, Paragraph, YStack, Image, H3, Anchor } from '@hanzo/gui';
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent, Button } from '@hanzo/ui';
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
      <LoadingScreen>{loading ? "Loading your workspace…" : "Redirecting to login…"}</LoadingScreen>
    );
  }

  const greetingName = user.fullname || user.name || "there";

  return (
    <AppShell currentView="dashboard">
      <YStack flex={1} backgroundColor="$background" overflow="scroll">
        {/* ── Hero viewport: ONLY the centered composer until you scroll ── */}
        {/* Fill the scroll viewport — `100%` of a parent that is now definite,
            which is also the one spelling that is right on both sizes (below md
            the parent already excludes the mobile top bar). It was
            `calc(100dvh-4rem)`: CSS requires whitespace around `-`, so the
            declaration was invalid, the min-height was 0, and the hero shrank to
            its content — which is what drove the absolutely-positioned scroll
            hint up into the composer. `paddingBottom` reserves the hint's own
            band so it cannot touch the content even when the hero has to grow. */}
        <YStack position="relative" minHeight="100%" justifyContent="flex-start" paddingTop="14vh" paddingBottom="$12" paddingHorizontal="$4" $md={{ justifyContent: "center", paddingTop: "$0" }}>
          <BuildComposer greetingName={greetingName} showPill />

          {/* Scroll invitation — the projects panel waits below the fold. */}
          <Button
            type="button"
            onClick={() =>
              document
                .getElementById("projects-panel")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            variant="ghost"
            group position="absolute" bottom="$5" left="50%" x="-50%" flexDirection="column" alignItems="center" gap="$1"
          >
            <SizableText fontFamily="$mono" fontSize={10} color="$color11" $group-hover={{ color: "$color" }}>
              Your projects
            </SizableText>
            <ChevronDown size={16} />
          </Button>
        </YStack>

        {/* ── Projects: a rounded panel that slides up as you scroll ── */}
        <YStack id="projects-panel" alignSelf="center" maxWidth={1152} paddingHorizontal="$4" paddingBottom="$12" $sm={{ paddingHorizontal: "$5" }}>
          <Reveal>
            <YStack borderRadius="1.75rem" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$4.5" elevation={6} $md={{ padding: "$6" }}>
              <Tabs value={tab} onValueChange={setTab} width="100%">
                <XStack marginBottom="$4.5" flexWrap="wrap" alignItems="center" justifyContent="space-between" gap="$3" borderBottomWidth={1} borderColor="$borderColor" paddingBottom="$3">
                  <TabsList backgroundColor="transparent" padding="$0">
                    <TabsTrigger value="mine">
                      My projects
                    </TabsTrigger>
                    <TabsTrigger value="recent">
                      Recently viewed
                    </TabsTrigger>
                    <TabsTrigger value="visitors">
                      Most visitors today
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                      Templates
                    </TabsTrigger>
                  </TabsList>

                  <Link
                    href={tab === "templates" ? "/templates" : "/projects"}
                  ><SizableText fontSize="$3" color="$color11" hoverStyle={{ color: "$color" }}>
                    Browse all →
                  </SizableText></Link>
                </XStack>

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

                {/* Templates — a peek at the gallery; Browse all → /templates. */}
                <TabsContent value="templates">
                  <YStack gap="$4">
                    {templates.map((t) => (
                      <Link
                        key={t.slug}
                        href="/templates"
                      ><XStack group className="zoom-scope" overflow="hidden" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" hoverStyle={{ y: "-0.5", borderColor: "$color" }}>
                        <YStack position="relative" overflow="hidden" backgroundColor="$background">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <Image
                            src={t.screenshotUrl}
                            alt={`${t.displayName} preview`}
                            loading="lazy"
                            height="100%" width="100%" objectFit="cover" objectPosition="top" className="zoom-target"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.opacity = "0";
                            }}
  />
                        </YStack>
                        <YStack padding="$3">
                          <Paragraph numberOfLines={1} fontSize="$3" fontWeight="500" color="$color">{t.displayName}</Paragraph>
                          <Paragraph numberOfLines={1} fontSize="$1" color="$color11">{t.category}</Paragraph>
                        </YStack>
                      </XStack></Link>
                    ))}
                  </YStack>
                </TabsContent>
              </Tabs>
            </YStack>
          </Reveal>
        </YStack>
      </YStack>
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
    <YStack gap="$4">
      {projects.map((p) => {
        // ONE four-state status map (live/building/error/draft) — a failed deploy
        // never looks like an untouched draft. See lib/project-status.
        const st = statusOf(p.status);
        return (
          <Button
            key={p.id}
            onClick={() => onOpen(p)}
            group overflow="hidden" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" hoverStyle={{ y: "-0.5", borderColor: "$color", backgroundColor: "$color3" }}
          >
            {/* Real thumbnail: the live site itself (inert); monogram otherwise. */}
            <YStack position="relative">
              <ProjectThumb name={p.name} liveUrl={p.liveUrl} />
              <ArrowUpRight size={16} />
            </YStack>
            <YStack padding="$4">
              <H3 numberOfLines={1} fontSize="$3" fontWeight="500" color="$color">{p.name}</H3>
              <XStack marginTop="$1.5" alignItems="center" gap="$3">
                <XStack alignItems="center" gap="$1">
                  <Circle size={6} />
                  <SizableText fontSize={11} letterSpacing={0.4} color={st.text}>{st.label}</SizableText>
                </XStack>
                <XStack alignItems="center" gap="$1">
                  <Clock size={12} />
                  <SizableText fontSize={11} color="$color11">{relativeTime(p.updatedAtIso)}</SizableText>
                </XStack>
              </XStack>
            </YStack>
          </Button>
        );
      })}
    </YStack>
  );
}

function ProjectsSkeleton() {
  return (
    <YStack gap="$4" aria-hidden>
      {[0, 1, 2].map((i) => (
        <YStack key={i} overflow="hidden" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$background">
          <YStack backgroundColor="$color3" />
          <YStack rowGap="$2" padding="$4">
            <YStack height="$3.5" width="$14" borderRadius="$2" backgroundColor="$color3" />
            <YStack height="$3" width="$12" borderRadius="$2" backgroundColor="$color3" />
          </YStack>
        </YStack>
      ))}
    </YStack>
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
    <YStack borderRadius="$8" borderWidth={1} borderStyle="dashed" borderColor="$borderColor" backgroundColor="$background" padding="$8">
      <XStack alignSelf="center" marginBottom="$4" height="$8" width="$8" alignItems="center" justifyContent="center" borderRadius="$6" backgroundColor="$color3">
        <Icon size={24} color="var(--muted-foreground)" />
      </XStack>
      <H3 fontWeight="500" color="$color" textAlign="center">{title}</H3>
      <Paragraph alignSelf="center" marginTop="$1" maxWidth={448} fontSize="$3" color="$color11" textAlign="center">{body}</Paragraph>
      {action && (
        <Anchor
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          marginTop="$4" alignItems="center" gap="$1.5" fontSize="$3" color="$color11" hoverStyle={{ color: "$color" }}
        >
          {action.label}
          <ArrowUpRight size={14} />
        </Anchor>
      )}
    </YStack>
  );
}
