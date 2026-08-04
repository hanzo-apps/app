/**
 * Find the LOCAL scripts and styles a generated page loads that do not exist.
 *
 * A build referenced `<script src="app.js">` it never wrote. In a single-file
 * project that file is not there, so the browser 404s it — and if that script
 * was meant to define the page's behaviour (`LuxQuest`, a config object, an init
 * function), every reference to it then throws `Can't find variable: …` and the
 * app is dead on arrival. One missing file, two console errors, a blank
 * interactive surface. Observed exactly that.
 *
 * This is the script/style twin of {@link deadLinks}: it reads what the build
 * produced, so it never guesses — either the referenced file is one of the
 * project's pages or it is not. It is deliberately silent about anything that
 * LEAVES the page (a CDN `https://…`, a `data:` URI, a protocol-relative URL);
 * those resolve or not for reasons this cannot see, and a checker that cries
 * wolf gets ignored.
 */
import type { Page } from "@/types";

export interface DeadResource {
  from: string;
  /** The src/href exactly as written. */
  ref: string;
  /** What kind of tag referenced it — so the message can name the failure. */
  kind: "script" | "stylesheet";
}

/** `index.html`, `/index.html`, `./index.html` name one file. */
function normalize(p: string): string {
  return (p || "")
    .trim()
    .replace(/^\.?\//, "")
    .split("?")[0]
    .split("#")[0]
    .toLowerCase();
}

/** Anything that leaves the page, or is not a file reference at all. */
function isExternal(ref: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(ref) || ref.startsWith("//");
}

/** Every local `<script src>` / `<link rel=stylesheet href>` with no such file. */
export function deadResources(pages: Page[]): DeadResource[] {
  const have = new Set(pages.map((p) => normalize(p.path)));
  const out: DeadResource[] = [];

  for (const page of pages) {
    const html = page.html ?? "";

    for (const m of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) {
      const ref = m[1].trim();
      if (!ref || isExternal(ref)) continue;
      if (!have.has(normalize(ref))) out.push({ from: page.path, ref, kind: "script" });
    }

    // Only stylesheet links — a <link rel=preconnect/icon/manifest> is not a
    // resource whose absence breaks the page the way a missing script does.
    for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
      const tag = m[0];
      if (!/\brel\s*=\s*["']?stylesheet/i.test(tag)) continue;
      const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1]?.trim();
      if (!href || isExternal(href)) continue;
      if (!have.has(normalize(href))) out.push({ from: page.path, ref: href, kind: "stylesheet" });
    }
  }
  return out;
}
