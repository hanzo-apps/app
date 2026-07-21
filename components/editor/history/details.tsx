"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  AtSign,
  ChevronRight,
  Copy,
  ExternalLink,
  FileText,
  GitCommitHorizontal,
  Loader2,
  X,
} from "lucide-react";
import classNames from "classnames";
import { toast } from "sonner";

import { Page } from "@/types";
import {
  fetchGitCommitDetail,
  type GitCommit,
  type GitCommitFile,
  type GitProvider,
} from "@/lib/api/git";
import { parseUnifiedPatch, diffText, diffStat, type DiffLine } from "@/lib/git/diff";

/**
 * The revision the Details view describes — a real git commit, or an in-session
 * working change (whose diff we compute locally from both page sides). The panel
 * constructs this and the editor renders <RevisionDetails> in the right area.
 */
export type DetailsRev =
  | {
      kind: "commit";
      provider: GitProvider;
      repo: string;
      sha: string;
      shortSha: string;
      title: string;
      author: string;
      at: number;
      url: string;
      message: string;
    }
  | {
      kind: "working";
      title: string;
      at: number;
      /** The revision's pages (the "after" side). */
      pages: Page[];
      /** The previous revision's pages (the "before" side); [] when it's the first. */
      basePages: Page[];
    };

/** A file entry the Changes tab renders (path + status + a ready DiffLine[]). */
interface FileDiff {
  path: string;
  status: GitCommitFile["status"];
  lines: DiffLine[];
  /** A provider web URL to view the file at this revision, when derivable. */
  viewUrl?: string;
}

const STATUS_LABEL: Record<GitCommitFile["status"], string> = {
  added: "Added",
  modified: "Modified",
  removed: "Deleted",
  renamed: "Renamed",
};

/** Derive the provider "view file at ref" URL from a commit web URL. */
function blobUrlFrom(commitUrl: string, path: string): string | undefined {
  if (!commitUrl) return undefined;
  // github: …/commit/<sha> → …/blob/<sha>/<path>; gitlab: …/-/commit/<sha> → …/-/blob/<sha>/<path>
  const m = /^(.*?)\/(?:-\/)?commit\/([0-9a-f]+)/i.exec(commitUrl);
  if (!m) return commitUrl;
  const sep = commitUrl.includes("/-/commit/") ? "/-/blob/" : "/blob/";
  return `${m[1]}${sep}${m[2]}/${path}`;
}

/** Map an in-session pages[] to a path→html record. */
function pagesMap(pages: Page[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const p of pages) m[p.path] = p.html ?? "";
  return m;
}

/** Compute per-file diffs for an in-session working change (both sides in hand). */
function workingDiffs(pages: Page[], basePages: Page[]): FileDiff[] {
  const after = pagesMap(pages);
  const before = pagesMap(basePages);
  const paths = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();
  const out: FileDiff[] = [];
  for (const path of paths) {
    const oldHtml = before[path];
    const newHtml = after[path];
    if (oldHtml === newHtml) continue;
    const status: GitCommitFile["status"] =
      oldHtml === undefined ? "added" : newHtml === undefined ? "removed" : "modified";
    out.push({ path, status, lines: diffText(oldHtml || "", newHtml || "") });
  }
  return out;
}

/**
 * RevisionDetails — the Lovable-style Details view (Timeline | Changes), rendered
 * as a right-area overlay. Changes shows per-file diffs (red/green unified diff
 * with line numbers); Timeline shows the revision's honest metadata (commit
 * fields, or the edit's prompt/model/time — never fabricated steps).
 */
