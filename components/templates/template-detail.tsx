'use client';

import { SizableText, YStack, XStack, H1, Paragraph, Anchor, H2, H3 } from '@hanzo/gui';
// Rich per-template detail page body for hanzo.app.
//
// True-black monochrome to match components/landing/* — white text, white/opacity
// borders, zero hue by construction. Server component: it composes the site's
// client pieces (Header, TemplateThumb, Reveal) and the server SiteFooter, but
// needs no client state itself, so it stays lean.
//
// Honesty: every field rendered here comes from the real catalog SOT
// (lib/templates-catalog.ts). The hero is the template ITSELF when it has a
// verified live demo (`t.demo` → <ProjectThumb>, the one inert scaled-iframe
// preview the dashboard already uses), and otherwise falls back to
// <TemplateThumb> — image-first with the real self-hosted /templates/<slug>.webp
// when one exists, else the on-brand generated tile.

import Link from "next/link";
import {
  ChevronRight,
  Code2,
  ArrowUpRight,
  ArrowRight,
  Check,
  Sparkles,
  Layers,
  Zap,
  Boxes,
  Gauge,
  Blocks,
  type LucideIcon,
} from "lucide-react";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";
import Reveal from "@/components/landing/reveal";
import { TemplateThumb } from "@/components/template-thumb";
import { ProjectThumb } from "@/components/project-thumb";
import { categorySlug, type TemplateEntry } from "@/lib/templates-catalog";
import type { BuildSummary } from "@/lib/builds";

// Decorative, neutral icons for the Key Highlights grid, chosen by position.
// The catalog's highlights carry no icon of their own, so these are purely
// visual rhythm — never a fabricated claim.
const HIGHLIGHT_ICONS: LucideIcon[] = [Sparkles, Layers, Zap, Boxes, Gauge, Blocks];

// Shared section / eyebrow registers — gui prop bundles, spread at call sites.
const EYEBROW = { fontFamily: "$mono", fontSize: 11, textTransform: "uppercase", letterSpacing: 2.2, color: "$color11" } as const;
const SECTION = { borderTopWidth: 1, borderColor: "$borderColor", paddingHorizontal: "$4", paddingVertical: "$11", $md: { paddingHorizontal: "$8", paddingVertical: "$13" } } as const;

