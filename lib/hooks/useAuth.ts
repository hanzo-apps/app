"use client";

import { useCallback } from "react";
import { useIam } from "@hanzo/iam/react";
import { User } from "@/types";

/**
 * Auth hook for Hanzo IAM (HIP-0111).
 *
 * Thin facade over the canonical `@hanzo/iam` SDK (`useIam`). The SDK owns the
 * OAuth2 PKCE flow, token lifecycle, and userinfo; this hook only reshapes the
 * SDK user into the app `User` type and preserves the legacy `useAuth()` return
 * surface so existing consumers (`AuthProvider`, header, user-menu) are
 * untouched. No hand-rolled OAuth, no `/oauth/*`, no `/api/auth/me`.
 */
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

/** Map the SDK IAM user (OIDC claims) onto the app `User` shape.
 *  The SDK's runtime `user` is the OIDC userinfo response (sub/email/name/
 *  picture); its .d.ts mislabels it as the Casdoor admin User shape — type
 *  the claims here until the SDK fixes it (same cast as hooks/useUser.ts). */
function toAppUser(rawIamUser: ReturnType<typeof useIam>["user"]): User | null {
  const iamUser = rawIamUser as
    | { sub: string; email?: string; name?: string; picture?: string }
    | null;
  if (!iamUser) return null;
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
}

export function useAuth(): AuthState & {
  login: (redirectPath?: string, opts?: { signup?: boolean }) => void;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
} {
  const { user, isAuthenticated, isLoading, error, login: iamLogin, logout: iamLogout } = useIam();

  const login = useCallback(
    (redirectPath?: string, opts?: { signup?: boolean }) => {
      if (redirectPath && typeof window !== "undefined") {
        localStorage.setItem("redirectAfterLogin", redirectPath);
      }
      // PKCE S256 redirect to the canonical authorize endpoint (via discovery).
      // `signup:true` passes a hint so IAM opens its REGISTRATION screen (the
      // "Get started" funnel) rather than the sign-in form; returning users omit
      // it. IAM falls back to the login page if it doesn't honor the hint, so a
      // new user can still reach sign-up from there — never a dead end.
      void iamLogin(opts?.signup ? { additionalParams: { signup: "true" } } : undefined);
    },
    [iamLogin],
  );

  const logout = useCallback(async () => {
    iamLogout();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }, [iamLogout]);

  const refetch = useCallback(async () => {
    // SDK refreshes userinfo on token change; nothing to refetch by hand.
  }, []);

  return {
    user: toAppUser(user),
    isLoading,
    isAuthenticated,
    error: error ? error.message : null,
    login,
    logout,
    refetch,
  };
}
