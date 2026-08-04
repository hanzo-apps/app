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
import { Tiles, type TerminalPane } from '@/components/sessions/tiles';
import type { AgentSession } from '@/lib/sessions';
import type { Machine } from '@/lib/machines';

/** Status -> dot. Session statuses first, then the machine's.
 *
 * The machine's three are exactly what the control plane can send —
 * online | offline | draining (agents.TargetOnline/Offline/Draining). `busy` was
 * here and is sent by nothing, while `draining` was missing and fell through to
 * the offline grey: a box being deliberately drained looked identical to one that
 * had died, which is the opposite of what draining a box is for. */
const DOT: Record<string, string> = {
  running: 'bg-emerald-500',
  paused: 'bg-amber-500',
  done: 'bg-muted-foreground/40',
  error: 'bg-destructive',
  online: 'bg-emerald-500',
  draining: 'bg-amber-500',
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

/** Memory in use, as a percentage — the machine reports bytes used and free, and
 *  the total is their sum. Absent when it reported neither. */
function memPercent(m: { memUsed?: number; memFree?: number }): number | null {
  const total = (m.memUsed ?? 0) + (m.memFree ?? 0);
  return total > 0 ? Math.round(((m.memUsed ?? 0) / total) * 100) : null;
}

/** Trim a path to its tail, which is the part that identifies the work. */
function shortPath(p: string | undefined): string {
  if (!p) return '';
  const home = p.replace(/^\/(Users|home)\/[^/]+/, '~');
  const parts = home.split('/');
  return parts.length > 3 ? `…/${parts.slice(-2).join('/')}` : home;
}

/** Whether a session is running RIGHT NOW.
 *
 * Two facts, each from the one place that owns it. The session row says what it is
 * doing — running, paused, done — and only its own client can say that. Whether
 * anything is there to be doing it is the MACHINE's fact, and cloud already
 * decides it: `status` is the target's `EffectiveStatus`, offline once no
 * heartbeat has landed inside its window.
 *
 * This page deliberately computes neither. A staleness rule invented here would be
 * a second liveness answer competing with the server's, and the two would disagree
 * exactly when it matters — an idle-but-linked shell reads dead, or a machine
 * that lost power reads alive. A session on a machine that never registered has no
 * such fact to check, so its own status stands.
 */
function isLive(s: AgentSession, machine: Machine | undefined): boolean {
  if (s.status !== 'running' && s.status !== 'paused') return false;
  return machine ? machine.status !== 'offline' : true;
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
    const liveCount = (g: Group) => g.sessions.filter((x) => isLive(x, g.machine)).length;
    return [...byKey.values()].sort(
      (a, b) =>
        liveCount(b) - liveCount(a) ||
        b.sessions.length - a.sessions.length ||
        a.label.localeCompare(b.label),
    );
  }, [sessions, machines]);

  // What the workspace can arrange: every session publishing a terminal right
  // now. A session with no URL has nothing to frame, and a finished one's tunnel
  // has stopped answering — neither belongs in a pane.
  const terminals = useMemo<TerminalPane[]>(
    () =>
      sessions
        .filter((s) => s.terminal && (s.status === 'running' || s.status === 'paused'))
        .map((s) => ({
          id: s.id,
          title: `${s.host || s.agent}${s.cwd ? ` · ${shortPath(s.cwd)}` : ''}`,
          url: s.terminal!,
        })),
    [sessions],
  );

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
    <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[15rem_1fr] lg:gap-6">
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
              {g.machine?.capacity ? (
                // The control plane already composes this ("20 vCPU / 128G / 1× GB10").
                // Re-deriving it from spec here would be a second summary to keep true.
                <span className="truncate text-xs text-muted-foreground">{g.machine.capacity}</span>
              ) : null}
              <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                {g.sessions.filter((x) => isLive(x, g.machine)).length || (g.machine ? 'idle' : '')}
              </span>
            </header>

            {g.machine?.metrics ? (
              <p className="mb-2 flex gap-3 text-xs tabular-nums text-muted-foreground">
                {g.machine.metrics.load1 ? <span>load {g.machine.metrics.load1.toFixed(2)}</span> : null}
                {memPercent(g.machine.metrics) != null && (
                  <span>mem {memPercent(g.machine.metrics)}%</span>
                )}
                {g.machine.metrics.gpuUtil ? (
                  <span>gpu {Math.round(g.machine.metrics.gpuUtil * 100)}%</span>
                ) : null}
              </p>
            ) : null}

            <ul className="flex flex-col gap-1.5">
              {(showAll[g.key] ? g.sessions : g.sessions.filter((x) => isLive(x, g.machine))).map((s) => {
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
                            isLive(s, g.machine) ? DOT[s.status] : DOT.done
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
                const hidden = g.sessions.filter((x) => !isLive(x, g.machine)).length;
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

      <section className={`flex min-h-0 min-w-0 flex-col ${onTerminal ? '' : 'hidden lg:flex'}`}>
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <button
            type="button"
            onClick={() => setOnTerminal(false)}
            className="lg:hidden text-sm underline underline-offset-4"
          >
            ← Machines
          </button>
          {active ? (
            <>
              <h2 className="text-sm font-medium">{active.host || active.agent}</h2>
              <span className="truncate font-mono text-xs text-muted-foreground">
                {active.cwd || active.repo}
              </span>
            </>
          ) : null}
          {/* No keyboard legend here. ⌥←/⌥→ is bound on `window`, and a click
              inside a terminal moves focus into that frame's document — from
              which this page receives no keydown at all. The shortcut therefore
              works only while focus is in the chrome, which is precisely when
              nobody needs it. Printing it as an instruction was a promise the
              page cannot keep; it comes back when the machine's terminal
              forwards the chord (see the tiles doc). */}
          {active?.terminal ? (
            <a
              href={active.terminal}
              target="_blank"
              rel="noreferrer noopener"
              className="shrink-0 text-xs underline underline-offset-4"
            >
              Open in a tab
            </a>
          ) : null}
        </div>

        {/* One workspace, every live terminal available to it. The roster on the
            left chooses what to LOOK at; the tiles decide how it is arranged, and
            a pane keeps its shell across a split (components/sessions/tiles). */}
        {/* The workspace takes the room that is left, rather than a fraction of
            the viewport chosen when the chrome above it was a different height. */}
        <div className="min-h-0 flex-1">
          <Tiles panes={terminals} />
        </div>
      </section>
    </div>
  );
}
