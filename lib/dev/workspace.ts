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
const ID_KEY = "hanzo.dev.project-id";
const VERSION = 1;

/**
 * What a build is called before it has a project record.
 *
 * `components/editor` restores under this name and `lib/dev/starter` seeds under
 * it, so the two have to spell it the same way — it was a literal in two places
 * and a third spelling would simply restore nothing.
 */
export const UNTITLED = "untitled-site";

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
    window.localStorage.removeItem(transcriptKeyFor(project));
  } catch {
    /* nothing to do */
  }
}

/* ── The conversation ─────────────────────────────────────────────────────────
 *
 * The pages survived a reload and the conversation did not, which made the two
 * halves of one session disagree: the site came back exactly as it was, above a
 * thread that claimed nothing had ever been said. Everything already asked for —
 * every correction, every rejected idea, the reasoning behind the current
 * shape — was gone, and the only way to tell the builder what it had already
 * been told was to type it again.
 *
 * Same rules as the working copy above, for the same reasons: scoped by project
 * so two builds cannot restore into each other, version-stamped so a shape
 * change is ignored rather than half-read, bounded, and never throwing.
 */
const TRANSCRIPT_KEY = "hanzo.dev.transcript";
const transcriptKeyFor = (project: string) =>
  `${TRANSCRIPT_KEY}:${(project || "untitled").toLowerCase()}`;

interface Thread {
  v: number;
  messages: readonly unknown[];
  at: number;
}

/**
 * Persist the conversation. Never throws — losing the thread must not break a
 * build, which is the failure this exists to prevent in the first place.
 *
 * The caller owns the message type; this module only guarantees that what comes
 * back is what went in, or nothing. Typing it here would mean importing a view
 * component's interface into storage, and the version stamp is what actually
 * guards the shape.
 */
export function saveTranscript(project: string, messages: readonly unknown[]): void {
  if (typeof window === "undefined") return;
  try {
    if (!messages.length) {
      window.localStorage.removeItem(transcriptKeyFor(project));
      return;
    }
    const blob = JSON.stringify({ v: VERSION, messages, at: Date.now() } satisfies Thread);
    if (blob.length > MAX_BYTES) return;
    window.localStorage.setItem(transcriptKeyFor(project), blob);
  } catch {
    /* quota or privacy mode — the thread is a convenience, never the record */
  }
}

/** The stored conversation for a project, or null. Never throws. */
export function loadTranscript<T>(project: string): T[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(transcriptKeyFor(project));
    if (!raw) return null;
    const thread = JSON.parse(raw) as Thread;
    if (!thread || thread.v !== VERSION || !Array.isArray(thread.messages) || !thread.messages.length)
      return null;
    return thread.messages as T[];
  } catch {
    return null;
  }
}

/**
 * A STABLE, UNIQUE name for this project's repo — minted once, never re-derived.
 *
 * The first version of the per-turn commit derived the repo name from
 * `project.title || "untitled-site"`. For a brand-new build there is no project
 * record, so EVERY first project of EVERY user resolved to the literal
 * "untitled-site" — two unrelated projects would share one repo and overwrite
 * each other's history. That is data loss, not untidiness.
 *
 * It is also why the name may never be re-derived from a mutable title: renaming
 * a project would point it at a DIFFERENT repo and orphan every commit already
 * made. So a saved project uses its own slug (stable by definition), and an
 * unsaved one mints an id once and keeps it.
 */
export function projectRepoName(slug?: string | null): string {
  const fromRecord = (slug || "").trim();
  if (fromRecord) return fromRecord;
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(ID_KEY);
    if (existing) return existing;
    // Short, lowercase, forge-safe. Random rather than time-based: two tabs
    // opened in the same second must not mint the same name.
    const minted = `site-${Math.random().toString(36).slice(2, 8)}${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    window.localStorage.setItem(ID_KEY, minted);
    return minted;
  } catch {
    // No storage: return nothing rather than a shared constant. The caller skips
    // the commit, which loses history for that session — strictly better than
    // writing this session's pages over another project's repo.
    return "";
  }
}

/**
 * WHAT THE USER IS WORKING ON — the one answer, for everything that needs it.
 *
 * Three things ask this question and they must never disagree: the per-turn git
 * commit (which repo do these pages belong to), the version history (whose
 * commits am I listing), and the coding agent (which project's sandbox do I
 * edit). Two of them already answered it two different ways — the commit path
 * read the project RECORD's `space_id`, the sandbox path read the browser's
 * `__projectSlug` — and two derivations of one identity is how a run lands in a
 * sandbox that is not the repo the same session commits to.
 *
 * `hint` is for the caller that already holds the record and would otherwise be
 * forced to wait for the page to have published the slug on `window`. It is a
 * hint and not an override: when it is absent the browser's open project answers,
 * and when neither exists `projectRepoName` mints the per-workspace id that keeps
 * two unsaved builds out of each other's history.
 */
export function currentProject(hint?: string | null): string {
  const fromRecord = (hint || "").trim();
  if (fromRecord) return projectRepoName(fromRecord);
  if (typeof window === "undefined") return "";
  const open = (window as { __projectSlug?: string }).__projectSlug;
  return projectRepoName(open ?? null);
}

/**
 * A NEW build is starting — forget the last unsaved project's identity.
 *
 * The minted repo id lives under ONE key so a RELOAD of the same build reuses
 * the same repo. But without clearing it, the NEXT unsaved build read the same
 * id and committed into the previous project's repo — the cross-project
 * overwrite the minting exists to prevent, one browser over. The composer calls
 * this when it hands a fresh prompt to /dev, which is the one unambiguous
 * "different project now" signal; a reload does not go through the composer, so
 * it keeps its repo.
 */
export function startNewBuild(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ID_KEY);
    window.localStorage.removeItem(keyFor(UNTITLED));
  } catch {
    /* nothing to do */
  }
}
