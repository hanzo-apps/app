"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Star, Code2, Eye, Github } from "lucide-react";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";
import Reveal from "@/components/landing/reveal";
import {
  type GalleryTemplate,
  catalogCategories,
  snapshotCatalog,
} from "@/lib/gallery-catalog";

// The community showcase is REAL data: the Hanzo template gallery
// (gallery.hanzo.ai — 70+ production, open-source apps under github.com/hanzo-apps).
// Fork any into the builder via the same wire the gallery + landing use: /dev
// parses ?template=owner/repo and clones github.com/hanzo-apps/<slug>. No
// fabricated authors, stars, or metrics — every card links to a real, forkable app.
function forkHref(t: GalleryTemplate, action: "edit" | "deploy" = "edit") {
  return `/dev?template=hanzo-apps/${t.slug}&action=${action}`;
}

export default function CommunityPage() {
  // Seed from the bundled snapshot so first paint is instant + never empty, then
  // upgrade from the live catalog via the same-origin proxy (→ gallery.hanzo.ai).
  const [templates, setTemplates] = useState<GalleryTemplate[]>(
    () => snapshotCatalog().templates,
  );
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/v1/gallery")
      .then((r) => r.json())
      .then((d) => {
        if (alive && Array.isArray(d.templates) && d.templates.length) {
          setTemplates(d.templates);
        }
      })
      .catch(() => {})
      .finally(() => alive && setSyncing(false));
    return () => {
      alive = false;
    };
  }, []);

  const categories = useMemo(() => catalogCategories(templates), [templates]);

  // Honest facts derived from the loaded catalog — no invented metrics.
  const stats = useMemo(() => {
    const catCount = Math.max(0, categories.length - 1); // drop "All"
    const frameworks = new Set(templates.map((t) => t.framework)).size;
    return [
      { value: String(templates.length), label: "Production templates" },
      { value: String(catCount), label: "Categories" },
      { value: String(frameworks), label: "Frameworks" },
      { value: "1-click", label: "Fork to build" },
    ];
  }, [templates, categories]);

  // Best-first within the active category; no fake ranking signal, just the
  // catalog's own rating + tier.
  const shown = useMemo(() => {
    const list =
      selectedCategory === "All"
        ? templates
        : templates.filter((t) => t.category === selectedCategory);
    return [...list].sort((a, b) => b.rating - a.rating || a.tier - b.tier);
  }, [templates, selectedCategory]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-4 py-20 text-center md:px-8 md:py-28">
          {/* Monochrome glow — single soft white radial, zero hue. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-[-30%] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-white/[0.05] blur-[130px]" />
          </div>

          <div className="relative mx-auto max-w-3xl">
            <Reveal>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/55">
                  {templates.length} open-source templates
                </span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="text-balance text-4xl font-medium leading-[1.03] tracking-tight sm:text-5xl md:text-6xl">
                Fork a real app.
                <br />
                Ship it live.
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-white/55 md:text-lg">
                Browse production-grade, open-source templates from the Hanzo
                community. Fork any into the builder and deploy it to a live{" "}
                <code className="font-mono text-white/75">*.hanzo.app</code> URL —
                real, running apps, no fake demos.
              </p>
            </Reveal>

            <Reveal delay={180}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/dev"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-all hover:bg-white/90"
                >
                  Start building
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#templates"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.02] px-6 py-3 text-sm font-medium text-white transition-all hover:border-white/30 hover:bg-white/[0.05]"
                >
                  Browse templates
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Stat strip (real, catalog-derived) ───────────────── */}
        <section className="border-y border-white/[0.06] px-4 py-10 md:px-8">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-mono text-3xl font-medium tracking-tight text-white md:text-4xl">
                  {s.value}
                </div>
                <div className="mt-1.5 text-sm text-white/45">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Templates ────────────────────────────────────────── */}
        <section id="templates" className="px-4 py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
                    Community templates
                  </h2>
                  <p className="mt-1.5 text-sm text-white/50">
                    Every template forks into the editor and deploys live in one
                    click.
                    {syncing ? (
                      <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white/30">
                        syncing…
                      </span>
                    ) : null}
                  </p>
                </div>
                <Link
                  href="/gallery"
                  className="text-sm text-white/50 transition-colors hover:text-white"
                >
                  Open full gallery →
                </Link>
              </div>
            </Reveal>

            {/* Category filter */}
            <div className="mb-8 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-white text-black"
                      : "border border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((t) => (
                <div
                  key={t.slug}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-all duration-200 hover:border-white/20 hover:bg-white/[0.03]"
                >
                  {/* Real preview screenshot → fork on click */}
                  <a
                    href={forkHref(t)}
                    className="relative block aspect-[16/10] overflow-hidden bg-white/[0.02]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.screenshotUrl}
                      alt={`${t.displayName} preview`}
                      loading="lazy"
                      className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity = "0";
                      }}
                    />
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 font-mono text-[11px] text-white/80 backdrop-blur">
                      <Star className="h-3 w-3 fill-white/80 text-white/80" />
                      {t.rating}
                    </span>
                    <span className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/70 px-2 py-0.5 text-[11px] text-white/80 backdrop-blur">
                      {t.category}
                    </span>
                  </a>

                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-sm font-medium text-white">
                      {t.displayName}
                    </h3>
                    <p className="mt-1 line-clamp-2 flex-1 text-xs text-white/45">
                      {t.description || t.useCase || `${t.framework} template`}
                    </p>
                    <p className="mt-3 font-mono text-[11px] text-white/30">
                      {t.framework}
                    </p>

                    <div className="mt-4 flex gap-2">
                      <a
                        href={forkHref(t)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-black transition-colors hover:bg-white/90"
                      >
                        <Code2 className="h-3.5 w-3.5" />
                        Fork &amp; Edit
                      </a>
                      <a
                        href={t.templateUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Preview ${t.displayName}`}
                        className="inline-flex items-center justify-center rounded-lg border border-white/15 px-3 py-2 text-white/70 transition-colors hover:border-white/30 hover:text-white"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {shown.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-white/45">No templates in this category yet.</p>
                <button
                  onClick={() => setSelectedCategory("All")}
                  className="mt-2 text-sm text-white/70 transition-colors hover:text-white"
                >
                  Show all templates
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section className="border-t border-white/[0.06] px-4 py-20 md:px-8 md:py-28">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
              Build in the open.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-white/55 md:text-lg">
              Start from a template or a single sentence. Every app ships on Hanzo
              Cloud with database, auth, and AI wired in.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/dev"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-all hover:bg-white/90"
              >
                Start building
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://github.com/hanzo-apps"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.02] px-6 py-3 text-sm font-medium text-white transition-all hover:border-white/30 hover:bg-white/[0.05]"
              >
                <Github className="h-4 w-4" />
                View on GitHub
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
