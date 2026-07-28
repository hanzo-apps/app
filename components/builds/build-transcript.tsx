// The readable build — the agent session that produced a product, turn by turn.
//
// A visitor lands here from a product and follows how it was actually made: the
// prompt, the reasoning, the tool calls, and the commit each turn produced. Every
// bound turn is a fork point, because a commit sha plus a repo IS the fork
// instruction — no new API is needed to leave from the middle of a build.
//
// HONESTY IS THE WHOLE FEATURE. Nothing on this page is composed for the reader:
// it renders exactly what /v1/agents/builds returned, which is the harness's own
// session log, and the commits are the ones git records against those turns. The
// "verify" line is the literal `git log` that re-derives every binding shown, so
// a sceptical reader can check the page against the repository in one command.
// Turns with no commit are shown WITHOUT one rather than being hidden or
// decorated — most turns change nothing, and pretending otherwise would be the
// same lie as a fabricated transcript.
//
// Server component: pure presentation over data the page already fetched.

import Link from "next/link";
import { ChevronRight, GitCommit, ArrowUpRight, Terminal, User, Bot } from "lucide-react";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";

export type BuildTurn = {
  turn: number;
  kind: string;
  actor?: string;
  body: string;
  commit?: string;
  subject?: string;
  at: string;
};

export type Build = {
  org: string;
  project: string;
  session: string;
  title?: string;
  agent: string;
  status: string;
  repo?: string;
  model?: string;
  startedAt: string;
  endedAt?: string;
  turns: BuildTurn[];
  verify: string;
};

const EYEBROW = "font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground";

// A turn's body can be long; the page shows it whole rather than truncating,
// because an elided transcript is the thing this feature exists to replace.
// `whitespace-pre-wrap` keeps the agent's own line breaks.
function TurnBody({ text }: { text: string }) {
  return (
    <p className="whitespace-pre-wrap text-pretty text-sm leading-relaxed text-muted-foreground">
      {text}
    </p>
  );
}

// forkCommand is the real, runnable way to leave from this turn. It is built
// from facts the API returned (repo + commit) and nothing else — when either is
// missing there is no command, and none is shown.
function forkCommand(repo: string | undefined, commit: string) {
  if (!repo) return null;
  return `git clone ${repo} && cd ${repo.split("/").pop()?.replace(/\.git$/, "")} && git checkout ${commit}`;
}

export function BuildTranscript({ build }: { build: Build }) {
  const bound = build.turns.filter((t) => t.commit).length;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-14%] h-[520px] w-[860px] -translate-x-1/2 rounded-full bg-foreground/[0.05] blur-[130px]" />
      </div>

      <Header />

      <main className="relative z-10">
        <section className="px-4 pt-9 md:px-8 md:pt-14">
          <div className="mx-auto max-w-4xl">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <li>
                  <Link href="/builds" className="transition-colors hover:text-foreground">
                    Builds
                  </Link>
                </li>
                <li aria-hidden="true">
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </li>
                <li>{build.org}</li>
                <li aria-hidden="true">
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </li>
                <li className="text-foreground">{build.project}</li>
              </ol>
            </nav>

            <h1 className="mt-8 text-balance text-3xl font-medium leading-[1.08] tracking-tight sm:text-4xl">
              {build.title || `How ${build.project} was built`}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 font-mono text-[11px] text-muted-foreground">
                {build.agent}
              </span>
              {build.model ? (
                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {build.model}
                </span>
              ) : null}
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {build.turns.length} turns
              </span>
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {bound} commits
              </span>
            </div>

            {/* The claim and how to check it, side by side. */}
            <div className="mt-8 rounded-xl border border-border bg-muted/40 p-4">
              <p className={EYEBROW}>Verify</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Every commit below is bound to its turn by a git trailer or note on the
                commit itself — not by a table on our side. Re-derive all of them:
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-background p-3 font-mono text-[11px] text-muted-foreground">
                {build.verify}
              </pre>
              {build.repo ? (
                <a
                  href={build.repo}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {build.repo}
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          </div>
        </section>

        {/* ── The session ──────────────────────────────────────── */}
        <section className="px-4 py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-4xl">
            <ol className="relative border-l border-border pl-6">
              {build.turns.map((t) => {
                const cmd = t.commit ? forkCommand(build.repo, t.commit) : null;
                const isUser = t.actor === "user" || t.kind === "message" && t.actor === "user";
                return (
                  <li key={t.turn} className="relative pb-10 last:pb-0">
                    <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background">
                      {isUser ? (
                        <User className="h-2.5 w-2.5 text-muted-foreground" />
                      ) : t.kind === "status" ? (
                        <Terminal className="h-2.5 w-2.5 text-muted-foreground" />
                      ) : (
                        <Bot className="h-2.5 w-2.5 text-muted-foreground" />
                      )}
                    </span>

                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        Turn {t.turn}
                      </span>
                      {t.actor ? (
                        <span className="font-mono text-[11px] text-muted-foreground/70">
                          {t.actor}
                        </span>
                      ) : null}
                      <time className="font-mono text-[11px] text-muted-foreground/70">{t.at}</time>
                    </div>

                    <div className="mt-2">
                      <TurnBody text={t.body} />
                    </div>

                    {t.commit ? (
                      <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <GitCommit className="h-3.5 w-3.5 text-muted-foreground" />
                          <code className="font-mono text-[11px] text-foreground">
                            {t.commit.slice(0, 12)}
                          </code>
                          {t.subject ? (
                            <span className="text-sm text-muted-foreground">{t.subject}</span>
                          ) : null}
                        </div>
                        {cmd ? (
                          <>
                            <p className={`${EYEBROW} mt-3`}>Fork from here</p>
                            <pre className="mt-1.5 overflow-x-auto rounded border border-border bg-background p-2.5 font-mono text-[11px] text-muted-foreground">
                              {cmd}
                            </pre>
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
