/**
 * lib/reference-images — pure list management for a project's reference-image
 * history (the "past images" the ask-ai bar's picker offers). No I/O here: the
 * ask-ai bar owns the localStorage read / write; this module owns the ONE
 * dedupe / order / cap rule so the behaviour is testable in isolation.
 *
 * Ordering: most-recently-added first. Re-adding an existing URL moves it to the
 * front (a fresh use is fresh recency). The persisted history is capped so a
 * busy project can't grow it without bound.
 */

// How many reference images a project keeps in its persisted history.
export const REFERENCE_IMAGES_CAP = 24;

// Per-project localStorage key, namespaced like the ask-ai settings keys so one
// project's reference history never collides with another's.
export const referenceImagesKey = (spaceId?: string | null): string =>
  `hanzo:reference-images:${spaceId ?? "unsaved"}`;

// Drop empties / non-strings and keep the first occurrence of each URL.
const dedupe = (list: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of list) {
    if (typeof u !== "string" || u.length === 0 || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
};

// Add URL(s) to the front of the history — newest first, de-duplicated, capped.
// A re-added URL rises to the front (recency). Writer for the persisted list.
export const addReferenceImages = (
  list: string[],
  urls: string[],
  cap: number = REFERENCE_IMAGES_CAP
): string[] => dedupe([...urls, ...list]).slice(0, cap);

// Order-preserving union (a first), de-duplicated. Seeds the in-session library
// from server images ∪ persisted history and attaches picks without duplicates.
// Uncapped on purpose: a project may hold more images than the history cap.
export const mergeReferenceImages = (a: string[], b: string[]): string[] =>
  dedupe([...a, ...b]);

// Remove a URL from the history.
export const removeReferenceImage = (list: string[], url: string): string[] =>
  list.filter((u) => u !== url);
