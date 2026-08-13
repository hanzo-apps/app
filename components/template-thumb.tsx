"use client";

// TemplateThumb — the real photograph of a template when one exists, and a
// drawn one when it does not.
//
// Image-first: if the slug has a captured, hand-QC'd shot at
// `public/templates/<slug>.webp` (`hasTemplateShot`), render it (object-cover
// object-top, lazy-loaded). If that image ever fails to load, or the slug has
// no shot, fall through to `TemplateSchematic`, which draws a coloured mini
// screen from the slug — so the card is always a picture of an app, never a
// placeholder, and two slugs have to collide in hue AND layout to look alike.
//
// The shots are self-hosted only. We never point at gallery.hanzo.ai/screenshots:
// those were an inconsistent grab-bag (some third-party UI-kit mockups carrying
// another designer's watermark, some raw link-index pages), so only clean,
// visually-verified captures are allowed into the shot list.

import { useState } from "react";
import { Image } from "@hanzo/ui";
import { hasTemplateShot } from "@/lib/template-shots";
import { TemplateSchematic } from "@/components/template-schematic";

export function TemplateThumb({
  name,
  category,
  slug,
  className = "",
}: {
  name: string;
  category?: string;
  slug?: string;
  className?: string;
}) {
  // Real picture first. If the shot 404s at runtime, `broken` flips and we drop
  // through to the drawing — so a missing/corrupt file never leaves a hole.
  const [broken, setBroken] = useState(false);
  if (slug && hasTemplateShot(slug) && !broken) {
    return (
      <Image
        src={`/templates/${slug}.webp`}
        alt={name || "Template preview"}
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
        height="100%" width="100%" objectFit="cover" objectPosition="top" className={`hz-shot ${className}`}
  />
    );
  }

  return (
    <TemplateSchematic
      slug={slug || name || "template"}
      category={category}
      className={`hz-shot ${className}`}
    />
  );
}
