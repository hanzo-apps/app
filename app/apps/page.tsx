"use client";

// /apps — the Hanzo apps & extensions catalog. Every surface a visitor can
// install or connect, on ONE foundation: the @hanzo/ai gateway + @hanzo/iam
// identity. Lead with that, then render the Install and Connect sections from
// the single typed catalog in @/data/app-catalog.

import Link from "next/link";
import { ArrowRight, Download, Fingerprint, KeyRound, Network, Plug } from "lucide-react";
import Header from "@/components/layout/header";
import Reveal from "@/components/landing/reveal";
import SiteFooter from "@/components/landing/site-footer";
import AppCatalogSection from "@/components/apps/app-catalog";
import {
  appCatalog,
  connectApps,
  installApps,
} from "@/data/app-catalog";

// Real count, derived from the catalog — never a fabricated metric.
const TOTAL = appCatalog.length;

const FOUNDATION = [
  {
    icon: Fingerprint,
    title: "One identity",
    body: "@hanzo/iam signs you in once. Every app below trusts the same account — no per-app passwords.",
  },
  {
    icon: Network,
    title: "One gateway",
    body: "@hanzo/ai routes every surface to 100+ models through a single endpoint and billing account.",
  },
  {
    icon: KeyRound,
    title: "One key",
    body: "Mint one hk- key and paste it anywhere — extensions, IDEs, and hosted apps all authenticate with it.",
  },
];

export default function AppsPage() {
  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Monochrome hero glow — single soft white radial, matching the homepage. */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-12%] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-white/[0.06] blur-[130px]" />
      </div>

      <Header />

      <main className="relative z-10">
        {/* ── Hero — lead with the shared foundation ─────────────────────── */}
        <section className="px-4 pb-16 pt-16 md:px-8 md:pb-20 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/55">
                  One identity · One gateway · {TOTAL} surfaces
                </span>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="text-balance text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
                Every Hanzo app, one sign-in.
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mx-auto mt-6 max-w-xl text-pretty text-base text-white/55 md:text-lg">
                Install an extension or connect a hosted app — all {TOTAL} surfaces
                run on the same <span className="text-white/80">@hanzo/ai</span>{" "}
                gateway and <span className="text-white/80">@hanzo/iam</span>{" "}
                identity. Sign in once, mint one <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm">hk-</code>{" "}
                key, and every app below is authenticated.
              </p>
            </Reveal>

            <Reveal delay={180}>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="#install"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-all hover:bg-white/90"
                >
                  <Download className="h-4 w-4" />
                  Install extensions
                </a>
                <a
                  href="#connect"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/10"
                >
                  <Plug className="h-4 w-4" />
                  Connect apps
                </a>
              </div>
            </Reveal>
          </div>

          {/* Foundation strip — reinforces the one-foundation lead. */}
          <Reveal delay={240} className="mx-auto mt-16 max-w-5xl">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {FOUNDATION.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                    <f.icon className="h-5 w-5 text-white" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-medium text-white">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/50">{f.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ── Install (download) ─────────────────────────────────────────── */}
        <AppCatalogSection
          id="install"
          eyebrow="Install"
          title="Download & install"
          subtitle="One bundle installs Hanzo into your browser, editor, Office, and desktop — every build in the latest release."
          Icon={Download}
          entries={installApps}
        />

        {/* ── Connect (OAuth / hosted) ───────────────────────────────────── */}
        <AppCatalogSection
          id="connect"
          eyebrow="Connect"
          title="Connect a hosted app"
          subtitle="Link an app to your Hanzo account with OAuth and run agents against it — no install required."
          Icon={Plug}
          entries={connectApps}
        />

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <section className="border-t border-white/[0.06] px-4 py-24 md:px-8 md:py-32">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-medium tracking-tight md:text-5xl">
              Start with one key.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-white/55 md:text-lg">
              Sign in with Hanzo, mint an hk- key, and connect every surface you
              use.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-all hover:bg-white/90"
            >
              Get your key
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
