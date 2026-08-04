"use client";

/**
 * The builder's local copy of a project, so a RELOAD keeps the work.
 *
 * A project with no server record had nowhere to come back from: `initialPages`
 * arrives only for a saved project, and the one local key (`pages`) is written
 * solely by the login/pro modals to survive a redirect. So reloading /dev on a
 * brand-new build produced an empty editor — and on builds where the seed prompt
 * was still replayed, that emptiness was filled by regenerating the whole site
 * from the original prompt. "It rebuilds from scratch every time I reload."
 *
 * This is a working copy, not the record. The record is the project (autosave)
 * and now the repo on git.hanzo.ai (a commit per turn). What this fixes is the
 * gap BEFORE either exists — the first minutes of a new project, which is
 * exactly when someone is most likely to reload and most likely to lose
 * everything.
 *
 * Scoped by project key so two projects cannot restore into each other, and
 * version-stamped so a future shape change is ignored rather than half-read.
 */
import type { Page } from "@/types";

const KEY = "hanzo.dev.workspace";
const VERSION = 1;

/** Bound: localStorage throws past a few MB, and a throw here loses the work. */
const MAX_BYTES = 4 * 1024 * 1024;

interface Snapshot {
  v: number;
  project: string;
  pages: Page[];
  prompts: string[];
  at: number;
}

const keyFor = (project: string) => `${KEY}:${(project || "untitled").toLowerCase()}`;

/** Persist the working copy. Never throws — a failed save must not break a build. */
export function saveWorkspace(project: string, pages: Page[], prompts: string[]): void {
  if (typeof window === "undefined" || !pages.length) return;
  try {
    const snap: Snapshot = { v: VERSION, project, pages, prompts, at: Date.now() };
    const blob = JSON.stringify(snap);
    // Silently skipping an oversized project is better than throwing mid-build;
    // the project record and the repo are the durable copies either way.
    if (blob.length > MAX_BYTES) return;
    window.localStorage.setItem(keyFor(project), blob);
  } catch {
    /* quota or privacy mode — the server copies still apply */
  }
}

/** The working copy for a project, or null. Never throws. */
export function loadWorkspace(project: string): { pages: Page[]; prompts: string[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(keyFor(project));
    if (!raw) return null;
    const snap = JSON.parse(raw) as Snapshot;
    // A shape we do not recognise is ignored, not guessed at: half-reading a
    // snapshot would restore a project into a state it was never in.
    if (!snap || snap.v !== VERSION || !Array.isArray(snap.pages) || !snap.pages.length) return null;
    return { pages: snap.pages, prompts: Array.isArray(snap.prompts) ? snap.prompts : [] };
  } catch {
    return null;
  }
}

/** Forget it — used when a project is explicitly started over. */
export function clearWorkspace(project: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(keyFor(project));
  } catch {
    /* nothing to do */
  }
}
