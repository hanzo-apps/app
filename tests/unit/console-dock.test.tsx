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
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { TooltipProvider } from "@/components/overlay";
import { Console } from "@/components/editor/console";
import { BAR, COLLAPSE_AT, MIN_OPEN, resolveHeight, maxOpen } from "@/components/editor/console/dock";

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
  // The mic only renders where the browser can actually listen.
  (window as unknown as Record<string, unknown>).SpeechRecognition = class {
    lang = "";
    continuous = false;
    interimResults = false;
    onresult = null;
    onerror = null;
    onend = null;
    start() {}
    stop() {}
    abort() {}
  };
});

beforeEach(() => window.localStorage.clear());

const setup = (onToggleSidebar = jest.fn()) => {
  const view = render(
    // The app mounts one TooltipProvider in `app/providers.tsx`; the dock lives
    // under it, and the mic's tooltip needs it.
    <TooltipProvider>
      <Console
        isAiWorking={false}
        pageCount={1}
        sidebarCollapsed={false}
        onToggleSidebar={onToggleSidebar}
      />
    </TooltipProvider>,
  );
  const handle = screen.getByRole("separator", { name: /console/i });
  const dock = view.container.querySelector("[data-console]") as HTMLElement;
  return { ...view, handle, dock, onToggleSidebar };
};

/** Height the dock is actually painting, in px. */
const heightOf = (dock: HTMLElement) => parseInt(dock.style.height, 10);

const dragTo = (handle: HTMLElement, from: number, to: number) => {
  fireEvent.pointerDown(handle, { button: 0, clientY: from, pointerId: 1 });
  fireEvent.pointerMove(handle, { clientY: to, pointerId: 1 });
  fireEvent.pointerUp(handle, { clientY: to, pointerId: 1 });
};

describe("the bar is a resize handle", () => {
  it("renders a real, focusable separator in the console chrome", () => {
    const { handle } = setup();
    expect(handle).toBeInTheDocument();
    expect(handle).toHaveAttribute("aria-orientation", "horizontal");
    expect(handle).toHaveAttribute("tabindex", "0");
    // Discoverable: the pointer must say "you can drag this".
    expect(handle.className).toContain("cursor-row-resize");
    // And it must actually draw something on hover — a grip, not just a cursor.
    expect(handle.querySelectorAll("span").length).toBeGreaterThanOrEqual(2);
    expect(handle.innerHTML).toContain("group-hover/dock:bg-foreground");
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

  it("carries the dictation mic", () => {
    const { dock } = setup();
    const mic = screen.getByRole("button", { name: /dictate/i });
    expect(dock).toContainElement(mic);
  });

  it("puts both of them to the right of the status readout", () => {
    const { dock } = setup();
    const ai = screen.getByRole("button", { name: /chat panel/i });
    const mic = screen.getByRole("button", { name: /dictate/i });
    const cluster = ai.parentElement as HTMLElement;
    expect(cluster).toContainElement(mic);
    expect(cluster.className).toContain("right-2");
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
