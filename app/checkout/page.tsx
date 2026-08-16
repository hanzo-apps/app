"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { H1, Paragraph, Spinner, YStack } from "@hanzo/ui";
import { EVENTS } from "@hanzo/event";
import { useAnalytics } from "@hanzo/event/react";
import Header from "@/components/layout/header";
import { useUser } from "@/hooks/useUser";
import { usePlans, priceAt, usd } from "@/lib/plans";
import { billingReturnUrl, checkoutPath, goToCheckout } from "@/lib/pay";

/**
 * The one door from a plan the buyer has chosen to the card form.
 *
 * A plan is picked in several places and paid for in exactly one, so the hop
 * between the two lives here instead of at every button: this address holds the
 * choice while sign-in happens, reads the price from the catalog, says the
 * checkout started, and hands off to pay.
 *
 * That is what makes it the post-login destination. Sending a buyer back to the
 * price list after signing in asks them to choose a second time, and the second
 * choice is a fresh one. `/checkout?plan=pro` still means Pro on the way back.
 */
function Checkout() {
  const params = useSearchParams();
  const slug = params.get("plan") ?? "";
  const level = Number.parseInt(params.get("level") ?? "", 10) || 0;

  const { isAuthenticated, loading: authLoading, login } = useUser();
  const { plans, loading: plansLoading, error } = usePlans();
  const analytics = useAnalytics();
  const plan = plans.get(slug);

  // Both answers have to be in before this can act: signed-in decides whether
  // the next stop is IAM or pay, and the catalog holds the price. Acting on a
  // half-answer sends a signed-in buyer to sign in, or sells at no price.
  const settled = !authLoading && !plansLoading;
  const sellable = !!plan && !plan.contactSales && plan.price > 0;
  const left = useRef(false);

  useEffect(() => {
    if (!settled || left.current) return;

    if (!isAuthenticated) {
      left.current = true;
      // Back to THIS address afterwards, plan and all.
      login(checkoutPath({ plan: slug, level }), { signup: true });
      return;
    }
    if (!sellable || !plan) return;

    left.current = true;
    const amountUsd = priceAt(plan, level) / 100;
    // The hop to pay is a page unload, so the batch leaves as a beacon.
    analytics.capture(EVENTS.CHECKOUT_STARTED, { plan: plan.slug, level, amount: amountUsd });
    analytics.flush(true);
    goToCheckout({ amountUsd, plan: plan.slug, level, returnUrl: billingReturnUrl() });
  }, [settled, isAuthenticated, sellable, plan, slug, level, login, analytics]);

  // A plan nobody can buy at a price nobody published is the ONE case where
  // choosing again is the right answer, so it says which plan and offers the list.
  if (settled && isAuthenticated && !sellable) {
    return (
      <YStack alignSelf="center" maxWidth={560} paddingHorizontal="$5" paddingVertical="$12" gap="$4">
        <H1 fontSize="$9" fontWeight="500">
          {error ? "Plans are unavailable right now" : `We can't sell ${slug || "that plan"} here`}
        </H1>
        <Paragraph color="$color11">
          {error
            ? "The catalog did not answer, so there is no price to charge. Try again in a moment."
            : "It may be sold by a person, or no longer offered. Pick a plan and we will take you straight to checkout."}
        </Paragraph>
        <Link href="/pricing">
          <Paragraph textDecorationLine="underline">See plans</Paragraph>
        </Link>
      </YStack>
    );
  }

  return (
    <YStack alignSelf="center" alignItems="center" paddingVertical="$12" gap="$4">
      <Spinner />
      <Paragraph color="$color11">
        {plan ? `Taking you to checkout for ${plan.name} — ${usd(priceAt(plan, level))}/mo` : "Taking you to checkout…"}
      </Paragraph>
    </YStack>
  );
}

export default function CheckoutPage() {
  return (
    <YStack minHeight="100%" backgroundColor="$background">
      <Header />
      {/* The choice IS the query string, and reading one opts a page out of
          static prerendering unless a boundary marks it. */}
      <Suspense fallback={null}>
        <Checkout />
      </Suspense>
    </YStack>
  );
}
