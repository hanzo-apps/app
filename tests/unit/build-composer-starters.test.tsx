/**
 * A starter chip FILLS the composer — it does not submit.
 *
 * The starters crawl as an animated ticker, and a moving chip is hard to
 * "submit" by tap; the intent is to seed the draft so the visitor can read and
 * edit it, THEN send. Clicking a chip sets the composer's text (and focuses
 * it); the send button / Enter is what submits. This suite pins fill-then-send:
 * a click fills without submitting, and a subsequent send goes through the one
 * `submit` the send button and Enter use.
 *
 * And the chip has to be CATCHABLE. Hover pauses the crawl for a pointer; a
 * touch has no hover, so on a phone the chip kept sliding out from under the
 * thumb — the press landed on the track, nothing filled, and the send button
 * stayed disabled, which made the whole row dead by tap. A press now holds the
 * crawl still (`.hz-hold`, and `:active` in assets/globals.css for the press
 * itself), so the last group here pins the hold and the dense action row.
 */
import { render, screen, fireEvent, act } from "@testing-library/react";
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

  // The typewriter is not just decoration: a fully-typed example ARMS the send
  // button for the ~3s it rests on screen, so a reader who likes what they see
  // builds it in one tap without typing a word. This pins that the armed phrase
  // is what a bare send submits — the whole point of the read pause.
  it("arms the fully-typed example — a bare send builds THAT phrase in one tap", () => {
    jest.useFakeTimers();
    try {
      const onSubmit = jest.fn();
      renderComposer(<BuildComposer typewriter={["a test app"]} onSubmit={onSubmit} />);

      // Empty field, phrase mid-type → send is the generic "Start building",
      // with nothing to build yet. (gui renders a role=button div, so assert the
      // accessible name, not the native disabled attribute.)
      expect(screen.queryByRole("button", { name: "Build a test app" })).toBeNull();
      expect(screen.getByRole("button", { name: "Start building" })).toBeInTheDocument();

      // Past the type-in (400ms lead + 10 chars × 38ms) into the read hold.
      act(() => {
        jest.advanceTimersByTime(400 + 10 * 38 + 60);
      });

      // Armed: send now NAMES exactly what a bare tap will build, and does.
      const send = screen.getByRole("button", { name: "Build a test app" });
      fireEvent.click(send);
      expect(onSubmit).toHaveBeenCalledWith("a test app", "build");
    } finally {
      jest.useRealTimers();
    }
  });

  it("holds the crawl still on a press, and lets it go again", () => {
    jest.useFakeTimers();
    try {
      renderComposer(<BuildComposer starters={STARTERS} />);
      const chip = screen.getByRole("button", { name: "Realtime chat app" });
      const crawl = chip.closest(".hz-crawl") as HTMLElement;

      expect(crawl).toBeTruthy();
      expect(crawl.className).not.toContain("hz-hold");

      // A thumb reaches the chip: the row stops before the tap resolves, so the
      // element under the finger at pointerdown is still under it at pointerup.
      fireEvent.pointerDown(chip);
      expect(crawl.className).toContain("hz-hold");

      // ...and it is a HOLD, not a stop: the motif resumes on its own, so an
      // accidental brush does not kill the animation for the session.
      act(() => void jest.advanceTimersByTime(3000));
      expect(crawl.className).not.toContain("hz-hold");
    } finally {
      jest.useRealTimers();
    }
  });

  it("a press then a tap fills the draft and makes send WORK — the whole point", () => {
    // The defect this pins, end to end: the tap missed the moving chip, the
    // draft stayed empty, and send (`disabled={!idea.trim()}`) refused the
    // turn — so a phone could not submit a suggestion at all.
    const onSubmit = jest.fn();
    renderComposer(<BuildComposer starters={STARTERS} onSubmit={onSubmit} />);
    const chip = screen.getByRole("button", { name: "Internal admin dashboard" });
    const send = screen.getByRole("button", { name: "Start building" });

    // Empty draft: send refuses.
    fireEvent.click(send);
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.pointerDown(chip);
    fireEvent.click(chip);
    expect(screen.getByLabelText("Ask Hanzo to build")).toHaveValue("Internal admin dashboard");

    fireEvent.click(send);
    expect(onSubmit).toHaveBeenCalledWith("Internal admin dashboard", "build");
  });

  it("marks the action row dense — the field is the tap target, not the toolbar", () => {
    // `.hz-dense` is what exempts these five controls from the 44px coarse
    // floor (assets/globals.css, pinned by tests/unit/touch-target.test.ts).
    // Without the class the exemption matches nothing and the row silently
    // goes back to 44px slabs on every phone.
    renderComposer(<BuildComposer starters={STARTERS} />);
    const send = screen.getByRole("button", { name: "Start building" });
    const row = send.closest(".hz-dense");

    expect(row).toBeTruthy();
    for (const name of ["Add to this build", "Start building"]) {
      expect(row).toContainElement(screen.getByRole("button", { name }));
    }
  });
});
