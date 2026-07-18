"use client";

import { useEffect } from "react";

/**
 * Self-heals the "Loading chunk N failed" / ChunkLoadError that a client-side
 * navigation throws when the deployed build has moved on: an open tab holds HTML
 * that references `_next/static/chunks/*` hashes a newer deploy has already
 * removed, so the next route transition (e.g. into `/dev`) can't fetch its chunk
 * and the navigation dead-ends (looks like "clicking a project bounces to the
 * main page"). When we detect that specific failure we do a ONE-shot hard reload
 * — which re-fetches the current HTML + its live chunk hashes — guarded so a
 * genuinely-missing chunk can't loop. Frequent deploys make this essential.
 */
const CHUNK_ERROR = /Loading chunk [\w-]+ failed|ChunkLoadError|Loading CSS chunk|error loading dynamically imported module|Importing a module script failed/i;
const GUARD_KEY = "__chunkReloadAt";
const MIN_INTERVAL_MS = 15_000; // don't reload more than once per 15s (loop guard)

export function ChunkReloader() {
  useEffect(() => {
    const reloadOnce = () => {
      let last = 0;
      try {
        last = Number(sessionStorage.getItem(GUARD_KEY) || 0);
      } catch {
        /* storage unavailable — still attempt one reload below */
      }
      const now = Date.now();
      if (now - last < MIN_INTERVAL_MS) return; // already reloaded recently — avoid a loop
      try {
        sessionStorage.setItem(GUARD_KEY, String(now));
      } catch {
        /* ignore */
      }
      window.location.reload();
    };

    const onError = (e: ErrorEvent) => {
      if (CHUNK_ERROR.test(e?.message || "")) reloadOnce();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const msg =
        (e?.reason && (e.reason.message || String(e.reason))) || "";
      if (CHUNK_ERROR.test(msg)) reloadOnce();
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}

export default ChunkReloader;
