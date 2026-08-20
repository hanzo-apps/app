/**
 * Reading source in a test: where a tag ends, and how to ignore prose.
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
 * TWO functions and not one, because the languages differ: `//` is a comment in
 * TS and not in CSS, and a stylesheet's `https://` must survive. Reaching for
 * the wrong one is the bug this file exists to make hard, so they are named for
 * what they read.
 */

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
 * The line strip spares a preceding colon, so a URL in code survives to be
 * caught rather than being read as a comment.
 *
 * The JSX spelling — a block comment inside braces — goes as a UNIT, before the
 * bare block rule can eat the middle and leave the braces behind. Three suites
 * wrote that rule and three did not, which is the argument for one function.
 */
export const stripComments = (src: string): string =>
  src
    // The inner content may not CROSS a comment close. Written `[\s\S]*?` the
    // brace is free to be an interface's or a block's, and the match runs on to
    // whatever later comment happens to sit before a `}` — measured, it ate the
    // whole body of `UsageLimitApi` and the rule that reads it went quiet.
    .replace(/\{\s*\/\*(?:(?!\*\/)[\s\S])*\*\/\s*\}/g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/\/\*[\s\S]*?\*\//g, '');

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
