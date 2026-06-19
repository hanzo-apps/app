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
  const { user: iamUser, isLoading, login, logout: iamLogout, handleCallback } = useIam();

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

  // Back-compat: the OAuth bridge used to deliver a bare `code`/`token`. The
  // canonical callback (/auth/callback) now drives `handleCallback()` over the
  // full redirect URL with PKCE. These remain as thin delegations so any
  // residual caller keeps compiling and resolves through the one SDK path.
  const loginFromCode = useCallback(async () => {
    try {
      await handleCallback();
    } catch {
      /* handled by the SDK error state */
    }
  }, [handleCallback]);

  const loginFromToken = useCallback(async () => {
    try {
      await handleCallback();
    } catch {
      /* handled by the SDK error state */
    }
  }, [handleCallback]);

  const logout = useCallback(async () => {
    iamLogout();
    router.push("/");
    if (typeof window !== "undefined") {
      setTimeout(() => window.location.reload(), 300);
    }
  }, [iamLogout, router]);

  return {
    user,
    errCode: null as number | null,
    loading: isLoading,
    openLoginWindow,
    loginFromCode,
    loginFromToken,
    logout,
  };
};
