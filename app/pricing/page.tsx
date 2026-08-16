"use client";

import { Button } from '@hanzo/ui';
import { SizableText, YStack, XStack, H1, Paragraph, H3, Slider } from '@hanzo/ui';
// Canonical plans page. One subscription = shared AI usage across every Hanzo
// app (builder, Hanzo Chat, the API at api.hanzo.ai). Monochrome design system:
// Header + SiteFooter + Reveal, true-black, Geist. Honest feature lists — no
// invented metrics. CTA reuses the canonical signup funnel (login signup hint →
// /dev), the same pattern as components/layout/header.tsx getStarted().

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";
import { EVENTS } from "@hanzo/event";
import { useAnalytics } from "@hanzo/event/react";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";
import Reveal from "@/components/landing/reveal";
import FaqSection from "@/components/marketing/faq-section";
import { billingFaq } from "@/components/marketing/faq-data";
import { useUser } from "@/hooks/useUser";
import { usePlans, usd, priceAt } from "@/lib/plans";
import { checkoutPath } from "@/lib/pay";

// Presentation only. Name, pitch, PRICE and features all come from commerce's
// catalog (`GET /v1/billing/plans`) — the one authority, and what
// `subscribe/card` actually charges. This map just says which rows this page
// sells, in which tab, and which one to spotlight.
const GROUPS = {
  personal: { title: "Personal", slugs: ["go", "dev", "pro", "max"], highlight: "pro" },
  team: { title: "Team & Enterprise", slugs: ["team", "enterprise"], highlight: "team" },
} as const;
type GroupId = keyof typeof GROUPS;

