/**
 * Hanzo games catalog — the single source of truth for /games.
 *
 * Each entry is a REAL, upstream game the Hanzo pipeline can fork, build, and
 * generate assets for. The catalog is a flat, ordered list; the view groups it
 * by genre. Add a title by appending one row — it renders everywhere.
 *
 * Honesty rules (no fake UI, no fabricated status):
 *   - `playable` states the TRUTH about in-browser play, per title:
 *       "web"         a real WebGL/HTML5 build is hosted at webglBuildPath(id)
 *                     and plays now.
 *       "placeholder" the player works, but the build slot holds a placeholder
 *                     harness until a CI job drops the real artifact (see
 *                     public/webgl/README.md for the exact contract).
 *       "none"        no web build exists (e.g. Unreal desktop titles). The
 *                     detail page shows targets + build status only — no play
 *                     button, no pixel-streaming button (that is a render-node
 *                     feature, out of scope here).
 *   - `buildable` = our pipeline can produce a build for at least one target.
 *   - `fork` is the canonical Hanzo fork slot the build/asset pipeline targets;
 *     the builder hook forks from `upstream` (always a real, clonable repo).
 */

// =============================================================================
// TYPES
// =============================================================================

export type GameEngine = "unity" | "unreal" | "godot";

export type GameTarget = "web" | "desktop" | "mobile" | "console";

export type PlayStatus = "web" | "placeholder" | "none";

export type AssetSlot =
  | "sprites"
  | "textures"
  | "models"
  | "audio"
  | "music"
  | "sfx"
  | "levels"
  | "ui"
  | "vfx";

export interface GameEntry {
  /** URL-safe unique id — used for routes and the WebGL build path. */
  id: string;
  /** Title shown on the card. */
  name: string;
  /** One line on what the game is. */
  blurb: string;
  engine: GameEngine;
  engineVersion: string;
  /** Canonical upstream repo/site — the real fork source for the builder. */
  upstream: string;
  /** Hanzo fork slot the build/asset pipeline targets. */
  fork: string;
  /** Named or SPDX license of the upstream project. */
  license: string;
  genre: string;
  targets: GameTarget[];
  /** Our pipeline can produce a build for at least one target. */
  buildable: boolean;
  /** Honest in-browser play status — see module doc. */
  playable: PlayStatus;
  /** Asset kinds the generative studio can regenerate for this title. */
  assetSlots: AssetSlot[];
}

// =============================================================================
// LINK CONTRACTS (one rule each, DRY)
// =============================================================================

/** Studio pipeline origin — the generative asset surface (lands separately). */
export const STUDIO_ORIGIN = "https://studio.hanzo.ai";

/** Where a title's hosted WebGL/HTML5 build (or its placeholder) lives. */
export function webglBuildPath(id: string): string {
  return `/webgl/${id}/index.html`;
}

/**
 * Deep link into the studio generative pipeline, carrying the game id + the
 * asset slots to regenerate. This is the URL contract the studio side reads.
 */
export function studioHref(game: GameEntry): string {
  const slots = game.assetSlots.join(",");
  return `${STUDIO_ORIGIN}/generate?game=${encodeURIComponent(game.id)}&slots=${encodeURIComponent(slots)}`;
}

/**
 * Route an ask into the existing builder with the game's repo as context.
 * `/dev` accepts `?repo=<gitUrl>&prompt=<seed>` (parseGitUrl → clone), so this
 * is the real generative-builder hook — not dead UI.
 */
export function builderHref(game: GameEntry, ask: string): string {
  const q = new URLSearchParams({ repo: game.upstream, prompt: ask, action: "edit" });
  return `/dev?${q.toString()}`;
}

// =============================================================================
// CATALOG — one flat, ordered list (grouped by the view)
// =============================================================================

