"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  Bookmark,
  BookmarkCheck,
  Eye,
  Github,
  GitBranch,
  GitlabIcon,
  ListTree,
  Loader2,
  MoreVertical,
  RotateCcw,
  Undo2,
  UploadCloud,
  X,
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
import { HanzoLogo } from "@/components/HanzoLogo";
import { currentOrg } from "@/lib/org-scope";
import {
  checkpointManager,
  type CheckpointMetadata,
} from "@/lib/vfs/checkpoint";
import {
  fetchGitCommits,
  fetchCommitPages,
  summarizeCommitMessages,
  providerFromRepoUrl,
  type GitCommit,
  type GitProvider,
} from "@/lib/api/git";
import {
  fetchAppHistory,
  putBookmarkToggle,
  postRevision,
} from "@/lib/api/history";
import { readBookmarks, saveBookmarks } from "./bookmarks";
import type { DetailsRev } from "./details";

/**
 * A revision as the panel sees it — the union of the THREE real sources, primary
 * (git) first. Commits are the authoritative timeline; edits + checkpoints are
 * uncommitted working changes (dirty tree on top, committed history below).
 */
type Revision =
  | {
      key: string;
      kind: "commit";
      title: string;
      at: number;
      sha: string;
      shortSha: string;
      author: string;
      url: string;
      rawMessage: string;
    }
  | {
      key: string;
      kind: "edit";
      title: string;
      at: number;
      pages: Page[];
      basePages: Page[];
    }
  | {
      key: string;
      kind: "checkpoint";
      title: string;
      at: number;
      id: string;
      cpKind: CheckpointMetadata["kind"];
    };

interface RepoRef {
  provider: GitProvider;
  repo: string;
  branch: string;
}

const PROVIDER_LABEL: Record<GitProvider, string> = {
  hanzo: "Hanzo",
  github: "GitHub",
  gitlab: "GitLab",
};

const PROVIDER_ICON: Record<GitProvider, ComponentType<{ className?: string }>> = {
  hanzo: HanzoLogo,
  github: Github,
  gitlab: GitlabIcon,
};

/** Session caches so re-opening History neither re-summarizes nor flashes empty. */
const clientSummaryCache = new Map<string, string>();
const commitsCache = new Map<string, { repo: RepoRef; commits: GitCommit[] }>();
/** Working pages captured when entering commit-preview, per app (survives unmount). */
const previewSnapshot = new Map<string, Page[]>();

function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h) ^ input.charCodeAt(i);
  return (h >>> 0).toString(36);
}

/** STABLE key for an edit — createdAt + prompt, identical every render. */
function editKey(item: HtmlHistory): string {
  return `edit:${new Date(item.createdAt).getTime()}:${hash(item.prompt ?? "")}`;
}

function rel(at: number): string {
  if (!Number.isFinite(at) || at <= 0) return "";
  const secs = Math.max(0, Math.floor((Date.now() - at) / 1000));
  const units: [number, string][] = [
    [31536000, "y"],
    [2592000, "mo"],
    [604800, "w"],
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ];
  for (const [size, label] of units) if (secs >= size) return `${Math.floor(secs / size)}${label} ago`;
  return "just now";
}

/** The stable project key (app slug) we namespace bookmarks + history by. */
function projectKey(): string {
  if (typeof window === "undefined") return "local";
  return (window as unknown as { __projectSlug?: string }).__projectSlug || "local";
}

function openGitSync(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hanzo:open-git-sync"));
}

/**
 * HistoryPanel — the git-changeset timeline as a Lovable-style overlay over the
 * chat pane. Working changes (uncommitted) group on top; the real commit history
 * below as cards (provider icon · AI-clean message · bookmark · Details · Preview
 * · revert · ⋮). Bookmarks are durable (per-app Base, localStorage fallback) and
 * fill instantly. `onOpenDetails` opens the right-area Details view; the panel
 * previews a past commit by loading its pages into the editor.
 */
