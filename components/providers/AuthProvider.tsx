"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (redirectPath?: string) => void;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Auth context provider. Wraps children with Hanzo IAM auth state.
 * Auto-fetches user on mount via /api/auth/me.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext value={auth}>
      {children}
    </AuthContext>
  );
}

/**
 * Access auth context. Must be used inside AuthProvider.
 */
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return ctx;
}
