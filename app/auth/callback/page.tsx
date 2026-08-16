"use client";

import { SizableText, XStack, YStack, H1, Paragraph } from '@hanzo/ui';
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useUser } from "@/hooks/useUser";
import { loginRedirectDestination } from "@/lib/auth/redirect";
import { isLinkPopupReturn, finishLinkPopup } from "@/lib/hanzo/iam";
import { HanzoLogo } from "@/components/HanzoLogo";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { accent, screen } from "@/lib/chrome";

const REDIRECT_KEY = "redirectAfterLogin";

/**
 * OAuth2 PKCE callback.
 *
 * Completes the hanzo.id exchange and redirects to the workspace the instant a
 * session is established — no manual click, no indefinite spinner. The previous
 * screen ran a decorative step timer and only ever navigated via a button the
 * user had to press; this drives the real `completeLogin()` promise and calls
 * `router.replace()` on resolve.
 *
 * ── Waiting is `LoadingScreen`, not a second one ─────────────────────────────
 *
 * This page used to draw its own: a 44px mark where the shared one is 48, a
 * `$7` gap where it is `$4`, two lines of copy where it is one, and a spinner
 * the shared one deliberately does not have. `LoadingScreen`'s own comment
 * already said it was the ONE page-level auth/loading gate; this page was the
 * holdout that made that untrue.
 *
 * The spinner is worth naming, because it is what the owner actually saw: a
 * still three-quarter ring beside "Signing you in…", on a screen whose entire
 * job is to say that something is happening. lucide ships only the arc, and the
 * rotation was an opt-in this site never took — as it turned out, nor did 79
 * others. `@hanzo/ui`'s `Spinner` binds the two, so the glyph cannot be
 * rendered still; this screen simply has no spinner to place, because the
 * mark's breathe already says it.
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

  if (!error) return <LoadingScreen>Signing you in…</LoadingScreen>;

  return (
    <XStack {...screen} backgroundColor="$background" paddingHorizontal="$5">
      <YStack width="100%" maxWidth={384} rowGap="$4.5">
        <XStack justifyContent="center" marginBottom="$3">
          <HanzoLogo size={48} />
        </XStack>

        <YStack>
          <H1 fontSize="$7" fontWeight="500" letterSpacing={-0.4} textAlign="center">
            Sign-in didn&apos;t complete
          </H1>
          <Paragraph marginTop="$2" fontSize="$3" color="$color11" textAlign="center">
            Your session couldn&apos;t be established. Please try signing in
            again.
          </Paragraph>
        </YStack>

        {/* `accent` carries its own foreground. This button spelled the fill by
            hand and then set the label to `$background` — near-black type on a
            20% grey pill, the exact 1.6:1 pairing lib/chrome documents. */}
        <Link href="/login">
          <XStack {...accent} width="100%" alignItems="center" justifyContent="center" borderRadius="$5" paddingHorizontal="$4.5" paddingVertical="$2.5">
            <SizableText fontSize="$3" fontWeight="500" color="$color">Back to sign in</SizableText>
          </XStack>
        </Link>
      </YStack>
    </XStack>
  );
}
