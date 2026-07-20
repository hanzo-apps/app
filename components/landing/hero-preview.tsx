"use client";

// Hero focal visual — a faithful miniature of the ACTUAL /dev builder chrome:
// chat rail on the left (with the rounded composer input), the generated app in
// a rounded browser frame on the right — shown on desktop AND a phone frame side
// by side — with the real header affordances (tabs, history, device toggle,
// Publish) across the top.
//
// It ANIMATES ON SCROLL: the first time the frame enters the viewport, the
// builder "builds something" — the composer types a prompt, build lines stream
// in the chat, the app appears in both previews, then two follow-up edits type
// and apply (a live results meter, then Hanzo Base realtime wiring), and it
// publishes to a green Live dot. A replay control re-runs it; clicking nothing
// still leaves a settled, finished frame.
//
// Honest by construction: the app is a clearly-labelled demo, hand-authored
// here (no real customers/metrics); everything is simulated client-side — the
// landing is pre-auth and calls no API. Brand law: true-black monochrome, the
// ONLY colour is semantic green for Live/Published. Reduced-motion users get
// the settled final frame, no animation.

import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  Check,
  Clock,
  Code2,
  CornerDownLeft,
  Eye,
  Loader2,
  MessageSquare,
  Monitor,
  RotateCcw,
  Smartphone,
  Sparkles,
} from "lucide-react";

// The demo storyline: one build + two edits + publish. `v` is the app version
// each step reveals; the chat drives it.
const STEPS = [
  {
    prompt: "Build a team vibe check app — one tap to vote, live results",
    lines: ["Generating index.html", "Vibe buttons + results", "Rendering preview"],
    v: 0,
  },
  {
    prompt: "Add a live vibe meter with today's votes",
    lines: ["Updating index.html", "Rendering preview"],
    v: 1,
  },
  {
    prompt: "Wire votes to Hanzo Base — realtime for everyone",
    lines: ["Provisioning Base backend", "Subscribing to updates"],
    v: 2,
  },
] as const;

const SLUG = "vibe-check.hanzo.app";

type Phase = "idle" | "typing" | "building" | "publishing" | "live";

interface Bubble {
  role: "user" | "ai";
  text: string;
}

/* ── The hand-authored demo app (clearly a demo) ──────────────────────────── */

function VibeApp({ v, compact }: { v: number; compact?: boolean }): ReactElement {
  const votes = [
    { label: "High", n: 14, w: "72%" },
    { label: "Steady", n: 6, w: "34%" },
    { label: "Low", n: 2, w: "12%" },
  ];
  return (
    <div className={`flex h-full flex-col ${compact ? "gap-2 p-2.5" : "gap-3 p-4"}`}>
      <div className="flex items-center justify-between">
        <span className={`font-mono uppercase tracking-[0.2em] text-white/75 ${compact ? "text-[8px]" : "text-[10px]"}`}>
          Vibe Check
        </span>
        {v >= 2 && !compact && (
          <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.12em] text-green-400/80">
            <span className="livedot h-1 w-1 rounded-full bg-green-400" />
            realtime · Base
          </span>
        )}
        {v >= 2 && compact && (
          <span className="livedot h-1.5 w-1.5 rounded-full bg-green-400" />
        )}
      </div>

      <h3 className={`text-balance font-medium leading-tight tracking-tight text-white ${compact ? "text-[13px]" : "text-lg"}`}>
        How&apos;s the team feeling today?
      </h3>

      <div className={`grid grid-cols-3 ${compact ? "gap-1.5" : "gap-2"}`}>
        {votes.map((o, i) => (
          <div
            key={o.label}
            className={`rounded-lg border text-center font-medium ${compact ? "px-1 py-1.5 text-[9px]" : "px-2 py-2.5 text-[12px]"} ${
              i === 0 ? "border-white/30 bg-white/[0.08] text-white" : "border-white/10 bg-white/[0.02] text-white/60"
            }`}
          >
            {o.label}
          </div>
        ))}
      </div>

      {v >= 1 && (
        <div className={`rise flex flex-1 flex-col justify-end ${compact ? "gap-1" : "gap-1.5"}`}>
          {votes.map((o) => (
            <div key={o.label} className="flex items-center gap-2">
              <span className={`w-10 shrink-0 font-mono text-white/40 ${compact ? "text-[7px]" : "text-[9px]"}`}>
                {o.label}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-white/60" style={{ width: o.w }} />
              </div>
              <span className={`w-4 shrink-0 text-right font-mono tabular-nums text-white/50 ${compact ? "text-[7px]" : "text-[9px]"}`}>
                {o.n}
              </span>
            </div>
          ))}
          <span className={`mt-1 font-mono text-white/30 ${compact ? "text-[7px]" : "text-[9px]"}`}>
            22 votes today{v >= 2 ? " · updating live" : ""}
          </span>
        </div>
      )}
      {v === 0 && <div className="flex-1" />}
    </div>
  );
}

