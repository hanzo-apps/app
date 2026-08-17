/**
 * What a path is called, and which folder it is in.
 *
 * Two pickers in the builder list a project by folder — the header's page
 * switcher and the code pane's file browser — and each carried its own copy of
 * this, `groupPages`/`indexRank` beside `groupFiles`/`fileIndexRank`, identical
 * line for line over two item types. Grouping is a fact about PATHS, not about
 * either surface, so it lives here once.
 *
 * Paths arrive bare (`about.html`) or rooted (`/blog/post.html`); both normalize
 * the same way.
 */

/** The last segment — what a file is CALLED. */
export function basename(path: string): string {
  const norm = path.replace(/^\/+/, '');
  return norm.split('/').pop() || norm;
}

/** The containing folder, `''` at the root. */
export function folder(path: string): string {
  return path.replace(/^\/+/, '').split('/').slice(0, -1).join('/');
}

/** index.html leads its folder; everything else is alphabetical. */
const lead = (name: string): number => (/^index\.html?$/i.test(name) ? 0 : 1);

/**
 * Paths grouped by folder: the root first, then folders alphabetically, and
 * inside each the index page first. Items come back untouched — the caller keeps
 * whatever it was holding.
 */
export function byFolder<T extends { path: string }>(items: T[]): { folder: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = folder(item.path);
    const arr = map.get(key) ?? [];
    arr.push(item);
    map.set(key, arr);
  }
  return Array.from(map.keys())
    .sort((a, b) => (a === b ? 0 : a === '' ? -1 : b === '' ? 1 : a.localeCompare(b)))
    .map((key) => ({
      folder: key,
      items: (map.get(key) ?? []).sort((a, b) => {
        const an = basename(a.path);
        const bn = basename(b.path);
        return lead(an) - lead(bn) || an.localeCompare(bn);
      }),
    }));
}
