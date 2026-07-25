// /community — the discovery hub for everything built on Hanzo.
//
// Two honest sources, no fabrication (see lib/showcase.ts):
//   • LIVE apps  — real, reachable deployments (curated).
//   • STARTERS   — public repos in the `hanzo-apps` GitHub org, fetched live
//                  (ISR, 1h) with a baked fallback, each forkable in one click.
//
// Server Component: the GitHub fetch runs server-side and degrades gracefully,
// so the page always renders. Voice + monochrome/Geist register match the
// elevated landing — confident, honest, alive.

import Link from "next/link";
import { ArrowUpRight, Github, GitFork, Star } from "lucide-react";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";
import Reveal from "@/components/landing/reveal";
import {
  fetchShowcaseRepos,
  DEPLOYED_APPS,
  HANZO_APPS_URL,
  type ShowcaseRepo,
  type DeployedApp,
} from "@/lib/showcase";

export const metadata = {
  title: "Community — Built on Hanzo",
  description:
    "Real apps, real repos, real deploys — everything the community ships on Hanzo. Fork any project into the builder and ship yours in minutes.",
};

// ISR: refresh the live repo list hourly.
export const revalidate = 3600;

const btnPrimary =
  "inline-flex h-11 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90";
const btnGhost =
  "inline-flex h-11 items-center gap-1.5 rounded-xl border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-card";
const chipSolid =
  "inline-flex items-center gap-1.5 rounded-lg border border-border bg-foreground/[0.06] px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/10";
const chipGhost =
  "inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-card hover:text-foreground";

export default async function CommunityPage() {
  const repos = await fetchShowcaseRepos();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pb-16 pt-24 md:px-8 md:pb-24 md:pt-32">
        <div className="mx-auto max-w-5xl text-center">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Community
            </p>
            <h1 className="mt-5 text-4xl font-medium leading-[1.05] tracking-tight md:text-6xl">
              Look what&apos;s <span className="italic">shipping</span> on Hanzo.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Real apps, real repos, real deploys — every one built on the Hanzo stack.
              Fork any of them into the builder, remix with AI, and ship yours in minutes.
            </p>
          </Reveal>

          <Reveal delay={80} className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dev" className={btnPrimary}>
              Build yours <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a href={HANZO_APPS_URL} target="_blank" rel="noreferrer" className={btnGhost}>
              <Github className="h-4 w-4" /> Browse the org
            </a>
          </Reveal>

          <Reveal
            delay={140}
            className="mx-auto mt-12 flex max-w-md items-center justify-center divide-x divide-border"
          >
            <Stat value={String(DEPLOYED_APPS.length)} label="live apps" />
            <Stat value={`${repos.length}+`} label="open-source starters" />
            <Stat value="1-click" label={"fork & remix"} />
          </Reveal>
        </div>
      </section>

      {/* ── Live on Hanzo ── */}
      <section className="border-t border-border px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            eyebrow="Live on Hanzo"
            title="Shipped, running, reachable."
            sub="Real products serving real traffic — each one open source. Visit it, then read how it's built."
          />
          <Reveal
            delay={80}
            className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-muted sm:grid-cols-2 lg:grid-cols-3"
          >
            {DEPLOYED_APPS.map((app) => (
              <AppCard key={app.liveUrl} app={app} />
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Starters & templates ── */}
      <section className="border-t border-border px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            eyebrow="Starters & templates"
            title="Fork it. Ship yours."
            sub="Open-source starters from the hanzo-apps org — each one Vite + React 19 on @hanzo/gui, IAM, and Base. Fork opens it live in the builder."
          />
          <Reveal
            delay={80}
            className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-muted sm:grid-cols-2 lg:grid-cols-3"
          >
            {repos.map((repo) => (
              <RepoCard key={repo.fullName} repo={repo} />
            ))}
          </Reveal>

          <Reveal delay={120} className="mt-8 text-center">
            <a href={HANZO_APPS_URL} target="_blank" rel="noreferrer" className={btnGhost}>
              <Github className="h-4 w-4" /> See every repo on GitHub
            </a>
          </Reveal>
        </div>
      </section>

      {/* ── Your turn ── */}
      <section className="border-t border-border px-4 py-20 text-center md:px-8 md:py-28">
        <Reveal className="mx-auto max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Your turn
          </p>
          <h2 className="mt-4 text-3xl font-medium tracking-tight md:text-4xl">
            Build something worth showing off.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Start from a blank prompt or fork any project above. Either way, you&apos;re live on
            Hanzo Cloud — database, auth, AI, and storage already wired — in minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dev" className={btnPrimary}>
              Start building <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/templates" className={btnGhost}>
              Browse templates
            </Link>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}

/* ── Pieces ──────────────────────────────────────────────────────────────── */

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center px-4">
      <span className="font-mono text-2xl font-medium text-foreground md:text-3xl">{value}</span>
      <span className="mt-1 text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-medium tracking-tight md:text-4xl">{title}</h2>
      {sub ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{sub}</p>
      ) : null}
    </Reveal>
  );
}

function AppCard({ app }: { app: DeployedApp }) {
  return (
    <div className="group flex flex-col bg-background p-7 transition-colors duration-200 hover:bg-card">
      <div className="flex items-center gap-2">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          Live
        </span>
      </div>
      <h3 className="mt-5 text-lg font-medium tracking-tight text-foreground">{app.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{app.tagline}</p>
      <div className="mt-5 flex items-center gap-2">
        <a href={app.liveUrl} target="_blank" rel="noreferrer" className={chipSolid}>
          <ArrowUpRight className="h-3.5 w-3.5" /> Visit
        </a>
        <a href={app.repoUrl} target="_blank" rel="noreferrer" className={chipGhost}>
          <Github className="h-3.5 w-3.5" /> Source
        </a>
      </div>
    </div>
  );
}

function RepoCard({ repo }: { repo: ShowcaseRepo }) {
  return (
    <div className="group flex flex-col bg-background p-6 transition-colors duration-200 hover:bg-card">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-medium tracking-tight text-foreground">{repo.name}</h3>
        {repo.stars > 0 ? (
          <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5" /> {repo.stars}
          </span>
        ) : null}
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{repo.tagline}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Link href={repo.forkUrl} className={chipSolid}>
          <GitFork className="h-3.5 w-3.5" /> Fork
        </Link>
        <a href={repo.repoUrl} target="_blank" rel="noreferrer" className={chipGhost}>
          <Github className="h-3.5 w-3.5" /> Source
        </a>
        {repo.liveUrl ? (
          <a href={repo.liveUrl} target="_blank" rel="noreferrer" className={chipGhost}>
            <ArrowUpRight className="h-3.5 w-3.5" /> Live
          </a>
        ) : null}
      </div>
      <span className="mt-3 font-mono text-[11px] text-muted-foreground/70">{repo.fullName}</span>
    </div>
  );
}
