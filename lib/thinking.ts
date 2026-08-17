"use client";

import { useEffect, useState } from "react";

// What the builder says while it waits for the model's first token.
//
// That wait is the one moment this surface has nothing true to report, and a
// whole-site build runs long enough that a single "Thinking…" held for twenty
// seconds reads as a hang. These narrate the same wait without claiming more.
//
// THEY CARRY NO INFORMATION, deliberately. Not one line names a step, a file or
// a phase. `ActivityItems` in the thread is where real work is named, one line
// per file, and a joke sitting next to a real status makes the real one
// untrustworthy — so the two registers stay apart: this speaks only before the
// first token, the log speaks only about work that happened.
export const THINKING = [
  "Summoning components…",
  "Negotiating with the box model…",
  "Arguing with flexbox…",
  "Untangling z-index…",
  "Naming things, which is the hard part…",
  "Choosing a shade of black…",
  "Aligning to the grid, politely…",
  "Consulting the design tokens…",
  "Sanding the corners…",
  "Tuning hairlines…",
  "Herding hooks…",
  "Warming the compiler…",
  "Chasing a stray semicolon…",
  "Measuring twice…",
  "Reticulating layouts…",
  "Persuading the cascade…",
  "Counting pixels, all of them…",
  "Teaching a div to behave…",
  "Auditioning fonts…",
  "Rehearsing the empty state…",
  "Deciding against a carousel…",
  "Budgeting the whitespace…",
  "Reading the prompt again…",
  "Drawing the rest of the owl…",
] as const;

/** How long one line holds the eye before the next replaces it. */
const HOLD = 2400;

/**
 * The line to show. Mounting IS the active state — the caller renders this only
 * while it is waiting, so there is nothing to pass in.
 *
 * It starts at the top of the list every time, and nothing here is random. A
 * random start has to be chosen on the client, after hydration, which means
 * writing state from inside the effect — one cascading render, and a first frame
 * showing a line that is immediately replaced. The list is long enough that a
 * wait rarely reaches the end of it, so a fixed first line costs nothing a
 * reader would notice and the hook stays a subscription to a clock.
 *
 * A reader who asked for less motion gets ONE line and no churn — the same
 * `prefers-reduced-motion` contract the mark's idle animation keeps.
 */
export function useThinking(): string {
  const [at, setAt] = useState(0);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setAt((n) => n + 1), HOLD);
    return () => clearInterval(id);
  }, []);

  return THINKING[at % THINKING.length];
}
