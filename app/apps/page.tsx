"use client";

// /apps — the Hanzo apps & integrations catalog, in an editorial light layout:
// a big two-line title, a filter-chip row (active chip = bordered pill), a rule,
// and a logo + description grid. Every card is a REAL surface from the single
// typed catalog in @/data/app-catalog — no fabricated partners or claims. The
// chips are umbrella groupings of categories that already exist in the catalog,
// so each of the catalog's apps appears under exactly one chip (plus "All").

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { HanzoBrand } from "@/components/HanzoLogo";
import {
  appCatalog,
  ACTION_LABEL,
  ACTION_URL,
  type AppEntry,
} from "@/data/app-catalog";

// Catalog surfaces, in browse order — each maps to REAL catalog categories. The
// page lays them out as a horizontal track you pan through (Browser → Verticals);
// scrolling down pans right. Add a surface by listing more categories; add an app
// by appending to the catalog. One source.
const CATEGORIES: { label: string; cats: string[] }[] = [
  { label: "Browser", cats: ["Browser"] },
  { label: "Editors", cats: ["IDEs & editors", "Developer"] },
  { label: "Desktop", cats: ["Desktop app", "AI hosts & notebooks"] },
  { label: "Office", cats: ["Office", "Productivity", "Design"] },
  { label: "Business", cats: ["Business", "Team apps", "Communication"] },
  { label: "Verticals", cats: ["Verticals"] },
];

// One catalog cell: the app's mark + name as the wordmark lockup, its real blurb,
// then the action verb — links to the same install/connect destination as the
// card grid. Borderless, editorial, matching the reference's logo + copy columns.
function AppCell({ app }: { app: AppEntry }) {
  const Icon = app.icon;
  return (
    <a
      href={ACTION_URL[app.action]}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${ACTION_LABEL[app.action]} ${app.name}`}
      className="group block focus-visible:outline-none"
    >
      <div className="flex items-center gap-2.5">
        <Icon
          className="h-6 w-6 flex-shrink-0 text-neutral-900"
          strokeWidth={1.5}
          aria-hidden
        />
        <span className="text-xl font-semibold tracking-tight text-neutral-900 group-focus-visible:underline">
          {app.name}
        </span>
      </div>
      <p className="mt-5 max-w-[27ch] text-[15px] leading-relaxed text-neutral-600">
        {app.blurb}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-neutral-400 transition-colors group-hover:text-neutral-900">
        {ACTION_LABEL[app.action]}
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </span>
    </a>
  );
}

export default function AppsPage() {
  const [active, setActive] = useState(0);

  // The root layout pins <body> to `bg-black dark`; this page is light. Paint the
  // body white (and switch color-scheme) while /apps is mounted so overscroll /
  // rubber-band, the browser theme-color, and any render gap never flash black —
  // restored on unmount so the dark app is untouched.
  useEffect(() => {
    const { style } = document.body;
    const prev = { bg: style.backgroundColor, scheme: style.colorScheme };
    style.backgroundColor = "#ffffff";
    style.colorScheme = "light";
    return () => {
      style.backgroundColor = prev.bg;
      style.colorScheme = prev.scheme;
    };
  }, []);

  const trackRef = useRef<HTMLDivElement>(null);

  // Scroll down → pan right. Convert a vertical wheel over the track into
  // horizontal scroll (Browser → Verticals), and hand the wheel back to the page
  // once the track hits an edge so the title above and CTA below still scroll.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // let pinch-zoom through
      const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      const atStart = el.scrollLeft <= 0;
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
      if ((d > 0 && !atEnd) || (d < 0 && !atStart)) {
        el.scrollLeft += d;
        e.preventDefault();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Active surface = the panel nearest the track's left edge.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const panels = Array.from(el.querySelectorAll<HTMLElement>("[data-panel]"));
      const x = el.scrollLeft + 1;
      let idx = 0;
      panels.forEach((p, i) => {
        if (p.offsetLeft <= x) idx = i;
      });
      setActive(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const jumpTo = (i: number) => {
    const el = trackRef.current;
    const panel = el?.querySelectorAll<HTMLElement>("[data-panel]")[i];
    if (el && panel) el.scrollTo({ left: panel.offsetLeft, behavior: "smooth" });
  };

  return (
    // Explicit light theme — the app <body> is `bg-black dark`, so this page sets
    // its own white surface + dark text rather than the (dark) design tokens.
    <div className="min-h-screen bg-white font-sans text-neutral-900">
      {/* ── Minimal top bar (mark · docs · menu), matching the reference ─────── */}
      <header className="flex items-center justify-between px-6 py-6 md:px-10 md:py-7">
        <Link href="/" aria-label="Hanzo home" className="inline-flex">
          <HanzoBrand className="text-neutral-900" />
        </Link>
        <div className="flex items-center gap-6">
          <a
            href="https://docs.hanzo.ai"
            className="hidden items-center gap-1.5 text-[15px] text-neutral-900 transition-colors hover:text-neutral-500 sm:inline-flex"
          >
            Developer docs
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
          <Link
            href="/"
            aria-label="Menu"
            className="flex h-6 w-7 flex-col justify-center gap-[6px]"
          >
            <span className="h-px w-full bg-neutral-900" />
            <span className="h-px w-full bg-neutral-900" />
          </Link>
        </div>
      </header>

      <main className="px-6 pb-24 md:px-10">
        {/* ── Editorial title: black line over a light-gray line ─────────────── */}
        <div className="pt-6 md:pt-10">
          <h1 className="text-5xl font-medium leading-[1.02] tracking-tight md:text-[64px]">
            Runs
          </h1>
          <p className="mt-1 text-5xl font-medium leading-[1.02] tracking-tight text-neutral-300 md:text-[64px]">
            Everywhere.
          </p>
        </div>

        {/* ── Surface nav: click to jump; active follows the horizontal scroll ── */}
        <div
          role="group"
          aria-label="Jump to a surface"
          className="mt-12 flex flex-wrap items-center gap-x-1 gap-y-3 md:mt-16"
        >
          {CATEGORIES.map((c, i) => {
            const on = active === i;
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => jumpTo(i)}
                aria-pressed={on}
                className={[
                  "rounded-full px-5 py-2 text-lg transition-colors",
                  // equal padding + a transparent border on inactive chips keeps
                  // the row from reflowing when the pill border appears.
                  on
                    ? "border border-neutral-900 text-neutral-900"
                    : "border border-transparent text-neutral-400 hover:text-neutral-600",
                ].join(" ")}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <hr className="mt-8 border-neutral-200" />

        {/* ── Horizontal surface track: scroll down pans right, Browser → Verticals ── */}
        <div
          ref={trackRef}
          className="relative mt-10 flex snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {CATEGORIES.map((c) => {
            const apps = appCatalog.filter((a) => c.cats.includes(a.category));
            return (
              <section
                key={c.label}
                data-panel
                aria-label={c.label}
                className="flex min-h-[58vh] w-full shrink-0 snap-start flex-col justify-center"
              >
                <div className="mb-8 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                  {c.label}
                </div>
                <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {apps.map((app) => (
                    <AppCell key={app.name} app={app} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* horizontal-scroll affordance */}
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-400">
          Scroll to pan across surfaces →
        </p>

        {/* ── CTA — the page's real conversion, kept from the prior /apps ─────── */}
        <div className="mt-28 border-t border-neutral-200 pt-16">
          <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
            Start with one key.
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-neutral-600">
            Sign in with Hanzo, mint one{" "}
            <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-sm">
              hk-
            </code>{" "}
            key, and every app above is authenticated — no per-app credentials.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          >
            Get your key
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </main>
    </div>
  );
}
