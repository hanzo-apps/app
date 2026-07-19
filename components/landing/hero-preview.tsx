"use client";

// Hero focal visual — an INTERACTIVE mini-builder that shows, in one frame, the
// one thing that makes hanzo.app different: you describe an app in a sentence,
// the agent generates it, you preview it live, and it ships to a real
// <slug>.hanzo.app URL with a git push.
//
// It is a real interactive component, not a looping wireframe. The visitor
// clicks a sample prompt; the composer types it out, an agent streams a short
// build log, a hand-authored mini-page reveals in the preview pane, then it
// auto-publishes — the URL bar's slug updates and the Live dot flips green. The
// preview also has working affordances: a device toggle (responsive preview) and
// a visual-edit toggle (element outlines). The bottom rail is the build pipeline
// as a live progress tracker AND the feature legend.
//
// Honest by construction: the three sample apps are clearly labelled demos,
// hand-authored in this file (generic placeholder brands, illustrative prices) —
// no real customers, no fabricated platform metrics. Everything is simulated
// client-side; the landing is pre-auth and calls no API.
//
// Brand law (app/CLAUDE.md): true-black monochrome, zero hue by construction —
// the ONLY colour is semantic green for Live/Published. Self-contained (scoped
// keyframes, prefix `idm`). Reduced-motion users get the final, settled frame
// with no typing/streaming — clicking a prompt swaps straight to the live app.

import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  Sparkles,
  Eye,
  Pencil,
  Monitor,
  Smartphone,
  Check,
  GitBranch,
  Loader2,
  CornerDownLeft,
} from "lucide-react";

type Phase = "typing" | "building" | "preview" | "publishing" | "live";
const STEP: Record<Phase, number> = { typing: 0, building: 1, preview: 2, publishing: 3, live: 4 };

interface Sample {
  id: string;
  chip: string; // short label on the clickable pill
  prompt: string; // what types into the composer
  slug: string; // the live URL it "ships" to
  sha: string; // illustrative commit for the git-push chip
  build: string[]; // streamed build-log lines
  Page: () => ReactElement; // the hand-authored monochrome mini-page
}

// The build pipeline, doubling as the feature legend. Node i lights as the demo
// advances (see STEP). Not a loop — driven by real interaction state.
const PIPELINE = [
  { label: "Prompt", sub: "you" },
  { label: "Generate", sub: "AI" },
  { label: "Preview", sub: "live" },
  { label: "Publish", sub: "1-click" },
  { label: "Live", sub: "CDN" },
];

/* ── Hand-authored sample apps (clearly demos) ──────────────────────────────
   Monochrome by brand law; grayscale blocks stand in for imagery. Generic
   placeholder brands + illustrative numbers — not real customers or metrics.
   `data-edit` marks elements the visual-edit toggle outlines.               */

