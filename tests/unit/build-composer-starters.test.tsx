/**
 * A starter chip FILLS the composer — it does not submit.
 *
 * The starters crawl as an animated ticker, and a moving chip is hard to
 * "submit" by tap; the intent is to seed the draft so the visitor can read and
 * edit it, THEN send. Clicking a chip sets the composer's text (and focuses
 * it); the send button / Enter is what submits. This suite pins fill-then-send:
 * a click fills without submitting, and a subsequent send goes through the one
 * `submit` the send button and Enter use.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

const push = jest.fn();
const capture = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

// Override ONLY the hook this suite asserts on. @hanzo/ui's barrel reads
// ErrorBoundary off this module at load, so a mock that replaces the whole
// namespace takes the barrel down with it.
jest.mock("@hanzo/event/react", () => ({
  ...jest.requireActual("@hanzo/event/react"),
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

  it("FILLS the composer on click, and does not submit on its own", () => {
    const onSubmit = jest.fn();
    renderComposer(<BuildComposer starters={STARTERS} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Realtime chat app" }));

    // The draft is set for review; nothing is submitted yet.
    expect(screen.getByLabelText("Ask Hanzo to build")).toHaveValue("Realtime chat app");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders the starters as a seamless crawl — each twice, only one a button", () => {
    renderComposer(<BuildComposer starters={STARTERS} />);
    // The set is duplicated so the marquee (.hz-crawl) loops without a seam;
    // the second copy is decorative (aria-hidden), so it is NOT an accessible
    // button — screen readers and keyboard see each starter exactly once.
    expect(screen.getAllByText("Realtime chat app")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Realtime chat app" })).toHaveLength(1);
  });

  it("a filled starter then sends through the same submit a typed message uses (seed + /dev push)", () => {
    renderComposer(<BuildComposer starters={STARTERS} />);

    fireEvent.click(screen.getByRole("button", { name: "AI support chatbot" }));
    fireEvent.click(screen.getByRole("button", { name: "Start building" }));

    // The default submit pipeline ran: seed persisted, builder opened.
    expect(window.localStorage.getItem("initialPrompt")).toBe("AI support chatbot");
    expect(window.localStorage.getItem("initialMode")).toBe("build");
    expect(push).toHaveBeenCalledWith("/dev");
    expect(capture).toHaveBeenCalledWith("build_started", expect.objectContaining({ mode: "build" }));
  });

  it("sends the filled starter with the mode the user picked — never silently changes it", () => {
    const onSubmit = jest.fn();
    renderComposer(<BuildComposer starters={STARTERS} onSubmit={onSubmit} />);

    openMenu(screen.getByRole("button", { name: /Build/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Plan/ }));
    fireEvent.click(screen.getByRole("button", { name: "Marketplace with auth" }));
    fireEvent.click(screen.getByRole("button", { name: "Start building" }));

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

  // Regression guard for the IME fix: the Enter that ACCEPTS an open IME
  // candidate (Japanese/Chinese/Korean writers do this on every word) must not
  // submit the half-typed draft. Browsers signal that keystroke as keyCode 229
  // (Safari's only honest signal), key "Process", or isComposing — sends() from
  // @hanzo/ui/chat covers all three, and this asserts the composer routes
  // through it rather than a bare `key === 'Enter'` that would submit mid-word.
  it("does not submit while an IME candidate is open — the Enter belongs to the IME", () => {
    const onSubmit = jest.fn();
    renderComposer(<BuildComposer onSubmit={onSubmit} />);

    const box = screen.getByLabelText("Ask Hanzo to build");
    fireEvent.change(box, { target: { value: "日本語のアプリ" } });

    fireEvent.keyDown(box, { key: "Enter", keyCode: 229 });
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.keyDown(box, { key: "Process" });
    expect(onSubmit).not.toHaveBeenCalled();

    // Candidate committed, IME closed: a plain Enter now sends.
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("日本語のアプリ", "build");
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
