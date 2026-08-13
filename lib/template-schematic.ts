// A drawn picture of a template, for the slugs we have no captured shot of.
//
// `template-shots` answers whether a slug has a REAL screenshot. When it does
// not, something still has to fill the card, and the old answer was one grey
// gradient with a category icon on it — the same card 28 times over, which is
// what a visitor reads as "this one is broken".
//
// So a slug becomes two things here: a PALETTE (a hue carried through canvas,
// surface, ink and two accents) and a LAYOUT (a small arrangement of rectangles
// that reads as the kind of app the template is — a jobs list, an image
// mosaic, a dashboard). Both are pure functions of the slug, so a card is
// stable across SSR, reloads and machines, and two slugs have to collide in
// BOTH to look alike.
//
// Rectangles, not components: one vocabulary (`Cell`) that the renderer maps to
// boxes, so a new layout is a few lines of data rather than a new component.

/** The kinds of screen we can draw. One per shape of app, not one per slug. */
export type Kind =
  | "dashboard"
  | "grid"
  | "list"
  | "landing"
  | "shop"
  | "board"
  | "feed"
  | "profile"
  | "calendar";

/** Where a rectangle takes its colour from. */
export type Tone = "surface" | "line" | "ink" | "accent" | "accent2";

/** One rectangle of a drawn screen, in percent of the frame. `r` is px. */
export interface Cell {
  x: number;
  y: number;
  w: number;
  h: number;
  tone: Tone;
  r?: number;
}

export interface Palette {
  /** Degrees on the wheel: the page's tint, and separately what it accents in. */
  hue: number;
  pop: number;
  /** Pale page rather than dark one. A third of slugs, so the strip mixes. */
  light: boolean;
  canvas: string;
  surface: string;
  line: string;
  ink: string;
  accent: string;
  accent2: string;
  /** The bloom behind the layout, and where it sits (percent). */
  glow: string;
  glowX: number;
  glowY: number;
}

// FNV-1a — stable string → uint32, so the drawing is a pure function of the slug.
function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// TWO independent hues, and that is the whole distinctness argument.
//
// One draw is not enough. A hash spreads slugs uniformly, so over a population
// this size close pairs are not unlucky, they are expected — drawn from one hue
// the catalog produced `cipher-html` and `prism-html` 0.2° apart, both dark,
// both landing pages, which is the bug again with new colours. So the page's
// TINT and the accent it POPS in are hashed separately (different salt, not
// different bits of one hash), and two cards now have to collide on both.
// Each is read off 3600 buckets rather than 360, because colour is the first
// thing that separates two cards and 1-in-360 is not long odds. The shift drops
// FNV-1a's low bits, which for short inputs carry the last byte almost intact.
export function paletteOf(slug: string): Palette {
  const seed = seedOf(slug);
  const hue = ((seedOf(`tint:${slug}`) >>> 4) % 3600) / 10;
  const pop = ((seedOf(`pop:${slug}`) >>> 4) % 3600) / 10;
  // Analogous, never complementary: the partner accent has to sit beside the
  // primary in the same card without the two fighting.
  const partner = (pop + 26 + (seed % 46)) % 360;
  const light = seed % 3 === 0;
  return {
    hue,
    pop,
    light,
    canvas: light ? `hsl(${hue}, 46%, 92%)` : `hsl(${hue}, 34%, 7%)`,
    surface: light ? `hsl(${hue}, 70%, 100%)` : `hsl(${hue}, 24%, 15%)`,
    line: light ? `hsl(${hue}, 26%, 80%)` : `hsl(${hue}, 16%, 27%)`,
    ink: light ? `hsl(${hue}, 34%, 24%)` : `hsl(${hue}, 20%, 80%)`,
    accent: `hsl(${pop}, 82%, ${light ? 47 : 58}%)`,
    accent2: `hsl(${partner}, 76%, ${light ? 56 : 65}%)`,
    glow: `hsl(${partner}, 92%, 58%)`,
    glowX: 20 + ((seed >>> 3) % 70),
    glowY: 4 + ((seed >>> 11) % 34),
  };
}

