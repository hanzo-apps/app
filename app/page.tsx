"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  Plus,
  Loader2,
  Globe2,
  Mic,
  Github,
  ArrowRight,
  CornerDownLeft,
} from "lucide-react";
import Header from "@/components/layout/header";
import Reveal from "@/components/landing/reveal";
import HeroPreview from "@/components/landing/hero-preview";
import LogoWall from "@/components/landing/logo-wall";
import CloudIntegration from "@/components/landing/cloud-integration";
import ModelsStrip from "@/components/landing/models-strip";
import HowItWorks from "@/components/landing/how-it-works";
import SiteFooter from "@/components/landing/site-footer";
import { useUser } from "@/hooks/useUser";
import {
  type GalleryTemplate,
  snapshotCatalog,
  popularTemplates,
} from "@/lib/gallery-catalog";

interface Project {
  namespace: string;
  id: string;
  name: string;
  emoji: string;
  short_description?: string;
  created_at: string;
  updated_at: string;
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
  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [inputFocused, setInputFocused] = useState(false);
  // A few real gallery templates surfaced beside the prompt: the bundled
  // snapshot seeds them instantly, then the live catalog (gallery.hanzo.ai)
  // refreshes below.
  const [starterTemplates, setStarterTemplates] = useState<GalleryTemplate[]>(
    () => popularTemplates(snapshotCatalog().templates, 4),
  );

