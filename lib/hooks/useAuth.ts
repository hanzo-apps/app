"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { User } from "@/types";

const HANZO_ID_URL = process.env.NEXT_PUBLIC_HANZO_ID_URL || "https://hanzo.id";
const IAM_CLIENT_ID = process.env.NEXT_PUBLIC_IAM_CLIENT_ID || "";
const IAM_APP_NAME = process.env.NEXT_PUBLIC_IAM_APP_NAME || "hanzo";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

/**
 * Auth hook for Hanzo IAM-based authentication via hanzo.id.
 *
 * Returns the current user, loading state, and login/logout functions.
 * Fetches user data from /api/auth/me on mount and caches in state.
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });
  const fetched = useRef(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });

      if (!res.ok) {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: res.status === 401 ? null : "Failed to fetch user",
        });
        return;
      }

      const user: User = await res.json();
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: "Network error",
      });
    }
  }, []);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchUser();
  }, [fetchUser]);

  /**
   * Redirect to hanzo.id IAM OAuth login.
   * After login, IAM redirects back to redirect_uri with a code.
   */
  const login = useCallback((redirectPath?: string) => {
    const redirectUri = `${window.location.origin}/auth/callback`;
    if (redirectPath) {
      localStorage.setItem("redirectAfterLogin", redirectPath);
    }

    const params = new URLSearchParams({
      client_id: IAM_CLIENT_ID,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: "openid profile email",
      state: crypto.randomUUID(),
    });

    window.location.href = `${HANZO_ID_URL}/login/oauth/authorize?${params.toString()}`;
  }, []);

  /**
   * Clear auth state and cookie, then redirect to home.
   */
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // Best-effort logout
    }

    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });

    window.location.href = "/";
  }, []);

  return {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    login,
    logout,
    refetch: fetchUser,
  };
}
