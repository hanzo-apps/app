/**
 * A component's hook list may not depend on the session.
 *
 * `SidebarWallet` returns null while the session is still resolving, and it used
 * to call `useUserTheme()` BELOW that return. So the signed-out first paint ran
 * a shorter hook list than the paint that followed the session landing, and
 * React threw #310 ("rendered more hooks than during the previous render").
 * That throw happens during the commit, so an ErrorBoundary above the shell
 * catches it and the WHOLE page is replaced by "Something went wrong" — measured
 * live on hanzo.app/dev, which mounts this control through `AppShell`.
 *
 * The session flip (null → user) is the whole test: rendering either state alone
 * is green even with the bug, which is exactly why it shipped.
 */
import React from "react";
import { render } from "@testing-library/react";

const session: { user: unknown } = { user: null };

// Every stand-in for a hook CALLS a hook. React only detects a growing hook
// list against a previous render that had one, so a mock that called none would
// have hidden the very defect this pins — and it did, until the fix was reverted
// and the test stayed green.
jest.mock("@/hooks/useUser", () => ({
  useUser: () => {
    React.useState(0);
    return { user: session.user, logout: jest.fn() };
  },
}));
jest.mock("@/lib/org/client", () => ({
  useOrg: () => {
    React.useState(0);
    return { ctx: { orgs: [], currentOrg: "hanzo" } };
  },
}));
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/lib/billing/live-balance", () => ({
  useCloudBalance: () => {
    React.useState(0);
    return { phase: "ready", balance: { available_cents: 500 } };
  },
  spendableCents: () => 500,
}));
jest.mock("@hanzo/iam/react", () => ({
  useUserTheme: () => React.useState("dark")[0],
  resolveIdentity: (u: Record<string, unknown>) => ({ name: String(u.name ?? "") }),
  UserMenu: ({ identity }: { identity: { name: string } }) => (
    <div data-testid="user-menu">{identity.name}</div>
  ),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SidebarWallet } = require("@/components/SidebarWallet");

describe("SidebarWallet — the hook list is the same signed out and signed in", () => {
  it("survives the session landing after an empty first paint", () => {
    session.user = null;
    const view = render(<SidebarWallet collapsed={false} />);
    expect(view.queryByTestId("user-menu")).toBeNull();

    session.user = { name: "Zach Kelling", email: "z@hanzo.ai" };
    // With the hook below the early return this rerender throws React #310 and
    // takes the page with it.
    expect(() => view.rerender(<SidebarWallet collapsed={false} />)).not.toThrow();
    expect(view.getByTestId("user-menu").textContent).toBe("Zach Kelling");
  });
});
