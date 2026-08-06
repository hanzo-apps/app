"use client";

/**
 * /dev/:org/:project/issues — the project's work items.
 *
 * The one board for a project: what is open, who has it, and — for work an agent
 * is doing — the live status of the agent session behind it. Rows come from the
 * cloud tracker (`/v1/tracker`, the ONE work-item primitive); agent status comes
 * from the session registry (`/v1/agents/sessions`, the ONE agent-run plane).
 * This page joins the two for display and stores neither.
 *
 * The `:project` segment is a board HANDLE here — a board key (`ENG`) or a board
 * name (`my-site`) — so a project's board and a standalone board both open the
 * same page. See `boardFor`.
 */

import { XStack, YStack, SizableText, Paragraph } from "@hanzo/ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Input, toast } from "@hanzo/ui";
import { Bot, Plus } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { accent, panel, row, rows, selected } from "@/lib/chrome";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { currentOrg, setCurrentOrg } from "@/lib/org-scope";
import {
  boardFor,
  createBoard,
  createIssue,
  listBoards,
  listIssues,
  proposeKey,
  refSession,
  STATUS_LABEL,
  STATUSES,
  updateIssue,
  type Board,
  type Issue,
  type Status,
} from "@/lib/api/tracker";
import type { AgentSession, SessionStatus } from "@/lib/sessions";

/** Column colors. Done reads calm, canceled reads spent, the rest read live. */
const STATUS_COLOR: Record<Status, string> = {
  backlog: "$color9",
  todo: "$color11",
  in_progress: "$blue10",
  done: "$green10",
  canceled: "$color8",
};

/** An agent session's four states, colored the same way its work reads. */
const SESSION_COLOR: Record<SessionStatus, string> = {
  running: "$blue10",
  paused: "$yellow10",
  done: "$green10",
  error: "$red10",
};

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <XStack
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$3"
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor="$color2"
      alignItems="center"
      gap="$1.5"
    >
      <YStack width={6} height={6} borderRadius={3} backgroundColor={color} />
      <SizableText fontSize="$1" color="$color11">
        {label}
      </SizableText>
    </XStack>
  );
}

/**
 * The agent behind a work item, when there is one.
 *
 * `extRef` names the session; the registry says how it is going. When the
 * registry does not know the id — it lists root sessions, and a subagent's id is
 * not among them — the chip still says an agent owns this, because that is true
 * and pretending otherwise would be the more misleading answer.
 */
function AgentChip({ id, status }: { id: string; status?: SessionStatus }) {
  return (
    <XStack
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$3"
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor="$color2"
      alignItems="center"
      gap="$1.5"
    >
      <Bot size={11} />
      <SizableText fontSize="$1" color="$color11">
        {status ? status : `agent ${id.slice(0, 7)}`}
      </SizableText>
      {status ? (
        <YStack width={6} height={6} borderRadius={3} backgroundColor={SESSION_COLOR[status]} />
      ) : null}
    </XStack>
  );
}

