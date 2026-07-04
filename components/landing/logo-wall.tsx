// Partner / infrastructure logo wall — REAL assets only, honestly labeled.
// Hanzo AI is Techstars '17 (real backing); the rest are the real cloud +
// silicon partners the platform runs on. No fabricated customers.
//
// Logos are brand-colored SVGs rendered monochrome-white on true-black via a
// CSS filter (brightness(0) invert), so the wall reads as ONE neutral system
// with no per-file editing. Opacity is the neutral treatment; hover lifts to
// full white.

const partners = [
  { src: "/logos/partners/techstars.svg", alt: "Techstars", w: 132 },
  { src: "/logos/partners/nvidia.svg", alt: "NVIDIA", w: 104 },
  { src: "/logos/partners/aws.svg", alt: "Amazon Web Services", w: 62 },
  { src: "/logos/partners/microsoft.svg", alt: "Microsoft", w: 122 },
  { src: "/logos/partners/google.svg", alt: "Google", w: 96 },
  { src: "/logos/partners/digitalocean.svg", alt: "DigitalOcean", w: 140 },
  { src: "/logos/partners/nebius.svg", alt: "Nebius", w: 104 },
  { src: "/logos/partners/lux-network.svg", alt: "Lux Network", w: 42 },
  { src: "/logos/partners/zoo-labs-foundation.svg", alt: "Zoo Labs Foundation", w: 42 },
];

export default function LogoWall() {
  return (
    <section className="relative border-t border-white/[0.06] px-4 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
          Backed by Techstars · Built on world-class infrastructure
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-8 md:gap-x-14">
          {partners.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.alt}
              src={p.src}
              alt={p.alt}
              style={{ width: p.w }}
              className="h-6 w-auto object-contain opacity-45 transition-opacity duration-200 [filter:brightness(0)_invert(1)] hover:opacity-90 md:h-7"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
