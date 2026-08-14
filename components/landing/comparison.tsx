"use client";

import { Button } from '@hanzo/ui';
import { SizableText, YStack, Paragraph, H2, XStack, H3 } from '@hanzo/ui';
// `GuiElement` is a TYPE, and @hanzo/ui's dts build drops a two-hop
// type-only re-export, so it is not on the barrel yet. A type is erased at
// build and cannot create a second runtime, so this does not reintroduce
// the two-copies problem the rest of this migration exists to prevent.
import type { GuiElement } from '@hanzo/gui';
// Why Hanzo — the competitive-advantage matrix.
//
// A single conversion centerpiece: ten buyer criteria across Hanzo and the
// alternatives (site builders + AI coding tools). Hanzo is row one, elevated,
// with a clean sweep of green — the rest speckle amber/red. The visual pattern
// IS the argument.
//
// One data source (`ROWS`), two layouts so it reads well on every screen:
//   • lg+  → a scannable table (traffic-light dots carry tone; full phrasing
//            rides in a title tooltip to keep columns tight).
//   • <lg  → stacked cards. Hanzo is fully expanded (its ten advantages are the
//            pitch); each competitor is a collapsed <details> you can open.
//
// Tone → color follows the site's semantic rule (green = advantage, amber =
// caveat, red = weakness); "—" = not applicable to that tool.

import { useRef } from "react";
import {
  Wallet,
  Lock,
  Zap,
  SlidersHorizontal,
  Target,
  TrendingUp,
  ShieldCheck,
  Wrench,
  Layers,
  Palette,
  type LucideIcon,
} from "lucide-react";
import Reveal from "./reveal";

type Tone = "good" | "mid" | "bad" | "na";
interface Cell {
  t: Tone;
  v: string; // short verdict, shown everywhere
  d?: string; // detail, shown in the tooltip + mobile cards
}
interface Row {
  name: string;
  note?: string; // sub-label under the name (e.g. category)
  hanzo?: boolean;
  cells: Cell[];
}

// Column criteria — concise header + an icon (scannability), full phrasing in
// `full` (tooltip + a11y).
const COLS: { short: string; full: string; icon: LucideIcon }[] = [
  { short: "Hidden costs", full: "Hidden costs", icon: Wallet },
  { short: "Lock-in", full: "Vendor lock-in", icon: Lock },
  { short: "Performance", full: "Performance — bloated / slow?", icon: Zap },
  { short: "Customization", full: "Customization limits", icon: SlidersHorizontal },
  { short: "AI accuracy", full: "AI accuracy / reliability", icon: Target },
  { short: "Scales up", full: "Scales to complex projects", icon: TrendingUp },
  { short: "Security", full: "Security risk", icon: ShieldCheck },
  { short: "Maintenance", full: "Maintenance burden", icon: Wrench },
  { short: "AI context", full: "Context limits — AI / large projects", icon: Layers },
  { short: "Design", full: "Design quality / output", icon: Palette },
];

// Cell constructors keep the data table below readable.
const g = (v: string, d?: string): Cell => ({ t: "good", v, d });
const m = (v: string, d?: string): Cell => ({ t: "mid", v, d });
const b = (v: string, d?: string): Cell => ({ t: "bad", v, d });
const n = (d?: string): Cell => ({ t: "na", v: "—", d });

