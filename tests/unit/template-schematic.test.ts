import { readdirSync } from 'node:fs';

import { join } from 'node:path';


import snapshot from '@/lib/gallery-snapshot.json';
import { cellsOf, kindOf, paletteOf } from '@/lib/template-schematic';
import { TEMPLATE_SHOTS, hasTemplateShot } from '@/lib/template-shots';

/**
 * Five gallery slugs used to ship ONE picture between them.
 *
 * `blocks`, `cipher-html`, `jobfinder`, `matrix` and `mosaic` each carried a
 * copy of the same recycled bento UI-kit mockup — same near-black canvas, same
 * "Default / Square / Horizontal / Background" widget in the corner, same grid
 * of "Discover" cards. They survived a de-duplication pass because it compared
 * sha256 of the FILES, and five renders of one kit are five different files.
 * Then `template-hues` measured all five as colourless and `bySpectrum` sorts
 * neutrals last, so they landed side by side at the end of the landing strip.
 *
 * Their files are gone and they are drawn instead. What has to hold now is that
 * they stay visible, stop pretending to be photographs, and look like five
 * different apps.
 */
const RECYCLED = ['blocks', 'cipher-html', 'jobfinder', 'matrix', 'mosaic'];

const SHOT_DIR = join(__dirname, '../../public/templates');
const onDisk = () =>
  readdirSync(SHOT_DIR)
    .filter((f) => f.endsWith('.webp'))
    .map((f) => f.replace(/\.webp$/, ''));

/** Degrees between two angles, the short way round. */
const apart = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

interface Card {
  slug: string;
  kind: string;
  tint: number;
  accent: number;
  light: boolean;
}
const cardOf = (slug: string, category?: string): Card => {
  const p = paletteOf(slug);
  return { slug, kind: kindOf(slug, category), tint: p.hue, accent: p.pop, light: p.light };
};

describe('the recycled bento kit', () => {
  it('has no picture left to show', () => {
    for (const slug of RECYCLED) expect(hasTemplateShot(slug)).toBe(false);
    expect(onDisk().filter((slug) => RECYCLED.includes(slug))).toEqual([]);
  });

  it('stays in the strip and the gallery, which gate on TEMPLATE_SHOTS', () => {
    // Dropping these from the set would answer the honesty question by making
    // five templates disappear from the front page.
    for (const slug of RECYCLED) expect(TEMPLATE_SHOTS.has(slug)).toBe(true);
  });

  it('draws five different apps, not one placeholder five times', () => {
    const cards = RECYCLED.map((slug) => {
      const row = snapshot.templates.find((t) => t.slug === slug);
      return cardOf(slug, row?.category);
    });
    // The three the report named, by the layout their name promises.
    expect(cards.find((c) => c.slug === 'jobfinder')!.kind).toBe('list');
    expect(cards.find((c) => c.slug === 'mosaic')!.kind).toBe('grid');
    expect(cards.find((c) => c.slug === 'matrix')!.kind).toBe('dashboard');

    // A card is read as its layout, its theme and its two hues. Two cards look
    // alike only when they share ALL of those, so every pair must part on one.
    for (const a of cards)
      for (const b of cards) {
        if (a.slug >= b.slug) continue;
        const same =
          a.kind === b.kind &&
          a.light === b.light &&
          apart(a.tint, b.tint) < 12 &&
          apart(a.accent, b.accent) < 12;
        expect(`${a.slug}/${b.slug}: ${same ? 'alike' : 'distinct'}`).toBe(
          `${a.slug}/${b.slug}: distinct`,
        );
      }
  });
});

describe('the shot list and the shot directory', () => {
  it('agree, in both directions', () => {
    // A listed slug with no file renders a broken <img> until onError fires; a
    // file no one listed is dead weight nothing can reach. Neither is visible
    // without looking.
    const listed = [...TEMPLATE_SHOTS].filter(hasTemplateShot).sort();
    expect(listed).toEqual(onDisk().sort());
  });

  it('leaves every previewable slug something to render', () => {
    // Whatever is in the set either has a picture or gets drawn — and drawing
    // needs no data, so the only way to fail is a slug that is in neither.
    for (const slug of TEMPLATE_SHOTS) {
      if (hasTemplateShot(slug)) continue;
      expect(cellsOf(kindOf(slug), slug).length).toBeGreaterThan(4);
    }
  });
});

describe('a drawn card', () => {
  it('is a pure function of the slug', () => {
    // SSR and the browser draw the same card, and a reload does not reshuffle
    // the gallery.
    expect(paletteOf('mosaic')).toEqual(paletteOf('mosaic'));
    expect(cellsOf('grid', 'mosaic')).toEqual(cellsOf('grid', 'mosaic'));
    expect(paletteOf('mosaic')).not.toEqual(paletteOf('matrix'));
  });

  it('takes its layout from the name first, then the shelf', () => {
    // `jobfinder` is filed under Mobile App and `matrix` under Bento Cards, so
    // the category alone would draw neither the jobs list nor the dashboard a
    // reader is looking at the card for.
    expect(kindOf('jobfinder', 'Mobile App')).toBe('list');
    expect(kindOf('matrix', 'Bento Cards')).toBe('dashboard');
    // Nothing in the name, so the shelf decides.
    expect(kindOf('cipher-html', 'Dashboard')).toBe('dashboard');
    expect(kindOf('kalli', 'Portfolio')).toBe('profile');
    // Neither knows: still a real layout rather than a blank frame.
    expect(cellsOf(kindOf('zzz-unknown-slug'), 'zzz-unknown-slug').length).toBeGreaterThan(4);
  });

  it('stays inside its frame', () => {
    // Cells are percentages the renderer writes straight into left/top/width/
    // height, so one that runs past 100 is painted outside the card.
    for (const slug of [...TEMPLATE_SHOTS])
      for (const cell of cellsOf(kindOf(slug), slug)) {
        expect(cell.x).toBeGreaterThanOrEqual(0);
        expect(cell.y).toBeGreaterThanOrEqual(0);
        expect(cell.x + cell.w).toBeLessThanOrEqual(100);
        expect(cell.y + cell.h).toBeLessThanOrEqual(100);
      }
  });

  it('keeps the whole drawn catalog apart', () => {
    // Every gallery row with no picture, which is what /templates renders. One
    // hue was not enough here: hashed uniformly, close pairs are expected
    // rather than unlucky, and this exact check found `cipher-html` and
    // `prism-html` 0.2° apart, both dark, both landing pages. Hashing the page
    // tint and the accent separately is what fixed it.
    const drawn = snapshot.templates
      .filter((t) => !hasTemplateShot(t.slug))
      .map((t) => cardOf(t.slug, t.category));
    expect(drawn.length).toBeGreaterThan(20);

    const alike: string[] = [];
    for (const a of drawn)
      for (const b of drawn) {
        if (a.slug >= b.slug) continue;
        if (a.kind !== b.kind || a.light !== b.light) continue;
        if (apart(a.tint, b.tint) < 12 && apart(a.accent, b.accent) < 12)
          alike.push(`${a.slug}/${b.slug}`);
      }
    expect(alike).toEqual([]);
  });
});