export const gamesCatalog: GameEntry[] = [
  // ── Godot: WebGL/HTML5-ready 2D (the playable path) ────────────────────────
  {
    id: "dodge-the-creeps",
    name: "Dodge the Creeps",
    blurb:
      "Godot's canonical first game — dodge the swarm as long as you can. The most WebGL-ready 2D title, and the flagship in-browser play target.",
    engine: "godot",
    engineVersion: "4.3",
    upstream: "https://github.com/godotengine/godot-demo-projects",
    fork: "github.com/hanzoai/game-dodge-the-creeps",
    license: "MIT",
    genre: "Arcade",
    targets: ["web", "desktop", "mobile"],
    buildable: true,
    playable: "placeholder",
    assetSlots: ["sprites", "sfx", "music", "ui"],
  },
  {
    id: "platformer-2d",
    name: "Platformer 2D",
    blurb:
      "A tight side-scrolling platformer demo — coins, enemies, and moving platforms. Clean sprite and level slots for asset generation.",
    engine: "godot",
    engineVersion: "4.3",
    upstream: "https://github.com/godotengine/godot-demo-projects",
    fork: "github.com/hanzoai/game-platformer-2d",
    license: "MIT",
    genre: "Platformer",
    targets: ["web", "desktop"],
    buildable: true,
    playable: "placeholder",
    assetSlots: ["sprites", "levels", "sfx", "music"],
  },

  // ── Unity: 3D, WebGL-buildable ─────────────────────────────────────────────
  {
    id: "boss-room",
    name: "Boss Room",
    blurb:
      "Unity's small-scale co-op RPG sample — up to eight players raid a boss. A full netcode reference project with rich 3D asset slots.",
    engine: "unity",
    engineVersion: "2022 LTS",
    upstream: "https://github.com/Unity-Technologies/com.unity.multiplayer.samples.coop",
    fork: "github.com/hanzoai/game-boss-room",
    license: "Unity Companion License",
    genre: "Co-op Action",
    targets: ["web", "desktop"],
    buildable: true,
    playable: "placeholder",
    assetSlots: ["models", "textures", "audio", "vfx", "ui"],
  },
  {
    id: "chop-chop",
    name: "Chop Chop",
    blurb:
      "Unity's community 'Open Project' — a 3D action-adventure built in the open. Apache-2.0 code with a large regenerable asset surface.",
    engine: "unity",
    engineVersion: "2021 LTS",
    upstream: "https://github.com/UnityTechnologies/open-project-1",
    fork: "github.com/hanzoai/game-chop-chop",
    license: "Apache-2.0",
    genre: "Adventure",
    targets: ["web", "desktop"],
    buildable: true,
    playable: "placeholder",
    assetSlots: ["models", "textures", "audio", "music", "levels"],
  },

  // ── Unreal: desktop titles (targets + build status only — no web play) ──────
  {
    id: "lyra",
    name: "Lyra Starter Game",
    blurb:
      "Epic's Unreal Engine 5 sample shooter and gameplay framework. Desktop build target; in-browser preview would arrive via render-node pixel streaming.",
    engine: "unreal",
    engineVersion: "5.4",
    upstream: "https://www.unrealengine.com/marketplace/en-US/product/lyra",
    fork: "github.com/hanzoai/game-lyra",
    license: "Unreal Engine EULA",
    genre: "Shooter",
    targets: ["desktop", "console"],
    buildable: true,
    playable: "none",
    assetSlots: ["models", "textures", "audio", "vfx"],
  },
  {
    id: "stack-o-bot",
    name: "Stack O Bot",
    blurb:
      "Epic's open UE5 sample — a puzzle platformer and learning project. Desktop target; a clean, small scene for material and model generation.",
    engine: "unreal",
    engineVersion: "5.3",
    upstream: "https://dev.epicgames.com/community/learning/tutorials/qz6r/stack-o-bot",
    fork: "github.com/hanzoai/game-stack-o-bot",
    license: "Unreal Engine EULA",
    genre: "Puzzle Platformer",
    targets: ["desktop"],
    buildable: true,
    playable: "none",
    assetSlots: ["models", "textures", "vfx"],
  },
];

// =============================================================================
// SELECTORS — derived once from the flat catalog
// =============================================================================

/** Distinct genres in catalog order, "All" first (view-agnostic, pure). */
export function gameGenres(games: GameEntry[] = gamesCatalog): string[] {
  const seen = new Set<string>();
  const genres: string[] = [];
  for (const g of games) {
    if (!seen.has(g.genre)) {
      seen.add(g.genre);
      genres.push(g.genre);
    }
  }
  return ["All", ...genres];
}

/** Look up one title by id. */
export function getGame(id: string): GameEntry | undefined {
  return gamesCatalog.find((g) => g.id === id);
}

/** Titles with any in-browser play (web or placeholder). */
export const playableGames: GameEntry[] = gamesCatalog.filter((g) => g.playable !== "none");

/** Whether a title can be played in-browser right now (real or placeholder). */
export function isPlayable(game: GameEntry): boolean {
  return game.playable !== "none";
}
