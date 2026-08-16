"use client";

// The product tour on /features.
//
// The six things every app gets used to be six full-bleed cards of prose: an
// icon, two lines and four ticks, stacked head to toe. A card can only ASSERT
// that there is an editor and a database; this shows them. Each stop opens the
// builder pane that actually does the thing — Files for the editor, More ›
// Database for the data plane, More › Analytics for the traffic — so the page
// reads as a walk through the product instead of a wall of claims.
//
// Drawn in HTML, like `hero-preview` and for the same measured reasons: a frame
// of markup is sharp at every width, costs no megabyte per aspect ratio, and is
// the builder's own vocabulary rather than a picture of it, so it cannot drift
// into showing a screen the product no longer has. A rendered film would have
// to be re-cut for the phone, the tablet and the laptop this page already
// serves from one tree.
//
// The MOTION is entirely CSS. Scrolling a stop into view makes it current; the
// frame swaps its body under a `key`, which restarts the staggered rise on the
// new pane's rows. No timers, no animation runtime, nothing to keep in sync
// with a clock. Reduced motion keeps every stop legible and still — the rows
// arrive instantly and the frame simply shows the first stop.

import { useEffect, useRef, useState, type ReactElement } from "react";
import { YStack, XStack, SizableText, H2, H3, Paragraph } from "@hanzo/ui";
import {
  ArrowUp,
  Check,
  ChevronDown,
  Database,
  FileText,
  Globe,
  Mic,
  Plus,
  Search,
  Shield,
  Sparkles,
  Type,
} from "lucide-react";
import { PANES, type RightPane } from "@/lib/panes";
import { HanzoLogo } from "@/components/HanzoLogo";
import Reveal from "./reveal";

// The frame's tabs ARE the builder's, read from the ONE list — the same reason
// the hero reads it: a hand-copied tab set is how this mockup goes stale.
const TABS = PANES.filter((p) => !("mobileOnly" in p));

/* ── The atoms every scene is built from ──────────────────────────────────
   Three shapes cover all six panes, because the real panes are built from
   three shapes: a row, a measured bar, and a heading over a group of rows. */

/** One row of a pane: a mono label, an optional trailing value. `on` is the
 *  selected row — the fill the real builder gives a chosen file or nav item. */
function Row({
  label,
  value,
  on,
  icon,
  i = 0,
}: {
  label: string;
  value?: string;
  on?: boolean;
  icon?: ReactElement;
  i?: number;
}) {
  return (
    <XStack
      className="wt-row"
      style={{ animationDelay: `${i * 55}ms` }}
      alignItems="center"
      gap="$1.5"
      borderRadius="$3"
      paddingHorizontal="$2"
      paddingVertical="$1.5"
      {...{ backgroundColor: on ? "$color3" : "transparent" }}
    >
      {icon ? <SizableText color="$color11">{icon}</SizableText> : null}
      <SizableText
        minWidth={0}
        flex={1}
        numberOfLines={1}
        fontFamily="$mono"
        fontSize="$1"
        {...{ color: on ? "$color" : "$color11" }}
      >
        {label}
      </SizableText>
      {value ? (
        <SizableText flexShrink={0} fontFamily="$mono" fontSize="$1" color="$color11">
          {value}
        </SizableText>
      ) : null}
    </XStack>
  );
}

/** A measured row — label, bar, count. The tour's one chart mark, used by the
 *  data pane and the traffic pane, which is what those two panes really are. */
function Meter({ label, w, n, i = 0 }: { label: string; w: string; n: string; i?: number }) {
  return (
    <YStack className="wt-row" style={{ animationDelay: `${i * 55}ms` }} gap="$1" paddingVertical="$1">
      <XStack alignItems="center" gap="$2">
        <SizableText minWidth={0} flex={1} numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color11">
          {label}
        </SizableText>
        <SizableText fontFamily="$mono" fontSize="$1" color="$color">
          {n}
        </SizableText>
      </XStack>
      <YStack height={4} borderRadius={999} backgroundColor="$color3">
        <YStack height={4} width={w} borderRadius={999} backgroundColor="$color8" />
      </YStack>
    </YStack>
  );
}

