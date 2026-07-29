"use client";

import { SizableText, YStack, XStack, H1, Paragraph, Anchor, H2, H3 } from '@hanzo/gui';
// Docs hub for hanzo.app. Monochrome design system (Header + SiteFooter + Reveal,
// true-black, Geist). Links REAL destinations only — no fabricated view counts,
// no invented "most viewed" cards. The builder quick-start is written inline
// (describe → generate → publish). Every external link resolves to a real page.

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Terminal,
  LayoutGrid,
  Github,
  GraduationCap,
  Wand2,
} from "lucide-react";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";
import Reveal from "@/components/landing/reveal";

interface Dest {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  external?: boolean;
  cta: string;
}

// Real, resolvable destinations only.
const destinations: Dest[] = [
  {
    icon: <BookOpen size={20} />,
    title: "Full documentation",
    description:
      "The complete Hanzo docs — Cloud, Base, IAM, KMS, and the AI API, with guides and references.",
    href: "https://docs.hanzo.ai",
    external: true,
    cta: "Read the docs",
  },
  {
    icon: <Terminal size={20} />,
    title: "AI API",
    description:
      "One OpenAI-compatible endpoint to Hanzo's Zen and Enso models plus 400+ frontier models at api.hanzo.ai.",
    href: "https://hanzo.ai/llm",
    external: true,
    cta: "Explore the gateway",
  },
  {
    icon: <LayoutGrid size={20} />,
    title: "Templates gallery",
    description:
      "Production-grade, open-source apps you can fork into the builder and deploy live in one click.",
    href: "/community",
    cta: "Browse templates",
  },
  {
    icon: <Github size={20} />,
    title: "Import from GitHub",
    description:
      "Bring an existing repository into the builder, or push any project out to your own repo. All Hanzo code is open on GitHub.",
    href: "https://github.com/hanzoai",
    external: true,
    cta: "View on GitHub",
  },
  {
    icon: <GraduationCap size={20} />,
    title: "Learn",
    description:
      "Walk-throughs and concepts for getting the most out of the builder and Hanzo Cloud.",
    href: "/learn",
    cta: "Start learning",
  },
  {
    icon: <Wand2 size={20} />,
    title: "Open the builder",
    description:
      "The fastest way to learn is to build. Describe an app and watch it come together, wired to a database, auth, and AI.",
    href: "/dev",
    cta: "Start building",
  },
];

const steps = [
  {
    n: "01",
    title: "Describe",
    body: "Tell the builder what you want in plain language — “a job board with logins and a Postgres-backed listings table.” No boilerplate, no scaffolding to configure.",
  },
  {
    n: "02",
    title: "Generate",
    body: "Hanzo generates a real, full-stack app and shows you a live preview. Iterate by chatting — ask for changes and watch them apply in place.",
  },
  {
    n: "03",
    title: "Publish",
    body: "Ship to a live *.hanzo.app URL in one click, with database, auth, and AI already wired in. Connect a custom domain or push to GitHub whenever you like.",
  },
];

