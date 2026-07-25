'use client';

/**
 * useCommandK — the ONE keybinding for the command palette.
 *
 * ⌘K / Ctrl-K always toggles (even from a text field — the universal palette
 * shortcut). `/` also opens it, but ONLY when the user is NOT typing in a field,
 * so a slash inside an input/textarea/contenteditable types a slash. Pass
 * `slash: false` to bind ⌘K alone.
 *
 * One hook, so every surface that hosts the palette (the marketing header and
 * the authenticated AppShell) shares identical behavior — no divergent inline
 * listeners.
 */
import { useEffect } from 'react';

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof HTMLElement === 'undefined' || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

export function useCommandK(onTrigger: () => void, opts?: { slash?: boolean }): void {
  const slash = opts?.slash !== false;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cmdK = (e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k';
      const slashKey =
        slash &&
        e.key === '/' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !isEditable(e.target);
      if (cmdK || slashKey) {
        e.preventDefault();
        onTrigger();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onTrigger, slash]);
}
