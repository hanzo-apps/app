


import { read, tagEnd } from '../source';
import { composer } from '@/components/editor/ask-ai/composer';

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

  // The corner is now a VALUE, and a third thing reads it: your own message in
  // the thread is cut to the composer it was typed in. So the number has to be
  // reachable from TypeScript, and this is the rung that ties it back to the
  // stylesheet the halo reads.
  it('the shared value is that same number', () => {
    expect(composer.corner).toBe(HOST);
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
    // Either spelling counts, and one of them is strictly better: the builder
    // reads both corners off `composer.corner` (components/editor/ask-ai), so
    // its two can no longer disagree even in principle. `/new` still writes the
    // numbers, and until it does not, this reads both.
    const radius = (tag: string) => {
      const raw = /borderRadius=\{([^}]+)\}/.exec(tag)?.[1]?.trim();
      if (raw === 'composer.corner') return String(composer.corner);
      if (raw === 'composer.corner - 1') return String(composer.corner - BAND);
      return raw;
    };
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

  it('a picker row paints nothing at rest and is as tall as its own text', () => {
    // Three props, and every one of them can be dropped with the whole suite
    // still green. `variant="ghost"` and `borderWidth={0}` keep the row from
    // stacking an opaque box on the panel's glass; `data-slot="item"` says the
    // row is a list row rather than a control, which is the one thing that
    // stops the control-height rule in assets/globals.css pinning it to 30px
    // whatever its hint says.
    //
    // And no clamp on the hint. `numberOfLines` compiles to
    // `-webkit-line-clamp`, which drops the tail of the longest sentence with
    // nothing on screen a reader would take for truncation — on the microVM row
    // that tail is the one warning it carries. The label keeps its clamp: a
    // name that runs out of room ellipsizes.
    const src = read('components/editor/ask-ai/settings.tsx');
    const at = src.indexOf('function Choice');
    const btn = src.indexOf('<Button', at);
    const tag = src.slice(btn, tagEnd(src, btn) + 1);
    expect(tag).toMatch(/variant="ghost"/);
    expect(tag).toMatch(/borderWidth=\{0\}/);
    expect(tag).toMatch(/data-slot="item"/);
    const body = src.slice(at, src.indexOf('export function Settings'));
    expect(body.slice(body.indexOf('{hint && ('))).not.toMatch(/numberOfLines/);
  });
});
