"use client";

// Support hub for hanzo.app. Monochrome design system (Header + SiteFooter +
// Reveal). Contact + channels are REAL only: support@hanzo.ai, the community
// Discord and status page that already ship in the repo footer, docs, FAQ, and
// GitHub. No invented channels.

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Mail,
  MessagesSquare,
  Activity,
  BookOpen,
  HelpCircle,
  Github,
} from "lucide-react";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";
import Reveal from "@/components/landing/reveal";

interface Channel {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  external?: boolean;
  cta: string;
}

const channels: Channel[] = [
  {
    icon: <Mail className="h-5 w-5" />,
    title: "Email support",
    description:
      "Reach the team directly for account, billing, or technical help. We read every message.",
    href: "mailto:support@hanzo.ai",
    external: true,
    cta: "support@hanzo.ai",
  },
  {
    icon: <MessagesSquare className="h-5 w-5" />,
    title: "Community",
    description:
      "Join the Hanzo Discord to ask questions, share what you built, and talk to other builders.",
    href: "https://discord.gg/hanzoai",
    external: true,
    cta: "Open Discord",
  },
  {
    icon: <Activity className="h-5 w-5" />,
    title: "System status",
    description:
      "Live status and incident history for Hanzo Cloud and the API. Check here first if something looks down.",
    href: "https://status.hanzo.ai",
    external: true,
    cta: "View status",
  },
  {
    icon: <HelpCircle className="h-5 w-5" />,
    title: "FAQ",
    description:
      "Quick answers on how the builder works, which models power it, custom domains, GitHub export, and billing.",
    href: "/faq",
    cta: "Read the FAQ",
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "Documentation",
    description:
      "Guides and references for the builder, Hanzo Cloud, and the LLM Gateway.",
    href: "/docs",
    cta: "Browse docs",
  },
  {
    icon: <Github className="h-5 w-5" />,
    title: "GitHub",
    description:
      "Hanzo is open on GitHub. File an issue, read the source, or import a repo into the builder.",
    href: "https://github.com/hanzoai",
    external: true,
    cta: "View on GitHub",
  },
];

export default function HelpPage() {
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
                  Support
                </span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="text-balance text-4xl font-medium leading-[1.03] tracking-tight sm:text-5xl md:text-6xl">
                How can we help?
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-white/55 md:text-lg">
                Start with the FAQ or docs for a fast answer, or reach the team
                directly at{" "}
                <a
                  href="mailto:support@hanzo.ai"
                  className="text-white underline underline-offset-4 hover:text-white/80"
                >
                  support@hanzo.ai
                </a>
                .
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── Channels ─────────────────────────────────────────── */}
        <section className="px-4 pb-8 md:px-8">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((c, i) => {
              const inner = (
                <div className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.03]">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/70">
                      {c.icon}
                    </span>
                    {c.external ? (
                      <ArrowUpRight className="h-4 w-4 text-white/30 transition-colors group-hover:text-white/60" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-white/30 transition-colors group-hover:text-white/60" />
                    )}
                  </div>
                  <h3 className="mt-5 text-base font-medium text-white">
                    {c.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-white/50">
                    {c.description}
                  </p>
                  <span className="mt-4 text-sm font-medium text-white/70 transition-colors group-hover:text-white">
                    {c.cta} →
                  </span>
                </div>
              );
              return (
                <Reveal key={c.title} delay={i * 60}>
                  {c.external ? (
                    <a href={c.href} target="_blank" rel="noopener noreferrer">
                      {inner}
                    </a>
                  ) : (
                    <Link href={c.href}>{inner}</Link>
                  )}
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ── Contact CTA ──────────────────────────────────────── */}
        <section className="px-4 py-16 md:px-8 md:py-24">
          <Reveal className="mx-auto max-w-6xl">
            <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-white/10 bg-white/[0.02] p-8 sm:flex-row sm:items-center md:p-10">
              <div>
                <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
                  Talk to a human.
                </h2>
                <p className="mt-2 max-w-md text-sm text-white/55 md:text-base">
                  Account, billing, or something the docs didn&apos;t cover — email
                  the team and we&apos;ll get back to you.
                </p>
              </div>
              <a
                href="mailto:support@hanzo.ai"
                className="inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-all hover:bg-white/90"
              >
                <Mail className="h-4 w-4" />
                Email support
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
