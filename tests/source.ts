import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Reading source in a test: where the files are, where a tag ends, and how to
 * ignore prose.
 *
 * ONE home, because sixteen suites here had each written their own. `tagEnd` was
 * three copies; the comment strippers were thirteen, in FIVE behaviours —
 * block-first, line-first, line-start-only, JSX-braces-too, and blocks-only — so
 * a rule that held in one suite was evadable in another by writing the comment
 * differently.
 *
 * A prose example cannot be written literally here, and that is the joke this
 * file is entitled to: a block comment quoting a line-comment-then-star pattern
 * CLOSES ITSELF on the star-slash inside the quote. Writing this header is what
 * broke the typecheck once already.
 *
 * TWO strippers and not one, because the languages differ: `//` is a comment in
 * TS and not in CSS, and a stylesheet's `https://` must survive. Reaching for
 * the wrong one is the bug this file exists to make hard, so they are named for
 * what they read.
 */

/**
 * The repo root. Three spellings were in use across 41 suites — `process.cwd()`,
 * `join(__dirname, "..", "..")` and `join(__dirname, "../..")` — which happen to
 * agree only because jest is always launched from here. `process.cwd()` is the
 * shell's, not the repo's, so the moment anyone runs a suite from a subdirectory
 * a third of them read the wrong tree and find nothing to accuse.
 */
export const root = join(__dirname, '..');

/** A repo file, by its path from the root. Fifteen suites declared this. */
export const read = (rel: string): string => readFileSync(join(root, rel), 'utf8');

/**
 * Never walked into, whichever directory a caller starts from.
 *
 * `.next` is the one that matters: it holds GENERATED code, so a rule scanning
 * it accuses a file nobody wrote and a coverage count inflates with output. The
 * twelve hand-rolled walkers disagreed here — four skipped nothing at all, two
 * skipped only `node_modules` — and it was harmless only because every one of
 * them happened to start below the root. A shared skip list means the next
 * caller who starts AT the root is right by default rather than by luck.
 */
const SKIP = new Set(['node_modules', '.next', '.claude', '.git', 'dist', 'coverage']);

/**
 * Every source file under `dirs`, relative to the repo root.
 *
 * Twelve suites hand-rolled this recursive readdir. The shape they all wanted is
 * "the app's own files, by extension" — so that is the argument, and the
 * traversal is not the caller's business.
 */
export function sources(dirs: string[], ext = /\.tsx?$/): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return; // a root that does not exist is empty, not an error
    }
    for (const name of entries) {
      if (SKIP.has(name)) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (ext.test(name)) out.push(full);
    }
  };
  for (const d of dirs) walk(join(root, d));
  return out;
}

/** `sources` as paths relative to the root — what a failure message should print. */
export const rel = (f: string): string => f.replace(root + '/', '');

/**
 * Where a JSX opening tag ends: the index of its `>`, or -1.
 *
 * Three suites walked this by hand — `card-not-button`, `control-scale` and
 * `icon-button` — with the same brace and quote tracking and the same blind
 * spot. One walker, so a fix reaches all of them.
 *
 * Braces first, because that one is already recorded in the app's CLAUDE.md:
 * `onClick={() => run()}` contains a `>`, so taking the first `>` as the tag end
 * stops in the middle of the props. A scan written that way missed a third of
 * the icon buttons, including every one on the landing page.
 *
 * COMMENTS are the blind spot this adds, and it has teeth in both directions. A
 * block comment is legal between props, and this app writes long ones there —
 * `app/templates/page.tsx` has one containing the word "chips'". An apostrophe
 * in prose is not a string delimiter, but a walker that has not been told about
 * comments reads it as one, and every quote after it is inverted: a tag either
 * runs past its end, which accuses an innocent file, or stops short of it, which
 * silently misses a real offender. It hid for as long as the file happened to
 * hold a second apostrophe that put the count back — deleting an unrelated
 * `'none'` is what exposed it.
 */
