"use client";

// "Your builds" — the account surface: the agent sessions behind your projects,
// with the chat each one is, and whether the world can read it.
//
// It replaces a block of hardcoded numbers (12 Projects / 342 AI Generations /
// 89 Deployments / 2.3k Views) that were the same for every account and true for
// none. A profile that invents its own statistics is the same failure as a
// fabricated transcript, one screen earlier — so this renders what
// /v1/agents/sessions actually returns, including zero.

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Globe, Lock, ArrowUpRight } from "lucide-react";

type SessionRow = {
  id: string;
  org: string;
  agent: string;
  title?: string;
  status: string;
  project?: string;
  published?: boolean;
  events: number;
  updatedAt: string;
};

type State =
  | { kind: "loading" }
  | { kind: "signedOut" }
  | { kind: "error"; message: string }
  | { kind: "ready"; sessions: SessionRow[] };

export function MyBuilds() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const r = await fetch("/v1/agents/sessions", { cache: "no-store" });
        if (!live) return;
        if (r.status === 401) return setState({ kind: "signedOut" });
        if (!r.ok) return setState({ kind: "error", message: `HTTP ${r.status}` });
        const body = (await r.json()) as { sessions?: SessionRow[] };
        setState({ kind: "ready", sessions: body.sessions ?? [] });
      } catch {
        if (live) setState({ kind: "error", message: "Unable to reach the API" });
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-medium text-foreground">Your builds</h3>
        <p className="text-sm text-muted-foreground">
          The agent session behind each project — the whole chat, and the commits it made.
        </p>
      </div>

      {state.kind === "loading" ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : state.kind === "signedOut" ? (
        <p className="mt-4 text-sm text-muted-foreground">
          <Link href="/login" className="underline hover:text-foreground">
            Sign in
          </Link>{" "}
          to see the sessions behind your projects.
        </p>
      ) : state.kind === "error" ? (
        // Say what went wrong rather than rendering an empty list that reads as
        // "you have none" — a wrong zero is worse than a visible failure.
        <p className="mt-4 text-sm text-muted-foreground">
          Could not load your builds ({state.message}).
        </p>
      ) : state.sessions.length === 0 ? (
        <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">
            No sessions yet. Publish the session that built a repo:
          </p>
          <pre className="mt-3 overflow-x-auto rounded border border-border bg-background p-2.5 font-mono text-[11px] text-muted-foreground">
            hanzo agent publish &lt;project&gt; --bind
          </pre>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {state.sessions.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-medium text-foreground">
                    {s.title || s.project || s.id}
                  </span>
                  {s.published ? (
                    <Globe className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="public" />
                  ) : (
                    <Lock className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="private" />
                  )}
                </div>
                <span className="mt-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  {s.project ? `${s.project} · ` : ""}
                  {s.agent} · {s.events} turns · {s.status}
                </span>
              </div>
              {s.published && s.project && s.org ? (
                <Link
                  href={`/builds/${s.org}/${s.project}`}
                  className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Read
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
