"use client";

// /apps — the Hanzo apps & integrations catalog. True-black monochrome to match
// the rest of the site. The surfaces are laid out as a horizontal filmstrip that
// is PINNED while you scroll: scrolling the page down pans left→right through
// every surface in order (Browser → Editors → Desktop → Office → Business →
// Verticals), so you pass through all of them before the page continues. Every
// card is a REAL surface from the ONE typed catalog in @/data/app-catalog, and
// each links to its own verified install/connect destination via `appUrl`.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Header from "@/components/layout/header";
import {
  appCatalog,
  ACTION_LABEL,
  appUrl,
  type AppEntry,
} from "@/data/app-catalog";

// Catalog surfaces, in browse order — each maps to REAL catalog categories.
const CATEGORIES: { label: string; cats: string[] }[] = [
  { label: "Browser", cats: ["Browser"] },
  { label: "Editors", cats: ["IDEs & editors", "Developer"] },
  { label: "Desktop", cats: ["Desktop app", "AI hosts & notebooks"] },
  { label: "Office", cats: ["Office", "Productivity", "Design"] },
  { label: "Business", cats: ["Business", "Team apps", "Communication"] },
  { label: "Verticals", cats: ["Verticals"] },
];

// One catalog cell: the app's mark + name lockup, its real blurb, and the action
// verb linking to that surface's own install/connect destination (`appUrl`).
function AppCell({ app }: { app: AppEntry }) {
  const Icon = app.icon;
  return (
    <a
      href={appUrl(app)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${ACTION_LABEL[app.action]} ${app.name}`}
      className="group block focus-visible:outline-none"
    >
      <div className="flex items-center gap-2.5">
        <Icon
          className="h-6 w-6 flex-shrink-0 text-foreground"
          strokeWidth={1.5}
          aria-hidden
        />
        <span className="text-lg font-semibold tracking-tight text-foreground group-hover:underline md:text-xl">
          {app.name}
        </span>
      </div>
      <p className="mt-4 max-w-[30ch] text-[15px] leading-relaxed text-muted-foreground">
        {app.blurb}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
        {ACTION_LABEL[app.action]}
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </span>
    </a>
  );
}

export default function AppsPage() {
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null); // tall pin scroll-track
  const trackRef = useRef<HTMLDivElement>(null); // the horizontally-translated filmstrip
  const N = CATEGORIES.length;

  // Scroll → pan. The wrapper is N screens tall; while its sticky child holds the
  // viewport, we map scroll progress (0→1 through the wrapper) to a translateX
  // across the filmstrip, so scrolling down walks through every surface in order.
  // rAF-coalesced; recomputes maxX on resize. Reduced-motion users get the same
  // mapping (functional, just not the point of it) — no separate code path.
  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const total = wrap.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-wrap.getBoundingClientRect().top, 0), Math.max(total, 0));
      const progress = total > 0 ? scrolled / total : 0;
      const maxX = Math.max(track.scrollWidth - window.innerWidth, 0);
      track.style.transform = `translate3d(${-progress * maxX}px,0,0)`;
      setActive(Math.round(progress * (N - 1)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [N]);

  // Nav chip → scroll the page to the point in the pin where surface `i` is centered.
  const jumpTo = (i: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const total = wrap.offsetHeight - window.innerHeight;
    const y = wrap.offsetTop + (N > 1 ? i / (N - 1) : 0) * total;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Shared site header — same menu as the rest of hanzo.app. */}
      <Header />

      {/* ── Intro: editorial title + surface nav (jumps into the pinned strip) ── */}
      <section className="px-4 pt-10 md:px-8 md:pt-16">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-5xl font-medium leading-[1.02] tracking-tight md:text-[64px]">
            Runs
          </h1>
          <p className="mt-1 text-5xl font-medium leading-[1.02] tracking-tight text-muted-foreground md:text-[64px]">
            Everywhere.
          </p>
          <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
            One key, every surface. Install Hanzo in your browser, editor,
            desktop, and office — or connect the tools your team already runs.
          </p>

          <div
            role="group"
            aria-label="Jump to a surface"
            className="mt-10 flex flex-wrap items-center gap-x-1 gap-y-3"
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
                    on
                      ? "border border-foreground text-foreground"
                      : "border border-transparent text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── The pinned filmstrip: N screens tall; scrolling pans through all N ── */}
      <div ref={wrapRef} className="relative" style={{ height: `${N * 90}vh` }}>
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div
            ref={trackRef}
            className="flex will-change-transform motion-reduce:transform-none"
          >
            {CATEGORIES.map((c, i) => {
              const apps = appCatalog.filter((a) => c.cats.includes(a.category));
              const on = active === i;
              return (
                <section
                  key={c.label}
                  data-panel
                  aria-label={c.label}
                  className={[
                    "flex h-screen w-screen shrink-0 flex-col justify-center px-4 transition-opacity duration-500 md:px-8",
                    on ? "opacity-100" : "opacity-40",
                  ].join(" ")}
                >
                  <div className="mx-auto w-full max-w-6xl">
                    <div className="mb-2 flex items-baseline gap-3">
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {c.label}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {String(i + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                      {apps.map((app) => (
                        <AppCell key={app.name} app={app} />
                      ))}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          {/* progress rail — fills as you pan through the surfaces */}
          <div className="pointer-events-none absolute inset-x-0 bottom-6 mx-auto flex max-w-6xl items-center gap-3 px-4 md:px-8">
            <div className="h-px flex-1 bg-border">
              <div
                className="h-px bg-foreground/60 transition-[width] duration-300"
                style={{ width: `${(active / Math.max(N - 1, 1)) * 100}%` }}
              />
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Scroll →
            </span>
          </div>
        </div>
      </div>

      {/* ── CTA — the page's real conversion ────────────────────────────────── */}
      <section className="border-t border-border px-4 py-24 md:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
            Start with one key.
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Sign in with Hanzo, mint one{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">
              hk-
            </code>{" "}
            key, and every app above is authenticated — no per-app credentials.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get your key
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