/**
 * TS/TSX/JS with its comments removed.
 *
 * A rule is about what the code DOES, and the comment explaining a rule
 * necessarily QUOTES it — so a scanner that reads a file whole convicts every
 * file of its own explanation. `ui-centralization` did exactly that: its
 * all-caps rule fired on the sentence saying not to write all-caps.
 *
 * LINE comments first, and the order is not a preference. A `//` comment can
 * contain the characters that open a block — `components/landing/*` does — and
 * stripping blocks first opens one there that runs to the next close 2000
 * characters later, taking real code with it. That is a false POSITIVE, which
 * fails loudly; the inverse would pass silently. Two suites had it backwards.
 *
 * The line rule runs to end-of-line, not line-start-only, which two more suites
 * had: a rule a TRAILING comment can evade is a rule with a hole in it.
 *
 * A SCANNER AND NOT A REGEX, because the difference between a comment and a
 * string is not a pattern — it is where you are. `accept=".zip,text/*,.html"`
 * is an attribute value in `app/new/page.tsx`, and a regex reads its `/*` as a
 * comment opener: measured, the strip ran on to the next close and deleted a
 * thousand characters of real code, the field's own `onChange` among them. Ten
 * files here carry that shape. So every rule below asks the scanner where it
 * is, and inside a string the answer is "not in a comment".
 *
 * `//` after a colon is spared the same way and for a better reason than the
 * old special case: a URL's slashes sit inside a string literal, so the scanner
 * never reaches them.
 *
 * Whitespace is PRESERVED where a comment was, rather than closing the gap. A
 * scan that reports a line number is worthless if the line moved, and a rule
 * matching `foo\s+bar` must not start matching because prose between them
 * vanished. The characters go; the shape stays.
 */
export function stripComments(src: string): string {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    // A string literal, in any of its three spellings. Template literals can
    // hold `${…}` with code inside, and that code may hold a comment — but a
    // comment inside an interpolation is prose too, so consuming the whole
    // literal is the right answer as well as the simple one.
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      out += c;
      i += 1;
      while (i < src.length) {
        out += src[i];
        if (src[i] === '\\') {
          i += 2;
          if (i - 1 < src.length) out += src[i - 1];
          continue;
        }
        if (src[i] === quote) {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }
    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i += 1;
      continue; // the newline itself is kept by the next pass
    }
    if (c === '/' && src[i + 1] === '*') {
      const close = src.indexOf('*/', i + 2);
      const end = close < 0 ? src.length : close + 2;
      // Keep the newlines a block comment spanned, so every line below it
      // still reports the number it has in the file.
      for (let j = i; j < end; j += 1) if (src[j] === '\n') out += '\n';
      i = end;
      continue;
    }
    out += c;
    i += 1;
  }
  // `{}` left behind by a JSX comment is not code either — the braces were the
  // comment's own delimiters, and a rule counting braces should not see them.
  // The newlines between them stay, for the same reason the block rule keeps
  // its own: dropping them here silently shortened a 216-line file to 181 and
  // every line number a failure printed below that point was wrong.
  return out.replace(/\{(\s*)\}/g, (_m, gap: string) => gap.replace(/[^\n]/g, ''));
}

/**
 * A stylesheet with its comments removed.
 *
 * Blocks ONLY. `//` is not a CSS comment, and a sheet is full of `url(https://…)`
 * and `@import url(//…)` — running the TS stripper over CSS would delete from the
 * `//` to the end of the line, which is a declaration, not prose.
 */
export const stripCss = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

export function tagEnd(src: string, from: number): number {
  let depth = 0;
  let quote = '';
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === quote && src[i - 1] !== '\\') quote = '';
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const close = src.indexOf('*/', i + 2);
      if (close < 0) return -1;
      i = close + 1;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0) return i;
  }
  return -1;
}
