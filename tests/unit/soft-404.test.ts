import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = join(__dirname, "../..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

/**
 * A route that renders "not found" must ANSWER not-found.
 *
 * Measured on prod 2026-08-08: `/games/does-not-exist` returned **200** with
 * the generic site title while rendering "Game not found." A human read the
 * right words; a crawler indexed a phantom page and a link checker called the
 * link healthy. `/templates/<slug>` and `/builds/<org>/<project>` already
 * answered properly — the two game routes were the pair that did not, which
 * made this an inconsistency rather than a missing idea.
 *
 * The cause is structural and worth stating: those two pages are `'use client'`,
 * and a client component cannot set a status — by the time it decides the id is
 * unknown, the 200 has already gone out. Calling `notFound()` there would look
 * like a fix and change nothing. So the check has to happen on the server, and
 * for a static catalog the cheapest server check is enumeration.
 */
const GATED = ["app/games/[id]", "app/games/[id]/play"];

describe("a route that says not-found answers not-found", () => {
  it.each(GATED)("%s gates unknown ids on the server", (dir) => {
    const page = read(`${dir}/page.tsx`);
    // Enumerating the ids IS the check: anything not listed 404s, with no
    // runtime branch that could drift from the catalog.
    expect(page).toContain("export const dynamicParams = false");
    expect(page).toMatch(/export function generateStaticParams\(\)/);
    expect(page).toContain("gamesCatalog");
    // A server page cannot carry the directive, and that is the whole point.
    expect(page.trimStart().startsWith("'use client'")).toBe(false);
  });

  it.each(GATED)("%s keeps its interactive body in a client view", (dir) => {
    expect(existsSync(join(root, `${dir}/view.tsx`))).toBe(true);
    expect(read(`${dir}/view.tsx`).trimStart().startsWith("'use client'")).toBe(true);
  });

  it("enumerates EVERY game for /play, not only the playable ones", () => {
    // An unknown id is not a page. A real game with no build yet IS one — the
    // view says so and offers the way back, which beats a 404 for something
    // that exists and will work later. Filtering here would erase that.
    const play = read("app/games/[id]/play/page.tsx");
    expect(play).toMatch(/gamesCatalog\.map\(\(g\) => \(\{ id: g\.id \}\)\)/);
    expect(play).not.toContain("isPlayable");
  });
});
