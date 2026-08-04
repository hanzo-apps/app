"use client";

import { Button } from '@hanzo/ui';
import { SizableText, YStack, XStack, H1, Paragraph, H2, H3 } from '@hanzo/gui';
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Github } from "lucide-react";
import Header from "@/components/layout/header";
import Reveal from "@/components/landing/reveal";
import LazySection from "@/components/landing/lazy-section";
import { TemplateThumb } from "@/components/template-thumb";
import { BuildComposer, type ComposerMode } from "@/components/build-composer";
import { ProjectThumb } from "@/components/project-thumb";

// Below-the-fold sections: code-split out of the initial bundle and mounted on
// scroll via <LazySection>. The hero (Header + composer) stays eager so it paints
// instantly; these chunks load as the viewport approaches each one.
const HeroPreview = dynamic(() => import("@/components/landing/hero-preview"), { ssr: false });
const LogoWall = dynamic(() => import("@/components/landing/logo-wall"), { ssr: false });
const CloudIntegration = dynamic(() => import("@/components/landing/cloud-integration"), { ssr: false });
const ModelsStrip = dynamic(() => import("@/components/landing/models-strip"), { ssr: false });
const HanzoModels = dynamic(() => import("@/components/landing/hanzo-models"), { ssr: false });
const HowItWorks = dynamic(() => import("@/components/landing/how-it-works"), { ssr: false });
const Comparison = dynamic(() => import("@/components/landing/comparison"), { ssr: false });
const SiteFooter = dynamic(() => import("@/components/landing/site-footer"), { ssr: false });
const PreFooterCTA = dynamic(() => import("@/components/landing/site-footer").then((m) => m.PreFooterCTA), { ssr: false });
import { builderLink } from "@/lib/api/projects";
import { useUser } from "@/hooks/useUser";
import {
  type GalleryTemplate,
  snapshotCatalog,
  popularTemplates,
} from "@/lib/gallery-catalog";

interface LandingProject {
  slug: string;
  org?: string;
  name: string;
  status: string;
  liveUrl: string | null;
  updatedAtIso: string | null;
}

// Honest app-type starters (not fabricated products) — shown as pills.
const STARTERS = [
  "Internal admin dashboard",
  "AI support chatbot",
  "SaaS app with billing",
  "Marketplace with auth",
  "Realtime chat app",
];

// Typewriter phrases for the composer — the same honest app types, phrased as
// natural completions of "Ask Hanzo to build …".
const TYPED = [
  "a customer portal with login and a dashboard",
  "an AI support chatbot trained on my docs",
  "a SaaS app with Stripe billing and auth",
  "a marketplace with listings and checkout",
  "a realtime chat app with presence",
];

