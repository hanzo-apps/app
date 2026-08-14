'use client';

import { YStack, Paragraph, H2, XStack, SizableText, H3 } from '@hanzo/ui';
// `Anchor` is not on @hanzo/ui's barrel yet — the dts build drops it, the
// same way it drops the GuiElement type. Tracked; everything else in this
// file comes from @hanzo/ui.
import { Anchor } from '@hanzo/gui';
// Hanzo's own models — the flagship Enso (proprietary) and the open Zen family.
// Complements ModelsStrip (the gateway / 400+ story); this section is
// specifically about the models Hanzo builds. Real product links only:
// hanzo.ai/enso (Enso overview) and hanzo.ai/zen (OSS family). There is no
// published Enso technical report yet, so the CTA says "Learn more", not "report".

import { Orbit, Boxes } from "lucide-react";
import Reveal from "./reveal";

export default function HanzoModels() {
  return (
    <YStack position="relative" borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6", paddingVertical: "$10" }}>
      <YStack alignSelf="center" maxWidth={1152}>
        <Reveal alignSelf="center" width="100%" maxWidth={672}>
          <Paragraph fontFamily="$mono" fontSize={11} color="$color11" textAlign="center">
            Hanzo models
          </Paragraph>
          <H2 marginTop="$4" fontSize="$10" fontWeight="500" letterSpacing={-0.4} textAlign="center" $md={{ fontSize: "2.75rem", lineHeight: "1.1" }}>
            We build the models too.
          </H2>
          <Paragraph marginTop="$4" fontSize="$4" color="$color11" textAlign="center" $md={{ fontSize: "$6" }} lineHeight="1.5">
            Enso is our frontier model. Zen is our open family — open weights
            you can download, fine-tune and run on your own machines.
          </Paragraph>
        </Reveal>

        <YStack marginTop="$9" gap="$4">
          {/* Enso — proprietary flagship */}
          <Reveal height="100%">
            <Anchor
              href="https://hanzo.ai/enso"
              target="_blank"
              rel="noopener noreferrer"
              group position="relative" height="100%" flexDirection="column" borderRadius="$8" borderWidth={1} borderColor="$color02" backgroundColor="$color2" padding={28} hoverStyle={{ borderColor: "$color06" }}
             display="flex" textDecorationLine="none">
              <XStack alignItems="center" justifyContent="space-between">
                <XStack height={44} width={44} alignItems="center" justifyContent="center" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3">
                  <Orbit size={20} strokeWidth={1.5} />
                </XStack>
                <SizableText borderRadius="$10" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$2.5" paddingVertical="$0.5" fontFamily="$mono" fontSize={10} color="$color11">
                  Proprietary
                </SizableText>
              </XStack>
              <H3 marginTop="$4.5" fontSize="$7" fontWeight="500" letterSpacing={-0.4} color="$color">
                Enso
              </H3>
              <Paragraph marginTop="$2" flex={1} fontSize="$3" lineHeight="1.625" color="$color11">
                Our frontier model, and an agentic orchestrator with a routing
                model you can train. It leads several public benchmarks. It
                sends each request to the cheapest model that can do it well, so
                a busy app stops costing frontier prices.
              </Paragraph>
              <SizableText marginTop="$5" fontSize="$3" fontWeight="500" color="$color" $group-hover={{ color: "$color" }}>
                Learn more about Enso <span aria-hidden>→</span>
              </SizableText>
            </Anchor>
          </Reveal>

          {/* Zen — open-source family */}
          <Reveal delay={80} height="100%">
            <Anchor
              href="https://hanzo.ai/zen"
              target="_blank"
              rel="noopener noreferrer"
              group position="relative" height="100%" flexDirection="column" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" padding={28} hoverStyle={{ borderColor: "$color06" }}
             display="flex" textDecorationLine="none">
              <XStack alignItems="center" justifyContent="space-between">
                <XStack height={44} width={44} alignItems="center" justifyContent="center" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3">
                  <Boxes size={20} strokeWidth={1.5} />
                </XStack>
                <SizableText borderRadius="$10" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$2.5" paddingVertical="$0.5" fontFamily="$mono" fontSize={10} color="$color11">
                  Open source
                </SizableText>
              </XStack>
              <H3 marginTop="$4.5" fontSize="$7" fontWeight="500" letterSpacing={-0.4} color="$color">
                Zen
              </H3>
              <Paragraph marginTop="$2" flex={1} fontSize="$3" lineHeight="1.625" color="$color11">
                Open-weight models you can run, fine-tune and host yourself.
                The same models Hanzo AI serves, yours to download and keep.
              </Paragraph>
              <SizableText marginTop="$5" fontSize="$3" fontWeight="500" color="$color" $group-hover={{ color: "$color" }}>
                Learn more about Zen <span aria-hidden>→</span>
              </SizableText>
            </Anchor>
          </Reveal>
        </YStack>
      </YStack>
    </YStack>
  );
}
