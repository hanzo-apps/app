'use client';

import { YStack, Paragraph, H2, XStack, SizableText, Image } from '@hanzo/ui';
// `Anchor` is not on @hanzo/ui's barrel yet — the dts build drops it, the
// same way it drops the GuiElement type. Tracked; everything else in this
// file comes from @hanzo/ui.
import { Anchor } from '@hanzo/gui';
// "One API, 400+ models" — the real Hanzo AI. The request panel is the shared
// `Quickstart`, which /docs renders too: one endpoint, one model id, one copy.

import Reveal from "./reveal";
import { Quickstart } from "@/components/quickstart";

// Every mark is the provider's OWN, from @hanzoai/icons (packages/static-svg) —
// colour where the brand has one, which is most of them. OpenAI, xAI and Groq
// are monochrome brands: their files are authored `currentColor`, an <img>
// cannot inherit that, and the fallback is black. That is why this row used to
// render as a dozen invisible holes on a black card, and why `mono` is a field
// here rather than a guess at render time — see `.hz-mark-mono` in globals.css.
//
// Zen is made by Zoo Labs Foundation, a 501(c)(3) frontier lab at
// zoo.industries, and carries THEIR mark — not Hanzo's. It leads the list
// because it is the family the copy above names first. `href` is Zen's alone:
// a row that credits someone else has to be able to reach them.
const providers = [
  { name: "Zen",          src: "/logos/providers/zoo.svg",         lead: true, by: "Zoo Labs Foundation", href: "https://zoo.industries" },
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
        <Reveal>
          <Paragraph fontFamily="$mono" fontSize="$1" color="$color11">
            Hanzo AI
          </Paragraph>
          <H2 marginTop="$4" fontSize="$10" fontWeight="500" letterSpacing={-0.4} $md={{ fontSize: "$11" }} lineHeight="1.1">
            One API. 400+ models.
          </H2>
          <Paragraph marginTop="$4" maxWidth={448} fontSize="$4" color="$color11" $md={{ fontSize: "$6" }} lineHeight="1.5">
            Your app calls any frontier model — the Zen family from{" "}
            <Anchor
              href="https://zoo.industries"
              target="_blank"
              rel="noopener noreferrer"
              color="$color"
              hoverStyle={{ color: "$color11" }}
            >
              Zoo Labs Foundation
            </Anchor>{" "}
            plus Anthropic, OpenAI, Google, Mistral and more — through OpenAI-
            and Anthropic-compatible endpoints. Swap models with one string,
            and connect MCP tool servers the gateway can call mid-completion.
          </Paragraph>

          <Anchor display="inline-flex"
            className="hz-tap"
            href="https://hanzo.ai/llm"
            target="_blank"
            rel="noopener noreferrer"
            marginTop="$5" alignItems="center" gap="$1.5" fontSize="$3" fontWeight="500" color="$color11" hoverStyle={{ color: "$color" }}
          >
            Explore the gateway
            <span aria-hidden>→</span>
          </Anchor>
        </Reveal>

        <Reveal delay={100} alignSelf="stretch">
          <Quickstart />
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
            {providers.map((p) => {
              // The tile IS the link — `.hz-providers` is a grid, so a wrapping
              // <a> would become the grid item and the tile a block inside it.
              const Tile = p.href ? Anchor : XStack;
              return (
              <Tile
                key={p.name}
                {...(p.href && {
                  href: p.href,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  textDecorationLine: "none",
                  // "Zen" alone does not say where the link goes.
                  "aria-label": `${p.name} — made by ${p.by}`,
                })}
                display="flex"
                alignItems="center"
                gap="$3"
                borderWidth={1}
                borderColor={p.lead ? "$color6" : "$borderColor"}
                backgroundColor={p.lead ? "$color3" : "$color2"}
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
              </Tile>
              );
            })}
          </YStack>
        </Reveal>
      </YStack>
    </YStack>
  );
}
