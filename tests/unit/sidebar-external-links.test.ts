import { readFileSync } from "fs";
import { join } from "path";

/**
 * The sidebar has two fields for "where does this row go", and they are not
 * interchangeable: `route` is handed to `router.push`, `href` to
 * `window.open(…, '_blank')`. An absolute URL in `route` therefore REPLACES
 * hanzo.app in the tab.
 *
 * That is how the Terminals row shipped — `route: 'https://tabs.hanzo.ai/app'`
 * — and the failure does not look like a failure: the click works, the
 * destination loads, and the reader has simply lost the project they were in.
 * (Verified in Chromium against production: one tab, hanzo.app gone, and
 * tabs.hanzo.ai asking an already-signed-in user to sign in again.)
 *
 * Asserting the FIELD rather than the one row, because the next external
 * destination somebody adds will reach for whichever field they saw last.
 */
const source = readFileSync(
  join(__dirname, "../../components/sidebar/index.tsx"),
  "utf8",
);

describe("a sidebar row that leaves the app", () => {
  it("never carries an absolute URL in `route`", () => {
    // Every `route:` value in the item tables, whatever quote style.
    const routes = [...source.matchAll(/\broute:\s*(['"])(.*?)\1/g)].map((m) => m[2]);
    // The sweep has to find something, or it passes by matching nothing.
    expect(routes.length).toBeGreaterThanOrEqual(8);
    expect(routes.filter((r) => /^[a-z]+:\/\//i.test(r))).toEqual([]);
  });

  it("still has the one field that opens a new tab", () => {
    // The fix depends on `href` being handled; a refactor that drops the branch
    // would silently make every external row a dead click.
    expect(source).toMatch(/if\s*\(item\.href\)/);
    expect(source).toMatch(/window\.open\(item\.href,\s*['"]_blank['"]/);
  });
});
