"use client";

import { YStack, XStack, H3, Paragraph, SizableText } from '@hanzo/ui';
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

import { watchRuns, type Row } from "@/lib/agent/watch";

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

/**
 * Fold one live update into the list.
 *
 * A run that is not here yet goes to the FRONT — the newest run is the one you
 * just started, and it belongs where you are looking. One already here is merged
 * rather than replaced: the feed carries a session's changing fields, and a row
 * built from the list read has fields (`org`, `project`) a later frame may not
 * repeat. Overwriting would blank the "Read" link on the first status change.
 */
function fold(rows: SessionRow[], row: Row): SessionRow[] {
  const at = rows.findIndex((r) => r.id === row.id);
  if (at < 0) {
    return [
      {
        id: row.id,
        org: row.org ?? "",
        agent: row.agent ?? "",
        status: row.status ?? "",
        events: row.events ?? 0,
        updatedAt: row.updatedAt ?? "",
        ...(row.title ? { title: row.title } : {}),
        ...(row.project ? { project: row.project } : {}),
        ...(row.published ? { published: true } : {}),
      },
      ...rows,
    ];
  }
  const next = rows.slice();
  next[at] = { ...next[at], ...strip(row) };
  return next;
}

/** Drop the fields a frame did not state, so a merge never blanks one. */
function strip(row: Row): Partial<SessionRow> {
  const out: Partial<SessionRow> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v !== undefined && v !== "") (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

type State =
  | { kind: "loading" }
  | { kind: "signedOut" }
  | { kind: "error"; message: string }
  | { kind: "ready"; sessions: SessionRow[] };

export function MyBuilds() {
  const [state, setState] = useState<State>({ kind: "loading" });

  // The list read is the TRUTH and the feed is the live half — the same division
  // cloud states about its own stream, and the reason both are here rather than
  // one. A GET answers "what do I have", which a stream joined mid-flight cannot;
  // the stream answers "what just changed", which a page-load read cannot. This
  // used to be the GET alone, so a run started in another tab, or this one's own
  // progress, appeared only if you reloaded.
  useEffect(() => {
    const gone = new AbortController();

    (async () => {
      try {
        const r = await fetch("/v1/agents/sessions", { cache: "no-store", signal: gone.signal });
        if (r.status === 401) return setState({ kind: "signedOut" });
        if (!r.ok) return setState({ kind: "error", message: `HTTP ${r.status}` });
        const body = (await r.json()) as { sessions?: SessionRow[] };
        setState({ kind: "ready", sessions: body.sessions ?? [] });
      } catch {
        if (!gone.signal.aborted) setState({ kind: "error", message: "Unable to reach the API" });
      }
    })();

    watchRuns({
      signal: gone.signal,
      onSession: (row) =>
        // Only once the list has landed. A frame that arrived first would
        // otherwise replace "Loading…" with a one-row list that looks complete.
        setState((s) => (s.kind === "ready" ? { kind: "ready", sessions: fold(s.sessions, row) } : s)),
    }).catch(() => {
      // Watching is the live half, never the truth. A feed that will not open
      // leaves the list exactly as the read left it — correct, just not moving.
    });

    return () => gone.abort();
  }, []);

  return (
    <YStack marginTop="$6" paddingTop="$5" borderTopWidth={1} borderColor="$borderColor">
      <XStack flexWrap="wrap" alignItems="baseline" justifyContent="space-between" gap="$2">
        <H3 fontSize="$6" fontWeight="500" color="$color">Your builds</H3>
        <Paragraph fontSize="$3" color="$color11">
          The agent session behind each project — the whole chat, and the commits it made.
        </Paragraph>
      </XStack>

      {state.kind === "loading" ? (
        <Paragraph marginTop="$4" fontSize="$3" color="$color11">Loading…</Paragraph>
      ) : state.kind === "signedOut" ? (
        <Paragraph marginTop="$4" fontSize="$3" color="$color11">
          <Link href="/login"><SizableText textDecorationLine="underline" hoverStyle={{ color: "$color" }}>
            Sign in
          </SizableText></Link>{" "}
          to see the sessions behind your projects.
        </Paragraph>
      ) : state.kind === "error" ? (
        // Say what went wrong rather than rendering an empty list that reads as
        // "you have none" — a wrong zero is worse than a visible failure.
        <Paragraph marginTop="$4" fontSize="$3" color="$color11">
          Could not load your builds ({state.message}).
        </Paragraph>
      ) : state.sessions.length === 0 ? (
        <YStack marginTop="$4" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" padding="$4">
          <Paragraph fontSize="$3" color="$color11">
            No sessions yet. Publish the session that built a repo:
          </Paragraph>
          <SizableText marginTop="$3" borderRadius="$2" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$2.5" fontFamily="$mono" fontSize={11} color="$color11" overflow="scroll" whiteSpace="pre">
            hanzo agent publish &lt;project&gt; --bind
          </SizableText>
        </YStack>
      ) : (
        <YStack marginTop="$4" borderTopWidth={1} borderBottomWidth={1} borderColor="$borderColor">
          {state.sessions.map((s) => (
            <XStack key={s.id} flexWrap="wrap" alignItems="center" justifyContent="space-between" gap="$3" paddingVertical="$4">
              <YStack minWidth={0}>
                <XStack alignItems="center" gap="$2">
                  <MessageSquare size={14} />
                  <SizableText numberOfLines={1} fontSize="$3" fontWeight="500" color="$color">
                    {s.title || s.project || s.id}
                  </SizableText>
                  {s.published ? (
                    <Globe size={12} aria-label="public" />
                  ) : (
                    <Lock size={12} aria-label="private" />
                  )}
                </XStack>
                <SizableText marginTop="$1" fontFamily="$mono" fontSize={11} color="$color11">
                  {s.project ? `${s.project} · ` : ""}
                  {s.agent} · {s.events} turns · {s.status}
                </SizableText>
              </YStack>
              {s.published && s.project && s.org ? (
                <Link
                  href={`/builds/${s.org}/${s.project}`}
                ><XStack flexShrink={0} alignItems="center" gap="$1.5">
                  <SizableText fontFamily="$mono" fontSize={11} color="$color11" hoverStyle={{ color: "$color" }}>Read</SizableText>
                  <ArrowUpRight size={12} />
                </XStack></Link>
              ) : null}
            </XStack>
          ))}
        </YStack>
      )}
    </YStack>
  );
}
