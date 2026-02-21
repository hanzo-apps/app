/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCookie } from "react-use";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { User } from "@/types";
import MY_TOKEN_KEY from "@/lib/get-cookie-name";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { getAuthCookieOptions, getIframeCookieOptions, getRemoveCookieOptions } from "@/lib/cookie-options";
import { storeAuth, getStoredAuth, clearAuth, getStoredUser } from "@/lib/client-auth";


export const useUser = (initialData?: {
  user: User | null;
  errCode: number | null;
}) => {
  const cookie_name = MY_TOKEN_KEY();
  const client = useQueryClient();
  const router = useRouter();
  const [, setCookie] = useCookie(cookie_name);
  const [currentRoute, setCurrentRoute] = useCookie("hanzo-currentRoute");
  const [localUser, setLocalUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setLocalUser(storedUser);
      client.setQueryData(["user.me"], {
        user: storedUser,
        errCode: null,
      });
    }
  }, [client]);

  const { data: { user, errCode } = { user: localUser, errCode: null }, isLoading } =
    useQuery({
      queryKey: ["user.me"],
      queryFn: async () => {
        // First check localStorage
        const storedUser = getStoredUser();
        if (storedUser) {
          return { user: storedUser, errCode: null };
        }

        // If no stored user, try fetching from server (cookie-based auth)
        try {
          const res = await fetch("/api/me", { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              // Persist to localStorage for future use
              storeAuth("cookie-session", data.user, 7 * 24 * 60 * 60);
              setLocalUser(data.user);
              return { user: data.user, errCode: null };
            }
          }
        } catch (err) {
          console.warn("Failed to fetch user from server:", err);
        }

        return { user: initialData?.user || null, errCode: initialData?.errCode || null };
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true,
      retry: false,
      initialData: localUser
        ? { user: localUser, errCode: null }
        : initialData
        ? { user: initialData?.user, errCode: initialData?.errCode }
        : undefined,
      enabled: true,
    });

  const { data: loadingAuth } = useQuery({
    queryKey: ["loadingAuth"],
    queryFn: async () => false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
  const setLoadingAuth = (value: boolean) => {
    client.setQueryData(["setLoadingAuth"], value);
  };

  const openLoginWindow = async () => {
    setCurrentRoute(window.location.pathname, getIframeCookieOptions());
    return router.push("/login");
  };

  const loginFromCode = async (code: string) => {
    setLoadingAuth(true);
    if (loadingAuth) return;

    try {
      const res = await api.post("/auth", { code });

      if (res.data && res.data.access_token) {
        // Store in both localStorage and cookie for backward compatibility
        storeAuth(res.data.access_token, res.data.user, res.data.expires_in);
        setCookie(res.data.access_token, getAuthCookieOptions(res.data.expires_in));

        setLocalUser(res.data.user);
        client.setQueryData(["user.me"], {
          user: res.data.user,
          errCode: null,
        });

        toast.success("Login successful!");

        // Check for redirect after login
        const redirectPath = localStorage.getItem("redirectAfterLogin");
        if (redirectPath) {
          localStorage.removeItem("redirectAfterLogin");
          setTimeout(() => {
            router.push(redirectPath);
          }, 500);
        } else {
          // Default redirect to projects
          setTimeout(() => {
            router.push("/projects");
          }, 500);
        }
      } else {
        throw new Error("No access token received");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage = err?.response?.data?.error ||
                          err?.data?.message ||
                          err.message ||
                          "Authentication failed. Please check your Hugging Face OAuth settings.";
      toast.error(errorMessage);

      // Redirect to home after error
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } finally {
      setLoadingAuth(false);
    }
  };

  const logout = async () => {
    // Clear both localStorage and cookies
    clearAuth();
    setCookie("", getRemoveCookieOptions());
    setLocalUser(null);

    client.setQueryData(["user.me"], {
      user: null,
      errCode: null,
    });

    toast.success("Logout successful");
    router.push("/");

    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return {
    user,
    errCode,
    loading: isLoading || loadingAuth,
    openLoginWindow,
    loginFromCode,
    logout,
  };
};
