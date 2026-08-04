/**
 * A bare SEARCH/REPLACE (no UPDATE_PAGE marker) is the ordinary shape of a
 * single-page follow-up. It landed in a branch that resolved its target as
 * `path === "/" | "/index" | "index"` — and generated pages are `index.html`,
 * so it matched nothing and the edit was dropped: "No changes applied" on a
 * project with exactly one page.
 */

/** The entry-page resolution used by applyEdits' bare-block branch. */
const entryIndex = (pages: { path: string }[]): number => {
  const byName = pages.findIndex((p) => /^\/?(index(\.html?)?)$/i.test(p.path));
  if (byName !== -1) return byName;
  return pages.length === 1 ? 0 : -1;
};

describe('entry page resolution', () => {
  it('finds index.html — the name generated pages actually use', () => {
    expect(entryIndex([{ path: 'index.html' }])).toBe(0);
    expect(entryIndex([{ path: 'quests.html' }, { path: 'index.html' }])).toBe(1);
  });

  it('still accepts the older spellings', () => {
    for (const path of ['index', '/index', '/index.html', 'index.htm', 'INDEX.HTML']) {
      expect(entryIndex([{ path }])).toBe(0);
    }
  });

  it('falls back to the ONLY page when a project has one', () => {
    // A single-page project whose page is named anything at all still has an
    // unambiguous target — refusing to edit it was the bug.
    expect(entryIndex([{ path: 'app.html' }])).toBe(0);
  });

  it('refuses to guess across several pages with no index', () => {
    // Two candidates and no entry page: editing the wrong one is worse than
    // reporting that nothing applied.
    expect(entryIndex([{ path: 'a.html' }, { path: 'b.html' }])).toBe(-1);
  });

  it('does not mistake a page merely CONTAINING index', () => {
    expect(entryIndex([{ path: 'reindex.html' }, { path: 'index-old.html' }])).toBe(-1);
  });
});
