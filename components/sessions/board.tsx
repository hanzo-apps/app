'use client';

// The roster and the terminal beside it.
//
// Selecting a session frames its own published URL. The terminal is served by the
// machine running it, through zrok — this component never proxies bytes, so a
// session that ends simply stops answering in its own frame rather than leaving
// this page holding a half-open stream.

import { useEffect, useState } from 'react';
import type { CodingSession } from '@/lib/sessions';
import { isLive } from '@/lib/sessions';

function ago(unixSeconds: number, now: number): string {
  const s = Math.max(0, Math.floor(now / 1000 - unixSeconds));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function SessionBoard({
  sessions,
  ttlSeconds,
}: {
  sessions: CodingSession[];
  ttlSeconds: number;
}) {
  const [selected, setSelected] = useState<string | null>(sessions[0]?.id ?? null);
  // Re-render on a timer so "12s ago" ages and a session visibly goes stale,
  // rather than freezing at whatever it said when the page was rendered.
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
          A machine appears here while it is running <code>hanzo session</code>, which
          publishes its terminal and heartbeats to the roster.
        </p>
      </div>
    );
  }

  const active = sessions.find((s) => s.id === selected) ?? sessions[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <ul className="flex flex-col gap-2">
        {sessions.map((s) => {
          const live = isLive(s, ttlSeconds, now);
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
                  <span
                    aria-hidden
                    className={`size-2 shrink-0 rounded-full ${
                      live ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                    }`}
                  />
                  <span className="truncate font-medium">{s.host}</span>
                  <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                    {ago(s.beatAt, now)}
                  </span>
                </span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {s.repo || s.workspace}
                  {s.branch ? ` · ${s.branch}` : ''}
                </span>
                {/* the agent is what is doing the typing, so it is worth naming */}
                {s.agent ? (
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground/80">
                    {s.agent}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      <section className="min-w-0">
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-sm font-medium">{active.host}</h2>
          <span className="truncate text-xs text-muted-foreground">{active.workspace}</span>
          <a
            href={active.url}
            target="_blank"
            rel="noreferrer noopener"
            className="ml-auto text-xs underline underline-offset-4"
          >
            Open in a tab
          </a>
        </div>
        <iframe
          key={active.id}
          src={active.url}
          title={`Terminal on ${active.host}`}
          className="h-[70vh] w-full rounded-lg border bg-black"
          // The frame runs someone else's terminal. It gets scripts (a terminal is
          // one) but not same-origin, so it cannot reach this page's session.
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </section>
    </div>
  );
}