export default function LandingPage() {
  const { openLoginWindow, user } = useUser();
  const router = useRouter();
  const [projects, setProjects] = useState<LandingProject[]>([]);
  // A few real gallery templates surfaced beside the prompt: the bundled
  // snapshot seeds them instantly, then the live catalog (gallery.hanzo.ai)
  // refreshes below.
  const [starterTemplates, setStarterTemplates] = useState<GalleryTemplate[]>(
    () => popularTemplates(snapshotCatalog().templates, 4),
  );

  // Fetch the user's REAL projects from the ONE canonical org store (the same
  // same-origin /v1/projects BFF console + the dashboard use). The builder opens
  // at the canonical nice URL (/dev/<org>/<slug>).
  useEffect(() => {
    if (!user) return;
    fetch("/v1/projects", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then(
        (
          rows: Array<{
            slug: string;
            org?: string;
            name?: string;
            status?: string;
            liveUrl?: string;
            updatedAt?: number;
            createdAt?: number;
          }>,
        ) =>
          setProjects(
            (Array.isArray(rows) ? rows : []).map((p) => ({
              slug: p.slug,
              org: p.org,
              name: p.name || p.slug,
              status: p.status || "draft",
              // Servable host: live → bare <slug>.hanzo.app (a legacy two-label
              // liveUrl never resolves and would break the thumbnail iframe);
              // else a bound custom (non-hanzo) domain, else none.
              liveUrl:
                p.status === "live"
                  ? `https://${p.slug}.hanzo.app`
                  : p.liveUrl && !p.liveUrl.includes(".hanzo.app")
                    ? p.liveUrl
                    : null,
              updatedAtIso: p.updatedAt
                ? new Date(p.updatedAt * 1000).toISOString()
                : p.createdAt
                  ? new Date(p.createdAt * 1000).toISOString()
                  : null,
            })),
          ),
      )
      .catch(() => setProjects([]));
  }, [user]);

  // Refresh the starter templates from the live gallery catalog (same-origin
  // proxy → gallery.hanzo.ai). Snapshot already painted, so this only upgrades.
  useEffect(() => {
    let alive = true;
    fetch("/v1/gallery")
      .then((res) => res.json())
      .then((data) => {
        if (alive && Array.isArray(data.templates) && data.templates.length) {
          setStarterTemplates(popularTemplates(data.templates, 4));
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // ONE submit for both composers (hero + final CTA): persist the seed, bounce
  // anon visitors through login, land signed-in users straight in the builder.
  const startBuild = (text: string, mode: ComposerMode) => {
    localStorage.setItem("initialPrompt", text);
    localStorage.setItem("initialMode", mode);
    if (!user) {
      localStorage.setItem("redirectAfterLogin", "/dev");
      openLoginWindow();
      return;
    }
    router.push("/dev");
  };

  // One-click start from a real template: fork it into the builder via the same
  // wire `/gallery` uses (`/dev` resolves the slug and auto-seeds the first
  // generation). Middleware preserves this deep link through login, so an anon
  // visitor lands back on the exact template after signing in.
  const startFromTemplate = (t: GalleryTemplate) => {
    router.push(`/dev?template=hanzo-apps/${t.slug}&action=edit`);
  };

  return (
    <SizableText position="relative" minHeight="100%" backgroundColor="$background" color="$color" overflow="hidden" display="flex" flexDirection="column" className="landing-root">
      {/* Monochrome hero glow — single soft white radial, zero hue. */}
      <YStack pointerEvents="none" position="fixed" top={0} right={0} bottom={0} left={0} zIndex={0} overflow="hidden">
        <YStack position="absolute" left="50%" top="-12%" height={560} width={900} x="50%" borderRadius="$10" backgroundColor="$color" />
      </YStack>

      <Header />

      <YStack position="relative" zIndex={10}>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <YStack paddingHorizontal="$4" paddingBottom="$9" paddingTop="$10" $md={{ paddingHorizontal: "$6", paddingBottom: "$11", paddingTop: "$12" }}>
          <SizableText alignSelf="center" maxWidth={768} textAlign="center" display="flex" flexDirection="column">
            <Reveal>
              <XStack marginBottom="$4.5" alignItems="center" gap="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color" paddingHorizontal="$3" paddingVertical="$1.5">
                <SizableText height="$1.5" width="$1.5" borderRadius="$10" backgroundColor="$color" />
                <SizableText fontFamily="$mono" fontSize={11} color="$color">
                  Sites, wired to real data &amp; AI
                </SizableText>
              </XStack>
            </Reveal>

            <Reveal delay={60}>
              <H1 color="1.9rem" fontWeight="500" lineHeight={1.05} letterSpacing={-0.4} $sm={{ fontSize: "$12" }} $md={{ fontSize: "$13" }}>
                {/* The space is explicit: JSX drops the whitespace around the <br>,
                    and the <br> is hidden below sm — without it the mobile heading
                    reads "Describe your app.Hanzo builds and ships it." */}
                Describe your app.{' '}
                <br className="break-sm" />
                Hanzo builds and ships it.
              </H1>
            </Reveal>

            <Reveal delay={120}>
              <Paragraph alignSelf="center" marginTop="$4.5" maxWidth={576} fontSize="$4" color="$color" $md={{ fontSize: "$6" }}>
                One prompt becomes a live app on Hanzo Cloud — UI, database,
                auth, and 400+ AI models, wired in and deployed.
              </Paragraph>
            </Reveal>

            {/* ── Prompt composer — the ONE BuildComposer ── */}
            <Reveal delay={180}>
              <SizableText id="build" alignSelf="center" marginTop="$6" maxWidth={672} textAlign="left" display="flex" flexDirection="column">
                <BuildComposer
                  showPill={false}
                  subline={false}
                  typewriter={TYPED}
                  starters={STARTERS}
                  onSubmit={startBuild}
  />

                {/* Or start from one of our great templates — one click forks it
                    into the builder, seeded from that template. */}
                {starterTemplates.length > 0 && (
                  <YStack marginTop="$5">
                    <SizableText marginBottom="$3" alignItems="center" justifyContent="center" gap="$2.5" fontFamily="$mono" fontSize={11} color="$color" display="flex" flexDirection="row">
                      <SizableText height={1} width="$5" backgroundColor="$borderColor" />
                      or start from a template
                      <SizableText height={1} width="$5" backgroundColor="$borderColor" />
                    </SizableText>
                    <YStack alignSelf="center" $lg={{ maxWidth: 896 }}>
                      <YStack gap="$2.5">
                        {starterTemplates.map((t) => (
                          <Button
                            key={t.slug}
                            type="button"
                            onClick={() => startFromTemplate(t)}
                            group className="zoom-scope" overflow="hidden" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color" hoverStyle={{ borderColor: "$color", backgroundColor: "$color" }}
                          >
                            <YStack position="relative" overflow="hidden" backgroundColor="$color">
                              <TemplateThumb
                                name={t.displayName}
                                category={t.category}
                                slug={t.slug}
                                className="zoom-target"
  />
                            </YStack>
                            <YStack paddingHorizontal="$2.5" paddingVertical="$2">
                              <Paragraph numberOfLines={1} fontSize="$1" fontWeight="500" color="$color">
                                {t.displayName}
                              </Paragraph>
                              <Paragraph numberOfLines={1} fontSize={11} color="$color">
                                {t.category}
                              </Paragraph>
                            </YStack>
                          </Button>
                        ))}
                      </YStack>
                    </YStack>
                    <SizableText marginTop="$3" textAlign="center" display="flex" flexDirection="column">
                      <Link
                        href="/gallery"
                      ><SizableText fontSize="$1" color="$color" hoverStyle={{ color: "$color" }}>
                        Browse all templates →
                      </SizableText></Link>
                    </SizableText>
                  </YStack>
                )}

                <SizableText marginTop="$5" flexDirection="column" alignItems="center" gap="$2" fontSize="$1" color="$color" display="flex">
                  <p>
                    Every app ships on Hanzo Cloud with database, auth, and AI
                    built in.
                  </p>
                  <Link
                    href="/new"
                  ><SizableText alignItems="center" gap="$1.5" color="$color" hoverStyle={{ color: "$color" }}>
                    <Github size={14} />
                    or import an existing GitHub repo
                  </SizableText></Link>
                </SizableText>
              </SizableText>
            </Reveal>
          </SizableText>

          {/* Hero focal visual — the builder building an app, live. Lazy: it sits
              just below the composer, so it mounts the moment it nears view. */}
          <YStack marginTop="$10" $md={{ marginTop: "$11" }}>
            <LazySection minHeight={520} rootMargin="900px 0px">
              <Reveal delay={240}>
                <HeroPreview />
              </Reveal>
            </LazySection>
          </YStack>
        </YStack>

        <LazySection minHeight={180}><LogoWall /></LazySection>
        <LazySection minHeight={420}><CloudIntegration /></LazySection>
        <LazySection minHeight={320}><ModelsStrip /></LazySection>
        <LazySection minHeight={360}><HanzoModels /></LazySection>
        <LazySection minHeight={320}><HowItWorks /></LazySection>
        <LazySection minHeight={640}><Comparison /></LazySection>

        {/* ── Continue building (logged-in) ── */}
        {user && projects.length > 0 && (
          <YStack borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$12" }}>
            <YStack alignSelf="center" maxWidth={1152}>
              <XStack marginBottom="$7" alignItems="flex-end" justifyContent="space-between">
                <div>
                  <H2 fontSize="$8" fontWeight="500" letterSpacing={-0.4} $md={{ fontSize: "$10" }}>
                    Continue building
                  </H2>
                  <Paragraph marginTop="$1.5" fontSize="$3" color="$color">
                    Jump back into your recent projects.
                  </Paragraph>
                </div>
                <Link
                  href="/projects"
                ><SizableText fontSize="$3" color="$color" hoverStyle={{ color: "$color" }}>
                  View all →
                </SizableText></Link>
              </XStack>

              <YStack gap="$4">
                {projects.slice(0, 4).map((project) => (
                  <Button
                    key={project.slug}
                    onClick={() => router.push(builderLink(project.slug, project.org))}
                    group overflow="hidden" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color" hoverStyle={{ borderColor: "$color", backgroundColor: "$color" }}
                  >
                    <ProjectThumb name={project.name} liveUrl={project.liveUrl} />
                    <YStack padding="$4.5">
                      <H3 fontSize="$3" fontWeight="500" color="$color" $md={{ fontSize: "$4" }}>
                        {project.name}
                      </H3>
                      <Paragraph marginTop="$1" numberOfLines={2} fontSize="$1" color="$color" $md={{ fontSize: "$3" }}>
                        {project.status === "live" ? "Live" : "Draft"}
                      </Paragraph>
                      {project.updatedAtIso && (
                        <SizableText marginTop="$3" fontFamily="$mono" fontSize={11} color="$color" display="flex" flexDirection="column">
                          {new Date(project.updatedAtIso).toLocaleDateString()}
                        </SizableText>
                      )}
                    </YStack>
                  </Button>
                ))}
              </YStack>
            </YStack>
          </YStack>
        )}

        {/* ── Final CTA — the SAME composer as the hero, ready to type ── */}
        <YStack borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$12" $md={{ paddingHorizontal: "$6", paddingVertical: "$14" }}>
          <Reveal alignSelf="center" width="100%" maxWidth={672}>
            <SizableText textAlign="center" display="flex" flexDirection="column">
              <H2 fontSize="$10" fontWeight="500" letterSpacing={-0.4} $md={{ fontSize: "$12" }}>
                Ship your first app today.
              </H2>
              <Paragraph alignSelf="center" marginTop="$4" maxWidth={448} fontSize="$4" color="$color" $md={{ fontSize: "$6" }}>
                Start with a sentence. Deploy to Hanzo Cloud in one click.
              </Paragraph>
            </SizableText>
            <YStack marginTop="$6">
              <BuildComposer
                showPill={false}
                typewriter={TYPED}
                onSubmit={startBuild}
  />
            </YStack>
          </Reveal>
        </YStack>
      </YStack>

      <LazySection minHeight={200}><PreFooterCTA /></LazySection>
      <LazySection minHeight={240}><SiteFooter /></LazySection>
    </SizableText>
  );
}
