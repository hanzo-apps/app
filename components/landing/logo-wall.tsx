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
    <section className="relative border-t border-white/[0.06] px-4 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal as="p" className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
          Backed by Techstars · Built on world-class infrastructure
        </Reveal>

        <div className="mt-10 grid grid-cols-3 items-center gap-x-10 gap-y-8 md:gap-x-14">
          {partners.map((p, i) => (
            <Reveal key={p.alt} delay={i * 40} className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt={p.alt}
                className="h-6 w-auto max-w-full object-contain opacity-45 transition-opacity duration-200 [filter:brightness(0)_invert(1)] hover:opacity-90 md:h-7"
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