const ROWS: Row[] = [
  {
    name: "Hanzo",
    hanzo: true,
    cells: [
      g("Usage pricing", "One monthly allowance, and no fee for anything else"),
      g("None", "Open source. Push the code to your own repo whenever you like"),
      g("Fast", "Runs on Hanzo Cloud, behind a CDN"),
      g("Unlimited", "Real code you can open and edit, so nothing is off limits"),
      g("Frontier models", "Enso, our own frontier model, and every other model on Hanzo AI"),
      g("Built to scale", "The first version and the production one are the same app"),
      g("Private by default", "Run it on Hanzo Cloud, or take the code and host it yourself"),
      g("Near-zero", "Hanzo Cloud runs the servers, the database and the deploys"),
      g("Whole project", "It reads across the files it needs, not one file at a time"),
      g("Ships styled", "Screens arrive laid out and styled, not as wireframes"),
    ],
  },
  {
    name: "Wix",
    note: "Site builder",
    cells: [
      b("Yes", "Limited features require upgrades"),
      b("Yes", "Cannot export the site"),
      b("Slow", "Bloated code"),
      b("Limited", "Drag-and-drop constraints"),
      n(),
      b("Slow", "Restrictive for large stores/sites"),
      m("Low–moderate", "Platform managed but a black box"),
      m("Medium", "Platform updates + manual mobile fixes"),
      n(),
      m("Basic", "Templates look similar"),
    ],
  },
  {
    name: "Shopify",
    note: "Site builder",
    cells: [
      b("High", "Apps + transaction fees"),
      b("Yes", "Locked into the ecosystem"),
      m("Medium", "Can be slow with apps"),
      b("Limited", "Checkout + design restrictions"),
      n(),
      b("Medium–slow", "Expensive to scale"),
      m("Low–moderate", "SaaS security but app risks"),
      m("Medium", "App updates + app management"),
      n(),
      m("Basic", "Themes feel similar"),
    ],
  },
  {
    name: "Squarespace",
    note: "Site builder",
    cells: [
      b("Medium–high", "Upgrades for advanced features"),
      b("Yes", "Locked into the platform"),
      m("Medium", "Block-based overhead"),
      b("Limited", "Block editor + 1-level nav"),
      n(),
      b("Medium–slow", "Not ideal for large inventories/sites"),
      m("Low–moderate", "Platform managed"),
      m("Medium", "Platform updates + manual fixes"),
      n(),
      m("Basic", "Block templates feel similar"),
    ],
  },
  {
    name: "WordPress",
    note: "Site builder",
    cells: [
      b("High", "Plugins, themes, hosting, dev time"),
      g("No", "Fully exportable"),
      b("Slow", "Plugin bloat, security scans"),
      g("Unlimited", "Open source"),
      n(),
      b("Medium–slow", "Becomes complex at scale"),
      b("High", "Plugin vulnerabilities common"),
      b("High", "Plugins, updates, backups, fixes"),
      n(),
      m("Varies", "Depends on theme / dev skill"),
    ],
  },
  {
    name: "Supabase",
    note: "Backend",
    cells: [
      b("Medium–high", "Pay-as-you-grow"),
      g("No", "Data exportable"),
      m("Medium", "Depends on architecture"),
      g("High", "Flexible backend"),
      n(),
      m("Medium", "SQL + infra complexity"),
      b("High", "Misconfigurable permissions"),
      b("Medium–high", "RLS rules, schema changes, scaling"),
      n(),
      n("Backend only"),
    ],
  },
  {
    name: "Cursor",
    note: "AI coding tool",
    cells: [
      b("High", "Usage-based compute costs"),
      g("No", "Can use other editors"),
      b("Slow", "Heavy CPU, RAM, background indexing"),
      m("Medium", "Not a design tool"),
      m("Medium", "Hallucinates, creates bugs"),
      b("Medium–slow", "Needs heavy review at scale"),
      b("Medium–high", "Can generate vulnerable code"),
      b("High", "Debugging + cleanup time"),
      b("Low–medium", "Less context on big codebases"),
      b("Low", "UI code lacks polish"),
    ],
  },
  {
    name: "Codeium",
    note: "AI coding tool",
    cells: [
      m("Medium", "Limited free tier, paid for scale"),
      g("No", "Works in many editors"),
      b("Slow", "Suggestions + background tasks"),
      m("Medium", "Not a design tool"),
      b("Low–medium", "Duplicates, broken code, overwrite risk"),
      b("Medium–slow", "Struggles with large projects"),
      b("High", "Can generate insecure code"),
      b("High", "Fix redundant code, debug issues"),
      b("Low", "Small context window"),
      b("Low", "Generic code patterns"),
    ],
  },
  {
    name: "Claude",
    note: "AI assistant",
    cells: [
      m("Medium", "Usage limits + paid plans"),
      g("No"),
      m("Medium", "Depends on output + integrations"),
      b("Low–medium", "Web design limitations"),
      m("Medium", "Can hallucinate / be generic"),
      b("Medium–slow", "Web dev tools are basic"),
      m("Low–moderate", "Secure, but integrations add risk"),
      m("Medium", "Iterations + manual fixes"),
      m("Medium", "Loses detail in long projects"),
      b("Low–medium", "Cookie-cutter designs"),
    ],
  },
  {
    name: "ChatGPT",
    note: "AI assistant",
    cells: [
      g("Low", "Free tier available"),
      g("No"),
      m("Medium", "Not real-time, can be slow"),
      b("Low", "Not built for web design"),
      b("Low–medium", "Hallucinates, generic answers"),
      b("Slow", "Not built for large project execution"),
      m("Medium", "Privacy concerns with data input"),
      m("Low–medium", "Occasional verifications"),
      b("Low–medium", "Context degrades in long chats"),
      b("Low–medium", "Generic text responses"),
    ],
  },
  {
    name: "Antigravity",
    note: "AI coding tool",
    cells: [
      b("High", "Usage lockouts, paid tiers"),
      b("Yes", "Agents + IDE split + vendor lock-in"),
      b("Slow", "High memory usage, background tasks"),
      m("Medium", "Limited marketplace compatibility"),
      m("Medium", "Hallucinates, needs review"),
      b("Medium–slow", "Complicated workflow"),
      m("Medium", "Cloud-based agent risks"),
      b("High", "Quotas, context resets, formatting changes"),
      b("Low–medium", "Less context on big projects"),
      n("Developer tool, not a design tool"),
    ],
  },
  {
    name: "Tab Editor",
    note: "Visual editor",
    cells: [
      m("Medium", "Upgrades for features"),
      b("Yes", "Cannot export clean code"),
      b("Slow", "Bloated generated code"),
      b("Low–medium", "Grid constraints, not fully flexible"),
      n(),
      b("Medium–slow", "Mobile + complex layouts are hard"),
      m("Low–moderate", "Platform managed"),
      m("Medium", "Manual mobile fixes, tweaks"),
      n(),
      b("Low–medium", "Grid limits creativity"),
    ],
  },
];

