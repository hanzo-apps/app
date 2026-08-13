"use client";

// Draws what `lib/template-schematic` decided: a tinted canvas, one bloom, and
// the layout's rectangles. Geometry rides the `style` prop because the cells are
// percentages of the frame — the same way this file's neighbours position a
// bloom — while the box itself stays a gui primitive.

import { YStack } from "@hanzo/ui";
import { cellsOf, kindOf, paletteOf, type Tone } from "@/lib/template-schematic";

export function TemplateSchematic({
  slug,
  category,
  className = "",
}: {
  slug: string;
  category?: string;
  className?: string;
}) {
  const palette = paletteOf(slug);
  const fill: Record<Tone, string> = {
    surface: palette.surface,
    line: palette.line,
    ink: palette.ink,
    accent: palette.accent,
    accent2: palette.accent2,
  };

  return (
    <YStack
      position="relative"
      height="100%"
      width="100%"
      overflow="hidden"
      className={className}
      style={{ background: palette.canvas }}
    >
      <YStack
        position="absolute"
        top={0}
        right={0}
        bottom={0}
        left={0}
        style={{
          background: `radial-gradient(120% 88% at ${palette.glowX}% ${palette.glowY}%, ${palette.glow}, transparent 62%)`,
          opacity: palette.light ? 0.26 : 0.4,
        }}
      />
      {cellsOf(kindOf(slug, category), slug).map((cell, i) => (
        <YStack
          key={i}
          position="absolute"
          style={{
            left: `${cell.x}%`,
            top: `${cell.y}%`,
            width: `${cell.w}%`,
            height: `${cell.h}%`,
            background: fill[cell.tone],
            borderRadius: cell.r ?? 2,
            // A card has an edge. Inset rather than a border, which would grow
            // the box and shift the layout off its percentages.
            boxShadow: cell.tone === "surface" ? `inset 0 0 0 1px ${palette.line}` : undefined,
          }}
        />
      ))}
    </YStack>
  );
}
