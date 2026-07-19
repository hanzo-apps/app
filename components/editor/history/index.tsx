"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Copy,
  Inbox,
  Loader2,
  MoreVertical,
  Undo2,
} from "lucide-react";
import classNames from "classnames";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@hanzo/ui";

import { HtmlHistory, Page } from "@/types";
import {
  checkpointManager,
  type CheckpointMetadata,
} from "@/lib/vfs/checkpoint";
import { readBookmarks, toggleBookmark } from "./bookmarks";

/**
 * A single revision as the panel sees it — the union of the two real sources
 * the app exposes for THIS surface:
 *   - `edit`       in-session AI/manual edits (the `history` prop, restored via
 *                  `setPages`) — the source already wired into the builder.
 *   - `checkpoint` persisted VFS checkpoints (survive reload, restored via
 *                  `checkpointManager.restoreCheckpoint`) — merged in when the
 *                  open project has any.
 * One row shape, one revert affordance; the restore mechanism is an internal
 * detail of the row's `kind`.
 */
type Revision =
  | {
      key: string;
      kind: "edit";
      title: string;
      at: number;
      pages: Page[];
    }
  | {
      key: string;
      kind: "checkpoint";
      title: string;
      at: number;
      id: string;
      cpKind: CheckpointMetadata["kind"];
    };

/** djb2 — a tiny stable hash so an edit's bookmark key survives list reordering
 *  (new edits unshift, so index is NOT stable; createdAt + prompt is). */
function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

function editKey(item: HtmlHistory): string {
  return `edit:${new Date(item.createdAt).getTime()}:${hash(item.prompt ?? "")}`;
}

