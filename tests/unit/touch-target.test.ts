
import { read, rel, sources, stripComments } from "../source";

/**
 * A tap target is a BOX, and both sides carry the 44px floor.
 *
 * `@media (pointer: coarse)` used to set `min-height` alone. That passes a
 * 28x44 icon button — tall enough to measure, too narrow for a thumb, which is
 * about as wide as it is tall. The deploy gate (universe
 * charts/app/templates/e2e-gate.yaml) read height alone for the same reason, so
 * the rule and its check agreed with each other and were both wrong: six routes
 * reported clean over four controls measuring 22, 28, 36 and 39 wide — the
 * composer's mic, its send button, the brand mark on five routes, and a filter
 * chip. Both now assert `min(width, height)`.
 *
 * `!important` is the load-bearing half and the reason this is pinned rather
 * than trusted. `size="icon"` sets its floor INLINE, and an inline declaration
 * beats any stylesheet rule on the same property whatever its specificity — the
 * same collision `.t_group_true` needs it for. Dropped, this rule is a silent
 * no-op on exactly the controls it exists for: nothing errors, nothing types
 * wrong, and every measurement goes back to passing at 36 wide.
 *
 * The floor has ONE exemption, `.hz-dense`, and the second half of this suite
 * pins its shape as tightly as the floor itself — an exemption is where a floor
 * goes to die quietly.
 */