/** The More pane: its own left nav with the open item lit, and a detail panel.
 *  Three stops live in here because in the product they do — Secrets, Database
 *  and Analytics are all sections of More. */
const MORE_NAV = ["Analytics", "Database", "Users", "Storage", "Secrets", "Logs"] as const;

function More({ on, children }: { on: string; children: ReactElement }) {
  return (
    <XStack flex={1} minHeight={0} gap="$3">
      {/* The rule is what keeps the nav a nav. Without it the labels and the
          detail rows share a baseline grid and read as one table. */}
      <YStack display="none" $sm={{ display: "flex" }} width={112} flexShrink={0} gap="$0.5" borderRightWidth={1} borderColor="$borderColor" paddingRight="$2">
        {MORE_NAV.map((n, i) => (
          <Row key={n} label={n} on={n === on} i={i} />
        ))}
      </YStack>
      <YStack minWidth={0} flex={1} gap="$0.5">
        {children}
      </YStack>
    </XStack>
  );
}

/* ── The six stops ─────────────────────────────────────────────────────────
   Copy is the page's own, unchanged. What is new is `pane` and `scene`: which
   part of the builder this happens in, and what it looks like when it does.

   Everything inside a frame belongs to one clearly-labelled demo app — the
   same "Shift Board" the hero builds. No customer, and no number presented as
   ours: the figures are the demo app's own content. */

interface Stop {
  icon: ReactElement;
  title: string;
  body: string;
  points: readonly string[];
  /** The builder tab that lights up while this stop is current. */
  pane: RightPane;
  scene: ReactElement;
}

