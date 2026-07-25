"use client";

import { Check, GitBranch } from "lucide-react";
import type { Project } from "@/types";

/**
 * The thin VS-Code-style status bar pinned to the bottom of the builder — a calm
 * strip of real state (live preview · autosave · branch · files · ready), on the
 * one hairline + layered-black surface. Monochrome; the only hue is the accent
 * "live" dot, which pulses while a generation streams.
 */
function Sep() {
  return (
    <span aria-hidden className="text-muted-foreground/40">
      ·
    </span>
  );
}

export function StatusBar({
  isAiWorking,
  project,
  pageCount,
}: {
  isAiWorking: boolean;
  project?: Project | null;
  pageCount: number;
}) {
  // Builder projects are single-branch by construction: git-on-publish commits
  // to `main`. The editor's Project carries no branch field, so state it rather
  // than invent one from a type that cannot hold it.
  const branch = "main";
  return (
    <footer className="z-20 flex h-6 shrink-0 select-none items-center gap-2.5 border-t border-border bg-card px-3 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="relative flex size-1.5 items-center justify-center">
          <span className="absolute inline-flex size-1.5 animate-ping rounded-full bg-[var(--brand-accent)] opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex size-1.5 rounded-full bg-[var(--brand-accent)]" />
        </span>
        Live
      </span>
      <Sep />
      <span>{isAiWorking ? "Building…" : "Auto-saved"}</span>
      <Sep />
      <span className="inline-flex items-center gap-1">
        <GitBranch className="size-3" />
        {branch}
      </span>
      <Sep />
      <span>
        {pageCount} file{pageCount === 1 ? "" : "s"}
      </span>
      <span className="ml-auto inline-flex items-center gap-1">
        {isAiWorking ? (
          <>
            <span className="thread-shimmer-text">Working</span>
          </>
        ) : (
          <>
            <Check className="size-3" />
            Ready
          </>
        )}
      </span>
    </footer>
  );
}
