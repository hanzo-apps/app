import { execSync } from "child_process";

import { root } from "../source";

/**
 * `flex={0}` is a basis-zero trap, and it is the one this app already knows.
 *
 * The CSS shorthand `flex: 0` expands to `0 1 0%`: grow none, shrink FREELY,
 * basis ZERO. So a box that only wanted "do not grow" gets a zero content size
 * and collapses, and its children spill out of it — visible only where an
 * ancestor clips.
 *
 * Measured on the comparison list's mobile fold at 390px: the right cluster
 * computed `flex: 0 1 0px`, rendered 0px wide against 92px of content, and the
 * summary overflowed 420 into 356. A phone showed "4 w" — a word cut
 * mid-letter — and no chevron at all, which is the only affordance saying the
 * row opens. With `flexShrink` alone the basis stays `auto`, the cluster is its
 * content width, and all eleven rows fit with nothing clipped.
 *
 * This is the `flex: 1` = `1 1 0%` collapse the CLAUDE.md records for TabsContent
 * and CardContent, at the other end of the scale. Same cause, same tell.
 */

describe("flex shorthand never carries a zero basis", () => {
  it("no component says flex={0}", () => {
    // `flexShrink={0}` / `flexGrow={0}` say the ONE thing meant, and leave the
    // basis alone. The shorthand cannot.
    // Comment-aware: this rule is explained in prose that necessarily QUOTES
    // the anti-pattern, and a naive grep matches its own documentation — the
    // vacuous-check trap, inverted. Only real JSX attributes count, so the
    // match must sit on a line that is not a comment.
    const hits = execSync(
      `grep -rn 'flex={0}' --include='*.tsx' components app || true`,
      { cwd: root, encoding: "utf8" },
    )
      .split("\n")
      .filter(Boolean)
      .filter((line) => {
        const code = line.slice(line.indexOf(":", line.indexOf(":") + 1) + 1).trim();
        return !/^(\*|\/\/|\{?\/\*)/.test(code);
      });
    expect(hits).toEqual([]);
  });
});
