"use client";

import { SizableText, YStack, XStack, H1, Paragraph, Anchor, H3, H2 } from '@hanzo/gui';
// Support hub for hanzo.app. Monochrome design system (Header + SiteFooter +
// Reveal). Contact + channels are REAL only: support@hanzo.ai, the community
// Discord and status page that already ship in the repo footer, docs, FAQ, and
// GitHub. No invented channels.

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Mail,
  MessagesSquare,
  Activity,
  BookOpen,
  HelpCircle,
  Github,
} from "lucide-react";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";
import Reveal from "@/components/landing/reveal";

interface Channel {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  external?: boolean;
  cta: string;
}

const channels: Channel[] = [
  {
    icon: <Mail size={20} />,
    title: "Email support",
    description:
      "Reach the team directly for account, billing, or technical help. We read every message.",
    href: "mailto:support@hanzo.ai",
    external: true,
    cta: "support@hanzo.ai",
  },
  {
    icon: <MessagesSquare size={20} />,
    title: "Community",
    description:
      "Join the Hanzo Discord to ask questions, share what you built, and talk to other builders.",
    href: "https://discord.gg/hanzoai",
    external: true,
    cta: "Open Discord",
  },
  {
    icon: <Activity size={20} />,
    title: "System status",
    description:
      "Live status and incident history for Hanzo Cloud and the API. Check here first if something looks down.",
    href: "https://status.hanzo.ai",
    external: true,
    cta: "View status",
  },
  {
    icon: <HelpCircle size={20} />,
    title: "FAQ",
    description:
      "Quick answers on how the builder works, which models power it, custom domains, GitHub export, and billing.",
    href: "/faq",
    cta: "Read the FAQ",
  },
  {
    icon: <BookOpen size={20} />,
    title: "Documentation",
    description:
      "Guides and references for the builder, Hanzo Cloud, and the AI API.",
    href: "/docs",
    cta: "Browse docs",
  },
  {
    icon: <Github size={20} />,
    title: "GitHub",
    description:
      "Hanzo is open on GitHub. File an issue, read the source, or import a repo into the builder.",
    href: "https://github.com/hanzoai",
    external: true,
    cta: "View on GitHub",
  },
];

export default function HelpPage() {
  return (
    <SizableText minHeight="100%" backgroundColor="$background" color="$color" display="flex" flexDirection="column">
      <Header />

      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <SizableText position="relative" overflow="hidden" paddingHorizontal="$4" paddingVertical="$11" textAlign="center" display="flex" flexDirection="column" $md={{ paddingHorizontal: "$6", paddingVertical: "$13" }}>
          <YStack pointerEvents="none" position="absolute" top={0} right={0} bottom={0} left={0} overflow="hidden">
            <YStack position="absolute" left="50%" top="-30%" height={420} width={720} x="50%" borderRadius="$10" backgroundColor="$color" />
          </YStack>

          <YStack position="relative" alignSelf="center" maxWidth={768}>
            <Reveal>
              <XStack marginBottom="$4.5" alignItems="center" gap="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3" paddingVertical="$1.5">
                <SizableText height="$1.5" width="$1.5" borderRadius="$10" backgroundColor="$color" />
                <SizableText fontFamily="$mono" fontSize={11} textTransform="uppercase" letterSpacing={2.4} color="$color11">
                  Support
                </SizableText>
              </XStack>
            </Reveal>

            <Reveal delay={60}>
              <H1 fontSize="$11" fontWeight="500" lineHeight={1.03} letterSpacing={-0.4} $sm={{ fontSize: "$12" }} $md={{ fontSize: "$13" }}>
                How can we help?
              </H1>
            </Reveal>

            <Reveal delay={120}>
              <Paragraph alignSelf="center" marginTop="$4.5" maxWidth={576} fontSize="$4" color="$color11" $md={{ fontSize: "$6" }}>
                Start with the FAQ or docs for a fast answer, or reach the team
                directly at{" "}
                <Anchor
                  href="mailto:support@hanzo.ai"
                  color="$color" textDecorationLine="underline" hoverStyle={{ color: "$color" }}
                >
                  support@hanzo.ai
                </Anchor>
                .
              </Paragraph>
            </Reveal>
          </YStack>
        </SizableText>

        {/* ── Channels ─────────────────────────────────────────── */}
        <YStack paddingHorizontal="$4" paddingBottom="$6" $md={{ paddingHorizontal: "$6" }}>
          <YStack alignSelf="center" maxWidth={1152} gap="$4.5">
            {channels.map((c, i) => {
              const inner = (
                <YStack group height="100%" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" padding="$5" hoverStyle={{ borderColor: "$color", backgroundColor: "$color" }}>
                  <XStack alignItems="center" justifyContent="space-between">
                    <SizableText height="$7" width="$7" alignItems="center" justifyContent="center" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" color="$color">
                      {c.icon}
                    </SizableText>
                    {c.external ? (
                      <ArrowUpRight size={16} color="$color" />
                    ) : (
                      <ArrowRight size={16} color="$color" />
                    )}
                  </XStack>
                  <H3 marginTop="$4.5" fontSize="$4" fontWeight="500" color="$color">
                    {c.title}
                  </H3>
                  <Paragraph marginTop="$2" flex={1} fontSize="$3" lineHeight={1.625} color="$color11">
                    {c.description}
                  </Paragraph>
                  <SizableText marginTop="$4" fontSize="$3" fontWeight="500" color="$color" $group-hover={{ color: "$color" }}>
                    {c.cta} →
                  </SizableText>
                </YStack>
              );
              return (
                <Reveal key={c.title} delay={i * 60}>
                  {c.external ? (
                    <a href={c.href} target="_blank" rel="noopener noreferrer">
                      {inner}
                    </a>
                  ) : (
                    <Link href={c.href}>{inner}</Link>
                  )}
                </Reveal>
              );
            })}
          </YStack>
        </YStack>

        {/* ── Contact CTA ──────────────────────────────────────── */}
        <YStack paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6", paddingVertical: "$12" }}>
          <Reveal alignSelf="center" width="100%" maxWidth={1152}>
            <YStack alignItems="flex-start" justifyContent="space-between" gap="$4.5" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" padding="$6" $sm={{ flexDirection: "row", alignItems: "center" }} $md={{ padding: "$7" }}>
              <div>
                <H2 fontSize="$8" fontWeight="500" letterSpacing={-0.4} $md={{ fontSize: "$10" }}>
                  Talk to a human.
                </H2>
                <Paragraph marginTop="$2" maxWidth={448} fontSize="$3" color="$color11" $md={{ fontSize: "$4" }}>
                  Account, billing, or something the docs didn&apos;t cover — email
                  the team and we&apos;ll get back to you.
                </Paragraph>
              </div>
              <Anchor
                href="mailto:support@hanzo.ai"
                flexShrink={0} alignItems="center" gap="$2" borderRadius="$10" backgroundColor="$color12" paddingHorizontal="$5" paddingVertical="$3" fontSize="$3" fontWeight="500" color="$background" hoverStyle={{ backgroundColor: "$color12" }}
              >
                <Mail size={16} />
                Email support
              </Anchor>
            </YStack>
          </Reveal>
        </YStack>
      </main>

      <SiteFooter />
    </SizableText>
  );
}
