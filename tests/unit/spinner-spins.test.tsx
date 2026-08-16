import { render } from "@testing-library/react";
import { Spinner } from "@hanzo/ui";
import { GuiProvider } from "@hanzo/gui";

import guiConfig from "@/lib/gui";

/**
 * ONE spinner, and it comes from the library.
 *
 * The local home existed because gui typed `size` as `'small' | 'large'` and
 * defaulted `color` to `#1976D2`, so it could answer none of the ~83 pixel call
 * sites here. `@hanzo/ui` 8.0.103 answers both — a number reaches the element as
 * width and height, and the arc's stroke is `currentColor` — so the reason is
 * gone and the copy with it.
 *
 * What this file can still prove is that the props arrive. The MOTION is a
 * browser fact and is asserted where a browser is: `@hanzo/ui`'s consumer gate
 * reads a non-`none` animation with an infinite iteration count off the running
 * page. jsdom has no animation clock, so asserting rotation here would prove
 * nothing — which is exactly how 82 of 83 call sites once rendered a still ring
 * under a green suite.
 */
describe("Spinner", () => {
  // gui throws `Missing theme.` for a component with no root theme context, so
  // the provider is structurally required — the same one app/providers.tsx mounts.
  const mount = (ui: React.ReactElement) =>
    render(
      <GuiProvider config={guiConfig} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    ).container;

  const spinner = (el: HTMLElement) => el.querySelector('[data-slot="spinner"]') as HTMLElement;

  it("is the library's, marked so a stylesheet and a test can find it", () => {
    expect(spinner(mount(<Spinner />))).not.toBeNull();
  });

  it("is decorative — the text beside it carries the meaning", () => {
    expect(spinner(mount(<Spinner />)).getAttribute("aria-hidden")).toBe("true");
  });

  it("takes a pixel size, and defaults to the inline register", () => {
    const box = (el: HTMLElement) => el.querySelector("div[style*='width']") as HTMLElement;
    expect(box(mount(<Spinner />)).style.width).toBe("16px");
    expect(box(mount(<Spinner size={32} />)).style.width).toBe("32px");
  });
});
