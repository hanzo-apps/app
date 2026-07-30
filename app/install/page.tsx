"use client";

import { Button } from '@hanzo/ui';
import { Anchor, XStack, SizableText, Paragraph, YStack, H1, H2 } from '@hanzo/gui';
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
    <Anchor
      href={appUrl(app)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${ACTION_LABEL[app.action]} ${app.name}`}
      group focusVisibleStyle={{ outlineWidth: 0 }}
    >
      <XStack alignItems="center" gap="$2.5">
        <Icon
          size={24}
          strokeWidth={1.5}
          aria-hidden
  />
        <SizableText fontSize="$6" fontWeight="600" letterSpacing={-0.4} color="$color" $group-hover={{ textDecorationLine: "underline" }} $md={{ fontSize: "$7" }}>
          {app.name}
        </SizableText>
      </XStack>
      <Paragraph marginTop="$4" maxWidth="30ch" fontSize={15} lineHeight={1.625} color="$color11">
        {app.blurb}
      </Paragraph>
      <SizableText marginTop="$4" alignItems="center" gap="$1" fontSize="$3" fontWeight="500" color="$color11" $group-hover={{ color: "$color" }}>
        {ACTION_LABEL[app.action]}
        <ArrowUpRight size={14} aria-hidden />
      </SizableText>
    </Anchor>
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
    <SizableText minHeight="100%" backgroundColor="$background" fontFamily="$body" color="$color" display="flex" flexDirection="column">
      {/* Shared site header — same menu as the rest of hanzo.app. */}
      <Header />

      {/* ── Intro: editorial title + surface nav (jumps into the pinned strip) ── */}
      <YStack paddingHorizontal="$4" paddingTop="$7" $md={{ paddingHorizontal: "$6", paddingTop: "$10" }}>
        <YStack alignSelf="center" maxWidth={1152}>
          <H1 fontSize="$12" fontWeight="500" lineHeight={1.02} letterSpacing={-0.4} $md={{ fontSize: 64 }}>
            Runs
          </H1>
          <Paragraph marginTop="$1" fontSize="$12" fontWeight="500" lineHeight={1.02} letterSpacing={-0.4} color="$color11" $md={{ fontSize: 64 }}>
            Everywhere.
          </Paragraph>
          <Paragraph marginTop="$5" maxWidth={576} fontSize="$4" color="$color11" $md={{ fontSize: "$6" }}>
            One key, every surface. Install Hanzo in your browser, editor,
            desktop, and office — or connect the tools your team already runs.
          </Paragraph>

          <XStack
            role="group"
            aria-label="Jump to a surface"
            marginTop="$7" flexWrap="wrap" alignItems="center" columnGap="$1" rowGap="$3"
          >
            {CATEGORIES.map((c, i) => {
              const on = active === i;
              return (
                <Button
                  key={c.label}
                  type="button"
                  onClick={() => jumpTo(i)}
                  aria-pressed={on}
                  className={`${[
                    "rounded-full px-5 py-2 text-lg transition-colors",
                    on
                      ? "border border-foreground text-foreground"
                      : "border border-transparent text-muted-foreground hover:text-foreground",
                  ].join(" ")}`}
                >
                  {c.label}
                </Button>
              );
            })}
          </XStack>
        </YStack>
      </YStack>

      {/* ── The pinned filmstrip: N screens tall; scrolling pans through all N ── */}
      <YStack ref={wrapRef} position="relative" style={{ height: `${N * 90}vh` }}>
        <XStack position="sticky" top="$0" height="100%" alignItems="center" overflow="hidden">
          <XStack
            ref={trackRef}
          >
            {CATEGORIES.map((c, i) => {
              const apps = appCatalog.filter((a) => c.cats.includes(a.category));
              const on = active === i;
              return (
                <YStack
                  key={c.label}
                  data-panel
                  aria-label={c.label}
                  className={`${[
                    "flex h-screen w-screen shrink-0 flex-col justify-center px-4 transition-opacity duration-500 md:px-8",
                    on ? "opacity-100" : "opacity-40",
                  ].join(" ")}`}
                >
                  <YStack alignSelf="center" width="100%" maxWidth={1152}>
                    <XStack marginBottom="$2" alignItems="baseline" gap="$3">
                      <SizableText fontFamily="$mono" fontSize={11} textTransform="uppercase" letterSpacing={2.88} color="$color11">
                        {c.label}
                      </SizableText>
                      <SizableText fontFamily="$mono" fontSize={11} color="$color11">
                        {String(i + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
                      </SizableText>
                    </XStack>
                    <YStack columnGap="$6" rowGap="$7">
                      {apps.map((app) => (
                        <AppCell key={app.name} app={app} />
                      ))}
                    </YStack>
                  </YStack>
                </YStack>
              );
            })}
          </XStack>

          {/* progress rail — fills as you pan through the surfaces */}
          <XStack pointerEvents="none" position="absolute" left="$0" right="$0" bottom="$5" alignSelf="center" maxWidth={1152} alignItems="center" gap="$3" paddingHorizontal="$4" $md={{ paddingHorizontal: "$6" }}>
            <YStack height={1} flex={1} backgroundColor="$borderColor">
              <YStack
                height={1} backgroundColor="$color"
                style={{ width: `${(active / Math.max(N - 1, 1)) * 100}%` }}
  />
            </YStack>
            <SizableText fontFamily="$mono" fontSize={11} textTransform="uppercase" letterSpacing={2.24} color="$color11">
              Scroll →
            </SizableText>
          </XStack>
        </XStack>
      </YStack>

      {/* ── CTA — the page's real conversion ────────────────────────────────── */}
      <YStack borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$12" $md={{ paddingHorizontal: "$6" }}>
        <YStack alignSelf="center" maxWidth={1152}>
          <H2 fontSize="$10" fontWeight="500" letterSpacing={-0.4} $md={{ fontSize: "$11" }}>
            Start with one key.
          </H2>
          <Paragraph marginTop="$3" maxWidth={448} fontSize={15} lineHeight={1.625} color="$color11">
            Sign in with Hanzo, mint one{" "}
            <SizableText borderRadius="$2" backgroundColor="$color3" paddingHorizontal="$1.5" paddingVertical="$0.5" fontFamily="$mono" fontSize="$3" color="$color">
              hk-
            </SizableText>{" "}
            key, and every app above is authenticated — no per-app credentials.
          </Paragraph>
          <Link
            href="/dashboard"
          ><SizableText marginTop="$5" alignItems="center" gap="$2" borderRadius="$10" backgroundColor="$color12" paddingHorizontal="$5" paddingVertical="$3" fontSize="$3" fontWeight="500" color="$background" hoverStyle={{ backgroundColor: "$color12" }}>
            Get your key
            <ArrowRight size={16} aria-hidden />
          </SizableText></Link>
        </YStack>
      </YStack>
    </SizableText>
  );
}