describe("the coarse-pointer touch floor", () => {
  const css = read("assets/globals.css");

  const coarse = (() => {
    const at = css.indexOf("@media (pointer: coarse)");
    expect(at).toBeGreaterThan(-1);
    // Balance braces from the block's opening one so the test reads the whole
    // media block and nothing after it.
    let depth = 0;
    for (let i = css.indexOf("{", at); i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}" && --depth === 0) return css.slice(at, i + 1);
    }
    throw new Error("unbalanced @media (pointer: coarse) block");
  })();

  it("floors BOTH sides, not just height", () => {
    expect(coarse).toMatch(/min-height:\s*44px/);
    expect(coarse).toMatch(/min-width:\s*44px/);
  });

  it("outranks the inline size token", () => {
    // Both, and on the 44px declarations specifically — an `!important`
    // somewhere else in the block would satisfy a laxer match while the floor
    // itself still lost to `size="icon"`.
    expect(coarse).toMatch(/min-height:\s*44px\s*!important/);
    expect(coarse).toMatch(/min-width:\s*44px\s*!important/);
  });

  it("spares a separator, which the floor would otherwise eat", () => {
    // A resizer is `<button role="separator">` in four places here, and the
    // composer's is 14px tall at `top: -7` on purpose — a taller strip takes
    // the taps meant for the field's first line, which its own comment records
    // having measured at 30px. The 14 is written INLINE, and the `!important`
    // above beats an inline declaration by design, so without this clause every
    // phone got a 44px invisible bar across the top of the composer.
    expect(coarse).toMatch(/button[^,{]*:not\(\[role='separator'\]\)/);
  });

  it("and every resizer really does say separator", () => {
    // The exclusion is worth nothing if a handle stops claiming the role. Read
    // the call sites rather than trusting the selector: any file that hangs a
    // pointer-resize cursor on a Button has to name itself a separator to be
    // spared, and one that does not is back to a 44px square.
    // ANY resize cursor. Written `(ns|ew)-resize` first, which matched one file
    // of four — the other three say `row-resize` and `col-resize` — so the
    // assertion read as a sweep and was checking the single handle that already
    // passed. CSS has six of these spellings and a guard may not prefer two.
    const handles = sources(["components/editor", "components/landing"]).filter((f) =>
      /cursor="[a-z-]*resize"/.test(stripComments(read(rel(f)))),
    );
    expect(handles.map(rel).sort()).toHaveLength(4);
    for (const f of handles) {
      expect({ file: rel(f), separator: /role="separator"/.test(read(rel(f))) }).toEqual({
        file: rel(f),
        separator: true,
      });
    }
  });

  it("covers the same controls the deploy gate measures", () => {
    // The gate's predicate is button / [role=button] / a[href], prose excluded,
    // and it excludes a separator for the same reason this rule does — the two
    // selectors are one decision written in two repos (the gate lives in
    // universe, charts/app/templates/e2e-gate.yaml). A gate that MEASURES what
    // the stylesheet declines to SIZE reds the deploy for a shape nobody wants.
    // A rule that governs fewer elements than the check does fails in CI rather
    // than on a phone, which is the wrong end to find it. The two button-shaped
    // selectors carry the dense-row exemption below; the others do not.
    for (const sel of [
      "button:not\\(:where\\(\\.hz-dense \\*\\)\\):not\\(\\[role='separator'\\]\\)",
      "\\[role='button'\\]:not\\(:where\\(\\.hz-dense \\*\\)\\)",
      "a\\[href\\]",
    ]) {
      expect(coarse).toMatch(new RegExp(`(^|,|\\s)${sel}\\s*(,|\\{)`, "m"));
    }
  });

  // ── The one exemption, and why it is not a hole in the floor ──────────────
  // `.hz-dense` is a dense cluster of SECONDARY controls inside one large
  // primary target: the composer's action row (+ / Build / Base / mic / send)
  // under a 62px field. Two things make it safe. @hanzo/ui already gives every
  // Button a 44px HIT area with a transparent ::after (`touch()` →
  // data-touch-y), so what this floor adds there is painted size, not reach —
  // measured, all five controls rendered 44x44 on a phone against 32 on a
  // desktop. And the field beside them is what a thumb actually aims at.
  //
  // It is deliberately narrow: opt-in per row, never a global relaxation, and
  // it does not reach a standalone target — the starter chips (`.hz-tap`) stay
  // 44, which is the whole point of them being tappable at all.
  describe("the dense-row exemption", () => {
    it("exempts the button-shaped selectors and NOTHING else", () => {
      expect(coarse).toContain("button:not(:where(.hz-dense *))");
      expect(coarse).toContain("[role='button']:not(:where(.hz-dense *))");
      // A chip and a standalone link are targets in their own right.
      expect(coarse).toMatch(/(^|,|\s)a\[href\]\s*,/m);
      expect(coarse).toMatch(/(^|,|\s)\.hz-tap\s*\{/m);
    });

    it("is written forgiving, so a parser that cannot read it drops the exemption and not the floor", () => {
      // `:where()` is forgiving: an unparseable argument matches nothing, so
      // `:not(:where(…))` still matches everything and the 44px floor survives.
      // Bare `:not(.hz-dense *)` fails the other way — one unsupported selector
      // in a list invalidates the WHOLE rule, and the floor would vanish from
      // every control on the page.
      expect(coarse).not.toMatch(/:not\(\.hz-dense/);
      expect(coarse).toMatch(/:not\(:where\(\.hz-dense \*\)\)/);
    });

    it("carries no specificity, so these selectors weigh what they always weighed", () => {
      // `:where()` contributes 0 — `button:not(:where(…))` is (0,0,1), exactly
      // `button`. If this were `:not(.hz-dense *)` the selectors would climb to
      // (0,1,1) and quietly start outranking rules that used to tie with them.
      expect(coarse).toMatch(/button:not\(:where\([^)]*\)\)/);
    });

    it("also opts the row out of the --control-h touch register", () => {
      // The floor above names `button`, and @hanzo/ui's Button renders a DIV —
      // so it never met this rule at all. Its height comes from the control
      // spec (`[data-variant][data-size] { height: var(--control-h) }`), and
      // --control-h is 44px below 767px. Both floors need the same exemption
      // for the same reason; neither is the other's backstop, and exempting
      // only one leaves the row at 32 wide and 44 tall.
      expect(css).toMatch(
        /html:root \.hz-dense \[data-variant\]\[data-size\]\s*\{[^}]*height:\s*auto/,
      );
    });

    it("hands the box back to the library rather than naming a size", () => {
      // `height: auto` lets the size variant the call site already asked for
      // (`sm` / `icon-sm` = 32) be the box. A number here would be a second
      // copy of @hanzo/ui's size table, and only one copy gets maintained.
      const dense = css.slice(css.indexOf("html:root .hz-dense [data-variant]"));
      expect(dense.slice(0, dense.indexOf("}"))).not.toMatch(/\d+px/);
    });
  });

  it("leaves a link inside a sentence alone", () => {
    expect(coarse).toMatch(/p a\[href\]/);
  });

  it("floors a FIELD too — you tap an input to focus it", () => {
    // The selector list above names only things shaped like buttons, so every
    // text field in the product sat under the floor with nothing reporting it:
    // measured on a phone, the search field on /agents and /projects is 36px.
    expect(coarse).toMatch(/(^|,|\s)input[^,{]*[,{]/m);
    expect(coarse).toMatch(/(^|,|\s)textarea\s*[,{]/m);
  });

  it("says where the label sits in the box it just made taller", () => {
    // The floor and the centering are half a rule each. A chip whose content is
    // 32px is forced to 44, and in BLOCK layout the whole 12px lands under the
    // text — measured on the composer starters: 10px above, 20px below, which
    // is the lopsided pill a phone shows.
    expect(coarse).toMatch(/\.hz-tap\s*\{[^}]*align-items:\s*center/);
  });

  it("outranks gui for the centering too, not just the floor", () => {
    // A bare `.hz-tap` is (0,1,0) — a dead tie with every atomic class gui
    // compiles — and a tie goes to load order, where gui.css is imported LAST.
    // So the unanchored form is not a weaker rule, it is an INERT one: it was
    // in the stylesheet the whole time and changed nothing on any phone.
    const centering = coarse.slice(coarse.indexOf("align-items: center") - 400);
    expect(centering).toMatch(/html:root\s+\.hz-tap/);
  });

  it("does NOT force a width on a checkbox or radio", () => {
    // For a field `min-width` is inert — a field is sized by its container and
    // is never the 22-28px wide the box argument was written for. For a
    // checkbox it is the control's ENTIRE size, so flooring it there inflates
    // the control and breaks the row it sits in. The exclusion is the load-
    // bearing half of that rule, so it is pinned rather than left to a reader.
    const fields = coarse.slice(coarse.indexOf("input"));
    expect(fields).toMatch(/:not\(\[type='checkbox'\]\)/);
    expect(fields).toMatch(/:not\(\[type='radio'\]\)/);
  });
});
