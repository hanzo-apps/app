/**
 * Follow-up edits matched by exact bytes, so a re-indented quote silently did
 * nothing and the builder said "No changes applied — the edit didn't match this
 * page." These cover the degradation, and the boundary that keeps it safe: a
 * relaxed match applies only when it names ONE place.
 */
import { applyEdit } from '@/lib/edit/apply';

const PAGE = `<!DOCTYPE html>
<html>
  <body>
    <h1 class="title">Turn any city into a scavenger hunt</h1>
    <p>Save your favorite places.</p>
  </body>
</html>`;

describe('applyEdit', () => {
  it('applies an exact quote', () => {
    const r = applyEdit(PAGE, '<p>Save your favorite places.</p>', '<p>Save places.</p>');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.how).toBe('exact');
      expect(r.html).toContain('<p>Save places.</p>');
      expect(r.html).not.toContain('favorite');
    }
  });

  it('applies a quote wrapped in the delimiters own newlines', () => {
    // What the format actually hands us: "\n<p>…</p>\n".
    const r = applyEdit(PAGE, '\n<p>Save your favorite places.</p>\n', '\n<p>Save places.</p>\n');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.how).toBe('trimmed');
  });

  it('applies a quote the model RE-INDENTED — the reported failure', () => {
    // Same element, different leading whitespace and a line break moved. Exact
    // matching rejects this; a reader would call it the same text.
    const reindented = '<h1 class="title">\n  Turn any city into a scavenger hunt\n</h1>';
    const r = applyEdit(PAGE, reindented, '<h1 class="title">Turn any city into a quest</h1>');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.how).toBe('whitespace');
      expect(r.html).toContain('into a quest');
      expect(r.html).not.toContain('scavenger hunt');
    }
  });

  it('REFUSES when the relaxed quote could match two places', () => {
    // Editing the wrong half of someone's page is worse than not editing.
    const twice = `<div><span>Buy now</span></div>\n<div><span>Buy  now</span></div>`;
    const r = applyEdit(twice, '<span>Buy now</span>', '<span>Get it</span>');
    // The first is exact, so it wins and stays deterministic…
    expect(r.ok).toBe(true);
    // …but a quote that is exact NOWHERE and loose in TWO places is ambiguous.
    const r2 = applyEdit(twice, '<span>Buy\tnow</span>', '<span>Get it</span>');
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.why).toBe('ambiguous');
  });

  it('reports not-found rather than editing something else', () => {
    const r = applyEdit(PAGE, '<footer>nothing like this</footer>', '<footer>x</footer>');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.why).toBe('not-found');
  });

  it('refuses an empty quote instead of guessing where it goes', () => {
    const r = applyEdit(PAGE, '   \n  ', '<p>new</p>');
    expect(r.ok).toBe(false);
  });

  it('never corrupts the rest of the page', () => {
    const r = applyEdit(PAGE, '<p>Save your favorite places.</p>', '<p>x</p>');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.html.startsWith('<!DOCTYPE html>')).toBe(true);
      expect(r.html.trimEnd().endsWith('</html>')).toBe(true);
    }
  });
});
