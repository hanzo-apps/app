/**
 * The API quickstart — the one panel, and the two things it must never get wrong.
 *
 * HONESTY. The endpoint and the model are claims about a live service. `enso` is
 * a real routable id (`GET api.hanzo.ai/v1/models` returns it as
 * `owned_by: "hanzo"`); `zen5` is real too, but Zen is Zoo Labs Foundation's
 * family — `zen-is-zoos-not-hanzos.test.ts` states that rule for the provider
 * row, and this states it for the code sample, which is where it shipped wrong.
 * The old snippet also spelled the key `$HANZO_KEY`, a variable that appears
 * nowhere else in the repo, so it could not have run as written.
 *
 * DRYNESS. The panel exists because the same six lines were inlined in two
 * files. A test that only rendered the component would pass just as happily
 * with the copies still sitting there, so the last case reads the consumers.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';

import { join } from 'node:path';


import { Quickstart, ENDPOINT, MODEL, scan } from '@/components/quickstart';

import { WithGui } from '../gui-wrapper';

const ROOT = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

const LANGUAGES = ['curl', 'TypeScript', 'Python', 'Go'];

const panel = () => render(<WithGui><Quickstart /></WithGui>);

describe('what it says', () => {
  it('posts to the live gateway', () => {
    expect(ENDPOINT).toBe('https://api.hanzo.ai/v1/chat/completions');
  });

  it('calls Enso, the model Hanzo makes', () => {
    expect(MODEL).toBe('enso');
  });

  it('shows no Zen model — that family is Zoo Labs Foundation\'s', () => {
    // What a visitor READS, not what the file says: the prose above `SAMPLES`
    // names zen5 to record why it left, and that is history, not a claim.
    const { container } = panel();
    expect(container.textContent).not.toMatch(/\bzen\d/i);
  });

  it('reads the key from the variable the rest of the repo uses', () => {
    const { container } = panel();
    expect(container.textContent).toContain('HANZO_API_KEY');
    expect(container.textContent).not.toContain('$HANZO_KEY');
  });
});

describe('the tabs', () => {
  it('offers every client', () => {
    panel();
    for (const name of LANGUAGES) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument();
    }
  });

  it('opens on curl', () => {
    panel();
    expect(screen.getByRole('tab', { name: 'curl' })).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to another language', () => {
    panel();
    fireEvent.click(screen.getByRole('tab', { name: 'Python' }));

    expect(screen.getByRole('tab', { name: 'Python' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'curl' })).toHaveAttribute('aria-selected', 'false');
    // The Python sample, and nothing curl-shaped.
    expect(screen.getByText(/from openai import OpenAI/)).toBeInTheDocument();
  });

  it.each(LANGUAGES)('makes the same call under %s', (name) => {
    // Four clients that disagreed about the model or the host would be four
    // samples instead of one request — the exact drift this component replaces.
    // gui mounts only the open pane, so each language has to be opened to be
    // read; a single render would only ever prove this about curl.
    const { container } = panel();
    fireEvent.click(screen.getByRole('tab', { name }));

    const shown = container.textContent ?? '';
    expect(shown).toContain('api.hanzo.ai/v1');
    expect(shown).toContain(MODEL);
    expect(shown).toContain('HANZO_API_KEY');
  });

  it('gives every tab a thumb to land on', () => {
    // The floor rule in globals.css names `button`, `[role="button"]` and
    // `a[href]`; @hanzo/ui renders a tab as a `div[role="tab"]`, which is none
    // of them. Measured on a phone before this marker: 30px painted, 38px
    // reachable, against a 44px floor — and after it, 44 on all four, with
    // desktop still 30 because the rule is `(pointer: coarse)`.
    panel();
    for (const name of LANGUAGES) {
      expect(screen.getByRole('tab', { name })).toHaveClass('hz-tap');
    }
  });

  it('states the whole endpoint above every one of them', () => {
    // The TypeScript and Python clients take a baseURL and append the path
    // themselves, so `/chat/completions` is implicit in two of the four samples.
    // The chrome says it outright, and says it whichever tab is open — which is
    // why the request line is chrome and not part of a sample.
    const { container } = panel();
    for (const name of LANGUAGES) {
      fireEvent.click(screen.getByRole('tab', { name }));
      expect(container.textContent).toContain('POST');
      expect(container.textContent).toContain(ENDPOINT.replace('https://', ''));
    }
  });
});

describe('the mark', () => {
  /**
   * The mark's own <svg>. Scoped by the ring inside it, because the lucide copy
   * glyph in the tab bar carries the same 24-unit viewBox — a selector that only
   * said `svg` found that one first and reported on the wrong picture.
   */
  const mark = (root: HTMLElement) => root.querySelector('circle')?.closest('svg') ?? null;

  it('wears the Enso ring, drawn inline', () => {
    // ModelIcon is the one path to @hanzo/logo's ENSO_MARK, and it draws the
    // glyph rather than fetching it — so there is no broken-image state and no
    // network request on a marketing page.
    const { container } = panel();
    expect(mark(container)).toBeTruthy();
    expect(mark(container)?.getAttribute('viewBox')).toBe('0 0 24 24');
  });

  it('is the CLOSED ring — the open one is Zen\'s', () => {
    // Enso and Zen are the same brush stroke, and the gap is the whole
    // difference between Hanzo's house mark and Zoo Labs Foundation's. An open
    // ring is drawn by cutting the stroke (a dash pattern) or by an arc path;
    // a closed one is an unbroken stroked circle, and that is all this <svg> holds.
    const { container } = panel();
    const svg = mark(container);
    const ring = svg?.querySelector('circle');

    expect(ring?.getAttribute('stroke')).toBe('currentColor');
    expect(ring?.getAttribute('fill')).toBe('none');
    expect(ring?.getAttribute('stroke-dasharray')).toBeNull();
    expect(svg?.querySelector('path')).toBeNull();
  });
});

