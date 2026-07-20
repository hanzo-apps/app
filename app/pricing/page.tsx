"use client";

// Canonical plans page. One subscription = shared AI usage across every Hanzo
// app (builder, Hanzo Chat, the API at api.hanzo.ai). Monochrome design system:
// Header + SiteFooter + Reveal, true-black, Geist. Honest feature lists — no
// invented metrics. CTA reuses the canonical signup funnel (login signup hint →
// /dev), the same pattern as components/layout/header.tsx getStarted().

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";
import { EVENTS } from "@hanzo/capture";
import { useAnalytics } from "@hanzo/capture/react";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";
import Reveal from "@/components/landing/reveal";
import FaqSection from "@/components/marketing/faq-section";
import { billingFaq } from "@/components/marketing/faq-data";
import { useAuthContext } from "@/components/providers/AuthProvider";

interface Plan {
  id: string;
  name: string;
  price: number;
  tagline: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

// Honest, differentiated tiers. The differentiator is the size of the shared
// monthly usage allowance (bigger as you go up — true by construction) plus real
// capabilities (orgs/seats, support). No fabricated request/token counts.
const plans: Plan[] = [
  {
    id: "pro",
    name: "Pro",
    price: 20,
    tagline: "For individual builders shipping real apps.",
    features: [
      "Shared AI usage across every Hanzo app — builder, Chat, and API",
      "Zen and Enso models via the Hanzo LLM Gateway",
      "Unlimited projects, private by default",
      "Custom domains on published apps",
      "GitHub import and export",
      "Deploy to a live *.hanzo.app URL",
      "Community support",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: 100,
    tagline: "For teams building together in one org.",
    highlighted: true,
    badge: "Most popular",
    features: [
      "Everything in Pro",
      "A larger shared-usage allowance for your whole org",
      "Organization with multiple seats and one bill",
      "Shared projects across your team",
      "Owner and member roles",
      "Priority support",
    ],
  },
  {
    id: "max",
    name: "Max",
    price: 200,
    tagline: "For heavy usage and larger organizations.",
    features: [
      "Everything in Team",
      "The largest shared-usage allowance",
      "Org-wide shared billing and projects",
      "Priority support with faster response",
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const analytics = useAnalytics();
  const { isAuthenticated, login } = useAuthContext();

  useEffect(() => {
    analytics.capture(EVENTS.PRICING_VIEWED);
  }, [analytics]);

  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  // Turn a plan choice into a real subscription checkout. A signed-out visitor goes
  // through the canonical IAM signup funnel first (header.tsx getStarted()). A
  // signed-in user gets a Hanzo Commerce checkout session for that plan and is sent
  // straight to it — no more pricing↔billing ping-pong. If the plan isn't purchasable
  // yet (no SKU provisioned, or Commerce unconfigured), fall back to /billing rather
  // than dead-end, so the CTA always does something honest.
  const choosePlan = async (planId: string) => {
    analytics.capture(EVENTS.PLAN_CLICKED, { plan: planId });
    if (!isAuthenticated) {
      login("/dev", { signup: true });
      return;
    }
    setCheckingOut(planId);
    try {
      const res = await fetch("/api/commerce/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, billing: "monthly" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.url) {
        window.location.href = data.url as string; // hosted Commerce checkout
        return;
      }
      router.push("/billing"); // plan not purchasable yet — manage/credits there
    } catch {
      router.push("/billing");
    } finally {
      setCheckingOut(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-4 py-12 text-center sm:py-16 md:px-8 md:py-24">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-[-30%] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-white/[0.05] blur-[130px]" />
          </div>

          <div className="relative mx-auto max-w-3xl">
            <Reveal>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/55">
                  One plan · every Hanzo app
                </span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="text-balance text-4xl font-medium leading-[1.03] tracking-tight sm:text-5xl md:text-6xl">
                Shared AI usage,
                <br />
                across everything you build.
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-white/55 md:text-lg">
                One subscription powers AI across the app builder, Hanzo Chat, and
                the API at{" "}
                <code className="font-mono text-white/75">api.hanzo.ai</code> — from
                a single monthly allowance. Start for free; add a plan when you need
                more.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── Plans ────────────────────────────────────────────── */}
        <section className="px-4 pb-8 md:px-8">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, i) => (
              <Reveal key={plan.id} delay={i * 80}>
                <div
                  className={`relative flex h-full flex-col rounded-2xl border p-7 transition-colors ${
                    plan.highlighted
                      ? "border-white/25 bg-white/[0.04]"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-7">
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-black">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                  <p className="mt-1.5 min-h-[2.5rem] text-sm text-white/50">
                    {plan.tagline}
                  </p>

                  <div className="mt-5 flex items-baseline gap-1.5">
                    <span className="font-mono text-4xl font-medium tracking-tight">
                      ${plan.price}
                    </span>
                    <span className="text-sm text-white/45">/month</span>
                  </div>

                  <button
                    onClick={() => choosePlan(plan.id)}
                    disabled={checkingOut !== null}
                    className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-all disabled:opacity-60 ${
                      plan.highlighted
                        ? "bg-white text-black hover:bg-white/90"
                        : "border border-white/15 bg-white/[0.02] text-white hover:border-white/30 hover:bg-white/[0.05]"
                    }`}
                  >
                    {checkingOut === plan.id
                      ? "Starting checkout…"
                      : isAuthenticated
                        ? "Choose plan"
                        : "Get started"}
                    {checkingOut === plan.id ? null : <ArrowRight className="h-4 w-4" />}
                  </button>

                  <ul className="mt-7 space-y-3.5 border-t border-white/[0.06] pt-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/70" />
                        <span className="text-sm text-white/75">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Free-to-start note ───────────────────────────────── */}
        <section className="px-4 md:px-8">
          <Reveal className="mx-auto max-w-6xl">
            <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:flex-row sm:items-center md:p-7">
              <div>
                <h3 className="text-base font-medium text-white">
                  Start for free
                </h3>
                <p className="mt-1 text-sm text-white/50">
                  No card required to sign up. Create an account, explore the
                  builder, and subscribe when you&apos;re ready to ship with more
                  shared AI usage.
                </p>
              </div>
              <Link
                href="/dev"
                className="inline-flex flex-shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-white transition-all hover:border-white/30 hover:bg-white/[0.05]"
              >
                Open the builder
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </section>

        {/* ── Enterprise note ──────────────────────────────────── */}
        <section className="px-4 pt-8 md:px-8">
          <Reveal className="mx-auto max-w-6xl">
            <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:flex-row sm:items-center md:p-7">
              <div>
                <h3 className="text-base font-medium text-white">
                  Need more than Max?
                </h3>
                <p className="mt-1 text-sm text-white/50">
                  Volume usage, SSO, dedicated support, and custom terms for your
                  organization.
                </p>
              </div>
              <Link
                href="/enterprise"
                className="inline-flex flex-shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-white transition-all hover:border-white/30 hover:bg-white/[0.05]"
              >
                Talk to us
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </section>

        {/* ── Billing FAQ ──────────────────────────────────────── */}
        <FaqSection
          id="faq"
          eyebrow="Billing"
          title="Questions about pricing"
          items={billingFaq}
        />

        <section className="border-t border-white/[0.06] px-4 pb-4 text-center md:px-8">
          <p className="mt-8 text-sm text-white/45">
            More questions? Read the{" "}
            <Link
              href="/faq"
              className="text-white underline underline-offset-4 hover:text-white/80"
            >
              full FAQ
            </Link>{" "}
            or{" "}
            <Link
              href="/help"
              className="text-white underline underline-offset-4 hover:text-white/80"
            >
              get help
            </Link>
            .
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