function CoffeePage(): ReactElement {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/75">Brew House</span>
        <span className="hidden font-mono text-[9px] text-white/30 sm:inline">Menu · Hours · Visit</span>
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-4">
        <div className="min-w-[130px] flex-1">
          <h3 data-edit className="text-balance text-[18px] font-medium leading-[1.15] tracking-tight text-white">
            Small-batch coffee, roasted this morning.
          </h3>
          <p className="mt-2 max-w-[30ch] text-[11px] leading-relaxed text-white/45">
            Single-origin beans, a pour-over bar, and a quiet room to work.
          </p>
          <span data-edit className="mt-3 inline-block rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-black">
            Order online
          </span>
        </div>
        <div className="h-[92px] w-[104px] shrink-0 rounded-xl bg-gradient-to-br from-white/[0.14] to-white/[0.02] ring-1 ring-white/10" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { n: "Espresso", p: "$4" },
          { n: "Pour-over", p: "$5" },
          { n: "Cold brew", p: "$5" },
        ].map((m) => (
          <div key={m.n} className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-2">
            <div className="text-[11px] font-medium text-white/85">{m.n}</div>
            <div className="mt-0.5 font-mono text-[11px] text-white/40">{m.p}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingPage(): ReactElement {
  const tiers = [
    { n: "Starter", p: "$0", feats: ["1 project", "Community"], hi: false },
    { n: "Pro", p: "$19", feats: ["Unlimited", "Custom domain", "Analytics"], hi: true },
    { n: "Team", p: "$49", feats: ["Everything in Pro", "Seats & roles"], hi: false },
  ];
  return (
    <div className="flex h-full flex-col">
      <div className="text-center">
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">Pricing</span>
        <h3 data-edit className="mt-1 text-[16px] font-medium tracking-tight text-white">Simple, honest pricing.</h3>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 my-auto">
        {tiers.map((t) => (
          <div
            key={t.n}
            data-edit={t.hi ? "" : undefined}
            className={`flex flex-col rounded-xl border p-2.5 ${
              t.hi ? "border-white/25 bg-white/[0.05]" : "border-white/[0.07] bg-white/[0.02]"
            }`}
          >
            <div className="text-[11px] font-medium text-white/80">{t.n}</div>
            <div className="mt-1 flex items-baseline gap-0.5">
              <span className="font-mono text-[17px] font-semibold tabular-nums text-white">{t.p}</span>
              <span className="font-mono text-[9px] text-white/35">/mo</span>
            </div>
            <div className="mt-2 flex flex-col gap-1">
              {t.feats.map((f) => (
                <div key={f} className="flex items-center gap-1 text-[9px] text-white/45">
                  <Check className="h-2.5 w-2.5 shrink-0 text-white/50" strokeWidth={2.5} />
                  <span className="truncate">{f}</span>
                </div>
              ))}
            </div>
            <div
              className={`mt-auto rounded-md py-1 text-center text-[10px] font-semibold ${
                t.hi ? "bg-white text-black" : "bg-white/[0.06] text-white/70"
              }`}
            >
              {t.hi ? "Start free" : "Choose"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PortfolioPage(): ReactElement {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-end justify-between">
        <div>
          <h3 data-edit className="text-[17px] font-medium leading-none tracking-tight text-white">Alex Rivera</h3>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Product Designer</p>
        </div>
        <span data-edit className="rounded-full border border-white/20 px-2.5 py-1 text-[10px] font-medium text-white/80">
          View work
        </span>
      </div>
      <div className="grid flex-1 grid-cols-3 grid-rows-2 gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-md bg-gradient-to-br from-white/[0.11] to-white/[0.02] ring-1 ring-white/[0.06]"
            style={{ opacity: 1 - i * 0.07 }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between font-mono text-[9px] text-white/30">
        <span>Selected work · 2024–2026</span>
        <span className="hidden sm:inline">say@alexrivera.demo</span>
      </div>
    </div>
  );
}

const SAMPLES: Sample[] = [
  {
    id: "coffee",
    chip: "Coffee shop landing",
    prompt: "a coffee shop landing page",
    slug: "brew.hanzo.app",
    sha: "a1f3c8e",
    build: ["app/page.tsx", "components/Hero.tsx", "components/Menu.tsx", "Deploying to Hanzo Cloud"],
    Page: CoffeePage,
  },
  {
    id: "pricing",
    chip: "SaaS pricing page",
    prompt: "a SaaS pricing page",
    slug: "plans.hanzo.app",
    sha: "7b2d5a9",
    build: ["app/pricing/page.tsx", "components/PlanCard.tsx", "Wiring checkout", "Deploying to Hanzo Cloud"],
    Page: PricingPage,
  },
  {
    id: "portfolio",
    chip: "Portfolio site",
    prompt: "a portfolio site",
    slug: "folio.hanzo.app",
    sha: "e9c04b1",
    build: ["app/page.tsx", "components/Gallery.tsx", "components/Contact.tsx", "Deploying to Hanzo Cloud"],
    Page: PortfolioPage,
  },
];

export default function HeroPreview() {
  // Settle to the first sample, fully live — the frame reads as a finished app
  // on load. Nothing autoplays; the animation only runs when a prompt is clicked.
  const [active, setActive] = useState<Sample>(SAMPLES[0]);
  const [phase, setPhase] = useState<Phase>("live");
  const [typed, setTyped] = useState<string>(SAMPLES[0].prompt);
  const [built, setBuilt] = useState<number>(SAMPLES[0].build.length);
  const [editMode, setEditMode] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  // All scheduled timeouts live here so a new click (or unmount) cancels the
  // in-flight sequence cleanly — no overlapping runs, no state updates after
  // unmount.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const at = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };
  useEffect(() => clearTimers, []);

  const run = (s: Sample) => {
    clearTimers();
    setActive(s);
    setEditMode(false);

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // Settle straight to the final frame — no typing, no streaming.
      setTyped(s.prompt);
      setBuilt(s.build.length);
      setPhase("live");
      return;
    }

    setTyped("");
    setBuilt(0);
    setPhase("typing");

    const speed = 26;
    for (let i = 1; i <= s.prompt.length; i++) {
      at(i * speed, () => setTyped(s.prompt.slice(0, i)));
    }
    const t0 = s.prompt.length * speed + 360;
    at(t0, () => setPhase("building"));
    s.build.forEach((_, i) => at(t0 + 200 + i * 260, () => setBuilt(i + 1)));
    const t1 = t0 + 200 + s.build.length * 260 + 260;
    at(t1, () => setPhase("preview"));
    at(t1 + 720, () => setPhase("publishing"));
    at(t1 + 1520, () => setPhase("live"));
  };

  const step = STEP[phase];
  const Page = active.Page;

  return (
    <div className="idm relative mx-auto w-full max-w-4xl">
      <style>{`
        @keyframes idmBlink { 0%,49% {opacity:1} 50%,100% {opacity:0} }
        @keyframes idmScan { from {transform:translateX(-120%)} to {transform:translateX(120%)} }
        @keyframes idmRise { from {opacity:0; transform:translateY(8px)} to {opacity:1; transform:none} }
        @keyframes idmLine { from {opacity:0; transform:translateY(3px)} to {opacity:1; transform:none} }
        @keyframes idmPulse { 0%,100% {opacity:.5} 50% {opacity:1} }
        .idm .caret { animation: idmBlink 1s step-end infinite; }
        .idm .scan { animation: idmScan 1.15s ease-in-out infinite; }
        .idm .rise { animation: idmRise .5s cubic-bezier(.4,0,.2,1) both; }
        .idm .line { animation: idmLine .32s ease-out both; }
        .idm .livedot { animation: idmPulse 2s ease-in-out infinite; }
        .idm .fill, .idm .node, .idm .nlabel { transition: width .5s cubic-bezier(.4,0,.2,1), color .4s ease, opacity .4s ease, background-color .4s ease, border-color .4s ease; }
        /* Visual-edit affordance: outline the tagged elements while editing. */
        .idm .editing [data-edit] { outline: 1px dashed rgba(255,255,255,.45); outline-offset: 3px; border-radius: 3px; }
        .idm .editing [data-edit]:hover { outline-color: #fff; }
        @media (prefers-reduced-motion: reduce) {
          .idm .caret, .idm .scan, .idm .rise, .idm .line, .idm .livedot { animation: none; }
        }
      `}</style>

      {/* Soft floor glow to seat the frame. */}
      <div className="pointer-events-none absolute inset-x-0 -bottom-10 top-8 -z-10 rounded-[2rem] bg-white/[0.05] blur-2xl sm:-inset-x-8" />

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#080808] shadow-2xl shadow-black/60 ring-1 ring-white/[0.03]">
        {/* Browser chrome — the signature URL bar + Live dot, now state-driven. */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-white/10" />
            <span className="h-3 w-3 rounded-full bg-white/10" />
            <span className="h-3 w-3 rounded-full bg-white/10" />
          </div>
          <div className="mx-auto flex w-full max-w-xs items-center gap-2 rounded-lg border border-white/[0.06] bg-black/40 px-3 py-1.5">
            <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0 text-white/30" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 1 1 8 0v3" />
            </svg>
            <span className="truncate font-mono text-[11px] text-white/60">{active.slug}</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            {phase === "live" ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="livedot absolute inline-flex h-full w-full rounded-full bg-green-400/60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                </span>
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.15em] text-green-400/80 sm:inline">Live</span>
              </>
            ) : (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-white/45" />
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 sm:inline">
                  {phase === "publishing" ? "Publishing" : phase === "building" ? "Building" : "Editing"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Body: AI chat rail + live preview. Stacks on mobile (chat on top). */}
        <div className="flex flex-col md:h-[380px] md:flex-row">
          {/* AI chat rail — the composer + streaming build log. */}
          <aside className="flex w-full shrink-0 flex-col border-b border-white/[0.06] bg-black/30 md:w-[212px] md:border-b-0 md:border-r">
            <div className="flex items-center gap-2 px-3.5 pt-3.5">
              <HMark className="h-4 w-4 text-white" />
              <span className="text-[12px] font-semibold tracking-tight text-white">AI Builder</span>
              <span className="ml-auto flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">
                <Sparkles className="h-3 w-3" /> chat
              </span>
            </div>

            {/* Transcript (desktop only — mobile relies on the preview overlay). */}
            <div className="hidden min-h-0 flex-1 flex-col gap-2 overflow-hidden px-3.5 py-3 md:flex">
              <div className="self-end rounded-lg rounded-br-sm bg-white/[0.08] px-2.5 py-1.5 text-[11px] leading-snug text-white/85">
                {typed || <span className="text-white/30">…</span>}
                {phase === "typing" && <span className="caret ml-px inline-block h-3 w-px translate-y-px bg-white/80 align-middle" />}
              </div>
              {phase !== "typing" && (
                <div className="flex flex-col gap-1.5">
                  {active.build.slice(0, built).map((b, i) => {
                    const spinning = phase === "building" && i === built - 1;
                    return (
                      <div key={b} className="line flex items-center gap-1.5 font-mono text-[10px] text-white/50">
                        {spinning ? (
                          <Loader2 className="h-2.5 w-2.5 shrink-0 animate-spin text-white/50" />
                        ) : (
                          <Check className="h-2.5 w-2.5 shrink-0 text-white/45" strokeWidth={3} />
                        )}
                        <span className="truncate">{b}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Prompt chips + composer — the primary interaction. */}
            <div className="mt-auto flex flex-col gap-2 px-3.5 pb-3.5 pt-1 md:pt-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">Try a prompt</span>
              <div className="flex flex-wrap gap-1.5 md:flex-col md:items-stretch">
                {SAMPLES.map((s) => {
                  const on = s.id === active.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => run(s)}
                      className={`rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                        on
                          ? "border-white/25 bg-white/[0.08] text-white"
                          : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {s.chip}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5">
                <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-white/55">
                  {typed || "Ask Hanzo to build…"}
                  {phase === "typing" && <span className="caret ml-px inline-block h-3 w-px translate-y-px bg-white/70 align-middle" />}
                </span>
                <CornerDownLeft className="h-3 w-3 shrink-0 text-white/25" />
              </div>
            </div>
          </aside>

          {/* Live preview pane. */}
          <div className="relative flex min-w-0 flex-1 flex-col bg-[#0a0a0a]">
            {/* Preview toolbar — device toggle, visual-edit toggle, publish state. */}
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
              <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">
                <Eye className="h-3 w-3" /> Preview
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="flex items-center rounded-md border border-white/10 p-0.5">
                  <button
                    type="button"
                    aria-label="Desktop preview"
                    aria-pressed={device === "desktop"}
                    onClick={() => setDevice("desktop")}
                    className={`grid h-5 w-5 place-items-center rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${device === "desktop" ? "bg-white/10 text-white" : "text-white/35 hover:text-white/70"}`}
                  >
                    <Monitor className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Mobile preview"
                    aria-pressed={device === "mobile"}
                    onClick={() => setDevice("mobile")}
                    className={`grid h-5 w-5 place-items-center rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${device === "mobile" ? "bg-white/10 text-white" : "text-white/35 hover:text-white/70"}`}
                  >
                    <Smartphone className="h-3 w-3" />
                  </button>
                </div>
                <button
                  type="button"
                  aria-pressed={editMode}
                  onClick={() => setEditMode((v) => !v)}
                  className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${editMode ? "border-white/25 bg-white/[0.08] text-white" : "border-white/10 text-white/45 hover:text-white/80"}`}
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <span
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold ${phase === "live" ? "bg-green-400/10 text-green-400/90 ring-1 ring-green-400/25" : "bg-white text-black"}`}
                >
                  {phase === "live" ? (
                    <>
                      <Check className="h-3 w-3" strokeWidth={3} /> Published
                    </>
                  ) : phase === "publishing" ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" /> Publishing
                    </>
                  ) : (
                    "Publish"
                  )}
                </span>
              </div>
            </div>

            {/* Stage — the rendered mini-page, with overlays. */}
            <div className="relative min-h-[248px] flex-1 overflow-hidden p-3 md:min-h-0">
              <div
                className={`h-full ${device === "mobile" ? "mx-auto w-[228px] overflow-hidden rounded-[1.35rem] border border-white/10 bg-black p-2.5" : "w-full"}`}
              >
                <div key={active.id + device} className={`rise h-full overflow-hidden ${editMode ? "editing" : ""}`}>
                  <Page />
                </div>
              </div>

              {/* Build overlay — shown on all devices during generation. */}
              {phase === "building" && (
                <div className="absolute inset-3 z-20 flex flex-col items-center justify-center gap-3 rounded-lg bg-[#0a0a0a]/85 backdrop-blur-[2px]">
                  <div className="relative h-1 w-40 overflow-hidden rounded-full bg-white/10">
                    <span className="scan absolute inset-y-0 -left-1/3 w-1/3 rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/55">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {active.build[Math.max(0, built - 1)] ?? "Generating"}
                  </div>
                </div>
              )}

            </div>

            {/* Deploy status bar — a browser-like footer that carries the payoff
                (git push + live URL) WITHOUT floating over the page content, so it
                never collides on any page or device. Green only for the live
                state; also hosts the visual-edit hint. */}
            <div className="flex items-center gap-2 border-t border-white/[0.06] bg-white/[0.01] px-3 py-1.5 font-mono text-[9px]">
              <span className="flex min-w-0 items-center gap-1.5 text-white/40">
                {editMode ? (
                  <>
                    <Pencil className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">editing — click any element</span>
                  </>
                ) : (
                  <>
                    <GitBranch className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">
                      {phase === "live"
                        ? `pushed to main · ${active.sha}`
                        : phase === "building"
                          ? active.build[Math.max(0, built - 1)] ?? "generating"
                          : "main"}
                    </span>
                  </>
                )}
              </span>
              <span className="ml-auto flex shrink-0 items-center gap-1.5">
                {phase === "live" ? (
                  <>
                    <span className="livedot h-1.5 w-1.5 rounded-full bg-green-400" />
                    <span className="text-green-400/80">Live at {active.slug}</span>
                  </>
                ) : phase === "publishing" ? (
                  <>
                    <Loader2 className="h-2.5 w-2.5 animate-spin text-white/45" />
                    <span className="text-white/40">Publishing…</span>
                  </>
                ) : phase === "building" ? (
                  <span className="text-white/35">Building…</span>
                ) : (
                  <span className="text-white/30">Ready</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Build pipeline — a live progress tracker AND the feature legend. */}
        <div className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
          <div className="relative flex items-center justify-between">
            <div className="pointer-events-none absolute left-[9%] right-[9%] top-[9px] h-px bg-white/10">
              <div
                className="fill absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-white/40 to-green-400/70"
                style={{ width: `${(step / (PIPELINE.length - 1)) * 100}%` }}
              />
            </div>
            {PIPELINE.map((p, i) => {
              const done = i < step;
              const current = i === step;
              const isLive = i === PIPELINE.length - 1 && current;
              return (
                <div key={p.label} className="relative z-10 flex flex-col items-center gap-1.5">
                  <span
                    className={`node grid h-[18px] w-[18px] place-items-center rounded-full border ${
                      isLive
                        ? "border-green-400/50 bg-green-400/10"
                        : done || current
                          ? "border-white/40 bg-[#080808]"
                          : "border-white/12 bg-[#080808]"
                    }`}
                  >
                    <span
                      className={`node h-1.5 w-1.5 rounded-full ${
                        isLive ? "bg-green-400" : done || current ? "bg-white/80" : "bg-white/25"
                      }`}
                    />
                  </span>
                  <span className="flex flex-col items-center leading-none">
                    <span className={`nlabel text-[10px] font-medium ${isLive ? "text-green-400/90" : done || current ? "text-white/75" : "text-white/35"}`}>
                      {p.label}
                    </span>
                    <span className="mt-0.5 hidden font-mono text-[8px] uppercase tracking-[0.12em] text-white/30 sm:inline">{p.sub}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Honesty microcopy — these are demos, generated client-side. */}
      <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-white/25">
        Sample apps · click a prompt to watch Hanzo build, preview &amp; publish one
      </p>
    </div>
  );
}

/* ── Inline Hanzo mark (currentColor) ───────────────────────────────────────*/
function HMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 67 67" className={className} fill="currentColor" aria-hidden>
      <path d="M22.21 67V44.64H0V67h22.21ZM66.72 22.32H22.25L.09 44.64h44.37l22.26-22.32ZM22.21 0H0v22.32h22.21V0ZM66.72 0H44.51v22.32h22.21V0ZM66.72 67V44.64H44.51V67h22.21Z" />
    </svg>
  );
}
