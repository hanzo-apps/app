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
 * No elevation. A shadow says "this floats above the page", which is true of a
 * dialog or a menu and false of a panel sitting in the flow.
 */
export const panel = {
  backgroundColor: '$color2',
  borderWidth: 1,
  borderColor: '$borderColor',
  borderRadius: '$6',
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
