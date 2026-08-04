/**
 * The chrome, as values.
 *
 * Four constants, because four things were being spelled out by hand on every
 * page and drifting apart every time: how wide the content column is, what a
 * panel looks like, which control is the loud one, and what it means to fill the
 * screen. Each is ONE value here and nowhere else.
 */

/**
 * A state that owns the whole screen: the loading gate, the 404, the crash
 * screen, the OAuth callback, admin's sign-in, the store's receipt. It stands
 * alone — no `AppShell` above it — so it must MEASURE the screen itself.
 *
 * `minHeight="100%"` does not measure it, and that is the bug this value ends.
 * A percentage resolves against the parent's computed height; every ancestor up
 * to `<body>` is `height: auto` (globals.css gives body a min-height only) and
 * @hanzo/gui's provider span is `display: contents`, so there is no box in
 * between either. The percentage resolved to auto, the stack shrink-wrapped its
 * content, and `justifyContent: center` then centered inside THAT — perfectly,
 * and invisibly, in a box the height of the content. Measured on /auth/callback:
 * the brand mark sat at y=0 of a 903px viewport with 860px of black under it.
 * Ten states had the identical line; all ten were top-glued.
 *
 * `dvh`, not `vh`: on a phone the URL bar collapses and `100vh` overflows by its
 * height. `AppShell` measures the same way for the same reason.
 *
 * The centering travels WITH the measure because the two are one decision — a
 * state that fills the screen holds a paragraph of content, and half of this
 * recipe is what produced the defect in the first place.
 */
export const screen = {
  minHeight: '100dvh',
  alignItems: 'center',
  justifyContent: 'center',
} as const;

/**
 * The content column. Header and body read the SAME number, so a page's title
 * sits directly above its content — the pair used to be written separately
 * (/profile's header claimed 1280 while its body claimed 896) and no page
 * agreed with any other: 672, 768, 896, 1152, 1280.
 *
 * `AppShell` applies it. A page should not name it; the two that do are canvas
 * pages laying out their own full-bleed content against the same measure.
 */
export const RAIL = 960;

/**
 * A panel: the quiet surface a page's content sits on.
 *
 * `$color2` is 8% against the page's #080808, so the fill alone separates the
 * panel from the page and the hairline only finishes the edge. Panels were
 * variously `$background` (a border with nothing behind it — the card in the
 * owner's screenshot), `$color3` (the sidebar's ACTIVE-item fill, which is a
 * state, not a surface) and four different radii.
 *
 * Level 1 on the depth ladder, which is NOT the same claim as "this floats".
 * A cast shadow does say "above the page", and that stays false for a panel in
 * the flow — so level 1 spends almost nothing on shadow (1px, barely there) and
 * buys its depth from the lit top edge instead. On a #080808 canvas that is the
 * only half that reads at all: black-on-near-black moves no pixels, while a
 * hairline of light along the top lip is exactly what separates a surface from
 * the sheet behind it. See `.hz-elevation-*` in globals.css.
 */
export const panel = {
  backgroundColor: '$color2',
  borderWidth: 1,
  borderColor: '$borderColor',
  borderRadius: '$6',
  className: 'hz-elevation-1',
} as const;

/**
 * Glass — the material FLOATING chrome is made of, and only floating chrome.
 *
 * Menus, dialogs, popovers, toasts, sticky bars: things with page under them.
 * That last clause is the whole rule. Vibrancy is a lens — translucent ground
 * plus a backdrop blur — so it shows you a softened version of whatever it
 * covers, and covering nothing but the flat canvas it has nothing to soften.
 * An in-flow card wearing this is not glass; it is `$background` with extra
 * steps, one shade off the page it sits on and harder to find than `panel`.
 * So: over content → `glass`, in the flow → `panel`. There is no third case.
 *
 * MATERIAL ONLY, no geometry. What glass is made of does not tell you what
 * shape it was cut into: a menu is rounded on four sides, a sticky bar is
 * full-bleed with one hairline along its bottom. Baking `borderRadius` and
 * `borderWidth` in here would make every bar undo them, so edges stay at the
 * call site — which only ever needs to say WHICH ones (`borderBottomWidth={1}`),
 * never what colour, because the material already knows.
 *
 * The level is the one thing that genuinely varies, so it is the argument
 * (`selected(on)` is shaped the same way). 2 is anchored — a menu, a toast, a
 * bar, lifted off the page but tied to it. 3 is a modal, floating free over
 * everything with a scrim under it. There is no `glass(1)`: level 1 is rest,
 * and a floating thing is never at rest — the type says so, so the mistake
 * cannot be typed.
 *
 * `backgroundColor` is the opaque fallback, and it is load-bearing rather than
 * belt-and-braces: `.frosted` lives inside `@supports (backdrop-filter)`, so a
 * browser that cannot blur gets no rule at all — and a menu with no background
 * is a menu you read the page through.
 */
