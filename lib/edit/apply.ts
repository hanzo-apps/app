/**
 * Apply one SEARCH/REPLACE block to a page.
 *
 * The builder's follow-up format asks the model to quote the text it wants
 * changed. Matching that quote was `pageHtml.indexOf(searchBlock)` — an EXACT
 * byte comparison, including the newlines the `<<<<<<< SEARCH` / `=======`
 * delimiters leave attached to the block. A model that re-indents by one space,
 * collapses a line break, or reflows an attribute produces a quote that is
 * correct to a reader and unequal to a computer, and the edit was then skipped
 * IN SILENCE — the user asked for a change, the page came back identical, and
 * the only explanation was "the edit didn't match this page".
 *
 * So matching degrades, in a fixed order, and each step is strictly more
 * forgiving than the last:
 *
 *   1. EXACT — the quote appears verbatim. Nothing to decide.
 *   2. TRIMMED — the same, ignoring the delimiters' own leading/trailing
 *      newlines. This is the common case: the model quoted the right text and
 *      the format added whitespace around it.
 *   3. WHITESPACE-INSENSITIVE — every run of whitespace in the quote may match
 *      any run of whitespace in the page. This is what absorbs re-indentation.
 *
 * Step 3 is where a fuzzy matcher normally becomes dangerous, so it carries the
 * rule that keeps it safe: it applies ONLY when the relaxed pattern matches
 * EXACTLY ONCE in the document. Two candidate sites means the model's quote does
 * not identify a unique place, and guessing between them would silently edit the
 * wrong part of someone's page — strictly worse than not editing at all. That
 * case is reported as ambiguous, not applied.
 *
 * Nothing here ever falls back to "replace something close enough": a match is a
 * span the page really contains, and the replacement takes exactly that span.
 */

/** Where an edit landed, or why it could not. */
export type EditResult =
  | { ok: true; html: string; how: "exact" | "trimmed" | "whitespace"; index: number }
  | { ok: false; why: "not-found" | "ambiguous" };

/**
 * Collapse `s` for comparison, and record where each surviving character came
 * from so a match can be mapped back to a span of the ORIGINAL text.
 *
 * Two rules, both about markup rather than prose:
 *   - a run of whitespace becomes one space, so re-indentation stops mattering;
 *   - a run ADJACENT to a tag delimiter (`>` before it, `<` after it) is dropped
 *     entirely, because `>Turn` and `>\n  Turn` are the same markup and the
 *     first would otherwise never match a quote written as the second.
 *
 * Whitespace BETWEEN words is preserved as a single space — dropping it there
 * would let "Turn any" match "Turnany", which is a different document.
 */
function normalize(s: string): { text: string; map: number[] } {
  const out: string[] = [];
  const map: number[] = [];
  let i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) {
      let j = i;
      while (j < s.length && /\s/.test(s[j])) j++;
      const prev = out.length ? out[out.length - 1] : "";
      const next = s[j] ?? "";
      const atEdge = prev === "" || prev === ">" || next === "<" || next === "";
      if (!atEdge) {
        out.push(" ");
        map.push(i);
      }
      i = j;
      continue;
    }
    out.push(s[i]);
    map.push(i);
    i++;
  }
  return { text: out.join(""), map };
}

/** Replace the span [start,end) of `html` with `replacement`. */
const splice = (html: string, start: number, end: number, replacement: string) =>
  html.slice(0, start) + replacement + html.slice(end);

/**
 * Apply `search` → `replace` to `html`.
 *
 * An empty `search` is a PREPEND, which is the format's own convention for
 * "add this at the top" and is left to the caller — this function refuses it
 * rather than guessing, so the caller's intent stays explicit.
 */
export function applyEdit(html: string, search: string, replace: string): EditResult {
  if (search.trim() === "") return { ok: false, why: "not-found" };

  // 1. Exact.
  const exact = html.indexOf(search);
  if (exact !== -1) {
    return { ok: true, html: splice(html, exact, exact + search.length, replace), how: "exact", index: exact };
  }

  // 2. Trimmed — the delimiters' own whitespace is not part of the quote.
  const needle = search.trim();
  const trimmed = html.indexOf(needle);
  if (trimmed !== -1) {
    return {
      ok: true,
      html: splice(html, trimmed, trimmed + needle.length, replace.trim()),
      how: "trimmed",
      index: trimmed,
    };
  }

  // 3. Whitespace-insensitive, and ONLY when it names one place.
  const page = normalize(html);
  const want = normalize(needle).text;
  if (want === "") return { ok: false, why: "not-found" };

  const found: number[] = [];
  for (let at = page.text.indexOf(want); at !== -1; at = page.text.indexOf(want, at + 1)) {
    found.push(at);
    if (found.length > 1) break; // two is already ambiguous; no need to count the rest
  }
  if (found.length !== 1) return { ok: false, why: found.length ? "ambiguous" : "not-found" };

  // Map the normalized span back onto the original text.
  const at = found[0];
  const start = page.map[at];
  const end = page.map[at + want.length - 1] + 1;
  return {
    ok: true,
    html: splice(html, start, end, replace.trim()),
    how: "whitespace",
    index: start,
  };
}
