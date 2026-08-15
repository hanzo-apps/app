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
