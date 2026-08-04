"use client";

import { Button } from '@hanzo/ui';
import { YStack, SizableText, H3, Paragraph, XStack, H1, H2 } from '@hanzo/gui';
// The browsable templates gallery — ONE component over the SEO catalog SOT
// (lib/templates-catalog): a category rail + a responsive card grid with instant,
// client-side filtering. Mounted by BOTH `/gallery` (app/gallery/page.tsx) and the
// in-app Templates view (components/views/templates-view.tsx), so the marketing
// gallery and the sidebar view are the SAME surface — no drift, no forked copy, no
// live gallery.hanzo.ai fetch. The curated catalog is the product.
//
// True-black monochrome to match the landing (components/landing/*): white text,
// white/opacity borders, zero hue by construction. Each card LINKS to the detail
// page `/templates/<slug>`; a secondary "Use template" action forks into the
// builder via the established wire carried on every entry (`fork` =
// /dev?template=hanzo-apps/<slug>&action=edit). Previews come from TemplateThumb
// (image-first: the real self-hosted shot when one exists, else the generated
// on-brand tile) — its logic is unchanged here.

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import {
  CATEGORIES,
  TEMPLATES,
  templatesByCategory,
  type TemplateEntry,
} from "@/lib/templates-catalog";
import { authorOf, OFFICIAL_LABEL } from "@/lib/template-authors";
import { TemplateThumb } from "@/components/template-thumb";

const ALL = "all";

function RailPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      group flexShrink={0} borderRadius="$10" paddingHorizontal="$3.5" paddingVertical="$1.5" {...{ backgroundColor: active ? "$color12" : "$color3", borderWidth: active ? undefined : 1, borderColor: active ? undefined : "$borderColor", hoverStyle: active ? undefined : {"borderColor":"$color"} }}
    >
      <SizableText whiteSpace="nowrap" fontSize="$1" fontWeight="500" color={active ? "$background" : "$color11"} $group-hover={active ? undefined : { color: "$color" }}>{label}</SizableText>
    </Button>
  );
}

function TemplateCard({ t, showAuthor = false }: { t: TemplateEntry; showAuthor?: boolean }) {
  return (
    <YStack group className="zoom-scope" position="relative" overflow="hidden" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" hoverStyle={{ y: "-1", borderColor: "$color", backgroundColor: "$color3" }}>
      {/* Preview — image-first via TemplateThumb; on-brand tile when no real shot. */}
      <YStack position="relative" overflow="hidden" backgroundColor="$background">
        <TemplateThumb
          name={t.name}
          category={t.category}
          slug={t.slug}
          className="zoom-target"
  />
        {/* Left rail: what this is, and who published it. The "Hanzo Example" badge
            rides beside the category rather than opposite it, because top-right is
            the live-demo slot. Every catalog template is published by Hanzo itself,
            and a reader must not have to infer that from the author handle. */}
        <XStack position="absolute" left="$3" top="$3" flexWrap="wrap" alignItems="center" gap="$1.5">
          <SizableText borderRadius="$10" borderWidth={1} borderColor="white" backgroundColor="black" paddingHorizontal="$2.5" paddingVertical="$1" fontFamily="$mono" fontSize={10} textTransform="uppercase" letterSpacing={1.92} color="white" backdropFilter="blur(8px)">
            {t.category}
          </SizableText>
          <SizableText
            data-official="true"
            borderRadius="$10" borderWidth={1} borderColor="white" backgroundColor="black" paddingHorizontal="$2.5" paddingVertical="$1" fontFamily="$mono" fontSize={10} textTransform="uppercase" letterSpacing={1.92} color="white" backdropFilter="blur(8px)"
          >
            {OFFICIAL_LABEL}
          </SizableText>
        </XStack>
        {/* The grid keeps the (fast) screenshot — 105 iframes would be a page of
            them — but says which cards open on a template you can actually use. */}
        {t.demo && (
          <XStack position="absolute" right="$3" top="$3" alignItems="center" gap="$1.5" borderRadius="$10" borderWidth={1} borderColor="white" backgroundColor="black" paddingHorizontal="$2.5" paddingVertical="$1" backdropFilter="blur(8px)">
            <SizableText height="$1.5" width="$1.5" borderRadius="$10" backgroundColor="white" />
            <SizableText fontFamily="$mono" fontSize={10} textTransform="uppercase" letterSpacing={1.92} color="white">Live</SizableText>
          </XStack>
        )}
      </YStack>

      <YStack flex={1} padding="$4" $sm={{ padding: "$4.5" }}>
        <H3 alignItems="flex-start" gap="$1.5" fontSize={15} fontWeight="500" lineHeight="1.375" letterSpacing={-0.4} color="$color">
          <SizableText numberOfLines={1}>{t.name}</SizableText>
          <ArrowUpRight
            size={16}
            strokeWidth={1.6}
  />
        </H3>
        <Paragraph marginTop="$1.5" numberOfLines={2} minHeight="2.5rem" fontSize={13} lineHeight="1.625" color="$color11">
          {t.tagline}
        </Paragraph>

        <XStack marginTop="auto" alignItems="center" justifyContent="space-between" gap="$3" paddingTop="$4">
          <SizableText numberOfLines={1} fontFamily="$mono" fontSize={10} textTransform="uppercase" letterSpacing={1.92} color="$color11">
            {showAuthor ? `by ${authorOf(t.slug)}` : t.framework}
          </SizableText>
          <Link
            href={t.fork}
          ><XStack position="relative" zIndex={10} flexShrink={0} alignItems="center" gap="$1" borderRadius="$10" backgroundColor="$color12" paddingHorizontal="$3.5" paddingVertical="$1.5" hoverStyle={{ backgroundColor: "$color12" }}>
            <SizableText fontSize="$1" fontWeight="500" color="$background">Use template</SizableText>
            <ArrowRight size={14} strokeWidth={2} />
          </XStack></Link>
        </XStack>
      </YStack>

      {/* Whole card → detail page. The stretched overlay sits BELOW the fork button
          (z-0 vs z-10), so a click anywhere opens the detail while "Use template"
          forks. No nested anchors: the overlay is a sibling of the button. */}
      <Link
        href={`/templates/${t.slug}`}
        aria-label={`View ${t.name}`}
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
  />
    </YStack>
  );
}

