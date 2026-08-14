'use client';

import { YStack, Paragraph, H2, XStack, SizableText, H3 } from '@hanzo/ui';
// `Anchor` is not on @hanzo/ui's barrel yet — the dts build drops it, the
// same way it drops the GuiElement type. Tracked; everything else in this
// file comes from @hanzo/ui.
import { Anchor } from '@hanzo/gui';
// The two families behind the endpoint: Enso, which Hanzo builds, and Zen, which
// Zoo Labs Foundation builds. Complements ModelsStrip (the gateway / 400+ story);
// this section is the two you get by default, not the two Hanzo builds — only one
// of them is Hanzo's, and the section used to claim both. Real product links only:
// hanzo.ai/enso (Enso overview) and hanzo.ai/zen (OSS family). There is no
// published Enso technical report yet, so the CTA says "Learn more", not "report".
//
// The maker credit links from the intro, not from inside the Zen card: the card
// is itself an <Anchor>, and an anchor cannot nest another one.

import ModelIcon from "../model-icon";
import Reveal from "./reveal";

export default function HanzoModels() {
  return (
    <YStack position="relative" borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$10" }}>
      <YStack alignSelf="center" maxWidth={1152}>
        <Reveal alignSelf="center" width="100%" maxWidth={672}>
          <Paragraph fontFamily="$mono" fontSize="$1" color="$color11" textAlign="center">
            Enso and Zen
          </Paragraph>
          <H2 marginTop="$4" fontSize="$10" fontWeight="500" letterSpacing={-0.4} textAlign="center" $md={{ fontSize: "2.75rem", lineHeight: "1.1" }}>
            Frontier intelligence, without the frontier bill.
          </H2>
          <Paragraph marginTop="$4" fontSize="$4" color="$color11" textAlign="center" $md={{ fontSize: "$6" }} lineHeight="1.5">
            Two families behind one endpoint: Enso, the flagship we build, which
            routes every request to the cheapest model that can nail it — and Zen,
            the open-source family from{" "}
            <Anchor
              href="https://zoo.industries"
              target="_blank"
              rel="noopener noreferrer"
              color="$color"
              hoverStyle={{ color: "$color11" }}
            >
              Zoo Labs Foundation
            </Anchor>{" "}
            that you can run anywhere.
          </Paragraph>
        </Reveal>

        {/* Side by side, not stacked. Two cards in a column left the section
            2,000px tall for two paragraphs, and the pair reads as a comparison —
            which a reader can only make when both are on screen at once.
            `.card-grid` is the app's ONE card grid (cloud-integration and
            /templates use it): auto-fill/minmax, so two columns above ~580px and
            one on a phone, with no breakpoints to keep in sync. `align-items:
            stretch` overrides its `start` for this pair only — with two cards of
            unequal prose, `start` leaves one visibly shorter than the other. */}
        <div className="card-grid" style={{ marginTop: 36, alignItems: "stretch" }}>
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
                  <ModelIcon family="enso" size={20} />
                </XStack>
                <SizableText borderRadius="$10" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$2.5" paddingVertical="$0.5" fontFamily="$mono" fontSize="$1" color="$color11">
                  Proprietary
                </SizableText>
              </XStack>
              <H3 marginTop="$4.5" fontSize="$7" fontWeight="500" letterSpacing={-0.4} color="$color">
                Enso
              </H3>
              <Paragraph marginTop="$2" flex={1} fontSize="$3" lineHeight="1.625" color="$color11">
                Our new frontier model — and an agentic orchestrator with a
                trainable routing model. Point it at your workloads and it drives
                cost down by sending each request to the cheapest model that can
                do it well, so AI doesn&apos;t cost you an arm and a robot leg.
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
                  <ModelIcon family="zen" size={20} />
                </XStack>
                <SizableText borderRadius="$10" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$2.5" paddingVertical="$0.5" fontFamily="$mono" fontSize="$1" color="$color11">
                  Open source
                </SizableText>
              </XStack>
              <H3 marginTop="$4.5" fontSize="$7" fontWeight="500" letterSpacing={-0.4} color="$color">
                Zen
              </H3>
              <Paragraph marginTop="$2" flex={1} fontSize="$3" lineHeight="1.625" color="$color11">
                Made by Zoo Labs Foundation: open-weight models you can run,
                fine-tune, and self-host anywhere. The same models behind the
                gateway, yours to own with zero lock-in.
              </Paragraph>
              <SizableText marginTop="$5" fontSize="$3" fontWeight="500" color="$color" $group-hover={{ color: "$color" }}>
                Explore Zen <span aria-hidden>→</span>
              </SizableText>
            </Anchor>
          </Reveal>
        </div>
      </YStack>
    </YStack>
  );
}