export default function DocsPage() {
  return (
    <SizableText minHeight="100%" backgroundColor="$background" color="$color" display="flex" flexDirection="column">
      <Header />

      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <SizableText position="relative" overflow="hidden" paddingHorizontal="$4" paddingVertical="$8" textAlign="center" display="flex" flexDirection="column" $sm={{ paddingVertical: "$10" }} $md={{ paddingHorizontal: "$6", paddingVertical: "$12" }}>
          <YStack pointerEvents="none" position="absolute" top={0} right={0} bottom={0} left={0} overflow="hidden">
            <YStack position="absolute" left="50%" top="-30%" height={420} width={720} x="50%" borderRadius="$10" backgroundColor="$color" />
          </YStack>

          <YStack position="relative" alignSelf="center" maxWidth={768}>
            <Reveal>
              <XStack marginBottom="$4.5" alignItems="center" gap="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3" paddingVertical="$1.5">
                <SizableText height="$1.5" width="$1.5" borderRadius="$10" backgroundColor="$color" />
                <SizableText fontFamily="$mono" fontSize={11} textTransform="uppercase" letterSpacing={2.4} color="$color11">
                  Documentation
                </SizableText>
              </XStack>
            </Reveal>

            <Reveal delay={60}>
              <H1 fontSize="$11" fontWeight="500" lineHeight={1.03} letterSpacing={-0.4} $sm={{ fontSize: "$12" }} $md={{ fontSize: "$13" }}>
                Everything you need
                <br />
                to build with Hanzo.
              </H1>
            </Reveal>

            <Reveal delay={120}>
              <Paragraph alignSelf="center" marginTop="$4.5" maxWidth={576} fontSize="$4" color="$color11" $md={{ fontSize: "$6" }}>
                Start in the builder, then reach for the full docs, the API, and
                the template gallery when you need them. Real destinations, no
                dead ends.
              </Paragraph>
            </Reveal>

            <Reveal delay={180}>
              <YStack marginTop="$6" alignItems="center" justifyContent="center" gap="$3" $sm={{ flexDirection: "row" }}>
                <Link
                  href="/dev"
                ><SizableText alignItems="center" gap="$2" borderRadius="$10" backgroundColor="$color12" paddingHorizontal="$5" paddingVertical="$3" fontSize="$3" fontWeight="500" color="$background" hoverStyle={{ backgroundColor: "$color12" }}>
                  Start building
                  <ArrowRight size={16} />
                </SizableText></Link>
                <Anchor
                  href="https://docs.hanzo.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  alignItems="center" gap="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$5" paddingVertical="$3" fontSize="$3" fontWeight="500" color="$color" hoverStyle={{ borderColor: "$color", backgroundColor: "$color3" }}
                >
                  Full documentation
                  <ArrowUpRight size={16} />
                </Anchor>
              </YStack>
            </Reveal>
          </YStack>
        </SizableText>

        {/* ── Quick start (inline, real) ───────────────────────── */}
        <YStack borderTopWidth={1} borderBottomWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6", paddingVertical: "$12" }}>
          <YStack alignSelf="center" maxWidth={1152}>
            <Reveal>
              <Paragraph fontFamily="$mono" fontSize={11} textTransform="uppercase" letterSpacing={3.2} color="$color11">
                Quick start
              </Paragraph>
              <H2 marginTop="$3" fontSize="$10" fontWeight="500" letterSpacing={-0.4} $md={{ fontSize: "$11" }}>
                From a sentence to a live app.
              </H2>
              <Paragraph marginTop="$3" maxWidth={576} fontSize="$4" color="$color11">
                Three steps, no setup. This is the whole loop.
              </Paragraph>
            </Reveal>

            <YStack marginTop="$7" gap="$4.5">
              {steps.map((s, i) => (
                <Reveal key={s.n} delay={i * 80}>
                  <YStack height="100%" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" padding="$5">
                    <SizableText fontFamily="$mono" fontSize="$3" color="$color11">{s.n}</SizableText>
                    <H3 marginTop="$4" fontSize="$6" fontWeight="500" color="$color">
                      {s.title}
                    </H3>
                    <Paragraph marginTop="$2" fontSize="$3" lineHeight={1.625} color="$color11">
                      {s.body}
                    </Paragraph>
                  </YStack>
                </Reveal>
              ))}
            </YStack>
          </YStack>
        </YStack>

        {/* ── Explore ──────────────────────────────────────────── */}
        <YStack paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6", paddingVertical: "$12" }}>
          <YStack alignSelf="center" maxWidth={1152}>
            <Reveal>
              <Paragraph fontFamily="$mono" fontSize={11} textTransform="uppercase" letterSpacing={3.2} color="$color11">
                Explore
              </Paragraph>
              <H2 marginTop="$3" fontSize="$10" fontWeight="500" letterSpacing={-0.4} $md={{ fontSize: "$11" }}>
                Where to go next.
              </H2>
            </Reveal>

            <YStack marginTop="$7" gap="$4.5">
              {destinations.map((d, i) => {
                const inner = (
                  <YStack group height="100%" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" padding="$5" hoverStyle={{ borderColor: "$color", backgroundColor: "$color3" }}>
                    <XStack alignItems="center" justifyContent="space-between">
                      <SizableText height="$7" width="$7" alignItems="center" justifyContent="center" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" color="$color">
                        {d.icon}
                      </SizableText>
                      {d.external ? (
                        <ArrowUpRight size={16} color="$color11" />
                      ) : (
                        <ArrowRight size={16} color="$color11" />
                      )}
                    </XStack>
                    <H3 marginTop="$4.5" fontSize="$4" fontWeight="500" color="$color">
                      {d.title}
                    </H3>
                    <Paragraph marginTop="$2" flex={1} fontSize="$3" lineHeight={1.625} color="$color11">
                      {d.description}
                    </Paragraph>
                    <SizableText marginTop="$4" fontSize="$3" fontWeight="500" color="$color" $group-hover={{ color: "$color" }}>
                      {d.cta} →
                    </SizableText>
                  </YStack>
                );
                return (
                  <Reveal key={d.title} delay={i * 60}>
                    {d.external ? (
                      <a href={d.href} target="_blank" rel="noopener noreferrer">
                        {inner}
                      </a>
                    ) : (
                      <Link href={d.href}>{inner}</Link>
                    )}
                  </Reveal>
                );
              })}
            </YStack>
          </YStack>
        </YStack>

        {/* ── API ──────────────────────────────────────────────── */}
        <YStack borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6", paddingVertical: "$12" }}>
          <YStack alignSelf="center" maxWidth={1152} alignItems="center" gap="$8" $lg={{ gap: "$10" }} className="[&>*]:min-w-0">
            <Reveal>
              <Paragraph fontFamily="$mono" fontSize={11} textTransform="uppercase" letterSpacing={3.2} color="$color11">
                API
              </Paragraph>
              <H2 marginTop="$3" fontSize="$10" fontWeight="500" letterSpacing={-0.4} $md={{ fontSize: "$11" }}>
                One endpoint. 400+ models.
              </H2>
              <Paragraph marginTop="$4" maxWidth={448} fontSize="$4" color="$color11">
                Every app you build can call any frontier model — Hanzo&apos;s own
                Zen and Enso families included — through a single OpenAI-compatible
                endpoint. Swap models with one string.
              </Paragraph>
              <Anchor
                href="https://hanzo.ai/llm"
                target="_blank"
                rel="noopener noreferrer"
                marginTop="$5" alignItems="center" gap="$1.5" fontSize="$3" fontWeight="500" color="$color11" hoverStyle={{ color: "$color" }}
              >
                Explore the gateway
                <ArrowUpRight size={16} />
              </Anchor>
            </Reveal>

            <Reveal delay={100} className="rounded-2xl border border-border bg-card p-5">
              <XStack marginBottom="$4" alignItems="center" gap="$1.5">
                <SizableText height="$2.5" width="$2.5" borderRadius="$10" backgroundColor="$color" />
                <SizableText height="$2.5" width="$2.5" borderRadius="$10" backgroundColor="$color" />
                <SizableText height="$2.5" width="$2.5" borderRadius="$10" backgroundColor="$color" />
              </XStack>
              <SizableText fontFamily="$mono" fontSize={12} lineHeight={1.625} color="$color" overflow="scroll" whiteSpace="pre">
{`POST https://api.hanzo.ai/v1/chat/completions
Authorization: Bearer $HANZO_KEY

{
  "model": "zen-omni",
  "messages": [{ "role": "user", "content": "…" }],
  "stream": true
}`}
              </SizableText>
            </Reveal>
          </YStack>
        </YStack>

        {/* ── Help CTA ─────────────────────────────────────────── */}
        <SizableText borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$11" textAlign="center" display="flex" flexDirection="column" $md={{ paddingHorizontal: "$6", paddingVertical: "$12" }}>
          <Reveal className="mx-auto max-w-2xl">
            <H2 fontSize="$10" fontWeight="500" letterSpacing={-0.4} $md={{ fontSize: "$11" }}>
              Still stuck?
            </H2>
            <Paragraph alignSelf="center" marginTop="$4" maxWidth={448} fontSize="$4" color="$color11">
              Check the FAQ for quick answers, or reach the team directly.
            </Paragraph>
            <YStack marginTop="$6" alignItems="center" justifyContent="center" gap="$3" $sm={{ flexDirection: "row" }}>
              <Link
                href="/faq"
              ><SizableText alignItems="center" gap="$2" borderRadius="$10" backgroundColor="$color12" paddingHorizontal="$5" paddingVertical="$3" fontSize="$3" fontWeight="500" color="$background" hoverStyle={{ backgroundColor: "$color12" }}>
                Read the FAQ
                <ArrowRight size={16} />
              </SizableText></Link>
              <Link
                href="/help"
              ><SizableText alignItems="center" gap="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$5" paddingVertical="$3" fontSize="$3" fontWeight="500" color="$color" hoverStyle={{ borderColor: "$color", backgroundColor: "$color3" }}>
                Get help
              </SizableText></Link>
            </YStack>
          </Reveal>
        </SizableText>
      </main>

      <SiteFooter />
    </SizableText>
  );
}
