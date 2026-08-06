"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * What the console shows: the PREVIEW's console.
 *
 * It ARRIVES now. This used to reach into `frame.contentWindow` and patch the
 * console from out here, which worked only while the preview shared this origin.
 * It does not any more — untrusted generated, imported and forked HTML runs in
 * there, so the frame is sandboxed without `allow-same-origin` — and the failure
 * was not graceful: merely READING `win.__hzConsole` off a cross-origin window
 * throws, outside the try that guarded fetching the window, so the whole builder
 * came down with "Application Error … Blocked a frame from accessing a
 * cross-origin frame".
 *
 * The bridge injected into every previewed document (`preview/bridge.ts`) patches
 * console there and forwards each line as a `preview:console` message. That is
 * both safe across the boundary and simpler: no re-patching per frame load, no
 * `__hzConsole` sentinel, and the double buffer stops mattering because both
 * frames carry the same bridge and both post to the same listener.
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

    const onMessage = (event: MessageEvent) => {
      // Only the preview's own frames. `event.origin` cannot say so — a
      // sandboxed document reports the origin "null", which every opaque frame
      // shares — so the sender is identified by window, matched against the
      // frames the preview owns.
      const frames = Array.from(
        document.querySelectorAll<HTMLIFrameElement>(FRAMES),
      );
      if (!frames.some((f) => f.contentWindow === event.source)) return;

      const data = event.data as { type?: string; level?: Level; text?: string };
      if (!data || data.type !== "preview:console") return;
      if (!data.level || !LEVELS.includes(data.level)) return;
      push(data.level, data.text ?? "");
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const clear = useCallback(() => setEntries([]), []);
  return { entries, clear };
}