/* ── The editor-mockup frame ───────────────────────────────────────────────── */

export default function HeroPreview() {
  // Settled final state by default (SSR + reduced motion + post-run): the frame
  // always reads as a finished, live app.
  const [v, setV] = useState(2);
  const [phase, setPhase] = useState<Phase>("live");
  const [bubbles, setBubbles] = useState<Bubble[]>(() =>
    STEPS.flatMap((s) => [
      { role: "user" as const, text: s.prompt },
      { role: "ai" as const, text: "Done — it's in the preview." },
    ]),
  );
  const [streamLine, setStreamLine] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const played = useRef(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const at = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };
  useEffect(() => clearTimers, []);

  // Keep the transcript pinned to the newest line while the demo runs.
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [bubbles, streamLine, typed]);

  const run = () => {
    clearTimers();
    setBubbles([]);
    setStreamLine(null);
    setTyped("");
    setV(-1);
    setPhase("idle");

    let t = 400;
    STEPS.forEach((step) => {
      // Type the prompt into the composer…
      at(t, () => setPhase("typing"));
      const speed = 24;
      for (let i = 1; i <= step.prompt.length; i++) {
        at(t + i * speed, () => setTyped(step.prompt.slice(0, i)));
      }
      t += step.prompt.length * speed + 300;
      // …submit: it becomes a user bubble, the agent streams build lines…
      at(t, () => {
        setTyped("");
        setPhase("building");
        setBubbles((b) => [...b, { role: "user", text: step.prompt }]);
      });
      step.lines.forEach((line, i) => {
        at(t + 220 + i * 420, () => setStreamLine(line));
      });
      t += 220 + step.lines.length * 420 + 200;
      // …and the app updates in BOTH previews.
      at(t, () => {
        setStreamLine(null);
        setV(step.v);
        setBubbles((b) => [...b, { role: "ai", text: "Done — it's in the preview." }]);
      });
      t += 700;
    });

    // Publish → live.
    at(t, () => setPhase("publishing"));
    at(t + 1100, () => setPhase("live"));
  };

  // Animate on scroll: the first time the frame is properly in view, run once.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return; // settled frame
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !played.current) {
          played.current = true;
          run();
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const live = phase === "live";
  const busy = phase === "building" || phase === "typing";

  return (
    <div ref={rootRef} className="idm relative mx-auto w-full max-w-5xl">
      <style>{`
        @keyframes idmBlink { 0%,49% {opacity:1} 50%,100% {opacity:0} }
        @keyframes idmRise { from {opacity:0; transform:translateY(8px)} to {opacity:1; transform:none} }
        @keyframes idmLine { from {opacity:0; transform:translateY(3px)} to {opacity:1; transform:none} }
        @keyframes idmPulse { 0%,100% {opacity:.5} 50% {opacity:1} }
        .idm .caret { animation: idmBlink 1s step-end infinite; }
        .idm .rise { animation: idmRise .5s cubic-bezier(.4,0,.2,1) both; }
        .idm .line { animation: idmLine .32s ease-out both; }
        .idm .livedot { animation: idmPulse 2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .idm .caret, .idm .rise, .idm .line, .idm .livedot { animation: none; }
        }
      `}</style>

      {/* Soft floor glow to seat the frame. */}
      <div className="pointer-events-none absolute inset-x-0 -bottom-10 top-8 -z-10 rounded-[2rem] bg-white/[0.05] blur-2xl sm:-inset-x-8" />

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#080808] shadow-2xl shadow-black/60 ring-1 ring-white/[0.03]">
        {/* ── Editor header — the real /dev chrome in miniature ── */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          </div>
          <HMark className="h-3.5 w-3.5 shrink-0 text-white" />
          <span className="hidden truncate font-mono text-[10px] text-white/45 sm:inline">
            maxpower / vibe-check
          </span>

          {/* View tabs (chat | preview | code) — the builder's ONE view state. */}
          <div className="mx-auto hidden items-center rounded-lg border border-white/10 p-0.5 sm:flex">
            {[
              { id: "chat", icon: MessageSquare },
              { id: "preview", icon: Eye },
              { id: "code", icon: Code2 },
            ].map((tabItem, i) => (
              <span
                key={tabItem.id}
                className={`grid h-5 w-6 place-items-center rounded ${i < 2 ? "bg-white/10 text-white" : "text-white/35"}`}
              >
                <tabItem.icon className="h-3 w-3" />
              </span>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:ml-0">
            <button
              type="button"
              aria-label="Replay the demo build"
              onClick={() => run()}
              className="grid h-5 w-5 place-items-center rounded text-white/35 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
            <span className="grid h-5 w-5 place-items-center rounded text-white/35">
              <Clock className="h-3 w-3" />
            </span>
            <div className="flex items-center rounded-md border border-white/10 p-0.5 lg:hidden">
              <button
                type="button"
                aria-label="Desktop preview"
                aria-pressed={device === "desktop"}
                onClick={() => setDevice("desktop")}
                className={`grid h-5 w-5 place-items-center rounded ${device === "desktop" ? "bg-white/10 text-white" : "text-white/35"}`}
              >
                <Monitor className="h-3 w-3" />
              </button>
              <button
                type="button"
                aria-label="Mobile preview"
                aria-pressed={device === "mobile"}
                onClick={() => setDevice("mobile")}
                className={`grid h-5 w-5 place-items-center rounded ${device === "mobile" ? "bg-white/10 text-white" : "text-white/35"}`}
              >
                <Smartphone className="h-3 w-3" />
              </button>
            </div>
            <span
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold ${
                live
                  ? "bg-green-400/10 text-green-400/90 ring-1 ring-green-400/25"
                  : "bg-white text-black"
              }`}
            >
              {live ? (
                <>
                  <Check className="h-3 w-3" strokeWidth={3} />
                  <span className="hidden sm:inline">Published</span>
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

        {/* ── Body: chat rail + previews ── */}
        <div className="flex flex-col md:h-[420px] md:flex-row">
          {/* Chat rail — transcript + the rounded composer input. */}
          <aside className="flex w-full shrink-0 flex-col border-b border-white/[0.06] bg-black/30 md:w-[248px] md:border-b-0 md:border-r">
            <div className="flex items-center gap-2 px-3.5 pt-3">
              <Sparkles className="h-3 w-3 text-white/40" />
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">
                Agent chat
              </span>
            </div>

            <div
              ref={chatRef}
              className="flex max-h-40 min-h-0 flex-1 flex-col gap-1.5 overflow-hidden px-3.5 py-3 md:max-h-none"
            >
              {bubbles.map((b, i) =>
                b.role === "user" ? (
                  <div
                    key={i}
                    className="line self-end rounded-lg rounded-br-sm bg-white/[0.08] px-2.5 py-1.5 text-[11px] leading-snug text-white/85"
                  >
                    {b.text}
                  </div>
                ) : (
                  <div key={i} className="line flex items-center gap-1.5 font-mono text-[10px] text-white/50">
                    <Check className="h-2.5 w-2.5 shrink-0 text-white/45" strokeWidth={3} />
                    <span className="truncate">{b.text}</span>
                  </div>
                ),
              )}
              {streamLine && (
                <div className="line flex items-center gap-1.5 font-mono text-[10px] text-white/55">
                  <Loader2 className="h-2.5 w-2.5 shrink-0 animate-spin" />
                  <span className="truncate">{streamLine}</span>
                </div>
              )}
            </div>

            {/* The rounded chat input — mirrors the real composer. */}
            <div className="px-3.5 pb-3.5">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3 py-2">
                <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-white/55">
                  {typed || (busy ? "…" : "Ask Hanzo to change anything…")}
                  {phase === "typing" && (
                    <span className="caret ml-px inline-block h-3 w-px translate-y-px bg-white/80 align-middle" />
                  )}
                </span>
                <CornerDownLeft className="h-3 w-3 shrink-0 text-white/25" />
              </div>
            </div>
          </aside>

          {/* Previews: rounded browser frame (desktop) + phone frame (mobile). */}
          <div className="relative flex min-w-0 flex-1 items-stretch gap-4 bg-[#0a0a0a] p-4">
            {/* Desktop browser frame */}
            <div
              className={`min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#070707] ${
                device === "desktop" ? "flex" : "hidden lg:flex"
              }`}
            >
              <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <div className="mx-auto flex w-full max-w-[240px] items-center gap-2 rounded-md border border-white/[0.06] bg-black/40 px-2.5 py-1">
                  <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 shrink-0 text-white/30" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <rect x="4" y="10" width="16" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 1 1 8 0v3" />
                  </svg>
                  <span className="truncate font-mono text-[10px] text-white/60">{SLUG}</span>
                </div>
                <span className="flex shrink-0 items-center gap-1">
                  {live ? (
                    <>
                      <span className="livedot h-1.5 w-1.5 rounded-full bg-green-400" />
                      <span className="hidden font-mono text-[8px] uppercase tracking-[0.14em] text-green-400/80 sm:inline">
                        Live
                      </span>
                    </>
                  ) : (
                    <Loader2 className="h-2.5 w-2.5 animate-spin text-white/40" />
                  )}
                </span>
              </div>
              <div className="relative min-h-[240px] flex-1">
                {v >= 0 ? (
                  <div key={`d${v}`} className="rise h-full">
                    <VibeApp v={v} />
                  </div>
                ) : (
                  <Generating />
                )}
              </div>
            </div>

            {/* Phone frame */}
            <div
              className={`w-[172px] shrink-0 flex-col self-center ${
                device === "mobile" ? "mx-auto flex" : "hidden lg:flex"
              }`}
            >
              <div className="overflow-hidden rounded-[1.6rem] border border-white/12 bg-[#070707] p-1.5 shadow-xl shadow-black/40">
                <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-white/10" />
                <div className="relative h-[280px] overflow-hidden rounded-[1.1rem] bg-[#0a0a0a]">
                  {v >= 0 ? (
                    <div key={`m${v}`} className="rise h-full">
                      <VibeApp v={v} compact />
                    </div>
                  ) : (
                    <Generating />
                  )}
                </div>
              </div>
              <span className="mt-2 text-center font-mono text-[8px] uppercase tracking-[0.16em] text-white/25">
                Mobile
              </span>
            </div>
          </div>
        </div>

        {/* Status bar — git push payoff + live URL, exactly one line. */}
        <div className="flex items-center gap-2 border-t border-white/[0.06] bg-white/[0.01] px-3.5 py-1.5 font-mono text-[9px]">
          <span className="flex min-w-0 items-center gap-1.5 text-white/40">
            <span className="truncate">
              {busy ? (streamLine ?? "working…") : live ? "pushed to main · e4b21c7" : "main"}
            </span>
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            {live ? (
              <>
                <span className="livedot h-1.5 w-1.5 rounded-full bg-green-400" />
                <span className="text-green-400/80">Live at {SLUG}</span>
              </>
            ) : phase === "publishing" ? (
              <>
                <Loader2 className="h-2.5 w-2.5 animate-spin text-white/45" />
                <span className="text-white/40">Publishing…</span>
              </>
            ) : (
              <span className="text-white/30">{busy ? "Building…" : "Ready"}</span>
            )}
          </span>
        </div>
      </div>

      {/* Honesty microcopy — a demo, simulated client-side. */}
      <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-white/25">
        Demo · watch the builder build, edit &amp; publish an app — desktop and mobile
      </p>
    </div>
  );
}

function Generating(): ReactElement {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-white/40">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="font-mono text-[9px] uppercase tracking-[0.14em]">Generating</span>
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
