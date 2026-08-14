"use client";

import { YStack, XStack, SizableText, Paragraph } from '@hanzo/ui';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
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
  MoreVertical,
  RotateCcw,
  Undo2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Button } from '@hanzo/ui';
import { stageProject } from "@/lib/import/staging";
import { projectRepoName } from "@/lib/dev/workspace";
import { commitTurn } from "@/lib/git/commit-turn";

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
import { Spinner } from "@/components/ui/spinner";

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

const PROVIDER_ICON: Record<GitProvider, ComponentType<{ size?: number; className?: string; style?: CSSProperties }>> = {
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
 * HistoryPanel — the git-changeset timeline as an overlay over the chat pane.
 * Working changes (uncommitted) group on top; the real commit history below as
 * cards (provider icon · AI-clean message · bookmark · Details · Preview · revert
 * · ⋮). Bookmarks are durable (per-app Base, localStorage fallback) and fill
 * instantly. `onOpenDetails` opens the right-area Details view; the panel previews
 * a past commit by loading its pages into the editor.
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
  // Why the project record could not be read, when it could not. The fallback
  // below still guesses the native repo, so a refusal is otherwise indistinguishable
  // from a project that simply has no repo link — and only one of those is the
  // user's to act on.
  const [projectError, setProjectError] = useState<string | null>(null);
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
      let failure: string | null = null;
      try {
        const res = await fetch(`/v1/projects/${encodeURIComponent(pk)}`, { credentials: "include" });
        if (res.ok) {
          const p = (await res.json()) as { repo?: { url?: string; branch?: string } };
          if (p?.repo?.url) {
            ref = { provider: providerFromRepoUrl(p.repo.url), repo: p.repo.url, branch: p.repo.branch || "main" };
          }
        } else if (res.status === 401 || res.status === 403) {
          // The projects service scopes every read to the org on the caller's
          // bearer ("X-Org-Id required"), so a session with no org claim is
          // REFUSED — not empty. The fallback below still guesses the native repo,
          // which is right, but if that turns up nothing the panel must not imply
          // the project has no history when the truth is we were not allowed to ask.
          failure = "Your session has no organization, so this project could not be read. Sign in again.";
        } else {
          failure = `Couldn't load this project (${res.status}).`;
        }
      } catch {
        failure = "Couldn't reach the projects service.";
      }
      // THE FIX for "no revisions yet". A saved project carries its repo link, and
      // the fetch above finds it. But a brand-new build has NO project record —
      // and `commitTurn` still committed every turn, to the native repo named by
      // `projectRepoName` (the project slug, or a minted id). Reading commits only
      // from the project record meant those commits were written to a real repo the
      // panel never looked at, so the timeline stayed empty for exactly the case
      // people are in most: a fresh build they have not saved yet.
      //
      // Fall back to that same native repo. The /v1/git/commits route resolves
      // provider 'hanzo' against the session's own account and accepts a bare name,
      // so passing the repo NAME is enough — no owner needed here, and a caller
      // cannot read another account's repo.
      if (!ref) {
        const name = projectRepoName(pk === "local" ? undefined : pk);
        if (name) ref = { provider: "hanzo", repo: name, branch: "main" };
      }
      if (!alive) return;
      setProjectError(failure);
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

  /**
   * Fork a revision into a NEW build, leaving this one untouched.
   *
   * Restore rewrites the working tree in place, so the only way to act on an
   * older revision was to lose the current one. Forking is the other half of
   * that: take the code somewhere new and keep what you have. It goes through
   * the same staging path an imported project uses, so the fresh session seeds
   * from these files exactly as a drag-and-drop import does — one seeding
   * mechanism, not a second one that can drift from it.
   */
  const fork = useCallback(
    async (rev: Revision) => {
      let files: { path: string; text: string }[] = [];
      if (rev.kind === "edit") {
        files = rev.pages.map((p) => ({ path: p.path, text: p.html }));
      } else if (rev.kind === "checkpoint") {
        const read = await checkpointManager.readCheckpointFiles(rev.id);
        if (read) files = Object.entries(read).map(([path, text]) => ({ path, text }));
      }
      // A COMMIT forks by reading its files back from the repo — the same
      // path the preview uses. Before the forge read landed this had nothing
      // to fork and refused; now the revision's own pages seed the new build.
      if (!files.length && rev.kind === "commit" && repo) {
        const pages = await fetchCommitPages(repo.provider, repo.repo, rev.sha);
        files = (pages ?? []).map((pg) => ({ path: pg.path, text: pg.html }));
      }
      if (!files.length) {
        toast.error("This revision has no files to fork.");
        return;
      }
      try {
        await stageProject(`${rev.title || "Revision"} (fork)`, files);
        toast.success("Forked — opening a new build");
        window.location.assign("/dev");
      } catch {
        toast.error("Could not stage the fork.");
      }
    },
    []
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
      // commit → restore its pages INTO the editor. Restore-forward semantics:
      // head moves FORWARD (a new commit) rather than a detached checkout, so
      // nothing in the timeline is lost and "restore" is itself a revision you can
      // undo. Same fetch previewCommit uses; on empty/error say so instead of
      // silently doing nothing.
      if (!repo) return;
      setBusyKey(rev.key);
      try {
        const commitPages = await fetchCommitPages(repo.provider, repo.repo, rev.sha);
        if (!commitPages || commitPages.length === 0) {
          toast.error("Couldn't load this version's files.");
          return;
        }
        // This IS the working tree now — drop any preview snapshot so closing the
        // panel doesn't restore the older working copy over the restore.
        previewSnapshot.delete(appId);
        setPreviewingSha(null);
        setPages(commitPages);
        setActiveKey(rev.key);
        toast.success(`Restored ${rev.shortSha}`);
        // Move head forward so the restore is a real revision, not a detached
        // state. Fire-and-forget — the pages are already on screen.
        const name = projectRepoName(appId === "local" ? undefined : appId);
        if (name) void commitTurn(name, commitPages, `Restore ${rev.shortSha}`);
      } catch {
        toast.error("Couldn't restore this version.");
      } finally {
        setBusyKey(null);
      }
    },
    [setPages, repo, appId],
  );

  // Load a past commit's pages into the preview (item 11). Snapshots the working
  // pages first so "Back to working" is always safe.
  const previewCommit = useCallback(
    async (sha: string) => {
      if (!repo) return;
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
      canPreview={Boolean(repo)}
      providerLabel={repo ? PROVIDER_LABEL[repo.provider] : ""}
      onRestore={() => restore(rev)}
      onBookmark={() => toggleBookmark(rev.key)}
      onDetails={() => openDetails(rev)}
      onFork={() => fork(rev)}
      onPreview={rev.kind === "commit" ? () => previewCommit(rev.sha) : undefined}
  />
  );

  const showBookmarksOnly = filter === "bookmarks";
  const working = showBookmarksOnly ? workingRevisions.filter((r) => bookmarks.has(r.key)) : workingRevisions;
  const commitsShown = showBookmarksOnly ? commitRevisions.filter((r) => bookmarks.has(r.key)) : commitRevisions;
  const nothing = working.length === 0 && commitsShown.length === 0;

  return (
    <YStack position="absolute" top={0} right={0} bottom={0} left={0} zIndex={20} backgroundColor="$background">
      {/* Panel header: title · All|Bookmarks filter · close. Left gutter matches
          the top toolbar (px-3 lg:px-4) so "History" lines up under the org
          switcher instead of sitting inset from it. */}
      <XStack alignItems="center" gap="$2" paddingHorizontal="$3" paddingBottom="$2" paddingTop="$3" $lg={{ paddingHorizontal: "$4" }}>
        <RotateCcw size={16} />
        <SizableText fontSize={13} fontWeight="500" color="$color">History</SizableText>
        <XStack marginLeft="auto" alignItems="center" gap="$1.5">
          <XStack alignItems="center" gap="$0.5" borderRadius="$5" backgroundColor="$color3" padding="$0.5">
            {(["all", "bookmarks"] as const).map((f) => (
              <Button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                group borderRadius="$3" paddingHorizontal="$2" paddingVertical="$1" {...{ backgroundColor: filter === f ? "$color12" : "transparent", elevation: filter === f ? 1 : undefined, hoverStyle: filter === f ? undefined : { backgroundColor: "$color4" } }}
              >
                <SizableText fontSize={11} fontWeight="500" color={filter === f ? "$background" : "$color11"} $group-hover={filter === f ? undefined : { color: "$color" }}>{f === "all" ? "All" : "Bookmarks"}</SizableText>
              </Button>
            ))}
          </XStack>
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              title="Close history"
              width={28} height={28} alignItems="center" justifyContent="center" borderRadius="$3"
            >
              <X size={16} />
            </Button>
          )}
        </XStack>
      </XStack>

      {/* Previewing-a-past-commit banner (item 11 "out of date → back to working"). */}
      {previewingSha && (
        <SizableText marginHorizontal="$3" marginBottom="$1" alignItems="center" gap="$2" borderRadius="$5" borderWidth={1} borderColor="$yellow8" backgroundColor="$yellow8" paddingHorizontal="$3" paddingVertical="$2" fontSize="$1" display="flex" flexDirection="row">
          <Eye size={14} />
          <SizableText minWidth={0} flex={1} numberOfLines={1} color="$yellow2">
            Preview shows {previewingSha.slice(0, 7)} — an older version.
          </SizableText>
          <Button
            type="button"
            onClick={exitPreview}
            flexShrink={0} borderRadius="$3" backgroundColor="$color3" paddingHorizontal="$2" paddingVertical="$1" hoverStyle={{ backgroundColor: "$color4" }}
          >
            <SizableText fontWeight="500" color="$color">Back to working</SizableText>
          </Button>
        </SizableText>
      )}

      <YStack minHeight={0} flex={1} paddingHorizontal="$2" paddingBottom="$3" overflow="scroll" className="thin-scrollbar">
        {nothing ? (
          <EmptyState bookmarks={showBookmarksOnly} />
        ) : (
          <>
            {working.length > 0 && (
              <YStack marginBottom="$2">
                <GroupHeader label="Working changes" hint={`${working.length} uncommitted`}>
                  <Button
                    type="button"
                    onClick={openGitSync}
                    backgroundColor="transparent" group alignItems="center" gap="$1" borderRadius="$3" paddingHorizontal="$1.5" paddingVertical="$1" hoverStyle={{ backgroundColor: "$color3" }}
                    title="Commit & push these changes"
                  >
                    <SizableText display="flex" flexDirection="row" alignItems="center" gap="$1" fontSize={11} fontWeight="500" color="$color11" $group-hover={{ color: "$color" }}>
                      <UploadCloud size={12} />
                      Commit &amp; push
                    </SizableText>
                  </Button>
                </GroupHeader>
                <YStack rowGap="$1">{working.map(renderCard)}</YStack>
              </YStack>
            )}

            {hasRepo && (
              <section>
                <GroupHeader label="Commits" hint={repo ? `${repo.provider}/${repo.branch}` : ""} />
                {commitsLoading && commitsShown.length === 0 ? (
                  <SizableText alignItems="center" gap="$2" paddingHorizontal="$2" paddingVertical="$5" fontSize="$1" color="$color11" display="flex" flexDirection="row">
                    <Spinner size={14} />
                    Loading commits…
                  </SizableText>
                ) : commitsShown.length === 0 ? (
                  <SizableText paddingHorizontal="$2" paddingVertical="$5" fontSize="$1" color="$color11" display="flex" flexDirection="column">
                    {showBookmarksOnly
                      ? "No bookmarked commits. Bookmark one from the list and it stays here."
                      : logSupported
                        ? "No commits yet — push to create the first."
                        : `Hanzo cannot read commit history from ${repo ? PROVIDER_LABEL[repo.provider] : "this"} git.`}
                  </SizableText>
                ) : (
                  <YStack rowGap="$1">{commitsShown.map(renderCard)}</YStack>
                )}
              </section>
            )}

            {!hasRepo &&
              repoResolved &&
              !showBookmarksOnly &&
              (projectError ? (
                <SizableText paddingHorizontal="$2" paddingVertical="$6" fontSize={11} color="$color11">{projectError}</SizableText>
              ) : (
                <ConnectRepoCta />
              ))}
          </>
        )}
      </YStack>
    </YStack>
  );
}