export function RevisionDetails({
  rev,
  onClose,
  onMentionFile,
}: {
  rev: DetailsRev;
  onClose: () => void;
  onMentionFile?: (path: string) => void;
}) {
  const [view, setView] = useState<"changes" | "timeline">("changes");
  const [files, setFiles] = useState<FileDiff[] | "loading" | "error">("loading");
  const [commit, setCommit] = useState<GitCommit | null>(null);

  useEffect(() => {
    let alive = true;
    if (rev.kind === "working") {
      setFiles(workingDiffs(rev.pages, rev.basePages));
      return;
    }
    setFiles("loading");
    (async () => {
      const detail = await fetchGitCommitDetail(rev.provider, rev.repo, rev.sha);
      if (!alive) return;
      if (!detail) {
        setFiles("error");
        return;
      }
      setCommit(detail);
      setFiles(
        (detail.filesChanged || []).map((f) => ({
          path: f.path,
          status: f.status,
          lines: parseUnifiedPatch(f.patch || ""),
          viewUrl: blobUrlFrom(rev.url, f.path),
        })),
      );
    })();
    return () => {
      alive = false;
    };
  }, [rev]);

  const mention = (path: string) => {
    if (onMentionFile) onMentionFile(path);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hanzo:mention-file", { detail: { path } }));
    }
    void navigator.clipboard?.writeText(`@${path}`).catch(() => {});
    toast.success(`Mentioned @${path} in chat`);
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-card text-foreground">
      {/* Header: back · title · Timeline|Changes · close */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to latest
        </button>
        <span className="ml-1 truncate text-[13px] font-medium text-foreground">Details</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 rounded-lg bg-white/[0.03] p-0.5 ring-1 ring-white/10">
            {(["timeline", "changes"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={classNames(
                  "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                  view === v
                    ? "bg-muted text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close details"
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
        {view === "timeline" ? (
          <Timeline rev={rev} commit={commit} />
        ) : (
          <Changes rev={rev} files={files} onMention={mention} />
        )}
      </div>
    </div>
  );
}

/** The Changes tab — a card per changed file, expandable to a red/green diff. */
function Changes({
  rev,
  files,
  onMention,
}: {
  rev: DetailsRev;
  files: FileDiff[] | "loading" | "error";
  onMention: (path: string) => void;
}) {
  if (files === "loading") {
    return (
      <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
        Loading changes…
      </div>
    );
  }
  if (files === "error") {
    return <p className="px-4 py-8 text-sm text-muted-foreground">Couldn&apos;t load the diff for this revision.</p>;
  }
  if (files.length === 0) {
    return <p className="px-4 py-8 text-sm text-muted-foreground">No file changes in this revision.</p>;
  }
  return (
    <div className="space-y-2 p-3">
      {files.map((f) => (
        <FileCard key={f.path} file={f} isCommit={rev.kind === "commit"} onMention={onMention} />
      ))}
    </div>
  );
}

function FileCard({
  file,
  isCommit,
  onMention,
}: {
  file: FileDiff;
  isCommit: boolean;
  onMention: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const stat = useMemo(() => diffStat(file.lines), [file.lines]);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white/[0.02]">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronRight
            className={classNames(
              "size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 motion-reduce:transition-none",
              open && "rotate-90",
            )}
          />
          <StatusBadge status={file.status} />
          <span className="truncate font-mono text-xs text-foreground">{file.path}</span>
          <span className="ml-1 shrink-0 font-mono text-[10px] text-muted-foreground">
            <span className="text-emerald-400/80">+{stat.added}</span>{" "}
            <span className="text-red-400/80">−{stat.removed}</span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-0.5">
          {isCommit && file.viewUrl && (
            <IconBtn
              title="View file"
              onClick={() => window.open(file.viewUrl, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="size-3.5" />
            </IconBtn>
          )}
          <IconBtn title="Mention in chat" onClick={() => onMention(file.path)}>
            <AtSign className="size-3.5" />
          </IconBtn>
          <IconBtn
            title="Copy path"
            onClick={() => {
              void navigator.clipboard?.writeText(file.path).catch(() => {});
              toast.success("Copied path");
            }}
          >
            <Copy className="size-3.5" />
          </IconBtn>
        </div>
      </div>
      {open && <DiffView lines={file.lines} />}
    </div>
  );
}

/** The red/green unified diff body with old/new line-number gutters. */
function DiffView({ lines }: { lines: DiffLine[] }) {
  if (lines.length === 0) {
    return (
      <div className="border-t border-border px-3 py-2 font-mono text-[11px] text-muted-foreground">
        No inline diff available — view the file to see its contents.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto border-t border-border bg-background/30">
      <table className="w-full border-collapse font-mono text-[11px] leading-relaxed">
        <tbody>
          {lines.map((l, i) => (
            <tr
              key={i}
              className={classNames(
                l.type === "add" && "bg-emerald-500/[0.08]",
                l.type === "del" && "bg-red-500/[0.08]",
                l.type === "hunk" && "bg-white/[0.04]",
              )}
            >
              <td className="select-none border-r border-border px-2 text-right text-muted-foreground tabular-nums">
                {l.oldNo ?? ""}
              </td>
              <td className="select-none border-r border-border px-2 text-right text-muted-foreground tabular-nums">
                {l.newNo ?? ""}
              </td>
              <td
                className={classNames(
                  "w-full whitespace-pre px-2",
                  l.type === "add" && "text-emerald-200/90",
                  l.type === "del" && "text-red-200/90",
                  l.type === "hunk" && "text-muted-foreground",
                  l.type === "ctx" && "text-muted-foreground",
                )}
              >
                <span className="select-none text-muted-foreground">
                  {l.type === "add" ? "+" : l.type === "del" ? "−" : l.type === "hunk" ? "" : " "}
                </span>
                {l.text}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The Timeline tab — honest revision metadata (no fabricated agent steps). */
function Timeline({ rev, commit }: { rev: DetailsRev; commit: GitCommit | null }) {
  const rows: { label: string; value: ReactNode }[] = [];
  if (rev.kind === "commit") {
    rows.push({ label: "Commit", value: <span className="font-mono">{rev.shortSha}</span> });
    rows.push({ label: "Author", value: rev.author });
    rows.push({ label: "When", value: new Date(rev.at).toLocaleString() });
    if (rev.url)
      rows.push({
        label: "Link",
        value: (
          <a
            href={rev.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-foreground hover:text-foreground"
          >
            View on provider <ExternalLink className="size-3" />
          </a>
        ),
      });
  } else {
    rows.push({ label: "Type", value: "Working change (uncommitted)" });
    rows.push({ label: "When", value: new Date(rev.at).toLocaleString() });
    rows.push({ label: "Files", value: String(workingDiffs(rev.pages, rev.basePages).length) });
  }

  const fullMessage = rev.kind === "commit" ? commit?.rawMessage || rev.message : rev.title;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
        <GitCommitHorizontal className="size-4 text-muted-foreground" />
        {rev.title}
      </div>
      <dl className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex gap-3 text-xs">
            <dt className="w-16 shrink-0 text-muted-foreground">{r.label}</dt>
            <dd className="min-w-0 flex-1 text-foreground">{r.value}</dd>
          </div>
        ))}
      </dl>
      {fullMessage && (
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            <FileText className="size-3" />
            Message
          </div>
          <pre className="whitespace-pre-wrap rounded-lg border border-border bg-white/[0.02] p-3 font-mono text-[11px] leading-relaxed text-foreground">
            {fullMessage}
          </pre>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        Step-by-step agent activity for a revision appears here as the builder records it.
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: GitCommitFile["status"] }) {
  const tone =
    status === "added"
      ? "border-emerald-400/20 text-emerald-300/90"
      : status === "removed"
        ? "border-red-400/20 text-red-300/90"
        : "border-border text-muted-foreground";
  return (
    <span
      className={classNames(
        "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        tone,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function IconBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}
