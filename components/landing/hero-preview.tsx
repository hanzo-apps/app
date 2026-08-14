"use client";

import { YStack, XStack, SizableText, H3 } from '@hanzo/ui';
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
// and apply (the results meter, then the Hanzo primitive it runs on), and it
// publishes to a Live dot. Then it moves to the NEXT example and builds that
// one, so a visitor who stays sees several kinds of app rather than one.
// A replay control re-runs the current example; clicking nothing still leaves a
// settled, finished frame.
//
// Honest by construction: the app is a clearly-labelled demo — the frame's own
// address strip carries the tag — hand-authored here (no real customers or
// metrics); everything is simulated client-side, the landing is pre-auth and
// calls no API. Brand law: true-black monochrome, the ONLY colour is semantic
// green for Live/Published. Reduced-motion users get the settled final frame,
// no animation and no cycling.

import { useEffect, useRef, useState, type ReactElement } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowUp,
  Check,
  ChevronDown,
  Clock,
  Mic,
  Monitor,
  Plus,
  RotateCcw,
  Share2,
  Smartphone,
  Sparkles,
} from "lucide-react";
// The hero's view tabs ARE the builder's — read the ONE list so the mockup can
// never drift from the real editor's tab set (which is exactly how it drifted:
// a hand-copied Chat/Preview/Code went stale against Preview/Files/Code/More).
import { PANES } from "@/lib/panes";

// Desktop view tabs = every pane except the `mobileOnly` chat column (the real
// header drops it above $lg; the hero frame is a desktop editor). Preview leads.
const VIEW_TABS = PANES.filter((p) => !("mobileOnly" in p));

/** One turn: what gets asked, and what the agent says while it works. */
interface Step {
  prompt: string;
  lines: readonly string[];
}

/**
 * One storyline — a small app, built in three turns and published.
 *
 * A storyline is DATA. The frame below renders any of them, so a sixth example
 * is an entry here and nothing else; the one thing that must not grow is a
 * second renderer.
 */
interface Story {
  /** The app's name. The frame's strip shows THIS, never an address: a visitor
   *  reading it is already on hanzo.app, so a "<something>.hanzo.app" tells
   *  them where they are and puts a domain in front of the product. */
  name: string;
  heading: string;
  rows: readonly { label: string; n: number; w: string }[];
  note: string;
  /** What the finished app reports it is running on. Base is in every one —
   *  every hanzo.app project gets the data plane — and the second name is the
   *  primitive this example needed. */
  wire: string;
  /** Build, then two edits. The step's INDEX is the version it reveals: 0 the
   *  app, 1 the measured rows, 2 the primitive wired in. */
  steps: readonly [Step, Step, Step];
}

/**
 * The examples, and they are deliberately five different KINDS of app.
 *
 * Each lands on a real leaf of the Hanzo catalog
 * (`api.hanzo.ai/v1/commerce/catalog`) — Base and Vector under Data, Agents
 * under AI, IAM under Security, Functions under Compute. No product is invented
 * and no number here is presented as ours: they are the demo app's own content,
 * the way "22 votes today" was.
 */
