/**
 * A popup CONTAINER does not wear the focus ring.
 *
 * The one keyboard-focus law (globals.css) rings anything tab-reachable:
 * `:is(a, button, summary, [role="button"], [tabindex]):focus-visible` gets a
 * 2px `--focus-ring` (72% white) held 2px OUTSIDE the box. A dropdown opens by
 * moving focus onto its content, which Radix gives `tabindex="-1"` and
 * `role="menu"` — so that rule caught the whole panel and painted a garish white
 * outline around an opened menu (measured live: the open menu's own
 * `outline: rgba(255,255,255,0.72) solid 2px`). The ring belongs on the ITEMS the
 * arrow keys move between, never on the transient shell.
 *
 * This pins the carve-out. It would regress invisibly: nothing type-checks or
 * throws when a container silently starts ringing again — it is a look, seen only
 * by opening the menu, exactly the failure the sibling css tests exist to stop.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CSS = readFileSync(join(__dirname, "..", "..", "assets", "globals.css"), "utf8");

/** Collapse whitespace so assertions read against normalized CSS text. */
const flat = CSS.replace(/\s+/g, " ");

describe("menu focus ring", () => {
  it("the one focus law still rings tab-reachable controls via --focus-ring", () => {
    // The rule the carve-out narrows — if this changes shape, revisit the carve-out.
    expect(flat).toMatch(
      /:is\(a, button, summary, \[role="button"\], \[tabindex\]\):focus-visible \{ outline: 2px solid var\(--focus-ring\)/,
    );
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
