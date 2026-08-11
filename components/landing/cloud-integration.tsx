'use client';

import { YStack, Paragraph, H2, XStack, SizableText, H3 } from '@hanzo/ui';
// `Anchor` is not on @hanzo/ui's barrel yet — the dts build drops it, the
// same way it drops the GuiElement type. Tracked; everything else in this
// file comes from @hanzo/ui.
import { Anchor } from '@hanzo/gui';
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
    <YStack position="relative" borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$10" }}>
      {/* `width="100%"`: centred in its parent, this column was shrink-to-fit
          and `maxWidth` capped a width it never claimed — measured 808px on a
          1152px row, which put the six cards two across instead of three.
          Checked the other four landing columns the same way; they already fill
          theirs from content, so this is the only one that needed it. */}
      <YStack alignSelf="center" width="100%" maxWidth={1152}>
        <Reveal alignSelf="center" width="100%" maxWidth={672}>
          <Paragraph textAlign="center" fontFamily="$mono" fontSize="$1" color="$color11">
            The difference
          </Paragraph>
          <H2 textAlign="center" marginTop="$8" fontSize="$10" fontWeight="500" letterSpacing={-0.4} $md={{ fontSize: "2.75rem", lineHeight: "1.1" }}>
            More than a UI. A full app on Hanzo Cloud.
          </H2>
          <Paragraph textAlign="center" marginTop="$8" fontSize="$4" color="$color11" $md={{ fontSize: "$6" }} lineHeight="1.5">
            Other builders hand you a screenshot. Hanzo ships a running app —
            database, auth, AI, secrets, and storage already connected.
          </Paragraph>
        </Reveal>

        {/* A grid, not a column. These six were a plain `YStack` at every
            width, so at 1440 the section was six full-bleed 1152px cards
            stacked head to toe — 2,209px for six icons, six lines of prose and
            six code rows, and the owner read it as "enormous boxes holding one
            icon + two lines". `.card-grid` is the app's ONE card grid
            (auto-fill/minmax, so the column count follows the width and there
            are no breakpoints to keep in sync); it is what /templates uses. */}
        <div className="card-grid" style={{ marginTop: 36 }}>
          {capabilities.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.name} delay={i * 60} height="100%">
              <Anchor
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                group position="relative" height="100%" flexDirection="column" borderRadius="$8" borderWidth={1} backgroundColor="$color2" {...{ borderColor: c.primary ? "$color02" : "$borderColor" }} padding="$4" hoverStyle={{ borderColor: "$color06" }}
               display="flex" textDecorationLine="none">
                <XStack alignItems="center" justifyContent="space-between">
                  <XStack height="$7" width="$7" alignItems="center" justifyContent="center" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3">
                    <Icon size={20} color="var(--foreground)" strokeWidth={1.5} />
                  </XStack>
                  <SizableText fontFamily="$mono" fontSize="$1" color="$color11">
                    {c.product}
                  </SizableText>
                </XStack>

                <H3 marginTop="$3" fontSize="$6" fontWeight="500" letterSpacing={-0.4} color="$color">
                  {c.name}
                </H3>
                <Paragraph marginTop="$2" flex={1} fontSize="$3" lineHeight="1.625" color="$color11">
                  {c.desc}
                </Paragraph>

                <SizableText marginTop="$3" numberOfLines={1} borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2" fontFamily="$mono" fontSize="$1" color="$color11" $group-hover={{ color: "$color" }}>
                  {c.snippet}
                </SizableText>
              </Anchor>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={120} marginTop={40}>
          <Paragraph fontFamily="$mono" fontSize="$1" color="$color11" textAlign="center">
            The same infrastructure that runs Hanzo, wired into every app you build.
          </Paragraph>
        </Reveal>
      </YStack>
    </YStack>
  );
}
