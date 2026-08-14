'use client';

import { YStack, Paragraph, H2, XStack, SizableText, Image } from '@hanzo/ui';
// `Anchor` is not on @hanzo/ui's barrel yet — the dts build drops it, the
// same way it drops the GuiElement type. Tracked; everything else in this
// file comes from @hanzo/ui.
import { Anchor } from '@hanzo/gui';
// "One API, 400+ models" — the real Hanzo AI. The endpoint shown is real
// (api.hanzo.ai/v1, OpenAI-compatible); the model value is illustrative.

import Reveal from "./reveal";

// Every mark is the provider's OWN, from @hanzoai/icons (packages/static-svg) —
// colour where the brand has one, which is most of them. OpenAI, xAI and Groq
// are monochrome brands: their files are authored `currentColor`, an <img>
// cannot inherit that, and the fallback is black. That is why this row used to
// render as a dozen invisible holes on a black card, and why `mono` is a field
// here rather than a guess at render time — see `.hz-mark-mono` in globals.css.
//
// Zen is Hanzo's own family and leads the list, because it is the one the copy
// above names first and the only one that is ours.
const providers = [
  { name: "Zen",          src: "/logos/providers/zen.svg",         mono: true,  ours: true },
  { name: "OpenAI",       src: "/logos/providers/openai.svg",      mono: true  },
  { name: "Anthropic",    src: "/logos/providers/anthropic.svg"    },
  { name: "Google",       src: "/logos/providers/gemini.svg"       },
  { name: "Meta",         src: "/logos/providers/meta.svg"         },
  { name: "DeepSeek",     src: "/logos/providers/deepseek.svg"     },
  { name: "Qwen",         src: "/logos/providers/qwen.svg"         },
  { name: "Mistral",      src: "/logos/providers/mistral.svg"      },
  { name: "NVIDIA",       src: "/logos/providers/nvidia.svg"       },
  { name: "Moonshot",     src: "/logos/providers/moonshot.svg"     },
  { name: "xAI",          src: "/logos/providers/xai.svg",         mono: true  },
  { name: "Groq",         src: "/logos/providers/groq.svg",        mono: true  },
  { name: "Together",     src: "/logos/providers/together.svg"     },
  { name: "Fireworks",    src: "/logos/providers/fireworks.svg"    },
  { name: "Hugging Face", src: "/logos/providers/huggingface.svg"  },
];

export default function ModelsStrip() {
  return (
    <YStack position="relative" borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$10" }}>
      {/* `width="100%"` or this column is shrink-to-fit inside its centered
          parent, and `maxWidth` alone caps a width it never claims. It measured
          448px on a 1440 row — the old logo strip, twelve marks at fixed pixel
          widths, was the only thing holding it open, so moving them out
          collapsed the card with them. */}
      <YStack alignSelf="center" width="100%" maxWidth={1152} alignItems="center" gap="$8" $lg={{ gap: "$10" }} className="shrink-cells">
        {/* Centred, like the seven other section headings on this page. It was
            the one left-aligned block, and left-aligned text inside a
            shrink-to-fit box that its parent then centres gives a section TWO
            left edges: measured at 1440, this heading began at x=497 while the
            code panel and "Routed providers" under it began at x=145, with 350
            empty pixels beside the headline. On a phone it split the other way
            — copy at the left margin, the link still centred under it. */}
        <Reveal alignSelf="center" width="100%" maxWidth={672}>
          <Paragraph textAlign="center" fontFamily="$mono" fontSize="$1" color="$color11">
            Hanzo AI
          </Paragraph>
          <H2 textAlign="center" marginTop="$4" fontSize="$10" fontWeight="500" letterSpacing={-0.4} $md={{ fontSize: "$11" }} lineHeight="1.1">
            One API. 400+ models.
          </H2>
          <Paragraph textAlign="center" marginTop="$4" fontSize="$4" color="$color11" $md={{ fontSize: "$6" }} lineHeight="1.5">
            Your app calls any frontier model — Hanzo&apos;s own Zen family plus
            Anthropic, OpenAI, Google, Mistral and more — through OpenAI-
            and Anthropic-compatible endpoints. Swap models with one string,
            and connect MCP tool servers the gateway can call mid-completion.
          </Paragraph>

          <Anchor display="inline-flex"
            className="hz-tap"
            href="https://hanzo.ai/llm"
            target="_blank"
            rel="noopener noreferrer"
            alignSelf="center" marginTop="$5" alignItems="center" gap="$1.5" fontSize="$3" fontWeight="500" color="$color11" hoverStyle={{ color: "$color" }}
          >
            Explore the gateway
            <span aria-hidden>→</span>
          </Anchor>
        </Reveal>

        <Reveal delay={100} alignSelf="stretch" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" padding="$5">
          <XStack marginBottom="$4" alignItems="center" gap="$1.5">
            <SizableText height={10} width={10} borderRadius="$10" backgroundColor="$color4" />
            <SizableText height={10} width={10} borderRadius="$10" backgroundColor="$color4" />
            <SizableText height={10} width={10} borderRadius="$10" backgroundColor="$color4" />
          </XStack>
          <SizableText fontFamily="$mono" fontSize="$1" lineHeight="1.625" color="$color" overflow="scroll" whiteSpace="pre">
{`POST https://api.hanzo.ai/v1/chat/completions
Authorization: Bearer $HANZO_KEY

{
  "model": "zen5",
  "messages": [{ "role": "user", "content": "…" }],
  "stream": true
}`}
          </SizableText>
        </Reveal>

        {/* Its own block rather than a hairline inside the card: a mark with a
            name beside it needs room to be read, and buried under the code
            sample it read as a footnote to the request. */}
        {/* `alignSelf="stretch"`, not `width="100%"`: the column sets
            alignItems="center", so a child that does not claim the cross axis is
            shrink-to-fit — this block came out 448px wide and gridded to two
            columns on a 1152px row. Width alone cannot fix that; 100% of a
            shrunk box is still the shrunk box. */}
        <Reveal delay={200} alignSelf="stretch">
          <Paragraph fontFamily="$mono" fontSize="$1" color="$color11" marginBottom="$4">
            Routed providers
          </Paragraph>
          <YStack className="hz-providers">
            {providers.map((p) => (
              <XStack
                key={p.name}
                alignItems="center"
                gap="$3"
                borderWidth={1}
                borderColor={p.ours ? "$color6" : "$borderColor"}
                backgroundColor={p.ours ? "$color3" : "$color2"}
                borderRadius="$4"
                paddingHorizontal="$3.5"
                paddingVertical="$3"
                hoverStyle={{ borderColor: "$color6", backgroundColor: "$color3" }}
              >
                <Image
                  src={p.src}
                  alt=""
                  aria-hidden
                  className={p.mono ? "hz-mark-mono" : undefined}
                  height={22}
                  width={22}
                  objectFit="contain"
                  flexShrink={0}
                />
                <SizableText fontSize="$3" color="$color" numberOfLines={1}>
                  {p.name}
                </SizableText>
              </XStack>
            ))}
          </YStack>
        </Reveal>
      </YStack>
    </YStack>
  );
}
