"use client";

import { useEffect, useState } from "react";

import type { RoutingDefaults } from "@/lib/providers";

type Resp = {
  present?: boolean;
  autoRoutingActive?: boolean;
  defaultSessionRouting?: boolean;
};

// Session-shared load so every consumer (the /usage toggle + the builder)
// issues ONE request. The server route is per-user cached; this avoids a
// duplicate fetch when surfaces mount together. `null` = no org policy known
// (older cloud-api / fetch failed) → callers use local preference only.
let cache: RoutingDefaults | null = null;
let cached = false;
let inflight: Promise<RoutingDefaults | null> | null = null;

function load(): Promise<RoutingDefaults | null> {
  if (cached) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetch("/v1/routing-defaults", { credentials: "same-origin" })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
    .then((body: Resp) => {
      const result: RoutingDefaults | null = body.present
        ? {
            autoRoutingActive: body.autoRoutingActive === true,
            defaultSessionRouting: body.defaultSessionRouting === true,
          }
        : null;
      cache = result;
      cached = true; // "absent" is a valid, cacheable answer
      return result;
    })
    .catch(() => null) // transient — not cached, retried next mount
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * useRoutingDefaults — the org's server-driven smart-routing policy, or `null`
 * until loaded / when unavailable. Fail-soft: never throws, never blocks; a
 * `null` result means "no org policy known → use local preference only".
 */
export function useRoutingDefaults(): RoutingDefaults | null {
  const [state, setState] = useState<RoutingDefaults | null>(() => cache);

  useEffect(() => {
    let alive = true;
    load().then((res) => {
      if (alive) setState(res);
    });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
