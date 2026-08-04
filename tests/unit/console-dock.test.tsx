/**
 * The console dock — contract tests.
 *
 * The bug these pin down: the builder's bottom strip was a plain `<footer>`. It
 * rendered state and nothing else — no separator, no cursor, no grip — so there
 * was no way to discover, let alone perform, a resize. Every assertion here is
 * about a thing you can DO to that bar, not about how it is spelled.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { useEffect } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { TooltipProvider } from '@hanzo/ui';
import { Console } from "@/components/editor/console";
import { offer } from "@/components/editor/ask-ai/mic";
import { BAR, COLLAPSE_AT, MIN_OPEN, resolveHeight, maxOpen } from "@/components/editor/console/dock";

import { WithGui } from "../gui-wrapper";

// jsdom has no PointerEvent and no pointer capture; the dock only needs the
// capture calls to be harmless and clientY to arrive.
beforeAll(() => {
  if (!("PointerEvent" in window)) {
    // Without this, testing-library falls back to a bare Event and drops
    // `clientY` — every drag would look like a zero-distance click.
    class Pointer extends MouseEvent {
      pointerId: number;
      constructor(type: string, init: MouseEventInit & { pointerId?: number } = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 1;
      }
    }
    (window as unknown as Record<string, unknown>).PointerEvent = Pointer;
  }
  Object.assign(Element.prototype, {
    setPointerCapture: jest.fn(),
    releasePointerCapture: jest.fn(),
    hasPointerCapture: jest.fn(() => false),
  });
  Element.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => window.localStorage.clear());

/**
 * The composer, reduced to the one thing the bar wants from it: a voice. The
 * bar draws a machine it does not own, so the seam is what gets tested.
 */
const machine = (toggle = jest.fn()) => ({
  state: "idle" as const,
  open: false,
  blocked: null,
  reason: null,
  toggle,
  say: async () => {},
  hush: () => {},
});

function Composer({ voice }: { voice: ReturnType<typeof machine> }) {
  useEffect(() => offer(voice), [voice]);
  return null;
}

/** The save state the bar is given. It is a PROP now — the bar used to print
 *  "Auto-saved" unconditionally, checked against nothing — so the readout this
 *  suite locates is whatever was passed in, named once here. */
const SAVE_TEXT = "Saved 9:15 PM";

const setup = (onToggleSidebar = jest.fn(), voice: ReturnType<typeof machine> | null = machine(), branch?: string) => {
  const view = render(
    // The app mounts one TooltipProvider in `app/providers.tsx`; the dock lives
    // under it, and the mic's tooltip needs it.
    <TooltipProvider>
      {voice && <Composer voice={voice} />}
      <Console
        isAiWorking={false}
        saveText={SAVE_TEXT}
        branch={branch}
        pageCount={1}
        sidebarCollapsed={false}
        onToggleSidebar={onToggleSidebar}
      />
    </TooltipProvider>,
    // The Console renders @hanzo/gui primitives, which read a createGui config
    // at render and throw "Missing hanzogui config" without one. The app mounts
    // it once in app/providers.tsx — see tests/gui-wrapper.
    { wrapper: WithGui },
  );
  const handle = screen.getByRole("separator", { name: /console/i });
  const dock = view.container.querySelector("[data-console]") as HTMLElement;
  return { ...view, handle, dock, onToggleSidebar, voice };
};

/** Height the dock is actually painting, in px. */
const heightOf = (dock: HTMLElement) => parseInt(dock.style.height, 10);

/**
 * The bar's two ends. The controls used to share one box; the panel toggle now
 * rides the left and the AI controls the right, so a cluster is named by the
 * edge it is pinned to.
 *
 * gui compiles `left="$2"` to `left: var(--c-space-2)`, and jsdom cannot resolve
 * a CSS variable — the emitted class is the only honest evidence available here
 * that an offset is set at all.
 */
const LEFT_OFFSET = "._l-c-space-2";
const RIGHT_OFFSET = "._r-c-space-2";

/**
 * The cluster a control rides in, found by the edge it is pinned to.
 *
 * A control's own parent is not a handle on it: @hanzo/ui wraps its Button in a
 * `display: contents` theme span, and @hanzo/voice adds its own, so the two sit
 * at different depths. Asking for the nearest pinned ancestor survives any
 * wrapper either of them grows later.
 */
const clusterFor = (control: HTMLElement, edge: string) =>
  control.closest(edge) as HTMLElement;

const dragTo = (handle: HTMLElement, from: number, to: number) => {
  fireEvent.pointerDown(handle, { button: 0, clientY: from, pointerId: 1 });
  fireEvent.pointerMove(handle, { clientY: to, pointerId: 1 });
  fireEvent.pointerUp(handle, { clientY: to, pointerId: 1 });
};

