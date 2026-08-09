/**
 * The builder prompt teaches decks, and the deck it teaches EXPORTS.
 *
 * "Create a presentation about X" used to produce whatever the base laws
 * implied — a scrolling page ABOUT the topic, which reads fine in the preview
 * and is useless in the meeting the person made it for. The deck law makes the
 * ask produce a real slide deck: one viewport-filling section per slide,
 * keyboard and click navigation, a position counter, and — the part that makes
 * it a DELIVERABLE — print CSS, because File→Print is the export until the
 * sandbox pptx lane lands (#119).
 *
 * These assert the invariant, not the wording: the law exists, navigation is
 * named, printing is named as the export, and no slide framework is loaded —
 * the same self-contained rule every other recommendation follows.
 */
import { FOLLOW_UP_SYSTEM_PROMPT, INITIAL_SYSTEM_PROMPT, SLIDES_LAW } from '@/lib/prompts';

describe('the deck law', () => {
  it('exists, and says slides are not a webpage', () => {
    expect(INITIAL_SYSTEM_PROMPT).toMatch(/PRESENTATIONS ARE SLIDES, NOT A WEBPAGE/);
  });

  it('is ONE constant shared by the initial build AND the follow-up modify', () => {
    // The bug this pins: "create a presentation" built a deck on a fresh
    // project but "turn this into a presentation" as a follow-up did not,
    // because only INITIAL carried the law. Same words must mean the same
    // thing on both paths.
    expect(INITIAL_SYSTEM_PROMPT).toContain(SLIDES_LAW);
    expect(FOLLOW_UP_SYSTEM_PROMPT).toContain(SLIDES_LAW);
  });

  it('names keyboard navigation — a deck you cannot advance is a poster', () => {
    expect(INITIAL_SYSTEM_PROMPT).toMatch(/ArrowRight\/ArrowLeft/);
    expect(INITIAL_SYSTEM_PROMPT).toMatch(/counter/);
  });

  it('names printing as the export', () => {
    expect(INITIAL_SYSTEM_PROMPT).toMatch(/@media print/);
    expect(INITIAL_SYSTEM_PROMPT).toMatch(/page-break-after: always/);
  });

  it('loads no slide framework — plain JavaScript, like every other law here', () => {
    // Mentioning one to prohibit it is fine; loading one is not.
    expect(INITIAL_SYSTEM_PROMPT).not.toMatch(/reveal\.js\/dist|revealjs@|cdn.*reveal/i);
    expect(INITIAL_SYSTEM_PROMPT).toMatch(/no reveal\.js/i);
  });
});