const STOPS: readonly Stop[] = [
  {
    icon: <Sparkles size={18} />,
    title: "Code from a description",
    body: "Say what you want and Hanzo writes the files — components, styles, routes, and the server code behind them",
    points: ["Zen and Enso models", "Edits across files, not one at a time", "HTML, CSS, TypeScript and SQL", "Streams as it writes"],
    pane: "preview",
    scene: (
      <YStack flex={1} minHeight={0} gap="$2">
        <YStack className="wt-row" alignSelf="flex-end" maxWidth="88%" borderRadius="$6" backgroundColor="$color3" paddingHorizontal="$2.5" paddingVertical="$1.5">
          <SizableText fontSize="$1" lineHeight="1.375" color="$color">
            Build a shift board for my coffee cart — staff claim open shifts
          </SizableText>
        </YStack>
        {["Generating index.html", "Shift list + claim button", "Rendering preview"].map((l, i) => (
          <Row key={l} label={l} icon={<Check size={10} strokeWidth={3} />} i={i + 1} />
        ))}
        {/* The composer, the way the builder draws it: the prompt row, then
            [+] · Build ⌄ · mic · send. */}
        <YStack marginTop="auto" gap="$1.5" borderRadius="$6" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$2.5" paddingVertical="$1.5">
          <SizableText numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color11">
            Ask Hanzo for edits
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
    ),
  },
  {
    icon: <Type size={18} />,
    title: "An editor that stays open",
    body: "The generated code is right there. Read it, change it by hand, and keep talking about it in the same window",
    points: ["The whole file tree", "Edit any file yourself", "Live preview, desktop and phone", "Checkpoints you can roll back to"],
    pane: "files",
    scene: (
      <XStack flex={1} minHeight={0} gap="$3">
        <YStack width="42%" minWidth={0} gap="$0.5">
          <XStack className="wt-row" alignItems="center" gap="$1.5" borderRadius="$3" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$2" paddingVertical="$1.5">
            <Search size={10} opacity={0.5} />
            <SizableText fontFamily="$mono" fontSize="$1" color="$color11">Search files</SizableText>
          </XStack>
          {[
            ["index.html", "1.5 KB"],
            ["shifts.css", "820 B"],
            ["claim.ts", "1.1 KB"],
            ["schema.sql", "410 B"],
          ].map(([f, size], i) => (
            <Row key={f} label={f} value={size} on={i === 0} icon={<FileText size={10} />} i={i + 1} />
          ))}
        </YStack>
        {/* The code panel: the real Files pane heads it with the filename and
            its size, then the file. */}
        <YStack minWidth={0} flex={1} overflow="hidden" borderRadius="$4" borderWidth={1} borderColor="$borderColor">
          <XStack alignItems="center" gap="$2" borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$color2" paddingHorizontal="$2.5" paddingVertical="$1.5">
            <SizableText minWidth={0} flex={1} numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color">index.html</SizableText>
            <SizableText fontFamily="$mono" fontSize="$1" color="$color11">1.5 KB</SizableText>
          </XStack>
          <YStack flex={1} gap="$1.5" padding="$2.5">
            {[
              '<section id="shifts">',
              '  <h1>Open shifts</h1>',
              '  <ul class="list"></ul>',
              "</section>",
            ].map((l, i) => (
              <SizableText key={l} className="wt-row" style={{ animationDelay: `${(i + 5) * 55}ms` }} numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color11">
                {l}
              </SizableText>
            ))}
          </YStack>
        </YStack>
      </XStack>
    ),
  },
  {
    icon: <Globe size={18} />,
    title: "Publish to a URL",
    body: "One click puts the app on a hanzo.app address. Point your own domain at it from the app's settings",
    points: ["One-click publish", "Your own domain", "Global CDN", "Edge functions"],
    pane: "preview",
    scene: (
      <YStack flex={1} minHeight={0} gap="$2">
        {/* The address strip the preview wears once an app is live. */}
        <XStack className="wt-row" alignItems="center" gap="$2" borderRadius="$3" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$2.5" paddingVertical="$1.5">
          <svg viewBox="0 0 24 24" width={10} height={10} opacity={0.35} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <rect x="4" y="10" width="16" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 1 1 8 0v3" />
          </svg>
          <SizableText minWidth={0} flex={1} numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color">
            shift-board.hanzo.app
          </SizableText>
          {/* The one hue on the page, and it is semantic: live. */}
          <XStack alignItems="center" gap="$1">
            <YStack height={6} width={6} borderRadius={999} backgroundColor="#2fbf8f" />
            <SizableText fontFamily="$mono" fontSize="$1" color="$color11">Live</SizableText>
          </XStack>
        </XStack>
        {[
          ["Custom domain", "shifts.example.com"],
          ["Certificate", "issued"],
          ["Served from", "the edge"],
          ["Last publish", "just now"],
        ].map(([k, v], i) => (
          <Row key={k} label={k} value={v} i={i + 1} />
        ))}
      </YStack>
    ),
  },
  {
    icon: <Shield size={18} />,
    title: "Keys and access",
    body: "API keys live in Hanzo KMS and never in the code. Sign-in and org-scoped access come from Hanzo IAM",
    points: ["Secrets in Hanzo KMS", "Sign-in through Hanzo IAM", "Role-based access", "Compatible with SOC 2 Type II"],
    pane: "more",
    scene: (
      <More on="Secrets">
        <YStack gap="$0.5">
          {/* A key is shown the way a key must be shown: by its prefix. */}
          {[
            ["HANZO_API_KEY", "hk_live_••••4f2a"],
            ["STRIPE_SECRET", "sk_live_••••9c17"],
            ["DATABASE_URL", "••••••••"],
          ].map(([k, v], i) => (
            <Row key={k} label={k} value={v} i={i} />
          ))}
          <XStack className="wt-row" style={{ animationDelay: "165ms" }} alignItems="center" gap="$1.5" marginTop="$2" paddingHorizontal="$2">
            <Check size={10} strokeWidth={3} />
            <SizableText fontFamily="$mono" fontSize="$1" color="$color11">Held in Hanzo KMS</SizableText>
          </XStack>
          {[
            ["Sign-in", "Hanzo IAM"],
            ["Roles", "owner · editor · viewer"],
          ].map(([k, v], i) => (
            <Row key={k} label={k} value={v} i={i + 4} />
          ))}
        </YStack>
      </More>
    ),
  },
  {
    icon: <Database size={18} />,
    title: "A database, already there",
    body: "Every app gets Hanzo Base — SQLite with realtime queries — and its schema comes from what you asked for",
    points: ["Hanzo Base, on SQLite", "Realtime queries", "Schema from your prompt", "Automatic backups"],
    pane: "more",
    scene: (
      <More on="Database">
        <YStack gap="$0.5">
          <Row label="shifts" value="rows" i={0} on />
          {[
            ["Thu · morning", "80%", "4"],
            ["Fri · evening", "60%", "3"],
            ["Sat · morning", "40%", "2"],
          ].map(([l, w, n], i) => (
            <Meter key={l} label={l} w={w} n={n} i={i + 1} />
          ))}
          <XStack className="wt-row" style={{ animationDelay: "220ms" }} alignItems="center" gap="$1.5" marginTop="$2" paddingHorizontal="$2">
            <Check size={10} strokeWidth={3} />
            <SizableText fontFamily="$mono" fontSize="$1" color="$color11">Hanzo Base · SQLite · realtime</SizableText>
          </XStack>
        </YStack>
      </More>
    ),
  },
  {
    icon: <Sparkles size={18} />,
    title: "See what visitors do",
    body: "Once an app is published, its dashboard fills up with who came, what they did, and where they clicked",
    points: ["Traffic over time", "Sessions", "Click heatmaps", "Engagement metrics"],
    pane: "more",
    scene: (
      <More on="Analytics">
        <YStack gap="$0.5">
          {/* Seven days of the demo app's own traffic. */}
          <XStack alignItems="flex-end" gap="$1.5" height={72} paddingHorizontal="$2" paddingBottom="$2">
            {["38%", "54%", "46%", "72%", "63%", "88%", "70%"].map((h, i) => (
              <YStack
                key={i}
                className="wt-bar"
                style={{ animationDelay: `${i * 55}ms`, height: h }}
                flex={1}
                borderRadius={2}
                backgroundColor="$color8"
              />
            ))}
          </XStack>
          {[
            ["Visitors", "1,284"],
            ["Sessions", "2,041"],
            ["Top page", "/shifts"],
          ].map(([k, v], i) => (
            <Row key={k} label={k} value={v} i={i + 7} />
          ))}
        </YStack>
      </More>
    ),
  },
];

