"use client";

import { useEffect, useState } from "react";
import type { VoiceMachine } from "@hanzo/voice";

/**
 * The seam between the mic and the conversation.
 *
 * They are different things: the mic is an input DEVICE, and it lives on the
 * console bar with the other workspace controls; the conversation belongs to
 * the composer, which owns the prompt, the submit path and the reply to read
 * back. So the composer offers its voice and the bar draws it, rather than the
 * bar owning a machine it cannot feed.
 *
 * One voice at a time — there is one composer.
 */
type Watcher = () => void;

let offered: VoiceMachine | null = null;
const watchers = new Set<Watcher>();

const tell = () => watchers.forEach((watch) => watch());

/** The composer offers its voice. Returns the withdraw. */
export function offer(voice: VoiceMachine): () => void {
  offered = voice;
  tell();
  return () => {
    if (offered === voice) {
      offered = null;
      tell();
    }
  };
}

/** The console bar takes it — null until a composer is mounted. */
export function useMic(): VoiceMachine | null {
  const [voice, setVoice] = useState<VoiceMachine | null>(offered);
  useEffect(() => {
    const watch = () => setVoice(offered);
    watchers.add(watch);
    watch();
    return () => {
      watchers.delete(watch);
    };
  }, []);
  return voice;
}
