// Rich per-template detail page body for hanzo.app.
//
// True-black monochrome to match components/landing/* — white text, white/opacity
// borders, zero hue by construction. Server component: it composes the site's
// client pieces (Header, TemplateThumb, Reveal) and the server SiteFooter, but
// needs no client state itself, so it stays lean.
//
// Honesty: every field rendered here comes from the real catalog SOT
// (lib/templates-catalog.ts). The hero reuses <TemplateThumb>, which is
// image-first (the real self-hosted /templates/<slug>.webp when one exists) and
// falls back to the on-brand generated tile otherwise — that behavior is not
// changed here.

import Link from "next/link";
import {
  ChevronRight,
  Code2,
  ArrowUpRight,
  ArrowRight,
  Check,
  Sparkles,
  Layers,
  Zap,
  Boxes,
  Gauge,
  Blocks,
  type LucideIcon,
} from "lucide-react";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";
import Reveal from "@/components/landing/reveal";
import { TemplateThumb } from "@/components/template-thumb";
import { categorySlug, type TemplateEntry } from "@/lib/templates-catalog";

// Decorative, neutral icons for the Key Highlights grid, chosen by position.
// The catalog's highlights carry no icon of their own, so these are purely
// visual rhythm — never a fabricated claim.
const HIGHLIGHT_ICONS: LucideIcon[] = [Sparkles, Layers, Zap, Boxes, Gauge, Blocks];

const EYEBROW = "font-mono text-[11px] uppercase tracking-[0.2em] text-white/40";
const SECTION = "border-t border-white/[0.06] px-4 py-20 md:px-8 md:py-24";

export function TemplateDetail({
  template: t,
  related,
}: {
  template: TemplateEntry;
  related: TemplateEntry[];
}) {
  const catHref = `/templates?category=${categorySlug(t.category)}`;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black text-white">
      {/* Monochrome glow — single soft white radial, zero hue (matches landing). */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-14%] h-[520px] w-[860px] -translate-x-1/2 rounded-full bg-white/[0.05] blur-[130px]" />
      </div>

      <Header />

      <main className="relative z-10">
        {/* ── Breadcrumb + hero ─────────────────────────────────── */}
        <section className="px-4 pt-9 md:px-8 md:pt-14">
          <div className="mx-auto max-w-6xl">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">
                <li>
                  <Link href="/templates" className="transition-colors hover:text-white">
                    Templates
                  </Link>
                </li>
                <li aria-hidden="true">
                  <ChevronRight className="h-3 w-3 text-white/25" />
                </li>
                <li>
                  <Link href={catHref} className="transition-colors hover:text-white">
                    {t.category}
                  </Link>
                </li>
              </ol>
            </nav>

            <div className="mt-8 grid items-center gap-10 lg:mt-10 lg:grid-cols-[1fr_1.25fr] lg:gap-14">
              {/* Left — identity + CTAs */}
              <Reveal>
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] text-white/60">
                    {t.framework}
                  </span>
                  {t.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/40"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <h1 className="text-balance text-3xl font-medium leading-[1.08] tracking-tight sm:text-4xl md:text-[2.9rem]">
                  {t.name}
                </h1>
                <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-white/60 md:text-lg">
                  {t.tagline}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href={t.fork}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition-colors hover:bg-white/90"
                  >
                    <Code2 className="h-4 w-4" />
                    Use template
                  </Link>
                  <a
                    href={t.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.02] px-5 py-3 text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white"
                  >
                    Preview
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </Reveal>

              {/* Right — real shot (or generated tile), clickable → fork */}
              <Reveal delay={80}>
                <Link
                  href={t.fork}
                  aria-label={`Use the ${t.name} template`}
                  className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-2xl shadow-black/40 transition-colors hover:border-white/20"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-white/[0.02]">
                    <TemplateThumb
                      name={t.name}
                      category={t.category}
                      slug={t.slug}
                      className="transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                </Link>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Key highlights ────────────────────────────────────── */}
        {t.keyHighlights.length > 0 && (
          <section className={`${SECTION} mt-8 md:mt-12`}>
            <div className="mx-auto max-w-6xl">
              <Reveal>
                <p className={EYEBROW}>Key highlights</p>
                <h2 className="mt-4 text-3xl font-medium tracking-tight md:text-4xl">
                  What you get out of the box.
                </h2>
              </Reveal>

              <Reveal
                delay={80}
                className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-3"
              >
                {t.keyHighlights.map((h, i) => {
                  const Icon = HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length];
                  return (
                    <div
                      key={h.title}
                      className="flex flex-col bg-[#050505] p-7 transition-colors duration-200 hover:bg-[#0a0a0a] md:p-8"
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                        <Icon className="h-4 w-4 text-white/70" strokeWidth={1.5} />
                      </span>
                      <h3 className="mt-5 text-base font-medium text-white">{h.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/55">{h.body}</p>
                    </div>
                  );
                })}
              </Reveal>
            </div>
          </section>
        )}

        {/* ── About + Perfect for ───────────────────────────────── */}
        <section className={SECTION}>
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
            <Reveal>
              <p className={EYEBROW}>About this template</p>
              <h2 className="mt-4 text-2xl font-medium tracking-tight md:text-3xl">
                {t.name}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-white/60">{t.about}</p>
              <p className="mt-4 text-base leading-relaxed text-white/60">{t.description}</p>
            </Reveal>

            {t.perfectFor.length > 0 && (
              <Reveal delay={80}>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7 md:p-8">
                  <p className={EYEBROW}>Perfect for</p>
                  <ul className="mt-5 space-y-3.5">
                    {t.perfectFor.map((p) => (
                      <li key={p} className="flex items-start gap-3 text-sm text-white/70">
                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                          <Check className="h-3 w-3 text-white/60" strokeWidth={2} />
                        </span>
                        <span className="leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )}
          </div>
        </section>

        {/* ── Related templates ─────────────────────────────────── */}
        {related.length > 0 && (
          <section className={SECTION}>
            <div className="mx-auto max-w-6xl">
              <Reveal className="flex items-end justify-between gap-4">
                <div>
                  <p className={EYEBROW}>Related templates</p>
                  <h2 className="mt-4 text-2xl font-medium tracking-tight md:text-3xl">
                    More in {t.category}.
                  </h2>
                </div>
                <Link
                  href={catHref}
                  className="hidden shrink-0 text-sm text-white/50 transition-colors hover:text-white sm:inline"
                >
                  View all →
                </Link>
              </Reveal>

              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/templates/${r.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.04]"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-white/[0.02]">
                      <TemplateThumb
                        name={r.name}
                        category={r.category}
                        slug={r.slug}
                        className="transition-transform duration-300 group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="truncate text-sm font-medium text-white/85" title={r.name}>
                        {r.name}
                      </h3>
                      <p className="mt-1 truncate text-xs text-white/45">{r.framework}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Final CTA ─────────────────────────────────────────── */}
        <section className="border-t border-white/[0.06] px-4 py-24 md:px-8 md:py-28">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
              Make {t.name} yours.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-white/55 md:text-lg">
              Fork it into the Hanzo builder, edit it with AI, and ship it to a live
              hanzo.app URL — database, auth, and AI wired in.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={t.fork}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-white/90"
              >
                Use this template
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.02] px-6 py-3 text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white"
              >
                Browse all templates
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
