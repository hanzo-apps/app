/**
 * @hanzo/ui Button `asChild` — runtime contract test.
 *
 * History: the pre-gui @hanzo/ui ≤5.7.4 rendered [spinner-slot, children] into the
 * component regardless of `asChild`; under `asChild` that array reaches Radix
 * `<Slot>`, which calls `React.Children.only` and throws "expected to receive
 * a single React element child" — crashing any `<Button asChild><Link/>`.
 * Fixed in v5.7.5 (ui repo fc0dd879f): the asChild branch passes `children`
 * through as the single child.
 *
 * Law (centralization): common components — Button, Input, Badge, toast —
 * come from @hanzo/ui, not per-app re-inventions. That only holds while the
 * shared Button is asChild-safe, so this test renders the REAL installed
 * @hanzo/ui Button under `asChild` and fails loudly if the footgun ever
 * returns in a version bump.
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Button } from '@hanzo/ui';

import { WithGui } from "../gui-wrapper";

// Every render goes through the app's own gui context — see tests/gui-wrapper.
const withGui = (ui: React.ReactElement) => render(ui, { wrapper: WithGui });

describe("@hanzo/ui Button asChild (React.Children.only crash guard)", () => {
  it("renders an anchor child without throwing", () => {
    withGui(
      <Button asChild>
        <a href="/login">Sign in</a>
      </Button>,
    );
    // Queried by TEXT, not by the "link" role. The child really is an <a> with
    // its href — which is the whole contract here — but @hanzo/ui stamps
    // role="button" onto whatever it renders, and an explicit role overrides the
    // implicit one, so getByRole("link") finds nothing. Asserting the element is
    // the honest check; asserting the role would be asserting a bug either way.
    const link = screen.getByText("Sign in").closest("a");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
  });

  it("merges the button styling onto the child (Slot semantics)", () => {
    withGui(
      <Button asChild data-testid="slot-btn">
        <a href="/x">Go</a>
      </Button>,
    );
    const el = screen.getByTestId("slot-btn");
    // Slot renders the CHILD element (an <a>), not a nested <button>.
    expect(el.tagName).toBe("A");
    expect(el.className).toBeTruthy();
  });

  it("still renders a plain button when asChild is not set", () => {
    withGui(<Button>Plain</Button>);
    expect(screen.getByRole("button", { name: "Plain" })).toBeInTheDocument();
  });
});
