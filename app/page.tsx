"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import Header from "@/components/layout/header";
import LogoWall from "@/components/landing/logo-wall";
import CloudIntegration from "@/components/landing/cloud-integration";
import ModelsStrip from "@/components/landing/models-strip";
import HowItWorks from "@/components/landing/how-it-works";
import SiteFooter from "@/components/landing/site-footer";
import { useUser } from "@/hooks/useUser";

interface Project {
  namespace: string;
  id: string;
  name: string;
  emoji: string;
  short_description?: string;
  created_at: string;
  updated_at: string;
}

const STARTERS = [
  "Internal admin dashboard",
  "AI support chatbot",
  "SaaS app with billing",
  "Marketplace with auth",
  "Realtime chat app",
];

export default function LandingPage() {
  const { openLoginWindow, user } = useUser();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [inputFocused, setInputFocused] = useState(false);

  // Fetch the user's projects when logged in.
  useEffect(() => {
    if (!user) return;
    fetch("/api/me/projects")
      .then((res) => (res.ok ? res.json() : { projects: [] }))
      .then((data) => setProjects(data.projects || []))
      .catch(() => setProjects([]));
  }, [user]);

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

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Monochrome hero glow — single soft white radial, zero hue. */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-12%] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-white/[0.06] blur-[130px]" />
      </div>

      <Header />

      <main className="relative z-10">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="px-4 pb-16 pt-16 md:px-8 md:pb-24 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/55">
                Full-stack apps on Hanzo Cloud
              </span>
            </div>

            <h1 className="text-balance text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Describe your app.
              <br />
              Hanzo builds and ships it.
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-pretty text-base text-white/55 md:text-lg">
              One prompt becomes a live app on Hanzo Cloud — UI, database, auth,
              and 100+ AI models, wired in and deployed.
            </p>

            {/* ── Prompt composer ── */}
            <div className="mx-auto mt-10 max-w-2xl">
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
                  placeholder="Ask Hanzo to build a customer portal with login and a dashboard…"
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
                  <div className="flex items-center gap-1">
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
              <div className="mt-5 flex flex-wrap justify-center gap-2">
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

              <div className="mt-6 flex flex-col items-center gap-2 text-xs text-white/35">
                <p>Every app ships on Hanzo Cloud with database, auth, and AI built in.</p>
                <Link
                  href="/new"
                  className="inline-flex items-center gap-1.5 text-white/45 transition-colors hover:text-white"
                >
                  <Github className="h-3.5 w-3.5" />
                  or import an existing GitHub repo
                </Link>
              </div>
            </div>
          </div>
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
                    key={`${project.namespace}/${project.id}`}
                    onClick={() =>
                      router.push(`/projects/${project.namespace}/${project.id}`)
                    }
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
          <div className="mx-auto max-w-2xl text-center">
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
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
