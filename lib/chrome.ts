/**
 * The chrome, as values.
 *
 * These used to be defined here, each one earned by a defect measured in
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
export { accent, fold, glass, panel, row, rows, screen, scrim, selected, sheet } from "@hanzo/ui/glass";
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
 * ICON-ONLY CONTROLS: there is no recipe here, and that is the point.
 *
 * A Button whose whole content is one glyph takes `size="icon-sm" | "icon" |
 * "icon-lg"` (32 / 36 / 40) from `@hanzo/ui`. The package already implements it
 * — `height: 'auto'` plus a `minHeight`/`minWidth` floor, padding zeroed — and
 * a local copy of that answer is what went wrong here.
 *
 * The copy was `iconBox(size)`, spreading `width`/`height` plus
 * `paddingHorizontal: 0`. It worked on an XStack and was SILENTLY DROPPED by a
 * Button: `paddingHorizontal` is a React-Native shorthand and this app runs
 * `@hanzogui/config/v5` with `styleCompat: "web"`. So a Button kept its 12px of
 * label padding, leaving `size - 24` for the glyph, and `svg { max-width: 100% }`
 * shrank the icon to fit rather than overflowing. Nothing threw, nothing warned,
 * nothing clipped — measured with `getComputedStyle` in the builder toolbar:
 *
 *   Hanzo home        XStack   padding  0/0    glyph 20x20   correct
 *   Version history   Button   padding 12/12   glyph  6x16   squashed
 *   Device toggle     Button   padding 12/12   glyph  2x16   squashed
 *
 * Six icons in one bar, each a different sliver — that is what "the icons and
 * buttons look wildly inconsistent" was. Switching the longhands in did fix the
 * box but NOT the padding, which is the tell that the whole approach was wrong:
 * the component owns its own padding and will not be argued out of it from a
 * prop spread.
 *
 * The unit test that guarded `iconBox` passed throughout, because the object it
 * returned was always correct — it simply never reached the DOM. Only a browser
 * can see this difference, so the guard is
 * `tests/e2e/authed/editor-toolbar.spec.ts`, which reads rendered geometry.
 */

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
