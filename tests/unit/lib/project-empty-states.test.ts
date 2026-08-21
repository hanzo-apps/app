/**
 * What the projects list says when it has nothing to show.
 *
 * The sidebar once offered three filters — Starred, Created by me, Shared with
 * me — all linking to `?filter=…` that the list never read, so every one of them
 * rendered the FULL list: a wrong answer delivered confidently.
 *
 * Only ONE of the three was a feature. A project belongs to an ORG, so there is
 * nobody to share it to, and the store deliberately records no per-person
 * author. A star is different in kind: one person's shortlist, which two people
 * in the same org may disagree about without either being wrong. So starring was
 * built and the other two destinations were removed — a link that cannot mean
 * anything is worse than an absent one.
 */
import { FILTERS, NO_PROJECTS, SEARCH_EMPTY } from '@/components/project-manager/ProjectList';

describe('project list empty states', () => {
  it('offers exactly the filters that can actually select something', () => {
    // `mine` and `shared` are gone on purpose. If either comes back here, it
    // needs a field on the project to select on — otherwise it is the org
    // boundary seen at the wrong grain, which is what made it lie before.
    expect(Object.keys(FILTERS)).toEqual(['starred']);
  });

  it('reads starred as a real "not yet", because it can be filled', () => {
    // This is the one empty state in the file that is genuinely about the
    // reader having done nothing yet, so it is allowed to say so.
    expect(FILTERS.starred.title).toMatch(/nothing starred/i);
    expect(FILTERS.starred.body).toMatch(/star a project/i);
  });

  it('offers Create only where creating is the thing missing', () => {
    expect(NO_PROJECTS.create).toBe(true);
    expect(SEARCH_EMPTY.create).toBeUndefined();
    // A create button under "Nothing starred yet" answers a question nobody
    // asked — the reader has projects, they wanted their shortlist.
    expect(FILTERS.starred.create).toBeUndefined();
  });

  it('gives every state an icon, a heading and a real sentence', () => {
    for (const state of [NO_PROJECTS, SEARCH_EMPTY, ...Object.values(FILTERS)]) {
      expect(state.icon).toBeTruthy();
      expect(state.title.length).toBeGreaterThan(0);
      // One real sentence, not a fragment — this is the only text on screen.
      expect(state.body.length).toBeGreaterThan(40);
      expect(state.body.trim()).toMatch(/\.$/);
    }
  });
});
