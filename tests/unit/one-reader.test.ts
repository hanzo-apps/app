import { read, rel, sources, stripComments } from '../source';

// FOUR primitives, and no suite may grow a private copy.
//
// This is the guard that makes the convergence permanent rather than a tidy-up
// somebody undoes by writing the obvious four lines again. Before it: `tagEnd`
// in three suites, comment strippers in thirteen across five behaviours, twelve
// directory walkers, and three spellings of the repo root in 41 files.
//
// The cost of a second copy is never the duplication. It is that the copies
// DISAGREE: four strippers could be evaded with a trailing comment and one
// stripped no line comments at all, so a rule that held in one suite was
// unenforced in another and nothing said so.
const SUITES = sources(['tests'], /\.tsx?$/).filter((f) => !f.endsWith('/source.ts'));

/** Where a rule fires, with the file names a reader needs to go fix it. */
const offenders = (re: RegExp) =>
  SUITES.filter((f) => re.test(stripComments(read(rel(f))))).map(rel);

describe('one reader, and nothing else reads', () => {
  it('scans every suite', () => {
    expect(SUITES.length).toBeGreaterThan(150);
  });

  it('no private comment stripper', () => {
    // The shape is unmistakable: a replace of a block-comment pattern. Any
    // spelling of it outside source.ts is a fifth behaviour waiting to happen.
    expect(offenders(/\.replace\(\s*\/\\\/\\\*/)).toEqual([]);
  });

  it('nobody reads a directory except these five, for these reasons', () => {
    // The defect was the RECURSIVE walker: twelve copies with five disagreeing
    // skip lists, every one a policy decision made privately. Those are gone —
    // `sources` is the only descent in the tree.
    //
    // Listing ONE directory is a different question and carries no policy: no
    // skip list, no extension filter, nothing to disagree about. So the rule is
    // a NAMED LIST rather than a pattern. A pattern would need a signature for
    // "recursive", and the two obvious ones are both wrong — `isDirectory()`
    // beside a readdir matches `internal-routes` and `template-demos`, which
    // filter one directory's entries and never descend. A list cannot be
    // fooled, and adding a sixth entry is an edit a reader sees.
    const ALLOWED = [
      // matches a dynamic `[segment]` folder when a literal path has no match
      'tests/unit/api-client-routes.test.ts',
      // reads the INSTALLED @hanzo/ui on purpose — `sources` skips node_modules
      'tests/unit/control-scale.test.ts',
      // every top-level app/ folder that has a page.tsx, tracked or not
      'tests/unit/internal-routes.test.ts',
      // builds a route TREE, not a file list
      'tests/unit/protected-routes.test.ts',
      // the in-app template routes, to catch a second copy of a served template
      'tests/unit/template-demos.test.ts',
      // counts the shots in public/templates against the catalog
      'tests/unit/template-schematic.test.ts',
    ];
    expect(offenders(/\breaddirSync\b/)).toEqual(ALLOWED);
  });

  it('nobody reads the shell’s working directory', () => {
    // `process.cwd()` is where jest was launched, which is the repo root only by
    // habit. `root` is derived from source.ts's own location and always right.
    expect(offenders(/process\.cwd\(\)/)).toEqual([]);
  });

  it('nobody re-derives the repo root', () => {
    // `join(__dirname, "..", "..")` and its two other spellings. A suite that
    // moves one directory deeper silently reads the wrong tree.
    expect(offenders(/__dirname\s*,\s*["']\.\.["']/)).toEqual([]);
  });
});
