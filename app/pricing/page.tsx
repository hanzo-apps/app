"use client";

import { Button } from '@hanzo/ui';
import { SizableText, YStack, XStack, H1, Paragraph, H3 } from '@hanzo/gui';
// Canonical plans page. One subscription = shared AI usage across every Hanzo
// app (builder, Hanzo Chat, the API at api.hanzo.ai). Monochrome design system:
// Header + SiteFooter + Reveal, true-black, Geist. Honest feature lists — no
// invented metrics. CTA reuses the canonical signup funnel (login signup hint →
// /dev), the same pattern as components/layout/header.tsx getStarted().

import { useEffect } from "react";
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

// Marketing copy only. The PRICE is deliberately absent: commerce's catalog
// (`GET /v1/billing/plans`) is the one authority, and it is what
// `subscribe/card` actually charges. Carrying a second price here is how a page
// ends up advertising $100 for a plan the server bills at $25.
interface Plan {
  id: string;
  name: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

// Honest, differentiated tiers. The differentiator is the size of the shared
// monthly usage allowance (bigger as you go up — true by construction) plus real
// capabilities (orgs/seats, support). No fabricated request/token counts.
const plans: Plan[] = [
  {
    id: "pro",
    name: "Pro",
    tagline: "For individual builders shipping real apps.",
    features: [
      "Shared AI usage across every Hanzo app — builder, Chat, and API",
      "Zen and Enso models via the Hanzo AI API",
      "Unlimited projects, private by default",
      "Custom domains on published apps",
      "GitHub import and export",
      "Deploy to a live *.hanzo.app URL",
      "Community support",
    ],
  },
  {
    id: "team",
    name: "Team",
    tagline: "For teams building together in one org.",
    highlighted: true,
    badge: "Most popular",
    features: [
      "Everything in Pro",
      "A larger shared-usage allowance for your whole org",
      "Organization with multiple seats and one bill",
      "Shared projects across your team",
      "Owner and member roles",
      "Priority support",
    ],
  },
  {
    id: "max",
    name: "Max",
    tagline: "For heavy usage and larger organizations.",
    features: [
      "Everything in Team",
      "The largest shared-usage allowance",
      "Org-wide shared billing and projects",
      "Priority support with faster response",
    ],
  },
];

export default function PricingPage() {
  const analytics = useAnalytics();
  const { isAuthenticated, login } = useUser();

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

        {/* ── Plans ────────────────────────────────────────────── */}
        <YStack paddingHorizontal="$4" paddingBottom="$6" $md={{ paddingHorizontal: "$6" }}>
          <YStack alignSelf="center" maxWidth={1152} gap="$4.5">
            {plans.map((plan, i) => (
              <Reveal key={plan.id} delay={i * 80}>
                <YStack
                  position="relative" height="100%" borderRadius="$8" borderWidth={1} padding={28} {...{ borderColor: plan.highlighted ? "$color" : "$borderColor", backgroundColor: plan.highlighted ? "$color2" : "$color002", hoverStyle: plan.highlighted ? undefined : {"borderColor":"$color06"} }}
                >
                  {plan.badge && (
                    <YStack position="absolute" top="-3" left={28}>
                      <SizableText borderRadius="$10" backgroundColor="$color5" borderWidth={1} borderColor="$color6" paddingHorizontal="$3" paddingVertical="$1" fontSize={11} fontWeight="500" color="$color12">
                        {plan.badge}
                      </SizableText>
                    </YStack>
                  )}

                  <H3 fontSize="$6" fontWeight="500" color="$color">{plan.name}</H3>
                  <Paragraph marginTop="$1.5" minHeight="2.5rem" fontSize="$3" color="$color11">
                    {plan.tagline}
                  </Paragraph>

                  {/* Price straight from the catalog that will be charged. While
                      it loads we show a dash — never a stand-in number. */}
                  <XStack marginTop="$4.5" alignItems="baseline" gap="$1.5">
                    <SizableText fontFamily="$mono" fontSize="$11" fontWeight="500" letterSpacing={-0.4}>
                      {catalog.get(plan.id) ? usd(catalog.get(plan.id)!.price) : "—"}
                    </SizableText>
                    <SizableText fontSize="$3" color="$color11">
                      {catalog.get(plan.id)?.perSeat ? "/seat/month" : "/month"}
                    </SizableText>
                  </XStack>

                  <Button
                    onClick={() => choosePlan(plan.id)}
                    disabled={
                      isAuthenticated && (catalogLoading || !catalog.get(plan.id))
                    }
                    title={catalogError ?? undefined}
                    variant={plan.highlighted ? 'default' : 'outline'}
                    marginTop="$5" width="100%" alignItems="center" justifyContent="center" gap="$2" borderRadius="$10" paddingHorizontal="$4.5" paddingVertical="$3" disabledStyle={{ opacity: 0.6 }} {...{ backgroundColor: plan.highlighted ? "$color12" : "$color002", hoverStyle: plan.highlighted ? {"backgroundColor":"$color12"} : {"borderColor":"$color06","backgroundColor":"$color005"}, borderWidth: plan.highlighted ? undefined : 1, borderColor: plan.highlighted ? undefined : "$borderColor" }}
                  >
                    <SizableText fontSize="$3" fontWeight="500">
                      {!isAuthenticated
                        ? "Get started"
                        : catalogLoading
                          ? "Loading…"
                          : catalog.get(plan.id)
                            ? "Choose plan"
                            : "Unavailable"}
                    </SizableText>
                    <ArrowRight size={16} />
                  </Button>

                  <YStack marginTop={28} rowGap="$3.5" borderTopWidth={1} borderColor="$borderColor" paddingTop="$5">
                    {plan.features.map((f) => (
                      <XStack key={f} alignItems="flex-start" gap="$3">
                        <Check size={16} />
                        <SizableText fontSize="$3" color="$color">{f}</SizableText>
                      </XStack>
                    ))}
                  </YStack>
                </YStack>
              </Reveal>
            ))}
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
