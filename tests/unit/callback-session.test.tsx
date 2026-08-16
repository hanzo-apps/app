/**
 * /auth/callback — what the screen is allowed to say.
 *
 * The exchange and the session are two different questions, and this page
 * answers the second one. An OAuth `code` is single-use and its PKCE verifier is
 * consumed before the token POST, so the SECOND load of a callback URL — a
 * pull-to-refresh on the "Signing you in…" screen, a phone restoring an evicted
 * tab, any re-entry of that address — cannot exchange anything. Measured on
 * production from an Android profile: the reload rendered "Sign-in didn't
 * complete" with no token request on the wire, while `hanzo_iam_access_token`
 * sat in storage and /dashboard opened signed in on the very next navigation.
 *
 * `useIam`'s session read is ASYNC, so `isAuthenticated` is false on the first
 * commit of every load. A decision taken once, at mount, therefore reads "no
 * session" from a provider that has not looked yet — which is why the failing
 * branch has to wait for that answer instead of racing it.
 */
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { WithGui } from "../gui-wrapper";

const replace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

// The one facade the page reads. Driven from a mutable record so a test can
// re-render with the answer the provider settles on, which is the whole point.
const session = {
  completeLogin: jest.fn(async () => false),
  isAuthenticated: false,
  loading: true,
};
jest.mock("@/hooks/useUser", () => ({ useUser: () => session }));

import AuthCallback from "@/app/auth/callback/page";

const FAILED = /Sign-in didn't complete/;

beforeEach(() => {
  replace.mockClear();
  session.completeLogin = jest.fn(async () => false);
  session.isAuthenticated = false;
  session.loading = true;
  window.history.replaceState({}, "", "/auth/callback?code=spent&state=abc");
});

test("a spent code with a session already in hand goes in, and never says sign-in failed", async () => {
  const view = render(
    <WithGui>
      <AuthCallback />
    </WithGui>,
  );

  // The provider has not read the session yet — nothing may be concluded.
  await waitFor(() => expect(session.completeLogin).toHaveBeenCalled());
  expect(screen.queryByText(FAILED)).not.toBeInTheDocument();

  // It settles: there IS a session — this callback was already redeemed.
  session.loading = false;
  session.isAuthenticated = true;
  view.rerender(
    <WithGui>
      <AuthCallback />
    </WithGui>,
  );

  await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  expect(screen.queryByText(FAILED)).not.toBeInTheDocument();
});

test("a failed exchange with no session says so", async () => {
  const view = render(
    <WithGui>
      <AuthCallback />
    </WithGui>,
  );
  await waitFor(() => expect(session.completeLogin).toHaveBeenCalled());

  // It settles: no session anywhere. This is the honest failure.
  session.loading = false;
  session.isAuthenticated = false;
  view.rerender(
    <WithGui>
      <AuthCallback />
    </WithGui>,
  );

  await waitFor(() => expect(screen.getByText(FAILED)).toBeInTheDocument());
  expect(replace).not.toHaveBeenCalled();
});

test("a live exchange is what the happy path still runs on", async () => {
  session.completeLogin = jest.fn(async () => true);
  const view = render(
    <WithGui>
      <AuthCallback />
    </WithGui>,
  );
  await waitFor(() => expect(session.completeLogin).toHaveBeenCalled());

  session.loading = false;
  session.isAuthenticated = true;
  view.rerender(
    <WithGui>
      <AuthCallback />
    </WithGui>,
  );

  await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  expect(screen.queryByText(FAILED)).not.toBeInTheDocument();
});