export const glass = (level: 2 | 3 = 2) =>
  ({
    className: `frosted hz-elevation-${level}`,
    backgroundColor: '$background',
    borderColor: '$borderColor',
  }) as const;

/**
 * A group of rows — the settings card, and the reason /settings had four cards
 * where it wanted one.
 *
 * Four toggles as four separate panels reads as four unrelated decisions, each
 * with its own four edges; the same four inside one card, parted by hairlines,
 * reads as one set and drops twelve edges of noise. That is the macOS settings
 * group, and it is the shape every settings surface in this app was reaching
 * for by hand.
 *
 * `overflow: hidden` is not decoration — the separators are drawn by the card
 * (`.hz-rows > * + *`), and without the clip the topmost one runs straight
 * through the rounded corner and out the side.
 *
 * The className is DERIVED from `panel`'s rather than restated, so moving the
 * panel up or down the ladder moves its groups with it instead of leaving this
 * one pinned to a level it no longer shares.
 */
export const rows = {
  ...panel,
  className: `${panel.className} hz-rows`,
  overflow: 'hidden',
} as const;

/**
 * One line inside a `rows` card: name on the left, control hard right.
 *
 * The rhythm, so it stops being re-decided per file — label `fontSize="$3"` in
 * `$color`, any explanation under it at `$1` in `$color11`. Both halves matter:
 * /settings wrote its row labels at `$color11`, which is the SECONDARY colour,
 * so the name of the setting and the footnote about it came out the same weight
 * of grey and the row had no first thing to read.
 *
 * No border here. A row that draws its own top hairline is a row that has to
 * know whether it is first, and the card already knows — see `rows`.
 */
export const row = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '$4',
  paddingHorizontal: '$4',
  paddingVertical: '$3',
} as const;

/**
 * Selected — the ONE "you are here" look, wherever a set offers a choice: the
 * sidebar's nav rows, a page's tabs, a filter chip.
 *
 * `$color3` fill with a `$color` label, one step above the panel it sits on.
 * Three different answers were in play: the sidebar's (this one), /connectors'
 * `$color12` chip (a pure-white lozenge) — and, on the dashboard and everywhere
 * that copied it, NO answer at all. `@hanzo/ui`'s `TabsTrigger` is `unstyled`,
 * so a selected tab was styled exactly like its neighbours and the page simply
 * did not say which one you were on. Nothing in the markup looked wrong; the
 * state had no picture.
 */
/**
 * The label is `$color12`, not `$color`, and that is a measured distinction
 * rather than a preference. Themes nest: at the page scope `--color` is
 * `hsl(0 0% 100%)`, but inside the sidebar's scope it is re-based to
 * `hsl(0 0% 80%)` — the SAME value as `--color11`. So a selected row asking for
 * `$color` got exactly its neighbours' colour, and had been doing so all along;
 * the markup said "highlight this" and the token quietly collapsed underneath.
 * `$color12` is the theme's full-strength foreground in every scope (it is also
 * what @hanzo/ui's own variants use), so the state survives nesting.
 */
export const selected = (on: boolean) =>
  on
    ? ({ backgroundColor: '$color3', color: '$color12' } as const)
    : ({ backgroundColor: 'transparent', color: '$color11' } as const);

/**
 * The primary control — the ONE loud thing a page is allowed.
 *
 * `$color5` on `$color6` is a raised pushbutton: legible, quiet, monochrome.
 * The alternative is what @hanzo/ui's `default` variant does — `$color12`,
 * which in this theme is `hsl(0 0% 100%)`, i.e. a PURE WHITE PILL. That is the
 * loudest possible object on a #080808 page, and it is what an unnamed variant
 * silently gives you: `<Button>Edit Profile</Button>` in the screenshot was the
 * brightest element on the page, brighter than the page's own title.
 *
 * So: name a variant on every control, and when one of them is the primary
 * action, spread this. Never `variant="default"`, never `variant="primary"`.
 */
export const accent = {
  backgroundColor: '$color5',
  borderWidth: 1,
  borderColor: '$color6',
  /**
   * The foreground is part of the recipe, not an afterthought.
   *
   * A Button with no `variant` still resolves to `default`, and `default` is a
   * PAIR — `bg: $color12` with `color: $color1` to sit on it. Overriding only
   * the fill keeps the other half: $color1 is hsl(0 0% 4%), so the label came
   * out near-black on a 20% grey button at 1.6:1, well under any legibility
   * floor and worse than the white pill it replaced. Measured in the browser,
   * not guessed — every inline copy of this recipe in the app has that bug.
   */
  color: '$color',
  hoverStyle: { backgroundColor: '$color6', color: '$color' },
} as const;
