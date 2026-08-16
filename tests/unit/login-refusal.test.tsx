/**
 * /login — a browser that keeps nothing is told so, not sent on a round trip.
 *
 * The PKCE verifier is written before the redirect to hanzo.id and read back
 * when the browser returns. With nowhere to write it, the whole journey still
 * happens — the person reaches the IdP, types a password, authenticates — and
 * comes back to a callback with nothing to exchange. Measured against
 * production from Firefox with `dom.storage.enabled=false` (cookies left on, so
 * the IdP itself works): sign-in completed, no request ever reached the token
 * endpoint, and the screen read "Sign-in didn't complete".
 *
 * The refusal is a RENDER decision made after mount, because `storage` is null
 * on the server too — branching the markup on it directly serves the refusal to
 * everybody and then contradicts itself at hydration (measured: it did).
 */
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { WithGui } from "../gui-wrapper";

const login = jest.fn();
jest.mock("@hanzo/iam/react", () => ({ useIam: () => ({ login }) }));

// The store this page reads. `storage` is a module constant, so the mock is the
// only way to express the browser that refuses one.
const iam: { storage: Storage | null } = { storage: null };
jest.mock("@/lib/hanzo/iam", () => ({
  get storage() {
    return iam.storage;
  },
}));

// The marketing furniture below the decision — none of it participates in it.
jest.mock("@/components/landing/hero-preview", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/landing/lazy-section", () => ({
  __esModule: true,
  default: () => null,
}));

import LoginPage from "@/app/login/page";

const SENTENCE = /blocking site storage/;

beforeEach(() => {
  login.mockClear();
  window.history.replaceState({}, "", "/login");
});

test("no store: says which setting, and starts nothing", async () => {
  iam.storage = null;
  render(
    <WithGui>
      <LoginPage />
    </WithGui>,
  );

  await waitFor(() => expect(screen.getByText(SENTENCE)).toBeInTheDocument());
  expect(login).not.toHaveBeenCalled();
  expect(screen.queryByText(/Continue to Hanzo ID/)).not.toBeInTheDocument();
});

test("a store: leaves for the IdP, and says nothing about storage", async () => {
  iam.storage = window.localStorage;
  render(
    <WithGui>
      <LoginPage />
    </WithGui>,
  );

  await waitFor(() => expect(login).toHaveBeenCalled());
  expect(screen.queryByText(SENTENCE)).not.toBeInTheDocument();
});

test("a `?redirect=` deep link is stashed only where it will survive", async () => {
  iam.storage = null;
  window.history.replaceState({}, "", "/login?redirect=/dev");
  render(
    <WithGui>
      <LoginPage />
    </WithGui>,
  );
  await waitFor(() => expect(screen.getByText(SENTENCE)).toBeInTheDocument());

  // Nothing was written anywhere: the stash and the sign-in are one decision,
  // so a refused flow leaves no orphan behind for a later one to act on.
  expect(window.localStorage.getItem("redirectAfterLogin")).toBeNull();
});