describe("the bar is a resize handle", () => {
  it("shows NO branch when the project has no repo", () => {
    // Most builder projects have none — only publish or an explicit git sync
    // creates one. The bar used to print a hardcoded "main" regardless, drawing
    // a version-control state that did not exist.
    const { container } = setup(jest.fn(), machine(), undefined);
    expect(container.textContent).not.toMatch(/\bmain\b/);
  });

  it("shows the REAL branch when the project is linked to a repo", () => {
    const { container } = setup(jest.fn(), machine(), "release/v2");
    expect(container.textContent).toContain("release/v2");
  });

  it("renders a real, focusable separator in the console chrome", () => {
    const { handle } = setup();
    expect(handle).toBeInTheDocument();
    expect(handle).toHaveAttribute("aria-orientation", "horizontal");
    expect(handle).toHaveAttribute("tabindex", "0");
    // Discoverable: the pointer must say "you can drag this". Read back through
    // the cascade, not off whichever class the styling layer spelled it with.
    expect(getComputedStyle(handle).cursor).toBe("row-resize");
    // And it must actually draw something — a grip, not just a cursor. Each
    // affordance is inert and invisible while the bar is at rest, is keyed to the
    // dock group's hover, focus AND press states — so it fades in for a mouse,
    // for a keyboard, and mid-drag alike — and hangs off the handle that IS that
    // group. Both halves have to be present: `$group-dock-hover={{
    // backgroundColor: "$color" }}` on a SizableText emits
    // `_bg-_groupdock-hover_color`, `group="dock"` on the handle emits the
    // `t_group_dock` those are selected against, and gui compiles the pair into
    // one `.t_group_dock:hover ._bg-_groupdock-hover_color`. A descendant class
    // with no host above it is dead markup — precisely what the Tailwind-era
    // `className="group/dock"` left behind — so `closest` is the assertion that
    // the two halves meet. Whether it then paints is a browser's business: jsdom
    // has no `:hover`, so that half belongs in an e2e, not here.
    const affordances = Array.from(handle.querySelectorAll("span"));
    expect(affordances.length).toBeGreaterThanOrEqual(2);
    for (const grip of affordances) {
      expect(getComputedStyle(grip).backgroundColor).toBe("transparent");
      expect(getComputedStyle(grip).pointerEvents).toBe("none");
      for (const state of ["hover", "focus", "press"]) {
        expect(grip.className).toContain(`_bg-_groupdock-${state}_color`);
      }
      expect(grip.closest(".t_group_dock")).toBe(handle);
    }
  });

  it("drags UP to make the console taller and back DOWN to shrink it", () => {
    const { handle, dock } = setup();
    expect(heightOf(dock)).toBe(BAR);

    // Pointer starts at y=900 and moves up to y=600 → 300px taller.
    dragTo(handle, 900, 600);
    const tall = heightOf(dock);
    expect(tall).toBeGreaterThan(MIN_OPEN);

    // Back down by 150px → shorter, but still open.
    dragTo(handle, 600, 750);
    const shorter = heightOf(dock);
    expect(shorter).toBeLessThan(tall);
    expect(shorter).toBeGreaterThanOrEqual(MIN_OPEN);
  });

  it("keeps a minimum height — it can never be dragged into nothing", () => {
    const { handle, dock } = setup();
    dragTo(handle, 900, 600);
    // Shove it far past the bottom of the screen.
    dragTo(handle, 600, 2000);
    // Either fully closed (the bar) or a readable body. Never a sliver between.
    expect([BAR]).toContain(heightOf(dock));
    expect(resolveHeight(COLLAPSE_AT, 1000)).toBe(BAR);
    expect(resolveHeight(COLLAPSE_AT + 1, 1000)).toBe(MIN_OPEN);
  });

  it("resizes from the keyboard", () => {
    const { handle, dock } = setup();
    fireEvent.keyDown(handle, { key: "ArrowUp" });
    expect(heightOf(dock)).toBeGreaterThan(BAR);
    const opened = heightOf(dock);
    fireEvent.keyDown(handle, { key: "ArrowUp" });
    expect(heightOf(dock)).toBeGreaterThan(opened);
  });

  it("never grows past its ceiling", () => {
    const { handle, dock } = setup();
    dragTo(handle, 900, -5000);
    expect(heightOf(dock)).toBeLessThanOrEqual(maxOpen(window.innerHeight));
  });
});