// The slug names the template better than its shelf does — `jobfinder` is filed
// under Mobile App and `matrix` under Bento Cards, so the category alone would
// draw neither the jobs list nor the dashboard the reader opened the card for.
// First match wins, so the order here is the precedence.
const BY_SLUG: ReadonlyArray<readonly [RegExp, Kind]> = [
  [/job|hire|career|roster|helpdesk|team|standup|dispatch|signal/, "list"],
  [/mosaic|masonry|gallery|photo|pixel|shelf|grid|block|kinetic/, "grid"],
  [/matrix|dash|metric|analytic|insight|admin|stock|inventory|expense|spend|habit|streak|vault/, "dashboard"],
  [/shop|store|cart|drop|gear|mint|savor|bistro|oasis|hygge/, "shop"],
  [/kanban|sprint|retro|issue|lane|trailmap|upvote|feedback|forge/, "board"],
  [/blog|essay|letter|news|press|devlog|reading|longform|circle|loop|changelog/, "feed"],
  [/resume|curriculum|about|solo|epk|folio|artist|studio|unfixed/, "profile"],
  [/agenda|meetup|event|rally|book|slot|gather|setlist/, "calendar"],
  [/launch|saas|landing|waitlist|deploy|unity|construct|link|proposal/, "landing"],
];

const BY_CATEGORY: Readonly<Record<string, Kind>> = {
  "folio portfolio": "profile",
  portfolio: "profile",
  resume: "profile",
  "bento cards": "grid",
  "component library": "grid",
  saas: "landing",
  "ai/saas": "landing",
  landing: "landing",
  "landing page": "landing",
  business: "landing",
  websites: "landing",
  dashboard: "dashboard",
  "internal tools": "dashboard",
  "developer tools": "dashboard",
  fitness: "dashboard",
  "e-commerce": "shop",
  ecommerce: "shop",
  hospitality: "shop",
  "social media": "feed",
  blog: "feed",
  editorial: "feed",
  music: "feed",
  app: "board",
  apps: "board",
  "project management": "board",
  "product management": "board",
  "mobile app": "list",
  services: "list",
  events: "calendar",
};

const KINDS: readonly Kind[] = [
  "dashboard",
  "grid",
  "list",
  "landing",
  "shop",
  "board",
  "feed",
  "profile",
  "calendar",
];

/** The screen we draw for a slug — its name first, then its shelf, then its hash. */
export function kindOf(slug: string, category?: string): Kind {
  for (const [pattern, kind] of BY_SLUG) if (pattern.test(slug)) return kind;
  return BY_CATEGORY[(category || "").trim().toLowerCase()] ?? KINDS[seedOf(slug) % KINDS.length];
}

const many = <T,>(n: number, make: (i: number) => T): T[] =>
  Array.from({ length: n }, (_, i) => make(i));

