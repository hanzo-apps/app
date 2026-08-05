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
 * The scrim under anything modal — the dim that makes a floating panel read as
 * floating rather than as more page.
 *
 * Three hand-rolled modals (the share sheet, the session viewer, the record
 * drawer) each wrote `backgroundColor="black"`, with no alpha. That does not
 * dim the page behind them, it DELETES it — and a glass panel over a solid
 * black wall has nothing left to be translucent about. Dialogs meanwhile got
 * their scrim from CSS, so the two never agreed.
 *
 * The value is a CSS variable, not a literal, because both languages need it
 * and only one of them can hold the copy: `[data-slot="dialog-overlay"]` reads
 * `--hz-scrim` in globals.css and this reads the same variable, so the dim
 * behind a gui dialog and the dim behind a hand-rolled one are the same dim by
 * construction rather than by two people remembering 0.55.
 */
export const scrim = { backgroundColor: 'var(--hz-scrim)' } as const;

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
 *
 * This used to say that the alternative was a PURE WHITE PILL, because
 * @hanzo/ui's `default` variant was once `bg: $color12` — and an unnamed
 * `<Button>Edit Profile</Button>` really was the brightest object on a #080808
 * page. That is no longer true and has not been since the library split the two
 * apart: at 8.0.44 `default` is `bg: $color2` / `color: $color12`, a QUIET
 * control on the surface ladder, and `primary` is this recipe exactly —
 * measured in the browser as rgb(51,51,51) on rgb(69,69,69) with a white label.
 *
 * The failure mode INVERTED when that landed, and the stale sentence sent a
 * whole sweep looking for glare. What an unnamed control gives you now is a
 * button too quiet to find: pro-modal's only action, "Subscribe to PRO", was
 * painted `$color2` — the same fill `panel` uses — so the single thing the
 * dialog asked for read as another surface. Under-emphasis leaves no mark on a
 * screenshot, which is exactly why it needs a rule rather than an eye.
 *
 * So the rule survives its reason: name a variant on every control, and when
 * one is the primary action, spread this. Never `variant="default"`.
 *
 * Not `variant="primary"` either, even though it now paints the same pixels —
 * a variant only reaches a `Button`, and half this app's loud controls are an
 * `XStack` (/auth/callback), a `SizableText` (/dev settings) or a `Link`. One
 * recipe that spreads onto any element beats two spellings of one value.
 */
export const accent = {
  backgroundColor: '$color5',
  borderWidth: 1,
  borderColor: '$color6',
  /**
   * The foreground is part of the recipe, not an afterthought.
   *
   * Spell the fill by hand and you own the label too, and that half is the one
   * people drop. `default` was once a PAIR — `bg: $color12` with `color:
   * $color1` to sit on it — so overriding only the fill left a near-black label
   * on a 20% grey button at 1.6:1. The library has since made `default` quiet,
   * and that made hand-spelled foregrounds WORSE rather than moot: login-modal
   * kept `color="$color1"` (hsl(0 0% 4%)) on a label whose fill had moved to
   * `$color2` (8%), and "Log In to Continue" was painted at 1.07:1 — measured
   * in the browser, not guessed. The sign-in modal's only button was invisible.
   *
   * So the foreground travels with the fill, here, once. A call site that names
   * a colour on an `accent` label is re-opening this bug.
   *
   * And it only reaches a label the BUTTON paints. This is the half that is
   * easy to miss: `<Button {...accent}><SizableText>…</SizableText></Button>`
   * puts a second component between the recipe and the text, and that
   * component resolves its own colour from the theme scope the Button just
   * mounted — where `--color` is re-based to 80%. Measured on both modals:
   * fill rgb(51,51,51) and border rgb(69,69,69), correct, with the label at
   * rgb(204,204,204) — `$color11`, the QUIET foreground, on the loudest
   * control in the dialog. Passing the string straight through (`<Button
   * {...accent}>Log In to Continue</Button>`) hands it to the library's own
   * text host, which paints rgb(255,255,255): 7.87:1 → 12.63:1.
   *
   * The wrapper is usually there to set `fontSize`, which the Button's `size`
   * already decides. So: let the label be text. If a size really must change,
   * move it to the Button, never to a Text inside it.
   *
   * `$color12`, for the reason `selected` gives above and by the same
   * measurement: a Button mounts its OWN theme scope, and inside it `--color`
   * is `hsl(0 0% 80%)` — the same value as `--color11`, the quiet foreground.
   * So the loudest control on the page painted its label rgb(204,204,204)
   * while the `outline` button beside it, which resolves `$color12` inside the
   * library, painted rgb(255,255,255): the primary action read QUIETER than
   * the secondary sitting next to it. Read off /settings → Billing, where the
   * two stood one above the other. `$color12` is full strength in every scope,
   * so the emphasis survives the nesting that ate it.
   */
  color: '$color12',
  hoverStyle: { backgroundColor: '$color6', color: '$color12' },
} as const;