/* ── The tour ─────────────────────────────────────────────────────────────*/

export default function Walkthrough() {
  const [at, setAt] = useState(0);
  const steps = useRef<(HTMLElement | null)[]>([]);

  // Scrolling a stop into the middle band of the viewport makes it current.
  // One observer over all six, so "which stop am I on" has one answer.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!hit) return;
        const i = steps.current.indexOf(hit.target as HTMLElement);
        if (i >= 0) setAt(i);
      },
      // The reading line sits at 55% of the screen, and that number is the one
      // thing here worth stating. A stop becomes current when its heading
      // crosses the line, so it becomes current with its whole block on screen
      // and BELOW the pinned frame — a centred line handed the tour a stop
      // whose title was still behind the frame on a phone. Past that, the stop
      // rises under the frame as you keep scrolling, which is what sticky is.
      { rootMargin: "-55% 0px -35% 0px" },
    );
    steps.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const stop = STOPS[at];

  return (
    <YStack className="wt" paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$10" }}>
      <style>{`
        @keyframes wtRise { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        @keyframes wtGrow { from { transform: scaleY(.15); opacity: 0 } to { transform: none; opacity: 1 } }
        .wt .wt-row { animation: wtRise .34s ease-out both; }
        .wt .wt-bar { animation: wtGrow .42s cubic-bezier(.4,0,.2,1) both; transform-origin: bottom; }
        /* The stop you are on brightens and its rule lights up; the tab the
           frame moves to slides its fill. Both are CSS transitions on values
           the component sets as props — the same division reveal.tsx keeps,
           and this app configures no gui animation driver. */
        .wt .wt-step { transition: opacity .3s ease-out, border-color .3s ease-out; }
        .wt .wt-tab { transition: background-color .25s ease-out, padding .25s ease-out; }
        /* The frame floats on the page's own black, the way the hero's does:
           a pool that darkens the ground plus a rim the ground cannot draw. */
        .wt .window {
          box-shadow:
            0 32px 64px -16px rgba(0, 0, 0, .9),
            0 8px 24px -8px rgba(0, 0, 0, .7),
            0 0 0 1px rgba(255, 255, 255, .06);
        }
        /* Sticky is the whole mechanism: the frame holds still while the stops
           scroll past it. Below $lg the two columns stack, so the frame sticks
           under the header instead of beside the text. */
        .wt .stage { position: sticky; top: 76px; }
        @media (min-width: 1024px) { .wt .stage { top: 96px; } }
        @media (prefers-reduced-motion: reduce) {
          .wt .wt-row, .wt .wt-bar { animation: none; }
          .wt .wt-step, .wt .wt-tab { transition: none; }
        }
      `}</style>

      {/* `width="100%"`: centred in its parent, this column is otherwise
          shrink-to-fit and `maxWidth` caps a width it never takes. */}
      <YStack alignSelf="center" width="100%" maxWidth={1152}>
        <Reveal alignSelf="center" width="100%" maxWidth={672} alignItems="center" marginBottom="$10">
          <H2 textAlign="center" fontSize="$10" fontWeight="500" letterSpacing={-0.4} lineHeight="1.1" $md={{ fontSize: "$11" }}>
            The parts of an app you don&apos;t have to write
          </H2>
          <Paragraph marginTop="$4" textAlign="center" fontSize="$4" color="$color11" lineHeight="1.5" $md={{ fontSize: "$6" }}>
            Each one is a Hanzo product, connected before you ask for it. Scroll,
            and the builder opens the part that does it.
          </Paragraph>
        </Reveal>

        {/* A COLUMN at the base, a row only from $lg — these media queries are
            min-width, so the phone case is the base value and the desktop one
            switches it. The stage leads in the source (you meet the product
            before you read about it, and a screen reader gets that order too);
            `row-reverse` is what puts it on the RIGHT from $lg without moving
            it in the tree. */}
        <YStack gap="$6" $lg={{ flexDirection: "row-reverse", gap: "$10" }}>
          {/* No `flex` at the base, and that is the whole bug this cost. The
              parent is a COLUMN below $lg, so `flex={1}` sets the HEIGHT basis
              to 0 in gui's flex model — measured: the stage was 0px tall at 768
              and at 390, a walkthrough with no frame in it, painting nothing
              and erroring nowhere. Flex belongs to the ROW, so it is declared
              only where the row exists. */}
          {/* `zIndex` is load-bearing on a phone, where the pinned frame and the
              steps share the same space. Every gui stack is `position:
              relative`, so the steps are POSITIONED siblings at z-auto and DOM
              order alone decided the painting — the steps came later and drew
              straight through an opaque frame (measured `rgb(10,10,10)` and
              still see-through). One rung lifts the frame over them. */}
          <YStack className="stage" zIndex={1} minWidth={0} alignSelf="flex-start" width="100%" $lg={{ width: "auto", flexGrow: 1, flexBasis: 0 }}>
            <Frame stop={stop} />
          </YStack>

          <YStack minWidth={0} width="100%" $lg={{ width: 440, flexGrow: 0, flexShrink: 0 }}>
            {/* The dim is 0.62, and that number is a contrast floor rather than
                a taste. A stop you are not on still has to be READ: at 0.5 the
                body text composited to 3.72:1 against this ground, under AA's
                4.5. 0.62 measures 5.2, and the stop you ARE on is still marked
                twice over — full ink, and its rule. */}
            {STOPS.map((s, i) => (
              <YStack
                key={s.title}
                ref={((el: HTMLElement | null) => { steps.current[i] = el; }) as never}
                className="wt-step"
                borderLeftWidth={2}
                paddingLeft="$5"
                paddingVertical="$6"
                opacity={i === at ? 1 : 0.62}
                {...{ borderColor: i === at ? "$color" : "$color3" }}
                $lg={{ paddingVertical: "$8" }}
              >
                <XStack alignItems="center" gap="$3">
                  {s.icon}
                  <H3 fontSize="$7" fontWeight="500" letterSpacing={-0.4} color="$color">
                    {s.title}
                  </H3>
                </XStack>
                {/* A YStack, not a div: H3 and Paragraph are TEXT primitives
                    and render inline, so a block box runs them together on one
                    line. Only a flex column stacks them. */}
                <YStack marginTop="$3" gap="$3">
                  <Paragraph fontSize="$4" color="$color11" lineHeight="1.625">
                    {s.body}
                  </Paragraph>
                  <YStack gap="$1.5">
                    {s.points.map((p) => (
                      <XStack key={p} alignItems="center" gap="$2">
                        <Check size={14} />
                        <SizableText minWidth={0} flex={1} fontSize="$3" color="$color">{p}</SizableText>
                      </XStack>
                    ))}
                  </YStack>
                </YStack>
              </YStack>
            ))}
          </YStack>
        </YStack>
      </YStack>
    </YStack>
  );
}

