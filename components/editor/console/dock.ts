"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The console dock's ONE dimension: its height in pixels.
 *
 * Everything the bar can do — drag, click, arrow keys — is a way of setting
 * that single number. There is deliberately no `expanded` boolean: an open dock
 * IS a dock taller than its bar (`open = height > BAR`), so a dragged size and
 * a toggled state can never disagree.
 */

/** The bar alone — the dock collapsed. Also the drag handle's height. */
export const BAR = 28;
/** The smallest body worth showing: the dock is never draggable into nothing. */
export const MIN_BODY = 96;
export const MIN_OPEN = BAR + MIN_BODY;
/** Where a click opens to before any drag has been remembered. */
export const DEFAULT_OPEN = 260;
/** Arrow-key increment. */
export const STEP = 24;
/** Shove the dock below this and it closes instead of leaving a sliver. */
export const COLLAPSE_AT = MIN_OPEN - STEP;

/** One key, one blob — the dock's size rides along with the rest of the chrome. */
const KEY = "hanzo.console";

/** The dock never eats the workspace: at most 70% of the viewport. */
export const maxOpen = (viewport: number) =>
  Math.max(MIN_OPEN, Math.round(viewport * 0.7));

/** Clamp an OPEN height: never shorter than a readable body, never taller than the ceiling. */
export function clampHeight(raw: number, viewport: number): number {
  if (!Number.isFinite(raw)) return MIN_OPEN;
  return Math.min(Math.max(raw, MIN_OPEN), maxOpen(viewport));
}

/**
 * The one decision every gesture funnels through: a height at or below
 * `COLLAPSE_AT` means "close", anything else is an open height clamped into
 * range. Closing is therefore a deliberate shove, and an open dock is always
 * tall enough to read.
 */
export function resolveHeight(raw: number, viewport: number): number {
  return raw <= COLLAPSE_AT ? BAR : clampHeight(raw, viewport);
}

const viewport = () =>
  typeof window === "undefined" ? 1000 : window.innerHeight;

export interface Dock {
  height: number;
  open: boolean;
  /** Set an absolute height (a drag). Resolved; remembered if it leaves the dock open. */
  setHeight: (raw: number) => void;
  /** Open to the last height it was dragged to, or collapse back to the bar. */
  toggle: () => void;
  /** Arrow-key resize; opens from collapsed on the way up. */
  nudge: (delta: number) => void;
}

export function useDock(): Dock {
  const [height, set] = useState(BAR);
  // The last height the dock stood OPEN at — what a click restores. Not a
  // second source of truth: it is only ever READ while collapsed, and only
  // ever WRITTEN from the one height above.
  const restore = useRef(DEFAULT_OPEN);

  const setHeight = useCallback((raw: number) => {
    const next = resolveHeight(raw, viewport());
    if (next > BAR) restore.current = next;
    set(next);
  }, []);

  const toggle = useCallback(() => {
    set((h) => (h > BAR ? BAR : clampHeight(restore.current, viewport())));
  }, []);

  const nudge = useCallback(
    (delta: number) => {
      if (height > BAR) setHeight(height + delta);
      else if (delta > 0) setHeight(restore.current);
    },
    [height, setHeight],
  );

  // Restore the remembered size once mounted (never during render, so the
  // server and the first client paint agree).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<Record<"height" | "restore", unknown>>;
      if (typeof saved.restore === "number") {
        restore.current = clampHeight(saved.restore, viewport());
      }
      if (typeof saved.height === "number") {
        set(resolveHeight(saved.height, viewport()));
      }
    } catch {
      /* a dock that cannot remember still opens */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ height, restore: restore.current }),
      );
    } catch {
      /* storage unavailable */
    }
  }, [height]);

  // A shrinking window must not leave the dock taller than its own ceiling.
  useEffect(() => {
    const onResize = () => set((h) => (h > BAR ? clampHeight(h, viewport()) : h));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return { height, open: height > BAR, setHeight, toggle, nudge };
}
