"use client";

import { Button } from '@hanzo/ui';
import { SizableText, YStack, XStack, H1, Paragraph, H3 } from '@hanzo/gui';
// Canonical plans page. One subscription = shared AI usage across every Hanzo
// app (builder, Hanzo Chat, the API at api.hanzo.ai). Monochrome design system:
// Header + SiteFooter + Reveal, true-black, Geist. Honest feature lists — no
// invented metrics. CTA reuses the canonical signup funnel (login signup hint →
// /dev), the same pattern as components/layout/header.tsx getStarted().

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { EVENTS } from "@hanzo/event";
import { useAnalytics } from "@hanzo/event/react";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";
import Reveal from "@/components/landing/reveal";
import FaqSection from "@/components/marketing/faq-section";
import { billingFaq } from "@/components/marketing/faq-data";
import { useUser } from "@/hooks/useUser";
import { usePlans, usd } from "@/lib/plans";
import { goToCheckout } from "@/lib/pay";

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
  const { isAuthenticated, login } = useUser();
  const [group, setGroup] = useState<GroupId>("personal");

  useEffect(() => {
    analytics.capture(EVENTS.PRICING_VIEWED);
  }, [analytics]);

  // The live catalog — both the price we SHOW and the price we send to checkout.
  const { plans: catalog, loading: catalogLoading, error: catalogError } = usePlans();

  // Turn a plan choice into a real subscription. A signed-out visitor goes through
  // the canonical IAM signup funnel first. A signed-in user goes straight to the
  // ONE live Square surface for a card-on-file subscription at the catalog price.
  //
  // This used to POST /api/commerce/checkout and, when that failed, bounce to
  // /billing — which is what it did on every single click, because that route
  // 503s without a webhook secret and the Commerce endpoint behind it (
  // /v1/checkout/charge) does not exist. Hence "the buttons do nothing".
  const choosePlan = (planId: string) => {
    analytics.capture(EVENTS.PLAN_CLICKED, { plan: planId });
    if (!isAuthenticated) {
      login("/pricing", { signup: true });
      return;
    }
    const priced = catalog.get(planId);
    // Refuse rather than guess: no catalog price ⇒ no checkout.
    if (!priced || priced.contactSales || priced.price <= 0) return;
    goToCheckout({
      amountUsd: priced.price / 100,
      plan: planId,
      returnUrl: `${window.location.origin}/billing`,
    });
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
                <SizableText height="$1.5" width="$1.5" borderRadius="$10" backgroundColor="$color5" />
                <SizableText fontFamily="$mono" fontSize={11} color="$color11">
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
                One subscription powers AI across the app builder, Hanzo Chat, and
                the API at{" "}
                <SizableText fontFamily="$mono" color="$color">api.hanzo.ai</SizableText> — from
                a single monthly allowance. Start for free; add a plan when you need
                more.
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
                  cursor="pointer" whiteSpace="nowrap" borderRadius="$10" paddingHorizontal="$4" paddingVertical="$1.5" fontSize="$3" fontWeight="500" {...{ backgroundColor: group === id ? "$color5" : "transparent", color: group === id ? "$color12" : "$color11" }} focusVisibleStyle={{ outlineWidth: 0 }}
                >
                  {GROUPS[id].title}
                </SizableText>
              ))}
            </XStack>

            {catalogError ? (
              <Paragraph alignSelf="center" fontSize="$3" color="$color11" textAlign="center">
                The plan catalog couldn&apos;t be loaded — refresh to try again.
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
                        return (
                          <YStack
                            key={p.slug}
                            position="relative" flexBasis={252} flexGrow={1} minWidth={240} maxWidth={360} borderRadius="$8" borderWidth={1} padding={28} {...{ borderColor: highlighted ? "$color" : "$borderColor", backgroundColor: highlighted ? "$color2" : "$color002", hoverStyle: highlighted ? undefined : {"borderColor":"$color06"} }}
                          >
                            {highlighted && (
                              <YStack position="absolute" top="-3" left={28}>
                                <SizableText borderRadius="$10" backgroundColor="$color5" borderWidth={1} borderColor="$color6" paddingHorizontal="$3" paddingVertical="$1" fontSize={11} fontWeight="500" color="$color12">
                                  Most popular
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
                                {p.contactSales ? "Custom" : usd(p.price)}
                              </SizableText>
                              {!p.contactSales && (
                                <SizableText fontSize="$3" color="$color11">
                                  {p.perSeat ? "/seat/month" : "/month"}
                                </SizableText>
                              )}
                            </XStack>

                            {p.contactSales ? (
                              <Link
                                href="/enterprise"
                              ><XStack marginTop="$5" width="100%" alignItems="center" justifyContent="center" gap="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color002" paddingHorizontal="$4.5" paddingVertical="$3" hoverStyle={{ borderColor: "$color06", backgroundColor: "$color005" }}>
                                <SizableText fontSize="$3" fontWeight="500">Call us</SizableText>
                                <ArrowRight size={16} />
                              </XStack></Link>
                            ) : (
                              <Button
                                onClick={() => choosePlan(p.slug)}
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

        {/* ── Free-to-start note ───────────────────────────────── */}
        <YStack paddingHorizontal="$4" $md={{ paddingHorizontal: "$6" }}>
          <Reveal alignSelf="center" width="100%" maxWidth={1152}>
            <YStack alignItems="flex-start" justifyContent="space-between" gap="$4" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" padding="$5" $sm={{ flexDirection: "row", alignItems: "center" }} $md={{ padding: 28 }}>
              <div>
                <H3 fontSize="$4" fontWeight="500" color="$color">
                  Start for free
                </H3>
                <Paragraph marginTop="$1" fontSize="$3" color="$color11">
                  No card required to sign up. Create an account, explore the
                  builder, and subscribe when you&apos;re ready to ship with more
                  shared AI usage.
                </Paragraph>
              </div>
              <Link
                href="/dev"
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
            <YStack alignItems="flex-start" justifyContent="space-between" gap="$4" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" padding="$5" $sm={{ flexDirection: "row", alignItems: "center" }} $md={{ padding: 28 }}>
              <div>
                <H3 fontSize="$4" fontWeight="500" color="$color">
                  Need more than Max?
                </H3>
                <Paragraph marginTop="$1" fontSize="$3" color="$color11">
                  Volume usage, SSO, dedicated support, and custom terms for your
                  organization.
                </Paragraph>
              </div>
              <Link
                href="/enterprise"
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
