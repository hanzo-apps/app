"use client";

import { Button } from '@hanzo/ui';
import { YStack, Paragraph, H2, SizableText } from '@hanzo/gui';
// One reusable FAQ block for the marketing/support surfaces. Monochrome,
// keyboard-accessible expand/collapse. DRY: /pricing (billing subset) and /faq
// (full set) both render THIS — no per-page accordion code. Answers are
// ReactNode so they can carry real links.

import { useState, type ReactNode } from "react";
import { Plus, Minus } from "lucide-react";
import Reveal from "@/components/landing/reveal";

export interface QA {
  q: string;
  a: ReactNode;
}

export default function FaqSection({
  items,
  title,
  eyebrow,
  id,
}: {
  items: QA[];
  title?: string;
  eyebrow?: string;
  id?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <YStack id={id} paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6", paddingVertical: "$12" }}>
      <YStack alignSelf="center" maxWidth={768}>
        {(title || eyebrow) && (
          <Reveal marginBottom={40} alignItems="center">
            {eyebrow && (
              <Paragraph fontFamily="$mono" fontSize={11} textTransform="uppercase" letterSpacing={3.2} color="$color11" textAlign="center">
                {eyebrow}
              </Paragraph>
            )}
            {title && (
              <H2 marginTop="$3" fontSize="$10" fontWeight="500" letterSpacing={-0.4} textAlign="center" $md={{ fontSize: "$11" }}>
                {title}
              </H2>
            )}
          </Reveal>
        )}

        <Reveal borderTopWidth={1} borderBottomWidth={1} borderColor="$borderColor">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={i} style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}>
                <Button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  width="100%" alignItems="center" justifyContent="space-between" gap="$4" paddingVertical="$4.5" textAlign="left" hoverStyle={{ color: "$color" }}
                >
                  <SizableText fontSize="$4" fontWeight="500" color="$color" $md={{ fontSize: "$6" }}>
                    {it.q}
                  </SizableText>
                  <SizableText flexShrink={0} color="$color11">
                    {isOpen ? (
                      <Minus size={20} />
                    ) : (
                      <Plus size={20} />
                    )}
                  </SizableText>
                </Button>
                {isOpen && (
                  <SizableText paddingBottom="$5" paddingRight="$6" fontSize="$3" lineHeight={1.625} color="$color11" display="flex" flexDirection="column" $md={{ fontSize: "$4" }}>
                    {it.a}
                  </SizableText>
                )}
              </div>
            );
          })}
        </Reveal>
      </YStack>
    </YStack>
  );
}
