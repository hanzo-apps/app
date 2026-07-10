// Map the catalog's granular BuildTargets to the three platform families the UI
// renders (one icon each), preserving canonical order and de-duping. Shared by
// the card and the detail page so both read targets ONE way.

import type { BuildTarget } from '@/data/games-catalog';

export type TargetFamily = 'web' | 'desktop' | 'mobile';

const FAMILY_OF: Record<BuildTarget, TargetFamily> = {
  webgl: 'web',
  windows: 'desktop',
  mac: 'desktop',
  linux: 'desktop',
  android: 'mobile',
  ios: 'mobile',
};

const ORDER: TargetFamily[] = ['web', 'desktop', 'mobile'];

/** Distinct platform families for a target list, in canonical order. */
export function targetFamilies(targets: BuildTarget[]): TargetFamily[] {
  const seen = new Set<TargetFamily>(targets.map((t) => FAMILY_OF[t]));
  return ORDER.filter((f) => seen.has(f));
}