describe("click toggles the same height a drag sets", () => {
  it("opens on click and collapses on the next click", () => {
    const { handle, dock } = setup();
    fireEvent.pointerDown(handle, { button: 0, clientY: 900, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientY: 900, pointerId: 1 });
    expect(heightOf(dock)).toBeGreaterThan(BAR);
    expect(handle).toHaveAttribute("aria-expanded", "true");

    fireEvent.pointerDown(handle, { button: 0, clientY: 900, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientY: 900, pointerId: 1 });
    expect(heightOf(dock)).toBe(BAR);
    expect(handle).toHaveAttribute("aria-expanded", "false");
  });

  it("restores the height it was last DRAGGED to, not a hardcoded default", () => {
    const { handle, dock } = setup();
    dragTo(handle, 900, 620); // an unusual, deliberate size
    const dragged = heightOf(dock);
    expect(dragged).toBeGreaterThan(MIN_OPEN);

    // collapse …
    fireEvent.pointerDown(handle, { button: 0, clientY: 900, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientY: 900, pointerId: 1 });
    expect(heightOf(dock)).toBe(BAR);

    // … and click open again: exactly the dragged size comes back.
    fireEvent.pointerDown(handle, { button: 0, clientY: 900, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientY: 900, pointerId: 1 });
    expect(heightOf(dock)).toBe(dragged);
  });

  it("survives a remount — the size persists across navigations", () => {
    const first = setup();
    dragTo(first.handle, 900, 640);
    const dragged = heightOf(first.dock);
    first.unmount();

    const again = setup();
    expect(heightOf(again.dock)).toBe(dragged);
  });
});

describe("the bar is not labelled with a verb", () => {
  it("shows no Open / Hide text, but stays reachable by name and state", () => {
    const { dock, handle } = setup();
    expect(dock.textContent).not.toMatch(/\b(open|hide)\b/i);
    // Accessible without the words: a named separator carrying its state.
    expect(handle).toHaveAttribute("aria-label");
    expect(handle).toHaveAttribute("aria-expanded");
  });
});

describe("the workspace controls ride far right on the bar", () => {
  it("carries the chat/AI panel toggle, wired and stateful", () => {
    const onToggleSidebar = jest.fn();
    const { dock } = setup(onToggleSidebar);
    const ai = screen.getByRole("button", { name: /chat panel/i });
    expect(dock).toContainElement(ai);
    expect(ai).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(ai);
    expect(onToggleSidebar).toHaveBeenCalledTimes(1);
  });

  it("carries the composer's mic, and clicking it opens the conversation", () => {
    const { dock, voice } = setup();
    const mic = screen.getByRole("button", { name: /talk to hanzo/i });
    expect(dock).toContainElement(mic);
    fireEvent.click(mic);
    expect(voice!.toggle).toHaveBeenCalledTimes(1);
  });

  it("shows no mic at all until a composer offers its voice", () => {
    setup(jest.fn(), null);
    expect(screen.queryByRole("button", { name: /talk to hanzo/i })).toBeNull();
  });

  it("sits the panel toggle on the LEFT, by the pane it controls", () => {
    // The toggle shows and hides the LEFT chat pane, so it lives on the left: a
    // right-side control that collapsed the left pane read as belonging to the
    // preview and people could not find it.
    setup();
    const ai = screen.getByRole("button", { name: /chat panel/i });
    const cluster = clusterFor(ai, LEFT_OFFSET);
    expect(cluster).not.toBeNull();
    expect(getComputedStyle(cluster).position).toBe("absolute");
    // Its own cluster, at the other end of the bar from the AI controls.
    expect(cluster).not.toContainElement(
      screen.getByRole("button", { name: /talk to hanzo/i }),
    );
  });

  it("sits the mic and Enso on the RIGHT, mic first", () => {
    setup();
    const mic = screen.getByRole("button", { name: /talk to hanzo/i });
    const status = screen.getByText(SAVE_TEXT);

    const cluster = clusterFor(mic, RIGHT_OFFSET);
    expect(cluster).not.toBeNull();
    // It rides to the RIGHT of the status readout: after it in the bar, floated
    // over the bar rather than in flow, pinned to the bar's right edge.
    expect(cluster).not.toContainElement(status);
    expect(status.compareDocumentPosition(cluster)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(getComputedStyle(cluster).position).toBe("absolute");
    // Enso anchors into #enso-dock, ordered AFTER the mic (to its right).
    const dock = cluster.querySelector("#enso-dock");
    expect(dock).not.toBeNull();
    expect(mic.compareDocumentPosition(dock as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("clicking a control does not resize or toggle the dock", () => {
    const { dock } = setup();
    const before = heightOf(dock);
    fireEvent.click(screen.getByRole("button", { name: /chat panel/i }));
    expect(heightOf(dock)).toBe(before);
  });
});

describe("the header no longer holds the panel toggle", () => {
  it("moved it — the console owns it now, so the header cannot also", () => {
    const header = readFileSync(
      join(__dirname, "..", "..", "components/editor/header/index.tsx"),
      "utf8",
    );
    expect(header).not.toMatch(/onToggleSidebar/);
    expect(header).not.toMatch(/PanelLeftClose/);
  });
});
