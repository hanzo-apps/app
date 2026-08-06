/**
 * The chrome, as values.
 *
 * These eight used to be defined here, each one earned by a defect measured in
 * this app's browser. They now live in `@hanzo/ui/glass` — every Hanzo surface
 * wants the same answers, and a copy per app is how they stop being the same
 * answers. The law and the reasoning went with them; what stays below is the
 * part that is about THIS app, plus the one measure that is a product decision
 * rather than a material.
 *
 * The material itself (the blur, the elevation ladder, the scrim, the row
 * separators) is in `@hanzo/ui/glass.css`, and `assets/globals.css` still holds
 * this app's copy of those rules — same selectors, same values, so the two
 * agree by name. Deleting the copy for `import '@hanzo/ui/glass.css'` is a real
 * next step and not a free one: the package reads @hanzo/design's tokens and
 * this app declares none of them, so it would land design's values (a .10 sheen
 * against our .09, a .8 scrim against our .55) and that wants a browser, not a
 * guess.
 */
export { accent, glass, panel, row, rows, screen, scrim, selected } from "@hanzo/ui/glass";
export type { Lift } from "@hanzo/ui/glass";

/**
 * The content column. Header and body read the SAME number, so a page's title
 * sits directly above its content — the pair used to be written separately
 * (/profile's header claimed 1280 while its body claimed 896) and no page
 * agreed with any other: 672, 768, 896, 1152, 1280.
 *
 * `AppShell` applies it. A page should not name it; the two that do are canvas
 * pages laying out their own full-bleed content against the same measure.
 *
 * The one value here that did NOT move to `@hanzo/ui`: a rail is a product
 * decision about how wide this app's prose should be, not a fact about what
 * chrome is made of. 960 is hanzo.app's answer, and another app's would be
 * different without either being wrong.
 */
export const RAIL = 960;

/**
 * A square control whose whole content is one glyph.
 *
 * The size IS the padding, so the padding must be ZERO — and that is the part
 * every call site forgot. A Button carries 12px of horizontal padding for its
 * label; pin the box to a fixed width and that padding eats the box from both
 * sides, leaving `size - 24` for the icon. `svg { max-width: 100% }` then
 * shrinks the glyph to fit instead of letting it overflow, so nothing warns and
 * nothing clips — the icon just quietly stops being square.
 *
 * Measured in the builder toolbar, and the arithmetic is exact: a 28px device
 * toggle rendered its 16px icon at 2px (28-24, less the hairline), the 32px
 * history/refresh/open controls at 6px, a 36px control at 10px. Six icons in one
 * bar, each a different sliver, which is what "the icons look wrong" was.
 *
 * Height is not passed: a square is one number.
 */
export const iconBox = (size: number) => ({
  width: size,
  height: size,
  paddingHorizontal: 0,
  paddingVertical: 0,
  alignItems: "center",
  justifyContent: "center",
}) as const;

/**
 * What this app learned. It stays here, not in the package, because the
 * evidence is all local paths — and it is the reason each recipe is shaped the
 * way it is, so it should not be lost to a move.
 *
 * - `screen` exists because ten states wrote `minHeight="100%"` and every one
 *   was top-glued: on /auth/callback the brand mark sat at y=0 of a 903px
 *   viewport with 860px of black under it. A percentage resolves against a
 *   parent that is `height: auto` all the way to <body>.
 * - `panel` exists because in-flow surfaces were variously `$background` (a
 *   border with nothing behind it — the card in the owner's screenshot),
 *   `$color3` (the sidebar's ACTIVE-item fill, a state, not a surface) and four
 *   different radii.
 * - `rows` exists because /settings shipped four cards for four toggles.
 * - `row` exists because /settings wrote its row labels at `$color11` — the
 *   SECONDARY colour — so the name of a setting and the footnote about it came
 *   out the same weight of grey and the row had no first thing to read.
 * - `selected` exists because three answers were in play: the sidebar's,
 *   /connectors' `$color12` pure-white lozenge, and — on the dashboard and
 *   everywhere that copied it — none at all.
 * - `accent` exists because pro-modal's only action, "Subscribe to PRO", was
 *   painted `$color2`, the same fill `panel` uses, and login-modal's
 *   "Log In to Continue" measured 1.07:1. Its BUTTON-ONLY caveat is measured
 *   here too: /auth/callback spreads `accent` onto an `XStack`, whose label
 *   asks for `$color` and measures rgb(255,255,255) — correct, and not to be
 *   "fixed". `tests/unit/emphasis-token.test.ts` scans for the difference.
 * - `scrim` exists because three hand-rolled modals (the share sheet, the
 *   session viewer, the record drawer) wrote `backgroundColor="black"` with no
 *   alpha, which does not dim the page behind them — it deletes it.
 */