export function TemplateDetail({
  template: t,
  related,
  build,
}: {
  template: TemplateEntry;
  related: TemplateEntry[];
  // The published build of this template, when one exists. Passed in rather
  // than fetched here so the page owns its own data and this stays presentation.
  build?: BuildSummary | null;
}) {
  const catHref = `/templates?category=${categorySlug(t.category)}`;

  return (
    <YStack position="relative" minHeight="100%" backgroundColor="$background" overflow="hidden">
      {/* Monochrome glow — single soft radial, zero hue (matches landing). */}
      <YStack pointerEvents="none" position="fixed" top={0} right={0} bottom={0} left={0} zIndex={0} overflow="hidden">
        <YStack position="absolute" left="50%" top="-14%" height={520} width={860} marginLeft={-430} borderRadius="$10" backgroundColor="$color005" filter="blur(130px)" />
      </YStack>

      <Header />

      <YStack position="relative" zIndex={10}>
        {/* ── Breadcrumb + hero ─────────────────────────────────── */}
        <YStack paddingHorizontal="$4" paddingTop={36} $md={{ paddingHorizontal: "$6", paddingTop: "$9" }}>
          <YStack alignSelf="center" maxWidth={1152}>
            <nav aria-label="Breadcrumb">
              <XStack flexWrap="wrap" alignItems="center" gap="$1.5">
                <li>
                  <Link href="/templates"><SizableText fontFamily="$mono" fontSize={11} textTransform="uppercase" letterSpacing={2.24} color="$color11" hoverStyle={{ color: "$color" }}>
                    Templates
                  </SizableText></Link>
                </li>
                <li aria-hidden="true">
                  <ChevronRight size={12} />
                </li>
                <li>
                  <Link href={catHref}><SizableText fontFamily="$mono" fontSize={11} textTransform="uppercase" letterSpacing={2.24} color="$color11" hoverStyle={{ color: "$color" }}>
                    {t.category}
                  </SizableText></Link>
                </li>
              </XStack>
            </nav>

            <YStack marginTop="$6" alignItems="center" gap="$7" $lg={{ marginTop: "$7", gap: "$9" }}>
              {/* Left — identity + CTAs */}
              <Reveal>
                <XStack marginBottom="$4.5" flexWrap="wrap" alignItems="center" gap="$2">
                  <SizableText borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3" paddingVertical="$1" fontFamily="$mono" fontSize={11} color="$color11">
                    {t.framework}
                  </SizableText>
                  {t.tags.map((tag) => (
                    <SizableText
                      key={tag}
                      borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$2.5" paddingVertical="$1" fontFamily="$mono" fontSize={10} textTransform="uppercase" letterSpacing={1.92} color="$color11"
                    >
                      {tag}
                    </SizableText>
                  ))}
                </XStack>

                <H1 fontSize="$10" fontWeight="500" lineHeight="1.08" letterSpacing={-0.4} $sm={{ fontSize: "$11" }} $md={{ fontSize: "2.9rem" }}>
                  {t.name}
                </H1>
                <Paragraph marginTop="$4" maxWidth={576} fontSize="$4" lineHeight="1.625" color="$color11" $md={{ fontSize: "$6" }}>
                  {t.tagline}
                </Paragraph>

                <XStack marginTop="$6" flexWrap="wrap" alignItems="center" gap="$3">
                  <Link
                    href={t.fork}
                  ><XStack alignItems="center" gap="$2" borderRadius="$10" backgroundColor="$color12" paddingHorizontal="$4.5" paddingVertical="$3" hoverStyle={{ backgroundColor: "$color12" }}>
                    <SizableText color="$background"><Code2 size={16} /></SizableText>
                    <SizableText fontSize="$3" fontWeight="500" color="$background">Use template</SizableText>
                  </XStack></Link>
                  <Anchor
                    href={t.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    alignItems="center" gap="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$4.5" paddingVertical="$3" fontSize="$3" fontWeight="500" color="$color" hoverStyle={{ borderColor: "$color", color: "$color" }}
                  >
                    {t.demo ? "Open live demo" : "View source"}
                    <ArrowUpRight size={16} />
                  </Anchor>
                </XStack>

                {/* How this was actually made. Rendered only when a build is
                    published — an always-on link to a story that may not exist
                    is the same broken promise as a 404 screenshot. */}
                {build ? (
                  <Link
                    href={`/builds/${build.org}/${build.project}`}
                  ><SizableText marginTop="$4.5" fontFamily="$mono" fontSize={11} textTransform="uppercase" letterSpacing={2.24} color="$color11" hoverStyle={{ color: "$color" }}>
                    Read the build — {build.turns} turns, {build.agent}
                    <ArrowRight size={12} />
                  </SizableText></Link>
                ) : null}
              </Reveal>

              {/* Right — the template running LIVE when it has a demo, else the
                  real shot / generated tile. Clickable → fork either way: the
                  frame is inert, so the whole hero stays one target. */}
              <Reveal delay={80}>
                <Link
                  href={t.fork}
                  aria-label={`Use the ${t.name} template`}
                ><XStack group className="zoom-scope" overflow="hidden" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" elevation={6} hoverStyle={{ borderColor: "$color" }}>
                  <YStack position="relative" overflow="hidden" backgroundColor="$color3">
                    <ProjectThumb
                      name={t.name}
                      liveUrl={t.demo}
                      aspect="aspect-[16/10]"
                      fallback={
                        <TemplateThumb
                          name={t.name}
                          category={t.category}
                          slug={t.slug}
                          className="zoom-target"
  />
                      }
  />
                    {t.demo && (
                      <XStack position="absolute" left="$3" top="$3" alignItems="center" gap="$1.5" borderRadius="$10" borderWidth={1} borderColor="white" backgroundColor="black" paddingHorizontal="$2.5" paddingVertical="$1" backdropFilter="blur(8px)">
                        <SizableText height="$1.5" width="$1.5" borderRadius="$10" backgroundColor="white" />
                        <SizableText fontFamily="$mono" fontSize={10} textTransform="uppercase" letterSpacing={1.92} color="white">Live demo</SizableText>
                      </XStack>
                    )}
                  </YStack>
                </XStack></Link>
              </Reveal>
            </YStack>
          </YStack>
        </YStack>

        {/* ── Key highlights ────────────────────────────────────── */}
        {t.keyHighlights.length > 0 && (
          <YStack marginTop="$6" {...SECTION} $md={{ ...SECTION.$md, marginTop: "$8" }}>
            <YStack alignSelf="center" maxWidth={1152}>
              <Reveal>
                <Paragraph {...EYEBROW}>Key highlights</Paragraph>
                <H2 marginTop="$4" fontSize="$10" fontWeight="500" letterSpacing={-0.4} $md={{ fontSize: "$11" }}>
                  What you get out of the box.
                </H2>
              </Reveal>

              <Reveal
                delay={80}
                marginTop="$9" overflow="hidden" borderRadius={16} borderWidth={1} borderColor="$borderColor" backgroundColor="var(--muted)"
                className="card-grid card-grid-sm-2 card-grid-lg-3"
              >
                {t.keyHighlights.map((h, i) => {
                  const Icon = HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length];
                  return (
                    <YStack
                      key={h.title}
                      backgroundColor="$background" padding={28} hoverStyle={{ backgroundColor: "$color3" }} $md={{ padding: "$6" }}
                    >
                      <XStack height={36} width={36} alignItems="center" justifyContent="center" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3">
                        <Icon size={16} color="var(--foreground)" strokeWidth={1.5} />
                      </XStack>
                      <H3 marginTop="$4.5" fontSize="$4" fontWeight="500" color="$color">{h.title}</H3>
                      <Paragraph marginTop="$2" fontSize="$3" lineHeight="1.625" color="$color11">{h.body}</Paragraph>
                    </YStack>
                  );
                })}
              </Reveal>
            </YStack>
          </YStack>
        )}

        {/* ── About + Perfect for ───────────────────────────────── */}
        <YStack {...SECTION}>
          <YStack alignSelf="center" maxWidth={1152} gap="$8" $lg={{ gap: "$10" }}>
            <Reveal>
              <Paragraph {...EYEBROW}>About this template</Paragraph>
              <H2 marginTop="$4" fontSize="$8" fontWeight="500" letterSpacing={-0.4} $md={{ fontSize: "$10" }}>
                {t.name}
              </H2>
              <Paragraph marginTop="$4.5" fontSize="$4" lineHeight="1.625" color="$color11">{t.about}</Paragraph>
              <Paragraph marginTop="$4" fontSize="$4" lineHeight="1.625" color="$color11">{t.description}</Paragraph>
            </Reveal>

            {t.perfectFor.length > 0 && (
              <Reveal delay={80}>
                <YStack borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" padding={28} $md={{ padding: "$6" }}>
                  <Paragraph {...EYEBROW}>Perfect for</Paragraph>
                  <YStack marginTop="$4.5" rowGap="$3.5">
                    {t.perfectFor.map((p) => (
                      <XStack key={p} alignItems="flex-start" gap="$3">
                        <XStack marginTop="$0.5" height="$4.5" width="$4.5" flexShrink={0} alignItems="center" justifyContent="center" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3">
                          <Check size={12} strokeWidth={2} />
                        </XStack>
                        <SizableText lineHeight="1.625" fontSize="$3" color="$color">{p}</SizableText>
                      </XStack>
                    ))}
                  </YStack>
                </YStack>
              </Reveal>
            )}
          </YStack>
        </YStack>

        {/* ── Related templates ─────────────────────────────────── */}
        {related.length > 0 && (
          <YStack {...SECTION}>
            <YStack alignSelf="center" maxWidth={1152}>
              <Reveal flexDirection="row" alignItems="flex-end" justifyContent="space-between" gap="$4">
                <div>
                  <Paragraph {...EYEBROW}>Related templates</Paragraph>
                  <H2 marginTop="$4" fontSize="$8" fontWeight="500" letterSpacing={-0.4} $md={{ fontSize: "$10" }}>
                    More in {t.category}.
                  </H2>
                </div>
                <Link
                  href={catHref}
                ><SizableText display="none" flexShrink={0} fontSize="$3" color="$color11" hoverStyle={{ color: "$color" }}>
                  View all →
                </SizableText></Link>
              </Reveal>

              <YStack marginTop="$7" gap="$4">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/templates/${r.slug}`}
                  ><YStack group className="zoom-scope" overflow="hidden" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" hoverStyle={{ y: "-0.5", borderColor: "$color", backgroundColor: "$color3" }}>
                    <YStack position="relative" overflow="hidden" backgroundColor="$color3">
                      <TemplateThumb
                        name={r.name}
                        category={r.category}
                        slug={r.slug}
                        className="zoom-target"
  />
                    </YStack>
                    <YStack flex={1} padding="$4">
                      <H3 numberOfLines={1} fontSize="$3" fontWeight="500" color="$color">
                        {r.name}
                      </H3>
                      <Paragraph marginTop="$1" numberOfLines={1} fontSize="$1" color="$color11">{r.framework}</Paragraph>
                    </YStack>
                  </YStack></Link>
                ))}
              </YStack>
            </YStack>
          </YStack>
        )}

        {/* ── Final CTA ─────────────────────────────────────────── */}
        <YStack borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$12" $md={{ paddingHorizontal: "$6", paddingVertical: "$13" }}>
          <Reveal alignSelf="center" width="100%" maxWidth={672}>
            <H2 textAlign="center" fontSize="$10" fontWeight="500" letterSpacing={-0.4} $md={{ fontSize: "$11" }}>
              Make {t.name} yours.
            </H2>
            <Paragraph alignSelf="center" textAlign="center" marginTop="$4" maxWidth={448} fontSize="$4" color="$color11" $md={{ fontSize: "$6" }}>
              Fork it into the Hanzo builder, edit it with AI, and ship it to a live
              hanzo.app URL — database, auth, and AI wired in.
            </Paragraph>
            <XStack marginTop="$6" flexWrap="wrap" alignItems="center" justifyContent="center" gap="$3">
              <Link
                href={t.fork}
              ><XStack alignItems="center" gap="$2" borderRadius="$10" backgroundColor="$color12" paddingHorizontal="$5" paddingVertical="$3" hoverStyle={{ backgroundColor: "$color12" }}>
                <SizableText fontSize="$3" fontWeight="500" color="$background">Use this template</SizableText>
                <SizableText color="$background"><ArrowRight size={16} /></SizableText>
              </XStack></Link>
              <Link
                href="/templates"
              ><SizableText borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$5" paddingVertical="$3" fontSize="$3" fontWeight="500" color="$color" hoverStyle={{ borderColor: "$color", color: "$color" }}>
                Browse all templates
              </SizableText></Link>
            </XStack>
          </Reveal>
        </YStack>
      </YStack>

      <SiteFooter />
    </YStack>
  );
}
