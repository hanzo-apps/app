/**
 * "Every button works" has to be checkable, not just requested.
 *
 * The prompt asks for it; a model can still emit a nav pointing at a page it
 * never wrote. This reads what the build produced, so it is never a guess about
 * intent — the target exists or it does not — and it is what stops the user
 * discovering a dead link by clicking it.
 */
import { deadLinks } from '@/lib/pages/links';
import type { Page } from '@/types';

const page = (path: string, html: string): Page => ({ path, html } as Page);

describe('deadLinks', () => {
  it('accepts a nav whose targets all exist', () => {
    const pages = [
      page('index.html', '<a href="quests.html">Quests</a><a href="./index.html">Home</a>'),
      page('quests.html', '<a href="index.html">Home</a>'),
    ];
    expect(deadLinks(pages)).toEqual([]);
  });

  it('flags a nav item pointing at a page that was never written', () => {
    const pages = [page('index.html', '<a href="prizes.html">Prizes</a>')];
    const dead = deadLinks(pages);
    expect(dead).toHaveLength(1);
    expect(dead[0]).toMatchObject({ from: 'index.html', href: 'prizes.html', reason: 'no such page' });
  });

  it('flags href="#" — the shape of a button that was never wired', () => {
    const dead = deadLinks([page('index.html', '<a href="#">Start a quest</a>')]);
    expect(dead).toHaveLength(1);
    expect(dead[0].reason).toBe('no such anchor');
  });

  it('resolves same-page anchors against real ids', () => {
    const ok = deadLinks([page('index.html', '<a href="#how">How</a><section id="how"></section>')]);
    expect(ok).toEqual([]);
    const bad = deadLinks([page('index.html', '<a href="#how">How</a>')]);
    expect(bad).toHaveLength(1);
  });

  it('checks a cross-page anchor against the page it points INTO', () => {
    const pages = [
      page('index.html', '<a href="quests.html#featured">Featured</a>'),
      page('quests.html', '<section id="other"></section>'),
    ];
    expect(deadLinks(pages)).toHaveLength(1);

    const fixed = [
      page('index.html', '<a href="quests.html#featured">Featured</a>'),
      page('quests.html', '<section id="featured"></section>'),
    ];
    expect(deadLinks(fixed)).toEqual([]);
  });

  it('says nothing about links that leave the site', () => {
    // Whether these resolve is not knowable here, and a checker that cries wolf
    // gets ignored exactly when it is right.
    const pages = [
      page(
        'index.html',
        '<a href="https://maps.google.com">Maps</a><a href="mailto:a@b.co">Mail</a>' +
          '<a href="tel:+15551234">Call</a><a href="//cdn.example.com/x">CDN</a>',
      ),
    ];
    expect(deadLinks(pages)).toEqual([]);
  });

  it('treats index, /index.html and ./index.html as one page', () => {
    const pages = [
      page('index.html', '<a href="/index.html">A</a><a href="./index.html">B</a><a href="index">C</a>'),
    ];
    expect(deadLinks(pages)).toEqual([]);
  });

  it('ignores a query string when resolving the page', () => {
    const pages = [
      page('index.html', '<a href="quests.html?filter=new">New</a>'),
      page('quests.html', ''),
    ];
    expect(deadLinks(pages)).toEqual([]);
  });
});

describe('qualityReport — one voice, every turn', () => {
  const { qualityReport } = jest.requireActual('@/lib/pages/report');
  const doc = (body: string) =>
    `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width"></head><body>${body}</body></html>`;

  it('says nothing about a clean build', () => {
    expect(qualityReport([page('index.html', doc('<p>ok</p>'))])).toBeNull();
  });

  it('leads with a dead link — the more visible failure', () => {
    const pages = [page('index.html', doc('<a href="gone.html">Go</a><div style="width:1200px"></div>'))];
    expect(qualityReport(pages)).toMatch(/goes nowhere/);
  });

  it('reports a phone problem when the links are fine', () => {
    const pages = [page('index.html', doc('<div style="width:1200px"></div>'))];
    expect(qualityReport(pages)).toMatch(/phone|wider/i);
  });
});
