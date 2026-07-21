"use client";

// The browsable templates gallery — ONE component over the SEO catalog SOT
// (lib/templates-catalog): a category rail + a responsive card grid with instant,
// client-side filtering. Mounted by BOTH `/gallery` (app/gallery/page.tsx) and the
// in-app Templates view (components/views/templates-view.tsx), so the marketing
// gallery and the sidebar view are the SAME surface — no drift, no forked copy, no
// live gallery.hanzo.ai fetch. The curated catalog is the product.
//
// True-black monochrome to match the landing (components/landing/*): white text,
// white/opacity borders, zero hue by construction. Each card LINKS to the detail
// page `/templates/<slug>`; a secondary "Use template" action forks into the
// builder via the established wire carried on every entry (`fork` =
// /dev?template=hanzo-apps/<slug>&action=edit). Previews come from TemplateThumb
// (image-first: the real self-hosted shot when one exists, else the generated
// on-brand tile) — its logic is unchanged here.

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import {
  CATEGORIES,
  TEMPLATES,
  templatesByCategory,
  type TemplateEntry,
} from "@/lib/templates-catalog";
import { authorOf } from "@/lib/template-authors";
import { TemplateThumb } from "@/components/template-thumb";

const ALL = "all";

function RailPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-white text-black"
          : "border border-white/10 bg-white/[0.02] text-white/55 hover:border-white/20 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function TemplateCard({ t, showAuthor = false }: { t: TemplateEntry; showAuthor?: boolean }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-all duration-200 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.04]">
      {/* Preview — image-first via TemplateThumb; on-brand tile when no real shot. */}
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-950">
        <TemplateThumb
          name={t.name}
          category={t.category}
          slug={t.slug}
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/70 backdrop-blur">
          {t.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="flex items-start gap-1.5 text-[15px] font-medium leading-snug tracking-tight text-white">
          <span className="line-clamp-1">{t.name}</span>
          <ArrowUpRight
            className="mt-0.5 h-4 w-4 shrink-0 text-white/25 transition-colors group-hover:text-white/60"
            strokeWidth={1.6}
          />
        </h3>
        <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-[13px] leading-relaxed text-white/50">
          {t.tagline}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">
            {showAuthor ? `by ${authorOf(t.slug)}` : t.framework}
          </span>
          <Link
            href={t.fork}
            className="relative z-10 inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-black transition-colors hover:bg-white/90"
          >
            Use template
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>
      </div>

      {/* Whole card → detail page. The stretched overlay sits BELOW the fork button
          (z-0 vs z-10), so a click anywhere opens the detail while "Use template"
          forks. No nested anchors: the overlay is a sibling of the button. */}
      <Link
        href={`/templates/${t.slug}`}
        aria-label={`View ${t.name}`}
        className="absolute inset-0 z-0"
      />
    </div>
  );
}

export function TemplateGallery({
  className = "",
  eyebrow = "Built with AI",
  heading = "Website & app templates",
  lead = "Production-ready apps from the Hanzo community.",
  showAuthor = false,
}: {
  className?: string;
  eyebrow?: string;
  heading?: string;
  lead?: string;
  showAuthor?: boolean;
}) {
  const [active, setActive] = useState<string>(ALL);

  // Only surface categories that actually have templates (resilient to an empty
  // or partial catalog), in the taxonomy's canonical order.
  const rail = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of TEMPLATES) counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
    return CATEGORIES.filter((c) => (counts.get(c.label) ?? 0) > 0);
  }, []);

  const shown = useMemo(() => {
    const base = active === ALL ? [...TEMPLATES] : templatesByCategory(active);
    // Default builder starters (featured) float to the top; stable within groups.
    return [...base].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  }, [active]);

  return (
    <div className={`mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14 ${className}`}>
      {/* Header — true-black monochrome, landing aesthetic. */}
      <header className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl md:text-[2.75rem] md:leading-[1.05]">
          {heading}
        </h1>
        <p className="mt-4 text-base text-white/55 sm:text-lg">{lead}</p>
      </header>

      {/* Category rail — instant client-side filtering. */}
      <div className="mt-8 flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap [scrollbar-width:none]">
        <RailPill label="All templates" active={active === ALL} onClick={() => setActive(ALL)} />
        {rail.map((c) => (
          <RailPill
            key={c.slug}
            label={c.label}
            active={active === c.slug}
            onClick={() => setActive(c.slug)}
          />
        ))}
      </div>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-white/30">
        {shown.length} template{shown.length === 1 ? "" : "s"}
      </p>

      {/* Grid — reflows 1 → 2 (sm) → 3 (lg) → 4 (xl). */}
      {shown.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((t) => (
            <TemplateCard key={t.slug} t={t} showAuthor={showAuthor} />
          ))}
        </div>
      ) : (
        <p className="mt-16 text-center text-sm text-white/40">
          No templates in this category yet.
        </p>
      )}

      {/* Footer CTA — the honest build path (no fabricated metrics). */}
      <div className="mt-14 flex flex-col items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="text-lg font-medium tracking-tight text-white">
            Don&apos;t see the right fit?
          </h2>
          <p className="mt-1 text-sm text-white/50">
            Describe your app and Hanzo builds it from scratch — deployed live in minutes.
          </p>
        </div>
        <Link
          href="/dev"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
        >
          <Sparkles className="h-4 w-4" strokeWidth={1.8} />
          Start building
        </Link>
      </div>
    </div>
  );
}

export default TemplateGallery;
