"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Github } from "lucide-react";
import Header from "@/components/layout/header";
import Reveal from "@/components/landing/reveal";
import HeroPreview from "@/components/landing/hero-preview";
import LogoWall from "@/components/landing/logo-wall";
import CloudIntegration from "@/components/landing/cloud-integration";
import ModelsStrip from "@/components/landing/models-strip";
import HanzoModels from "@/components/landing/hanzo-models";
import HowItWorks from "@/components/landing/how-it-works";
import Comparison from "@/components/landing/comparison";
import SiteFooter from "@/components/landing/site-footer";
import { TemplateThumb } from "@/components/template-thumb";
import { BuildComposer, type ComposerMode } from "@/components/build-composer";
import { ProjectThumb } from "@/components/project-thumb";
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
    <div className="landing-root relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Monochrome hero glow — single soft white radial, zero hue. */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-12%] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-foreground/[0.06] blur-[130px]" />
      </div>

      <Header />

      <main className="relative z-10">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="px-4 pb-14 pt-16 md:px-8 md:pb-20 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.03] px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/70" />
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground/55">
                  Sites, wired to real data &amp; AI
                </span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="text-balance text-[1.9rem] font-medium leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
                Describe your app.
                <br className="hidden sm:block" />
                Hanzo builds and ships it.
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-foreground/55 md:text-lg">
                One prompt becomes a live app on Hanzo Cloud — UI, database,
                auth, and 400+ AI models, wired in and deployed.
              </p>
            </Reveal>

            {/* ── Prompt composer — the ONE BuildComposer ── */}
            <Reveal delay={180}>
              <div id="build" className="mx-auto mt-8 max-w-2xl text-left">
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
                  <div className="mt-6">
                    <div className="mb-3 flex items-center justify-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-foreground/50">
                      <span className="h-px w-6 bg-border" />
                      or start from a template
                      <span className="h-px w-6 bg-border" />
                    </div>
                    <div className="mx-auto lg:max-w-4xl">
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        {starterTemplates.map((t) => (
                          <button
                            key={t.slug}
                            type="button"
                            onClick={() => startFromTemplate(t)}
                            className="group overflow-hidden rounded-xl border border-border bg-foreground/[0.02] text-left transition-all hover:border-foreground/25 hover:bg-foreground/[0.04]"
                          >
                            <div className="relative aspect-[16/10] overflow-hidden bg-foreground/[0.02]">
                              <TemplateThumb
                                name={t.displayName}
                                category={t.category}
                                slug={t.slug}
                                className="transition-transform duration-300 group-hover:scale-[1.04]"
                              />
                            </div>
                            <div className="px-2.5 py-2">
                              <p className="truncate text-xs font-medium text-foreground/80">
                                {t.displayName}
                              </p>
                              <p className="truncate text-[11px] text-foreground/55">
                                {t.category}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <Link
                        href="/gallery"
                        className="text-xs text-foreground/40 transition-colors hover:text-foreground"
                      >
                        Browse all templates →
                      </Link>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-col items-center gap-2 text-xs text-foreground/35">
                  <p>
                    Every app ships on Hanzo Cloud with database, auth, and AI
                    built in.
                  </p>
                  <Link
                    href="/new"
                    className="inline-flex items-center gap-1.5 text-foreground/45 transition-colors hover:text-foreground"
                  >
                    <Github className="h-3.5 w-3.5" />
                    or import an existing GitHub repo
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Hero focal visual — the builder building an app, live. */}
          <Reveal delay={240} className="mt-16 md:mt-20">
            <HeroPreview />
          </Reveal>
        </section>

        <LogoWall />
        <CloudIntegration />
        <ModelsStrip />
        <HanzoModels />
        <HowItWorks />
        <Comparison />

        {/* ── Continue building (logged-in) ── */}
        {user && projects.length > 0 && (
          <section className="border-t border-border px-4 py-20 md:px-8 md:py-24">
            <div className="mx-auto max-w-6xl">
              <div className="mb-10 flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
                    Continue building
                  </h2>
                  <p className="mt-1.5 text-sm text-foreground/50">
                    Jump back into your recent projects.
                  </p>
                </div>
                <Link
                  href="/projects"
                  className="text-sm text-foreground/50 transition-colors hover:text-foreground"
                >
                  View all →
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {projects.slice(0, 4).map((project) => (
                  <button
                    key={project.slug}
                    onClick={() => router.push(builderLink(project.slug, project.org))}
                    className="group overflow-hidden rounded-2xl border border-border bg-foreground/[0.02] text-left transition-all duration-200 hover:border-foreground/20 hover:bg-foreground/[0.03]"
                  >
                    <ProjectThumb name={project.name} liveUrl={project.liveUrl} />
                    <div className="p-5">
                      <h3 className="text-sm font-medium text-foreground md:text-base">
                        {project.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-foreground/50 md:text-sm">
                        {project.status === "live" ? "Live" : "Draft"}
                      </p>
                      {project.updatedAtIso && (
                        <div className="mt-3 font-mono text-[11px] text-foreground/30">
                          {new Date(project.updatedAtIso).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Final CTA — the SAME composer as the hero, ready to type ── */}
        <section className="border-t border-border px-4 py-24 md:px-8 md:py-32">
          <Reveal className="mx-auto max-w-2xl">
            <div className="text-center">
              <h2 className="text-3xl font-medium tracking-tight md:text-5xl">
                Ship your first app today.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-base text-foreground/55 md:text-lg">
                Start with a sentence. Deploy to Hanzo Cloud in one click.
              </p>
            </div>
            <div className="mt-8">
              <BuildComposer
                showPill={false}
                typewriter={TYPED}
                onSubmit={startBuild}
              />
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
