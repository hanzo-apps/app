"use client";

// Docs hub for hanzo.app. Monochrome design system (Header + SiteFooter + Reveal,
// true-black, Geist). Links REAL destinations only — no fabricated view counts,
// no invented "most viewed" cards. The builder quick-start is written inline
// (describe → generate → publish). Every external link resolves to a real page.

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Terminal,
  LayoutGrid,
  Github,
  GraduationCap,
  Wand2,
} from "lucide-react";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";
import Reveal from "@/components/landing/reveal";

interface Dest {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  external?: boolean;
  cta: string;
}

// Real, resolvable destinations only.
const destinations: Dest[] = [
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "Full documentation",
    description:
      "The complete Hanzo docs — Cloud, Base, IAM, KMS, and the LLM Gateway, with guides and references.",
    href: "https://docs.hanzo.ai",
    external: true,
    cta: "Read the docs",
  },
  {
    icon: <Terminal className="h-5 w-5" />,
    title: "LLM Gateway & API",
    description:
      "One OpenAI-compatible endpoint to Hanzo's Zen and Enso models plus 400+ frontier models at api.hanzo.ai.",
    href: "https://hanzo.ai/llm",
    external: true,
    cta: "Explore the gateway",
  },
  {
    icon: <LayoutGrid className="h-5 w-5" />,
    title: "Templates gallery",
    description:
      "Production-grade, open-source apps you can fork into the builder and deploy live in one click.",
    href: "/community",
    cta: "Browse templates",
  },
  {
    icon: <Github className="h-5 w-5" />,
    title: "Import from GitHub",
    description:
      "Bring an existing repository into the builder, or push any project out to your own repo. All Hanzo code is open on GitHub.",
    href: "https://github.com/hanzoai",
    external: true,
    cta: "View on GitHub",
  },
  {
    icon: <GraduationCap className="h-5 w-5" />,
    title: "Learn",
    description:
      "Walk-throughs and concepts for getting the most out of the builder and Hanzo Cloud.",
    href: "/learn",
    cta: "Start learning",
  },
  {
    icon: <Wand2 className="h-5 w-5" />,
    title: "Open the builder",
    description:
      "The fastest way to learn is to build. Describe an app and watch it come together, wired to a database, auth, and AI.",
    href: "/dev",
    cta: "Start building",
  },
];

const steps = [
  {
    n: "01",
    title: "Describe",
    body: "Tell the builder what you want in plain language — “a job board with logins and a Postgres-backed listings table.” No boilerplate, no scaffolding to configure.",
  },
  {
    n: "02",
    title: "Generate",
    body: "Hanzo generates a real, full-stack app and shows you a live preview. Iterate by chatting — ask for changes and watch them apply in place.",
  },
  {
    n: "03",
    title: "Publish",
    body: "Ship to a live *.hanzo.app URL in one click, with database, auth, and AI already wired in. Connect a custom domain or push to GitHub whenever you like.",
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-4 py-12 text-center sm:py-16 md:px-8 md:py-24">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-[-30%] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-foreground/[0.05] blur-[130px]" />
          </div>

          <div className="relative mx-auto max-w-3xl">
            <Reveal>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/70" />
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  Documentation
                </span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="text-balance text-4xl font-medium leading-[1.03] tracking-tight sm:text-5xl md:text-6xl">
                Everything you need
                <br />
                to build with Hanzo.
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
                Start in the builder, then reach for the full docs, the API, and
                the template gallery when you need them. Real destinations, no
                dead ends.
              </p>
            </Reveal>

            <Reveal delay={180}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/dev"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
                >
                  Start building
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="https://docs.hanzo.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-6 py-3 text-sm font-medium text-foreground transition-all hover:border-foreground/30 hover:bg-accent"
                >
                  Full documentation
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Quick start (inline, real) ───────────────────────── */}
        <section className="border-y border-border px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Quick start
              </p>
              <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">
                From a sentence to a live app.
              </h2>
              <p className="mt-3 max-w-xl text-base text-muted-foreground">
                Three steps, no setup. This is the whole loop.
              </p>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
              {steps.map((s, i) => (
                <Reveal key={s.n} delay={i * 80}>
                  <div className="flex h-full flex-col rounded-2xl border border-border bg-muted p-6">
                    <span className="font-mono text-sm text-muted-foreground">{s.n}</span>
                    <h3 className="mt-4 text-lg font-medium text-foreground">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {s.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Explore ──────────────────────────────────────────── */}
        <section className="px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Explore
              </p>
              <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">
                Where to go next.
              </h2>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((d, i) => {
                const inner = (
                  <div className="group flex h-full flex-col rounded-2xl border border-border bg-muted p-6 transition-colors hover:border-foreground/30 hover:bg-accent">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted text-foreground">
                        {d.icon}
                      </span>
                      {d.external ? (
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                      )}
                    </div>
                    <h3 className="mt-5 text-base font-medium text-foreground">
                      {d.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {d.description}
                    </p>
                    <span className="mt-4 text-sm font-medium text-foreground transition-colors group-hover:text-foreground">
                      {d.cta} →
                    </span>
                  </div>
                );
                return (
                  <Reveal key={d.title} delay={i * 60}>
                    {d.external ? (
                      <a href={d.href} target="_blank" rel="noopener noreferrer">
                        {inner}
                      </a>
                    ) : (
                      <Link href={d.href}>{inner}</Link>
                    )}
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── API ──────────────────────────────────────────────── */}
        <section className="border-t border-border px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 [&>*]:min-w-0 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                API
              </p>
              <h2 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">
                One endpoint. 400+ models.
              </h2>
              <p className="mt-4 max-w-md text-base text-muted-foreground">
                Every app you build can call any frontier model — Hanzo&apos;s own
                Zen and Enso families included — through a single OpenAI-compatible
                endpoint. Swap models with one string.
              </p>
              <a
                href="https://hanzo.ai/llm"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Explore the gateway
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </Reveal>

            <Reveal delay={100} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
              </div>
              <pre className="overflow-x-auto font-mono text-[12px] leading-relaxed text-foreground">
{`POST https://api.hanzo.ai/v1/chat/completions
Authorization: Bearer $HANZO_KEY

{
  "model": "zen-omni",
  "messages": [{ "role": "user", "content": "…" }],
  "stream": true
}`}
              </pre>
            </Reveal>
          </div>
        </section>

        {/* ── Help CTA ─────────────────────────────────────────── */}
        <section className="border-t border-border px-4 py-20 text-center md:px-8 md:py-24">
          <Reveal className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
              Still stuck?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
              Check the FAQ for quick answers, or reach the team directly.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/faq"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
              >
                Read the FAQ
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/help"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-6 py-3 text-sm font-medium text-foreground transition-all hover:border-foreground/30 hover:bg-accent"
              >
                Get help
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
