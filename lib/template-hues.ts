// Spectrum order for the template gallery.
//
// `template-hues.json` is measured from the shots themselves by
// `scripts/template-hues.mjs` — see that file for how a picture becomes an
// angle. This module is the one place that decides what the angle MEANS, so the
// landing strip and /templates cannot drift into two different orders.

import measured from "./template-hues.json";

/** Dominant colour of one shot: `hue` in degrees, `sat` as its strength. */
export interface Hue {
  hue: number;
  sat: number;
}

const HUES: Record<string, Hue> = measured;

// Below this the shot has no dominant colour and belongs in the quiet tail — it
// reads as a white or near-black card whatever its angle says. Measured, not
// picked: the shots sort into a run of greyscale mockups under 0.02 and a
// continuous spectrum above it, and at card size the boundary is visible. The
// cards just under it are white pages carrying one small accent (a lone purple
// badge, a green button), which is precisely a page with no dominant colour.
const NEUTRAL = 0.02;

// Where the wheel is cut. Ordering by hue is ordering points on a circle, so
// SOME angle has to be both first and last; this one falls in the gap between
// magenta and pink, which puts the whole purple band at the head and pink at the
// end of the colour run: purple → blue → cyan → green → yellow → orange → red →
// pink. Cutting at violet itself (270°) splits that band — the three most purple
// shots measure 271°, 277° and 296° and would sort LAST, furthest from the
// purple the eye is looking for.
const START = 310;

/** Distance travelled around the wheel from the cut. Neutrals sort past all of it. */
function rank(slug: string | undefined): number {
  const found = tint(slug);
  return found ? (START - found.hue + 360) % 360 : 360;
}

/**
 * The shot's colour, or `null` where there is no dominant one — an unmeasured
 * slug, or one too grey to name. Callers get the same answer the sort used.
 */
export function tint(slug: string | undefined | null): Hue | null {
  const found = slug ? HUES[slug] : undefined;
  return found && found.sat >= NEUTRAL ? found : null;
}

/**
 * Spectrum order, purple first and neutrals last. Stable, so items that share a
 * rank — every neutral, and any exact hue tie — hold their catalog order.
 */
export function bySpectrum<T>(
  items: readonly T[],
  slug: (item: T) => string | undefined,
): T[] {
  return [...items].sort((a, b) => rank(slug(a)) - rank(slug(b)));
}
