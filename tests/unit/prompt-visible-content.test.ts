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

describe('the builder prompt refuses invented content', () => {
  // A generated page can be PUBLISHED. "42,000+ explorers already questing"
  // appeared on a real build for an app that had no users at all — a false
  // claim shown to real visitors, produced because nothing forbade it.
  it('INITIAL_SYSTEM_PROMPT forbids fabricated metrics and testimonials', () => {
    expect(INITIAL_SYSTEM_PROMPT).toMatch(/NEVER INVENT FACTS/i);
    const lower = INITIAL_SYSTEM_PROMPT.toLowerCase();
    for (const kind of ['testimonial', 'user counts', 'ratings']) {
      expect(lower).toContain(kind);
    }
  });

  it('INITIAL_SYSTEM_PROMPT distinguishes an app from a page about the app', () => {
    expect(INITIAL_SYSTEM_PROMPT).toMatch(/BUILD THE THING THAT WAS ASKED FOR/i);
    expect(INITIAL_SYSTEM_PROMPT.toLowerCase()).toContain('is not the app');
  });
});

describe('the builder prompt can express a multi-page app', () => {
  // Every build came back "1 file", even for a spec describing several screens.
  // The only instruction to emit more than one page read "7. Retry if another
  // pages." — which parses as retrying a FAILURE, not repeating per page — and
  // the worked example showed exactly one page. A model has to copy something.
  it('says to repeat the block for every page, in words', () => {
    expect(INITIAL_SYSTEM_PROMPT).toMatch(/REPEAT steps 1-6 for EVERY page/i);
    expect(INITIAL_SYSTEM_PROMPT).not.toMatch(/Retry if another pages/i);
    expect(FOLLOW_UP_SYSTEM_PROMPT).not.toMatch(/Retry if another pages/i);
  });

  it('SHOWS two pages in the worked example, not one', () => {
    const { TITLE_PAGE_START } = jest.requireActual('@/lib/prompts');
    const examples = INITIAL_SYSTEM_PROMPT.split('Example Code:')[1] ?? '';
    const blocks = examples.split(TITLE_PAGE_START).length - 1;
    expect(blocks).toBeGreaterThanOrEqual(2);
    // …and the pages must reference each other, or the "app" is two dead ends.
    expect(examples).toContain('href="index.html"');
  });
});

describe('the builder prompt loads each library once', () => {
  for (const [name, prompt] of Object.entries({
    INITIAL_SYSTEM_PROMPT,
    FOLLOW_UP_SYSTEM_PROMPT,
  })) {
    it(`${name} does not load feather-icons twice`, () => {
      // It used to pull the SAME library from unpkg AND jsdelivr, in the prose
      // and in every example. Two copies cannot make the icons more likely to
      // appear; they only add a second origin that can fail or hang.
      const loads = (prompt.match(/<script src="[^"]*feather[^"]*"><\/script>/g) ?? []).length;
      const origins = new Set(
        (prompt.match(/https?:\/\/[^/"]+\/[^"]*feather[^"]*/g) ?? []).map(
          (u) => new URL(u).host,
        ),
      );
      // Asserted as "no origins beyond the first" so a failure PRINTS the extra
      // hosts rather than just a count.
      expect([...origins].slice(1)).toEqual([]);
      expect(loads).toBeLessThanOrEqual(2); // one per example template, at most
    });

    it(`${name} has no top-level destructure that throws when a CDN is slow`, () => {
      // `const { animate } = anime;` in its own <script> is block-scoped, so no
      // later script could use it — and it throws ReferenceError outright if the
      // CDN has not landed. It could only ever do harm.
      expect(prompt).not.toMatch(/const\s*\{[^}]*\}\s*=\s*anime\s*;/);
    });
  }
});
