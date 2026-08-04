"use client";

import { SizableText, XStack, YStack, Paragraph, Anchor } from '@hanzo/gui';
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
import { toast, Button } from '@hanzo/ui';

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
    <YStack position="absolute" top={0} right={0} bottom={0} left={0} zIndex={30} backgroundColor="$background">
      {/* Header: back · title · Timeline|Changes · close */}
      <XStack alignItems="center" gap="$2" borderBottomWidth={1} borderColor="$borderColor" paddingHorizontal="$3" paddingVertical="$2">
        <Button
          type="button"
          onClick={onClose}
          alignItems="center" gap="$1" borderRadius="$3" paddingHorizontal="$1.5" paddingVertical="$1" hoverStyle={{ backgroundColor: "$color3" }}
        >
          <ArrowLeft size={14} />
          <SizableText fontSize="$1" color="$color11">Back to latest</SizableText>
        </Button>
        <SizableText marginLeft="$1" numberOfLines={1} fontSize={13} fontWeight="500" color="$color">Details</SizableText>
        <XStack marginLeft="auto" alignItems="center" gap="$1.5">
          <XStack alignItems="center" gap="$0.5" borderRadius="$5" backgroundColor="$color3" padding="$0.5">
            {(["timeline", "changes"] as const).map((v) => (
              <Button
                key={v}
                type="button"
                onClick={() => setView(v)}
                borderRadius="$3" paddingHorizontal="$2.5" paddingVertical="$1" {...{ backgroundColor: view === v ? "$color12" : undefined, elevation: view === v ? 1 : undefined, hoverStyle: view === v ? undefined : { backgroundColor: "$color4" } }}
              >
                <SizableText fontSize="$1" fontWeight="500" textTransform="capitalize" color={view === v ? "$background" : "$color11"}>{v}</SizableText>
              </Button>
            ))}
          </XStack>
          <Button
            type="button"
            onClick={onClose}
            title="Close details"
            width={28} height={28} alignItems="center" justifyContent="center" borderRadius="$3" hoverStyle={{ backgroundColor: "$color3" }}
          >
            <X size={16} />
          </Button>
        </XStack>
      </XStack>

      <YStack minHeight={0} flex={1} overflow="scroll" className="thin-scrollbar">
        {view === "timeline" ? (
          <Timeline rev={rev} commit={commit} />
        ) : (
          <Changes rev={rev} files={files} onMention={mention} />
        )}
      </YStack>
    </YStack>
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
      <XStack alignItems="center" gap="$2" paddingHorizontal="$4" paddingVertical="$6">
        <Loader2 size={16} />
        <SizableText fontSize="$3" color="$color11">Loading changes…</SizableText>
      </XStack>
    );
  }
  if (files === "error") {
    return <Paragraph paddingHorizontal="$4" paddingVertical="$6" fontSize="$3" color="$color11">Couldn&apos;t load the diff for this revision.</Paragraph>;
  }
  if (files.length === 0) {
    return <Paragraph paddingHorizontal="$4" paddingVertical="$6" fontSize="$3" color="$color11">No file changes in this revision.</Paragraph>;
  }
  return (
    <YStack rowGap="$2" padding="$3">
      {files.map((f) => (
        <FileCard key={f.path} file={f} isCommit={rev.kind === "commit"} onMention={onMention} />
      ))}
    </YStack>
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
    <YStack overflow="hidden" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2">
      <XStack alignItems="center" gap="$2" paddingHorizontal="$3" paddingVertical="$2">
        <Button
          type="button"
          onClick={() => setOpen((v) => !v)}
          minWidth={0} flex={1} alignItems="center" gap="$2"
        >
          <ChevronRight
            size={14}
  />
          <StatusBadge status={file.status} />
          <SizableText numberOfLines={1} fontFamily="$mono" fontSize="$1" color="$color">{file.path}</SizableText>
          <SizableText marginLeft="$1" flexShrink={0} fontFamily="$mono" fontSize={10} color="$color11">
            <SizableText color="$green8">+{stat.added}</SizableText>{" "}
            <SizableText color="$red8">−{stat.removed}</SizableText>
          </SizableText>
        </Button>
        <XStack flexShrink={0} alignItems="center" gap="$0.5">
          {isCommit && file.viewUrl && (
            <IconBtn
              title="View file"
              onClick={() => window.open(file.viewUrl, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink size={14} />
            </IconBtn>
          )}
          <IconBtn title="Mention in chat" onClick={() => onMention(file.path)}>
            <AtSign size={14} />
          </IconBtn>
          <IconBtn
            title="Copy path"
            onClick={() => {
              void navigator.clipboard?.writeText(file.path).catch(() => {});
              toast.success("Copied path");
            }}
          >
            <Copy size={14} />
          </IconBtn>
        </XStack>
      </XStack>
      {open && <DiffView lines={file.lines} />}
    </YStack>
  );
}

/** The red/green unified diff body with old/new line-number gutters. */
function DiffView({ lines }: { lines: DiffLine[] }) {
  if (lines.length === 0) {
    return (
      <YStack borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$3" paddingVertical="$2">
        <SizableText fontFamily="$mono" fontSize={11} color="$color11">
          No inline diff available — view the file to see its contents.
        </SizableText>
      </YStack>
    );
  }
  return (
    <YStack borderTopWidth={1} borderColor="$borderColor" backgroundColor="$background" overflow="scroll">
      <YStack width="100%">
        <tbody>
          {lines.map((l, i) => (
            <YStack
              key={i}
              {...{ backgroundColor: l.type === "hunk" ? "$color3" : l.type === "del" ? "$red9" : l.type === "add" ? "$green9" : undefined }}
            >
              <SizableText userSelect="none" borderRightWidth={1} borderColor="$borderColor" paddingHorizontal="$2" textAlign="right" fontFamily="$mono" fontSize={11} color="$color11">
                {l.oldNo ?? ""}
              </SizableText>
              <SizableText userSelect="none" borderRightWidth={1} borderColor="$borderColor" paddingHorizontal="$2" textAlign="right" fontFamily="$mono" fontSize={11} color="$color11">
                {l.newNo ?? ""}
              </SizableText>
              <SizableText
                width="100%" whiteSpace="pre" paddingHorizontal="$2" fontFamily="$mono" fontSize={11} lineHeight="1.625" {...{ color: l.type === "ctx" ? "$color11" : l.type === "hunk" ? "$color11" : l.type === "del" ? "$red3" : l.type === "add" ? "$green3" : undefined }}
              >
                <SizableText userSelect="none" color="$color11">
                  {l.type === "add" ? "+" : l.type === "del" ? "−" : l.type === "hunk" ? "" : " "}
                </SizableText>
                {l.text}
              </SizableText>
            </YStack>
          ))}
        </tbody>
      </YStack>
    </YStack>
  );
}

/** The Timeline tab — honest revision metadata (no fabricated agent steps). */
function Timeline({ rev, commit }: { rev: DetailsRev; commit: GitCommit | null }) {
  const rows: { label: string; value: ReactNode }[] = [];
  if (rev.kind === "commit") {
    rows.push({ label: "Commit", value: <SizableText fontFamily="$mono">{rev.shortSha}</SizableText> });
    rows.push({ label: "Author", value: rev.author });
    rows.push({ label: "When", value: new Date(rev.at).toLocaleString() });
    if (rev.url)
      rows.push({
        label: "Link",
        value: (
          <Anchor
            href={rev.url}
            target="_blank"
            rel="noopener noreferrer"
            alignItems="center" gap="$1" color="$color" hoverStyle={{ color: "$color" }}
          >
            View on provider <ExternalLink size={12} />
          </Anchor>
        ),
      });
  } else {
    rows.push({ label: "Type", value: "Working change (uncommitted)" });
    rows.push({ label: "When", value: new Date(rev.at).toLocaleString() });
    rows.push({ label: "Files", value: String(workingDiffs(rev.pages, rev.basePages).length) });
  }

  const fullMessage = rev.kind === "commit" ? commit?.rawMessage || rev.message : rev.title;

  return (
    <YStack rowGap="$4" padding="$4">
      <XStack alignItems="center" gap="$2">
        <GitCommitHorizontal size={16} />
        <SizableText fontSize={13} fontWeight="500" color="$color">{rev.title}</SizableText>
      </XStack>
      <YStack rowGap="$1.5">
        {rows.map((r) => (
          <XStack key={r.label} gap="$3">
            <SizableText width="$10" flexShrink={0} fontSize="$1" color="$color11">{r.label}</SizableText>
            <SizableText minWidth={0} flex={1} fontSize="$1" color="$color">{r.value}</SizableText>
          </XStack>
        ))}
      </YStack>
      {fullMessage && (
        <div>
          <XStack marginBottom="$1" alignItems="center" gap="$1.5">
            <FileText size={12} />
            <SizableText fontSize={11} letterSpacing={0.4} color="$color11">Message</SizableText>
          </XStack>
          <SizableText whiteSpace="pre" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" padding="$3" fontFamily="$mono" fontSize={11} lineHeight="1.625" color="$color">
            {fullMessage}
          </SizableText>
        </div>
      )}
      <Paragraph fontSize={11} color="$color11">
        Step-by-step agent activity for a revision appears here as the builder records it.
      </Paragraph>
    </YStack>
  );
}

function StatusBadge({ status }: { status: GitCommitFile["status"] }) {
  const tone =
    status === "added"
      ? { borderColor: "rgba(52,211,153,0.2)", color: "rgba(110,231,183,0.9)" }
      : status === "removed"
        ? { borderColor: "rgba(248,113,113,0.2)", color: "rgba(252,165,165,0.9)" }
        : { borderColor: "$borderColor", color: "$color11" };
  return (
    <SizableText
      flexShrink={0} borderRadius="$3" borderWidth={1} paddingHorizontal="$1.5" paddingVertical="$0.5" fontSize={10} fontWeight="500" letterSpacing={0.4} {...tone}
    >
      {STATUS_LABEL[status]}
    </SizableText>
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
    <Button
      type="button"
      title={title}
      onClick={onClick}
      width="$5" height="$5" alignItems="center" justifyContent="center" borderRadius="$3" hoverStyle={{ backgroundColor: "$color3" }}
    >
      <SizableText color="$color11">{children}</SizableText>
    </Button>
  );
}