export function TemplateGallery({
  className = "",
  eyebrow = "Built with AI",
  heading = "Website & app templates",
  // "from the Hanzo community" was not true of this catalog: every entry is a
  // first-party example Hanzo publishes. Say what it is.
  lead = "Production-ready example apps, published by Hanzo. Fork any of them.",
  showAuthor = false,
}: {
  className?: string;
  eyebrow?: string;
  heading?: string;
  lead?: string;
  showAuthor?: boolean;
}) {
  const [active, setActive] = useState<string>(ALL);

  // Only surface categories that actually have templates (resilient to an empty
  // or partial catalog), in the taxonomy's canonical order.
  const rail = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of TEMPLATES) counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
    return CATEGORIES.filter((c) => (counts.get(c.label) ?? 0) > 0);
  }, []);

  const shown = useMemo(() => {
    const base = active === ALL ? [...TEMPLATES] : templatesByCategory(active);
    // Default builder starters (featured) float to the top; stable within groups.
    return [...base].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  }, [active]);

  return (
    <YStack alignSelf="center" width="100%" maxWidth={1280} paddingHorizontal="$4.5" paddingVertical="$7" $sm={{ paddingHorizontal: "$6", paddingVertical: "$9" }} className={`${className}`}>
      {/* Header — true-black monochrome, landing aesthetic. */}
      <YStack maxWidth={672}>
        <Paragraph fontFamily="$mono" fontSize={11} textTransform="uppercase" letterSpacing={3.2} color="$color11">
          {eyebrow}
        </Paragraph>
        <H1 marginTop="$3" fontSize="$10" fontWeight="500" letterSpacing={-0.4} color="$color" $sm={{ fontSize: "$11" }} $md={{ fontSize: "2.75rem", lineHeight: "1.05" }}>
          {heading}
        </H1>
        <Paragraph marginTop="$4" fontSize="$4" color="$color11" $sm={{ fontSize: "$6" }} lineHeight="1.5">{lead}</Paragraph>
      </YStack>

      {/* Category rail — instant client-side filtering. */}
      <XStack marginTop="$6" flexWrap="nowrap" alignItems="center" gap="$2" paddingBottom="$1" overflow="scroll" $sm={{ flexWrap: "wrap" }} className="no-scrollbar">
        <RailPill label="All templates" active={active === ALL} onClick={() => setActive(ALL)} />
        {rail.map((c) => (
          <RailPill
            key={c.slug}
            label={c.label}
            active={active === c.slug}
            onClick={() => setActive(c.slug)}
  />
        ))}
      </XStack>
      <Paragraph marginTop="$3" fontFamily="$mono" fontSize={11} textTransform="uppercase" letterSpacing={2.24} color="$color11">
        {shown.length} template{shown.length === 1 ? "" : "s"}
      </Paragraph>

      {/* Grid — reflows 1 → 2 (sm) → 3 (lg) → 4 (xl). */}
      {shown.length > 0 ? (
        <YStack marginTop="$5" gap="$4" $sm={{ gap: "$4.5" }}>
          {shown.map((t) => (
            <TemplateCard key={t.slug} t={t} showAuthor={showAuthor} />
          ))}
        </YStack>
      ) : (
        <Paragraph marginTop="$10" textAlign="center" fontSize="$3" color="$color11">
          No templates in this category yet.
        </Paragraph>
      )}

      {/* Footer CTA — the honest build path (no fabricated metrics). */}
      <YStack marginTop="$9" alignItems="flex-start" gap="$4" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" padding="$5" $sm={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: "$6" }}>
        <div>
          <H2 fontSize="$6" fontWeight="500" letterSpacing={-0.4} color="$color">
            Don&apos;t see the right fit?
          </H2>
          <Paragraph marginTop="$1" fontSize="$3" color="$color11">
            Describe your app and Hanzo builds it from scratch — deployed live in minutes.
          </Paragraph>
        </div>
        <Link
          href="/dev"
        ><XStack flexShrink={0} alignItems="center" gap="$2" borderRadius="$10" backgroundColor="$color12" paddingHorizontal="$4.5" paddingVertical="$2.5" hoverStyle={{ backgroundColor: "$color12" }}>
          <Sparkles size={16} strokeWidth={1.8} />
          <SizableText fontSize="$3" fontWeight="500" color="$background">Start building</SizableText>
        </XStack></Link>
      </YStack>
    </YStack>
  );
}

export default TemplateGallery;
