'use client';

import { YStack, Paragraph, H2, Anchor, XStack, SizableText, H3 } from '@hanzo/gui';
// Hanzo's own models — the flagship Enso (proprietary) and the open Zen family.
// Complements ModelsStrip (the gateway / 400+ story); this section is
// specifically about the models Hanzo builds. Real product links only:
// hanzo.ai/enso (Enso overview) and hanzo.ai/zen (OSS family). There is no
// published Enso technical report yet, so the CTA says "Learn more", not "report".

import { Orbit, Boxes } from "lucide-react";
import Reveal from "./reveal";

export default function HanzoModels() {
  return (
    <YStack position="relative" borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$13" }}>
      <YStack alignSelf="center" maxWidth={1152}>
        <Reveal alignSelf="center" width="100%" maxWidth={672}>
          <Paragraph fontFamily="$mono" fontSize={11} color="$color11" textAlign="center">
            Hanzo models
          </Paragraph>
          <H2 marginTop="$4" fontSize="$10" fontWeight="500" letterSpacing={-0.4} textAlign="center" $md={{ color: "2.75rem", lineHeight: 1.1 }}>
            Frontier intelligence, without the frontier bill.
          </H2>
          <Paragraph marginTop="$4" fontSize="$4" color="$color11" textAlign="center" $md={{ fontSize: "$6" }}>
            Two models we build in-house: Enso, our flagship that routes every
            request to the cheapest model that can nail it — and Zen, the
            open-source family you can run anywhere.
          </Paragraph>
        </Reveal>

        <YStack marginTop="$9" gap="$4">
          {/* Enso — proprietary flagship */}
          <Reveal height="100%">
            <Anchor
              href="https://hanzo.ai/enso"
              target="_blank"
              rel="noopener noreferrer"
              group position="relative" height="100%" flexDirection="column" borderRadius="$8" borderWidth={1} borderColor="$color" backgroundColor="$color3" padding={28} hoverStyle={{ borderColor: "$color" }}
            >
              <XStack alignItems="center" justifyContent="space-between">
                <SizableText height={44} width={44} alignItems="center" justifyContent="center" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3">
                  <Orbit size={20} color="$color" strokeWidth={1.5} />
                </SizableText>
                <SizableText borderRadius="$10" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$2.5" paddingVertical="$0.5" fontFamily="$mono" fontSize={10} color="$color11">
                  Proprietary
                </SizableText>
              </XStack>
              <H3 marginTop="$4.5" fontSize="$7" fontWeight="500" letterSpacing={-0.4} color="$color">
                Enso
              </H3>
              <Paragraph marginTop="$2" flex={1} fontSize="$3" lineHeight={1.625} color="$color11">
                Our new frontier model — and an agentic orchestrator with a
                trainable routing model. Point it at your workloads and it drives
                cost down by sending each request to the cheapest model that can
                do it well, so AI doesn&apos;t cost you an arm and a robot leg.
              </Paragraph>
              <SizableText marginTop="$5" alignItems="center" gap="$1.5" fontSize="$3" fontWeight="500" color="$color" $group-hover={{ color: "$color" }}>
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
              group position="relative" height="100%" flexDirection="column" borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" padding={28} hoverStyle={{ borderColor: "$color", backgroundColor: "$color" }}
            >
              <XStack alignItems="center" justifyContent="space-between">
                <SizableText height={44} width={44} alignItems="center" justifyContent="center" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3">
                  <Boxes size={20} color="$color" strokeWidth={1.5} />
                </SizableText>
                <SizableText borderRadius="$10" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$2.5" paddingVertical="$0.5" fontFamily="$mono" fontSize={10} color="$color11">
                  Open source
                </SizableText>
              </XStack>
              <H3 marginTop="$4.5" fontSize="$7" fontWeight="500" letterSpacing={-0.4} color="$color">
                Zen
              </H3>
              <Paragraph marginTop="$2" flex={1} fontSize="$3" lineHeight={1.625} color="$color11">
                The Zen family — open-weight models you can run, fine-tune, and
                self-host anywhere. The same models behind the gateway, yours to
                own with zero lock-in.
              </Paragraph>
              <SizableText marginTop="$5" alignItems="center" gap="$1.5" fontSize="$3" fontWeight="500" color="$color" $group-hover={{ color: "$color" }}>
                Explore Zen <span aria-hidden>→</span>
              </SizableText>
            </Anchor>
          </Reveal>
        </YStack>
      </YStack>
    </YStack>
  );
}
