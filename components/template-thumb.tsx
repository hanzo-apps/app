"use client";

// TemplateThumb — a real preview picture when we have one, else an on-brand tile.
//
// Image-first: if the slug has a captured, hand-QC'd shot at
// `public/templates/<slug>.webp` (tracked in TEMPLATE_SHOTS), render it
// (object-cover object-top, lazy-loaded). If that image ever fails to load, or
// the slug has no shot, fall back to the generated tile below.
//
// The tile is a consistent, self-hosted, monochrome placeholder that matches the
// site: a directional grayscale gradient + soft light + fine texture + a category
// icon. Deterministic per slug (no randomness, SSR/hydration-safe), so every card
// is stable and same-category cards still differ. Zero hue by construction —
// variety comes from icon and gradient geometry, never color (the brand rule).
//
// The shots are self-hosted only. We never point at gallery.hanzo.ai/screenshots:
// those were an inconsistent grab-bag (some third-party UI-kit mockups carrying
// another designer's watermark, some raw link-index pages), so only clean,
// visually-verified captures are allowed into TEMPLATE_SHOTS.

import { useState } from "react";
import { TEMPLATE_SHOTS } from "@/lib/template-shots";
import {
  Sparkles,
  LayoutDashboard,
  ShoppingBag,
  Briefcase,
  LayoutTemplate,
  Dumbbell,
  MessagesSquare,
  Smartphone,
  UtensilsCrossed,
  Blocks,
  AppWindow,
  UserRound,
  Aperture,
  Frame,
  GalleryVerticalEnd,
  Camera,
  LayoutGrid,
  Boxes,
  Rocket,
  Building2,
  type LucideIcon,
} from "lucide-react";

// Category → a small set of meaningful icons; the per-slug seed picks one so
// even the many same-category templates (e.g. 26 portfolios) don't repeat.
const ICONS: Record<string, LucideIcon[]> = {
  "folio portfolio": [UserRound, Aperture, Frame, GalleryVerticalEnd, Camera],
  portfolio: [UserRound, Frame, GalleryVerticalEnd, Camera],
  "bento cards": [LayoutGrid, Boxes, Blocks],
  saas: [Rocket, Sparkles, LayoutTemplate],
  "ai/saas": [Sparkles, Rocket],
  dashboard: [LayoutDashboard, Boxes],
  "e-commerce": [ShoppingBag],
  business: [Briefcase, Building2],
  landing: [LayoutTemplate, Rocket],
  fitness: [Dumbbell],
  "social media": [MessagesSquare],
  "mobile app": [Smartphone],
  hospitality: [UtensilsCrossed],
  "component library": [Blocks, Boxes],
  app: [AppWindow],
};
const FALLBACK: LucideIcon[] = [LayoutTemplate, Boxes, Sparkles];

// FNV-1a — stable string → uint32, so the visual is a pure function of the slug.
function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function TemplateThumb({
  name,
  category,
  slug,
  showLabel = false,
  className = "",
}: {
  name: string;
  category?: string;
  slug?: string;
  showLabel?: boolean;
  className?: string;
}) {
  // Real picture first. If the shot 404s at runtime, `broken` flips and we drop
  // through to the generated tile — so a missing/corrupt file never leaves a hole.
  const [broken, setBroken] = useState(false);
  if (slug && TEMPLATE_SHOTS.has(slug) && !broken) {
    return (
      <img
        src={`/templates/${slug}.webp`}
        alt={name || "Template preview"}
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
        className={`h-full w-full object-cover object-top ${className}`}
      />
    );
  }

  const seed = seedOf((slug || name || "template").toString());
  const set = ICONS[(category || "").toLowerCase()] || FALLBACK;
  const Icon = set[seed % set.length];

  const angle = 90 + (seed % 180); // 90..269deg — directional base light
  const hx = 8 + (seed % 46); // soft-light x, 8..53%
  const hy = 6 + ((seed >> 4) % 40); // soft-light y, 6..45%
  const rot = ((seed >> 7) % 17) - 8; // icon tilt, -8..8deg
  const dots = (seed & 1) === 0; // texture: dot-grid vs hairline diagonals

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-neutral-950 ${className}`}
    >
      {/* directional base gradient (grayscale) */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(${angle}deg, rgba(255,255,255,0.07), rgba(255,255,255,0.015) 55%, rgba(255,255,255,0) 100%)`,
        }}
      />
      {/* soft light bloom */}
      <div
        className="absolute h-40 w-40 rounded-full bg-white/[0.07] blur-3xl"
        style={{ left: `${hx}%`, top: `${hy}%`, transform: "translate(-40%,-40%)" }}
      />
      {/* fine texture */}
      <div
        className="absolute inset-0"
        style={
          dots
            ? {
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
                backgroundSize: "15px 15px",
                opacity: 0.6,
              }
            : {
                backgroundImage:
                  "repeating-linear-gradient(135deg, rgba(255,255,255,0.045) 0 1px, transparent 1px 11px)",
                opacity: 0.7,
              }
        }
      />
      {/* category icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon
          className="h-14 w-14 text-white/20"
          strokeWidth={1.1}
          style={{ transform: `rotate(${rot}deg)` }}
        />
      </div>
      {showLabel && category ? (
        <div className="absolute bottom-2.5 left-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
          {category}
        </div>
      ) : null}
      {/* crisp inner hairline */}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.05]" />
    </div>
  );
}
