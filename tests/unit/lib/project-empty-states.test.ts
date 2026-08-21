/**
 * What the projects list says when it has nothing to show.
 *
 * The sidebar links to `/projects?filter=starred|mine|shared` and the list did
 * not read that param at all, so every one of them rendered the FULL list — a
 * wrong answer delivered confidently, which is worse than an empty one. These
 * pin both halves: the filters resolve, and the copy tells the truth about why
 * they are empty.
 */
import { FILTERS, NO_PROJECTS, SEARCH_EMPTY } from '@/components/project-manager/ProjectList';

describe('project list empty states', () => {
  it('answers every filter the sidebar links to', () => {
    // These ids are the sidebar's (components/sidebar PROJECT_ITEMS). A filter
    // with no entry here falls back to the generic empty state, which would say
    // "No projects yet" to someone who has plenty.
    for (const id of ['starred', 'mine', 'shared']) {
      expect(FILTERS[id]).toBeDefined();
    }
  });

  it('marks the filters as unfillable, which is what makes the list empty', () => {
    // Not a placeholder: a project carries no star, no creator and no sharing,
    // so there is no field to select on. `none` is the current truth.
    for (const state of Object.values(FILTERS)) {
      expect(state.none).toBe(true);
    }
  });

  it('never implies the reader simply has none of these', () => {
    // "No starred projects yet" would say starring exists and you have not used
    // it. Neither half is true, and the second is the one that wastes someone's
    // afternoon looking for the star button.
    for (const [id, state] of Object.entries(FILTERS)) {
      expect(state.title.toLowerCase()).not.toMatch(/^no /);
      expect(`${id}: ${state.body}`).toMatch(/not|cannot|does not|belong/i);
    }
  });

  it('offers Create on the only state where creating is what is missing', () => {
    expect(NO_PROJECTS.create).toBe(true);
    expect(SEARCH_EMPTY.create).toBeUndefined();
    // A create button under "Starring is not here yet" answers a question
    // nobody asked — the reader has projects, they wanted this list.
    for (const state of Object.values(FILTERS)) {
      expect(state.create).toBeUndefined();
    }
  });

  it('gives every state an icon, a heading and a sentence', () => {
    for (const state of [NO_PROJECTS, SEARCH_EMPTY, ...Object.values(FILTERS)]) {
      expect(state.icon).toBeTruthy();
      expect(state.title.length).toBeGreaterThan(0);
      // One real sentence, not a fragment — this is the only text on the screen.
      expect(state.body.length).toBeGreaterThan(40);
      expect(state.body.trim()).toMatch(/\.$/);
    }
  });
});
