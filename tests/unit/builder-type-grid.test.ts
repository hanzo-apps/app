import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The builder's type grid: three rungs, and nothing off them.
//
// It had drifted to four sizes doing ONE job — 14 in the preview and the
// transcript, 15 in builds, 17 in my-builds, and a bare `fontSize={16}` in the
// composer's own input, which is not a rung at all (gui steps 15 -> 17). Nobody
// chose that; each surface picked a body size on its own, and the result reads
// as four slightly different products stitched together.
//
// The literal is the one worth a test on its own. gui applies sizes INLINE from
// a JS table, so `fontSize={16}` outranks every stylesheet and no CSS knob can
// reach it — a `--type-scale` retune moves every rung EXCEPT that one, which
// silently drifts further off the grid the moment anybody uses the knob.
const SURFACES = [
  'components/build-composer/index.tsx',
  'components/preview/live-preview.tsx',
  'components/preview/multipage-preview.tsx',
  'components/builds/build-transcript.tsx',
  'components/builds/my-builds.tsx',
  'app/builds/view.tsx',
  'app/dev/page.tsx',
];

/** gui's ramp. $4/$5 and $8/$9 are duplicate rungs — steps with no step. */
const RUNG_PX: Record<string, number> = {
  '1': 11, '2': 13, '3': 14, '4': 15, '5': 15, '6': 17,
  '7': 21, '8': 26, '9': 26, '10': 32, '11': 40,
};

/** small · body · heading. A dev tool needs three, not seven. */
const ALLOWED = new Set([11, 14, 26]);

const read = (f: string) => readFileSync(join(process.cwd(), f), 'utf8');
const sizes = (src: string) => [...src.matchAll(/fontSize=\{?["']?\$?([0-9.]+)["']?\}?/g)];

describe('the builder type grid', () => {
  it('renders only small, body and heading — no fourth size', () => {
    const found = new Map<number, string[]>();
    for (const f of SURFACES) {
      for (const m of sizes(read(f))) {
        const px = m[0].includes('$') ? RUNG_PX[m[1]] : Number(m[1]);
        if (px === undefined) continue;
        found.set(px, [...(found.get(px) ?? []), f]);
      }
    }
    const strays = [...found.keys()].filter((px) => !ALLOWED.has(px));
    expect(strays, `sizes off the grid: ${strays.join(', ')}px`).toEqual([]);
  });

  it('never sizes text with a bare number', () => {
    // A literal cannot be retuned by --type-scale and cannot be overridden by
    // CSS, because gui writes sizes inline. It is a permanent exception.
    for (const f of SURFACES) {
      const literals = sizes(read(f)).filter((m) => !m[0].includes('$'));
      expect(literals.map((m) => m[0]), `${f} sizes text with a raw number`).toEqual([]);
    }
  });

  it('does not grow the headline on small screens', () => {
    // `$sm` is a max-width query, so a fontSize inside it applies to the SMALLER
    // screen. The composer headline stepped 32 -> 40 there: biggest type on the
    // narrowest viewport, which is backwards and was the loudest thing on the page.
    const src = read('components/build-composer/index.tsx');
    for (const m of src.matchAll(/\$sm=\{\{([^}]*)\}\}/g)) {
      expect(m[1], 'a $sm block must not carry a fontSize').not.toMatch(/fontSize/);
    }
  });
});
