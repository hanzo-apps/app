"use client";

import { Button } from '@hanzo/ui';
import { SizableText, YStack, Paragraph, H2, XStack, H3, type GuiElement } from '@hanzo/gui';
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
      g("$0 hidden", "Transparent usage pricing — no surprise fees"),
      g("Zero lock-in", "Open source — you own 100% of the code"),
      g("Blazing fast", "Hand-optimized, production-grade output"),
      g("Unlimited", "Real, editable code — no ceilings"),
      g("Best-in-class", "Frontier models, highest accuracy"),
      g("Built to scale", "Prototype to production, no rewrite"),
      g("Private by default", "Privacy-first — self-host or our cloud"),
      g("Near-zero", "We keep it running; you just build"),
      g("1M+ tokens", "Whole-codebase context — never forgets"),
      g("Ships polished", "Slick, modern, production-ready UI"),
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
const DOT: Record<Tone, React.ComponentProps<typeof SizableText>> = {
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

function Dot({ tone }: { tone: Tone }) {
  return (
    <SizableText
      aria-hidden
      height={7} width={7} flex={0} borderRadius="$10" {...DOT[tone]}
  />
  );
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
    <YStack position="relative" borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$13" }}>
      <YStack alignSelf="center" maxWidth={1152}>
        <Reveal alignSelf="center" width="100%" maxWidth={672}>
          <Paragraph textAlign="center" fontFamily="$mono" fontSize={11} color="$color11">
            Why Hanzo
          </Paragraph>
          <H2 textAlign="center" marginTop="$4" fontSize="$10" fontWeight="500" letterSpacing={-0.4} $md={{ color: "2.75rem", lineHeight: 1.1 }}>
            One platform beats the whole stack.
          </H2>
          <Paragraph textAlign="center" marginTop="$4" fontSize="$4" color="$color11" $md={{ fontSize: "$6" }}>
            Site builders lock you in. AI coding tools hand you bugs to clean up.
            Hanzo ships production apps you own — fast, secure, and built to
            scale.
          </Paragraph>
        </Reveal>

        {/* Legend */}
        <Reveal
          delay={60}
          marginTop="$6" flexDirection="row" flexWrap="wrap" alignItems="center" justifyContent="center" columnGap="$4" rowGap="$2"
        >
          <XStack alignItems="center" gap="$1.5">
            <Dot tone="good" />
            <SizableText fontFamily="$mono" fontSize={11} color="$color11">Advantage</SizableText>
          </XStack>
          <XStack alignItems="center" gap="$1.5">
            <Dot tone="mid" />
            <SizableText fontFamily="$mono" fontSize={11} color="$color11">Caveat</SizableText>
          </XStack>
          <XStack alignItems="center" gap="$1.5">
            <Dot tone="bad" />
            <SizableText fontFamily="$mono" fontSize={11} color="$color11">Weakness</SizableText>
          </XStack>
          <XStack alignItems="center" gap="$1.5">
            <Dot tone="na" />
            <SizableText fontFamily="$mono" fontSize={11} color="$color11">N/A</SizableText>
          </XStack>
        </Reveal>

        {/* ── Desktop / tablet-wide: sliding matrix ─────────────── */}
        <YStack marginTop="$7" display="none">
          <Reveal delay={80}>
            <XStack marginBottom="$3" alignItems="center" justifyContent="space-between" gap="$4">
              <Paragraph fontFamily="$mono" fontSize={11} color="$color11">
                Slide across all {COLS.length} criteria →
              </Paragraph>
              <XStack gap="$2">
                <Button
                  type="button"
                  onClick={() => slide(-1)}
                  aria-label="Previous criteria"
                  group
                  height={36} width={36} alignItems="center" justifyContent="center" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" hoverStyle={{ borderColor: "$color" }}
                >
                  <SizableText color="$color11" $group-hover={{ color: "$color" }}>
                    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </SizableText>
                </Button>
                <Button
                  type="button"
                  onClick={() => slide(1)}
                  aria-label="Next criteria"
                  group
                  height={36} width={36} alignItems="center" justifyContent="center" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" hoverStyle={{ borderColor: "$color" }}
                >
                  <SizableText color="$color11" $group-hover={{ color: "$color" }}>
                    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </SizableText>
                </Button>
              </XStack>
            </XStack>

            <YStack position="relative">
              {/* right edge fade — signals there's more to slide to */}
              <YStack pointerEvents="none" position="absolute" top="$0" bottom="$0" right="$0" zIndex={20} width="$10" />

              <YStack
                ref={scrollRef}
                overflow="scroll" className="no-scrollbar"
              >
                <YStack>
                  <thead>
                    <tr>
                      <SizableText position="sticky" left="$0" zIndex={10} width={188} minWidth={188} backgroundColor="$background" paddingBottom="$4" paddingRight="$4" verticalAlign="bottom" />
                      {COLS.map((c) => (
                        <SizableText
                          key={c.short}
                          width={208} minWidth={208} paddingHorizontal="$4" paddingBottom="$4" verticalAlign="bottom" fontFamily="$mono" fontSize={10} fontWeight="400" lineHeight={1.25} letterSpacing={1.6} color="$color11"
                        >
                          <YStack marginBottom="$2">
                            <c.icon size={16} color="var(--muted-foreground)" strokeWidth={1.5} aria-hidden />
                          </YStack>
                          {c.full}
                        </SizableText>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((r) => (
                      <YStack key={r.name} group>
                        <SizableText
                          position="sticky" left="$0" zIndex={10} width={188} minWidth={188} whiteSpace="nowrap" paddingVertical="$3" paddingLeft="$1" paddingRight="$4.5" textAlign="left" verticalAlign="top" fontWeight="500" {...{ backgroundColor: r.hanzo ? "$color3" : "$background", color: r.hanzo ? "$color" : "$color" }}
                        >
                          <XStack alignItems="center" gap="$2">
                            <SizableText fontWeight="500">{r.name}</SizableText>
                            {r.hanzo && (
                              <SizableText borderRadius="$10" borderWidth={1} borderColor="$color" backgroundColor="$color4" paddingHorizontal="$2" paddingVertical="$0.5" fontFamily="$mono" fontSize={9} color="$color">
                                Best
                              </SizableText>
                            )}
                          </XStack>
                          {r.note && (
                            <SizableText marginTop="$0.5" fontFamily="$mono" fontSize={10} fontWeight="400" color="$color11">
                              {r.note}
                            </SizableText>
                          )}
                        </SizableText>
                        {r.cells.map((cell, ci) => (
                          <SizableText
                            key={ci}
                            width={208} minWidth={208} paddingHorizontal="$4" paddingVertical="$3" verticalAlign="top" {...{ backgroundColor: r.hanzo ? "$color3" : undefined, "$group-hover": r.hanzo ? undefined : {"backgroundColor":"$color3"} }}
                          >
                            <XStack alignItems="flex-start" gap="$2">
                              <SizableText marginTop="$1">
                                <Dot tone={r.hanzo ? "good" : cell.t} />
                              </SizableText>
                              <YStack minWidth={0}>
                                <XStack alignItems="center" gap="$1.5">
                                  <ColIcon i={ci} />
                                  <SizableText fontSize={13} lineHeight={1.375} color={r.hanzo ? "$color" : TEXT[cell.t]}>{cell.v}</SizableText>
                                </XStack>
                                {cell.d && (
                                  <SizableText marginTop="$0.5" fontSize={11} lineHeight={1.375} color="$color11">
                                    {cell.d}
                                  </SizableText>
                                )}
                              </YStack>
                            </XStack>
                          </SizableText>
                        ))}
                      </YStack>
                    ))}
                  </tbody>
                </YStack>
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
                  borderRadius={16} borderWidth={1} borderColor="$color" backgroundColor="var(--muted)" padding="$4"
                >
                  <XStack marginBottom="$4" alignItems="center" gap="$2">
                    <H3 fontSize="$6" fontWeight="500" color="$color">{r.name}</H3>
                    <SizableText borderRadius="$10" borderWidth={1} borderColor="$color" backgroundColor="$color4" paddingHorizontal="$2" paddingVertical="$0.5" fontFamily="$mono" fontSize={9} color="$color">
                      Best overall
                    </SizableText>
                  </XStack>
                  <YStack columnGap="$5" rowGap="$3">
                    {r.cells.map((cell, ci) => (
                      <XStack key={ci} alignItems="flex-start" gap="$2.5">
                        <SizableText marginTop="$1.5">
                          <Dot tone="good" />
                        </SizableText>
                        <YStack minWidth={0}>
                          <XStack alignItems="center" gap="$1.5">
                            <ColIcon i={ci} size={12} />
                            <SizableText fontFamily="$mono" fontSize={10} color="$color11">{COLS[ci].short}</SizableText>
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
                      <SizableText marginLeft="$2" fontFamily="$mono" fontSize={10} color="$color11">
                        {r.note}
                      </SizableText>
                    )}
                  </SizableText>
                  <XStack flex={0} alignItems="center" gap="$3">
                    {weak > 0 && (
                      <XStack alignItems="center" gap="$1.5">
                        <Dot tone="bad" />
                        <SizableText fontFamily="$mono" fontSize={11} color="$color11">
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
                      <SizableText marginTop="$1.5">
                        <Dot tone={cell.t} />
                      </SizableText>
                      <YStack minWidth={0}>
                        <XStack alignItems="center" gap="$1.5">
                          <ColIcon i={ci} size={12} />
                          <SizableText fontFamily="$mono" fontSize={10} color="$color11">{COLS[ci].short}</SizableText>
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
          <Paragraph textAlign="center" fontFamily="$mono" fontSize={12} color="$color11">
            Every app ships on Hanzo Cloud — database, auth, AI, and storage wired
            in. No lock-in, ever.
          </Paragraph>
        </Reveal>
      </YStack>
    </YStack>
  );
}
