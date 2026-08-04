/**
 * "Is anything built?" is a question about the PROJECT, not about whichever page
 * is selected. Asking it of one page meant a multi-page site with one untouched
 * page was regenerated from scratch — every turn.
 */
import { isTheSameHtml } from '@/lib/compare-html-diff';
import { defaultHTML } from '@/lib/consts';

/** The check ask-ai uses to choose between editing and regenerating. */
const projectIsEmpty = (pages: { html: string }[], currentHtml: string) =>
  pages.length ? pages.every((p) => isTheSameHtml(p.html)) : isTheSameHtml(currentHtml);

const real = '<!DOCTYPE html><html><body><h1>LuxQuest</h1></body></html>';

describe('projectIsEmpty', () => {
  it('is empty for a brand-new project', () => {
    expect(projectIsEmpty([], defaultHTML)).toBe(true);
    expect(projectIsEmpty([{ html: defaultHTML }], defaultHTML)).toBe(true);
  });

  it('is NOT empty when one page is real and the SELECTED one is not', () => {
    // The reported bug: quests.html is finished, index.html is still the
    // starter, so the old per-page check rebuilt the entire site.
    expect(projectIsEmpty([{ html: defaultHTML }, { html: real }], defaultHTML)).toBe(false);
  });

  it('is not empty for an ordinary built project', () => {
    expect(projectIsEmpty([{ html: real }], real)).toBe(false);
  });

  it('the OLD per-page check is what got this wrong', () => {
    // Control: the same input, judged the old way, says "empty" — which is the
    // answer that triggered a full regeneration.
    const selected = defaultHTML;
    expect(isTheSameHtml(selected)).toBe(true);
    expect(projectIsEmpty([{ html: defaultHTML }, { html: real }], selected)).toBe(false);
  });
});