describe('the highlight', () => {
  it('has no hue in it', () => {
    // This product's accent is the brightest neutral; a colour here would be the
    // only one on the page. Every ink is a gui greyscale variable or a weight.
    const source = read('components/quickstart.tsx');
    const inks = source.slice(source.indexOf('const INK'), source.indexOf('const PUNCT'));
    expect(inks).not.toMatch(/#[0-9a-f]{3,8}\b|rgb|hsl|oklch/i);
    expect(inks).toMatch(/var\(--color\d*\)/);
  });

  it('keeps a URL whole instead of cutting it at its own punctuation', () => {
    const runs = scan(`fetch("${ENDPOINT}")`, '//');
    expect(runs.some(([, text]) => text.includes(ENDPOINT))).toBe(true);
  });

  it('tells a key from the value beside it', () => {
    const runs = scan('{ "model": "enso" }', '//');
    expect(runs).toContainEqual(['key', '"model"']);
    expect(runs).toContainEqual(['value', '"enso"']);
  });

  it('does not read Go\'s := as a key', () => {
    // `payload` merges with the space after it — adjacent runs of one kind are
    // one run — so the assertion is about the KIND that carries the name.
    const runs = scan('payload := body', '//');
    expect(runs.find(([, text]) => text.startsWith('payload'))?.[0]).toBe('plain');
    expect(runs.some(([kind]) => kind === 'key')).toBe(false);
  });

  it('loses not one character of the source', () => {
    // A tokenizer that drops a byte silently corrupts a sample nobody re-reads.
    for (const note of ['#', '//'] as const) {
      const code = read('components/quickstart.tsx').slice(0, 4000);
      expect(scan(code, note).map(([, t]) => t).join('')).toBe(code);
    }
  });
});

describe('there is one copy of the request', () => {
  const consumers = ['components/landing/models-strip.tsx', 'app/docs/page.tsx'];

  it.each(consumers)('%s renders the panel', (file) => {
    expect(read(file)).toMatch(/<Quickstart\s*\/>/);
  });

  it.each(consumers)('%s inlines no request of its own', (file) => {
    const source = read(file);
    expect(source).not.toContain('chat/completions');
    expect(source).not.toContain('Bearer');
    expect(source).not.toMatch(/"model":/);
  });
});
