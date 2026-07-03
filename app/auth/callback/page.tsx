"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { useUser } from "@/hooks/useUser";
import { loginRedirectDestination } from "@/lib/auth/redirect";
import { HanzoLogo } from "@/components/HanzoLogo";

const REDIRECT_KEY = "redirectAfterLogin";

/**
 * OAuth2 PKCE callback.
 *
 * Completes the hanzo.id exchange and redirects to the workspace the instant a
 * session is established — no manual click, no indefinite spinner. The previous
 * screen ran a decorative step timer and only ever navigated via a button the
 * user had to press; this drives the real `completeLogin()` promise and calls
 * `router.replace()` on resolve.
 */
export default function AuthCallback() {
  const router = useRouter();
  const { completeLogin, isAuthenticated } = useUser();
  const [error, setError] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const destination = () => {
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(REDIRECT_KEY);
        window.localStorage.removeItem(REDIRECT_KEY);
      } catch {
        /* storage unavailable */
      }
      return loginRedirectDestination(stored);
    };

    (async () => {
      // Already signed in (revisit / token already exchanged): go straight in.
      if (isAuthenticated) {
        router.replace(destination());
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const hasCallback = params.has("code") || params.has("access_token");

      // Hit directly without an auth response — nothing to complete.
      if (!hasCallback) {
        router.replace("/login");
        return;
      }

      const ok = await completeLogin();
      if (ok) {
        router.replace(destination());
      } else {
        setError(true);
      }
    })();
  }, [completeLogin, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-10">
          <HanzoLogo className="w-11 h-11 text-white" />
        </div>

        {error ? (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Sign-in didn&apos;t complete
              </h1>
              <p className="mt-2 text-sm text-white/50">
                Your session couldn&apos;t be established. Please try signing in
                again.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2.5 text-white/70">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Signing you in…</span>
            </div>
            <p className="text-xs text-white/35">
              Completing secure sign-in with Hanzo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
