"use client";

/**
 * FileTree — the editor's file browser (Code view, left rail).
 *
 * A vertical, IDE-style list of the project's files (the editor's `pages` — each
 * a real file the project ships to S3). Replaces the old horizontal page-tab
 * strip so a user can SEE and navigate every file, add a new one, and
 * rename/delete inline — the "where are my files" gap. Selecting a file loads it
 * into the code editor on the right.
 *
 * Honest scope: this lists the files the editor holds. A single-file app shows
 * one file (that is genuinely all it has); a multi-page app shows them all.
 */

import { useState } from "react";
import { FileCode2, Plus, Trash2, Check, X, Pencil } from "lucide-react";
import { Page } from "@/types";
import { cn } from "@/lib/utils";

export function FileTree({
  pages,
  currentPage,
  onSelectPage,
  onNewPage,
  onDeletePage,
}: {
  pages: Page[];
  currentPage: string;
  onSelectPage: (path: string, newPath?: string) => void;
  onNewPage: () => void;
  onDeletePage: (path: string) => void;
}) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const startRename = (path: string) => {
    setRenaming(path);
    setDraft(path);
  };
  const commitRename = (path: string) => {
    const next = draft.trim();
    if (next && next !== path) onSelectPage(path, next);
    setRenaming(null);
  };

  return (
    <div className="flex h-full w-48 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Files
        </span>
        <button
          type="button"
          onClick={onNewPage}
          title="New file"
          className="grid h-5 w-5 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
        {pages.map((page) => {
          const active = page.path === currentPage;
          const isRenaming = renaming === page.path;
          return (
            <div
              key={page.path}
              className={cn(
                "group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px]",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
              )}
            >
              <FileCode2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {isRenaming ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(page.path);
                    if (e.key === "Escape") setRenaming(null);
                  }}
                  onBlur={() => commitRename(page.path)}
                  className="min-w-0 flex-1 rounded bg-background/40 px-1 py-0.5 font-mono text-[12px] text-foreground outline-none ring-1 ring-white/20"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectPage(page.path)}
                  className="min-w-0 flex-1 truncate text-left font-mono"
                  title={page.path}
                >
                  {page.path}
                </button>
              )}

              {isRenaming ? (
                <button
                  type="button"
                  onClick={() => commitRename(page.path)}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <Check className="h-3 w-3" />
                </button>
              ) : (
                <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => startRename(page.path)}
                    title="Rename"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  {pages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeletePage(page.path)}
                      title="Delete"
                      className="text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </span>
              )}
            </div>
          );
        })}
        {pages.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
            <X className="h-4 w-4 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">No files yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
