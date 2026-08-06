'use client';

import { YStack, Paragraph, H2, XStack, SizableText, Image } from '@hanzo/ui';
// `Anchor` is not on @hanzo/ui's barrel yet — the dts build drops it, the
// same way it drops the GuiElement type. Tracked; everything else in this
// file comes from @hanzo/ui.
import { Anchor } from '@hanzo/gui';
// "One API, 400+ models" — the real Hanzo AI. Provider logos are the
// actual model providers Hanzo AI routes to (Zen models are Hanzo's own).
// Rendered monochrome-white on true-black via CSS filter. The endpoint shown
// is real (api.hanzo.ai/v1, OpenAI-compatible); the model value is illustrative.

import Reveal from "./reveal";

const providers = [
  { src: "/logos/providers/anthropic.svg", alt: "Anthropic", w: 118 },
  { src: "/logos/providers/openai.svg", alt: "OpenAI", w: 108 },
  { src: "/logos/providers/gemini.svg", alt: "Google Gemini", w: 104 },
  { src: "/logos/providers/mistral.svg", alt: "Mistral AI", w: 108 },
  { src: "/logos/providers/qwen.svg", alt: "Qwen", w: 92 },
  { src: "/logos/providers/deepseek.svg", alt: "DeepSeek", w: 116 },
  { src: "/logos/providers/groq.svg", alt: "Groq", w: 82 },
  { src: "/logos/providers/moonshot.svg", alt: "Moonshot", w: 116 },
  { src: "/logos/providers/xai.svg", alt: "xAI", w: 56 },
  { src: "/logos/providers/together.svg", alt: "Together AI", w: 116 },
  { src: "/logos/providers/huggingface.svg", alt: "Hugging Face", w: 40 },
  { src: "/logos/providers/fireworks.svg", alt: "Fireworks AI", w: 40 },
];

export default function ModelsStrip() {
  return (
    <YStack position="relative" borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6", paddingVertical: "$10" }}>
      <YStack alignSelf="center" maxWidth={1152} alignItems="center" gap="$8" $lg={{ gap: "$10" }} className="shrink-cells">
        <Reveal>
          <Paragraph fontFamily="$mono" fontSize={11} color="$color11">
            Hanzo AI
          </Paragraph>
          <H2 marginTop="$4" fontSize="$10" fontWeight="500" letterSpacing={-0.4} $md={{ fontSize: "$11" }} lineHeight="1.1">
            One API. 400+ models.
          </H2>
          <Paragraph marginTop="$4" maxWidth={448} fontSize="$4" color="$color11" $md={{ fontSize: "$6" }} lineHeight="1.5">
            Your app calls any frontier model — Hanzo&apos;s own Zen family plus
            Anthropic, OpenAI, Google, Mistral and more — through OpenAI-
            and Anthropic-compatible endpoints. Swap models with one string,
            and connect MCP tool servers the gateway can call mid-completion.
          </Paragraph>

          <Anchor display="inline-flex"
            href="https://hanzo.ai/llm"
            target="_blank"
            rel="noopener noreferrer"
            marginTop="$5" alignItems="center" gap="$1.5" fontSize="$3" fontWeight="500" color="$color11" hoverStyle={{ color: "$color" }}
          >
            Explore the gateway
            <span aria-hidden>→</span>
          </Anchor>
        </Reveal>

        <Reveal delay={100} borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" padding="$5">
          <XStack marginBottom="$4" alignItems="center" gap="$1.5">
            <SizableText height={10} width={10} borderRadius="$10" backgroundColor="$color4" />
            <SizableText height={10} width={10} borderRadius="$10" backgroundColor="$color4" />
            <SizableText height={10} width={10} borderRadius="$10" backgroundColor="$color4" />
          </XStack>
          <SizableText fontFamily="$mono" fontSize={12} lineHeight="1.625" color="$color" overflow="scroll" whiteSpace="pre">
{`POST https://api.hanzo.ai/v1/chat/completions
Authorization: Bearer $HANZO_KEY

{
  "model": "zen5",
  "messages": [{ "role": "user", "content": "…" }],
  "stream": true
}`}
          </SizableText>

          <XStack marginTop="$5" flexWrap="wrap" alignItems="center" columnGap="$6" rowGap="$4.5" borderTopWidth={1} borderColor="$borderColor" paddingTop="$5">
            {providers.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <Image
                key={p.alt}
                src={p.src}
                alt={p.alt}
                style={{ width: p.w }}
                height="$4" width="auto" objectFit="contain" opacity={0.4} hoverStyle={{ opacity: 0.8 }} $md={{ height: "$4.5" }}
  />
            ))}
          </XStack>
        </Reveal>
      </YStack>
    </YStack>
  );
}
