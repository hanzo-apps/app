"use client";

import { SizableText, XStack, YStack, H1, Paragraph } from '@hanzo/gui';
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { useUser } from "@/hooks/useUser";
import { loginRedirectDestination } from "@/lib/auth/redirect";
import { isLinkPopupReturn, finishLinkPopup } from "@/lib/hanzo/iam";
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
      // Link-provider popup return: this callback is running INSIDE the popup
      // opened by `linkProvider()` (child window + our sentinel). The provider
      // link already happened server-side at IAM; signal the opener and close.
      // Must run before the `isAuthenticated` branch — the popup shares the
      // signed-in session, so that branch would otherwise navigate the popup to
      // the dashboard instead of closing it.
      if (isLinkPopupReturn()) {
        const linkParams = new URLSearchParams(window.location.search);
        finishLinkPopup(!linkParams.has("error"));
        return;
      }

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
    <XStack minHeight="100%" alignItems="center" justifyContent="center" backgroundColor="$background" paddingHorizontal="$5">
      <YStack width="100%" maxWidth={384}>
        <XStack justifyContent="center" marginBottom="$7">
          <HanzoLogo size={44} color="var(--foreground)" />
        </XStack>

        {error ? (
          <YStack rowGap="$4.5">
            <div>
              <H1 fontSize="$7" fontWeight="500" letterSpacing={-0.4} textAlign="center">
                Sign-in didn&apos;t complete
              </H1>
              <Paragraph marginTop="$2" fontSize="$3" color="$color11" textAlign="center">
                Your session couldn&apos;t be established. Please try signing in
                again.
              </Paragraph>
            </div>
            <Link
              href="/login"
            ><XStack width="100%" alignItems="center" justifyContent="center" borderRadius="$5" backgroundColor="$color12" paddingHorizontal="$4.5" paddingVertical="$2.5" hoverStyle={{ backgroundColor: "$color12" }}>
              <SizableText fontSize="$3" fontWeight="500" color="$background">Back to sign in</SizableText>
            </XStack></Link>
          </YStack>
        ) : (
          <YStack rowGap="$3">
            <XStack alignItems="center" justifyContent="center" gap="$2.5">
              <Loader2 size={16} />
              <SizableText fontSize="$3" color="$color">Signing you in…</SizableText>
            </XStack>
            <Paragraph fontSize="$1" color="$color11" textAlign="center">
              Completing secure sign-in with Hanzo
            </Paragraph>
          </YStack>
        )}
      </YStack>
    </XStack>
  );
}
