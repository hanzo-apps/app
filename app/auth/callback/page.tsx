"use client";

import { SizableText, XStack, YStack, H1, Paragraph } from '@hanzo/ui';
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useUser } from "@/hooks/useUser";
import { loginRedirectDestination } from "@/lib/auth/redirect";
import { isLinkPopupReturn, finishLinkPopup, storage } from "@/lib/hanzo/iam";
import { HanzoLogo } from "@/components/HanzoLogo";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { accent, screen } from "@/lib/chrome";

const REDIRECT_KEY = "redirectAfterLogin";

/** Where this sign-in was headed. Read once — the stash is spent on the way in. */
function destination(): string {
  const stored = storage?.getItem(REDIRECT_KEY) ?? null;
  storage?.removeItem(REDIRECT_KEY);
  return loginRedirectDestination(stored);
}

/**
 * OAuth2 PKCE callback.
 *
 * Completes the hanzo.id exchange and leaves for the workspace the instant a
 * session exists — no manual click, no indefinite spinner.
 *
 * ── The exchange and the session are different questions ─────────────────────
 *
 * An authorization code is single-use and its PKCE verifier is consumed before
 * the token POST, so only the FIRST load of a callback address can exchange
 * anything. Every later one — a pull-to-refresh on the waiting screen, a phone
 * restoring an evicted tab, any re-entry of that address — arrives at a spent
 * code and fails before it reaches the wire.
 *
 * That failure says nothing about whether the person is signed in, and usually
 * they are: the exchange it is repeating already worked. So the exchange runs
 * first, and the session is what decides — `isAuthenticated` covers both the
 * one this load established and the one an earlier load did. Only when the
 * provider has finished reading storage and found nothing is there anything
 * honest to report.
 *
 * The waiting is not cosmetic. `useIam` reads the session asynchronously, so
 * `isAuthenticated` is false on the first commit of every load; concluding from
 * it at mount is reading an answer from before the question was asked.
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
  const { completeLogin, isAuthenticated, loading } = useUser();
  /**
   * This load's own exchange, which outranks any session already here.
   *
   * Someone signed in as one account can authenticate at the issuer as another,
   * and then TWO answers exist at once: the session in storage, read on mount,
   * and the code in the address, still being redeemed. The session resolves
   * first — it is a storage read against a network round-trip — so leaving on
   * it would land the person back in the account they were trying to leave.
   * The code in hand is the newer statement of who this is, so nothing departs
   * until it has spoken.
   */
  const [exchange, setExchange] = useState<"running" | "done" | "failed">("running");
  const ran = useRef(false);
  const popup = useRef(false);
  const left = useRef(false);

  // Attempt the exchange, once.
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // Link-provider popup return: this callback is running INSIDE the popup
    // opened by `linkProvider()` (child window + our sentinel). The provider
    // link already happened server-side at IAM; signal the opener and close.
    // The popup shares the signed-in session, so it also claims this load
    // against the departure below, which would otherwise navigate the popup to
    // the dashboard instead of closing it.
    if (isLinkPopupReturn()) {
      popup.current = true;
      finishLinkPopup(!new URLSearchParams(window.location.search).has("error"));
      return;
    }

    const params = new URLSearchParams(window.location.search);

    // Hit directly without an auth response — nothing to complete.
    if (!params.has("code") && !params.has("access_token")) {
      router.replace("/login");
      return;
    }

    void completeLogin().then((ok) => setExchange(ok ? "done" : "failed"));
  }, [completeLogin, router]);

  // Leave on the session — whichever load established it, once this load's own
  // exchange has had its say.
  useEffect(() => {
    if (popup.current || left.current || exchange === "running" || !isAuthenticated) return;
    left.current = true;
    router.replace(destination());
  }, [exchange, isAuthenticated, router]);

  // Nothing is settled while the provider is still reading storage, and a
  // session that turns up makes the failed exchange a repeat rather than a
  // refusal. Both keep the waiting screen; only the third case is a failure.
  if (exchange !== "failed" || loading || isAuthenticated)
    return <LoadingScreen>Signing you in…</LoadingScreen>;

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