/** A single revision CARD — one shape across kinds. */
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
  onFork,
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
  onFork?: () => void;
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
    <YStack
      borderRadius="$6" borderWidth={1} paddingHorizontal="$3" paddingVertical="$2.5" {...(isPreviewing
        ? { borderColor: "rgba(251,191,36,0.3)", backgroundColor: "rgba(251,191,36,0.04)" }
        : isActive
          ? { borderColor: "$color02", backgroundColor: "$color005" }
          : { borderColor: "$borderColor", backgroundColor: "$color002", hoverStyle: { borderColor: "$color02", backgroundColor: "$color005" } })}
    >
      <XStack alignItems="flex-start" gap="$2">
        {Icon ? (
          <Icon size={14} style={{ marginTop: 2, flexShrink: 0, color: "var(--muted-foreground)" }} />
        ) : (
          <SizableText
            marginTop="$1" width="$1.5" height="$1.5" flexShrink={0} borderRadius="$10" {...{ backgroundColor: isActive ? "$color12" : "$color5" }}
            aria-hidden
  />
        )}
        <YStack minWidth={0} flex={1}>
          <Paragraph numberOfLines={1} fontSize={13} lineHeight="1.375" color="$color">{rev.title}</Paragraph>
          <SizableText marginTop="$0.5" alignItems="center" gap="$1.5" fontFamily="$mono" fontSize={10} color="$color11" display="flex" flexDirection="row">
            <span>{rel(rev.at)}</span>
            {isCommit && (
              <>
                <SizableText color="$color11">·</SizableText>
                <SizableText numberOfLines={1} color="$color11">{rev.author}</SizableText>
                <SizableText color="$color11">·</SizableText>
                <SizableText color="$color11">{rev.shortSha}</SizableText>
              </>
            )}
            {rev.kind === "checkpoint" && (
              <SizableText letterSpacing={0.4} color="$color11">· {rev.cpKind === "manual" ? "save" : rev.cpKind}</SizableText>
            )}
          </SizableText>
        </YStack>
        <Button
          type="button"
          onClick={onBookmark}
          title={isBookmarked ? "Remove bookmark" : "Bookmark this revision"}
          aria-pressed={isBookmarked}
          backgroundColor="transparent" group width="$5" height="$5" flexShrink={0} alignItems="center" justifyContent="center" borderRadius="$3"
        >
          <SizableText display="flex" alignItems="center" justifyContent="center" color={isBookmarked ? "$color" : "$color11"} $group-hover={isBookmarked ? undefined : { color: "$color" }}>
            {isBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          </SizableText>
        </Button>
      </XStack>

      {/* Action row: Details · Preview · revert · ⋮ */}
      <XStack marginTop="$2" alignItems="center" gap="$1.5">
        {canDetails && (
          <CardButton onClick={onDetails}>
            <ListTree size={12} />
            Details
          </CardButton>
        )}
        {isCommit && onPreview && canPreview && (
          <CardButton onClick={onPreview} active={isPreviewing}>
            {previewBusy ? <Spinner size={12} /> : <Eye size={12} />}
            {isPreviewing ? "Previewing" : "Preview"}
          </CardButton>
        )}
        {!isCommit && (
          <CardButton onClick={onRestore} disabled={isBusy}>
            {isBusy ? <Spinner size={12} /> : <Undo2 size={12} />}
            Restore
          </CardButton>
        )}
        <YStack marginLeft="auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                title="More"
                width="$5" height="$5" alignItems="center" justifyContent="center" borderRadius="$3"
              >
                <MoreVertical size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              minWidth={190}
            >
              <MenuItem onSelect={onRestore}>
                <Undo2 size={14} />
                {isCommit ? "Open on " + (providerLabel || "provider") : "Restore this version"}
              </MenuItem>
              {canDetails && (
                <MenuItem onSelect={onDetails}>
                  <ListTree size={14} />
                  View details
                </MenuItem>
              )}
              {onFork && (
                <MenuItem onSelect={onFork}>
                  <GitBranch size={14} />
                  Fork into a new build
                </MenuItem>
              )}
              <MenuItem onSelect={onBookmark}>
                {isBookmarked ? (
                  <>
                    <BookmarkCheck size={14} />
                    Remove bookmark
                  </>
                ) : (
                  <>
                    <Bookmark size={14} />
                    Bookmark
                  </>
                )}
              </MenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </YStack>
      </XStack>
    </YStack>
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
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      group alignItems="center" gap="$1" borderRadius="$3" paddingHorizontal="$2" paddingVertical="$1" disabledStyle={{ opacity: 0.5 }} {...{ backgroundColor: active ? "$yellow8" : "$color3", hoverStyle: active ? undefined : { backgroundColor: "$color4" } }}
    >
      <SizableText display="flex" flexDirection="row" alignItems="center" gap="$1" fontSize={11} fontWeight="500" color={active ? "$yellow2" : "$color11"} $group-hover={active ? undefined : { color: "$color" }}>
        {children}
      </SizableText>
    </Button>
  );
}

