/**
 * The hero's example is BUILDABLE — the picture hands its prompt to the page.
 *
 * The frame builds an app that a visitor cannot have; a link under it drops
 * that example's opening prompt into the page's composer, focused, to be read
 * and edited and then sent by the same send button and Enter a typed idea uses.
 *
 * There is exactly ONE way to seed that draft — the starter chips' `ask` —
 * reached here through the composer's handle. This wires the two components
 * together the way `app/page.tsx` does, so the whole path is under test: click
 * the hero's link, read the composer's field. A second seeding path, or a link
 * that carries some paraphrase of the prompt rather than the prompt itself,
 * fails here.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useRef } from "react";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

jest.mock("@hanzo/event", () => ({ EVENTS: { BUILD_STARTED: "build_started" } }));
jest.mock("@hanzo/event/react", () => ({
  ...jest.requireActual("@hanzo/event/react"),
  useAnalytics: () => ({ capture: jest.fn() }),
}));

import { BuildComposer, type Composer } from "@/components/build-composer";
import HeroPreview from "@/components/landing/hero-preview";

import { WithGui } from "../gui-wrapper";

/** The landing's own wiring, minus the landing. */
function Fold() {
  const composer = useRef<Composer>(null);
  return (
    <>
      <HeroPreview ask={(prompt) => composer.current?.ask(prompt)} />
      <BuildComposer ref={composer} />
    </>
  );
}

describe("the hero's example can be built for real", () => {
  it("fills the page's composer with the example's own opening prompt", () => {
    render(<Fold />, { wrapper: WithGui });

    // jsdom has no IntersectionObserver, so the frame is settled on the first
    // storyline — which is the state a reduced-motion visitor sees too.
    fireEvent.click(screen.getByRole("button", { name: /Build Shift Board/ }));

    expect(screen.getByLabelText("Ask Hanzo to build")).toHaveValue(
      "Build a shift board for my coffee cart — staff claim open shifts",
    );
  });

  it("says it is a demo inside the frame, not in a caption under it", () => {
    render(<Fold />, { wrapper: WithGui });

    // The tag rides the address strip beside the app's name, so the admission
    // is on screen whenever the app is. The caption it replaced sat outside the
    // picture and edited nothing.
    expect(screen.getByText("Demo")).toBeInTheDocument();
    expect(screen.queryByText(/watch the builder build/)).toBeNull();
  });
});
