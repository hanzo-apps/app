/**
 * Where in the SOURCE is the thing I just clicked?
 *
 * The preview is a rendered document; the editor holds source. Clicking an
 * element gives you a DOM node, and the question every visual edit asks next is
 * which file and which line wrote it. This answers that.
 *
 * It is a pure function over (what the click reported, the project's pages) so
 * it can be tested without a browser, an iframe or Monaco — the previous answer
 * lived inside a component's useCallback, reachable only by rendering the
 * builder, which is why nothing verified it.
 *
 * TWO THINGS IT FIXES, both of which made it answer confidently and wrongly:
 *
 *   - It searched ONE buffer and labelled the result "index.html", a literal.
 *     Projects here are `Page[]` with real paths, so on any multi-page project
 *     the line number came from whichever file happened to be open and the file
 *     name was a guess. A wrong file with a plausible line is worse than no
 *     answer: it sends an agent to edit the wrong document.
 *   - It matched `element.html.substring(0, 100)` as a regex against the source.
 *     `outerHTML` is the BROWSER'S serialization — attributes reordered into
 *     insertion order, values re-quoted to double, `<br>` closed, entities
 *     resolved, whitespace inside the tag collapsed. Source rarely matches it
 *     byte for byte, so the match usually missed and, when it hit, hit by luck.
 *
 * The strategy is an anchor ladder, most distinctive first. Each rung is a
 * property that SURVIVES serialization, and each returns the first match only
 * when that match is unambiguous — an anchor appearing twice is not a location,
 * so it falls through rather than picking one.
 */

export interface Anchor {
  /** The element's own id, when it has one. The strongest anchor there is. */
  id?: string;
  /** Space-separated classes as the DOM reports them. */
  className?: string;
  tagName: string;
  /** The browser's serialization. Used only for its ATTRIBUTES, never matched whole. */
  html?: string;
  /** Visible text, trimmed. Weakest anchor; only used when it is long enough to be rare. */
  text?: string;
}

export interface SourcePage {
  path: string;
  html: string;
}

export interface SourceLocation {
  file: string;
  line: number;
  column: number;
  /** Which rung of the ladder answered — surfaced so a caller can say how sure it is. */
  via: "id" | "attribute" | "class" | "text";
}

/** Line and 1-based column of an absolute offset. */
function positionAt(text: string, offset: number): { line: number; column: number } {
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < offset; i++) {
    if (text.charCodeAt(i) === 10) {
      line++;
      lineStart = i + 1;
    }
  }
  return { line, column: offset - lineStart + 1 };
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Every offset where `re` matches, capped — we only ever need to know "one or
 * more than one", and an unbounded scan over a large file buys nothing.
 */
function offsets(text: string, re: RegExp, cap = 2): number[] {
  const out: number[] = [];
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  let m: RegExpExecArray | null;
  while ((m = g.exec(text)) !== null) {
    out.push(m.index);
    if (out.length >= cap) break;
    if (m.index === g.lastIndex) g.lastIndex++;
  }
  return out;
}

/**
 * An attribute written EITHER way round: source may quote with ' or ", and the
 * browser always reports ". Matching both is the difference between finding a
 * hand-written `class='x'` and missing it.
 */
function attrPattern(name: string, value: string): RegExp {
  return new RegExp(`${escape(name)}\\s*=\\s*["']${escape(value)}["']`);
}

/** Attributes worth anchoring on, in descending distinctiveness. */
const ANCHOR_ATTRS = ["data-testid", "data-id", "name", "href", "src", "alt", "aria-label"];

function attrsOf(html: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push([m[1], m[2]]);
  return out;
}

/**
 * Locate an element in the project's source.
 *
 * Returns undefined when no anchor is unique — deliberately. A caller that gets
 * undefined can say "select something more specific"; one handed a guess edits
 * the wrong line and reports success.
 */
export function locate(anchor: Anchor, pages: SourcePage[]): SourceLocation | undefined {
  if (!pages.length) return undefined;

  const search = (re: RegExp, via: SourceLocation["via"]): SourceLocation | undefined => {
    const hits: Array<{ page: SourcePage; at: number }> = [];
    for (const page of pages) {
      for (const at of offsets(page.html, re)) {
        hits.push({ page, at });
        if (hits.length > 1) return undefined; // ambiguous across or within files
      }
    }
    if (hits.length !== 1) return undefined;
    const { page, at } = hits[0];
    return { file: page.path, ...positionAt(page.html, at), via };
  };

  // 1. id — unique by definition in a valid document, and written verbatim.
  if (anchor.id) {
    const hit = search(attrPattern("id", anchor.id), "id");
    if (hit) return hit;
  }

  // 2. a distinctive attribute the browser preserves verbatim.
  for (const [name, value] of attrsOf(anchor.html ?? "")) {
    if (!ANCHOR_ATTRS.includes(name) || !value) continue;
    const hit = search(attrPattern(name, value), "attribute");
    if (hit) return hit;
  }

  // 3. the full class list. Order is authored order in practice (the DOM
  //    preserves it), so match the string, but only when it is distinctive
  //    enough to be worth trusting — a lone `flex` is on every second line.
  const cls = (anchor.className ?? "").trim();
  if (cls && cls.length >= 8) {
    const hit = search(attrPattern("class", cls), "class");
    if (hit) return hit;
  }

  // 4. visible text, matched as ELEMENT CONTENT — between a `>` and a `<`,
  //    never as a bare substring. That boundary is what makes it safe: "Buy"
  //    as a substring also matches inside `id="Buyer"` and would report a
  //    location in an attribute. Length still gates it, but only enough to
  //    drop the strings that repeat on every screen ("OK", "Buy", "Save");
  //    the uniqueness check above is what actually decides.
  const text = (anchor.text ?? "").trim();
  if (text.length >= 5) {
    const hit = search(new RegExp(`>\\s*${escape(text)}\\s*<`), "text");
    if (hit) return hit;
  }

  return undefined;
}
