/**
 * lib/template-demos — the ONE registry of catalog templates with a verified
 * live demo at `<slug>.hanzo.app`. The detail page frames `t.demo`, so a stale
 * entry here puts a broken iframe on a marketing page. These pin the two ways
 * that happens: a slug that isn't in the catalog at all, and a slug that WAS
 * measured serving scaffolding rather than the template.
 */
import { readdirSync } from 'node:fs';

import { join } from 'node:path';

import { demoCount, demoUrl, lifts } from '@/lib/template-demos';
import { TEMPLATES, getTemplate } from '@/lib/templates-catalog';

const withDemo = TEMPLATES.filter((t) => t.demo);

describe('template demos', () => {
  it('registers only real catalog slugs', () => {
    expect(withDemo).toHaveLength(demoCount());
  });

  it('points every demo at its own hanzo.app subdomain', () => {
    for (const t of withDemo) expect(t.demo).toBe(`https://${t.slug}.hanzo.app`);
  });

  it('excludes slugs measured serving scaffolding, not the template', () => {
    // beta/serif -> raw file index ("Page List" / "Index Page"); prism -> link
    // index; savor -> "Application error: a client-side exception has occurred";
    // soar -> vendor purchase splash; metrics -> the Hanzo marketing page.
    for (const slug of ['beta', 'serif', 'prism', 'savor', 'soar', 'metrics']) {
      expect(getTemplate(slug)).toBeDefined();
      expect(demoUrl(slug)).toBeNull();
    }
  });

  it('keeps the demo link for a build that cannot travel', () => {
    // Showing a template and OPENING one ask different things of the same site.
    // These four render their own design at `<slug>.hanzo.app` — so the marketing
    // page must keep framing them — and produce an error screen or an empty root
    // once lifted onto the preview's opaque origin.
    for (const slug of ['kinetic', 'prism-react', 'saas-landing', 'synapse']) {
      expect(demoUrl(slug)).toBe(`https://${slug}.hanzo.app`);
      expect(lifts(slug)).toBe(false);
    }
  });

  it('lets every other verified demo be opened', () => {
    for (const t of withDemo) {
      if (['kinetic', 'prism-react', 'saas-landing', 'synapse'].includes(t.slug)) continue;
      expect(lifts(t.slug)).toBe(true);
    }
  });

  it('never sends Preview to the dead gallery.hanzo.ai path', () => {
    // gallery.hanzo.ai/templates/<slug> 404s for every slug in this catalog.
    for (const t of TEMPLATES) {
      expect(t.previewUrl).not.toContain('gallery.hanzo.ai');
      expect(t.previewUrl).toBe(t.demo ?? t.repo);
    }
  });

  it('falls back to a shot or the generated tile when there is no demo', () => {
    for (const t of TEMPLATES) if (!t.demo) expect(t.demo).toBeNull();
    expect(withDemo.length).toBeLessThan(TEMPLATES.length);
  });

  it('lets [slug] own every catalog slug — no static route shadows a detail page', () => {
    // A folder at app/templates/<slug>/ wins over [slug], so the catalog's
    // detail page silently never renders for that slug. app/templates/
    // saas-landing/ did exactly that: a second in-app copy of a template
    // already served at saas-landing.hanzo.app, hiding its own detail page.
    const routes = readdirSync(join(process.cwd(), 'app/templates'), { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name !== '[slug]')
      .map((e) => e.name);
    expect(routes.filter((r) => getTemplate(r))).toEqual([]);
  });
});
