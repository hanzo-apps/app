/**
 * Find the links in a generated site that go nowhere.
 *
 * "Every button should work" is stated in the builder prompt, and a prompt is a
 * request — the model can still emit a nav pointing at `quests.html` it never
 * wrote, or an anchor to `#pricing` that does not exist. The user then finds it
 * by clicking, which is the worst possible moment.
 *
 * This is the mechanical half of that rule. It reads only what the build already
 * produced, so it costs nothing and cannot be wrong about the model's intent:
 * either a target exists in the site or it does not.
 *
 * DELIBERATELY SILENT ABOUT EXTERNAL LINKS. `https://…`, `mailto:`, `tel:` and
 * protocol-relative URLs leave the site, and whether they resolve is not
 * knowable from here — reporting them would be guessing, and a checker that
 * cries wolf gets ignored precisely when it is right.
 */
import type { Page } from "@/types";

export interface DeadLink {
  /** Page the link was found on. */
  from: string;
  /** The href exactly as written. */
  href: string;
  /** Why it cannot resolve — shown to the person, so it names the target. */
  reason: "no such page" | "no such anchor";
}

/** `index.html`, `/index.html`, `./index.html` and `index` name one page. */
function normalizePath(p: string): string {
  let s = (p || "").trim().replace(/^\.?\//, "");
  s = s.split("?")[0].split("#")[0];
  if (!s) return "";
  if (!/\.[a-z0-9]+$/i.test(s)) s += ".html";
  return s.toLowerCase();
}

/** Anything that leaves the site, or is not a navigation at all. */
function isExternal(href: string): boolean {
  return (
    /^[a-z][a-z0-9+.-]*:/i.test(href) || // http:, https:, mailto:, tel:, javascript:
    href.startsWith("//")
  );
}

/** The `id` attributes present in one document. */
function idsIn(html: string): Set<string> {
  const out = new Set<string>();
  for (const m of html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)) out.add(m[1]);
  // A bare `<a name="x">` still answers `#x` in every browser.
  for (const m of html.matchAll(/<a\b[^>]*\bname\s*=\s*["']([^"']+)["']/gi)) out.add(m[1]);
  return out;
}

/**
 * Every internal link in `pages` whose target does not exist.
 *
 * `href="#"` is reported as a dead anchor rather than ignored: it is the exact
 * shape of a button that was never wired, which is the thing worth surfacing.
 */
export function deadLinks(pages: Page[]): DeadLink[] {
  const known = new Set(pages.map((p) => normalizePath(p.path)));
  const anchors = new Map(pages.map((p) => [normalizePath(p.path), idsIn(p.html)]));
  const out: DeadLink[] = [];

  for (const page of pages) {
    const here = normalizePath(page.path);
    for (const m of page.html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']*)["']/gi)) {
      const href = m[1].trim();
      if (!href || isExternal(href)) continue;

      if (href.startsWith("#")) {
        const id = href.slice(1);
        // `href="#"` names nothing at all — a placeholder, not a destination.
        if (!id || !(anchors.get(here)?.has(id) ?? false)) {
          out.push({ from: page.path, href, reason: "no such anchor" });
        }
        continue;
      }

      const target = normalizePath(href);
      if (!known.has(target)) {
        out.push({ from: page.path, href, reason: "no such page" });
        continue;
      }
      // A cross-page anchor must exist on the page it points INTO.
      const hash = href.split("#")[1];
      if (hash && !(anchors.get(target)?.has(hash) ?? false)) {
        out.push({ from: page.path, href, reason: "no such anchor" });
      }
    }
  }
  return out;
}