const STORIES: readonly Story[] = [
  {
    name: "Shift Board",
    heading: "Open shifts this week",
    rows: [
      { label: "Thu · morning", n: 4, w: "80%" },
      { label: "Fri · evening", n: 3, w: "60%" },
      { label: "Sat · morning", n: 2, w: "40%" },
    ],
    note: "9 claims today",
    wire: "Base · realtime",
    steps: [
      {
        prompt: "Build a shift board for my coffee cart — staff claim open shifts",
        lines: ["Generating index.html", "Shift list + claim button", "Rendering preview"],
      },
      {
        prompt: "Show how many claimed each shift",
        lines: ["Updating index.html", "Rendering preview"],
      },
      {
        prompt: "Keep the board in Hanzo Base so every phone sees the same shifts",
        lines: ["Provisioning Base", "Subscribing to updates"],
      },
    ],
  },
  {
    name: "Front Desk",
    heading: "What people asked today",
    rows: [
      { label: "Tune-up", n: 12, w: "75%" },
      { label: "Flat repair", n: 7, w: "44%" },
      { label: "Brake bleed", n: 4, w: "25%" },
    ],
    note: "23 questions answered",
    wire: "Base · agents",
    steps: [
      {
        prompt: "Build a front desk for my bike shop that answers repair questions",
        lines: ["Generating index.html", "Question box + answer card", "Rendering preview"],
      },
      {
        prompt: "Show what people ask most",
        lines: ["Updating index.html", "Rendering preview"],
      },
      {
        prompt: "Answer with Hanzo Agents and log every reply to Base",
        lines: ["Connecting Agents", "Writing replies to Base"],
      },
    ],
  },
  {
    name: "Handbook",
    heading: "Most-opened answers",
    rows: [
      { label: "Time off", n: 18, w: "78%" },
      { label: "Invoices", n: 11, w: "48%" },
      { label: "Brand kit", n: 6, w: "26%" },
    ],
    note: "41 searches this week",
    wire: "Base · vector",
    steps: [
      {
        prompt: "Build a handbook search for my studio — ask it anything",
        lines: ["Generating index.html", "Search box + results", "Rendering preview"],
      },
      {
        prompt: "Rank answers by how often they open",
        lines: ["Updating index.html", "Rendering preview"],
      },
      {
        prompt: "Index the handbook in Hanzo Vector so search reads meaning",
        lines: ["Embedding pages", "Querying Vector"],
      },
    ],
  },
  {
    name: "Client Portal",
    heading: "Who can open what",
    rows: [
      { label: "Clients", n: 24, w: "80%" },
      { label: "Studio", n: 6, w: "20%" },
      { label: "Guests", n: 2, w: "7%" },
    ],
    note: "32 people, 3 roles",
    wire: "Base · IAM",
    steps: [
      {
        prompt: "Build a client portal — each client sees only their own files",
        lines: ["Generating index.html", "File list + roles", "Rendering preview"],
      },
      {
        prompt: "Show the seats each role is using",
        lines: ["Updating index.html", "Rendering preview"],
      },
      {
        prompt: "Sign people in with Hanzo IAM and scope files to their org",
        lines: ["Connecting IAM", "Scoping files by org"],
      },
    ],
  },
  {
    name: "Monday Digest",
    heading: "This week at the nursery",
    rows: [
      { label: "Sold", n: 96, w: "82%" },
      { label: "Low stock", n: 7, w: "30%" },
      { label: "Reorder", n: 3, w: "14%" },
    ],
    note: "sent Monday 07:00",
    wire: "Base · functions",
    steps: [
      {
        prompt: "Build a Monday digest for my nursery — what sold, what's low",
        lines: ["Generating index.html", "Digest layout", "Rendering preview"],
      },
      {
        prompt: "Compare it with last week",
        lines: ["Updating index.html", "Rendering preview"],
      },
      {
        prompt: "Send it every Monday from a Hanzo Function reading Base",
        lines: ["Deploying the function", "Scheduling Mondays"],
      },
    ],
  },
];

type Phase = "idle" | "typing" | "building" | "publishing" | "live";

interface Bubble {
  role: "user" | "ai";
  text: string;
}

/* ── The demo app, ONE renderer for every storyline ───────────────────────── */