// Severity reads as LIGHTNESS, not hue — the house is monochrome, and the
// argument ("row one is a clean sweep") survives it: Hanzo's row stays solid
// white while everyone else's dots fade out.
const DOT: Record<Tone, React.ComponentProps<typeof YStack>> = {
  good: { backgroundColor: "$color" },
  mid: { backgroundColor: "$color", opacity: 0.45 },
  bad: { backgroundColor: "$color", opacity: 0.2 },
  na: { backgroundColor: "transparent", borderWidth: 1, borderColor: "$color", opacity: 0.2 },
};
const TEXT: Record<Tone, string> = {
  good: "$color",
  mid: "$color",
  bad: "$color11",
  na: "$color11",
};

// A stack, not a text. `SizableText` renders a <span>, and width/height do not
// build a box on an inline element: every dot measured 0x7 or 12.7x18 with the
// fill painting nothing, so the legend read as four bare words and the "clean
// sweep of green" that IS the argument was never on screen. `flexShrink={0}`
// because these sit in flex rows that would otherwise crush them to zero.
function Dot({ tone }: { tone: Tone }) {
  return <YStack aria-hidden height={7} width={7} flexShrink={0} borderRadius="$10" {...DOT[tone]} />;
}

// The criterion's icon by column index (JSX can't render COLS[ci].icon inline).
function ColIcon({ i, size = 14 }: { i: number; size?: number }) {
  const Icon = COLS[i].icon;
  return <Icon size={size} color="var(--muted-foreground)" strokeWidth={1.5} aria-hidden />;
}

