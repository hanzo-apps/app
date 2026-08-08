"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

/**
 * The builder's ONE log.
 *
 * Two things produce output while you build, and both belong in the same dock:
 *
 *   preview   the generated page's own console, forwarded by the bridge injected
 *             into every previewed document (`preview/bridge.ts`). It ARRIVES —
 *             we cannot reach into the frame any more, since untrusted HTML runs
 *             there without `allow-same-origin`.
 *   sandbox   the commands the agent runs in the project's sandbox, and their
 *             output. `POST /v1/sandboxes/run` is the only place a command in
 *             this product actually runs, and its output arrives HERE while the
 *             command is still running — the sandbox appends it to the run's
 *             session log line by line, and the dock tails that log. A build
 *             used to be a blank pause with a verdict at the end.
 *
 * They share one buffer rather than one-each because a dock with two scrollbacks
 * is two consoles, and the question a person actually asks — "what just
 * happened?" — is answered by the interleaving. `source` is the only thing that
 * distinguishes them, and it is a label, not a second store.
 *
 * The store lives at module scope, not in a hook. The preview posts messages
 * whether or not the dock is mounted, and an agent run outlives the composer
 * that started it; a buffer that only exists while something is rendering loses
 * exactly the lines you reopen the dock to read.
 */

export type Level = "log" | "info" | "warn" | "error" | "debug";
/**
 * Who spoke. `preview` is the page, `sandbox` is the pod, and `you` is a line
 * TYPED at the prompt — authorship, not severity, which is why it belongs here
 * and not on `Level`. Without it a transcript gives a command and its output the
 * same weight and you cannot find where you were.
 */
export type Source = "preview" | "sandbox" | "you";

export interface Entry {
  id: number;
  level: Level;
  source: Source;
  text: string;
}

const LEVELS: Level[] = ["log", "info", "warn", "error", "debug"];
/** Enough to debug a page or read a build's output, bounded so a runaway loop
 *  cannot eat memory. */
const LIMIT = 300;
/** Frames the preview owns; both buffers carry this title. */
const FRAMES = 'iframe[title="output"]';

let seq = 0;
let entries: Entry[] = [];
const subscribers = new Set<() => void>();

const emit = () => {
  for (const fn of subscribers) fn();
};

/** Append a line. Empty text is not a line. */
export function push(source: Source, level: Level, text: string): void {
  if (!text) return;
  seq += 1;
  // A new array every time: `useSyncExternalStore` compares snapshots by
  // identity, so mutating in place would render nothing.
  entries = [...entries, { id: seq, source, level, text }].slice(-LIMIT);
  emit();
}

/** Append a block of output as one line per line, dropping trailing blanks. */
export function pushBlock(source: Source, level: Level, block: string): void {
  for (const line of (block ?? "").replace(/\s+$/, "").split("\n")) {
    push(source, level, line || " ");
  }
}

export function clearLog(): void {
  entries = [];
  emit();
}

/**
 * The run the dock is watching, while there is one.
 *
 * It lives here rather than in the composer for the same reason the buffer does:
 * a run outlives the component that started it, and the dock is where a person
 * reads it and therefore where they reach to stop it. `sandbox` is the whole
 * point — it is the handle Stop acts on, and a run with no sandbox has nothing
 * to interrupt, so the control simply is not offered.
 */
export interface Run {
  /** The sandbox the commands are running in. Absent for a scratch run. */
  sandbox?: string;
  /** The session the sandbox narrates into, when anything is watching. */
  session?: string;
}

let run: Run | null = null;

export function beginRun(r: Run): void {
  run = r;
  emit();
}

export function endRun(): void {
  run = null;
  emit();
}

/** The live run, or null. Shares the log's subscription — one dock, one render. */
export function useRun(): Run | null {
  return useSyncExternalStore(
    subscribe,
    () => run,
    () => null
  );
}

const subscribe = (fn: () => void) => {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
};

const snapshot = () => entries;
/** The server has no console; one frozen empty snapshot keeps SSR stable. */
const EMPTY: Entry[] = [];
const serverSnapshot = () => EMPTY;

/**
 * Subscribe the dock to the log, and while it is mounted, forward the preview's
 * console into it.
 *
 * The listener is registered by the dock rather than globally because it is the
 * only consumer, and a page with no builder on it should not be listening to
 * postMessage at all.
 */
export function useConsoleLog() {
  const list = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // Only the preview's own frames. `event.origin` cannot say so — a
      // sandboxed document reports the origin "null", which every opaque frame
      // shares — so the sender is identified by window, matched against the
      // frames the preview owns.
      const frames = Array.from(document.querySelectorAll<HTMLIFrameElement>(FRAMES));
      if (!frames.some((f) => f.contentWindow === event.source)) return;

      const data = event.data as { type?: string; level?: Level; text?: string };
      if (!data || data.type !== "preview:console") return;
      if (!data.level || !LEVELS.includes(data.level)) return;
      push("preview", data.level, data.text ?? "");
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const clear = useCallback(() => clearLog(), []);
  return { entries: list, clear };
}
