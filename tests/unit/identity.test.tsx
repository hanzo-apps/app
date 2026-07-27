/**
 * A name is what a person answers to — never an id.
 *
 * IAM's OIDC `name` claim carries the Casdoor username, and for SSO/seeded
 * accounts that username IS the account uuid. `useUser` used to read
 * `name || email || sub`, so `name` won and the marketing header rendered
 * `e7d7fda0-4c53-4508-9d35-7ec892b7e5d7`. Accounts that happen to have a real
 * name (z@hanzo.ai is "Zach Kelling") hide the defect completely, which is why
 * it survived — so it is pinned here, on the shape that triggers it.
 *
 * `useIamIdentity` (i.e. `resolveIdentity`) is the fix: it walks every name claim
 * IAM may carry, refuses anything id-SHAPED whatever key it arrived under, and
 * falls back to the email's local part. These tests cover the two paths through
 * `useUser` — identity resolved, and identity absent — and neither may yield an id.
 */
import { renderHook } from "@testing-library/react";

const UUID = "e7d7fda0-4c53-4508-9d35-7ec892b7e5d7";
const ID_SHAPED = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const iam = {
  user: null as unknown,
  identity: null as unknown,
};

jest.mock("@hanzo/iam/react", () => ({
  // Only the session is faked. `resolveIdentity` is the REAL one — that rule is
  // exactly what is under test.
  resolveIdentity: jest.requireActual("@hanzo/iam/react").resolveIdentity,
  useIam: () => ({
    user: iam.user,
    isAuthenticated: !!iam.user,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    handleCallback: jest.fn(),
  }),
  useIamIdentity: () => iam.identity,
}));

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useUser } = require("@/hooks/useUser");

describe("useUser — the identity every surface renders", () => {
  beforeEach(() => {
    iam.user = { sub: UUID, email: "sso.person@hanzo.ai", name: UUID };
    iam.identity = null;
  });

  it("never shows the uuid IAM put in `name`", () => {
    const { result } = renderHook(() => useUser());
    expect(result.current.user?.name).not.toMatch(ID_SHAPED);
    expect(result.current.user?.fullname).not.toMatch(ID_SHAPED);
    expect(result.current.user?.username).not.toMatch(ID_SHAPED);
  });

  it("falls back to the email's local part, not to `sub`", () => {
    const { result } = renderHook(() => useUser());
    expect(result.current.user?.name).toBe("sso.person");
    expect(result.current.user?.name).not.toBe(UUID);
  });

  it("carries initials, so no surface computes charAt(0) off a uuid", () => {
    const { result } = renderHook(() => useUser());
    expect(result.current.user?.initials).toBe("SP");
    expect(result.current.user?.initials?.[0]).not.toBe("E");
  });

  it("prefers the resolved identity when IAM has a real name", () => {
    iam.identity = {
      name: "Zach Kelling",
      email: "z@hanzo.ai",
      avatarUrl: "https://cdn.hanzo.ai/z.png",
      initials: "ZK",
    };
    const { result } = renderHook(() => useUser());
    expect(result.current.user?.name).toBe("Zach Kelling");
    expect(result.current.user?.initials).toBe("ZK");
    expect(result.current.user?.avatarUrl).toBe("https://cdn.hanzo.ai/z.png");
  });

  it("keeps the id where an id belongs — on `id`, never on a label", () => {
    const { result } = renderHook(() => useUser());
    expect(result.current.user?.id).toBe(UUID);
  });

  it("has no user at all when IAM has none", () => {
    iam.user = null;
    const { result } = renderHook(() => useUser());
    expect(result.current.user).toBeNull();
  });
});
