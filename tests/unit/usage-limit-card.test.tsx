import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A card that wraps OWNS its height.
 *
 * The two options in the usage-limit modal are a 36px icon beside a column
 * holding a title row and a description that wraps to two lines. That column
 * carried `flex={1}`, which in gui's flex model compiles to `flex-basis: 0` —
 * so in a content-sized row its hypothetical height is 0 and it reserves none
 * of the space its own text needs. The description painted OUTSIDE the card and
 * landed on the card below: live, "…pay only for what you use." ran straight
 * through "Upgrade your plan".
 *
 * This app has hit that collapse four times now — TabsContent, CardContent, the
 * page picker, and here — and the remedy is always the same: keep the growing,
 * restore the basis.
 *
 * A SOURCE assertion, deliberately. jsdom performs no layout, so no unit test
 * here can measure the overlap; rendering the dialog cannot even reach the
 * assertion (its portal chain resolves to undefined outside a browser). What is
 * checkable is the declaration that caused it, which is the same shape
 * `touch-target` and `glass` use to hold CSS invariants in this repo.
 */
describe("the usage-limit options", () => {
  it("never asks a wrapping column for a zero basis", () => {
    const src = readFileSync(
      join(__dirname, "../../components/usage/UsageLimitDialog.tsx"),
      "utf8",
    );
    // COMMENT-STRIPPED, and that is not fussiness: the note written above the
    // fix names the very spelling it forbids, so a scan of the raw file is
    // satisfied by its own documentation. Match the thing, never the word for
    // the thing — the same way the deploy gate had to stop matching a bare
    // `SITES_S3_` that a comment could legitimately contain.
    const code = src
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    expect(code).not.toMatch(/flex=\{1\}/);
    expect(code).toMatch(/flexGrow=\{1\}\s+flexBasis="auto"/);
  });
});
