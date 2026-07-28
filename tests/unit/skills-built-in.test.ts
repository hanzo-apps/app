// Every registered built-in skill must actually LOAD.
//
// It did not. `design-system` was written, registered in the registry, compiled
// into the shipped bundle — and then discarded at load, because the loader parses
// each built-in inside a try/catch and only logs the failure. The manager showed
// "Built-in Skills (8)" while BUILT_IN_SKILLS held nine, and nothing anywhere
// said so. Registration is not availability, and that gap is exactly what this
// file closes.
//
// The catch stays: a CUSTOM skill is user input and must not take the view down.
// A built-in is ours, compiled in, and a broken one is a bug that must fail here
// rather than shrink a number in production.

import { BUILT_IN_SKILLS } from '@/lib/vfs/skills/registry';
import { parseSkillFile, DESCRIPTION_MAX } from '@/lib/vfs/skills/parser';

describe('built-in skills', () => {
  it('every registered skill parses', () => {
    const broken: string[] = [];
    for (const skill of BUILT_IN_SKILLS) {
      try {
        parseSkillFile(skill.content);
      } catch (error) {
        broken.push(`${skill.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('the count the manager shows equals the count registered', () => {
    // What SkillsManager renders is the loader's output, not the registry's
    // length. Assert on the same quantity the user reads.
    const loaded = BUILT_IN_SKILLS.filter((s) => {
      try {
        parseSkillFile(s.content);
        return true;
      } catch {
        return false;
      }
    });
    expect(loaded).toHaveLength(BUILT_IN_SKILLS.length);
  });

  it('declares a unique id and a frontmatter name that matches it', () => {
    const ids = BUILT_IN_SKILLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const skill of BUILT_IN_SKILLS) {
      const { frontmatter } = parseSkillFile(skill.content);
      // The registry id is what the UI keys on; the frontmatter name is what a
      // model is told the skill is called. Two names for one thing is how a
      // skill becomes unreachable by the name it advertises.
      expect(frontmatter.name).toBe(skill.id);
      expect(frontmatter.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    }
  });
});
