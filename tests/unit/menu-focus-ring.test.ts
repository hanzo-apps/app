/**
 * This sheet draws no focus indicator, and a popup CONTAINER does not wear one.
 *
 * @hanzo/design draws the one indicator for every focusable thing —
 * `:focus-visible { outline: 2px solid var(--ring); outline-offset:
 * var(--ring-offset, 2px) }` — and a field sets `--ring-offset: -2px` so its
 * ring is drawn inside its own box, where a composer's `overflow: hidden`
 * cannot clip it away.
 *
 * globals.css used to state that law itself, over
 * `:is(a, button, summary, [role="button"], [tabindex])`. A rule here cannot be
 * limited to what it names: @hanzo/gui puts `tabIndex: 0` on every Input, so
 * `[tabindex]` silently governed all 149 fields in the product and pinned them
 * to a POSITIVE offset — measured, `--ring-offset` computed `-2px` and
 * `outline-offset` computed `2px` on the same element, and the builder's chat
 * composer rendered byte-identical screenshots focused and unfocused.
 *
 * Both halves regress invisibly: nothing type-checks or throws when a ring
 * silently returns to a container, or when a rule here quietly recaptures every
 * field. Only a look at the running page would show it, which is what the
 * sibling css tests exist to replace.
 */
import { readFileSync } from "node:fs";

import { join } from "node:path";


const CSS = readFileSync(join(__dirname, "..", "..", "assets", "globals.css"), "utf8");

/** Collapse whitespace so assertions read against normalized CSS text. */
const flat = CSS.replace(/\s+/g, " ");

describe("menu focus ring", () => {
  it("states no focus indicator of its own — design owns the one rule", () => {
    // A selector naming a generic focusable hook is the failure mode: it reads
    // as "links and bare focusable divs" and captures every gui field.
    expect(flat).not.toMatch(/\[tabindex\][^)]*\):focus-visible \{ outline: 2px/);
    expect(flat).not.toMatch(/:is\(input, textarea, select\):focus-visible/);
    // The tokens that fed it are gone with it; `--ring` is the one knob left.
    expect(flat).not.toMatch(/--focus-ring\s*:/);
    expect(flat).not.toMatch(/--focus-edge\s*:/);
    expect(flat).toMatch(/--ring: var\(--brand-accent\)/);
  });

  it("a menu / listbox container is carved OUT of that ring (outline: none)", () => {
    // The popup-container roles must appear together in a :focus-visible rule that
    // removes the outline. Order-independent within the :is(), so match each.
    const carve = flat.match(/:is\(([^)]*)\):focus-visible \{ outline: none/g) || [];
    const forContainers = carve.find(
      (r) => /role="menu"/.test(r) && /data-hanzogui-menu-content/.test(r),
    );
    // The menu/listbox popup container must be excluded from the focus ring.
    expect(forContainers).toBeTruthy();
    expect(forContainers).toMatch(/role="listbox"/);
  });
});
