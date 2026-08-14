/**
 * The signed-out flow has exactly one loud control per surface, and it is
 * `accent`.
 *
 * These are the screens a visitor meets before they are anyone: the sign-in
 * modal, the quota modal, the public nav, the signup page, the marketing
 * header. Every one of them ends in a single call to action, so every one of
 * them is a place where "which control do I press" has to be answered by the
 * pixels rather than by reading.
 *
 * All five were answering it wrong, in both directions at once:
 *
 *   - login-modal painted its label `$color1` (hsl(0 0% 4%)) on the unnamed
 *     variant's `$color2` fill (8%) — 1.07:1, measured in the browser. The
 *     button was there and invisible.
 *   - pro-modal and the public nav's "Sign Up" left the variant unnamed, which
 *     since @hanzo/ui 8.0.44 resolves to the QUIET control — `$color2`, the
 *     fill `panel` uses. The nav then offered "Log In" and "Sign Up" at equal
 *     weight, which is not a choice, it is a coin toss.
 *   - signup re-spelled `accent`'s fill inline and the header reached for
 *     `variant="primary"`. Both paint correctly today; both are a second
 *     spelling of one value, and the inline one is the exact shape that lost
 *     its foreground in login-modal.
 *
 * The scan is deliberately narrow. 262 controls app-wide have no named variant
 * and most are right to — a toolbar of icon buttons wants the quiet one. This
 * pins the surfaces where the answer is known, and it pins the FOREGROUND rule
 * everywhere, because that half is the one that goes silent.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");
const read = (f: string) => readFileSync(join(root, f), "utf8");

/**
 * The screens a visitor meets before they are anyone.
 *
 * `components/public/navigation` was a sixth and is now gone rather than fixed:
 * its "Sign Up" had the same unnamed-variant defect, but it rendered on no
 * route at all. It was imported by exactly one file, `app/(public)/layout.tsx`,
 * a route group whose last page was deleted in 8ad7d05e — a layout with
 * nothing to lay out, importing a nav nothing else imports. Both deleted.
 */
const SIGNED_OUT = [
  "components/login-modal/index.tsx",
  "components/pro-modal/index.tsx",
  "components/layout/header.tsx",
  "app/signup/page.tsx",
];

/**
 * Checked against the whole file, not per `<Button>` tag. Tempting to parse the
 * tags — but an open tag cannot be found with a regex here: `onClick={() => …}`
 * carries a `>` of its own, so `[^>]*>` stops at the arrow and a `variant` two
 * lines later reads as absent. These five files are small and every control on
 * them is a signed-out control, so the file is the right unit and the check is
 * strictly stronger than the one that would have had the hole.
 */
describe("the signed-out flow names its emphasis", () => {
  it.each(SIGNED_OUT)("%s spreads accent rather than re-spelling it", (file) => {
    const src = read(file);
    // The recipe's fill, written out by hand, is the shape that drops the
    // foreground half. There is one way to say this and it is `{...accent}`.
    expect(src).not.toMatch(/backgroundColor="\$color5"/);
    if (/\{\.\.\.accent\}/.test(src)) expect(src).toMatch(/from ['"]@\/lib\/chrome['"]/);
  });

  it.each(SIGNED_OUT)("%s asks for the loud control by name, never default/primary", (file) => {
    expect(read(file)).not.toMatch(/variant="(default|primary)"/);
  });

  it("gives each signed-out surface a control that is actually loud", () => {
    // Not a style preference: an unnamed variant is the QUIET one, so a surface
    // whose whole job is a single call to action must NAME its emphasis.
    //
    // Two recipes say it, and the rule is the naming, not the spelling. `accent`
    // is the raised neutral (`$color5`). `PrimaryButton` is the white one — the
    // package's own "one white, high-emphasis action … sign in, save, get
    // started" — which flips the control to `theme="light"` so fill and label
    // move together. Asserting the literal `{...accent}` made this test a
    // MECHANISM check: it failed the header for reaching for the LOUDER of the
    // two, which is the opposite of what the rule protects.
    const LOUD = /\{\.\.\.accent\}|<PrimaryButton/;
    for (const file of SIGNED_OUT) {
      expect({ file, loud: LOUD.test(read(file)) }).toEqual({ file, loud: true });
    }
  });

  it("lets the button paint its own label", () => {
    // A Text component between `accent` and the words resolves its own colour
    // from the scope the Button just mounted, where `--color` is re-based to
    // 80%. Both modals measured fill rgb(51,51,51) with the label at
    // rgb(204,204,204) — the quiet foreground on the loudest control. Handing
    // the string straight to the library's text host paints rgb(255,255,255).
    const wrapped = SIGNED_OUT.filter((f) =>
      /\{\.\.\.accent\}[\s\S]{0,600}?<SizableText[\s\S]{0,200}?<\/Button>/.test(read(f)),
    );
    expect(wrapped).toEqual([]);
  });

  it("never spells a foreground on an accent label", () => {
    // `accent` carries `$color12`. Naming a colour on the label is how the
    // sign-in button reached 1.07:1 — the recipe was right and the call site
    // overrode the half that mattered.
    for (const file of SIGNED_OUT) {
      expect({ file, dark: /color="\$color1"/.test(read(file)) }).toEqual({ file, dark: false });
    }
  });
});
