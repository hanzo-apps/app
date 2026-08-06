import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The most action-oriented control on the marketing page must start something.
 *
 * `@hanzogui/shell`'s registry describes hanzo.app from the OUTSIDE, so its
 * `primaryCTA` href is `U.app` — this site's own root. Everywhere else that is a
 * link TO the builder; here it is a self-link, and "+ New project" reloaded the
 * marketing page. Measured on production HTML before the fix:
 * `<a href="https://hanzo.app" …>+ New project</a>`.
 *
 * The header already overrides `localNav` for exactly this reason. This asserts
 * the CTA is overridden too, and that the target is a LOCAL route — an absolute
 * hanzo.app URL is how the bug looked in the first place.
 */
const header = readFileSync(join(process.cwd(), 'components/layout/header.tsx'), 'utf8');

describe('header primary CTA', () => {
  it('is overridden rather than inherited from the shared registry', () => {
    expect(header).toMatch(/surface=\{\{[^}]*primaryCTA/);
  });

  it('targets a local route, never this site by absolute URL', () => {
    const cta = header.match(/const primaryCTA = \{[^}]*\}/)?.[0] ?? '';
    expect(cta).not.toBe('');

    const href = cta.match(/href:\s*"([^"]*)"/)?.[1];
    expect(href).toBeDefined();
    expect(href!.startsWith('/')).toBe(true);
    expect(href).not.toMatch(/hanzo\.app/);
    // "/" is the self-link this exists to prevent.
    expect(href).not.toBe('/');
  });
});
