"use client";

import { useCallback, useMemo } from "react";
import { useIam, useIamIdentity, resolveIdentity } from "@hanzo/iam/react";

import { User } from "@/types";
import { storage } from "@/lib/hanzo/iam";
import { errorLogger, ErrorSeverity } from "@/lib/error-handling/error-logger";

/**
 * App-wide user hook (HIP-0111).
 *
 * Thin facade over the canonical `@hanzo/iam` SDK (`useIam`). The SDK owns the
 * OAuth2 PKCE flow, token lifecycle (sessionStorage), and userinfo. This hook
 * reshapes the SDK user into the app `User` type and preserves the legacy
 * `useUser()` return surface so the 20+ existing consumers stay untouched.
 *
 * - No hand-rolled OAuth, no `/oauth/*`, no `/v1/me` / `/v1/auth/me`, no
 *   second token store: `lib/iam.ts` is the server's one verified reader and
 *   this is the client's one view of the same session.
 * - `openLoginWindow` starts the PKCE redirect; `login*` helpers delegate to
 *   the SDK callback handler (kept for back-compat with the OAuth bridge).
 */
export const useUser = () => {
  const {
    user: rawIamUser,
    isAuthenticated,
    isLoading,
    login,
    logout: iamLogout,
    handleCallback,
  } = useIam();

  // The SDK's runtime `user` is the OIDC userinfo response (sub/email/name/
  // picture — see react.js setUser(getUserInfo())); its .d.ts mislabels it as
  // the IAM admin User shape. Type the claims here until the SDK fixes it.
  const iamUser = rawIamUser as
    | { sub: string; email?: string; name?: string; picture?: string }
    | null;

  // Who to SHOW. IAM's `name` claim carries the account username, which for
  // SSO/seeded accounts IS the uuid — reading it directly is how the header came
  // to render `e7d7fda0-…`. `resolveIdentity` walks every name claim, refuses
  // anything id-SHAPED whatever key it arrived under, and falls back to the
  // email's local part. One rule, reached two ways: the hook when the session
  // lives in IamProvider, the function on the same claims when it does not.
  const resolved = useIamIdentity();

  const user = useMemo<User | null>(() => {
    if (!iamUser) return null;
    const who = resolved ?? resolveIdentity(iamUser as Record<string, unknown>, {});
    const name = who?.name ?? "";
    return {
      id: iamUser.sub,
      name,
      fullname: name,
      initials: who?.initials ?? "",
      email: who?.email ?? iamUser.email,
      username: name,
      avatarUrl: who?.avatarUrl ?? iamUser.picture ?? "",
      isPro: false,
    };
  }, [iamUser, resolved]);

  const openLoginWindow = useCallback(async () => {
    // Through `storage`, which is null where the browser refuses one — a bare
    // `localStorage` here THROWS before `login()` is ever reached, so the
    // control does nothing at all rather than starting anything.
    if (typeof window !== "undefined") {
      storage?.setItem("redirectAfterLogin", window.location.pathname);
    }
    // PKCE S256 redirect to the canonical authorize endpoint (via discovery).
    await login();
  }, [login]);

  // Marketing-surface login (header/pricing): optional post-login destination +
  // a `signup` hint so IAM opens its REGISTRATION screen for the "Get started"
  // funnel. IAM falls back to sign-in if it doesn't honor the hint — never a
  // dead end. (Absorbed from the retired useAuth/AuthProvider stack; ONE facade.)
  const loginTo = useCallback(
    (redirectPath?: string, opts?: { signup?: boolean }) => {
      if (redirectPath) storage?.setItem("redirectAfterLogin", redirectPath);
      void login(
        opts?.signup ? { additionalParams: { signup: "true" } } : undefined,
      );
    },
    [login],
  );

  // Complete the OAuth2 PKCE callback: the SDK reads the full redirect URL
  // (`?code=&state=`), validates state, exchanges the code, and persists the
  // tokens. Returns whether a session was established so the /auth/callback
  // page can redirect deterministically (success) or surface an error.
  const completeLogin = useCallback(async (): Promise<boolean> => {
    try {
      const token = await handleCallback();
      return Boolean(token?.accessToken);
    } catch (e) {
      // Several unrelated faults end on the same sentence — a code already
      // redeemed, a verifier this browser never kept, a redirect_uri the issuer
      // refuses, an unreachable token endpoint — and the person is shown none
      // of it, so a screenshot cannot name one. The SDK says which; ship that.
      //
      // Two of those even share the SDK's wording ("OAuth state mismatch"), and
      // what separates them is whether this browser HAS a store: with one, the
      // verifier was spent by an earlier load of the same address; without one,
      // it never survived the redirect. So the store rides along as the fact
      // that tells the two apart.
      errorLogger.logError(
        e instanceof Error ? e : new Error(String(e)),
        ErrorSeverity.MEDIUM,
        {
          component: "auth/callback",
          action: "completeLogin",
          metadata: { storage: storage !== null },
        },
      );
      return false;
    }
  }, [handleCallback]);

  // Back-compat: the OAuth bridge used to deliver a bare `code`/`token`. Both
  // now resolve through the one SDK path. Args are accepted but ignored — the
  // SDK reads them from the URL. They return the same success signal.
  const loginFromCode = useCallback(
    async (_code?: string): Promise<boolean> => completeLogin(),
    [completeLogin]
  );

  const loginFromToken = useCallback(
    async (_token?: string, _expiresAt?: string): Promise<boolean> =>
      completeLogin(),
    [completeLogin]
  );

  /**
   * Sign out — which is ending the session at hanzo.id as well as clearing this
   * browser. The SDK's logout is both, and it finishes by NAVIGATING to the
   * issuer's end-session endpoint, because that is the only way the issuer's
   * `SameSite=Lax` cookie is ever presented to it.
   *
   * So nothing may navigate after it. Pushing a route and then reloading on a
   * timer landed AFTER the issuer hop and superseded it: the session at
   * hanzo.id survived, the next sign-in minted a code with no prompt, and the
   * person was signed straight back in — signing out appeared to do nothing.
   * Awaiting is the whole gesture; if the issuer cannot be reached the SDK has
   * already cleared this machine and published it, and the UI follows from that.
   */
  const logout = useCallback(async () => {
    await iamLogout();
  }, [iamLogout]);

  return {
    user,
    isAuthenticated,
    errCode: null as number | null,
    loading: isLoading,
    openLoginWindow,
    login: loginTo,
    completeLogin,
    loginFromCode,
    loginFromToken,
    logout,
  };
};