/** Compact Geist-Mono timestamp: bare time today, `MMM D HH:MM` otherwise. */
function fmt(ts: number): string {
  const d = new Date(ts);
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  if (d.toDateString() === new Date().toDateString()) return time;
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${date} ${time}`;
}

/** The stable project key we namespace bookmarks + checkpoints by. */
function projectKey(): string {
  if (typeof window === "undefined") return "local";
  return (window as unknown as { __projectSlug?: string }).__projectSlug || "local";
}

/**
 * HistoryPanel — the embedded version history / bookmarks list, docked INSIDE
 * the builder's left panel under its Chat · History · Bookmarks tab strip
 * (Lovable parity). The parent owns the tab strip and hands the active view in
 * via `tab`; this renders the newest-first revision list, and each row can be
 * reverted (loads that version's HTML into the preview + editor) or bookmarked.
 */
export function HistoryPanel({
  history,
  setPages,
  tab,
}: {
  history: HtmlHistory[];
  setPages: (pages: Page[]) => void;
  tab: "history" | "bookmarks";
}) {
  const [checkpoints, setCheckpoints] = useState<CheckpointMetadata[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Merge both real sources into ONE newest-first revision list.
  const revisions = useMemo<Revision[]>(() => {
    const edits: Revision[] = (history ?? []).map((item) => ({
      key: editKey(item),
      kind: "edit",
      title: item.prompt?.trim() || "Manual edit",
      at: new Date(item.createdAt).getTime(),
      pages: item.pages,
    }));
    const cps: Revision[] = checkpoints.map((cp) => ({
      key: `cp:${cp.id}`,
      kind: "checkpoint",
      title: cp.description?.trim() || "Checkpoint",
      at: new Date(cp.timestamp).getTime(),
      id: cp.id,
      cpKind: cp.kind,
    }));
    return [...edits, ...cps].sort((a, b) => b.at - a.at);
  }, [history, checkpoints]);

  // The highlighted "current" row: an explicit revert target, else the newest.
  const currentKey = activeKey ?? revisions[0]?.key ?? null;

  // When a NEW edit lands (the newest edit key changes), the builder is on that
  // new state — clear any pinned revert target so the highlight follows it.
  const newestEditKey = revisions.find((r) => r.kind === "edit")?.key ?? null;
  const prevNewestEdit = useRef(newestEditKey);
  useEffect(() => {
    if (prevNewestEdit.current !== newestEditKey) {
      prevNewestEdit.current = newestEditKey;
      setActiveKey(null);
    }
  }, [newestEditKey]);

  // Hydrate bookmarks + pull any persisted checkpoints (memory-only surfaces
  // simply have none — safe + silent). A restore elsewhere refreshes the list.
  useEffect(() => {
    const pk = projectKey();
    setBookmarks(readBookmarks(pk));

    let alive = true;
    const loadCheckpoints = async () => {
      if (pk === "local") return; // no persisted project → memory history only
      try {
        const cps = await checkpointManager.getCheckpoints(pk);
        if (alive) setCheckpoints(cps);
      } catch {
        /* VFS unavailable — the in-session history still renders */
      }
    };
    loadCheckpoints();

    const onRestored = () => loadCheckpoints();
    window.addEventListener("checkpointRestored", onRestored);
    return () => {
      alive = false;
      window.removeEventListener("checkpointRestored", onRestored);
    };
  }, []);

  const revert = async (rev: Revision) => {
    if (rev.kind === "edit") {
      setPages(rev.pages);
      setActiveKey(rev.key);
      toast.success("Reverted to this version");
      return;
    }
    // Persisted checkpoint → hard restore through the VFS.
    setBusyKey(rev.key);
    try {
      const ok = await checkpointManager.restoreCheckpoint(rev.id);
      if (ok) {
        setActiveKey(rev.key);
        window.dispatchEvent(
          new CustomEvent("checkpointRestored", {
            detail: { checkpointId: rev.id },
          }),
        );
        toast.success("Restored this revision");
      } else {
        toast.error("Couldn't restore this revision");
      }
    } catch {
      toast.error("Couldn't restore this revision");
    } finally {
      setBusyKey(null);
    }
  };

  const toggle = (key: string) => {
    setBookmarks(toggleBookmark(projectKey(), key));
  };

  const copyTitle = async (title: string) => {
    try {
      await navigator.clipboard.writeText(title);
      toast.success("Copied prompt");
    } catch {
      /* clipboard unavailable */
    }
  };

  const shown =
    tab === "bookmarks"
      ? revisions.filter((r) => bookmarks.has(r.key))
      : revisions;

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2 [scrollbar-width:thin]">
      {shown.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <ul className="space-y-0.5">
          {shown.map((rev) => {
            const isActive = rev.key === currentKey;
            const isBookmarked = bookmarks.has(rev.key);
            const isBusy = busyKey === rev.key;
            return (
              <li
                key={rev.key}
                className={classNames(
                  "group relative flex items-center gap-1 rounded-lg px-2 py-2 transition-colors duration-150 motion-reduce:transition-none",
                  isActive
                    ? "bg-white/[0.06] ring-1 ring-inset ring-white/15"
                    : "hover:bg-white/[0.04]",
                )}
              >
                {/* Primary target — the whole label reverts to this revision */}
                <button
                  type="button"
                  onClick={() => revert(rev)}
                  className="min-w-0 flex-1 rounded-md text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-white/25"
                  title="Restore this version"
                >
                  <div className="flex items-center gap-1.5">
                    {isActive && (
                      <span
                        className="size-1.5 shrink-0 rounded-full bg-white"
                        aria-hidden
                      />
                    )}
                    <span className="truncate text-[13px] leading-snug text-white/85 group-hover:text-white">
                      {rev.title}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-white/35">
                    <span>{fmt(rev.at)}</span>
                    {rev.kind === "checkpoint" && (
                      <span className="uppercase tracking-wide text-white/30">
                        · {rev.cpKind === "manual" ? "save" : rev.cpKind}
                      </span>
                    )}
                  </div>
                </button>

                {/* Hover action cluster: bookmark · revert · more */}
                <div className="flex shrink-0 items-center gap-0.5">
                  <IconAction
                    onClick={() => toggle(rev.key)}
                    title={isBookmarked ? "Remove bookmark" : "Bookmark this version"}
                    aria-pressed={isBookmarked}
                    className={
                      isBookmarked
                        ? "!opacity-100 text-white/80"
                        : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    }
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="size-3.5" />
                    ) : (
                      <Bookmark className="size-3.5" />
                    )}
                  </IconAction>

                  <IconAction
                    onClick={() => revert(rev)}
                    disabled={isBusy}
                    title="Restore this version"
                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    {isBusy ? (
                      <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />
                    ) : (
                      <Undo2 className="size-3.5" />
                    )}
                  </IconAction>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        title="More"
                        className="grid size-6 place-items-center rounded-md text-white/40 opacity-0 transition hover:bg-white/10 hover:text-white focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:bg-white/10 data-[state=open]:opacity-100 motion-reduce:transition-none"
                      >
                        <MoreVertical className="size-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="min-w-[180px] !rounded-xl !border-white/10 !bg-[#0a0a0a] !p-1 text-white shadow-2xl shadow-black/60"
                    >
                      <MenuItem onSelect={() => revert(rev)}>
                        <Undo2 className="size-3.5" />
                        Restore this version
                      </MenuItem>
                      <MenuItem onSelect={() => toggle(rev.key)}>
                        {isBookmarked ? (
                          <>
                            <BookmarkCheck className="size-3.5" />
                            Remove bookmark
                          </>
                        ) : (
                          <>
                            <Bookmark className="size-3.5" />
                            Bookmark
                          </>
                        )}
                      </MenuItem>
                      {rev.kind === "edit" && (
                        <MenuItem onSelect={() => copyTitle(rev.title)}>
                          <Copy className="size-3.5" />
                          Copy prompt
                        </MenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** A hover-revealed square icon button used across the row action cluster. */
function IconAction({
  onClick,
  title,
  disabled,
  className,
  children,
  "aria-pressed": ariaPressed,
}: {
  onClick: () => void;
  title: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  "aria-pressed"?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={ariaPressed}
      className={classNames(
        "grid size-6 place-items-center rounded-md text-white/40 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30 disabled:opacity-50 motion-reduce:transition-none",
        className,
      )}
    >
      {children}
    </button>
  );
}

function MenuItem({
  onSelect,
  children,
}: {
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <DropdownMenuItem
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-white/80 focus:!bg-white/10 focus:!text-white"
    >
      {children}
    </DropdownMenuItem>
  );
}

function EmptyState({ tab }: { tab: "history" | "bookmarks" }) {
  const Icon = tab === "bookmarks" ? Bookmark : Inbox;
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
      <Icon className="size-7 text-white/20" />
      <p className="text-[13px] font-medium text-white/70">
        {tab === "bookmarks" ? "No bookmarks yet" : "No revisions yet"}
      </p>
      <p className="max-w-[220px] text-xs text-white/35">
        {tab === "bookmarks"
          ? "Bookmark any revision to pin it here for quick access."
          : "Your edits appear here — restore any earlier version."}
      </p>
    </div>
  );
}
