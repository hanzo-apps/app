"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (redirectPath?: string, opts?: { signup?: boolean }) => void;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Auth context provider. Exposes Hanzo IAM auth state (HIP-0111) derived from
 * the canonical `@hanzo/iam` SDK via `useAuth()`. Must render inside
 * `IamClientProvider`.
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