  // Animated typewriter placeholder — pauses once the user focuses or types.
  const [typed, setTyped] = useState("");
  const idle = !inputFocused && prompt.length === 0;
  const phraseRef = useRef(0);
  const charRef = useRef(0);
  const delRef = useRef(false);
  useEffect(() => {
    if (!idle) return;
    // Respect reduced-motion (as the Reveal entrances do): show the first phrase
    // statically instead of a perpetual typewriter loop.
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setTyped(TYPED[0]);
      return;
    }
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const phrase = TYPED[phraseRef.current % TYPED.length];
      if (!delRef.current) {
        charRef.current += 1;
        setTyped(phrase.slice(0, charRef.current));
        if (charRef.current >= phrase.length) {
          delRef.current = true;
          t = setTimeout(tick, 1800); // hold the full phrase
          return;
        }
        t = setTimeout(tick, 38);
      } else {
        charRef.current -= 1;
        setTyped(phrase.slice(0, Math.max(0, charRef.current)));
        if (charRef.current <= 0) {
          delRef.current = false;
          phraseRef.current += 1;
          t = setTimeout(tick, 320);
          return;
        }
        t = setTimeout(tick, 18);
      }
    };
    t = setTimeout(tick, 400);
    return () => clearTimeout(t);
  }, [idle]);

  // Fetch the user's REAL projects from the ONE canonical org store (the same
  // same-origin /v1/projects BFF console + the dashboard use). Mapped to the
  // landing card shape; the builder opens by slug (/dev?project=<slug>).
  useEffect(() => {
    if (!user) return;
    fetch("/v1/projects", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: Array<{ id: string; slug: string; name?: string; status?: string; createdAt?: number }>) =>
        setProjects(
          (Array.isArray(rows) ? rows : []).map((p) => ({
            namespace: p.slug,
            id: p.slug,
            name: p.name || p.slug,
            emoji: "◆",
            short_description: p.status === "live" ? "Live" : "Draft",
            created_at: p.createdAt ? new Date(p.createdAt * 1000).toISOString() : "",
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

  const handleCreateProject = () => {
    if (!prompt.trim()) return;
    // Persist the prompt so the builder can pick it up post-login.
    localStorage.setItem("initialPrompt", prompt);
    if (!user) {
      localStorage.setItem("redirectAfterLogin", "/dev");
      openLoginWindow();
      return;
    }
    setIsCreating(true);
    // `/dev` is the builder IDE; it reads localStorage.initialPrompt and starts
    // generating immediately. `/new` is the Git-import surface.
    router.push("/dev");
  };

  // One-click start from a real template: fork it into the builder via the same
  // wire `/gallery` uses (`/dev` resolves the slug and auto-seeds the first
  // generation). Middleware preserves this deep link through login, so an anon
  // visitor lands back on the exact template after signing in.
  const startFromTemplate = (t: GalleryTemplate) => {
    router.push(`/dev?template=hanzo-apps/${t.slug}&action=edit`);
  };

  const placeholder = idle
    ? `Ask Hanzo to build ${typed}█`
    : "Ask Hanzo to build a customer portal with login and a dashboard…";

  return (
    <div className="landing-root relative min-h-screen overflow-x-hidden bg-black text-white">
      {/* Monochrome hero glow — single soft white radial, zero hue. */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-12%] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-white/[0.06] blur-[130px]" />
      </div>

      <Header />

      <main className="relative z-10">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="px-4 pb-14 pt-16 md:px-8 md:pb-20 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/55">
                  Full-stack apps on Hanzo Cloud
                </span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="text-balance text-4xl font-medium leading-[1.02] tracking-tight sm:text-5xl md:text-6xl">
                Describe your app.
                <br />
                Hanzo builds and ships it.
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-white/55 md:text-lg">
                One prompt becomes a live app on Hanzo Cloud — UI, database,
                auth, and 100+ AI models, wired in and deployed.
              </p>
            </Reveal>

            {/* ── Prompt composer ── */}
            <Reveal delay={180}>
              <div className="mx-auto mt-8 max-w-2xl">
                <div
                  id="build"
                  className={`rounded-2xl border bg-[#0a0a0a] p-2.5 text-left shadow-2xl transition-all duration-200 ${
                    inputFocused
                      ? "border-white/25 shadow-black/60"
                      : "border-white/10"
                  }`}
                >
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder={placeholder}
                    className="w-full bg-transparent px-3 pb-2 pt-3 text-base text-white placeholder:text-white/30 focus:outline-none md:text-lg"
                    disabled={isCreating}
                  />
                  <div className="flex items-center justify-between px-1 pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Attach"
                        className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white/70"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white/70"
                      >
                        <Globe2 className="h-4 w-4" />
                        <span className="text-xs">Public</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="hidden items-center gap-1 pr-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/25 sm:flex">
                        <CornerDownLeft className="h-3 w-3" />
                        to build
                      </span>
                      <button
                        type="button"
                        aria-label="Voice"
                        className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white/70"
                      >
                        <Mic className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateProject}
                        disabled={isCreating || !prompt.trim()}
                        aria-label="Start building"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
                      >
                        {isCreating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Starter prompts — honest app types, not fabricated products. */}
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPrompt(s)}
                      className="rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1.5 text-xs text-white/60 transition-all hover:border-white/20 hover:text-white"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Or start from one of our great templates — one click forks it
                    into the builder, seeded from that template. */}
                {starterTemplates.length > 0 && (
                  <div className="mt-6">
                    <div className="mb-3 flex items-center justify-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/30">
                      <span className="h-px w-6 bg-white/10" />
                      or start from a template
                      <span className="h-px w-6 bg-white/10" />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {starterTemplates.map((t) => (
                        <button
                          key={t.slug}
                          type="button"
                          onClick={() => startFromTemplate(t)}
                          className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] text-left transition-all hover:border-white/25 hover:bg-white/[0.04]"
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
                          <div className="px-2.5 py-2">
                            <p className="truncate text-xs font-medium text-white/80">
                              {t.displayName}
                            </p>
                            <p className="truncate text-[11px] text-white/35">
                              {t.category}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 text-center">
                      <Link
                        href="/gallery"
                        className="text-xs text-white/40 transition-colors hover:text-white"
                      >
                        Browse all templates →
                      </Link>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-col items-center gap-2 text-xs text-white/35">
                  <p>
                    Every app ships on Hanzo Cloud with database, auth, and AI
                    built in.
                  </p>
                  <Link
                    href="/new"
                    className="inline-flex items-center gap-1.5 text-white/45 transition-colors hover:text-white"
                  >
                    <Github className="h-3.5 w-3.5" />
                    or import an existing GitHub repo
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Hero focal visual — the app running live on Hanzo Cloud. */}
          <Reveal delay={240} className="mt-16 md:mt-20">
            <HeroPreview />
          </Reveal>
        </section>

        <LogoWall />
        <CloudIntegration />
        <ModelsStrip />
        <HowItWorks />

        {/* ── Continue building (logged-in) ── */}
        {user && projects.length > 0 && (
          <section className="border-t border-white/[0.06] px-4 py-20 md:px-8 md:py-24">
            <div className="mx-auto max-w-6xl">
              <div className="mb-10 flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
                    Continue building
                  </h2>
                  <p className="mt-1.5 text-sm text-white/50">
                    Jump back into your recent projects.
                  </p>
                </div>
                <Link
                  href="/projects"
                  className="text-sm text-white/50 transition-colors hover:text-white"
                >
                  View all →
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {projects.slice(0, 4).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => router.push(`/dev?project=${encodeURIComponent(project.id)}`)}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] text-left transition-all duration-200 hover:border-white/20 hover:bg-white/[0.03]"
                  >
                    <div className="flex aspect-video items-center justify-center bg-white/[0.02] text-4xl md:text-5xl">
                      {project.emoji || "◆"}
                    </div>
                    <div className="p-5">
                      <h3 className="text-sm font-medium text-white md:text-base">
                        {project.name}
                      </h3>
                      {project.short_description && (
                        <p className="mt-1 line-clamp-2 text-xs text-white/50 md:text-sm">
                          {project.short_description}
                        </p>
                      )}
                      <div className="mt-3 font-mono text-[11px] text-white/30">
                        {new Date(project.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Final CTA ── */}
        <section className="border-t border-white/[0.06] px-4 py-24 md:px-8 md:py-32">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-medium tracking-tight md:text-5xl">
              Ship your first app today.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-white/55 md:text-lg">
              Start with a sentence. Deploy to Hanzo Cloud in one click.
            </p>
            <a
              href="#build"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-all hover:bg-white/90"
            >
              Start building
              <ArrowRight className="h-4 w-4" />
            </a>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
