// The Hanzo template gallery catalog — real data.
//
// Single source of truth is gallery.hanzo.ai/templates.json (generated at build
// time from the gallery repo's templates-data.ts). This module fetches it
// server-side (no CORS) and falls back to a committed build-time snapshot so the
// app works offline / if the gallery is briefly unreachable.
//
// Consumers: /v1/gallery (same-origin proxy) -> the gallery page + the /dev
// onboarding "Popular templates". Never hardcode a fake template list again.

import snapshotJson from './gallery-snapshot.json';

export const GALLERY_ORIGIN = 'https://gallery.hanzo.ai';

export interface GalleryTemplate {
  id: number;
  name: string;
  displayName: string;
  slug: string;
  category: string;
  screenshot: string;
  framework: string;
  rating: number;
  features: string[];
  components?: string;
  useCase?: string;
  tier: number;
  description?: string;
  family?: string;
  // Enriched absolute URLs emitted by the gallery generator:
  screenshotUrl: string;
  hasScreenshot: boolean;
  templateUrl: string;
  repo: string; // github.com/hanzo-apps/<slug> — the fork source
}

export interface GalleryCatalog {
  version: number;
  origin: string;
  count: number;
  screenshots: number;
  generatedAt: string;
  templates: GalleryTemplate[];
}

const snapshot = snapshotJson as unknown as GalleryCatalog;

/** Bundled, always-available catalog (build-time snapshot of the live gallery). */
export function snapshotCatalog(): GalleryCatalog {
  return snapshot;
}

/**
 * Server-side: fetch the live catalog from gallery.hanzo.ai, falling back to the
 * bundled snapshot. Revalidates hourly. Never throws.
 */
export async function getCatalog(): Promise<GalleryCatalog & { source: 'live' | 'snapshot' }> {
  try {
    const res = await fetch(`${GALLERY_ORIGIN}/templates.json`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`gallery ${res.status}`);
    const data = (await res.json()) as GalleryCatalog;
    if (!Array.isArray(data.templates) || data.templates.length === 0) {
      throw new Error('gallery returned empty catalog');
    }
    return { ...data, source: 'live' };
  } catch {
    return { ...snapshot, source: 'snapshot' };
  }
}

/** Distinct categories in catalog order, "All" first. */
export function catalogCategories(templates: GalleryTemplate[]): string[] {
  const seen = new Set<string>();
  const cats: string[] = [];
  for (const t of templates) {
    if (!seen.has(t.category)) {
      seen.add(t.category);
      cats.push(t.category);
    }
  }
  return ['All', ...cats];
}

/**
 * "Popular" picks for the onboarding hero: highest-rated templates that have a
 * real screenshot, one per category for variety, capped at `count`.
 */
export function popularTemplates(templates: GalleryTemplate[], count = 6): GalleryTemplate[] {
  const withShots = templates.filter((t) => t.hasScreenshot);
  const byRating = [...withShots].sort((a, b) => b.rating - a.rating || a.tier - b.tier);
  const picked: GalleryTemplate[] = [];
  const usedCategory = new Set<string>();
  for (const t of byRating) {
    if (usedCategory.has(t.category)) continue;
    usedCategory.add(t.category);
    picked.push(t);
    if (picked.length >= count) break;
  }
  // Backfill if fewer categories than `count`.
  if (picked.length < count) {
    for (const t of byRating) {
      if (picked.includes(t)) continue;
      picked.push(t);
      if (picked.length >= count) break;
    }
  }
  return picked;
}
