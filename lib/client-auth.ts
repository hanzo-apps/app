// Client-side authentication using localStorage
import { User } from "@/types";

const TOKEN_KEY = "hanzo_token";
const USER_KEY = "hanzo-user";
const EXPIRES_KEY = "hanzo-auth-expires";

export interface StoredAuth {
  token: string;
  user: User;
  expiresAt: number;
}

// Store authentication data in localStorage
export const storeAuth = (token: string, user: User, expiresIn: number = 3600) => {
  if (typeof window === "undefined") return;

  const expiresAt = Date.now() + (expiresIn * 1000);

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(EXPIRES_KEY, expiresAt.toString());
};

// Get authentication data from localStorage
export const getStoredAuth = (): StoredAuth | null => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem(TOKEN_KEY);
  const userStr = localStorage.getItem(USER_KEY);
  const expiresStr = localStorage.getItem(EXPIRES_KEY);

  if (!token || !userStr) return null;

  try {
    const user = JSON.parse(userStr);
    const expiresAt = expiresStr ? parseInt(expiresStr, 10) : 0;

    // Check if token has expired
    if (expiresAt && Date.now() > expiresAt) {
      clearAuth();
      return null;
    }

    return { token, user, expiresAt };
  } catch (error) {
    console.error("Failed to parse stored auth:", error);
    clearAuth();
    return null;
  }
};

// Get just the token
export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const auth = getStoredAuth();
  return auth?.token || null;
};

// Get just the user
export const getStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const auth = getStoredAuth();
  return auth?.user || null;
};

// Clear authentication data
export const clearAuth = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXPIRES_KEY);
};

// Check if user is authenticated (client-side only)
export const isClientAuthenticated = (): boolean => {
  const auth = getStoredAuth();
  return auth !== null;
};