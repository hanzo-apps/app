/**
 * The unified Resources catalog — templates AND games in ONE shape.
 *
 * This is the games→templates merge: the standalone Games surface is folded in
 * here as a `Games` CATEGORY rather than a top-level nav item. The Resources
 * gallery renders this merged list and filters by category, so games sit beside
 * the site templates under one "start from a template" grid.
 *
 * Two real sources, mapped to one `ResourceItem`:
 *   - Site templates: `lib/gallery-catalog` (live gallery.hanzo.ai, snapshot
 *     fallback) — carry real screenshots + a fork slug.
 *   - Games: `data/games-catalog` — license-verified OSS Unity/Unreal titles;
 *     no screenshot in the catalog, so they render as a schematic engine tile
 *     and open their existing `/games/:id` detail (play / fork / studio).
 *
 * Never fabricate a field: a template with no screenshot renders a fallback
 * tile; a game keeps its honest engine/genre/license metadata.
 */

import type { GalleryTemplate } from '@/lib/gallery-catalog';
import { gamesCatalog, type GameEntry } from '@/data/games-catalog';

/** The category name games are folded into within Resources. */
export const GAMES_CATEGORY = 'Games';

export interface ResourceItem {
  kind: 'template' | 'game';
  /** Stable id, unique across the merged catalog. */
  id: string;
  title: string;
  description: string;
  category: string;
  /** Template screenshot URL, or '' for games (rendered as a schematic tile). */
  image: string;
  hasImage: boolean;
  /** Template framework (e.g. "Next.js") or a game engine label (e.g. "Unity"). */
  framework: string;
  rating?: number;
  /** Template fork slug → /dev?template=hanzo-apps/<slug>. Present for templates. */
  templateSlug?: string;
  /** External live preview (templateUrl) for the template preview modal. */
  previewUrl?: string;
  /** In-app route for games → /games/:id. Present for games. */
  href?: string;
  /** Extra line for game tiles (genre · license). */
  meta?: string;
}

function templateToResource(t: GalleryTemplate): ResourceItem {
  return {
    kind: 'template',
    id: `tpl:${t.slug}`,
    title: t.displayName || t.name,
    description: t.description || t.useCase || `${t.framework} template`,
    category: t.category,
    image: t.screenshotUrl,
    hasImage: t.hasScreenshot,
    framework: t.framework,
    rating: t.rating,
    templateSlug: t.slug,
    previewUrl: t.templateUrl,
  };
}

const ENGINE_LABEL: Record<GameEntry['engine'], string> = {
  unity: 'Unity',
  unreal: 'Unreal',
};

function gameToResource(g: GameEntry): ResourceItem {
  return {
    kind: 'game',
    id: `game:${g.id}`,
    title: g.name,
    description: g.description,
    category: GAMES_CATEGORY,
    image: '',
    hasImage: false,
    framework: ENGINE_LABEL[g.engine],
    href: `/games/${g.id}`,
    meta: `${g.genre} · ${g.license}`,
  };
}

/** Merge templates + games into the unified Resources list (templates first). */
export function mergeResources(templates: GalleryTemplate[]): ResourceItem[] {
  return [...templates.map(templateToResource), ...gamesCatalog.map(gameToResource)];
}

/** Distinct categories in catalog order — "All" first, "Games" always present. */
export function resourceCategories(items: ResourceItem[]): string[] {
  const seen = new Set<string>();
  const cats: string[] = [];
  for (const it of items) {
    if (!seen.has(it.category)) {
      seen.add(it.category);
      cats.push(it.category);
    }
  }
  return ['All', ...cats];
}
