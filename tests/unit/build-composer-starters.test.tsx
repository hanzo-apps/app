/**
 * A starter pill is an INTENT, not a draft.
 *
 * Clicking "Realtime chat app" must SUBMIT that text through the composer's ONE
 * `submit` — the same path the send button and Enter use — and start the build.
 * Before the fix the click only called `setIdea(...)` and focused the textarea,
 * so the visitor had to press Enter a second time to actually go anywhere.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

const push = jest.fn();
const capture = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@hanzo/event/react", () => ({
  useAnalytics: () => ({ capture }),
}));

jest.mock("@hanzo/event", () => ({
  EVENTS: { BUILD_STARTED: "build_started" },
}));

import { BuildComposer } from "@/components/build-composer";

import { WithGui } from "../gui-wrapper";

// BuildComposer renders @hanzo/gui primitives, which read a createGui config at
// render and throw "Missing hanzogui config" without one. The app mounts it once
// in app/providers.tsx — see tests/gui-wrapper.
const renderComposer = (ui: React.ReactElement) => render(ui, { wrapper: WithGui });

const STARTERS = [
  "Internal admin dashboard",
  "AI support chatbot",
  "SaaS app with billing",
  "Marketplace with auth",
  "Realtime chat app",
];

/** Radix measures with the platform APIs jsdom lacks. */
beforeAll(() => {
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= () => {};
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
});

/** Radix menus open on pointerdown (absent in jsdom) or on Enter — use Enter. */
const openMenu = (trigger: HTMLElement) => fireEvent.keyDown(trigger, { key: "Enter" });

describe("BuildComposer starters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it("SUBMITS the starter text on one click, with the selected mode", () => {
    const onSubmit = jest.fn();
    renderComposer(<BuildComposer starters={STARTERS} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Realtime chat app" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    // Exact text, and the mode the user currently has selected (default Build).
    expect(onSubmit).toHaveBeenCalledWith("Realtime chat app", "build");
  });

  it("goes through the same submit a typed message uses (seed + /dev push)", () => {
    renderComposer(<BuildComposer starters={STARTERS} />);

    fireEvent.click(screen.getByRole("button", { name: "AI support chatbot" }));

    // The default submit pipeline ran: seed persisted, builder opened.
    expect(window.localStorage.getItem("initialPrompt")).toBe("AI support chatbot");
    expect(window.localStorage.getItem("initialMode")).toBe("build");
    expect(push).toHaveBeenCalledWith("/dev");
    expect(capture).toHaveBeenCalledWith("build_started", expect.objectContaining({ mode: "build" }));
  });

  it("submits with the mode the user picked — never silently changes it", () => {
    const onSubmit = jest.fn();
    renderComposer(<BuildComposer starters={STARTERS} onSubmit={onSubmit} />);

    openMenu(screen.getByRole("button", { name: /Build/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Plan/ }));
    fireEvent.click(screen.getByRole("button", { name: "Marketplace with auth" }));

    expect(onSubmit).toHaveBeenCalledWith("Marketplace with auth", "plan");
  });

  it("still submits a typed draft on Enter, and does not submit an empty one", () => {
    const onSubmit = jest.fn();
    renderComposer(<BuildComposer onSubmit={onSubmit} />);

    const box = screen.getByLabelText("Ask Hanzo to build");
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(box, { target: { value: "a todo app" } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("a todo app", "build");
  });

  it("submits the typed draft — not a click event — from the send button", () => {
    const onSubmit = jest.fn();
    renderComposer(<BuildComposer onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Ask Hanzo to build"), {
      target: { value: "a budget tracker" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start building" }));

    expect(onSubmit).toHaveBeenCalledWith("a budget tracker", "build");
  });
});
