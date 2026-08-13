import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

/**
 * `$sm` / `$md` / `$lg` are MIN-width — "at this width AND UP".
 *
 * So a value meant only for phones is the BASE, and the media prop switches it
 * back for larger screens. Written the intuitive way round it does the exact
 * opposite of what it reads like, and nothing warns: the build is green, the
 * types are fine, and the page is simply wrong on the device nobody tests on.
 *
 * logo-wall.tsx said `height="$5" $md={{ height: 22 }}`, which reads as "small
 * on phones" and shipped 52px marks to a 390px screen — two logos on screen,
 * both clipped — while desktop, with all the room, got the 22px ones.
 *
 * The signature is mechanical: a size prop whose media override is SMALLER than
 * its base. That is only ever right if the author believed the query was
 * max-width. This test finds that shape and fails on it.
 */

/**
 * The SIZE scale only. `$5` is 52px — measured live off a logo mark, not read
 * off a chart.
 *
 * fontSize is deliberately absent, and that absence is the point: font tokens
 * are a DIFFERENT ladder from size tokens, so scoring `fontSize="$10"` against
 * this table invents a number. The first version of this test did exactly that
 * and produced 30 confident false positives — the same "gate measured the wrong
 * dimension" mistake it was written to catch, in the gate itself.
 */
const SIZE_TOKENS: Record<string, number> = {
  $1: 4, $2: 8, $3: 16, $4: 16, $5: 52, $6: 64, $7: 74, $8: 84, $9: 94,
  $10: 104, $11: 80, $12: 96,
};

/**
 * Comparable only LIKE FOR LIKE. Two raw numbers are both px. Two tokens on the
 * size scale are both px. A token against a raw number is comparable only for
 * size props, where the table above applies — and never for fontSize, where no
 * table here is valid.
 */
function px(v: string, prop: string): number | null {
  const t = v.trim();
  if (/^\d+(\.\d+)?$/.test(t)) return parseFloat(t);
  if (prop === "fontSize") return null;
  if (SIZE_TOKENS[t] != null) return SIZE_TOKENS[t];
  return null; // percentages, "auto", expressions — not comparable
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.tsx$/.test(p) ? [p] : [];
  });
}

const ROOT = join(__dirname, "..", "..");
const FILES = [join(ROOT, "components"), join(ROOT, "app")].flatMap(walk);

/** Size props where "bigger" and "smaller" are meaningful and comparable. */
const SIZE_PROPS = ["height", "width", "fontSize", "minHeight", "minWidth"];

/**
 * Only IMAGES, and that narrowness is deliberate.
 *
 * A bigger value on phones is a MISTAKE for a picture — a 52px logo on a 390px
 * screen fits two marks and clips both. It is CORRECT for a tap target: a
 * finger wants 44px and a mouse does not, so `height="$7" $sm={{ height: 36 }}`
 * on a Button is the documented intent, not an inversion. SkillsManager has
 * three of those and they are right.
 *
 * A guard that flagged both would be wrong half the time, and a check that
 * cries wolf gets muted — which costs more than never having written it. So
 * this asserts the one case it can actually prove.
 */
const TAG = /<Image\b/;

describe("media queries are MIN-width, so a phone value is the base", () => {
  it("no size prop has a media override smaller than its base", () => {
    const offenders: string[] = [];

    for (const file of FILES) {
      const src = readFileSync(file, "utf8");
      // Strip comments so a documented example cannot trip its own rule.
      const code = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");

      for (const prop of SIZE_PROPS) {
        // base:  prop="$5"  or  prop={22}
        const baseRe = new RegExp(`\\b${prop}=(?:"([^"]+)"|\\{([^}]+)\\})`, "g");
        let m: RegExpExecArray | null;
        while ((m = baseRe.exec(code))) {
          const base = px(m[1] ?? m[2] ?? "", prop);
          if (base == null) continue;
          // Walk back to the opening tag: only pictures are judged here.
          const open = code.lastIndexOf("<", m.index);
          if (!TAG.test(code.slice(open, open + 12))) continue;
          // the nearest media override that follows, on the same element
          const rest = code.slice(m.index, m.index + 400);
          const medRe = new RegExp(
            `\\$(?:sm|md|lg|gtSm|gtMd)=\\{\\{[^}]*\\b${prop}:\\s*(?:"([^"]+)"|([\\d.]+))`,
          );
          const mm = medRe.exec(rest);
          if (!mm) continue;
          const wide = px(mm[1] ?? mm[2] ?? "", prop);
          if (wide == null) continue;
          if (wide < base) {
            offenders.push(
              `${file.replace(ROOT + "/", "")}: ${prop} base=${base}px but wider-screen override=${wide}px`,
            );
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
