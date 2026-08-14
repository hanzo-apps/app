'use client';

import { YStack, XStack, Image, Paragraph } from '@hanzo/ui';
// Partner / infrastructure logo wall — REAL assets only, honestly labeled.
// Hanzo AI is Techstars '17 (real backing); the rest are the real cloud +
// silicon partners the platform runs on. No fabricated customers.
//
// Logos are brand-colored SVGs rendered monochrome-white on true-black via a
// CSS filter (brightness(0) invert), so the wall reads as ONE neutral system
// with no per-file editing. Opacity is the neutral treatment; hover lifts to
// full white.

import Reveal from "./reveal";

const partners = [
  { src: "/logos/partners/techstars.svg", alt: "Techstars" },
  { src: "/logos/partners/nvidia.svg", alt: "NVIDIA" },
  { src: "/logos/partners/aws.svg", alt: "Amazon Web Services" },
  { src: "/logos/partners/microsoft.svg", alt: "Microsoft" },
  { src: "/logos/partners/google.svg", alt: "Google" },
  { src: "/logos/partners/digitalocean.svg", alt: "DigitalOcean" },
  { src: "/logos/partners/nebius.svg", alt: "Nebius" },
  { src: "/logos/partners/lux-network.svg", alt: "Lux Network" },
  { src: "/logos/partners/zoo-labs-foundation.svg", alt: "Zoo Labs Foundation" },
];

// One copy of the set. Rendered twice inside the track: the marquee scrolls by
// exactly one copy's width, so the second lands where the first was and the seam
// is invisible. The second copy is decorative — `aria-hidden`, empty alts — so a
// screen reader hears each partner once.
function LogoRow({ dup = false }: { dup?: boolean }) {
  return (
    <XStack className="hz-logo-group" {...(dup ? { "aria-hidden": true } : {})}>
      {partners.map((p) => (
        // eslint-disable-next-line @next/next/no-img-element
        <Image
          key={(dup ? "b-" : "a-") + p.alt}
          src={p.src}
          alt={dup ? "" : p.alt}
          // The media queries are MIN-width, so the phone value is the BASE and
          // $md is the one that switches it back for desktop. Written the other
          // way round — height="$5" with $md={{ height: 22 }} — it read as
          // "small on phones" and did the exact opposite: $5 is 52px, measured
          // live at 390px, which fits barely two marks on screen and clips both.
          filter="brightness(0) invert(1)" height={22} width="auto" objectFit="contain" opacity={0.45} hoverStyle={{ opacity: 0.9 }} flexShrink={0} $md={{ height: "$5" }}
  />
      ))}
    </XStack>
  );
}

export default function LogoWall() {
  return (
    <YStack position="relative" borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$11" $md={{ paddingHorizontal: "$6", paddingVertical: "$10" }}>
      <YStack alignSelf="center" width="100%" maxWidth={1152}>
        <Reveal>
          <Paragraph fontFamily="$mono" fontSize="$1" color="$color11" textAlign="center">
            Backed by Techstars · Built on world-class infrastructure
          </Paragraph>
        </Reveal>

        {/* ONE row, ONE behaviour: the marks AUTO-scroll to the right at every
            width — a seamless marquee of the duplicated set. Nine marks are
            1987px wide and no container here is; a static row therefore just
            clips, and clipping is what shipped from 768 up until it was
            measured. Motion and overflow are CSS's to own (`.hz-logo-*` in
            assets/globals.css); reduced motion stops it and the row falls back
            to a static, swipeable strip. */}
        <YStack marginTop="$7" width="100%" className="hz-logo-marquee">
          <XStack className="hz-logo-track">
            <LogoRow />
            <LogoRow dup />
          </XStack>
        </YStack>
      </YStack>
    </YStack>
  );
}
