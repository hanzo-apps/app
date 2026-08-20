import { execFileSync } from "child_process";

import { read, root } from "../source";


/**
 * The brand is appended in ONE place, and a page never writes it.
 *
 * Twelve pages carried their own suffix, in three spellings — "— Hanzo",
 * "| Hanzo", "— Built on Hanzo" — and `/store` carried none at all, so it
 * served the bare word `Store` and named nobody. Measured on production
 * 2026-08-08. Twelve chances to write one string is why they disagreed, and
 * why the thirteenth was forgotten.
 *
 * `title.template` in the root layout is Next's own mechanism for this: a page
 * states what IT is, the root says who WE are. So the rule is not "every title
 * has the brand" — it is the opposite: **no page title may contain it**, because
 * the root adds it and a page that writes it too gets it twice.
 */
const layout = read("app/layout.tsx");

/**
 * Every title a page or layout declares AS METADATA.
 *
 * Scoped to the metadata region — from the first `metadata` declaration to the
 * component that follows it — because `title:` is an ordinary field name and
 * these files are full of them: `app/docs/page.tsx` alone has nine, in a data
 * array of doc cards. Sweeping every `title:` in `app/` would report a card
 * called "Install Hanzo" as a page that brands its own tab.
 */
function pageTitles(): { file: string; title: string }[] {
  const files = execFileSync(
    "git",
    ["ls-files", "--", "app/**/page.tsx", "app/**/layout.tsx", "app/page.tsx", "app/layout.tsx"],
    { cwd: root, encoding: "utf8" },
  )
    .split("\n")
    .filter(Boolean)
    .filter((f) => f !== "app/layout.tsx");

  const found: { file: string; title: string }[] = [];
  for (const file of files) {
    const src = read(file);
    const start = src.search(/export (const metadata|async function generateMetadata)/);
    if (start < 0) continue;
    const after = src.slice(start);
    const end = after.search(/export default/);
    const region = end > 0 ? after.slice(0, end) : after;
    for (const m of region.matchAll(/^\s+title:\s*(["'`])([^"'`]*)\1/gm)) {
      found.push({ file, title: m[2] });
    }
  }
  return found;
}

describe("the brand is said once", () => {
  it("the root layout templates it", () => {
    expect(layout).toMatch(/title:\s*\{[^}]*template:\s*"%s — Hanzo AI"/);
  });

  it("…and still has a default for pages that set no title", () => {
    // Without one, `title.template` alone leaves the root itself untitled.
    expect(layout).toMatch(/title:\s*\{[^}]*default:\s*"[^"]+"/);
  });

  it("the sweep finds titles at all — an empty one would pass everything", () => {
    expect(pageTitles().length).toBeGreaterThan(10);
  });

  it.each(pageTitles())("$file does not append the brand itself", ({ title }) => {
    // "Install — CLI, MCP…" is fine; "Install Hanzo — CLI, MCP…" is not, and
    // neither is "Community — Built on Hanzo". If a title genuinely needs the
    // word (a product literally called Hanzo Something), give it
    // `title: { absolute: … }` — that is Next's opt-out, and it says so.
    expect(title).not.toMatch(/Hanzo/);
  });

  it("the template catalog's 121 seoTitles do not append it either", () => {
    // `/templates/<slug>` takes its title from `seoTitle`, so the catalog is a
    // 121-row back door onto the same rule — and every row went through it:
    // each one ended "| Hanzo" before the template existed. A page-file sweep
    // cannot see them, because the file says `title: t.seoTitle`.
    const catalog = read("lib/templates-catalog.ts");
    const titles = [...catalog.matchAll(/seoTitle:\s*"([^"]*)"/g)].map((m) => m[1]);
    expect(titles.length).toBeGreaterThan(100);
    expect(titles.filter((t) => /Hanzo/.test(t))).toEqual([]);
  });
});
