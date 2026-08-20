import { existsSync } from "fs";
import { join } from "path";

import sitemap from "@/app/sitemap";

import { read, root } from "../source";

/**
 * Every page we ask search engines to index carries its OWN title.
 *
 * Measured on production 2026-08-08: `/templates`, `/docs`, `/faq` and `/learn`
 * all served `<title>Hanzo AI | Build with AI</title>` — the root layout's
 * fallback. Four indexed pages were indistinguishable in a search result, in a
 * browser tab, and in a shared link.
 *
 * The cause is the same shape as the games soft-404 next door: those pages are
 * `'use client'`, and a client component CANNOT `export const metadata` — it is
 * a server-only export, so writing one is silently ignored rather than an
 * error. The repo already had both cures — `/pricing` and `/features` are
 * client pages with a co-located server `layout.tsx` (see lib/seo.ts, which
 * exists precisely for this), and `/store` and `/community` are server pages
 * with their own `metadata`. Four pages simply had neither.
 *
 * So this checks the pairing, not the presence of a file: a sitemap route whose
 * page is a client component must have a layout that supplies the metadata.
 */

const routes = () =>
  sitemap()
    .map((e) => new URL(e.url).pathname.replace(/\/$/, ""))
    .filter((p) => p !== "");

const isClient = (src: string) => /^\s*['"]use client['"]/.test(src);

describe("every indexed page names itself", () => {
  it.each(routes())("%s supplies its own metadata", (route) => {
    const dir = join("app", route);
    const page = join(dir, "page.tsx");
    expect(existsSync(join(root, page))).toBe(true);

    const src = read(page);
    if (!isClient(src)) {
      // A server page can declare it directly.
      expect(src).toMatch(/export const metadata/);
      return;
    }
    // A client page cannot — the metadata has to come from a server layout
    // beside it, which is what lib/seo.ts's passthrough exists for.
    const layout = join(dir, "layout.tsx");
    expect(existsSync(join(root, layout))).toBe(true);
    expect(read(layout)).toMatch(/export const metadata/);
  });
});

describe("the cure is used the one way", () => {
  it("a metadata-only layout re-exports the shared passthrough", () => {
    // Scoped to INDEXED routes on purpose. A hand-rolled passthrough would be a
    // second body wrapping the page, and lib/seo.ts exists because it adds no
    // DOM at all — but that rule is about layouts whose ONLY job is metadata.
    // app/dev/layout.tsx also carries metadata and is a real 44-line layout
    // doing real work; it is not in the sitemap, robots disallows it, and
    // dragging it under this rule would be the test inventing a law.
    const layouts = routes()
      .map((r) => join("app", r, "layout.tsx"))
      .filter((p) => existsSync(join(root, p)) && read(p).includes("export const metadata"));

    expect(layouts.length).toBeGreaterThanOrEqual(6);
    for (const l of layouts) {
      expect(read(l)).toContain('export { default } from "@/lib/seo"');
    }
  });
});
