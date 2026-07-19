"use client";

// Full FAQ for hanzo.app. Monochrome design system (Header + SiteFooter +
// Reveal). Real, answerable questions only — product + billing groups come from
// the shared faq-data module (DRY: /pricing renders the billing subset).

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";
import Reveal from "@/components/landing/reveal";
import FaqSection from "@/components/marketing/faq-section";
import { productFaq, billingFaq } from "@/components/marketing/faq-data";

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-4 py-20 text-center md:px-8 md:py-28">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-[-30%] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-white/[0.05] blur-[130px]" />
          </div>

          <div className="relative mx-auto max-w-3xl">
            <Reveal>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/55">
                  FAQ
                </span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="text-balance text-4xl font-medium leading-[1.03] tracking-tight sm:text-5xl md:text-6xl">
                Questions, answered.
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-white/55 md:text-lg">
                How hanzo.app works, what powers it, and how billing runs. If your
                question isn&apos;t here,{" "}
                <Link
                  href="/help"
                  className="text-white underline underline-offset-4 hover:text-white/80"
                >
                  reach the team
                </Link>
                .
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── Product ──────────────────────────────────────────── */}
        <FaqSection
          id="product"
          eyebrow="The product"
          title="Building & shipping"
          items={productFaq}
        />

        {/* ── Billing ──────────────────────────────────────────── */}
        <div className="border-t border-white/[0.06]">
          <FaqSection
            id="billing"
            eyebrow="Billing"
            title="Plans & usage"
            items={billingFaq}
          />
        </div>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section className="border-t border-white/[0.06] px-4 py-20 text-center md:px-8 md:py-24">
          <Reveal className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
              Ready to build?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-white/55">
              Describe an app and ship it live on Hanzo Cloud — database, auth,
              and AI already wired in.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/dev"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-all hover:bg-white/90"
              >
                Start building
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.02] px-6 py-3 text-sm font-medium text-white transition-all hover:border-white/30 hover:bg-white/[0.05]"
              >
                See pricing
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
