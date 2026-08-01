'use client';

// Everything running, by machine, with a terminal beside it.
//
// Machines are the top level because that is how the work is actually laid out —
// one box runs several sessions, and "which machine is this on" is the first
// question when something needs attention. The machine list comes from the
// run-target registry, not from the sessions, so a box that finished its last
// session still appears (idle) instead of vanishing.
//
// Selecting a session frames the terminal that machine published. The bytes never
// pass through here — the machine serves them through zrok — so an ended session
// stops answering in its own frame rather than leaving this page holding a
// half-open stream.

import { useEffect, useMemo, useState } from 'react';
import type { AgentSession } from '@/lib/sessions';
import type { Machine } from '@/lib/machines';

const DOT: Record<string, string> = {
  running: 'bg-emerald-500',
  paused: 'bg-amber-500',
  done: 'bg-muted-foreground/40',
  error: 'bg-destructive',
  online: 'bg-emerald-500',
  busy: 'bg-amber-500',
  offline: 'bg-muted-foreground/40',
};

function ago(iso: string | undefined, now: number): string {
  if (!iso) return '';
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return '';
  const s = Math.max(0, Math.floor((now - then) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

/** Trim a path to its tail, which is the part that identifies the work. */
function shortPath(p: string | undefined): string {
  if (!p) return '';
  const home = p.replace(/^\/(Users|home)\/[^/]+/, '~');
  const parts = home.split('/');
  return parts.length > 3 ? `…/${parts.slice(-2).join('/')}` : home;
}

/** How long after its last update a "running" session stops counting as live.
 *
 * The plane has no heartbeat: status only changes if a client says so, and a client
 * that loses power never does. So a row claiming to run is evidence only when it is
 * RECENT — without this the roster fills with rows that have been "running" for days
 * and a genuinely live session is indistinguishable from a corpse.
 */
const LIVE_WINDOW_MS = 10 * 60 * 1000;

function isLive(s: AgentSession, now: number): boolean {
  if (s.status !== 'running' && s.status !== 'paused') return false;
  const t = Date.parse(s.updatedAt);
  return Number.isNaN(t) ? false : now - t <= LIVE_WINDOW_MS;
}

interface Group {
  key: string;
  machine?: Machine;
  label: string;
  sessions: AgentSession[];
}

export function SessionBoard({
  sessions,
  machines,
}: {
  sessions: AgentSession[];
  machines: Machine[];
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  const groups = useMemo<Group[]>(() => {
    const byKey = new Map<string, Group>();
    // Seed from the machine registry so an idle box still gets a row.
    for (const m of machines) {
      const key = m.host || m.label || m.id;
      byKey.set(key, { key, machine: m, label: m.label || m.host || m.id, sessions: [] });
    }
    // A session whose machine never registered still has to land somewhere, so it
    // makes its own group rather than being dropped from the board.
    for (const s of sessions) {
      const key = s.host || 'unknown';
      const g = byKey.get(key) ?? { key, label: s.host || 'unknown machine', sessions: [] };
      g.sessions.push(s);
      byKey.set(key, g);
    }
    // Live work first, then machines with only history. Within a machine the newest
    // update leads, so the thing you just started is at the top rather than buried
    // behind whichever box happens to hold the most corpses.
    for (const g of byKey.values()) {
      g.sessions.sort((x, y) => (y.updatedAt || '').localeCompare(x.updatedAt || ''));
    }
    const liveCount = (g: Group) => g.sessions.filter((x) => isLive(x, now)).length;
    return [...byKey.values()].sort(
      (a, b) =>
        liveCount(b) - liveCount(a) ||
        b.sessions.length - a.sessions.length ||
        a.label.localeCompare(b.label),
    );
  }, [sessions, machines, now]);

  const [selected, setSelected] = useState<string | null>(
    sessions.find((s) => s.terminal)?.id ?? sessions[0]?.id ?? null,
  );
  const active = sessions.find((s) => s.id === selected);
  // On a narrow screen the roster and the terminal cannot share the viewport, so
  // choosing a session moves to it and a back control returns. On a wide one both
  // are visible and this never engages.
  const [onTerminal, setOnTerminal] = useState(false);
  // Per machine, whether its finished sessions are expanded.
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-6 py-12 text-center">
        <p className="text-sm font-medium">No machines are registered.</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          A machine appears here the first time <code>hanzo code</code> runs on it.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <div className={`flex-col gap-5 ${onTerminal ? 'hidden lg:flex' : 'flex'}`}>
        {groups.map((g) => (
          <section key={g.key}>
            <header className="mb-2 flex items-baseline gap-2">
              <span
                aria-hidden
                className={`size-2 shrink-0 rounded-full ${
                  DOT[g.machine?.status ?? ''] ?? 'bg-muted-foreground/40'
                }`}
              />
              <h2 className="truncate text-sm font-semibold">{g.label}</h2>
              {g.machine?.spec ? (
                <span className="truncate text-xs text-muted-foreground">
                  {[g.machine.spec.os, g.machine.spec.arch].filter(Boolean).join('/')}
                </span>
              ) : null}
              <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                {g.sessions.filter((x) => isLive(x, now)).length || (g.machine ? 'idle' : '')}
              </span>
            </header>

            {g.machine?.metrics ? (
              <p className="mb-2 flex gap-3 text-xs tabular-nums text-muted-foreground">
                {g.machine.metrics.cpuPercent != null && (
                  <span>cpu {Math.round(g.machine.metrics.cpuPercent)}%</span>
                )}
                {g.machine.metrics.memPercent != null && (
                  <span>mem {Math.round(g.machine.metrics.memPercent)}%</span>
                )}
                {g.machine.metrics.diskPercent != null && (
                  <span>disk {Math.round(g.machine.metrics.diskPercent)}%</span>
                )}
              </p>
            ) : null}

            <ul className="flex flex-col gap-1.5">
              {(showAll[g.key] ? g.sessions : g.sessions.filter((x) => isLive(x, now))).map((s) => {
                const on = s.id === active?.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(s.id);
                        setOnTerminal(true);
                      }}
                      aria-current={on}
                      className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                        on ? 'border-foreground/30 bg-muted' : 'hover:bg-muted/50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className={`size-1.5 shrink-0 rounded-full ${
                            isLive(s, now) ? DOT[s.status] : DOT.done
                          }`}
                        />
                        <span className="truncate text-sm">{s.agent}</span>
                        <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                          {ago(s.updatedAt, now)}
                        </span>
                      </span>
                      {/* the working directory is the thing that says WHICH work this is */}
                      <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">
                        {shortPath(s.cwd) || s.repo || s.title}
                      </span>
                    </button>
                  </li>
                );
              })}
              {(() => {
                const hidden = g.sessions.filter((x) => !isLive(x, now)).length;
                if (g.sessions.length === 0) {
                  return <li className="px-3 py-2 text-xs text-muted-foreground">nothing running</li>;
                }
                if (hidden === 0 || showAll[g.key]) {
                  return hidden > 0 ? (
                    <li>
                      <button
                        type="button"
                        onClick={() => setShowAll((v) => ({ ...v, [g.key]: false }))}
                        className="px-3 py-2 text-xs text-muted-foreground underline underline-offset-4"
                      >
                        Hide {hidden} finished
                      </button>
                    </li>
                  ) : null;
                }
                // Finished sessions are history, not noise to scroll past — one line
                // says how much there is and opens it on demand.
                return (
                  <li>
                    <button
                      type="button"
                      onClick={() => setShowAll((v) => ({ ...v, [g.key]: true }))}
                      className="px-3 py-2 text-xs text-muted-foreground underline underline-offset-4"
                    >
                      {hidden} finished
                    </button>
                  </li>
                );
              })()}
            </ul>
          </section>
        ))}
      </div>

      <section className={`min-w-0 ${onTerminal ? '' : 'hidden lg:block'}`}>
        {active ? (
          <>
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <button
                type="button"
                onClick={() => setOnTerminal(false)}
                className="lg:hidden text-sm underline underline-offset-4"
              >
                ← Machines
              </button>
              <h2 className="text-sm font-medium">{active.host || active.agent}</h2>
              <span className="truncate font-mono text-xs text-muted-foreground">
                {active.cwd || active.repo}
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
                className="h-[calc(100dvh-13rem)] w-full rounded-lg border bg-black lg:h-[70vh]"
                // The frame runs a shell on someone's machine. It gets scripts (a
                // terminal is one) but not same-origin, so it cannot reach this
                // page's session.
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            ) : (
              <div className="flex h-[calc(100dvh-13rem)] w-full items-center justify-center rounded-lg border border-dashed px-6 text-center lg:h-[70vh]">
                <p className="max-w-sm text-sm text-muted-foreground">
                  This session is not publishing a terminal, so there is nothing to drive
                  here.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-[calc(100dvh-13rem)] w-full items-center justify-center rounded-lg border border-dashed px-6 text-center lg:h-[70vh]">
            <p className="max-w-sm text-sm text-muted-foreground">
              Select a session to drive it.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