function GroupHeader({ label, hint, children }: { label: string; hint?: string; children?: ReactNode }) {
  return (
    <XStack alignItems="center" gap="$2" paddingHorizontal="$1" paddingBottom="$1.5" paddingTop="$1">
      <SizableText fontSize={10} fontWeight="500" letterSpacing={0.4} color="$color11">{label}</SizableText>
      {hint && <SizableText fontFamily="$mono" fontSize={10} color="$color11">{hint}</SizableText>}
      {children && <SizableText marginLeft="auto">{children}</SizableText>}
    </XStack>
  );
}

function MenuItem({ onSelect, children }: { onSelect: () => void; children: ReactNode }) {
  return (
    <DropdownMenuItem
      onSelect={onSelect}
      cursor="pointer" alignItems="center" gap="$2" borderRadius="$3" paddingHorizontal="$2" paddingVertical="$1.5" focusStyle={{ backgroundColor: "$color3" }}
    >
      {children}
    </DropdownMenuItem>
  );
}

function ConnectRepoCta() {
  return (
    <YStack marginTop="$2" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" padding="$3.5">
      <SizableText marginBottom="$1" alignItems="center" gap="$1.5" fontSize={13} fontWeight="500" color="$color" display="flex" flexDirection="row">
        <GitBranch size={14} />
        Keep full version history
      </SizableText>
      <Paragraph fontSize="$1" color="$color11">
        Connect a repository to record every change as a git commit — a durable timeline you can preview and review.
      </Paragraph>
      <Button
        type="button"
        onClick={openGitSync}
        marginTop="$2.5" alignItems="center" gap="$1.5" borderRadius="$5" backgroundColor="$color5" borderWidth={1} borderColor="$color6" paddingHorizontal="$3" paddingVertical="$1.5" hoverStyle={{ backgroundColor: "$color6" }}
      >
        <SizableText display="flex" flexDirection="row" alignItems="center" gap="$1.5" fontSize="$1" fontWeight="500" color="$background">
          <UploadCloud size={14} />
          Connect a repo
        </SizableText>
      </Button>
    </YStack>
  );
}

function EmptyState({ bookmarks }: { bookmarks: boolean }) {
  return (
    <SizableText flexDirection="column" alignItems="center" justifyContent="center" gap="$2" paddingHorizontal="$4" paddingVertical="$10" textAlign="center" display="flex">
      <Bookmark size={28} />
      <Paragraph fontSize={13} fontWeight="500" color="$color">{bookmarks ? "No bookmarks yet" : "No revisions yet"}</Paragraph>
      <Paragraph maxWidth={220} fontSize="$1" color="$color11">
        {bookmarks
          ? "Bookmark a revision and it stays pinned here."
          : "Your edits and commits appear here — preview or restore any version."}
      </Paragraph>
    </SizableText>
  );
}
