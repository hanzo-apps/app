import { Page } from "@/types";

/**
 * Builder response parser — the ONE place the raw model/gateway output is
 * turned into renderable {path, html} pages.
 *
 * The gateway streams back whatever the selected model emits. In practice that
 * is one of three shapes, and this module handles all three without ever
 * throwing on a partial/odd payload:
 *
 *  1. Multi-file — the format the builder system prompt asks for:
 *       <<<<<<< START_TITLE index.html >>>>>>> END_TITLE
 *       ```html
 *       <!DOCTYPE html> … </html>
 *       ```
 *  2. Bare single-file HTML — what most models (e.g. zen-flash) actually
 *     return: a raw `<!DOCTYPE html> … </html>` document with NO markers and
 *     often NO ``` fence. This used to be dropped on the floor (0 pages → the
 *     generated site vanished and the editor showed the default page).
 *  3. A JSON error envelope (`{ ok:false, message }`) — never a page.
 *
 * Everything here is pure and side-effect free so it is unit-testable and can
 * run on every stream chunk cheaply. All string access is guarded: a missing
 * segment yields "" / no page, never a `.startsWith`/`.trim` on `undefined`.
 */

const TITLE_RE = /<<<<<<< START_TITLE (.*?) >>>>>>> END_TITLE/;
const TITLE_RE_G = /<<<<<<< START_TITLE (.*?) >>>>>>> END_TITLE/g;
const HTML_START_RE = /<!DOCTYPE html>[\s\S]*/i;
const HTML_TAG_RE = /<html[\s\S]*/i;

/**
 * Drop `<think>…</think>` reasoning blocks (and any trailing, still-open
 * `<think>…` with no close) so they never leak into a rendered page. Reasoning
 * is surfaced separately in the AskAI "thinking" panel.
 */
export function stripThinkBlocks(content: string): string {
  if (!content) return "";
  return content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*$/i, "")
    .trimStart();
}

/**
 * Ensure a (possibly still-streaming) HTML fragment has closing tags so it
 * renders in the preview iframe before the model finishes.
 */
export function ensureCompleteHtml(html: string): string {
  let out = html ?? "";
  if (out.includes("<head") && !out.includes("</head>")) out += "\n</head>";
  if (out.includes("<body") && !out.includes("</body>")) out += "\n</body>";
  if (!out.includes("</html>")) out += "\n</html>";
  return out;
}

/**
 * Extract clean HTML from one chunk: strip markdown code fences and any stray
 * START_TITLE markers, then keep from `<!DOCTYPE html>` (or `<html>` when the
 * doctype is omitted) to the end. Returns "" when the chunk has no HTML yet.
 */
export function extractHtmlContent(chunk: string | undefined | null): string {
  if (!chunk) return "";

  // Remove fenced-code markers (```html … ```) and any stray title markers.
  const withoutFences = chunk
    .replace(/```[a-zA-Z]*\n?/g, "")
    .replace(/```/g, "")
    .replace(TITLE_RE_G, "");

  const match =
    withoutFences.match(HTML_START_RE) ?? withoutFences.match(HTML_TAG_RE);
  if (!match) return "";

  return ensureCompleteHtml(match[0].trim());
}

/**
 * True when the content is a JSON envelope (e.g. an error `{ ok:false }`)
 * rather than page content. Only treated as JSON when it has no HTML.
 */
function looksLikeJsonEnvelope(trimmed: string): boolean {
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return false;
  if (HTML_START_RE.test(trimmed) || HTML_TAG_RE.test(trimmed)) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse the multi-file (START_TITLE) format into pages. Hardened so a missing
 * title/body segment simply produces no page for that slot.
 */
function parseMultiFile(content: string): Page[] {
  const pages: Page[] = [];

  // Drop any preamble before the first title marker.
  const cleaned = content.replace(
    /[\s\S]*?<<<<<<< START_TITLE (.*?) >>>>>>> END_TITLE/,
    "<<<<<<< START_TITLE $1 >>>>>>> END_TITLE"
  );

  // Splitting on a capturing regex interleaves [text, title, body, title, …].
  const parts = cleaned.split(TITLE_RE_G);
  const seen = new Set<number>();

  parts.forEach((segment, index) => {
    if (seen.has(index)) return;
    const path = (segment ?? "").trim();
    if (!path) return;

    const html = extractHtmlContent(parts[index + 1]);
    if (!html) return;

    pages.push({ path, html });
    seen.add(index);
    seen.add(index + 1);
  });

  return pages;
}

/**
 * The one public parser. Always returns an array (possibly empty); never
 * throws. `defaultPath` names a bare single-file page (default "index.html").
 */
export function parsePages(
  content: string | undefined | null,
  defaultPath = "index.html"
): Page[] {
  const cleaned = stripThinkBlocks(content ?? "");
  const trimmed = cleaned.trim();
  if (!trimmed) return [];

  if (looksLikeJsonEnvelope(trimmed)) return [];

  if (TITLE_RE.test(cleaned)) {
    const pages = parseMultiFile(cleaned);
    if (pages.length > 0) return pages;
    // Markers present but nothing parsed yet (still streaming); fall through so
    // any bare HTML already emitted still previews.
  }

  const html = extractHtmlContent(cleaned);
  if (html) return [{ path: defaultPath, html }];

  return [];
}

/**
 * Parse a follow-up "new page" response into a single page. Keeps a bare
 * single-file response on the page currently being edited; honours an explicit
 * START_TITLE path when the model provides one. Returns null when there is no
 * renderable HTML yet.
 */
export function parseSinglePage(
  content: string | undefined | null,
  currentPagePath: string
): Page | null {
  const cleaned = stripThinkBlocks(content ?? "");
  const pages = parsePages(cleaned, currentPagePath || "index.html");
  if (pages.length === 0) return null;

  const hasExplicitTitle = TITLE_RE.test(cleaned);
  const chosen =
    (currentPagePath && pages.find((p) => p.path === currentPagePath)) ||
    pages[0];

  return {
    path: hasExplicitTitle ? chosen.path : currentPagePath || chosen.path,
    html: chosen.html,
  };
}
