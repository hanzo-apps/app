/**
 * A card may only offer a build that published.
 *
 * `/download` and `/install` both link artifacts, and both resolve them from
 * `data/releases.json` rather than writing URLs down. That mechanism is only
 * worth anything if nothing routes around it, and routing around it is silent:
 * a hand-written store URL type-checks, renders, and answers 200 from a store's
 * own "not found" page. So this reads the two data files and asserts the shape
 * that cannot be seen by looking at the page.
 *
 * Coordinates are plain strings on purpose (releases.json is data, and a
 * platform that stops publishing should drop one card, not fail the build) —
 * which leaves a typo to be caught here, loudly, instead of by a reader.
 */
import { appCatalog } from '@/data/app-catalog';
import { SURFACES } from '@/data/downloads';
import releases from '@/data/releases.json';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const resolved = new Set<string>();
for (const surface of Object.values(releases as Record<string, { platforms: Record<string, unknown> }>)) {
  for (const url of Object.values(surface.platforms)) resolved.add((url as { url: string }).url);
}

const source = (f: string) => readFileSync(join(process.cwd(), 'data', f), 'utf8');

describe('every offered build is one that published', () => {
  it('resolves every card on /install to a real release asset', () => {
    const installs = appCatalog.filter((a) => a.action === 'install');
    // The catalog drops what did not resolve, so an empty list is the failure
    // mode this would otherwise pass through in silence.
    expect(installs.length).toBeGreaterThan(0);
    for (const app of installs) expect(resolved).toContain(app.url);
  });

  it('resolves every build on /download to a real release asset', () => {
    const builds = SURFACES.flatMap((s) => s.builds ?? []);
    expect(builds.length).toBeGreaterThan(0);
    for (const b of builds) expect(resolved).toContain(b.url);
  });

  it('renders every install the catalog DECLARES', () => {
    // The assertion above inspects only the cards that survived resolution, so
    // a mistyped coordinate drops its card and sails straight through it. The
    // declarations are the population that matters; count those.
    const declared = (source('app-catalog.ts').match(/asset: \[/g) ?? []).length;
    expect(appCatalog.filter((a) => a.action === 'install')).toHaveLength(declared);
  });
});

describe('no URL is written down where one should be resolved', () => {
  const HOSTS = [
    'chrome.google.com',
    'chromewebstore.google.com',
    'addons.mozilla.org',
    'apps.apple.com',
    'marketplace.visualstudio.com',
    'microsoftedge.microsoft.com',
    'open-vsx.org',
    'appsource.microsoft.com',
  ];

  it.each(['app-catalog.ts', 'downloads.ts'])('%s names no third-party store', (file) => {
    const text = source(file);
    for (const host of HOSTS) expect(text).not.toContain(host);
  });

  it.each(['app-catalog.ts', 'downloads.ts'])('%s writes no release asset URL', (file) => {
    // `releases/latest/download/<name>` 404s the day a version renames the file,
    // which is the whole reason the pattern lives in scripts/sync-releases.mjs.
    expect(source(file)).not.toMatch(/releases\/latest\/download/);
  });

  it('names hanzoai/desktop nowhere — the desktop builds come from the extension', () => {
    for (const file of ['app-catalog.ts', 'downloads.ts']) {
      expect(source(file)).not.toContain('hanzoai/desktop');
    }
    expect(releases.desktop.repo).toBe('hanzoai/extension');
  });
});
