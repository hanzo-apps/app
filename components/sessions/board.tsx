'use client';

// The roster and the terminal beside it.
//
// Selecting a session frames the URL that machine published for its terminal. The
// bytes never pass through here — the machine serves them, through zrok — so a
// session that ends stops answering in its own frame rather than leaving this
// page holding a half-open stream. A session that published nothing shows its
// context and says so, because "no terminal" and "nothing running" are different.

import { useEffect, useState } from 'react';
import type { AgentSession } from '@/lib/sessions';
import { isActive } from '@/lib/sessions';

const DOT: Record<AgentSession['status'], string> = {
  running: 'bg-emerald-500',
  paused: 'bg-amber-500',
  done: 'bg-muted-foreground/40',
  error: 'bg-destructive',
};

function ago(iso: string, now: number): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return '';
  const s = Math.max(0, Math.floor((now - then) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function SessionBoard({ sessions }: { sessions: AgentSession[] }) {
  const [selected, setSelected] = useState<string | null>(
    sessions.find((s) => s.terminal)?.id ?? sessions[0]?.id ?? null,
  );
  // Re-render on a timer so "12s ago" ages instead of freezing at whatever it
  // said when the page was rendered.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-6 py-12 text-center">
        <p className="text-sm font-medium">No sessions are running.</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          A session appears here while <code>hanzo code</code> is running on one of your
          machines.
        </p>
      </div>
    );
  }

  const active = sessions.find((s) => s.id === selected) ?? sessions[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <ul className="flex flex-col gap-2">
        {sessions.map((s) => {
          const on = s.id === active.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setSelected(s.id)}
                aria-current={on}
                className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                  on ? 'border-foreground/30 bg-muted' : 'hover:bg-muted/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden className={`size-2 shrink-0 rounded-full ${DOT[s.status]}`} />
                  <span className="truncate font-medium">{s.host || s.agent}</span>
                  <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                    {ago(s.updatedAt, now)}
                  </span>
                </span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {s.title || s.repo || s.cwd || s.agent}
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground/80">
                  <span>{s.status}</span>
                  {s.terminal ? <span aria-label="has a live terminal">· watchable</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <section className="min-w-0">
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-sm font-medium">{active.host || active.agent}</h2>
          <span className="truncate text-xs text-muted-foreground">
            {active.repo || active.cwd}
          </span>
          {active.terminal ? (
            <a
              href={active.terminal}
              target="_blank"
              rel="noreferrer noopener"
              className="ml-auto text-xs underline underline-offset-4"
            >
              Open in a tab
            </a>
          ) : null}
        </div>

        {active.terminal ? (
          <iframe
            key={active.id}
            src={active.terminal}
            title={`Terminal on ${active.host || active.agent}`}
            className="h-[70vh] w-full rounded-lg border bg-black"
            // The frame runs someone else's terminal. It gets scripts (a terminal
            // is one) but not same-origin, so it cannot reach this page's session.
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        ) : (
          <div className="flex h-[70vh] w-full flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
            <p className="text-sm font-medium">
              {isActive(active)
                ? 'This session is not publishing a terminal.'
                : `This session is ${active.status}.`}
            </p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {isActive(active)
                ? 'Start it with a published terminal to watch it here.'
                : 'Its log is still on the session, but there is nothing live to watch.'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
