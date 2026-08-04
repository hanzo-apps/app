/**
 * Branding guidelines derived from reference images — and the editing of them.
 *
 * This is the `brand` half of the two modes (mode.ts). The images are looked at,
 * never shipped: what comes out is words and hex codes a person can read, argue
 * with, and delete.
 *
 * EVERY DERIVED THING IS REMOVABLE, and that is the whole design. A model looking
 * at twenty photos will confidently name a concept that is not the project — the
 * one grey wall it read as "brutalist", the stock model's jacket it read as
 * "streetwear". Guidelines that cannot be edited are guidelines someone has to
 * work around, so `colors`, `themes` and `concepts` are three flat lists and
 * `drop()` removes any entry from any of them by value.
 *
 * WHERE EACH ONE CAME FROM is kept (`from`: the asset ids that produced it), for
 * two reasons: the gallery can show why a concept is there, and removing an image
 * can take its unsupported concepts with it (`forget`). A guideline whose evidence
 * has been deleted is a claim nobody can check.
 */
import type { Mode } from "./mode";

/** A colour, as a model reported it. `hex` is normalized lowercase #rrggbb. */
export type Color = { hex: string; name?: string; from: string[] };

/** A theme or concept: one short phrase, and the assets that suggested it. */
export type Tag = { text: string; from: string[] };

export type Brand = {
  colors: Color[];
  themes: Tag[];
  concepts: Tag[];
  /** ISO time the guidelines were last derived or edited. */
  updated: string;
};

export const empty = (): Brand => ({ colors: [], themes: [], concepts: [], updated: "" });

/** The three editable lists, named once so callers cannot invent a fourth. */
export const FIELDS = ["colors", "themes", "concepts"] as const;
export type Field = (typeof FIELDS)[number];

export const isField = (v: unknown): v is Field =>
  typeof v === "string" && (FIELDS as readonly string[]).includes(v);

const HEX = /^#?([0-9a-f]{6})$/i;

/** Normalize a colour a model wrote as "#FFF000", "fff000" or " #FfF000 ". */
export const hex = (raw: string): string | null => {
  const m = HEX.exec((raw ?? "").trim());
  return m ? `#${m[1].toLowerCase()}` : null;
};

const phrase = (raw: string): string =>
  (raw ?? "").trim().toLowerCase().replace(/\s+/g, " ").slice(0, 40);

/**
 * Fold one model reading into the guidelines.
 *
 * Merging by VALUE is what makes twenty images produce one palette rather than
 * twenty: the same hex from six photos is one colour that six assets vouch for,
 * and the count of vouchers is exactly what makes it a brand colour rather than
 * an accident of one picture.
 */
export function fold(brand: Brand, assetId: string, read: {
  colors?: { hex: string; name?: string }[];
  themes?: string[];
  concepts?: string[];
}): Brand {
  const out: Brand = {
    colors: brand.colors.map((c) => ({ ...c, from: [...c.from] })),
    themes: brand.themes.map((t) => ({ ...t, from: [...t.from] })),
    concepts: brand.concepts.map((t) => ({ ...t, from: [...t.from] })),
    updated: new Date().toISOString(),
  };

  for (const c of read.colors ?? []) {
    const h = hex(c.hex);
    if (!h) continue;
    const found = out.colors.find((x) => x.hex === h);
    if (found) {
      if (!found.from.includes(assetId)) found.from.push(assetId);
      if (!found.name && c.name) found.name = c.name;
    } else {
      out.colors.push({ hex: h, ...(c.name ? { name: c.name } : {}), from: [assetId] });
    }
  }

  for (const [key, list] of [["themes", read.themes], ["concepts", read.concepts]] as const) {
    for (const raw of list ?? []) {
      const text = phrase(raw);
      if (!text) continue;
      const bucket = out[key];
      const found = bucket.find((x) => x.text === text);
      if (found) {
        if (!found.from.includes(assetId)) found.from.push(assetId);
      } else {
        bucket.push({ text, from: [assetId] });
      }
    }
  }

  return out;
}

/**
 * Remove one entry a person disagreed with.
 *
 * By VALUE, not index: the gallery renders a sorted view and an index would
 * delete whatever happened to sit in that slot after the last edit.
 */
export function drop(brand: Brand, field: Field, value: string): Brand {
  const v = field === "colors" ? hex(value) ?? value.toLowerCase() : phrase(value);
  const keep = <T extends { hex?: string; text?: string }>(xs: T[]) =>
    xs.filter((x) => (field === "colors" ? x.hex !== v : x.text !== v));
  return {
    ...brand,
    colors: field === "colors" ? keep(brand.colors) : brand.colors,
    themes: field === "themes" ? keep(brand.themes) : brand.themes,
    concepts: field === "concepts" ? keep(brand.concepts) : brand.concepts,
    updated: new Date().toISOString(),
  };
}

/**
 * Drop an asset's contribution, and with it anything only that asset vouched for.
 *
 * Deleting a reference image must not leave the concept it alone produced still
 * asserted — that is a guideline with no evidence, and the person who removed the
 * image would have no way to find it. An entry other assets still support stays,
 * minus this voucher.
 */
export function forget(brand: Brand, assetId: string): Brand {
  const prune = <T extends { from: string[] }>(xs: T[]): T[] =>
    xs
      .map((x) => ({ ...x, from: x.from.filter((id) => id !== assetId) }))
      .filter((x) => x.from.length > 0);
  return {
    colors: prune(brand.colors),
    themes: prune(brand.themes),
    concepts: prune(brand.concepts),
    updated: new Date().toISOString(),
  };
}

/** The prompt one image is read with. Asks for exactly the three lists. */
export const READ_PROMPT =
  "Look at this image as design reference for a brand. Reply with JSON only: " +
  '{"colors":[{"hex":"#rrggbb","name":"short name"}],"themes":["..."],"concepts":["..."]}. ' +
  "At most 5 colors, 4 themes, 4 concepts. Themes are moods or aesthetics " +
  "(e.g. 'warm minimal', 'coastal'). Concepts are subjects or motifs " +
  "(e.g. 'linen texture', 'arched windows'). No prose.";

/** Parse a model reply into a reading, tolerating fences and stray prose. */
export function read(raw: string): { colors: { hex: string; name?: string }[]; themes: string[]; concepts: string[] } {
  const text = (raw ?? "").replace(/```[a-z]*\n?/gi, "").replace(/```/g, "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return { colors: [], themes: [], concepts: [] };
  try {
    const j = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    const strs = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
    const cols = Array.isArray(j.colors)
      ? j.colors.flatMap((c) => {
          const o = c as { hex?: unknown; name?: unknown };
          return typeof o?.hex === "string"
            ? [{ hex: o.hex, ...(typeof o.name === "string" ? { name: o.name } : {}) }]
            : [];
        })
      : [];
    return { colors: cols, themes: strs(j.themes), concepts: strs(j.concepts) };
  } catch {
    return { colors: [], themes: [], concepts: [] };
  }
}

/** Guard: only `brand` assets are ever read. Mirrors policy(mode).analyzes. */
export const analyzable = (mode: Mode): boolean => mode === "brand";
