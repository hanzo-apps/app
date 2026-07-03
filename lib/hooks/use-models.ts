"use client";

import { useEffect, useState } from "react";

import {
  DEFAULT_MODEL,
  FALLBACK_MODELS,
  type ModelOption,
} from "@/lib/providers";

export type UseModels = {
  models: ModelOption[];
  defaultModel: string;
  loading: boolean;
};

type ModelsResponse = {
  defaultModel?: string;
  models?: ModelOption[];
};

// Never break the picker: if discovery fails, show the offline ladder.
const OFFLINE: Omit<UseModels, "loading"> = {
  models: FALLBACK_MODELS,
  defaultModel: DEFAULT_MODEL,
};

// Session-shared load so every picker (ask-ai input + settings) issues ONE
// request. The server route is already 5-min cached per user; this just avoids
// a duplicate fetch when both components mount together.
let cache: Omit<UseModels, "loading"> | null = null;
let inflight: Promise<Omit<UseModels, "loading">> | null = null;

function load(): Promise<Omit<UseModels, "loading">> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetch("/v1/models", { credentials: "same-origin" })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
    .then((body: ModelsResponse) => {
      const result: Omit<UseModels, "loading"> = {
        models: body.models?.length ? body.models : FALLBACK_MODELS,
        defaultModel: body.defaultModel || DEFAULT_MODEL,
      };
      cache = result; // only successful live/shaped results are cached
      return result;
    })
    .catch(() => OFFLINE) // transient — not cached, retried next mount
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * useModels — the live gateway model list for the builder picker.
 *
 * Returns the offline ladder immediately (so `models` is never empty and the
 * picker cannot crash), then swaps to the live `/v1/models` list once loaded.
 */
export function useModels(): UseModels {
  const [state, setState] = useState<UseModels>(() =>
    cache ? { ...cache, loading: false } : { ...OFFLINE, loading: true }
  );

  useEffect(() => {
    let alive = true;
    load().then((res) => {
      if (alive) setState({ ...res, loading: false });
    });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
