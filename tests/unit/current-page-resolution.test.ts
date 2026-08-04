/**
 * A built project must never be presented as an empty one.
 *
 * `defaultHTML` is the builder's word for "nothing built yet" — ask-ai compares
 * the current page against it (`isTheSameHtml`) to choose between EDITING the
 * project and GENERATING a new one. So resolving a missed path lookup to
 * `defaultHTML` did not merely pick the wrong page: it told the composer the
 * project was empty, and every follow-up rebuilt the whole site from scratch
 * instead of editing it. Reported as "it keeps starting over and over".
 *
 * This pins the resolution ORDER, which is where the truth lives.
 */
import { isTheSameHtml } from '@/lib/compare-html-diff';
import { defaultHTML } from '@/lib/consts';

interface P { path: string; html: string }

/** The resolution used by components/editor (`currentPageData`). */
const resolve = (pages: P[], currentPage: string): P =>
  pages.find((p) => p.path === currentPage) ?? pages[0] ?? { path: 'index.html', html: defaultHTML };

const built: P[] = [
  { path: 'index.html', html: '<!DOCTYPE html><html><body><h1>LuxQuest</h1></body></html>' },
  { path: 'quests.html', html: '<!DOCTYPE html><html><body><h1>Quests</h1></body></html>' },
];

describe('current page resolution', () => {
  it('resolves an exact path', () => {
    expect(resolve(built, 'quests.html').path).toBe('quests.html');
  });

  it('falls back to a REAL page when the path does not match', () => {
    const got = resolve(built, 'renamed-by-a-follow-up.html');
    expect(got.path).toBe('index.html');
    // The point: the composer must not conclude the project is untouched.
    expect(isTheSameHtml(got.html)).toBe(false);
  });

  it('never reports a built project as unbuilt', () => {
    for (const selected of ['', 'missing.html', 'INDEX.HTML', '/index.html']) {
      expect(isTheSameHtml(resolve(built, selected).html)).toBe(false);
    }
  });

  it('still answers the starter document for a genuinely empty project', () => {
    // The one case where "nothing built yet" is accurate.
    expect(isTheSameHtml(resolve([], 'index.html').html)).toBe(true);
  });
});