// Honest, differentiated tiers. The differentiator is the size of the shared
export default function PricingPage() {
  const analytics = useAnalytics();
  const router = useRouter();
  const { isAuthenticated, login } = useUser();
  const [group, setGroup] = useState<GroupId>("personal");
  // Where each ladder-priced plan's control is sitting, by slug. Keyed by slug
  // rather than held as one number because it belongs to a card, not to the page
  // — two plans sold at a level would otherwise move together.
  const [levels, setLevels] = useState<Record<string, number>>({});

  useEffect(() => {
    analytics.capture(EVENTS.PRICING_VIEWED);
  }, [analytics]);

  // The live catalog — both the price we SHOW and the price we send to checkout.
  const { plans: catalog, loading: catalogLoading, error: catalogError } = usePlans();

  // Say which plan was chosen, then leave. This page draws prices and takes a
  // choice; what a choice costs and where it is paid belong to /checkout, which
  // reads the catalog itself. A signed-out visitor goes through the canonical
  // IAM signup funnel on the way, and lands there rather than back here.
  const choosePlan = (planId: string, level: number) => {
    analytics.capture(EVENTS.PLAN_CLICKED, { plan: planId, level });
    // One destination either way — the checkout for the plan just chosen. A
    // signed-out buyer signs in first and arrives there afterwards, rather than
    // back at this page with the choice to make again.
    const next = checkoutPath({ plan: planId, level });
    if (!isAuthenticated) {
      login(next, { signup: true });
      return;
    }
    router.push(next);
  };

  return (
    <YStack minHeight="100%" backgroundColor="$background">
      <Header />

      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <YStack position="relative" overflow="hidden" paddingHorizontal="$4" paddingVertical="$8" $sm={{ paddingVertical: "$10" }} $md={{ paddingHorizontal: "$6", paddingVertical: "$12" }}>
          <YStack pointerEvents="none" position="absolute" top={0} right={0} bottom={0} left={0} overflow="hidden">
            <YStack position="absolute" left="50%" top="-30%" height={420} width={720} marginLeft={-360} borderRadius="$10" backgroundColor="$color005" filter="blur(130px)" />
          </YStack>

          <YStack position="relative" alignSelf="center" maxWidth={768}>
            <Reveal>
              <XStack marginBottom="$4.5" alignItems="center" gap="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color002" paddingHorizontal="$3" paddingVertical="$1.5">
                <SizableText fontFamily="$mono" fontSize="$1" color="$color11">
                  One plan · every Hanzo app
                </SizableText>
              </XStack>
            </Reveal>

            <Reveal delay={60}>
              <H1 fontSize="$11" fontWeight="500" lineHeight="1.03" letterSpacing={-0.4} textAlign="center" $sm={{ fontSize: "$12" }} $md={{ fontSize: "$13" }}>
                Shared AI usage,
                <br />
                across everything you build.
              </H1>
            </Reveal>

            <Reveal delay={120}>
              <Paragraph alignSelf="center" marginTop="$4.5" maxWidth={576} fontSize="$4" color="$color11" textAlign="center" $md={{ fontSize: "$6" }} lineHeight="1.5">
                One subscription covers AI in the app builder, in Hanzo Chat and
                through the API at{" "}
                <SizableText fontFamily="$mono" color="$color">api.hanzo.ai</SizableText>, out
                of a single monthly allowance. Move up a plan when you need more
                of it.
              </Paragraph>
            </Reveal>
          </YStack>
        </YStack>

        {/* ── Plans — catalog rows, grouped Personal | Team & Enterprise ── */}
        <YStack paddingHorizontal="$4" paddingBottom="$6" $md={{ paddingHorizontal: "$6" }}>
          <YStack alignSelf="center" width="100%" maxWidth={1152} gap="$5">
            <XStack alignSelf="center" borderRadius="$10" backgroundColor="$color3" padding="$0.5" gap="$0.5">
              {(Object.keys(GROUPS) as GroupId[]).map((id) => (
                <SizableText
                  key={id}
                  role="tab"
                  tabIndex={0}
                  aria-selected={group === id}
                  onClick={() => setGroup(id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setGroup(id);
                    }
                  }}
                  cursor="pointer" whiteSpace="nowrap" borderRadius="$10" paddingHorizontal="$4" paddingVertical="$1.5" fontSize="$3" fontWeight="500" {...{ backgroundColor: group === id ? "$color5" : "transparent", color: group === id ? "$color12" : "$color11" }}
                >
                  {GROUPS[id].title}
                </SizableText>
              ))}
            </XStack>

            {catalogError ? (
              <Paragraph alignSelf="center" fontSize="$3" color="$color11" textAlign="center">
                The plan list didn&apos;t load. Refresh the page to try again.
              </Paragraph>
            ) : (
              <XStack flexWrap="wrap" gap="$4" justifyContent="center">
                {catalogLoading
                  ? GROUPS[group].slugs.map((s) => (
                      <YStack key={s} className="skeleton" height={420} flexBasis={252} flexGrow={1} minWidth={240} maxWidth={360} borderRadius="$8" backgroundColor="$color2" />
                    ))
                  : GROUPS[group].slugs
                      .map((s) => catalog.get(s))
                      .filter((p): p is NonNullable<typeof p> => Boolean(p))
                      .map((p) => {
                        const highlighted = p.slug === GROUPS[group].highlight;
                        const level = levels[p.slug] ?? 0;
                        return (
                          <YStack
                            key={p.slug}
                            position="relative" flexBasis={252} flexGrow={1} minWidth={240} maxWidth={360} borderRadius="$8" borderWidth={1} padding={28} {...{ borderColor: highlighted ? "$color" : "$borderColor", backgroundColor: highlighted ? "$color2" : "$color002", hoverStyle: highlighted ? undefined : {"borderColor":"$color06"} }}
                          >
                            {highlighted && (
                              <YStack position="absolute" top="$-3" left={28}>
                                <SizableText borderRadius="$10" backgroundColor="$color5" borderWidth={1} borderColor="$color6" paddingHorizontal="$3" paddingVertical="$1" fontSize="$1" fontWeight="500" color="$color12">
                                  Recommended
                                </SizableText>
                              </YStack>
                            )}

                            <H3 fontSize="$6" fontWeight="500" color="$color">{p.name}</H3>
                            <Paragraph marginTop="$1.5" minHeight="2.5rem" fontSize="$3" color="$color11">
                              {p.description}
                            </Paragraph>

                            {/* Price straight from the catalog that will be charged. */}
                            <XStack marginTop="$4.5" alignItems="baseline" gap="$1.5">
                              <SizableText fontFamily="$mono" fontSize="$11" fontWeight="500" letterSpacing={-0.4}>
                                {p.contactSales ? "Custom" : usd(priceAt(p, level))}
                              </SizableText>
                              {!p.contactSales && (
                                <SizableText fontSize="$3" color="$color11">
                                  {p.perSeat ? "/seat/month" : "/month"}
                                </SizableText>
                              )}
                            </XStack>

                            {/* A plan sold at a chosen level gets the control that
                                chooses it. One decision, and the price above is its
                                only readout — a scale, a legend or a second number
                                would each be another thing to read on a card whose
                                job is to be read at a glance. Rendered off the
                                catalog, so the tier that has a ladder is the tier
                                that shows one. */}
                            {p.prices.length > 1 && (
                              <Slider
                                value={[level]}
                                onValueChange={([v]: number[]) =>
                                  setLevels((s) => ({ ...s, [p.slug]: v }))
                                }
                                min={0}
                                max={p.prices.length - 1}
                                step={1}
                                width="100%"
                                marginTop="$4"
                                aria-label={`${p.name} monthly price`}
                              />
                            )}

                            {p.contactSales ? (
                              <Link
                                href="/enterprise"
                              ><XStack marginTop="$5" width="100%" alignItems="center" justifyContent="center" gap="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color002" paddingHorizontal="$4.5" paddingVertical="$3" hoverStyle={{ borderColor: "$color06", backgroundColor: "$color005" }}>
                                <SizableText fontSize="$3" fontWeight="500">Call us</SizableText>
                                <ArrowRight size={16} />
                              </XStack></Link>
                            ) : (
                              <Button
                                onClick={() => choosePlan(p.slug, level)}
                                disabled={isAuthenticated && catalogLoading}
                                title={catalogError ?? undefined}
                                variant={highlighted ? 'default' : 'outline'}
                                marginTop="$5" width="100%" alignItems="center" justifyContent="center" gap="$2" borderRadius="$10" paddingHorizontal="$4.5" paddingVertical="$3" borderWidth={1} disabledStyle={{ opacity: 0.6 }} {...{ backgroundColor: highlighted ? "$color5" : "$color002", hoverStyle: highlighted ? {"backgroundColor":"$color6","borderColor":"$color7"} : {"borderColor":"$color06","backgroundColor":"$color005"}, borderColor: highlighted ? "$color6" : "$borderColor" }}
                              >
                                <SizableText fontSize="$3" fontWeight="500">
                                  {!isAuthenticated ? "Get started" : "Choose plan"}
                                </SizableText>
                                <ArrowRight size={16} />
                              </Button>
                            )}

                            <YStack marginTop={28} rowGap="$3.5" borderTopWidth={1} borderColor="$borderColor" paddingTop="$5">
                              {p.features.map((f) => (
                                <XStack key={f} alignItems="flex-start" gap="$3">
                                  <Check size={16} />
                                  <SizableText fontSize="$3" color="$color">{f}</SizableText>
                                </XStack>
                              ))}
                            </YStack>
                          </YStack>
                        );
                      })}
              </XStack>
            )}
          </YStack>
        </YStack>

        {/* ── Start note ───────────────────────────────────────── */}
        <YStack paddingHorizontal="$4" $md={{ paddingHorizontal: "$6" }}>
          <Reveal alignSelf="center" width="100%" maxWidth={1152}>
            {/* flexWrap, because this row turns to `row` at $sm and then has no
                way to give: the copy and the button both want their full width
                and neither yields, so between roughly 700 and 1000px the button
                left the card and the arrow was cut off at the viewport edge
                (iPad mini overflowed the document by 30px). Wrapping is the
                honest answer at that width — two lines beat one line that does
                not fit. */}
            <YStack alignItems="flex-start" justifyContent="space-between" gap="$4" flexWrap="wrap" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" padding="$5" $sm={{ flexDirection: "row", alignItems: "center" }} $md={{ padding: 28 }}>
              {/* A YStack, not a bare <div>. Tamagui's H3 and Paragraph render
                  inline here, so inside a plain div the heading and its body copy
                  shared a line — "Start in minutesEvery plan includes…" — and the
                  Paragraph's marginTop was silently dropped, because a margin-top
                  does nothing to an inline box. A flex column gives them block
                  layout, which is what the spacing was always written for.
                  minWidth={0} lets this column shrink instead of forcing the row
                  wider than the card. */}
              <YStack flexShrink={1} minWidth={0}>
                <H3 fontSize="$4" fontWeight="500" color="$color">
                  What every plan includes
                </H3>
                <Paragraph marginTop="$1" fontSize="$3" color="$color11">
                  The builder, Hanzo Chat and the API, out of one shared
                  allowance. Pick a plan, add a card, and start. Change or cancel
                  whenever you like.
                </Paragraph>
              </YStack>
              {/* The anchor must not shrink. It was the one element that could:
                  the <a> shrank to 90px while the XStack inside it stayed 181px
                  and flex:0 0 auto, so the button rendered OUTSIDE its own link
                  box and off the screen. Pinning the anchor makes the link and
                  the thing you see the same shape. */}
              <Link
                style={{ flexShrink: 0 }}
                href="/dev"
                className="hz-tap"
              ><XStack flexShrink={0} alignItems="center" gap="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$4.5" paddingVertical="$2.5" hoverStyle={{ borderColor: "$color06", backgroundColor: "$color4" }}>
                <SizableText fontSize="$3" fontWeight="500" color="$color">Open the builder</SizableText>
                <ArrowRight size={16} />
              </XStack></Link>
            </YStack>
          </Reveal>
        </YStack>

        {/* ── Enterprise note ──────────────────────────────────── */}
        <YStack paddingHorizontal="$4" paddingTop="$6" $md={{ paddingHorizontal: "$6" }}>
          <Reveal alignSelf="center" width="100%" maxWidth={1152}>
            {/* flexWrap, because this row turns to `row` at $sm and then has no
                way to give: the copy and the button both want their full width
                and neither yields, so between roughly 700 and 1000px the button
                left the card and the arrow was cut off at the viewport edge
                (iPad mini overflowed the document by 30px). Wrapping is the
                honest answer at that width — two lines beat one line that does
                not fit. */}
            <YStack alignItems="flex-start" justifyContent="space-between" gap="$4" flexWrap="wrap" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" padding="$5" $sm={{ flexDirection: "row", alignItems: "center" }} $md={{ padding: 28 }}>
              {/* A YStack, not a bare <div>. Tamagui's H3 and Paragraph render
                  inline here, so inside a plain div the heading and its body copy
                  shared a line — "Start in minutesEvery plan includes…" — and the
                  Paragraph's marginTop was silently dropped, because a margin-top
                  does nothing to an inline box. A flex column gives them block
                  layout, which is what the spacing was always written for.
                  minWidth={0} lets this column shrink instead of forcing the row
                  wider than the card. */}
              <YStack flexShrink={1} minWidth={0}>
                <H3 fontSize="$4" fontWeight="500" color="$color">
                  Need more than Max?
                </H3>
                <Paragraph marginTop="$1" fontSize="$3" color="$color11">
                  Volume usage, SSO, dedicated support, and custom terms for your
                  organization.
                </Paragraph>
              </YStack>
              {/* The anchor must not shrink. It was the one element that could:
                  the <a> shrank to 90px while the XStack inside it stayed 181px
                  and flex:0 0 auto, so the button rendered OUTSIDE its own link
                  box and off the screen. Pinning the anchor makes the link and
                  the thing you see the same shape. */}
              <Link
                style={{ flexShrink: 0 }}
                href="/enterprise"
                className="hz-tap"
              ><XStack flexShrink={0} alignItems="center" gap="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$4.5" paddingVertical="$2.5" hoverStyle={{ borderColor: "$color06", backgroundColor: "$color4" }}>
                <SizableText fontSize="$3" fontWeight="500" color="$color">Talk to us</SizableText>
                <ArrowRight size={16} />
              </XStack></Link>
            </YStack>
          </Reveal>
        </YStack>

        {/* ── Billing FAQ ──────────────────────────────────────── */}
        <FaqSection
          id="faq"
          eyebrow="Billing"
          title="Questions about pricing"
          items={billingFaq}
  />

        <YStack borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingBottom="$4" $md={{ paddingHorizontal: "$6" }}>
          <Paragraph marginTop="$6" fontSize="$3" color="$color11" textAlign="center">
            More questions? Read the{" "}
            <Link
              href="/faq"
            ><SizableText color="$color" textDecorationLine="underline" hoverStyle={{ color: "$color" }}>
              full FAQ
            </SizableText></Link>{" "}
            or{" "}
            <Link
              href="/help"
            ><SizableText color="$color" textDecorationLine="underline" hoverStyle={{ color: "$color" }}>
              get help
            </SizableText></Link>
            .
          </Paragraph>
        </YStack>
      </main>

      <SiteFooter />
    </YStack>
  );
}
