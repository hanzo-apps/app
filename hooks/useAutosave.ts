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
 * This is the honest half. It reuses the SAME endpoint the Save button already
 * uses (`PUT /me/projects/<ns>/<repo>`) rather than introducing a second write
 * path that could disagree with it, and it reports one of four real states:
 *
 *   idle    — nothing has changed since the last save
 *   saving  — a write is in flight
 *   saved   — the server accepted it, with the time it did
 *   error   — it did not, and the bar must not claim otherwise
 *   unsaved — there is NO project record, so there is nowhere to save
 *
 * `unsaved` is the state a brand-new build is in, and naming it is the point:
 * that build is not saved anywhere, and the person needs to know before they
 * close the tab, not after.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import type { Page } from "@/types";

export type SaveState = "idle" | "saving" | "saved" | "error" | "unsaved";

export interface Autosave {
  state: SaveState;
  /** When the last successful save landed. */
  at: Date | null;
  /** Force a save now — the Save button and ⌘S share this path. */
  saveNow: () => void;
}

/** Debounce: long enough not to write on every keystroke of a stream. */
const QUIET_MS = 2_000;

/** Cheap change detector — the payload we would send. */
const fingerprint = (pages: Page[], prompts: string[]) =>
  JSON.stringify({ p: pages.map((x) => [x.path, x.html.length, x.html.slice(-64)]), q: prompts.length });

export function useAutosave(
  namespace: string | undefined,
  repoId: string | undefined,
  pages: Page[],
  prompts: string[],
  /** Never write mid-generation: the pages are a partial document. */
  busy: boolean,
): Autosave {
  const addressable = Boolean(namespace && repoId);
  const [state, setState] = useState<SaveState>(addressable ? "idle" : "unsaved");
  const [at, setAt] = useState<Date | null>(null);
  const lastSaved = useRef<string>("");
  const inFlight = useRef(false);

  const write = useCallback(async () => {
    if (!addressable || inFlight.current) return;
    const print = fingerprint(pages, prompts);
    if (print === lastSaved.current) return;

    inFlight.current = true;
    setState("saving");
    try {
      const res = await api.put(`/me/projects/${namespace}/${repoId}`, { pages, prompts });
      if (res?.data?.ok) {
        // Recorded only on SUCCESS. Marking it saved before the server agrees is
        // how an indicator starts lying again.
        lastSaved.current = print;
        setAt(new Date());
        setState("saved");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    } finally {
      inFlight.current = false;
    }
  }, [addressable, namespace, repoId, pages, prompts]);

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

  return { state, at, saveNow: () => void write() };
}
