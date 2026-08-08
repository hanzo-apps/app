/**
 * The builder's voice — the two things hanzo.app owns.
 *
 * The conversation itself lives in `@hanzo/voice` and is tested there. What is
 * this app's to get right is the seam (the composer owns the machine, the
 * console bar draws it) and the proxy that lends it the caller's IAM session.
 */
import { useEffect } from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { offer, useMic } from "@/components/editor/ask-ai/mic";
import { sentence } from "@/components/editor/ask-ai/sentence";

const machine = () => ({
  state: "idle" as const,
  open: false,
  blocked: null,
  reason: null,
  refusal: null,
  toggle: jest.fn(),
  say: jest.fn(async () => {}),
  hush: jest.fn(),
});

function Composer({ voice }: { voice: ReturnType<typeof machine> | null }) {
  useEffect(() => (voice ? offer(voice) : undefined), [voice]);
  return null;
}

function Bar() {
  const voice = useMic();
  return <span data-testid="bar">{voice ? "mic" : "none"}</span>;
}

describe("the composer owns the voice; the bar draws it", () => {
  it("hands the bar the machine the composer offered", () => {
    render(
      <>
        <Composer voice={machine()} />
        <Bar />
      </>,
    );
    expect(screen.getByTestId("bar")).toHaveTextContent("mic");
  });

  it("takes it back when the composer goes — no mic without a conversation", () => {
    const view = render(
      <>
        <Composer voice={machine()} />
        <Bar />
      </>,
    );
    expect(screen.getByTestId("bar")).toHaveTextContent("mic");

    view.rerender(
      <>
        <Composer voice={null} />
        <Bar />
      </>,
    );
    expect(screen.getByTestId("bar")).toHaveTextContent("none");
  });

  it("keeps one voice — a second composer replaces the first, never joins it", () => {
    const first = machine();
    const second = machine();
    const withdraw = offer(first);
    offer(second);
    // The first composer's withdraw must not silence the second one's voice.
    withdraw();
    render(<Bar />);
    expect(screen.getByTestId("bar")).toHaveTextContent("mic");
  });
});

describe("a status line, said rather than shown", () => {
  it("reads the middots as pauses and the duration as a duration", () => {
    expect(sentence("Built · 3 files · 12s")).toBe("Built, 3 files, 12 seconds");
  });

  it("counts one second as one second", () => {
    expect(sentence("Built · 1 file · 1s")).toBe("Built, 1 file, 1 second");
  });

  it("leaves prose exactly as written", () => {
    const reply = "I added a contact form to the home page.";
    expect(sentence(reply)).toBe(reply);
  });
});
