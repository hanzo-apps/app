import { render } from "@testing-library/react";

import { Spinner } from "@/components/ui/spinner";

/**
 * The spinner carries its own motion — runtime contract.
 *
 * A source scan (ui-centralization, "Spinners spin") can prove that no call site
 * reaches for the raw lucide glyph and that `components/ui/spinner` is the only
 * file naming `.spin`. It cannot prove the class actually reaches the DOM: make
 * it conditional, or spell it in a prop the component drops, and every scan
 * still passes while every spinner in the app goes still again — which is the
 * exact failure this component exists to end (82 of 83 call sites had declined
 * the opt-in `.spin` was before it).
 *
 * The other half of the claim is CSS, and it is verified in the browser rather
 * than here: on the running app `.spin` computes to `spin 1s linear infinite`
 * against `@keyframes spin { 100% { transform: rotate(360deg) } }`, and a probe
 * element carrying the class measured 0° → -104.8° between two samples. jsdom
 * has no animation clock, so asserting rotation here would prove nothing.
 */
describe("Spinner", () => {
  it("renders an arc that carries the motion class", () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector("svg");

    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("class")).toContain("spin");
  });

  it("is decorative — the text beside it carries the meaning", () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("takes its size, and defaults to the inline register", () => {
    const def = render(<Spinner />).container.querySelector("svg")!;
    expect(def.getAttribute("width")).toBe("16");

    const big = render(<Spinner size={32} />).container.querySelector("svg")!;
    expect(big.getAttribute("width")).toBe("32");
  });
});