// Each layout is one screen's worth of boxes over a 100×100 frame. The seed
// only ever moves things the eye reads as content — a bar's height, which tile
// is filled — never the structure, so a dashboard is always a dashboard.
const LAYOUT: Readonly<Record<Kind, (seed: number) => Cell[]>> = {
  dashboard: (seed) => {
    const bar = (i: number) => 9 + ((seed >>> (i * 3)) % 23);
    return [
      { x: 0, y: 0, w: 20, h: 100, tone: "surface" },
      ...many<Cell>(4, (i) => ({ x: 4, y: 15 + i * 12, w: 12, h: 3.5, tone: i === 0 ? "accent" : "line", r: 2 })),
      { x: 24, y: 8, w: 22, h: 4.5, tone: "ink", r: 2 },
      { x: 87, y: 6.5, w: 10, h: 6, tone: "accent", r: 9 },
      ...many<Cell>(3, (i) => ({ x: 24 + i * 25, y: 18, w: 21, h: 19, tone: "surface", r: 3 })),
      ...many<Cell>(3, (i) => ({ x: 27 + i * 25, y: 23, w: 11, h: 5, tone: i === 0 ? "accent" : "ink", r: 1 })),
      ...many<Cell>(3, (i) => ({ x: 27 + i * 25, y: 30, w: 14, h: 2.5, tone: "line", r: 1 })),
      { x: 24, y: 42, w: 46, h: 50, tone: "surface", r: 3 },
      ...many<Cell>(6, (i) => ({ x: 28 + i * 7, y: 85 - bar(i), w: 4.5, h: bar(i), tone: i % 2 ? "accent2" : "accent", r: 1 })),
      { x: 73, y: 42, w: 25, h: 50, tone: "surface", r: 3 },
      ...many<Cell>(4, (i) => ({ x: 76, y: 49 + i * 11, w: 5, h: 5, tone: i === 1 ? "accent2" : "line", r: 9 })),
      ...many<Cell>(4, (i) => ({ x: 83, y: 50.5 + i * 11, w: 12, h: 2.5, tone: "line", r: 1 })),
    ];
  },

  grid: (seed) => [
    { x: 6, y: 7, w: 21, h: 4.5, tone: "ink", r: 2 },
    { x: 78, y: 6, w: 16, h: 6, tone: "accent", r: 9 },
    ...many<Cell>(9, (i) => {
      const tones: Tone[] = ["accent", "accent2", "surface", "accent2", "surface", "accent"];
      return {
        x: 6 + (i % 3) * 30.5,
        y: 18 + Math.floor(i / 3) * 26,
        w: 28,
        h: (seed >>> i) % 3 === 0 ? 24 : 20,
        tone: tones[(i + seed) % tones.length],
        r: 3,
      };
    }),
  ],

  list: () => [
    { x: 6, y: 7, w: 60, h: 10, tone: "surface", r: 9 },
    { x: 10, y: 10.5, w: 24, h: 3, tone: "line", r: 1 },
    { x: 70, y: 7, w: 24, h: 10, tone: "accent", r: 9 },
    ...many<Cell>(4, (i) => ({ x: 6, y: 23 + i * 18.5, w: 88, h: 16, tone: "surface", r: 3 })),
    ...many<Cell>(4, (i) => ({ x: 9, y: 26 + i * 18.5, w: 9.5, h: 10, tone: i % 2 ? "accent2" : "accent", r: 2 })),
    ...many<Cell>(4, (i) => ({ x: 22, y: 27 + i * 18.5, w: 34, h: 3.5, tone: "ink", r: 1 })),
    ...many<Cell>(4, (i) => ({ x: 22, y: 33 + i * 18.5, w: 22, h: 2.5, tone: "line", r: 1 })),
    ...many<Cell>(4, (i) => ({ x: 76, y: 29 + i * 18.5, w: 15, h: 5.5, tone: i === 0 ? "accent" : "line", r: 9 })),
  ],

  landing: () => [
    { x: 6, y: 7, w: 12, h: 4.5, tone: "accent", r: 2 },
    ...many<Cell>(3, (i) => ({ x: 62 + i * 11, y: 8, w: 8, h: 2.5, tone: "line", r: 1 })),
    { x: 21, y: 24, w: 58, h: 7.5, tone: "ink", r: 2 },
    { x: 32, y: 36, w: 36, h: 7.5, tone: "ink", r: 2 },
    { x: 36, y: 48, w: 28, h: 3, tone: "line", r: 1 },
    { x: 38, y: 57, w: 24, h: 9, tone: "accent", r: 9 },
    ...many<Cell>(3, (i) => ({ x: 8 + i * 29.5, y: 73, w: 27, h: 21, tone: "surface", r: 3 })),
    ...many<Cell>(3, (i) => ({ x: 11 + i * 29.5, y: 78, w: 8, h: 5.5, tone: i === 1 ? "accent2" : "accent", r: 2 })),
    ...many<Cell>(3, (i) => ({ x: 11 + i * 29.5, y: 87, w: 18, h: 2.5, tone: "line", r: 1 })),
  ],

  shop: () => [
    { x: 6, y: 7, w: 15, h: 4.5, tone: "ink", r: 2 },
    { x: 84, y: 6, w: 10, h: 6, tone: "accent", r: 9 },
    ...many<Cell>(4, (i) => ({ x: 5 + i * 23.5, y: 19, w: 21, h: 43, tone: "surface", r: 3 })),
    ...many<Cell>(4, (i) => ({ x: 5 + i * 23.5, y: 19, w: 21, h: 28, tone: i % 2 ? "accent" : "accent2", r: 3 })),
    ...many<Cell>(4, (i) => ({ x: 8 + i * 23.5, y: 50, w: 13, h: 3, tone: "ink", r: 1 })),
    ...many<Cell>(4, (i) => ({ x: 8 + i * 23.5, y: 55.5, w: 7, h: 3, tone: "accent", r: 1 })),
    ...many<Cell>(4, (i) => ({ x: 5 + i * 23.5, y: 67, w: 21, h: 27, tone: "surface", r: 3 })),
    ...many<Cell>(4, (i) => ({ x: 5 + i * 23.5, y: 67, w: 21, h: 17, tone: i % 2 ? "accent2" : "accent", r: 3 })),
    ...many<Cell>(4, (i) => ({ x: 8 + i * 23.5, y: 87, w: 12, h: 3, tone: "ink", r: 1 })),
  ],

  board: (seed) => [
    { x: 6, y: 7, w: 17, h: 4.5, tone: "ink", r: 2 },
    { x: 86, y: 6, w: 8, h: 6, tone: "accent", r: 9 },
    ...many<Cell>(3, (i) => ({ x: 6 + i * 31, y: 17, w: 27, h: 77, tone: "surface", r: 3 })),
    ...many<Cell>(3, (i) => ({ x: 9 + i * 31, y: 21, w: 13, h: 3, tone: i === 0 ? "accent" : "line", r: 1 })),
    ...many<Cell>(9, (i) => ({
      x: 9 + (i % 3) * 31,
      y: 28 + Math.floor(i / 3) * 21,
      w: 21,
      h: 17,
      tone: (seed >>> i) % 4 === 0 ? "accent2" : "line",
      r: 2,
    })),
  ],

  feed: () => [
    { x: 6, y: 7, w: 19, h: 4.5, tone: "ink", r: 2 },
    { x: 6, y: 17, w: 88, h: 34, tone: "surface", r: 3 },
    { x: 6, y: 17, w: 34, h: 34, tone: "accent", r: 3 },
    { x: 45, y: 23, w: 40, h: 4.5, tone: "ink", r: 1 },
    { x: 45, y: 31, w: 46, h: 2.5, tone: "line", r: 1 },
    { x: 45, y: 36, w: 38, h: 2.5, tone: "line", r: 1 },
    { x: 45, y: 42.5, w: 14, h: 5.5, tone: "accent2", r: 9 },
    ...many<Cell>(2, (i) => ({ x: 6 + i * 45.5, y: 57, w: 42.5, h: 37, tone: "surface", r: 3 })),
    ...many<Cell>(2, (i) => ({ x: 6 + i * 45.5, y: 57, w: 42.5, h: 22, tone: i ? "accent2" : "accent", r: 3 })),
    ...many<Cell>(2, (i) => ({ x: 9 + i * 45.5, y: 83, w: 26, h: 3.5, tone: "ink", r: 1 })),
  ],

  profile: (seed) => [
    { x: 8, y: 13, w: 22, h: 35, tone: "accent", r: 99 },
    { x: 8, y: 55, w: 27, h: 6, tone: "ink", r: 2 },
    { x: 8, y: 65, w: 18, h: 3, tone: "line", r: 1 },
    { x: 8, y: 76, w: 17, h: 8, tone: "accent2", r: 9 },
    ...many<Cell>(4, (i) => ({
      x: 42 + (i % 2) * 28,
      y: 13 + Math.floor(i / 2) * 42,
      w: 26,
      h: 38,
      tone: (i + seed) % 3 === 0 ? "accent2" : "surface",
      r: 3,
    })),
  ],

  calendar: (seed) => [
    { x: 6, y: 6, w: 21, h: 4.5, tone: "ink", r: 2 },
    { x: 82, y: 5, w: 12, h: 6, tone: "accent", r: 9 },
    ...many<Cell>(7, (i) => ({ x: 6 + i * 12.9, y: 16, w: 11, h: 2.5, tone: "line", r: 1 })),
    ...many<Cell>(28, (i) => ({
      x: 6 + (i % 7) * 12.9,
      y: 23 + Math.floor(i / 7) * 18,
      w: 11,
      h: 15,
      tone: (seed >>> (i % 24)) % 5 === 0 ? (i % 2 ? "accent" : "accent2") : "surface",
      r: 2,
    })),
  ],
};

/** The rectangles of one drawn screen. */
export function cellsOf(kind: Kind, slug: string): Cell[] {
  return LAYOUT[kind](seedOf(slug));
}
