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

/** Map the SDK IAM user (OIDC claims) onto the app `User` shape. */
function toAppUser(iamUser: ReturnType<typeof useIam>["user"]): User | null {
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
  login: (redirectPath?: string) => void;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
} {
  const { user, isAuthenticated, isLoading, error, login: iamLogin, logout: iamLogout } = useIam();

  const login = useCallback(
    (redirectPath?: string) => {
      if (redirectPath && typeof window !== "undefined") {
        localStorage.setItem("redirectAfterLogin", redirectPath);
      }
      // PKCE S256 redirect to the canonical authorize endpoint (via discovery).
      void iamLogin();
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
