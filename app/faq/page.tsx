"use client";

import { SizableText, YStack, XStack, H1, Paragraph, H2 } from '@hanzo/gui';
// Full FAQ for hanzo.app. Monochrome design system (Header + SiteFooter +
// Reveal). Real, answerable questions only — product + billing groups come from
// the shared faq-data module (DRY: /pricing renders the billing subset).

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";
import Reveal from "@/components/landing/reveal";
import FaqSection from "@/components/marketing/faq-section";
import { productFaq, billingFaq } from "@/components/marketing/faq-data";

export default function FaqPage() {
  return (
    <YStack minHeight="100%" backgroundColor="$background">
      <Header />

      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <YStack position="relative" overflow="hidden" paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$13" }}>
          <YStack pointerEvents="none" position="absolute" top={0} right={0} bottom={0} left={0} overflow="hidden">
            <YStack position="absolute" left="50%" top="-30%" height={420} width={720} x="50%" borderRadius="$10" backgroundColor="$color" />
          </YStack>

          <YStack position="relative" alignSelf="center" maxWidth={768}>
            <Reveal>
              <XStack marginBottom="$4.5" alignItems="center" gap="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3" paddingVertical="$1.5">
                <SizableText height="$1.5" width="$1.5" borderRadius="$10" backgroundColor="$color" />
                <SizableText fontFamily="$mono" fontSize={11} textTransform="uppercase" letterSpacing={2.4} color="$color11">
                  FAQ
                </SizableText>
              </XStack>
            </Reveal>

            <Reveal delay={60}>
              <H1 fontSize="$11" fontWeight="500" lineHeight={1.03} letterSpacing={-0.4} textAlign="center" $sm={{ fontSize: "$12" }} $md={{ fontSize: "$13" }}>
                Questions, answered.
              </H1>
            </Reveal>

            <Reveal delay={120}>
              <Paragraph alignSelf="center" marginTop="$4.5" maxWidth={576} fontSize="$4" color="$color11" textAlign="center" $md={{ fontSize: "$6" }}>
                How hanzo.app works, what powers it, and how billing runs. If your
                question isn&apos;t here,{" "}
                <Link
                  href="/help"
                ><SizableText color="$color" textDecorationLine="underline" hoverStyle={{ color: "$color" }}>
                  reach the team
                </SizableText></Link>
                .
              </Paragraph>
            </Reveal>
          </YStack>
        </YStack>

        {/* ── Product ──────────────────────────────────────────── */}
        <FaqSection
          id="product"
          eyebrow="The product"
          title="Building & shipping"
          items={productFaq}
  />

        {/* ── Billing ──────────────────────────────────────────── */}
        <YStack borderTopWidth={1} borderColor="$borderColor">
          <FaqSection
            id="billing"
            eyebrow="Billing"
            title="Plans & usage"
            items={billingFaq}
  />
        </YStack>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <YStack borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$12" }}>
          <Reveal alignSelf="center" width="100%" maxWidth={672}>
            <H2 fontSize="$10" fontWeight="500" letterSpacing={-0.4} textAlign="center" $md={{ fontSize: "$11" }}>
              Ready to build?
            </H2>
            <Paragraph alignSelf="center" marginTop="$4" maxWidth={448} fontSize="$4" color="$color11" textAlign="center">
              Describe an app and ship it live on Hanzo Cloud — database, auth,
              and AI already wired in.
            </Paragraph>
            <YStack marginTop="$6" alignItems="center" justifyContent="center" gap="$3" $sm={{ flexDirection: "row" }}>
              <Link
                href="/dev"
              ><XStack alignItems="center" gap="$2" borderRadius="$10" backgroundColor="$color12" paddingHorizontal="$5" paddingVertical="$3" hoverStyle={{ backgroundColor: "$color12" }}>
                <SizableText fontSize="$3" fontWeight="500" color="$background">Start building</SizableText>
                <SizableText color="$background"><ArrowRight size={16} /></SizableText>
              </XStack></Link>
              <Link
                href="/pricing"
              ><SizableText borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$5" paddingVertical="$3" fontSize="$3" fontWeight="500" color="$color" hoverStyle={{ borderColor: "$color", backgroundColor: "$color3" }}>
                See pricing
              </SizableText></Link>
            </YStack>
          </Reveal>
        </YStack>
      </main>

      <SiteFooter />
    </YStack>
  );
}
