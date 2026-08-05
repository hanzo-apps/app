/**
 * Emphasis survives nesting, or it is not emphasis.
 *
 * `@hanzo/gui` themes NEST, and a component that mounts its own scope re-bases
 * the theme's foreground inside it. Measured in the browser on /settings: at the
 * page scope `--color` is `hsl(0 0% 100%)`, but inside a `@hanzo/ui` Button's
 * own scope (and inside the sidebar's) it is `hsl(0 0% 80%)` — bit for bit the
 * value of `--color11`, the QUIET foreground.
 *
 * So a recipe that marks something as the loud thing by asking for `$color`
 * silently gets the quiet colour, and only in the places that nest. It has now
 * happened twice: `selected` painted the "you are here" row exactly like its
 * neighbours, and `accent` painted the primary action rgb(204,204,204) while the
 * `outline` button beside it — which resolves `$color12` inside the library —
 * painted rgb(255,255,255). The loudest control on the page read quieter than
 * the secondary next to it.
 *
 * `$color12` is full strength in EVERY scope, so this pins the rule rather than
 * the two call sites that have already been caught by it.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { accent, selected } from '@/lib/chrome';

describe('the chrome recipes that mean "emphasised"', () => {
  it('paint the foreground with $color12, never $color', () => {
    expect(accent.color).toBe('$color12');
    expect(selected(true).color).toBe('$color12');
  });

  it('keep the emphasis through hover, where the fill changes but the rank does not', () => {
    expect(accent.hoverStyle.color).toBe('$color12');
  });

  it('leave $color11 to the recipes that mean quiet', () => {
    expect(selected(false).color).toBe('$color11');
  });
});

/**
 * The recipe being right is only half of it — the LABEL has to survive too.
 *
 * `accent.color` styles the Button. A Text component nested inside resolves its
 * own colour from the scope that Button just mounted, where `--color` is
 * re-based to 80%, so the words come out `$color11` on top of a correct
 * `$color5` fill: the quiet foreground on the loudest control. Measured on four
 * shapes in the browser:
 *
 *   <SizableText fontSize="$1" color="$color">   rgb(204,204,204)  7.87:1
 *   <SizableText fontSize="$1" color="$color12"> rgb(255,255,255) 12.63:1
 *   <SizableText>            (names no colour)   rgb(204,204,204)  7.87:1
 *   plain text child                             rgb(255,255,255) 12.63:1
 *
 * Two things fall out, and both are load-bearing. Naming NO colour is just as
 * broken as naming the wrong one, so the rule cannot be "don't write `$color`"
 * — it has to be "say `$color12`". And `fontSize` on the Button does not reach
 * the label (`$1` still measured 13px), so a site that wants small type must
 * keep its wrapper rather than hoist the size; five toolbar controls do.
 *
 * BUTTON ONLY. This is a theme-scope effect, and a plain XStack does not mount
 * one: /auth/callback spreads `accent` onto an XStack whose label asks for
 * `$color` and measures rgb(255,255,255), correct. An earlier draft of this
 * scan flagged it, and "fixing" it would have been a change with no defect
 * under it. The scope of the ban is exactly the scope of the re-basing.
 */
const ROOT = join(__dirname, '..', '..');

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === 'node_modules' || name === '.next' || name === '.claude') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx$/.test(name)) out.push(full);
  }
  return out;
}

/** Every `<Button …>…</Button>` block that spreads `accent`, with its content. */
function accentButtons(src: string): string[] {
  const blocks: string[] = [];
  for (const part of src.split('<Button').slice(1)) {
    const end = part.indexOf('</Button>');
    const block = end === -1 ? part : part.slice(0, end);
    const open = block.indexOf('>');
    if (open !== -1 && /\{\.\.\.accent\}/.test(block.slice(0, open))) blocks.push(block);
  }
  return blocks;
}

describe('a label inside an accent Button', () => {
  const files = ['components', 'app'].flatMap((r) => walk(join(ROOT, r)));

  it('scans a non-trivial number of source files', () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it('says $color12, because anything else resolves to the quiet grey', () => {
    const offenders: string[] = [];
    for (const f of files) {
      for (const block of accentButtons(readFileSync(f, 'utf8'))) {
        for (const [tag] of block.matchAll(/<(?:SizableText|Paragraph|Text)\b[^>]*>/g)) {
          if (!/color="\$color12"/.test(tag)) {
            offenders.push(`${f.replace(ROOT + '/', '')}  ${tag.replace(/\s+/g, ' ').slice(0, 90)}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