export default function ProjectIssuesPage() {
  const params = useParams<{ org: string; project: string }>();
  const org = decodeURIComponent(params.org || "");
  const handle = decodeURIComponent(params.project || "");

  const [board, setBoard] = useState<Board | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [sessions, setSessions] = useState<Record<string, SessionStatus>>({});
  const [status, setStatus] = useState<Status | "">("");
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState("");

  /** Resolve the board, then its issues. Boards are listed, never guessed. */
  const load = useCallback(async () => {
    if (org && currentOrg() !== org) setCurrentOrg(org);
    setLoading(true);
    try {
      const found = boardFor(await listBoards(), handle);
      setBoard(found);
      setKey(found ? found.key : proposeKey(handle));
      setIssues(found ? await listIssues(found.key) : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load the board");
      setBoard(null);
    } finally {
      setLoading(false);
    }
  }, [org, handle]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Agent status for the whole page in ONE request, joined by id — never one
   * request per row, which is how a list of twenty becomes twenty round trips.
   */
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch("/v1/agents/sessions", { credentials: "include" });
        if (!res.ok) return;
        const body = (await res.json()) as { sessions?: AgentSession[] };
        if (!live) return;
        const map: Record<string, SessionStatus> = {};
        for (const s of body.sessions || []) map[s.id] = s.status;
        setSessions(map);
      } catch {
        /* the board is still the board without agent status */
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const shown = useMemo(
    () => (status ? issues.filter((i) => i.status === status) : issues),
    [issues, status],
  );

  const open = async () => {
    const t = title.trim();
    if (!t || !board) return;
    setBusy(true);
    try {
      const made = await createIssue(board.key, { title: t });
      setIssues((prev) => [made, ...prev]);
      setTitle("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open the issue");
    } finally {
      setBusy(false);
    }
  };

  /** Advance a row through the board without leaving the list. */
  const move = async (issue: Issue, next: Status) => {
    const before = issue.status;
    setIssues((prev) =>
      prev.map((i) => (i.id === issue.id ? { ...i, status: next } : i)),
    );
    try {
      await updateIssue(issue.projectKey, issue.number, { status: next });
    } catch (e) {
      setIssues((prev) =>
        prev.map((i) => (i.id === issue.id ? { ...i, status: before } : i)),
      );
      toast.error(e instanceof Error ? e.message : "Could not move the issue");
    }
  };

  const start = async () => {
    setBusy(true);
    try {
      const made = await createBoard({ key: key.trim().toUpperCase(), name: handle });
      setBoard(made);
      setIssues([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the board");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingScreen>Loading issues…</LoadingScreen>;

  return (
    <AppShell
      currentView="all-projects"
      title="Issues"
      subtitle={
        board
          ? `${board.key} · ${issues.length} ${issues.length === 1 ? "item" : "items"}`
          : handle
      }
    >
      {!board ? (
        <YStack {...panel} padding="$4.5" gap="$3" maxWidth={520}>
          <SizableText fontSize="$4" fontWeight="600" color="$color">
            No board yet
          </SizableText>
          <Paragraph fontSize="$2" color="$color11">
            Work items for {handle} live on a tracker board. Give it a key — the
            short handle that prefixes every item, like {key}-1.
          </Paragraph>
          <XStack gap="$2" flexWrap="wrap">
            <Input
              value={key}
              onChangeText={setKey}
              placeholder="KEY"
              maxLength={8}
              width={120}
              autoCapitalize="characters"
            />
            <Button {...accent} disabled={busy || !key.trim()} onPress={start}>
              <SizableText color="$color12">
                {busy ? "Creating…" : "Create board"}
              </SizableText>
            </Button>
          </XStack>
        </YStack>
      ) : (
        <YStack gap="$4">
          {/* Compose: one line, because opening an item should cost one line. */}
          <XStack gap="$2" flexWrap="wrap" alignItems="center">
            <Input
              flex={1}
              minWidth={220}
              value={title}
              onChangeText={setTitle}
              placeholder="What needs doing?"
              onSubmitEditing={open}
            />
            <Button {...accent} disabled={busy || !title.trim()} onPress={open}>
              <XStack alignItems="center" gap="$1.5">
                <Plus size={14} />
                <SizableText color="$color12">Open</SizableText>
              </XStack>
            </Button>
          </XStack>

          <XStack gap="$1.5" flexWrap="wrap">
            <Button size="sm" variant="outline" {...selected(status === "")} onPress={() => setStatus("")}>
              All
            </Button>
            {STATUSES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant="outline"
                {...selected(status === s)}
                onPress={() => setStatus(s)}
              >
                {STATUS_LABEL[s]}
              </Button>
            ))}
          </XStack>

          {shown.length === 0 ? (
            <YStack {...panel} padding="$4.5">
              <Paragraph fontSize="$2" color="$color11">
                {issues.length === 0
                  ? "Nothing open. The first line above starts the board."
                  : `Nothing in ${STATUS_LABEL[status as Status]}.`}
              </Paragraph>
            </YStack>
          ) : (
            <YStack {...rows}>
              {shown.map((issue) => {
                const session = refSession(issue.extRef);
                return (
                  <XStack key={issue.id} {...row} flexWrap="wrap">
                    <YStack minWidth={0} flex={1} rowGap="$1.5">
                      <XStack gap="$2" alignItems="center" flexWrap="wrap">
                        <SizableText fontSize="$1" color="$color11" fontFamily="$mono">
                          {issue.identifier}
                        </SizableText>
                        <SizableText fontSize="$3" fontWeight="500" color="$color">
                          {issue.title}
                        </SizableText>
                      </XStack>
                      <XStack gap="$1.5" alignItems="center" flexWrap="wrap">
                        <Chip
                          label={STATUS_LABEL[issue.status]}
                          color={STATUS_COLOR[issue.status]}
                        />
                        {issue.assignee ? (
                          <SizableText fontSize="$1" color="$color11">
                            {issue.assignee}
                          </SizableText>
                        ) : null}
                        {issue.labels.map((l) => (
                          <SizableText key={l} fontSize="$1" color="$color11">
                            #{l}
                          </SizableText>
                        ))}
                        {session ? (
                          <AgentChip id={session} status={sessions[session]} />
                        ) : null}
                      </XStack>
                    </YStack>
                    {issue.status !== "done" ? (
                      <Button size="sm" variant="outline" onPress={() => move(issue, "done")}>
                        Done
                      </Button>
                    ) : null}
                  </XStack>
                );
              })}
            </YStack>
          )}
        </YStack>
      )}
    </AppShell>
  );
}