export default function Comparison() {
  const scrollRef = useRef<GuiElement>(null);
  // Page the criteria columns; the pinned Company column stays put.
  const slide = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el || !("scrollBy" in el)) return;
    el.scrollBy({ left: dir * Math.max(340, el.clientWidth * 0.8), behavior: "smooth" });
  };
  return (
    <YStack position="relative" borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$10" }}>
      <YStack alignSelf="center" maxWidth={1152}>
        <Reveal alignSelf="center" width="100%" maxWidth={672}>
          <Paragraph textAlign="center" fontFamily="$mono" fontSize="$1" color="$color11">
            Why Hanzo
          </Paragraph>
          <H2 textAlign="center" marginTop="$4" fontSize="$10" fontWeight="500" letterSpacing={-0.4} $md={{ fontSize: "2.75rem", lineHeight: "1.1" }}>
            All of it in one place.
          </H2>
          <Paragraph textAlign="center" marginTop="$4" fontSize="$4" color="$color11" $md={{ fontSize: "$6" }} lineHeight="1.5">
            Site builders will not give you the code. AI coding tools give you
            the code and leave you to run it. Hanzo writes the app, runs it, and
            gives you the code.
          </Paragraph>
        </Reveal>

        {/* Legend */}
        <Reveal
          delay={60}
          marginTop="$6" flexDirection="row" flexWrap="wrap" alignItems="center" justifyContent="center" columnGap="$4" rowGap="$2"
        >
          <XStack alignItems="center" gap="$1.5">
            <Dot tone="good" />
            <SizableText fontFamily="$mono" fontSize="$1" color="$color11">Advantage</SizableText>
          </XStack>
          <XStack alignItems="center" gap="$1.5">
            <Dot tone="mid" />
            <SizableText fontFamily="$mono" fontSize="$1" color="$color11">Caveat</SizableText>
          </XStack>
          <XStack alignItems="center" gap="$1.5">
            <Dot tone="bad" />
            <SizableText fontFamily="$mono" fontSize="$1" color="$color11">Weakness</SizableText>
          </XStack>
          <XStack alignItems="center" gap="$1.5">
            <Dot tone="na" />
            <SizableText fontFamily="$mono" fontSize="$1" color="$color11">N/A</SizableText>
          </XStack>
        </Reveal>

        {/* ── Desktop / tablet-wide: sliding matrix ─────────────── */}
        {/* Hidden by default, shown from $lg up — the exact complement of the
            mobile card list below, which is hidden FROM $lg up. `$lg` is
            MIN-WIDTH 1024 here: @hanzogui/config/v5 defines every bare
            breakpoint key as minWidth (sm 640, md 768, lg 1024, xl 1280), the
            same direction as Tailwind. Max-width needs the explicit `$max-lg`
            key. The `maxWidth` in @hanzogui/config's types/config.d.ts is stale
            and contradicts both runtime maps — reading it is how this guard's
            direction gets misread.

            This line previously had `display="none"` and no responsive prop at
            all, so the matrix rendered at NO width, and above 1024 (where the
            card list hides) the section was nothing but its own heading. */}
        <YStack marginTop="$7" display="none" $lg={{ display: "flex" }}>
          <Reveal delay={80}>
            <XStack marginBottom="$3" alignItems="center" justifyContent="space-between" gap="$4">
              <Paragraph fontFamily="$mono" fontSize="$1" color="$color11">
                Slide to see the rest →
              </Paragraph>
              <XStack gap="$2">
                <Button size="icon"
                  type="button"
                  variant="ghost"
                  onClick={() => slide(-1)}
                  aria-label="Previous criteria"
                  group
                  height={36} width={36} alignItems="center" justifyContent="center" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" hoverStyle={{ borderColor: "$color06" }}
                >
                  <SizableText color="$color11" $group-hover={{ color: "$color" }}>
                    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </SizableText>
                </Button>
                <Button size="icon"
                  type="button"
                  variant="ghost"
                  onClick={() => slide(1)}
                  aria-label="Next criteria"
                  group
                  height={36} width={36} alignItems="center" justifyContent="center" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" hoverStyle={{ borderColor: "$color06" }}
                >
                  <SizableText color="$color11" $group-hover={{ color: "$color" }}>
                    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </SizableText>
                </Button>
              </XStack>
            </XStack>

            {/* Flex rows, not table tags. This was `<thead>/<tbody>/<tr>` nested
                directly in a gui YStack — a <div> — with `SizableText` (a
                <span>) for every cell and no <table> anywhere. The parser
                cannot make that a table, so it generated anonymous ones: the
                header alone measured 460px tall, the body 7,690px, the whole
                matrix one 8,150px column with scrollWidth EQUAL to its client
                width — so "slide across all 10 criteria" had nothing to slide.
                It also cost three React hydration errors (<span> in <tr>,
                <div> in <thead>, <div> in <tbody>) — the six the dev overlay
                counted on `/`. The section rendered as ~9,800px of black.

                A row is an XStack; the pinned name cell is `position: sticky,
                left: 0` against this scroller. `flexShrink={0}` on every cell
                is what keeps the row wider than the port — that width IS the
                horizontal scroll. */}
            <YStack
              ref={scrollRef}
              overflow="scroll" className="no-scrollbar"
            >
              <YStack>
                <XStack alignItems="flex-end">
                  <YStack position="sticky" left={0} zIndex={10} width={188} flexShrink={0} backgroundColor="$background" paddingBottom="$4" paddingRight="$4" />
                  {COLS.map((c) => (
                    <YStack key={c.short} width={208} flexShrink={0} paddingHorizontal="$4" paddingBottom="$4">
                      <YStack marginBottom="$2">
                        <c.icon size={16} color="var(--muted-foreground)" strokeWidth={1.5} aria-hidden />
                      </YStack>
                      <SizableText fontFamily="$mono" fontSize="$1" fontWeight="400" lineHeight="1.25" color="$color11">
                        {c.full}
                      </SizableText>
                    </YStack>
                  ))}
                </XStack>
                {ROWS.map((r) => (
                  <XStack key={r.name} group alignItems="stretch">
                    <YStack
                      position="sticky" left={0} zIndex={10} width={188} flexShrink={0} paddingVertical="$2.5" paddingLeft="$1" paddingRight="$4.5" backgroundColor={r.hanzo ? "$color3" : "$background"}
                    >
                      <XStack alignItems="center" gap="$2">
                        <SizableText fontWeight="500" color="$color" whiteSpace="nowrap">{r.name}</SizableText>
                        {r.hanzo && (
                          <SizableText borderRadius="$10" borderWidth={1} borderColor="$color02" backgroundColor="$color4" paddingHorizontal="$2" paddingVertical="$0.5" fontFamily="$mono" fontSize="$1" color="$color">
                            Best
                          </SizableText>
                        )}
                      </XStack>
                      {r.note && (
                        <SizableText marginTop="$0.5" fontFamily="$mono" fontSize="$1" fontWeight="400" color="$color11">
                          {r.note}
                        </SizableText>
                      )}
                    </YStack>
                    {r.cells.map((cell, ci) => (
                      <YStack
                        key={ci}
                        width={208} flexShrink={0} paddingHorizontal="$4" paddingVertical="$2.5" {...{ backgroundColor: r.hanzo ? "$color3" : undefined, "$group-hover": r.hanzo ? undefined : { backgroundColor: "$color3" } }}
                      >
                        <XStack alignItems="flex-start" gap="$2">
                          <YStack marginTop="$1">
                            <Dot tone={r.hanzo ? "good" : cell.t} />
                          </YStack>
                          <YStack minWidth={0}>
                            <XStack alignItems="center" gap="$1.5">
                              <ColIcon i={ci} />
                              <SizableText fontSize="$2" lineHeight="1.375" color={r.hanzo ? "$color" : TEXT[cell.t]}>{cell.v}</SizableText>
                            </XStack>
                            {cell.d && (
                              <SizableText marginTop="$0.5" fontSize="$1" lineHeight="1.375" color="$color11">
                                {cell.d}
                              </SizableText>
                            )}
                          </YStack>
                        </XStack>
                      </YStack>
                    ))}
                  </XStack>
                ))}
              </YStack>
            </YStack>
          </Reveal>
        </YStack>

        {/* ── Mobile: Hanzo card (full) + collapsible competitors ── */}
        <YStack marginTop="$7" rowGap="$3" $lg={{ display: "none" }}>
          {ROWS.map((r) => {
            const weak = r.cells.filter((c) => c.t === "bad").length;
            if (r.hanzo) {
              return (
                <Reveal
                  key={r.name}
                  borderRadius={16} borderWidth={1} borderColor="$color02" backgroundColor="$color3" padding="$4"
                >
                  <XStack marginBottom="$4" alignItems="center" gap="$2">
                    <H3 fontSize="$6" fontWeight="500" color="$color">{r.name}</H3>
                    <SizableText borderRadius="$10" borderWidth={1} borderColor="$color02" backgroundColor="$color4" paddingHorizontal="$2" paddingVertical="$0.5" fontFamily="$mono" fontSize="$1" color="$color">
                      Best overall
                    </SizableText>
                  </XStack>
                  <YStack columnGap="$5" rowGap="$3">
                    {r.cells.map((cell, ci) => (
                      <XStack key={ci} alignItems="flex-start" gap="$2.5">
                        <SizableText marginTop="$1.5" flexShrink={0}>
                          <Dot tone="good" />
                        </SizableText>
                        {/* flex + minWidth:0 so the value line CLAIMS the row's
                            width and wraps inside the card. Without flex it sizes
                            to the unwrapped string and spills off the right edge —
                            the desktop matrix escapes this only via its fixed
                            208px cells. */}
                        <YStack flex={1} minWidth={0}>
                          <XStack alignItems="center" gap="$1.5">
                            <ColIcon i={ci} size={12} />
                            <SizableText fontFamily="$mono" fontSize="$1" color="$color11">{COLS[ci].short}</SizableText>
                          </XStack>
                          <SizableText fontSize="$3" color="$color">
                            {cell.v}
                            {cell.d && (
                              <SizableText color="$color11"> · {cell.d}</SizableText>
                            )}
                          </SizableText>
                        </YStack>
                      </XStack>
                    ))}
                  </YStack>
                </Reveal>
              );
            }
            return (
              <details key={r.name} className="cmp-fold">
                <summary>
                  <SizableText minWidth={0}>
                    <SizableText fontSize="$4" fontWeight="500" color="$color">
                      {r.name}
                    </SizableText>
                    {r.note && (
                      <SizableText marginLeft="$2" fontFamily="$mono" fontSize="$1" color="$color11">
                        {r.note}
                      </SizableText>
                    )}
                  </SizableText>
                  {/* `flexShrink`, NEVER `flex={0}`. The shorthand `flex: 0`
                      expands to `0 1 0%` — grow none, shrink FREELY, and a
                      basis of ZERO — so this cluster measured 0px wide while
                      its content needed 92, and the label and the chevron
                      spilled out of it into the card's `overflow: hidden`.
                      What a phone showed was "4 w" and no chevron: a word cut
                      mid-letter and the one affordance saying the row opens.
                      It is the `flex: 1` = `1 1 0%` trap at the other end of
                      the scale — the basis is the part that bites, and naming
                      the shrink alone leaves the basis `auto`, which is the
                      content width this cluster wants. */}
                  <XStack flexShrink={0} alignItems="center" gap="$3">
                    {weak > 0 && (
                      <XStack alignItems="center" gap="$1.5">
                        <Dot tone="bad" />
                        <SizableText fontFamily="$mono" fontSize="$1" color="$color11">
                          {weak} weak {weak === 1 ? "area" : "areas"}
                        </SizableText>
                      </XStack>
                    )}
                    <svg
                      width={16}
                      height={16}
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M4 6l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
  />
                    </svg>
                  </XStack>
                </summary>
                <YStack columnGap="$5" rowGap="$3" borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4.5" paddingVertical="$4">
                  {r.cells.map((cell, ci) => (
                    <XStack key={ci} alignItems="flex-start" gap="$2.5">
                      <SizableText marginTop="$1.5" flexShrink={0}>
                        <Dot tone={cell.t} />
                      </SizableText>
                      <YStack flex={1} minWidth={0}>
                        <XStack alignItems="center" gap="$1.5">
                          <ColIcon i={ci} size={12} />
                          <SizableText fontFamily="$mono" fontSize="$1" color="$color11">{COLS[ci].short}</SizableText>
                        </XStack>
                        <SizableText fontSize="$3" color={TEXT[cell.t]}>
                          {cell.v}
                          {cell.d && (
                            <SizableText color="$color11"> · {cell.d}</SizableText>
                          )}
                        </SizableText>
                      </YStack>
                    </XStack>
                  ))}
                </YStack>
              </details>
            );
          })}
        </YStack>

        <Reveal
          delay={120}
          marginTop="$8"
        >
          <Paragraph textAlign="center" fontFamily="$mono" fontSize="$1" color="$color11">
            Every app ships on Hanzo Cloud — database, auth, AI, and storage wired
            in. No lock-in, ever.
          </Paragraph>
        </Reveal>
      </YStack>
    </YStack>
  );
}
