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
import { Anchor, H2, Paragraph, SizableText, View, XStack, YStack } from '@hanzo/gui';
import { Button } from '@hanzo/ui';
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
  running: '$green9',
  paused: '$yellow9',
  done: '$color8',
  error: '$red9',
  online: '$green9',
  draining: '$yellow9',
  offline: '$color8',
};

/** The dot every unknown status falls back to — the same dimmed grey `done` and
 *  `offline` use, so an unrecognised state reads as "not live" rather than blank. */
const DOT_UNKNOWN = '$color8';

/** A `<ul>` is the right element for a list of sessions and the wrong one for a
 *  layout: the browser's own markers and indent are chrome this design never had
 *  (Tailwind's preflight used to strip them, and preflight is gone). */
const BARE_LIST = { listStyle: 'none', paddingInlineStart: 0 } as const;

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
      <YStack
        borderRadius="$5"
        borderWidth={1}
        borderStyle="dashed"
        borderColor="$borderColor"
        paddingHorizontal="$5"
        paddingVertical="$8"
      >
        <Paragraph textAlign="center" fontSize="$3" fontWeight="500">No machines are registered.</Paragraph>
        <Paragraph alignSelf="center" marginTop="$2" maxWidth={448} textAlign="center" fontSize="$3" color="$color11">
          A machine appears here the first time <code>hanzo code</code> runs on it.
        </Paragraph>
      </YStack>
    );
  }

  return (
    // Two columns at lg (a 22rem roster beside the workspace), one below it.
    <YStack gap="$5" $lg={{ flexDirection: 'row' }}>
      <YStack
        gap="$4.5"
        display={onTerminal ? 'none' : 'flex'}
        $lg={{ display: 'flex', width: 352, flexShrink: 0 }}
      >
        {groups.map((g) => (
          <YStack render="section" key={g.key}>
            <XStack render="header" marginBottom="$2" alignItems="baseline" gap="$2">
              <View
                aria-hidden
                width={8}
                height={8}
                flexShrink={0}
                borderRadius="$10"
                backgroundColor={DOT[g.machine?.status ?? ''] ?? DOT_UNKNOWN}
              />
              <H2 numberOfLines={1} fontSize="$3" fontWeight="600">{g.label}</H2>
              {g.machine?.capacity ? (
                // The control plane already composes this ("20 vCPU / 128G / 1× GB10").
                // Re-deriving it from spec here would be a second summary to keep true.
                <SizableText numberOfLines={1} fontSize="$1" color="$color11">{g.machine.capacity}</SizableText>
              ) : null}
              <SizableText marginLeft="auto" flexShrink={0} fontSize="$1" fontVariant={['tabular-nums']} color="$color11">
                {g.sessions.filter((x) => isLive(x, g.machine)).length || (g.machine ? 'idle' : '')}
              </SizableText>
            </XStack>

            {g.machine?.metrics ? (
              <SizableText render="p" marginBottom="$2" gap="$3" fontSize="$1" fontVariant={['tabular-nums']} color="$color11" display="flex" flexDirection="row">
                {g.machine.metrics.load1 ? <span>load {g.machine.metrics.load1.toFixed(2)}</span> : null}
                {memPercent(g.machine.metrics) != null && (
                  <span>mem {memPercent(g.machine.metrics)}%</span>
                )}
                {g.machine.metrics.gpuUtil ? (
                  <span>gpu {Math.round(g.machine.metrics.gpuUtil * 100)}%</span>
                ) : null}
              </SizableText>
            ) : null}

            <YStack render="ul" gap="$1.5" style={BARE_LIST}>
              {(showAll[g.key] ? g.sessions : g.sessions.filter((x) => isLive(x, g.machine))).map((s) => {
                const on = s.id === active?.id;
                return (
                  <li key={s.id}>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setSelected(s.id);
                        setOnTerminal(true);
                      }}
                      aria-current={on}
                      width="100%"
                      height="auto"
                      flexDirection="column"
                      alignItems="stretch"
                      justifyContent="flex-start"
                      borderRadius="$3"
                      borderWidth={1}
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      borderColor={on ? '$color' : '$borderColor'}
                      backgroundColor={on ? '$color3' : 'transparent'}
                      hoverStyle={on ? undefined : { backgroundColor: '$color3' }}
                    >
                      <XStack alignItems="center" gap="$2">
                        <View
                          aria-hidden
                          width={6}
                          height={6}
                          flexShrink={0}
                          borderRadius="$10"
                          backgroundColor={isLive(s, g.machine) ? DOT[s.status] : DOT.done}
                        />
                        <SizableText numberOfLines={1} fontSize="$3">{s.agent}</SizableText>
                        <SizableText marginLeft="auto" flexShrink={0} fontSize="$1" fontVariant={['tabular-nums']} color="$color11">
                          {ago(s.updatedAt, now)}
                        </SizableText>
                      </XStack>
                      {/* the working directory is the thing that says WHICH work this is */}
                      <SizableText marginTop="$0.5" display="block" numberOfLines={1} textAlign="left" fontFamily="$mono" fontSize="$1" color="$color11">
                        {shortPath(s.cwd) || s.repo || s.title}
                      </SizableText>
                    </Button>
                  </li>
                );
              })}
              {(() => {
                const hidden = g.sessions.filter((x) => !isLive(x, g.machine)).length;
                if (g.sessions.length === 0) {
                  return (
                    <SizableText render="li" paddingHorizontal="$3" paddingVertical="$2" fontSize="$1" color="$color11">
                      nothing running
                    </SizableText>
                  );
                }
                if (hidden === 0 || showAll[g.key]) {
                  return hidden > 0 ? (
                    <li>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAll((v) => ({ ...v, [g.key]: false }))}
                        height="auto"
                        paddingHorizontal="$3"
                        paddingVertical="$2"
                        hoverStyle={{ backgroundColor: 'transparent' }}
                      >
                        <SizableText fontSize="$1" color="$color11" textDecorationLine="underline">
                          Hide {hidden} finished
                        </SizableText>
                      </Button>
                    </li>
                  ) : null;
                }
                // Finished sessions are history, not noise to scroll past — one line
                // says how much there is and opens it on demand.
                return (
                  <li>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAll((v) => ({ ...v, [g.key]: true }))}
                      height="auto"
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      hoverStyle={{ backgroundColor: 'transparent' }}
                    >
                      <SizableText fontSize="$1" color="$color11" textDecorationLine="underline">
                        {hidden} finished
                      </SizableText>
                    </Button>
                  </li>
                );
              })()}
            </YStack>
          </YStack>
        ))}
      </YStack>

      <YStack
        render="section"
        minWidth={0}
        display={onTerminal ? 'flex' : 'none'}
        $lg={{ display: 'flex', flex: 1 }}
      >
        <XStack marginBottom="$3" flexWrap="wrap" alignItems="baseline" columnGap="$3" rowGap="$1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOnTerminal(false)}
            height="auto"
            paddingHorizontal={0}
            paddingVertical={0}
            hoverStyle={{ backgroundColor: 'transparent' }}
            $lg={{ display: 'none' }}
          >
            <SizableText fontSize="$3" textDecorationLine="underline">← Machines</SizableText>
          </Button>
          {active ? (
            <>
              <H2 fontSize="$3" fontWeight="500">{active.host || active.agent}</H2>
              <SizableText numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color11">
                {active.cwd || active.repo}
              </SizableText>
            </>
          ) : null}
          {/* The sweep, said once where it is used. */}
          <SizableText marginLeft="auto" flexShrink={0} fontSize="$1" color="$color11">
            ⌥← ⌥→ to move between panes
          </SizableText>
          {active?.terminal ? (
            <Anchor
              href={active.terminal}
              target="_blank"
              rel="noreferrer noopener"
              flexShrink={0}
              fontSize="$1"
              textDecorationLine="underline"
            >
              Open in a tab
            </Anchor>
          ) : null}
        </XStack>

        {/* One workspace, every live terminal available to it. The roster on the
            left chooses what to LOOK at; the tiles decide how it is arranged, and
            a pane keeps its shell across a split (components/sessions/tiles). */}
        <YStack height="calc(100dvh - 13rem)" $lg={{ height: '70vh' }}>
          <Tiles panes={terminals} />
        </YStack>
      </YStack>
    </YStack>
  );
}
