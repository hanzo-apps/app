'use client';

import { YStack, Image } from '@hanzo/gui';
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

export default function LogoWall() {
  return (
    <YStack position="relative" borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$10" $md={{ paddingHorizontal: "$6", paddingVertical: "$11" }}>
      <YStack alignSelf="center" maxWidth={1152}>
        <Reveal as="p" className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Backed by Techstars · Built on world-class infrastructure
        </Reveal>

        <YStack marginTop="$7" alignItems="center" columnGap="$7" rowGap="$6" $md={{ columnGap: "$9" }}>
          {partners.map((p, i) => (
            <Reveal key={p.alt} delay={i * 40} className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <Image
                src={p.src}
                alt={p.alt}
                height="$5" width="auto" maxWidth="100%" objectFit="contain" opacity={0.45} hoverStyle={{ opacity: 0.9 }} $md={{ height: 28 }}
  />
            </Reveal>
          ))}
        </YStack>
      </YStack>
    </YStack>
  );
}
