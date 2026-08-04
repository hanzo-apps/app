/**
 * The builder prompt may not recommend a library that hides content until JS runs.
 *
 * It used to recommend AOS in prose AND ship it in both example templates the
 * model copies. AOS's stylesheet sets `[data-aos^=fade]` and `[data-aos^=zoom]`
 * to `opacity: 0` and only restores them when an IntersectionObserver adds
 * `.aos-animate` — so in the builder's preview frame, where that observer often
 * never fires, everything below the header renders permanently blank. The user
 * sees a complete nav above an empty gradient and reports it as an ugly design;
 * the page is simply invisible.
 *
 * These assert the invariant, not the wording: no scroll-reveal library is
 * recommended, no example ships one, and the prompt states that content must
 * survive JavaScript never running.
 */
import {
  INITIAL_SYSTEM_PROMPT,
  FOLLOW_UP_SYSTEM_PROMPT,
} from '@/lib/prompts';

/**
 * Ways a prompt LOADS a hide-until-JS library. Naming one in prose is fine and
 * necessary — the prohibition has to say what it prohibits — so this matches the
 * asset and the init call, never the mention.
 */
const REVEAL_LIBS = [
  'aos@',
  'aos.css',
  'aos.js',
  'aos.init',
  'wow.min.js',
  'scrollreveal',
];

describe('the builder prompt never ships hide-until-JS content', () => {
  for (const [name, prompt] of Object.entries({
    INITIAL_SYSTEM_PROMPT,
    FOLLOW_UP_SYSTEM_PROMPT,
  })) {
    it(`${name} loads no scroll-reveal library`, () => {
      const lower = prompt.toLowerCase();
      for (const lib of REVEAL_LIBS) {
        expect(lower).not.toContain(lib.toLowerCase());
      }
    });
  }

  it('INITIAL_SYSTEM_PROMPT states the visibility invariant', () => {
    expect(INITIAL_SYSTEM_PROMPT).toMatch(/VISIBLE WITHOUT JAVASCRIPT/i);
    // …and names the failure so the rule is not mistaken for a style preference.
    expect(INITIAL_SYSTEM_PROMPT.toLowerCase()).toContain('opacity:0');
  });

  it('the example template a model copies contains no reveal library', () => {
    // The examples are what actually gets imitated; prose alone is not enough.
    const examples = INITIAL_SYSTEM_PROMPT.split('Example Code:')[1] ?? '';
    expect(examples.length).toBeGreaterThan(0);
    expect(examples.toLowerCase()).not.toContain('aos');
  });
});
