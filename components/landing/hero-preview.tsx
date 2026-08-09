"use client";

import { Button } from '@hanzo/ui';
import { YStack, XStack, SizableText, H3, Paragraph } from '@hanzo/ui';
// `GuiElement` is a TYPE, and @hanzo/ui's dts build drops a two-hop
// type-only re-export, so it is not on the barrel yet. A type is erased at
// build and cannot create a second runtime, so this does not reintroduce
// the two-copies problem the rest of this migration exists to prevent.
import type { GuiElement } from '@hanzo/gui';
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
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowUp,
  Check,
  ChevronDown,
  Clock,
  Code2,
  Eye,
  MessageSquare,
  Mic,
  Monitor,
  Plus,
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
  // ONE control scale for the whole widget: every row shares this height,
  // radius and label size, compact simply steps the scale down.
  const row = compact ? 20 : 26;
  const fs = compact ? 8 : 10;
  return (
    <YStack height="100%" {...{ gap: compact ? "$1.5" : "$2.5", padding: compact ? "$2.5" : "$3.5" }}>
      <XStack alignItems="center" justifyContent="space-between">
        <SizableText fontFamily="$mono" color="$color" {...{ fontSize: compact ? 7 : 9 }}>
          Vibe Check
        </SizableText>
        {v >= 2 && (
          <XStack alignItems="center" gap="$1">
            <SizableText height={6} width={6} borderRadius="$10" backgroundColor="$color" className="livedot" />
            {!compact && (
              <SizableText fontFamily="$mono" fontSize="$1" color="$color11">realtime · Base</SizableText>
            )}
          </XStack>
        )}
      </XStack>

      <H3 fontWeight="500" lineHeight="1.25" letterSpacing={-0.2} color="$color" {...{ fontSize: compact ? 12 : 16 }}>
        How&apos;s the team feeling today?
      </H3>

      {/* ONE control, three times. The tap target and its result meter used to
          be two separate stacks at two sizes — fat pill bars under full-width
          buttons, overlapping when the frame was short. A poll row IS both: the
          fill paints today's share behind the label, the count sits right, and
          uniformity is by construction because there is only one row spec. */}
      <YStack {...{ gap: compact ? "$1" : "$1.5" }}>
        {votes.map((o, i) => (
          <XStack
            key={o.label}
            position="relative" overflow="hidden" alignItems="center" justifyContent="space-between" height={row} borderRadius="$3" borderWidth={1} {...{ paddingHorizontal: compact ? "$1.5" : "$2.5", borderColor: i === 0 && v >= 1 ? "$color06" : "$borderColor" }}
          >
            {v >= 1 && (
              <YStack position="absolute" left={0} top={0} bottom={0} backgroundColor="$color4" style={{ width: o.w }} className="rise" />
            )}
            <SizableText position="relative" fontWeight="500" {...{ fontSize: fs, color: i === 0 ? "$color" : "$color11" }}>
              {o.label}
            </SizableText>
            {v >= 1 && (
              <SizableText position="relative" fontFamily="$mono" fontVariant={["tabular-nums"]} {...{ fontSize: fs }} color="$color">
                {o.n}
              </SizableText>
            )}
          </XStack>
        ))}
      </YStack>

      {v >= 1 && (
        <SizableText fontFamily="$mono" color="$color11" {...{ fontSize: compact ? 7 : 9 }} className="rise">
          22 votes today{v >= 2 ? " · updating live" : ""}
        </SizableText>
      )}
      <YStack flex={1} />
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
    <YStack ref={rootRef} position="relative" alignSelf="center" width="100%" maxWidth={920} className="idm">
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
      <YStack pointerEvents="none" position="absolute" left="$0" right="$0" bottom="$-7" top="$6" zIndex={-10} borderRadius="2rem" backgroundColor="$color005" filter="blur(80px)" $sm={{ left: "$-6", right: "$-6" }} />

      <YStack overflow="hidden" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" elevation={6}>
        {/* ── Editor header — the real /dev chrome in miniature ── */}
        <XStack alignItems="center" gap="$3" borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$color2" paddingHorizontal="$3" paddingVertical="$2">
          <XStack alignItems="center" gap="$1.5">
            <SizableText height={10} width={10} borderRadius="$10" backgroundColor="$color4" />
            <SizableText height={10} width={10} borderRadius="$10" backgroundColor="$color4" />
            <SizableText height={10} width={10} borderRadius="$10" backgroundColor="$color4" />
          </XStack>
          <HMark size={14} color="var(--foreground)" />
          <SizableText display="none" $sm={{ display: "inline" }} numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color">
            maxpower / vibe-check
          </SizableText>

          {/* View tabs (chat | preview | code) — the builder's ONE view state. */}
          {/* The pane trough, in miniature — the SAME grammar as the real
              header (a $color3 full-round trough, the active pane a raised
              $color5 pill), so the mockup and the product are one design. Sizes
              in px: the mini control is 22, and the $-scale is exactly where
              the $6=64 trap lives. */}
          <XStack alignSelf="center" display="none" $sm={{ display: "flex" }} alignItems="center" gap="$0.5" borderRadius={999} backgroundColor="$color3" padding={2}>
            {[
              { id: "chat", icon: MessageSquare },
              { id: "preview", icon: Eye },
              { id: "code", icon: Code2 },
            ].map((tabItem, i) => (
              <XStack
                key={tabItem.id}
                height={22} width={i === 1 ? 30 : 26} alignItems="center" justifyContent="center" borderRadius={999} {...{ backgroundColor: i === 1 ? "$color5" : undefined }}
              >
                <SizableText color={i === 1 ? "$color12" : "$color11"}><tabItem.icon size={11} /></SizableText>
              </XStack>
            ))}
          </XStack>

          <XStack marginLeft="auto" alignItems="center" gap="$1.5" $sm={{ marginLeft: "$0" }}>
            <Button size="icon"
              type="button"
              variant="ghost"
              aria-label="Replay the demo build"
              onClick={() => run()}
              height={22} width={22} minHeight={22} minWidth={22} alignItems="center" justifyContent="center" borderRadius={999} hoverStyle={{ backgroundColor: "$color3" }}
            >
              <SizableText color="$color11"><RotateCcw size={11} /></SizableText>
            </Button>
            <XStack display="none" height={22} width={22} alignItems="center" justifyContent="center" borderRadius={999} $sm={{ display: "flex" }}>
              <SizableText color="$color11"><Clock size={11} /></SizableText>
            </XStack>
            <XStack alignItems="center" gap="$0.5" borderRadius={999} backgroundColor="$color3" padding={2} $lg={{ display: "none" }}>
              <Button size="icon"
                type="button"
                variant="ghost"
                aria-label="Desktop preview"
                aria-pressed={device === "desktop"}
                onClick={() => setDevice("desktop")}
                height={22} width={22} minHeight={22} minWidth={22} alignItems="center" justifyContent="center" borderRadius={999} {...{ backgroundColor: device === "desktop" ? "$color5" : "transparent" }}
              >
                <SizableText color={device === "desktop" ? "$color12" : "$color11"}><Monitor size={11} /></SizableText>
              </Button>
              <Button size="icon"
                type="button"
                variant="ghost"
                aria-label="Mobile preview"
                aria-pressed={device === "mobile"}
                onClick={() => setDevice("mobile")}
                height={22} width={22} minHeight={22} minWidth={22} alignItems="center" justifyContent="center" borderRadius={999} {...{ backgroundColor: device === "mobile" ? "$color5" : "transparent" }}
              >
                <SizableText color={device === "mobile" ? "$color12" : "$color11"}><Smartphone size={11} /></SizableText>
              </Button>
            </XStack>
            {/* A text host cannot row-lay mixed children (the check rendered as
                a block ABOVE its label, and the unsized inner text ballooned the
                chip) — the XStack is the chip, one sized label inside. */}
            <XStack alignItems="center" gap="$1" height={22} borderRadius={999} paddingHorizontal="$2" {...{ backgroundColor: live ? "$color3" : "$color5" }}>
              {live ? (
                <Check size={10} strokeWidth={3} color="var(--foreground)" />
              ) : phase === "publishing" ? (
                <Spinner size={10} />
              ) : null}
              <SizableText fontSize="$1" fontWeight="600" {...{ color: live ? "$color" : "$color12" }}>
                {live ? "Published" : phase === "publishing" ? "Publishing" : "Publish"}
              </SizableText>
            </XStack>
          </XStack>
        </XStack>

        {/* ── Body: chat rail + previews — ONE row at every width. This used to
            stack (chat above preview) below $md, which read as a broken layout
            at laptop and phone alike; the rail simply narrows instead. ── */}
        <XStack height={340} $md={{ height: 360 }}>
          {/* Chat rail — transcript + the rounded composer input. */}
          <YStack width="36%" minWidth={120} maxWidth={220} flexShrink={0} borderRightWidth={1} borderColor="$borderColor" backgroundColor="$background">
            <XStack alignItems="center" gap="$2" paddingHorizontal="$2.5" paddingTop="$2.5">
              <Sparkles size={12} />
              <SizableText fontFamily="$mono" fontSize="$1" color="$color11">
                Agent chat
              </SizableText>
            </XStack>

            <YStack
              ref={chatRef}
              minHeight={0} flex={1} gap="$1.5" overflow="hidden" paddingHorizontal="$2.5" paddingVertical="$2.5"
            >
              {bubbles.map((b, i) =>
                b.role === "user" ? (
                  <YStack
                    key={i}
                    alignSelf="flex-end" borderRadius={999} backgroundColor="$color3" paddingHorizontal="$2.5" paddingVertical="$1.5" className="line"
                  >
                    <SizableText fontSize="$1" lineHeight="1.375" color="$color">{b.text}</SizableText>
                  </YStack>
                ) : (
                  <XStack key={i} alignItems="center" gap="$1.5" className="line">
                    <Check size={10} strokeWidth={3} />
                    <SizableText numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color">{b.text}</SizableText>
                  </XStack>
                ),
              )}
              {streamLine && (
                <XStack alignItems="center" gap="$1.5" className="line">
                  <Spinner size={10} />
                  <SizableText numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color">{streamLine}</SizableText>
                </XStack>
              )}
            </YStack>

            {/* The rounded chat input — the REAL composer's two rows at demo
                scale: prompt above, then [+] · Build ⌄ · mic · send. The mic
                and send are the same circle pair the builder draws (send
                filled, mic outlined), because the demo's whole claim is "this
                is the product". */}
            <YStack paddingHorizontal="$2.5" paddingBottom="$2.5">
              <YStack gap="$1.5" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$2.5" paddingTop="$1.5" paddingBottom="$1.5">
                <SizableText minWidth={0} numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color">
                  {typed || (busy ? "…" : "Ask Hanzo to change anything…")}
                  {phase === "typing" && (
                    <SizableText marginLeft="$0.25" height="$3" width={1} y={1} backgroundColor="$color" verticalAlign="middle" className="caret" />
                  )}
                </SizableText>
                <XStack alignItems="center" gap="$1.5">
                  <Plus size={11} opacity={0.6} />
                  <XStack alignItems="center" gap="$0.5" height={16} borderRadius={999} backgroundColor="$color3" paddingHorizontal="$1.5">
                    <SizableText fontSize={9} color="$color11">Build</SizableText>
                    <ChevronDown size={8} opacity={0.7} />
                  </XStack>
                  <XStack flex={1} />
                  <XStack height={16} width={16} alignItems="center" justifyContent="center" borderRadius={999} borderWidth={1} borderColor="$color06">
                    <Mic size={9} opacity={0.7} />
                  </XStack>
                  <XStack height={16} width={16} alignItems="center" justifyContent="center" borderRadius={999} backgroundColor="$color5">
                    <ArrowUp size={9} />
                  </XStack>
                </XStack>
              </YStack>
            </YStack>
          </YStack>

          {/* Previews: rounded browser frame (desktop) + phone frame (mobile). */}
          <XStack position="relative" minWidth={0} flex={1} alignItems="stretch" gap="$3" backgroundColor="$background" padding="$3">
            {/* Desktop browser frame */}
            <YStack
              minWidth={0} flex={1} overflow="hidden" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" {...{ display: device === "desktop" ? undefined : "none" }}
            >
              <XStack alignItems="center" gap="$2" borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$color2" paddingHorizontal="$3" paddingVertical="$2">
                <XStack alignSelf="center" width="100%" maxWidth={240} alignItems="center" gap="$2" borderRadius="$3" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$2.5" paddingVertical="$1">
                  <svg viewBox="0 0 24 24" width={10} height={10} opacity={0.3} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <rect x="4" y="10" width="16" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 1 1 8 0v3" />
                  </svg>
                  <SizableText numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color">{SLUG}</SizableText>
                </XStack>
                <XStack flexShrink={0} alignItems="center" gap="$1">
                  {live ? (
                    <>
                      <SizableText height={6} width={6} borderRadius="$10" backgroundColor="$color" className="livedot" />
                      <SizableText display="none" $sm={{ display: "inline" }} fontFamily="$mono" fontSize="$1" color="$color">
                        Live
                      </SizableText>
                    </>
                  ) : (
                    <Spinner size={10} />
                  )}
                </XStack>
              </XStack>
              <YStack position="relative" minHeight={200} flex={1}>
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
              width={148} flexShrink={0} {...{ alignSelf: "center", display: device === "mobile" ? undefined : "none" }}
            >
              <YStack overflow="hidden" borderRadius="1.35rem" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$1.5" elevation={5}>
                <YStack alignSelf="center" marginBottom="$1" height="$1" width="$7" borderRadius="$10" backgroundColor="$color6" />
                <YStack position="relative" height={236} overflow="hidden" borderRadius="0.95rem" backgroundColor="$background">
                  {v >= 0 ? (
                    <YStack key={`m${v}`} height="100%" className="rise">
                      <VibeApp v={v} compact />
                    </YStack>
                  ) : (
                    <Generating />
                  )}
                </YStack>
              </YStack>
              <SizableText marginTop="$2" textAlign="center" fontFamily="$mono" fontSize="$1" color="$color11">
                Mobile
              </SizableText>
            </YStack>
          </XStack>
        </XStack>

        {/* Status bar — git push payoff + live URL, exactly one line. */}
        <XStack alignItems="center" gap="$2" borderTopWidth={1} borderColor="$borderColor" backgroundColor="$color2" paddingHorizontal="$3.5" paddingVertical="$1.5">
          <XStack minWidth={0} alignItems="center" gap="$1.5">
            <SizableText numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color">
              {busy ? (streamLine ?? "working…") : live ? "pushed to main · e4b21c7" : "main"}
            </SizableText>
          </XStack>
          <XStack marginLeft="auto" flexShrink={0} alignItems="center" gap="$1.5">
            {live ? (
              <>
                <SizableText height={6} width={6} borderRadius="$10" backgroundColor="$color" className="livedot" />
                <SizableText fontFamily="$mono" fontSize="$1" color="$color">Live at {SLUG}</SizableText>
              </>
            ) : phase === "publishing" ? (
              <>
                <Spinner size={10} />
                <SizableText fontFamily="$mono" fontSize="$1" color="$color">Publishing…</SizableText>
              </>
            ) : (
              <SizableText fontFamily="$mono" fontSize="$1" color="$color">{busy ? "Building…" : "Ready"}</SizableText>
            )}
          </XStack>
        </XStack>
      </YStack>

      {/* Honesty microcopy — a demo, simulated client-side. */}
      <Paragraph marginTop="$4" textAlign="center" fontFamily="$mono" fontSize="$1" color="$color11">
        Demo · watch the builder build, edit &amp; publish an app — desktop and mobile
      </Paragraph>
    </YStack>
  );
}

function Generating(): ReactElement {
  return (
    <YStack height="100%" alignItems="center" justifyContent="center" gap="$2">
      <Spinner size={16} />
      <SizableText fontFamily="$mono" fontSize="$1" color="$color11">Generating</SizableText>
    </YStack>
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
