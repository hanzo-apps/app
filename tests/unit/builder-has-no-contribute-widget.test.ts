/**
 * The builder route declares no source repo.
 *
 * `public/edit.js` pins itself to the viewport's bottom-right corner. Measured
 * live on /dev at 1430x832, its 56px box sits at x 1358-1414, y 760-816 — over
 * the preview card (x 404-1418, y 62-792, 8px corner), across the gap below it,
 * and onto the console dock bar (y 804-832) where the dock keeps its own chat
 * toggle and mic. That is the "clipped at the rounded corner" report: the mark is
 * cut by the card's corner because it is drawn ON the card. Its computed
 * `margin-top` is 0px — there is no offset to correct, and no inset helps,
 * because the card fills the whole right side.
 *
 * The widget offers "contribute to THIS page", i.e. a PR against the page's own
 * source, and the page here is the customer's generated app. So it is turned off
 * the way the widget itself defines off — by declaring no repo — rather than with
 * a flag.
 *
 * This is easy to undo by accident (deleting a layout that renders its children
 * unchanged looks like dead code), so the contract is pinned from both ends.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

describe("the contribute widget cannot mount on the builder", () => {
  it("edit.js still treats a missing repo as 'do nothing'", () => {
    const src = read("public/edit.js");
    // Two facts, checked apart. They used to be one regex requiring the bail to
    // sit on the line AFTER the declaration, which said nothing about the rule
    // and broke the moment edit.js grew a host fallback and moved its bail 250
    // lines down — reporting that a still-honoured contract was gone.
    expect(src).toMatch(/var REPO = meta\('hanzo:repo'\)/);
    expect(src).toMatch(/if \(!REPO\) return;/);
  });

  it("the root layout is what declares the repo", () => {
    expect(read("app/layout.tsx")).toContain('"hanzo:repo": "hanzoai/app"');
  });

  it("/dev blanks that declaration by NAMING the key", () => {
    const path = "app/dev/layout.tsx";
    expect(existsSync(join(ROOT, path))).toBe(true);
    const src = read(path);
    // Measured live: an empty `other: {}` changed nothing, because Next merges
    // `other` BY KEY into the parent's. The key has to be named to override it.
    expect(src).toMatch(/other:\s*\{\s*"hanzo:repo":\s*""\s*\}/);
    // It must stay a pass-through: this layout exists for the metadata alone and
    // may never become a place that renders chrome.
    expect(src).toMatch(/return children;/);
  });
});