function App({ story, v, compact }: { story: Story; v: number; compact?: boolean }): ReactElement {
  // ONE control scale for the whole widget: every row shares this height,
  // radius and label size, compact simply steps the scale down.
  const row = compact ? 20 : 26;
  const fs = compact ? 8 : 10;
  return (
    <YStack height="100%" {...{ gap: compact ? "$1.5" : "$2.5", padding: compact ? "$2.5" : "$3.5" }}>
      <XStack alignItems="center" justifyContent="space-between">
        <SizableText fontFamily="$mono" color="$color" {...{ fontSize: compact ? 7 : 9 }}>
          {story.name}
        </SizableText>
        {v >= 2 && (
          <XStack alignItems="center" gap="$1">
            <SizableText height={6} width={6} borderRadius="$10" backgroundColor="$color" className="livedot" />
            {!compact && (
              <SizableText fontFamily="$mono" fontSize="$1" color="$color11">{story.wire}</SizableText>
            )}
          </XStack>
        )}
      </XStack>

      <H3 fontWeight="500" lineHeight="1.25" letterSpacing={-0.2} color="$color" {...{ fontSize: compact ? 12 : 16 }}>
        {story.heading}
      </H3>

      {/* ONE control, three times. The tap target and its result meter used to
          be two separate stacks at two sizes — fat pill bars under full-width
          buttons, overlapping when the frame was short. A measured row IS both:
          the fill paints today's share behind the label, the count sits right,
          and uniformity is by construction because there is only one row spec. */}
      <YStack {...{ gap: compact ? "$1" : "$1.5" }}>
        {story.rows.map((o, i) => (
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
          {story.note}
        </SizableText>
      )}
      <YStack flex={1} />
    </YStack>
  );
}

/* ── The editor-mockup frame ───────────────────────────────────────────────── */

export default function HeroPreview({ ask }: { ask: (prompt: string) => void }) {
  // Settled final state by default (SSR + reduced motion + post-run): the frame
  // always reads as a finished, live app.
  const [pick, setPick] = useState(0);
  const story = STORIES[pick];
  const [v, setV] = useState(2);
  const [phase, setPhase] = useState<Phase>("live");
  const [bubbles, setBubbles] = useState<Bubble[]>(() =>
    STORIES[0].steps.flatMap((s) => [
      { role: "user" as const, text: s.prompt },
      { role: "ai" as const, text: "Done — it's in the preview." },
    ]),
  );
  const [streamLine, setStreamLine] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  // Is the frame in view, and which storyline is waiting for it to be. One
  // mechanism serves both the FIRST play and every resume after a scroll away,
  // so the cycle never runs to an empty room: `pending` starts at 0, which is
  // the first sighting's cue to build example one.
  const seen = useRef(false);
  const pending = useRef<number | null>(0);
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

  /** Build storyline `k` (wrapping), then rest on it and move to the next. */
  const run = (k: number) => {
    const i = k % STORIES.length;
    clearTimers();
    pending.current = null;
    setPick(i);
    setBubbles([]);
    setStreamLine(null);
    setTyped("");
    setV(-1);
    setPhase("idle");

    let t = 400;
    STORIES[i].steps.forEach((step, ver) => {
      // Type the prompt into the composer…
      at(t, () => setPhase("typing"));
      const speed = 24;
      for (let c = 1; c <= step.prompt.length; c++) {
        at(t + c * speed, () => setTyped(step.prompt.slice(0, c)));
      }
      t += step.prompt.length * speed + 300;
      // …submit: it becomes a user bubble, the agent streams build lines…
      at(t, () => {
        setTyped("");
        setPhase("building");
        setBubbles((b) => [...b, { role: "user", text: step.prompt }]);
      });
      step.lines.forEach((line, li) => {
        at(t + 220 + li * 420, () => setStreamLine(line));
      });
      t += 220 + step.lines.length * 420 + 200;
      // …and the app updates in BOTH previews.
      at(t, () => {
        setStreamLine(null);
        setV(ver);
        setBubbles((b) => [...b, { role: "ai", text: "Done — it's in the preview." }]);
      });
      t += 700;
    });

    // Publish → live.
    at(t, () => setPhase("publishing"));
    at(t + 1100, () => setPhase("live"));
    // Rest on the finished app long enough to read it, then build the next
    // kind of app. Off screen it parks and the observer resumes it.
    at(t + 4500, () => {
      if (seen.current) run(i + 1);
      else pending.current = i + 1;
    });
  };

  // Animate on scroll, and only while the frame is actually being looked at.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !(el instanceof Element)) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return; // settled frame
    const io = new IntersectionObserver(
      (entries) => {
        seen.current = entries.some((e) => e.isIntersecting);
        if (seen.current && pending.current !== null) run(pending.current);
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
        /* The window FLOATS: it is a device mockup on the page's own black, not
           a panel in a card. A plain drop shadow cannot say that here — black
           on #000 is invisible — so the depth is two things at once: a wide soft
           pool that darkens the glow behind the frame, and a light rim that
           catches an edge the ground has no way to draw. */
        .idm .window {
          box-shadow:
            0 32px 64px -16px rgba(0, 0, 0, .9),
            0 8px 24px -8px rgba(0, 0, 0, .7),
            0 0 0 1px rgba(255, 255, 255, .06);
        }
        @media (prefers-reduced-motion: reduce) {
          .idm .caret, .idm .rise, .idm .line, .idm .livedot { animation: none; }
        }
      `}</style>

      {/* Soft floor glow — the lit ground the window's shadow pools against. */}
      <YStack pointerEvents="none" position="absolute" left="$0" right="$0" bottom="$-7" top="$6" zIndex={-10} borderRadius="2rem" backgroundColor="$color0075" filter="blur(80px)" $sm={{ left: "$-6", right: "$-6" }} />

      <YStack className="window" overflow="hidden" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$background">
        {/* ── Editor header — the real /dev chrome in miniature ── */}
        <XStack alignItems="center" gap="$3" borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$color2" paddingHorizontal="$3" paddingVertical="$2">
          {/* Left anchor = the real editor's: the Hanzo mark, then the project
              name. NO browser window dots — the real /dev header has none (it is
              the app, not a window), and the mockup's OWN rounded frame already
              reads as a window. */}
          <HMark size={14} color="var(--foreground)" />
          <SizableText display="none" $sm={{ display: "inline" }} numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color">
            maxpower / {story.name.toLowerCase().replace(/\s+/g, "-")}
          </SizableText>

          {/* View tabs — the builder's ONE view state, mirroring the real
              header's PANES (`lib/panes`) on DESKTOP, where `chat` is `mobileOnly`
              and drops out: Preview · Files · Code · More, with the SAME glyphs
              (Globe / FileText / Code2 / Layers) and Preview active. Same grammar
              the real header settled on: a $color4 group at $3 radius, inactive
              panes bare glyphs, the active pane the raised accent pushbutton
              ($color5, white label) wearing its NAME. */}
          <XStack alignSelf="center" display="none" $sm={{ display: "flex" }} alignItems="center" gap="$0.5" borderRadius="$3" backgroundColor="$color4">
            {VIEW_TABS.map((tabItem, i) => {
              const on = i === 0;
              return (
                <XStack
                  key={tabItem.value}
                  height={22} alignItems="center" justifyContent="center" gap="$1" borderRadius="$3" paddingHorizontal={on ? "$2" : "$1.5"} {...{ backgroundColor: on ? "$color5" : "transparent" }}
                >
                  <SizableText color={on ? "$color12" : "$color11"}><tabItem.icon size={11} /></SizableText>
                  {on && (
                    <SizableText fontSize={10} fontWeight="600" color="$color12">{tabItem.label}</SizableText>
                  )}
                </XStack>
              );
            })}
          </XStack>

          <XStack marginLeft="auto" alignItems="center" gap="$1.5" $sm={{ marginLeft: "$0" }}>
            {/* An XStack, NOT a Button: `Button size="icon"` floors at 30px and
                the [data-slot=button] rule pins radius to 10px — both beat the
                inline height/999 here, so a Button rendered a 30px rounded-rect
                that stuck out 8px above every 22px header neighbour. A gui stack
                honours the inline box (same pattern as the tabs + dashboard cards). */}
            <XStack
              role="button"
              tabIndex={0}
              aria-label="Replay the demo build"
              onClick={() => run(pick)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); run(pick); } }}
              cursor="pointer"
              height={22} width={22} minHeight={22} minWidth={22} alignItems="center" justifyContent="center" borderRadius={999} hoverStyle={{ backgroundColor: "$color3" }}
            >
              <SizableText color="$color11"><RotateCcw size={11} /></SizableText>
            </XStack>
            <XStack display="none" height={22} width={22} alignItems="center" justifyContent="center" borderRadius={999} $sm={{ display: "flex" }}>
              <SizableText color="$color11"><Clock size={11} /></SizableText>
            </XStack>
            {/* Device toggle — the real header's OTHER grouped control: a $color4
                group (rounder, $4) holding two $3 buttons, the active one the
                quiet `selected` fill ($color3 + white glyph), not the loud accent
                the view tabs use. Two grouped controls, one material. */}
            <XStack alignItems="center" gap="$0.5" borderRadius="$4" backgroundColor="$color4" $lg={{ display: "none" }}>
              <XStack
                role="button"
                tabIndex={0}
                aria-label="Desktop preview"
                aria-pressed={device === "desktop"}
                onClick={() => setDevice("desktop")}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDevice("desktop"); } }}
                cursor="pointer"
                height={22} width={22} minHeight={22} minWidth={22} alignItems="center" justifyContent="center" borderRadius="$3" {...{ backgroundColor: device === "desktop" ? "$color3" : "transparent" }}
              >
                <SizableText color={device === "desktop" ? "$color12" : "$color11"}><Monitor size={11} /></SizableText>
              </XStack>
              <XStack
                role="button"
                tabIndex={0}
                aria-label="Mobile preview"
                aria-pressed={device === "mobile"}
                onClick={() => setDevice("mobile")}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDevice("mobile"); } }}
                cursor="pointer"
                height={22} width={22} minHeight={22} minWidth={22} alignItems="center" justifyContent="center" borderRadius="$3" {...{ backgroundColor: device === "mobile" ? "$color3" : "transparent" }}
              >
                <SizableText color={device === "mobile" ? "$color12" : "$color11"}><Smartphone size={11} /></SizableText>
              </XStack>
            </XStack>
            {/* Share — the real header's quiet secondary beside Publish (editor/
                index.tsx): the SAME 999 pill as Publish, differing only in fill
                ($color4 quiet vs the accent), a Share2 glyph + label. */}
            <XStack alignItems="center" gap="$1" height={22} borderRadius={999} paddingHorizontal="$2" backgroundColor="$color4">
              <Share2 size={10} color="var(--foreground)" />
              <SizableText display="none" fontSize="$1" fontWeight="600" color="$color" $sm={{ display: "inline" }}>Share</SizableText>
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
          {/* Chat rail — transcript + the rounded composer input.
              Phones get the PREVIEW only. 36% of a 358px frame clamps to the
              120px floor, and at that width the rail's own composer rendered
              "Add a l" and its send row collapsed into a smudge — two
              illegible panes where one legible one belongs. The prompt half of
              the story is already told by the real composer directly above this
              demo, so what the mock has left to show on a phone is the OUTPUT.
              display:none is the BASE and $sm switches it back on, because these
              media queries are min-width. */}
          <YStack display="none" $sm={{ display: "flex" }} width="36%" minWidth={120} maxWidth={220} flexShrink={0} borderRightWidth={1} borderColor="$borderColor" backgroundColor="$background">
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
                  <XStack height={16} width={16} alignItems="center" justifyContent="center" borderRadius={999} backgroundColor="$color3">
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
                  <SizableText minWidth={0} flexShrink={1} numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color">{story.name}</SizableText>
                  {/* The admission travels WITH the app it is about. A caption
                      under the frame used to carry it, where it edited nothing
                      and said what the picture already showed; in the strip it
                      is on screen whenever the app's name is. */}
                  <SizableText marginLeft="auto" flexShrink={0} borderRadius="$2" backgroundColor="$color3" paddingHorizontal="$1.5" fontFamily="$mono" fontSize="$1" letterSpacing={0.4} color="$color11">Demo</SizableText>
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
                  <YStack key={`d${pick}.${v}`} height="100%" className="rise">
                    <App story={story} v={v} />
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
                    <YStack key={`m${pick}.${v}`} height="100%" className="rise">
                      <App story={story} v={v} compact />
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
          {/* Shrinkable, and minWidth 0 so it CAN: flexShrink={0} here meant the
              live URL could not yield an inch, so at 390 it ran 4px past the
              frame and the mock browser looked broken. The dot still refuses to
              shrink — it is 6px and it is the signal — and the URL truncates
              instead, the way a real address strip does. */}
          <XStack marginLeft="auto" minWidth={0} flexShrink={1} alignItems="center" gap="$1.5">
            {live ? (
              <>
                <SizableText flexShrink={0} height={6} width={6} borderRadius="$10" backgroundColor="$color" className="livedot" />
                <SizableText numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color">{story.name} is live</SizableText>
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

      {/* Have the one you are watching. It drops this example's opening prompt
          into the page's composer — the same fill a starter chip does, so the
          draft can be read and edited before it is sent, by the send button and
          Enter a typed idea uses. */}
      <SizableText
        role="button"
        tabIndex={0}
        onClick={() => ask(story.steps[0].prompt)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ask(story.steps[0].prompt); } }}
        className="hz-tap"
        cursor="pointer" alignSelf="center" marginTop="$4" fontFamily="$mono" fontSize="$1" color="$color11" hoverStyle={{ color: "$color" }}
      >
        Build {story.name} →
      </SizableText>
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
