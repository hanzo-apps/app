import { readFileSync } from "fs";
import { join } from "path";

const landing = readFileSync(join(__dirname, "../../app/page.tsx"), "utf8");

/**
 * The front page's starter strip shows templates that can actually be opened.
 *
 * Measured 2026-08-08: of the 49 templates that cleared the screenshot list,
 * 27 answered 404 on `/v1/templates/<slug>/pages`. More than half the showcase
 * on the front door was a picture of a design a visitor could pick and then not
 * receive. 22 survive the filter, which is more than a strip renders.
 *
 * The dangerous half of this fix is the FAILURE mode. `fetchPublishedSlugs`
 * returns an empty Set when the warehouse does not answer, and a filter that
 * took that literally would render an EMPTY front page — a worse bug than the
 * one being fixed, and one that only appears when a background request fails.
 * So the guard is `openable.size > 0 &&`, and that is what this pins.
 */
describe("the starter strip filters on openable, and only when it knows", () => {
  it("does not filter when the warehouse has not answered", () => {
    expect(landing).toMatch(/if \(openable\.size > 0 && !openable\.has\(t\.slug\)\) return false;/);
  });

  it("asks the warehouse, not only the gallery", () => {
    // The shop window (/v1/gallery) and the warehouse (/v1/templates) are
    // different services whose lists disagree by 43 rows, so one call cannot
    // answer both questions.
    expect(landing).toContain("fetchPublishedSlugs()");
    expect(landing).toContain('fetch("/v1/gallery")');
  });

  it("derives the strip rather than storing it", () => {
    // The rows and the openable set arrive from separate requests. Storing the
    // computed strip would mean whichever landed second had to remember the
    // first — the shape that drops one of two async answers.
    expect(landing).toMatch(/const starterTemplates = useMemo\(/);
    expect(landing).not.toContain("setStarterTemplates");
  });
});
