"use client";

/**
 * Save the project as it changes, and report HONESTLY whether it is saved.
 *
 * The console's status bar has always read "Auto-saved" — a literal string,
 * printed whenever a build was not running, checked against nothing. Nothing
 * autosaved. A project's only home was browser IndexedDB plus whatever Publish
 * had pushed, so work was one closed tab from gone while the UI said otherwise.
 * "None of the work is persisting" is that sentence being false.
 *
 * This is the honest half. It writes through `commitTurn` — the SAME commit to
 * git.hanzo.ai that a finished turn makes — rather than introducing a second
 * write path that could disagree with it, and it reports one of four real states:
 *
 *   idle    — nothing has changed since the last save
 *   saving  — a write is in flight
 *   saved   — the server accepted it, with the time it did
 *   error   — it did not, and the bar must not claim otherwise
 *   unsaved — there is no name to save under, so there is nowhere to save
 *
 * `unsaved` used to mean "no project record", because the old write needed one.
 * A commit does not: `projectRepoName` mints a stable id for a build that has no
 * record yet, so a brand-new build now has a home from its first turn instead of
 * being one closed tab from gone. What remains genuinely nowhere is a render with
 * no name at all — a server render, or a browser with no storage.
 *
 * It used to write `PUT /me/projects/<ns>/<repo>`, which is a hanzo.app route
 * backed by `@huggingface/hub` — it uploaded the pages to a HuggingFace Space
 * and looked the project up in an HF-shaped store that is empty. Every write
 * answered 404 "Project not found", so the bar said "Not saved — retrying"
 * forever and it was telling the truth: nothing was being kept anywhere. The
 * project's real home is its repo on git.hanzo.ai, which `commitTurn` creates,
 * commits to, and links back onto the project record.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { commitTurn } from "@/lib/git/commit-turn";
import { currentProject } from "@/lib/dev/workspace";
import type { Page } from "@/types";

export type SaveState = "idle" | "saving" | "saved" | "error" | "unsaved";

export interface Autosave {
  state: SaveState;
  /** When the last successful save landed. */
  at: Date | null;
  /** Force a save now — the Publish button and ⌘S share this path.
   *  Resolves to whether the write landed, so a caller can say which. */
  saveNow: () => Promise<boolean>;
}

/** Debounce: long enough not to write on every keystroke of a stream. */
const QUIET_MS = 2_000;

/** Cheap change detector — the payload we would send. */
const fingerprint = (pages: Page[], prompts: string[]) =>
  JSON.stringify({ p: pages.map((x) => [x.path, x.html.length, x.html.slice(-64)]), q: prompts.length });

export function useAutosave(
  repoId: string | undefined,
  pages: Page[],
  prompts: string[],
  /** Never write mid-generation: the pages are a partial document. */
  busy: boolean,
): Autosave {
  // The repo a commit would land in. `currentProject` prefers the project's own
  // slug (stable by definition) and mints a durable id when there is no record —
  // never the title, which renaming would point at a different repo.
  const repo = useMemo(() => currentProject(repoId), [repoId]);
  const addressable = Boolean(repo);
  const [state, setState] = useState<SaveState>(addressable ? "idle" : "unsaved");
  const [at, setAt] = useState<Date | null>(null);
  const lastSaved = useRef<string>("");
  const inFlight = useRef(false);

  const write = useCallback(async (): Promise<boolean> => {
    if (!addressable) return false;
    if (inFlight.current) return false;
    const print = fingerprint(pages, prompts);
    // Already durable — nothing to write is a success, not a failure.
    if (print === lastSaved.current) return true;

    inFlight.current = true;
    setState("saving");
    try {
      // The last prompt names the commit, so the history panel reads as the
      // conversation that produced it rather than as a column of "Update".
      const res = await commitTurn(
        repo,
        pages,
        prompts[prompts.length - 1] || "Update from hanzo.app",
      );
      if (res.ok) {
        // Recorded only on SUCCESS. Marking it saved before the server agrees is
        // how an indicator starts lying again.
        lastSaved.current = print;
        setAt(new Date());
        setState("saved");
        return true;
      }
      setState("error");
      return false;
    } catch {
      setState("error");
      return false;
    } finally {
      inFlight.current = false;
    }
  }, [addressable, repo, pages, prompts]);

  useEffect(() => {
    if (!addressable) {
      setState("unsaved");
      return;
    }
    if (busy) return; // a partial document is not a save-worthy state
    const t = setTimeout(write, QUIET_MS);
    return () => clearTimeout(t);
  }, [addressable, busy, write]);

  // Last chance: a tab closing mid-debounce would otherwise drop the newest
  // edit — the exact moment the old label was most wrong.
  useEffect(() => {
    if (!addressable) return;
    const flush = () => {
      if (fingerprint(pages, prompts) !== lastSaved.current) void write();
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [addressable, pages, prompts, write]);

  return { state, at, saveNow: write };
}
