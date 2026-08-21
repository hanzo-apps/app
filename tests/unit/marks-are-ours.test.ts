/**
 * A brand wears its OWN marks.
 *
 * This app is served on Hanzo hosts — hanzo.app, www.hanzo.app, preview.hanzo.app
 * and orm.hanzo.ai all reach the same service — so its partner wall may name who
 * backs Hanzo and what Hanzo runs on, and a sibling org is neither. Two sibling
 * marks sat in that list and rendered on every one of those hosts.
 *
 * DELETING THE ENTRY IS HALF THE FIX. A mark left in `public/` is still served by
 * filename from this origin, so the same claim survives one URL away, reachable by
 * anyone who reads the git history or guesses the name. The assets are gone from
 * disk, and this checks disk — a rule about a rendered page cannot see that.
 *
 * SCOPE IS `logos/partners`, deliberately, and the neighbouring `logos/providers`
 * is NOT covered. They make different claims: a partner is an affiliation we
 * assert about ourselves, a provider is a maker whose models we route, named the
 * same way OpenAI and Anthropic are named beside it. Widening this to every mark
 * would quietly decide the open question of who publishes the Zen family, which
 * is not a test's to settle.
 *
 * The scan is the whole marketing surface rather than the one component, because
 * the list is data and data moves: the next home for it is a `lib/` constant or a
 * second wall, and a check pinned to one filename would follow it nowhere.
 */
import { sources, read, rel, stripComments } from '../source';

/** A sibling org's name, as it appears in a mark's filename. */
const SIBLING = /lux|zoo/i;

describe('no sibling mark on a Hanzo surface', () => {
  it('the partner wall names none', () => {
    const wall = stripComments(read('components/landing/logo-wall.tsx'));
    expect(wall).toContain('partners/techstars.svg'); // the scan reaches the list at all
    expect(wall).not.toMatch(SIBLING);
  });

  it('no marketing component points at a sibling partner mark', () => {
    const named = sources(['components/landing'])
      .map(rel)
      .filter((f) =>
        [...stripComments(read(f)).matchAll(/logos\/partners\/([\w.-]+)/g)].some((m) =>
          SIBLING.test(m[1]),
        ),
      );
    expect(named).toEqual([]);
  });

  it('and none is left fetchable by direct URL', () => {
    const marks = sources(['public/logos/partners'], /\.svg$/).map(rel);
    // the directory is the right one — an empty scan would pass every filter below
    expect(marks).toContain('public/logos/partners/techstars.svg');
    expect(marks.filter((f) => SIBLING.test(f))).toEqual([]);
  });
});