/** The builder in miniature: its real chrome, and the current stop's pane in
 *  the body. The body carries the stop's index as its `key`, so arriving at a
 *  stop remounts it and the staggered rise plays again. */
function Frame({ stop }: { stop: Stop }) {
  const live = stop.pane === "preview" && stop.title.startsWith("Publish");
  return (
    <YStack className="window" overflow="hidden" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$background">
      <XStack alignItems="center" gap="$3" borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$color2" paddingHorizontal="$3" paddingVertical="$2">
        <HanzoLogo size={14} color="var(--foreground)" />
        <SizableText display="none" $sm={{ display: "inline" }} numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color">
          maxpower / shift-board
        </SizableText>

        <XStack alignSelf="center" alignItems="center" gap="$0.5" borderRadius="$3" backgroundColor="$color4">
          {TABS.map((t) => {
            const on = t.value === stop.pane;
            return (
              <XStack
                key={t.value}
                className="wt-tab"
                height={22}
                alignItems="center"
                justifyContent="center"
                gap="$1"
                borderRadius="$3"
                paddingHorizontal={on ? "$2" : "$1.5"}
                {...{ backgroundColor: on ? "$color5" : "transparent" }}
              >
                <SizableText color={on ? "$color12" : "$color11"}><t.icon size={11} /></SizableText>
                {on ? <SizableText fontSize={10} fontWeight="600" color="$color12">{t.label}</SizableText> : null}
              </XStack>
            );
          })}
        </XStack>

        <XStack marginLeft="auto" alignItems="center" gap="$1" height={22} borderRadius={999} paddingHorizontal="$2" {...{ backgroundColor: live ? "$color3" : "$color5" }}>
          {live ? <Check size={10} strokeWidth={3} color="var(--foreground)" /> : null}
          <SizableText fontSize="$1" fontWeight="600" {...{ color: live ? "$color" : "$color12" }}>
            {live ? "Published" : "Publish"}
          </SizableText>
        </XStack>
      </XStack>

      {/* `key` on the BODY: arriving at a stop remounts the pane, which is what
          restarts the staggered rise. It is also why the frame needs a fixed
          height — six panes of different content in one box that must not
          resize under the reader as the tour moves. */}
      <YStack key={stop.title} height={240} padding="$3" $md={{ height: 300 }} $lg={{ height: 340 }}>
        {stop.scene}
      </YStack>
    </YStack>
  );
}
