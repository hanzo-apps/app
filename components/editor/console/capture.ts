"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * What the console shows: the PREVIEW's console.
 *
 * The generated page runs in a `srcdoc` iframe, so it is same-origin and its
 * `console` is reachable. We patch it on every frame load — the preview is
 * double-buffered and rewrites `srcDoc` as a build streams, so each new
 * document needs patching again. Listening for `load` in the CAPTURE phase on
 * `document` catches all of them (load does not bubble, but it does capture)
 * without the preview having to know this panel exists.
 */

export type Level = "log" | "info" | "warn" | "error" | "debug";

export interface Entry {
  id: number;
  level: Level;
  text: string;
}

const LEVELS: Level[] = ["log", "info", "warn", "error", "debug"];
/** Enough to debug a page, bounded so a runaway loop cannot eat memory. */
const LIMIT = 300;
/** Frames the preview owns; both buffers carry this title. */
const FRAMES = 'iframe[title="output"]';

function format(args: unknown[]): string {
  return args
    .map((a) => {
      if (typeof a === "string") return a;
      if (a instanceof Error) return a.stack || `${a.name}: ${a.message}`;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(" ");
}

export function usePreviewConsole() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    const push = (level: Level, text: string) => {
      if (!text) return;
      setEntries((prev) => {
        seq.current += 1;
        return [...prev, { id: seq.current, level, text }].slice(-LIMIT);
      });
    };

    const attach = (frame: HTMLIFrameElement) => {
      let win: (Window & { __hzConsole?: boolean }) | null = null;
      try {
        win = frame.contentWindow as (Window & { __hzConsole?: boolean }) | null;
      } catch {
        return; // cross-origin: nothing to read, and nothing to break
      }
      if (!win || win.__hzConsole) return;
      win.__hzConsole = true;

      const target = (win as unknown as {
        console: Record<string, (...a: unknown[]) => void>;
      }).console;
      for (const level of LEVELS) {
        const original = target[level];
        if (typeof original !== "function") continue;
        target[level] = (...args: unknown[]) => {
          push(level, format(args));
          original.apply(target, args);
        };
      }
      win.addEventListener("error", (event) => {
        const e = event as ErrorEvent;
        push(
          "error",
          e.message
            ? `${e.message} (${e.filename ?? ""}:${e.lineno ?? 0})`
            : "Script error",
        );
      });
      win.addEventListener("unhandledrejection", (event) => {
        push(
          "error",
          `Unhandled rejection: ${String((event as PromiseRejectionEvent).reason)}`,
        );
      });
    };

    const onLoad = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLIFrameElement && target.matches(FRAMES)) {
        attach(target);
      }
    };

    document.addEventListener("load", onLoad, true);
    // Frames that finished loading before this dock mounted.
    document.querySelectorAll<HTMLIFrameElement>(FRAMES).forEach(attach);
    return () => document.removeEventListener("load", onLoad, true);
  }, []);

  const clear = useCallback(() => setEntries([]), []);
  return { entries, clear };
}
