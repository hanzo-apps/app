// Measures the dominant colour of every template shot and writes lib/template-hues.json.
//
//   node scripts/template-hues.mjs
//
// Run it after adding or replacing a file in public/templates. The output is
// committed, so the gallery orders itself from a constant and never decodes an
// image at request time.
//
// ── The measurement ─────────────────────────────────────────────────────────
// Hue is an ANGLE, so it has no arithmetic mean: red at 350° and red at 10°
// average to cyan. The circular mean is the argument of the summed unit vectors,
// and weighting each by its pixel's chroma is what makes it a measure of the
// picture rather than of its noise — a flat grey pixel has an arbitrary hue and
// must not get a vote.
//
//   R = Σ chroma · e^(i·hue)          hue = arg R      sat = |R| / pixels
//
// Both numbers fall out of the same sum, which is the reason to write it this
// way: |R|/n is not a second, ad-hoc "colourfulness" metric bolted on next to
// the angle, it is that same vector's length. It reads as "how strongly does ONE
// hue dominate", and it is small in the two different ways an image can fail to
// have a dominant colour — - little chroma anywhere (a grey dashboard), or plenty
// of chroma pointing every direction, which cancels (folio-grid-4-fluid measures
// 0.056 mean chroma and 0.0004 here, and it is indeed a page with no one colour).
// A separate mean-chroma threshold would have called that one a strong pink.
//
// Pixels are sampled from a 64px-fit downsample: box-filtering to that size is
// itself an average over the picture, and it makes the pass ~1000x cheaper
// without moving any hue by a degree that survives rounding.
import { createRequire } from "node:module";
import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// sharp is a transitive dependency (next/image), so it is present but not
// hoisted under pnpm. Resolve it the normal way first and fall through to the
// store only if that fails.
let sharp;
try {
  sharp = require("sharp");
} catch {
  const store = path.join(root, "node_modules/.pnpm");
  const dir = readdirSync(store).find((d) => /^sharp@/.test(d));
  if (!dir) throw new Error("sharp not installed — run pnpm install");
  sharp = require(path.join(store, dir, "node_modules/sharp"));
}

const SHOTS = path.join(root, "public/templates");
const OUT = path.join(root, "lib/template-hues.json");

/** Chroma-weighted circular mean of one image: `{ hue: 0–360, sat: 0–1 }`. */
async function measure(file) {
  const { data, info } = await sharp(file)
    .resize(64, 64, { fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let x = 0;
  let y = 0;
  let pixels = 0;

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const max = Math.max(r, g, b);
    const chroma = max - Math.min(r, g, b);
    pixels++;
    if (chroma === 0) continue; // grey: no angle to contribute

    // Sextant of the hue hexagon, in turns of 60°.
    let hue;
    if (max === r) hue = (g - b) / chroma;
    else if (max === g) hue = (b - r) / chroma + 2;
    else hue = (r - g) / chroma + 4;
    hue *= Math.PI / 3;

    x += chroma * Math.cos(hue);
    y += chroma * Math.sin(hue);
  }

  return {
    hue: Math.round((((Math.atan2(y, x) * 180) / Math.PI) % 360 + 360) % 360),
    sat: Number((Math.hypot(x, y) / pixels).toFixed(4)),
  };
}

const files = readdirSync(SHOTS)
  .filter((f) => f.endsWith(".webp"))
  .sort(); // sorted in, sorted out — the file is a diffable constant

const hues = {};
for (const file of files) {
  hues[file.replace(/\.webp$/, "")] = await measure(path.join(SHOTS, file));
}

writeFileSync(OUT, `${JSON.stringify(hues, null, 2)}\n`);
console.log(`${files.length} shots → ${path.relative(root, OUT)}`);
