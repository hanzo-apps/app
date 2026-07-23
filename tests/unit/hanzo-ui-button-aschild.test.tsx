/**
 * @hanzo/ui Button `asChild` — runtime contract test.
 *
 * History: @hanzo/ui-shadcn ≤5.7.4 rendered [spinner-slot, children] into the
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
import { Button } from "@hanzo/ui";

describe("@hanzo/ui Button asChild (React.Children.only crash guard)", () => {
  it("renders an anchor child without throwing", () => {
    render(
      <Button asChild>
        <a href="/login">Sign in</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Sign in" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
  });

  it("merges the button styling onto the child (Slot semantics)", () => {
    render(
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
    render(<Button>Plain</Button>);
    expect(screen.getByRole("button", { name: "Plain" })).toBeInTheDocument();
  });
});
