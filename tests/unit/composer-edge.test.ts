import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { tagEnd } from '../source';

// ONE LIT EDGE around the thing you type into.
//
// The composer is a host (`.hz-composer`, which draws a conic ring in its 1px
// padding band) with a glass panel inside it. Both halves can draw an edge, and
// when they do at different radii the two arcs peel apart in the corners and
// read as a ghost outline — measured at x8, the builder's corner carried two.
//
// Neither half of that is visible in a build. The radii are two numbers in two
// files that look fine apart; the second edge is a `box-shadow` composed inside
// `@hanzo/ui`'s `.glass`, so a call site can take `borderWidth` away and still
// paint a hairline. So both are pinned here rather than left to the eye.
const read = (f: string) => readFileSync(join(process.cwd(), f), 'utf8');

/** `--hz-composer-radius`, the one number. The halo (::after) already reads it
 *  as radius + halo, so the host must state the same value to stay concentric. */
const HOST = 24;
/** `--hz-composer-band` — the host's padding IS the ring's width. */
const BAND = 1;

describe('the composer wears one edge', () => {
  it('states the host radius as --hz-composer-radius', () => {
    const css = read('assets/globals.css');
    const m = css.match(/\.hz-composer\s*\{[^}]*--hz-composer-radius:\s*([\d.]+)rem/);
    expect(m && Number(m[1]) * 16).toBe(HOST);
  });

  // BOTH composers, because one spelling per surface is how the drift started:
  // the builder said $8/14 and `/new` said 28/26.5 while the variable said 24,
  // so three numbers described one corner and the halo agreed with none of them.
  it.each([
    'components/editor/ask-ai/index.tsx',
    'components/build-composer/index.tsx',
  ])('%s nests the panel exactly one band inside the host', (file) => {
    // A `$` rung is a different number that happens to look close: `$8` is
    // 12px, SMALLER than the 14 the builder's panel used to ask for, which is
    // how a panel corner came to cross OUTSIDE the ring.
    const src = read(file);
    const at = src.indexOf('className="hz-composer"');
    expect(at).toBeGreaterThan(-1);
    const open = src.lastIndexOf('<YStack', at);
    const host = src.slice(open, tagEnd(src, open) + 1);
    const panelOpen = src.indexOf('<YStack', tagEnd(src, open));
    const panel = src.slice(panelOpen, tagEnd(src, panelOpen) + 1);
    const radius = (tag: string) => /borderRadius=\{(\d+(?:\.\d+)?)\}/.exec(tag)?.[1];
    expect({ file, host: radius(host), panel: radius(panel) })
      .toEqual({ file, host: String(HOST), panel: String(HOST - BAND) });
  });

  it('zeroes the panel’s own lit edge', () => {
    // `.glass` composes `box-shadow: var(--edge-highlight), var(--glass-shadow-N)`.
    // The drop stays — it is what says "above"; only the top lip goes, because
    // the ring is already the edge. Design zeroes the same token in `.light`.
    expect(read('assets/globals.css'))
      .toMatch(/\.hz-composer\s+\.glass\s*\{[^}]*--edge-highlight:\s*none/);
  });
});

describe('a disclosure row is a row', () => {
  it('names a Button variant, because the unnamed one is a box', () => {
    // @hanzo/ui's `default` variant is a quiet control, not a bare one: `$color2`
    // fill and a `$borderColor` hairline. Omitting the prop drew that box around
    // every Plan / Generating / Generated files row, including the live ones the
    // component's own comment says wear no mark at all.
    const src = read('components/editor/ask-ai/chat-thread.tsx');
    const at = src.indexOf('function CollapsibleSection');
    const btn = src.indexOf('<Button', at);
    expect(src.slice(btn, tagEnd(src, btn) + 1)).toMatch(/variant="ghost"/);
  });
});
