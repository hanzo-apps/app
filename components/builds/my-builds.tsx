"use client";

import { YStack, XStack, H3, Paragraph, SizableText } from '@hanzo/gui';
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
        <YStack marginTop="$4" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" padding="$4">
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
                <SizableText marginTop="$1" fontFamily="$mono" fontSize={11} textTransform="uppercase" letterSpacing={1.92} color="$color11">
                  {s.project ? `${s.project} · ` : ""}
                  {s.agent} · {s.events} turns · {s.status}
                </SizableText>
              </YStack>
              {s.published && s.project && s.org ? (
                <Link
                  href={`/builds/${s.org}/${s.project}`}
                ><XStack flexShrink={0} alignItems="center" gap="$1.5">
                  <SizableText fontFamily="$mono" fontSize={11} textTransform="uppercase" letterSpacing={1.92} color="$color11" hoverStyle={{ color: "$color" }}>Read</SizableText>
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
