"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useIam } from "@hanzo/iam/react";

import { User } from "@/types";

/**
 * App-wide user hook (HIP-0111).
 *
 * Thin facade over the canonical `@hanzo/iam` SDK (`useIam`). The SDK owns the
 * OAuth2 PKCE flow, token lifecycle (sessionStorage), and userinfo. This hook
 * reshapes the SDK user into the app `User` type and preserves the legacy
 * `useUser()` return surface so the 20+ existing consumers stay untouched.
 *
 * - No hand-rolled OAuth, no `/oauth/*`, no `/api/me` / `/api/auth/me`,
 *   no localStorage token store.
 * - `openLoginWindow` starts the PKCE redirect; `login*` helpers delegate to
 *   the SDK callback handler (kept for back-compat with the OAuth bridge).
 */
export const useUser = (initialData?: {
  user: User | null;
  errCode: number | null;
}) => {
  const router = useRouter();
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
  // the Casdoor admin User shape. Type the claims here until the SDK fixes it.
  const iamUser = rawIamUser as
    | { sub: string; email?: string; name?: string; picture?: string }
    | null;

  const user = useMemo<User | null>(() => {
    if (!iamUser) return initialData?.user ?? null;
    const name = iamUser.name || iamUser.email || iamUser.sub;
    return {
      id: iamUser.sub,
      name,
      fullname: name,
      email: iamUser.email,
      username: iamUser.name,
      avatarUrl: iamUser.picture || "",
      isPro: false,
    };
  }, [iamUser, initialData?.user]);

  const openLoginWindow = useCallback(async () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("redirectAfterLogin", window.location.pathname);
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
      if (redirectPath && typeof window !== "undefined") {
        localStorage.setItem("redirectAfterLogin", redirectPath);
      }
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
    } catch {
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

  const logout = useCallback(async () => {
    iamLogout();
    router.push("/");
    if (typeof window !== "undefined") {
      setTimeout(() => window.location.reload(), 300);
    }
  }, [iamLogout, router]);

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