export function HistoryPanel({
  history,
  setPages,
  pages = [],
  onClose,
  onOpenDetails,
}: {
  history: HtmlHistory[];
  setPages: (pages: Page[]) => void;
  pages?: Page[];
  /** Close the overlay (back to chat) — item 10. */
  onClose?: () => void;
  /** Open the right-area Details view for a revision — item 12. */
  onOpenDetails?: (rev: DetailsRev) => void;
}) {
  const [checkpoints, setCheckpoints] = useState<CheckpointMetadata[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "bookmarks">("all");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const [repo, setRepo] = useState<RepoRef | null>(null);
  const [repoResolved, setRepoResolved] = useState(false);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [logSupported, setLogSupported] = useState(true);
  const [summaries, setSummaries] = useState<Record<string, string>>({});

  const [previewingSha, setPreviewingSha] = useState<string | null>(null);
  const [previewBusy, setPreviewBusy] = useState<string | null>(null);

  const appId = projectKey();
  const org = currentOrg() || undefined;

  // Refs for the unmount cleanup closure (avoid stale values).
  const setPagesRef = useRef(setPages);
  setPagesRef.current = setPages;
  const previewingRef = useRef<string | null>(null);
  previewingRef.current = previewingSha;

  // On unmount, if previewing a past commit, restore the working pages so closing
  // the panel never strands the editor on an old version.
  useEffect(() => {
    return () => {
      if (previewingRef.current) {
        const snap = previewSnapshot.get(appId);
        if (snap) setPagesRef.current(snap);
        previewSnapshot.delete(appId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hydrate bookmarks (localStorage first for INSTANT paint), checkpoints, and
  // the durable per-app store (which supersedes localStorage when available).
  useEffect(() => {
    const pk = projectKey();
    setBookmarks(readBookmarks(pk));

    let alive = true;
    const loadCheckpoints = async () => {
      if (pk === "local") return;
      try {
        const cps = await checkpointManager.getCheckpoints(pk);
        if (alive) setCheckpoints(cps);
      } catch {
        /* VFS unavailable */
      }
    };
    loadCheckpoints();

    (async () => {
      const durable = await fetchAppHistory(pk);
      if (!alive || !durable.durable) return;
      const set = new Set(durable.bookmarks);
      setBookmarks(set);
      saveBookmarks(pk, set); // mirror durable → local so an offline open is correct
    })();

    const onRestored = () => loadCheckpoints();
    window.addEventListener("checkpointRestored", onRestored);
    return () => {
      alive = false;
      window.removeEventListener("checkpointRestored", onRestored);
    };
  }, []);

  // Resolve the connected repo, then load + AI-clean the commit timeline.
  useEffect(() => {
    const pk = projectKey();
    if (pk === "local") {
      setRepoResolved(true);
      return;
    }
    const cached = commitsCache.get(pk);
    if (cached) {
      setRepo(cached.repo);
      setCommits(cached.commits);
    }

    let alive = true;
    (async () => {
      let ref: RepoRef | null = null;
      try {
        const res = await fetch(`/v1/projects/${encodeURIComponent(pk)}`, { credentials: "include" });
        if (res.ok) {
          const p = (await res.json()) as { repo?: { url?: string; branch?: string } };
          if (p?.repo?.url) {
            ref = { provider: providerFromRepoUrl(p.repo.url), repo: p.repo.url, branch: p.repo.branch || "main" };
          }
        }
      } catch {
        /* best-effort */
      }
      if (!alive) return;
      setRepo(ref);
      setRepoResolved(true);
      if (!ref) return;

      setCommitsLoading(true);
      const result = await fetchGitCommits(ref.provider, ref.repo, ref.branch);
      if (!alive) return;
      setLogSupported(result.supported);
      setCommits(result.commits);
      setCommitsLoading(false);
      commitsCache.set(pk, { repo: ref, commits: result.commits });
      if (result.commits.length === 0) return;

      const seeded: Record<string, string> = {};
      const misses: { sha: string; message: string }[] = [];
      for (const c of result.commits) {
        const hit = clientSummaryCache.get(c.sha);
        if (hit !== undefined) seeded[c.sha] = hit;
        else misses.push({ sha: c.sha, message: c.rawMessage });
      }
      if (Object.keys(seeded).length) setSummaries((s) => ({ ...seeded, ...s }));
      if (misses.length === 0) return;
      const fresh = await summarizeCommitMessages(misses, org);
      if (!alive) return;
      for (const [sha, line] of Object.entries(fresh)) clientSummaryCache.set(sha, line);
      setSummaries((s) => ({ ...s, ...fresh }));
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Working-change revisions (edits + checkpoints), newest first; edits carry the
  // previous edit's pages as the diff baseline for the Details view.
  const workingRevisions = useMemo<Revision[]>(() => {
    const list = history ?? [];
    const edits: Revision[] = list.map((item, i) => ({
      key: editKey(item),
      kind: "edit",
      title: item.prompt?.trim() || "Manual edit",
      at: new Date(item.createdAt).getTime(),
      pages: item.pages,
      basePages: list[i + 1]?.pages ?? [],
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

  const commitRevisions = useMemo<Revision[]>(() => {
    return commits
      .map((c) => ({
        key: `commit:${c.sha}`,
        kind: "commit" as const,
        title: summaries[c.sha]?.trim() || c.message,
        at: new Date(c.authoredAt).getTime() || 0,
        sha: c.sha,
        shortSha: c.shortSha,
        author: c.author,
        url: c.url,
        rawMessage: c.rawMessage,
      }))
      .sort((a, b) => b.at - a.at);
  }, [commits, summaries]);

  const hasRepo = Boolean(repo);
  const currentKey = activeKey ?? workingRevisions[0]?.key ?? null;

  const newestEditKey = workingRevisions.find((r) => r.kind === "edit")?.key ?? null;
  const prevNewestEdit = useRef(newestEditKey);
  useEffect(() => {
    if (prevNewestEdit.current !== newestEditKey) {
      prevNewestEdit.current = newestEditKey;
      setActiveKey(null);
    }
  }, [newestEditKey]);

  // Persist the newest edit's metadata to the durable per-app store (best-effort)
  // so the timeline + metadata survive a reload.
  useEffect(() => {
    const newest = (history ?? [])[0];
    if (!newest || appId === "local") return;
    void postRevision(
      appId,
      {
        revKey: editKey(newest),
        kind: "edit",
        title: newest.prompt?.trim() || "Manual edit",
        at: new Date(newest.createdAt).getTime(),
        filesChanged: newest.pages?.length,
      },
      org,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newestEditKey]);

  const toggleBookmark = useCallback(
    (key: string) => {
      // Optimistic + instant: update state and localStorage immediately, then
      // reconcile with the durable store (which supersedes local when available).
      const next = new Set(bookmarks);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      setBookmarks(next);
      saveBookmarks(appId, next);
      void (async () => {
        const durable = await putBookmarkToggle(appId, key, org);
        if (durable) {
          const set = new Set(durable);
          setBookmarks(set);
          saveBookmarks(appId, set);
        }
      })();
    },
    [bookmarks, appId, org],
  );

  const restore = useCallback(
    async (rev: Revision) => {
      if (rev.kind === "edit") {
        setPages(rev.pages);
        setActiveKey(rev.key);
        toast.success("Reverted to this version");
        return;
      }
      if (rev.kind === "checkpoint") {
        setBusyKey(rev.key);
        try {
          const ok = await checkpointManager.restoreCheckpoint(rev.id);
          if (ok) {
            setActiveKey(rev.key);
            window.dispatchEvent(new CustomEvent("checkpointRestored", { detail: { checkpointId: rev.id } }));
            toast.success("Restored this revision");
          } else toast.error("Couldn't restore this revision");
        } catch {
          toast.error("Couldn't restore this revision");
        } finally {
          setBusyKey(null);
        }
        return;
      }
      // commit → open on provider (in-app restore from a past commit is a follow-up).
      if (rev.url) window.open(rev.url, "_blank", "noopener,noreferrer");
      toast("Opened commit on " + (repo ? PROVIDER_LABEL[repo.provider] : "provider"), {
        description: "Restoring a past commit into the editor is coming soon.",
      });
    },
    [setPages, repo],
  );

  // Load a past commit's pages into the preview (item 11). Snapshots the working
  // pages first so "Back to working" is always safe.
  const previewCommit = useCallback(
    async (sha: string) => {
      if (!repo || repo.provider === "hanzo") {
        toast("Preview from a Hanzo git commit isn't available yet.");
        return;
      }
      setPreviewBusy(sha);
      const commitPages = await fetchCommitPages(repo.provider, repo.repo, sha);
      setPreviewBusy(null);
      if (!commitPages || commitPages.length === 0) {
        toast.error("Couldn't load this commit's files.");
        return;
      }
      if (!previewSnapshot.has(appId)) previewSnapshot.set(appId, pages);
      setPages(commitPages);
      setPreviewingSha(sha);
      toast.success(`Previewing ${sha.slice(0, 7)}`);
    },
    [repo, appId, pages, setPages],
  );

  const exitPreview = useCallback(() => {
    const snap = previewSnapshot.get(appId);
    if (snap) setPages(snap);
    previewSnapshot.delete(appId);
    setPreviewingSha(null);
  }, [appId, setPages]);

  const openDetails = useCallback(
    (rev: Revision) => {
      if (!onOpenDetails) return;
      if (rev.kind === "commit" && repo) {
        onOpenDetails({
          kind: "commit",
          provider: repo.provider,
          repo: repo.repo,
          sha: rev.sha,
          shortSha: rev.shortSha,
          title: rev.title,
          author: rev.author,
          at: rev.at,
          url: rev.url,
          message: rev.rawMessage,
        });
      } else if (rev.kind === "edit") {
        onOpenDetails({ kind: "working", title: rev.title, at: rev.at, pages: rev.pages, basePages: rev.basePages });
      }
    },
    [onOpenDetails, repo],
  );

  const renderCard = (rev: Revision) => (
    <RevCard
      key={rev.key}
      rev={rev}
      isActive={rev.key === currentKey}
      isBookmarked={bookmarks.has(rev.key)}
      isBusy={busyKey === rev.key}
      isPreviewing={rev.kind === "commit" && previewingSha === rev.sha}
      previewBusy={rev.kind === "commit" && previewBusy === rev.sha}
      canPreview={Boolean(repo && repo.provider !== "hanzo")}
      providerLabel={repo ? PROVIDER_LABEL[repo.provider] : ""}
      onRestore={() => restore(rev)}
      onBookmark={() => toggleBookmark(rev.key)}
      onDetails={() => openDetails(rev)}
      onPreview={rev.kind === "commit" ? () => previewCommit(rev.sha) : undefined}
    />
  );

  const showBookmarksOnly = filter === "bookmarks";
  const working = showBookmarksOnly ? workingRevisions.filter((r) => bookmarks.has(r.key)) : workingRevisions;
  const commitsShown = showBookmarksOnly ? commitRevisions.filter((r) => bookmarks.has(r.key)) : commitRevisions;
  const nothing = working.length === 0 && commitsShown.length === 0;

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-neutral-950">
      {/* Panel header: title · All|Bookmarks filter · close. Left gutter matches
          the top toolbar (px-3 lg:px-4) so "History" lines up under the org
          switcher instead of sitting inset from it. */}
      <div className="flex items-center gap-2 px-3 lg:px-4 pb-2 pt-3">
        <RotateCcw className="size-4 text-white/50" />
        <span className="text-[13px] font-medium text-white/85">History</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 rounded-lg bg-white/[0.03] p-0.5 ring-1 ring-white/10">
            {(["all", "bookmarks"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={classNames(
                  "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  filter === f ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:bg-white/[0.06] hover:text-white/90",
                )}
              >
                {f === "all" ? "All" : "Bookmarks"}
              </button>
            ))}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close history"
              className="grid size-7 place-items-center rounded-md text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Previewing-a-past-commit banner (item 11 "out of date → back to working"). */}
      {previewingSha && (
        <div className="mx-3 mb-1 flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-xs">
          <Eye className="size-3.5 shrink-0 text-amber-300/90" />
          <span className="min-w-0 flex-1 truncate text-amber-100/90">
            Preview shows {previewingSha.slice(0, 7)} — an older version.
          </span>
          <button
            type="button"
            onClick={exitPreview}
            className="shrink-0 rounded-md bg-white/10 px-2 py-1 font-medium text-white transition-colors hover:bg-white/20"
          >
            Back to working
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 [scrollbar-width:thin]">
        {nothing ? (
          <EmptyState bookmarks={showBookmarksOnly} />
        ) : (
          <>
            {working.length > 0 && (
              <section className="mb-2">
                <GroupHeader label="Working changes" hint={`${working.length} uncommitted`}>
                  <button
                    type="button"
                    onClick={openGitSync}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                    title="Commit & push these changes"
                  >
                    <UploadCloud className="size-3" />
                    Commit &amp; push
                  </button>
                </GroupHeader>
                <div className="space-y-1">{working.map(renderCard)}</div>
              </section>
            )}

            {hasRepo && (
              <section>
                <GroupHeader label="Commits" hint={repo ? `${repo.provider}/${repo.branch}` : ""} />
                {commitsLoading && commitsShown.length === 0 ? (
                  <div className="flex items-center gap-2 px-2 py-6 text-xs text-white/40">
                    <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />
                    Loading commits…
                  </div>
                ) : commitsShown.length === 0 ? (
                  <div className="px-2 py-6 text-xs text-white/40">
                    {showBookmarksOnly
                      ? "No bookmarked commits."
                      : logSupported
                        ? "No commits yet — push to create the first."
                        : `Commit history isn't available for ${repo ? PROVIDER_LABEL[repo.provider] : "this"} git yet.`}
                  </div>
                ) : (
                  <div className="space-y-1">{commitsShown.map(renderCard)}</div>
                )}
              </section>
            )}

            {!hasRepo && repoResolved && !showBookmarksOnly && <ConnectRepoCta />}
          </>
        )}
      </div>
    </div>
  );
}

/** A single revision CARD (Lovable layout) — one shape across kinds. */
function RevCard({
  rev,
  isActive,
  isBookmarked,
  isBusy,
  isPreviewing,
  previewBusy,
  canPreview,
  providerLabel,
  onRestore,
  onBookmark,
  onDetails,
  onPreview,
}: {
  rev: Revision;
  isActive: boolean;
  isBookmarked: boolean;
  isBusy: boolean;
  isPreviewing: boolean;
  previewBusy: boolean;
  canPreview: boolean;
  providerLabel: string;
  onRestore: () => void;
  onBookmark: () => void;
  onDetails: () => void;
  onPreview?: () => void;
}) {
  const isCommit = rev.kind === "commit";
  const Icon = isCommit
    ? PROVIDER_ICON[providerLabel === "GitHub" ? "github" : providerLabel === "GitLab" ? "gitlab" : "hanzo"]
    : null;
  const canDetails = isCommit || rev.kind === "edit";
  return (
    <div
      className={classNames(
        "rounded-xl border px-3 py-2.5 transition-colors duration-150 motion-reduce:transition-none",
        isPreviewing
          ? "border-amber-400/30 bg-amber-400/[0.04]"
          : isActive
            ? "border-white/20 bg-white/[0.05]"
            : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
      )}
    >
      <div className="flex items-start gap-2">
        {Icon ? (
          <Icon className="mt-0.5 size-3.5 shrink-0 text-white/55" />
        ) : (
          <span
            className={classNames("mt-1 size-1.5 shrink-0 rounded-full", isActive ? "bg-white" : "bg-white/30")}
            aria-hidden
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] leading-snug text-white/85">{rev.title}</p>
          <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-white/35">
            <span>{rel(rev.at)}</span>
            {isCommit && (
              <>
                <span className="text-white/20">·</span>
                <span className="truncate text-white/30">{rev.author}</span>
                <span className="text-white/20">·</span>
                <span className="text-white/30">{rev.shortSha}</span>
              </>
            )}
            {rev.kind === "checkpoint" && (
              <span className="uppercase tracking-wide text-white/30">· {rev.cpKind === "manual" ? "save" : rev.cpKind}</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onBookmark}
          title={isBookmarked ? "Remove bookmark" : "Bookmark this revision"}
          aria-pressed={isBookmarked}
          className={classNames(
            "grid size-6 shrink-0 place-items-center rounded-md transition-colors",
            isBookmarked ? "text-white/85" : "text-white/35 hover:text-white/80",
          )}
        >
          {isBookmarked ? <BookmarkCheck className="size-3.5" /> : <Bookmark className="size-3.5" />}
        </button>
      </div>

      {/* Action row: Details · Preview · revert · ⋮ */}
      <div className="mt-2 flex items-center gap-1.5">
        {canDetails && (
          <CardButton onClick={onDetails}>
            <ListTree className="size-3" />
            Details
          </CardButton>
        )}
        {isCommit && onPreview && canPreview && (
          <CardButton onClick={onPreview} active={isPreviewing}>
            {previewBusy ? <Loader2 className="size-3 animate-spin motion-reduce:animate-none" /> : <Eye className="size-3" />}
            {isPreviewing ? "Previewing" : "Preview"}
          </CardButton>
        )}
        {!isCommit && (
          <CardButton onClick={onRestore} disabled={isBusy}>
            {isBusy ? <Loader2 className="size-3 animate-spin motion-reduce:animate-none" /> : <Undo2 className="size-3" />}
            Restore
          </CardButton>
        )}
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="More"
                className="grid size-6 place-items-center rounded-md text-white/40 transition hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10"
              >
                <MoreVertical className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-[190px] !rounded-xl !border-white/10 !bg-[#0a0a0a] !p-1 text-white shadow-2xl shadow-black/60"
            >
              <MenuItem onSelect={onRestore}>
                <Undo2 className="size-3.5" />
                {isCommit ? "Open on " + (providerLabel || "provider") : "Restore this version"}
              </MenuItem>
              {canDetails && (
                <MenuItem onSelect={onDetails}>
                  <ListTree className="size-3.5" />
                  View details
                </MenuItem>
              )}
              <MenuItem onSelect={onBookmark}>
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function CardButton({
  onClick,
  children,
  disabled,
  active,
}: {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50",
        active ? "bg-amber-400/15 text-amber-100" : "bg-white/[0.04] text-white/60 hover:bg-white/10 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

function GroupHeader({ label, hint, children }: { label: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-1 pb-1.5 pt-1">
      <span className="text-[10px] font-medium uppercase tracking-wide text-white/40">{label}</span>
      {hint && <span className="font-mono text-[10px] text-white/25">{hint}</span>}
      {children && <span className="ml-auto">{children}</span>}
    </div>
  );
}

function MenuItem({ onSelect, children }: { onSelect: () => void; children: ReactNode }) {
  return (
    <DropdownMenuItem
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-white/80 focus:!bg-white/10 focus:!text-white"
    >
      {children}
    </DropdownMenuItem>
  );
}

function ConnectRepoCta() {
  return (
    <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
      <div className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-white/85">
        <GitBranch className="size-3.5 text-white/50" />
        Keep full version history
      </div>
      <p className="text-xs text-white/45">
        Connect a repository to record every change as a git commit — a durable timeline you can preview and review.
      </p>
      <button
        type="button"
        onClick={openGitSync}
        className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-white/90"
      >
        <UploadCloud className="size-3.5" />
        Connect a repo
      </button>
    </div>
  );
}

function EmptyState({ bookmarks }: { bookmarks: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
      <Bookmark className="size-7 text-white/20" />
      <p className="text-[13px] font-medium text-white/70">{bookmarks ? "No bookmarks yet" : "No revisions yet"}</p>
      <p className="max-w-[220px] text-xs text-white/35">
        {bookmarks
          ? "Bookmark any revision to pin it here for quick access."
          : "Your edits and commits appear here — preview or restore any version."}
      </p>
    </div>
  );
}
