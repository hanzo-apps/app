'use client';

import { YStack, Paragraph, H2, Anchor, XStack, SizableText, H3 } from '@hanzo/gui';
// The differentiator — what a generic UI generator can't say.
//
// hanzo.app doesn't just draw a screen; it ships a full app on Hanzo Cloud
// with the platform's real infrastructure wired in. Every capability below
// maps to a live Hanzo product (linked to its page on hanzo.ai). No invented
// features, no fake metrics.

import { Cloud, Database, ShieldCheck, Sparkles, KeyRound, Zap } from "lucide-react";
import Reveal from "./reveal";

interface Capability {
  icon: typeof Cloud;
  name: string;
  product: string;
  href: string;
  desc: string;
  snippet: string;
  primary?: boolean;
}

const capabilities: Capability[] = [
  {
    icon: Cloud,
    name: "Deploy to Hanzo Cloud",
    product: "Cloud",
    href: "https://hanzo.ai/cloud",
    desc: "One click ships your app to a live URL on real infrastructure — no Dockerfile, no pipeline to wire up.",
    snippet: "→ https://your-app.hanzo.app",
    primary: true,
  },
  {
    icon: Database,
    name: "Database, built in",
    product: "Base",
    href: "https://hanzo.ai/base",
    desc: "Every app gets Hanzo Base — an embedded SQLite datastore with realtime queries. Schema generated from your prompt.",
    snippet: "db.from('tasks').select('*')",
  },
  {
    icon: ShieldCheck,
    name: "Auth, built in",
    product: "IAM",
    href: "https://hanzo.ai/iam",
    desc: "Sign-in ships wired to Hanzo IAM — OIDC, sessions, and org-scoped access with zero config.",
    snippet: "import { auth } from '@hanzo/iam'",
  },
  {
    icon: Sparkles,
    name: "AI, built in",
    product: "AI",
    href: "https://hanzo.ai/llm",
    desc: "Call 400+ models — Zen plus Anthropic, OpenAI, Google, Mistral — from your app through one gateway.",
    snippet: "POST api.hanzo.ai/v1/chat/completions",
  },
  {
    icon: KeyRound,
    name: "Secrets & storage",
    product: "KMS · S3",
    href: "https://hanzo.ai/kms",
    desc: "API keys land in Hanzo KMS, never in code. Files and assets go to S3-compatible object storage.",
    snippet: "kms.get('OPENAI_API_KEY')",
  },
  {
    icon: Zap,
    name: "Functions & edge",
    product: "Functions",
    href: "https://hanzo.ai/functions",
    desc: "Server logic runs as serverless functions at the edge — scaled and routed by the platform automatically.",
    snippet: "export const POST = handler(...)",
  },
];

export default function CloudIntegration() {
  return (
    <YStack position="relative" borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$13" }}>
      <YStack alignSelf="center" maxWidth={1152}>
        <Reveal className="mx-auto max-w-2xl text-center">
          <Paragraph fontFamily="$mono" fontSize={11} textTransform="uppercase" letterSpacing={3.2} color="$color11">
            The difference
          </Paragraph>
          <H2 marginTop="$4" fontSize="$10" fontWeight="500" letterSpacing={-0.4} $md={{ color: "2.75rem", lineHeight: 1.1 }}>
            More than a UI. A full app on Hanzo Cloud.
          </H2>
          <Paragraph marginTop="$4" fontSize="$4" color="$color11" $md={{ fontSize: "$6" }}>
            Other builders hand you a screenshot. Hanzo ships a running app —
            database, auth, AI, secrets, and storage already connected.
          </Paragraph>
        </Reveal>

        <YStack marginTop="$9" gap="$4">
          {capabilities.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.name} delay={i * 60} className="h-full">
              <Anchor
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                group position="relative" height="100%" flexDirection="column" borderRadius="$8" borderWidth={1} padding="$5" {...{ borderColor: c.primary ? "$color" : "$borderColor", backgroundColor: c.primary ? "$color3" : "$color3", hoverStyle: c.primary ? {"borderColor":"$color"} : {"borderColor":"$color","backgroundColor":"$color3"} }}
              >
                <XStack alignItems="center" justifyContent="space-between">
                  <SizableText height="$7" width="$7" alignItems="center" justifyContent="center" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3">
                    <Icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
                  </SizableText>
                  <SizableText fontFamily="$mono" fontSize={10} textTransform="uppercase" letterSpacing={2.4} color="$color11">
                    {c.product}
                  </SizableText>
                </XStack>

                <H3 marginTop="$4.5" fontSize="$6" fontWeight="500" letterSpacing={-0.4} color="$color">
                  {c.name}
                </H3>
                <Paragraph marginTop="$2" flex={1} fontSize="$3" lineHeight={1.625} color="$color11">
                  {c.desc}
                </Paragraph>

                <SizableText marginTop="$4.5" numberOfLines={1} borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2" fontFamily="$mono" fontSize={11} color="$color11" $group-hover={{ color: "$color" }}>
                  {c.snippet}
                </SizableText>
              </Anchor>
              </Reveal>
            );
          })}
        </YStack>

        <Reveal as="p" delay={120} className="mt-10 text-center font-mono text-xs text-muted-foreground">
          The same infrastructure that runs Hanzo, wired into every app you build.
        </Reveal>
      </YStack>
    </YStack>
  );
}
