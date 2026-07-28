// /builds — every published build. The index a gallery links from.
//
// Empty is a HONEST state here, not a failure: builds appear only when an author
// publishes one, so an empty list says exactly that and explains how to add one.

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";
import { listBuilds } from "@/lib/builds";

export const metadata: Metadata = {
  title: "Builds | Hanzo",
  description:
    "The agent sessions behind Hanzo products — every turn bound to the commit it produced, forkable from any point.",
  alternates: { canonical: "https://hanzo.app/builds" },
};

export default async function BuildsIndexPage() {
  const builds = await listBuilds();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-14%] h-[520px] w-[860px] -translate-x-1/2 rounded-full bg-foreground/[0.05] blur-[130px]" />
      </div>
      <Header />
      <main className="relative z-10 px-4 pt-9 md:px-8 md:pt-14">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Builds
          </p>
          <h1 className="mt-4 text-balance text-3xl font-medium leading-[1.08] tracking-tight sm:text-4xl">
            How these were actually made
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
            Each of these is a real agent session — the prompt, the reasoning, and the
            commit every turn produced. The turn&nbsp;⇄&nbsp;commit binding lives in git
            itself, so you can check any claim on this site against the repository.
          </p>

          {builds.length === 0 ? (
            <div className="mt-10 rounded-xl border border-border bg-muted/40 p-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                No builds published yet. An author publishes one from the repo the
                session ran in:
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-background p-3 font-mono text-[11px] text-muted-foreground">
                hanzo agent publish &lt;project&gt; --bind
              </pre>
            </div>
          ) : (
            <ul className="mt-10 divide-y divide-border border-y border-border">
              {builds.map((b) => (
                <li key={`${b.org}/${b.project}`}>
                  <Link
                    href={`/builds/${b.org}/${b.project}`}
                    className="group flex flex-wrap items-baseline justify-between gap-3 py-5 transition-colors hover:bg-muted/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-base font-medium">
                        {b.title || `${b.org}/${b.project}`}
                      </span>
                      <span className="mt-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                        {b.org}/{b.project} · {b.agent} · {b.turns} turns
                      </span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
