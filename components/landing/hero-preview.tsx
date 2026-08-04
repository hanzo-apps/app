"use client";

import { Button } from '@hanzo/ui';
import { YStack, XStack, SizableText, H3, Paragraph, type GuiElement } from '@hanzo/gui';
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
    <YStack height="100%" {...{ gap: compact ? "$2" : "$3", padding: compact ? "$2.5" : "$4" }}>
      <XStack alignItems="center" justifyContent="space-between">
        <SizableText fontFamily="$mono" color="$color" {...{ fontSize: compact ? 8 : 10 }}>
          Vibe Check
        </SizableText>
        {v >= 2 && !compact && (
          <SizableText alignItems="center" gap="$1" fontFamily="$mono" fontSize={8} color="$color">
            <SizableText height="$1" width="$1" borderRadius="$10" backgroundColor="$color" className="livedot" />
            realtime · Base
          </SizableText>
        )}
        {v >= 2 && compact && (
          <SizableText height="$1.5" width="$1.5" borderRadius="$10" backgroundColor="$color" className="livedot" />
        )}
      </XStack>

      <H3 fontWeight="500" lineHeight={1.25} letterSpacing={-0.4} color="$color" {...{ fontSize: compact ? 13 : "$6" }}>
        How&apos;s the team feeling today?
      </H3>

      <YStack {...{ gap: compact ? "$1.5" : "$2" }}>
        {votes.map((o, i) => (
          <SizableText
            key={o.label}
            borderRadius="$5" borderWidth={1} textAlign="center" fontWeight="500" display="flex" flexDirection="column" {...{ paddingHorizontal: compact ? "$1" : "$2", paddingVertical: compact ? "$1.5" : "$2.5", fontSize: compact ? 9 : 12, borderColor: i === 0 ? "$color" : "$borderColor", backgroundColor: i === 0 ? "$color" : "$color", color: i === 0 ? "$color" : "$color" }}
          >
            {o.label}
          </SizableText>
        ))}
      </YStack>

      {v >= 1 && (
        <YStack flex={1} justifyContent="flex-end" {...{ gap: compact ? "$1" : "$1.5" }} className="rise">
          {votes.map((o) => (
            <XStack key={o.label} alignItems="center" gap="$2">
              <SizableText width="$7" flexShrink={0} fontFamily="$mono" color="$color" {...{ fontSize: compact ? 7 : 9 }}>
                {o.label}
              </SizableText>
              <YStack height="$1.5" flex={1} overflow="hidden" borderRadius="$10" backgroundColor="$color">
                <YStack height="100%" borderRadius="$10" backgroundColor="$color" style={{ width: o.w }} />
              </YStack>
              <SizableText width="$4" flexShrink={0} textAlign="right" fontFamily="$mono" fontVariant={["tabular-nums"]} color="$color" {...{ fontSize: compact ? 7 : 9 }}>
                {o.n}
              </SizableText>
            </XStack>
          ))}
          <SizableText marginTop="$1" fontFamily="$mono" color="$color" {...{ fontSize: compact ? 7 : 9 }}>
            22 votes today{v >= 2 ? " · updating live" : ""}
          </SizableText>
        </YStack>
      )}
      {v === 0 && <YStack flex={1} />}
    </YStack>
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
  const rootRef = useRef<GuiElement | null>(null);
  const chatRef = useRef<GuiElement | null>(null);

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
    if (!(el instanceof HTMLElement)) return;
    el.scrollTop = el.scrollHeight;
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
    if (!el || !(el instanceof Element)) return;
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
    <YStack ref={rootRef} position="relative" alignSelf="center" width="100%" maxWidth={1024} className="idm">
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
      <YStack pointerEvents="none" position="absolute" left="$0" right="$0" bottom="-7" top="$6" zIndex={10} borderRadius="2rem" backgroundColor="$color" $sm={{ left: "-6", right: "-6" }} />

      <YStack overflow="hidden" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" elevation={6}>
        {/* ── Editor header — the real /dev chrome in miniature ── */}
        <XStack alignItems="center" gap="$3" borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$color" paddingHorizontal="$3.5" paddingVertical="$2.5">
          <XStack alignItems="center" gap="$1.5">
            <SizableText height="$2.5" width="$2.5" borderRadius="$10" backgroundColor="$color" />
            <SizableText height="$2.5" width="$2.5" borderRadius="$10" backgroundColor="$color" />
            <SizableText height="$2.5" width="$2.5" borderRadius="$10" backgroundColor="$color" />
          </XStack>
          <HMark size={14} color="var(--foreground)" />
          <SizableText display="none" numberOfLines={1} fontFamily="$mono" fontSize={10} color="$color">
            maxpower / vibe-check
          </SizableText>

          {/* View tabs (chat | preview | code) — the builder's ONE view state. */}
          <YStack alignSelf="center" display="none" alignItems="center" borderRadius="$5" borderWidth={1} borderColor="$borderColor" padding="$0.5">
            {[
              { id: "chat", icon: MessageSquare },
              { id: "preview", icon: Eye },
              { id: "code", icon: Code2 },
            ].map((tabItem, i) => (
              <SizableText
                key={tabItem.id}
                height="$4.5" width="$5" alignItems="center" justifyContent="center" borderRadius="$2" {...{ backgroundColor: i < 2 ? "$color" : undefined, color: i < 2 ? "$color" : "$color" }}
              >
                <tabItem.icon size={12} />
              </SizableText>
            ))}
          </YStack>

          <XStack marginLeft="auto" alignItems="center" gap="$1.5" $sm={{ marginLeft: "$0" }}>
            <Button
              type="button"
              aria-label="Replay the demo build"
              onClick={() => run()}
              height="$4.5" width="$4.5" alignItems="center" justifyContent="center" borderRadius="$2" focusVisibleStyle={{ outlineWidth: 0 }}
            >
              <SizableText color="$color"><RotateCcw size={12} /></SizableText>
            </Button>
            <SizableText height="$4.5" width="$4.5" alignItems="center" justifyContent="center" borderRadius="$2" color="$color">
              <Clock size={12} />
            </SizableText>
            <XStack alignItems="center" borderRadius="$3" borderWidth={1} borderColor="$borderColor" padding="$0.5" $lg={{ display: "none" }}>
              <Button
                type="button"
                aria-label="Desktop preview"
                aria-pressed={device === "desktop"}
                onClick={() => setDevice("desktop")}
                height="$4.5" width="$4.5" alignItems="center" justifyContent="center" borderRadius="$2" {...{ backgroundColor: device === "desktop" ? "$color" : undefined, color: device === "desktop" ? "$color" : "$color" }}
              >
                <Monitor size={12} />
              </Button>
              <Button
                type="button"
                aria-label="Mobile preview"
                aria-pressed={device === "mobile"}
                onClick={() => setDevice("mobile")}
                height="$4.5" width="$4.5" alignItems="center" justifyContent="center" borderRadius="$2" {...{ backgroundColor: device === "mobile" ? "$color" : undefined, color: device === "mobile" ? "$color" : "$color" }}
              >
                <Smartphone size={12} />
              </Button>
            </XStack>
            <SizableText
              alignItems="center" gap="$1" borderRadius="$3" borderWidth={1} paddingHorizontal="$2" paddingVertical="$1" fontSize={10} fontWeight="600" {...{ backgroundColor: live ? "$color4" : "$color12", borderColor: live ? "$color" : "$color12", color: live ? "$color" : "$background" }}
            >
              {live ? (
                <>
                  <Check size={12} strokeWidth={3} />
                  <SizableText display="none">Published</SizableText>
                </>
              ) : phase === "publishing" ? (
                <>
                  <Loader2 size={12} /> Publishing
                </>
              ) : (
                "Publish"
              )}
            </SizableText>
          </XStack>
        </XStack>

        {/* ── Body: chat rail + previews ── */}
        <YStack $md={{ height: 420, flexDirection: "row" }}>
          {/* Chat rail — transcript + the rounded composer input. */}
          <YStack width="100%" flexShrink={0} borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$background" $md={{ width: 248, borderBottomWidth: 0, borderRightWidth: 1 }}>
            <XStack alignItems="center" gap="$2" paddingHorizontal="$3.5" paddingTop="$3">
              <Sparkles size={12} color="$color" />
              <SizableText fontFamily="$mono" fontSize={9} color="$color">
                Agent chat
              </SizableText>
            </XStack>

            <YStack
              ref={chatRef}
              maxHeight="$17" minHeight={0} flex={1} gap="$1.5" overflow="hidden" paddingHorizontal="$3.5" paddingVertical="$3" $md={{ maxHeight: "none" }}
            >
              {bubbles.map((b, i) =>
                b.role === "user" ? (
                  <SizableText
                    key={i}
                    alignSelf="flex-end" borderRadius="$5" borderBottomRightRadius="$1" backgroundColor="$color" paddingHorizontal="$2.5" paddingVertical="$1.5" fontSize={11} lineHeight={1.375} color="$color" display="flex" flexDirection="column" className="line"
                  >
                    {b.text}
                  </SizableText>
                ) : (
                  <SizableText key={i} alignItems="center" gap="$1.5" fontFamily="$mono" fontSize={10} color="$color" display="flex" flexDirection="row" className="line">
                    <Check size={10} color="$color" strokeWidth={3} />
                    <SizableText numberOfLines={1}>{b.text}</SizableText>
                  </SizableText>
                ),
              )}
              {streamLine && (
                <SizableText alignItems="center" gap="$1.5" fontFamily="$mono" fontSize={10} color="$color" display="flex" flexDirection="row" className="line">
                  <Loader2 size={10} />
                  <SizableText numberOfLines={1}>{streamLine}</SizableText>
                </SizableText>
              )}
            </YStack>

            {/* The rounded chat input — mirrors the real composer. */}
            <YStack paddingHorizontal="$3.5" paddingBottom="$3.5">
              <XStack alignItems="center" gap="$2" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2">
                <SizableText minWidth={0} flex={1} numberOfLines={1} fontFamily="$mono" fontSize={10} color="$color">
                  {typed || (busy ? "…" : "Ask Hanzo to change anything…")}
                  {phase === "typing" && (
                    <SizableText marginLeft="$0.25" height="$3" width={1} y={1} backgroundColor="$color" verticalAlign="middle" className="caret" />
                  )}
                </SizableText>
                <CornerDownLeft size={12} color="$color" />
              </XStack>
            </YStack>
          </YStack>

          {/* Previews: rounded browser frame (desktop) + phone frame (mobile). */}
          <XStack position="relative" minWidth={0} flex={1} alignItems="stretch" gap="$4" backgroundColor="$background" padding="$4">
            {/* Desktop browser frame */}
            <YStack
              minWidth={0} flex={1} overflow="hidden" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" {...{ display: device === "desktop" ? undefined : "none" }}
            >
              <XStack alignItems="center" gap="$2" borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$color" paddingHorizontal="$3" paddingVertical="$2">
                <XStack alignSelf="center" width="100%" maxWidth={240} alignItems="center" gap="$2" borderRadius="$3" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$2.5" paddingVertical="$1">
                  <svg viewBox="0 0 24 24" width={10} height={10} opacity={0.3} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <rect x="4" y="10" width="16" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 1 1 8 0v3" />
                  </svg>
                  <SizableText numberOfLines={1} fontFamily="$mono" fontSize={10} color="$color">{SLUG}</SizableText>
                </XStack>
                <SizableText flexShrink={0} alignItems="center" gap="$1">
                  {live ? (
                    <>
                      <SizableText height="$1.5" width="$1.5" borderRadius="$10" backgroundColor="$color" className="livedot" />
                      <SizableText display="none" fontFamily="$mono" fontSize={8} color="$color">
                        Live
                      </SizableText>
                    </>
                  ) : (
                    <Loader2 size={10} color="$color" />
                  )}
                </SizableText>
              </XStack>
              <YStack position="relative" minHeight={240} flex={1}>
                {v >= 0 ? (
                  <YStack key={`d${v}`} height="100%" className="rise">
                    <VibeApp v={v} />
                  </YStack>
                ) : (
                  <Generating />
                )}
              </YStack>
            </YStack>

            {/* Phone frame */}
            <YStack
              width={172} flexShrink={0} {...{ alignSelf: device === "mobile" ? "center" : "center", display: device === "mobile" ? undefined : "none" }}
            >
              <YStack overflow="hidden" borderRadius="1.6rem" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$1.5" elevation={5}>
                <YStack alignSelf="center" marginBottom="$1" height="$1" width="$7" borderRadius="$10" backgroundColor="$color" />
                <YStack position="relative" height={280} overflow="hidden" borderRadius="1.1rem" backgroundColor="$background">
                  {v >= 0 ? (
                    <YStack key={`m${v}`} height="100%" className="rise">
                      <VibeApp v={v} compact />
                    </YStack>
                  ) : (
                    <Generating />
                  )}
                </YStack>
              </YStack>
              <SizableText marginTop="$2" textAlign="center" fontFamily="$mono" fontSize={8} color="$color">
                Mobile
              </SizableText>
            </YStack>
          </XStack>
        </YStack>

        {/* Status bar — git push payoff + live URL, exactly one line. */}
        <SizableText alignItems="center" gap="$2" borderTopWidth={1} borderColor="$borderColor" backgroundColor="$color" paddingHorizontal="$3.5" paddingVertical="$1.5" fontFamily="$mono" fontSize={9} display="flex" flexDirection="row">
          <SizableText minWidth={0} alignItems="center" gap="$1.5" color="$color">
            <SizableText numberOfLines={1}>
              {busy ? (streamLine ?? "working…") : live ? "pushed to main · e4b21c7" : "main"}
            </SizableText>
          </SizableText>
          <SizableText marginLeft="auto" flexShrink={0} alignItems="center" gap="$1.5">
            {live ? (
              <>
                <SizableText height="$1.5" width="$1.5" borderRadius="$10" backgroundColor="$color" className="livedot" />
                <SizableText color="$color">Live at {SLUG}</SizableText>
              </>
            ) : phase === "publishing" ? (
              <>
                <Loader2 size={10} color="$color" />
                <SizableText color="$color">Publishing…</SizableText>
              </>
            ) : (
              <SizableText color="$color">{busy ? "Building…" : "Ready"}</SizableText>
            )}
          </SizableText>
        </SizableText>
      </YStack>

      {/* Honesty microcopy — a demo, simulated client-side. */}
      <Paragraph marginTop="$4" textAlign="center" fontFamily="$mono" fontSize={10} color="$color">
        Demo · watch the builder build, edit &amp; publish an app — desktop and mobile
      </Paragraph>
    </YStack>
  );
}

function Generating(): ReactElement {
  return (
    <SizableText height="100%" flexDirection="column" alignItems="center" justifyContent="center" gap="$2" color="$color" display="flex">
      <Loader2 size={16} />
      <SizableText fontFamily="$mono" fontSize={9} textTransform="uppercase" letterSpacing={2.24}>Generating</SizableText>
    </SizableText>
  );
}

/* ── Inline Hanzo mark (currentColor) ───────────────────────────────────────*/
function HMark({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 67 67" width={size} height={size} color={color} fill="currentColor" aria-hidden>
      <path d="M22.21 67V44.64H0V67h22.21ZM66.72 22.32H22.25L.09 44.64h44.37l22.26-22.32ZM22.21 0H0v22.32h22.21V0ZM66.72 0H44.51v22.32h22.21V0ZM66.72 67V44.64H44.51V67h22.21Z" />
    </svg>
  );
}
