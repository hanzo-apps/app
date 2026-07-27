# `/dev` builder chrome (`components/editor/*`) — unified design

True-black monochrome, content-forward. The chrome recedes; the generated
preview is the star. Matches hanzo.ai (zero hue by construction, except genuine
semantics).

- **Bottom-left identity cluster** — `components/editor/identity-bar/index.tsx`
  (`BuilderIdentityBar`). ONE consolidated cluster pinned bottom-left in the
  `Footer` (`components/editor/footer`): `OrgSwitcher` + `EditorAccountMenu`
  (credit balance included). Mirrors the canonical bottom-left user/org control
  from hanzo.chat (`client/src/components/Nav/AccountSettings.tsx`) and
  console.hanzo.ai (`DashboardShell.tsx` SidebarIdentity). Both controls take an
  additive `direction="up"` prop so their menus open UPWARD (Radix `side="top"`
  for the account menu; `bottom-full` popover for the org switcher). The top
  `Header` stays minimal: animated H mark + tab switcher + primary actions.
- **Animated logo** — `HanzoLogo` `animated` prop wraps the mark's paths in
  `<g className="hanzo-logo-idle">`. The keyframe (`hanzoLogoIdle`, in
  `assets/globals.css`) is a slow 4s opacity breathe, gated behind
  `@media (prefers-reduced-motion: no-preference)` — a no-op (static mark) for
  reduced-motion users. The header lifts opacity on hover. Static and animated
  variants share ONE `paths` fragment (no path duplication).
- **Monochrome**: `assets/globals.css` already remaps the `teal/cyan/indigo/`
  `violet/purple/rose` token families to zero-chroma grays, so those Tailwind
  classes render gray automatically. `blue/sky/emerald/amber/green/red/yellow`
  are NOT remapped (render truly colored) — non-semantic uses of those in the
  builder chrome were neutralized to white/neutral. Kept semantic only: green
  = live/active/success, red = error/destructive, yellow = warning,
  emerald = git-push success.

### Landmine: `@hanzo/ui` wallet/network subpaths dropped in 5.5.x

`components/network-wallet` used to import `@hanzo/ui/network`
(`NetworkSwitcher`) and `@hanzo/ui/wallet` (`injectedEvmAdapter`, `WalletMenu`).
The installed `@hanzo/ui@5.5.1` ships NEITHER subpath (no `./network` /
`./wallet` in its `exports`, no `dist/network*` / `dist/wallet*` files) — a
hard `Module not found` that fails the whole `/dev` build (it's a static ESM
import; no try/catch possible). `NetworkWallet` now renders `null` (API stable,
re-enable recipe in its file) and is NOT composed into `BuilderIdentityBar` —
the canonical bottom-left pattern is org + account anyway. Re-enable when
`@hanzo/ui` exports the wallet entry points again.

---

## Tamagui/@hanzo/ui v8 convergence + v2 IDE token system (2026-07-25)

hanzo.app is converging onto the ONE Hanzo stack (identical target as hanzo.chat
+ hanzo.desktop): `@hanzo/ui@8` product layer on `@hanzo/gui` (Tamagui) +
`@hanzogui/shell`, styled by the `@hanzo/brand@1.4.4` v2 token system. Tailwind
is being retired incrementally — the app still ships Tailwind v4 (shadcn
primitives via the `@hanzo/ui`→`@hanzo/ui-shadcn@5.9.0` alias + ~214 utility-class
files), so the register + tokens are staged in the app's ONE CSS token layer
(`assets/globals.css`) rather than ripped out. Full de-Tailwind is multi-pass.

**Token source of truth**: `@hanzo/brand@1.4.4` `styles/variables.css` (imported
first in `app/layout.tsx`). Canonical v2 tokens:
- Accent (the ONE — purple): `--hanzo-accent #8b5cf6` / hover `#7c3aed` / muted
  `#a78bfa` / soft `rgba(139,92,246,.12)`. Purple = links/active/focus/selection
  ONLY. **Primary action stays WHITE** (monochrome) — never purple.
- Layered blacks (no gray panels): `--surface-0 #080808` (bg) / `-1 #0d0d0d`
  (panels) / `-2 #111` (raised) / `-3 #171717` (controls/hover).
- Hairline border `--border-hairline rgba(255,255,255,.06)`.
- Radius: `--radius-card 8` / `--radius-control 10` / `--radius-panel 12`.
- Type: heading 20@600 / body 14@400 / secondary 12.

**How the app consumes it** (`assets/globals.css`):
- Retuned Tailwind v4 `--text-*` to the 14px base register (body 14, dense 13,
  secondary/labels 12, display tightened) + `body { font-size: 14px }`. ONE place
  drives every `text-*` utility.
- Dark theme maps `--background/card/popover/muted` → the layered blacks;
  `--border`/`--input` → hairline; `--ring` → the accent. Accent consumed via
  `var(--hanzo-accent, #8b5cf6)`. **Note**: next-themes toggles `.dark` ONLY (never
  `.light`), so brand's `.light` block doesn't apply in app light mode — the app's
  own `:root`(light)/`.dark` definitions (mirroring brand's values) are authoritative.
- ONE compact control spec: `@hanzo/ui`'s shadcn Input/SelectTrigger/Textarea all
  share the `h-input` class + reference undefined `@hanzo/ui` tokens and a
  floating-label giant (pt-8/pt-6). Fixed globally by (a) resolving those token
  namespaces onto the palette in `@theme inline`, and (b) pinning ONE
  height(30)/radius(10)/size(13) on `[class~="h-input"]` + `[data-slot="button"]`.
  No per-file edits — every control is compact + consistent. Verified: builder
  color audit = 267 grayscale / 1 purple / 0 blue-green-orange; body 14px.

**Builder v2 (native-IDE) so far**: dense near-borderless chat rows (8px radius);
assistant replies render markdown → HTML via the density-aware `MarkdownRenderer`
(`compact` prop — ONE renderer, two densities); build activity uses a pulsing
accent dot (never a spinner); composer Build/Plan active = purple, send stays
white; chat pane 27%; invisible-until-hover splitter; subtle `.preview-stage` grid;
killed the multi-color composer gradient → single purple.

**Remaining (next passes, coordinate with the parallel chat/desktop migration)**:
consume the `@hanzogui/shell` v2 Tamagui theme when its version ships (replace the
interim CSS vars); per-file swap of shadcn primitives → `@hanzo/ui` v8 / `@hanzo/gui`
controls (repoint the 155 `@hanzo/ui`→`@hanzo/ui-shadcn` primitive imports; add real
`@hanzo/ui@8`); toolbar + thin VS-Code status bar + collapsible message sections
(Plan/Files/Diff ▼) + skeleton→wireframe preview animation + icon-only device
toggle; asset convergence (`@hanzo/logo`/`@hanzo/design`, brand-by-host); then the
Tailwind rip once shadcn usage is gone. NEVER hard-fork brand token values.

### Iteration 2 (2026-07-25) — light-mode fixes + IDE chrome

Done: (1) the preview is never a flat black rect — themed `.preview-stage` canvas
+ subtle checker in BOTH themes + a themed idle/building overlay in
`components/editor/preview` (`PreviewOverlay`: "Describe your idea. ↓ Watch Hanzo
build it live" + cursor when idle; a skeleton→wireframe pulse while building,
shown only until real HTML streams in). (2) The builder chrome's dark-only
`white/…` alphas were swept to theme-adaptive `foreground/…` (header, editor
shell, resizer, preview-card ring) so the toolbar is visible in light; the
"Load existing Project" button + Share button are themed. (3) New thin VS-Code
`StatusBar` (`components/editor/status-bar`) pinned bottom. (4) Chat reasoning now
collapses into a reusable `CollapsibleSection` (Plan ▼ / Generated files ▼) in
`chat-thread.tsx`. (5) The Hanzo block-H (shared `components/HanzoLogo` →
`@hanzo/logo` `MARK_PATHS`) is a home anchor top-left of the header; device toggle
is Lucide `Monitor`/`Smartphone` (16px).

**LANDMINE — `--surface-0` is stale in the app's class-only light mode.**
next-themes toggles `.dark`/`.light` classes; brand's `variables.css` sets the
DARK surface values in `:root` (the default) and only flips them under `.light`.
When the app is in a transient no-class state (`.dark` removed but `.light` not
yet applied) OR the CSS optimizer reorders `:root` blocks, `var(--surface-0)`
resolves to the dark `#080808` in light → a black element. Only `--background`
is forced per-theme with `!important` (`html.dark` / `html:not(.dark)`), so it is
the ONLY reliable themed surface token in this app. Bind theme-critical
backgrounds to `var(--background)`, not `var(--surface-*)`. (Same class of fix
will be needed if more surface tokens get used.)

### Iteration 3 (2026-07-25) — dialog theming

Every overlay was hardcoded white (`!bg-white !border-neutral-100`, colored emoji-
avatar circles, `text-neutral-*`, dark-on-white buttons, emerald checks, rainbow
PRO tag) → jarring white-in-dark. All themed onto the ONE system (like the Invite
modal): `bg-card` + `border-border` hairline, neutral avatar chips (`bg-muted`/
`bg-secondary` + hairline), `text-muted-foreground` body, **default WHITE primary**
buttons, purple (`--brand-accent-muted`) feature checks, `--brand-accent-soft` PRO
tag. Files: `login-modal`, `pro-modal`, `my-projects/load-project` (import dialog),
`invite-friends`, `editor/ask-ai/re-imagine` (URL popover), `editor/ask-ai/uploader`
(image picker). Chrome alphas that were dark-only (`workspace-menu`, `git-sync-button`,
`deploy-button` inputs/triggers) swept `white/[0.0x]` → `foreground/[0.0x]`,
`ring-white/40` → `ring-ring`, white selection → accent-soft, credit-bar fill → purple.
Verified: LoginModal + re-imagine popover render correct in dark AND light.

Still open next pass: preview toolbar reorg ([Preview Code Split] | [Live]) + a
tablet device width; Diff ▼ / Explanation ▼ need the generate stream to emit that
data (not just UI); continue shadcn→`@hanzo/ui` v8 swap toward the Tailwind rip.

### Iteration 4 (2026-07-25) — buttons, shell/sidebar, connectors, + the honest gui state

Done (all green): (1) BUTTON RADIUS — every button now the 10px control radius.
Root cause was the `[data-slot="button"]` pin only covering default/sm/lg sizes, so
icon/iconXs/xs shadcn buttons kept shadcn's base rounded-md (6px) and raw `<button>`s
kept hardcoded 2–6px radii. Fix (globals.css, no per-file edits): `[data-slot="button"]`
→ `border-radius: var(--control-radius) !important` for ALL sizes, with a more-specific
`.rounded-full` override preserving deliberate pills/circles (composer send/stop); raw
`<button>:not([data-slot=button])` normalized to control radius UNLESS it opts into a
large radius (rounded-xl/2xl/3xl) or a pill. Playwright audit: 23/23 buttons = 10px,
0 sharp (was 15×10 + 8 sharp). (2) SIDEBAR — active nav item is the ONE purple accent
(soft fill + purple-muted label), not the white shadcn `default` variant; orange dot →
purple. (3) `/connectors` renders UNDER `AppShell` (same sidebar as the dashboard, with
Connectors active) — was standalone. (4) CONNECTORS endpoint reconciled to ONE canonical
`/v1/connectors`: renamed BFF `app/v1/integrations`→`app/v1/connectors`, client `BASE`,
forward to cloud `/v1/connectors` with a `/v1/integrations` fallback (404) so live
connectors survive cloud's parallel rename. Page loads live via `fetchConnectors` (not
stubbed). Verified shell dark+light.

**HONEST shadcn-vs-@hanzo/gui state.** The app is NOT on @hanzo/gui for chrome. It ships
`@hanzo/ui-shadcn@5.9.0` (aliased as `@hanzo/ui`) + Tailwind v4 — ALL chrome (buttons,
menus, sidebar, dialogs, header, composer) is shadcn primitives + Tailwind classes +
the globals.css token overrides. `@hanzo/gui@7.3.0` is installed and `GuiProvider` is
mounted app-wide but renders EXACTLY ONE surface: `components/usage/cloud-usage-panel`
(the @hanzo/usage panel). Conflict: not a hard runtime crash (the two layers are mostly
disjoint — shadcn paints everything, gui paints one panel), but a real THEME-MODEL
conflict — GuiProvider pins Tamagui's `t_dark` on `<html>` permanently while next-themes
independently toggles `.dark`/`.light`, forcing the `--background !important` workaround
and causing the `--surface-0`-stale-in-light landmine. It worsens as more gui surfaces land.

**Phased path to make buttons/menus/chrome truly @hanzo/gui (each phase green):**
- Phase 0 (DONE): CSS-token convergence — shadcn+Tailwind styled to the v2 @hanzo/brand
  tokens (layered blacks, purple accent, radii, register, one control spec). The button
  radius fix lives here (CSS, not gui).
- Phase 1 (~1–2d, medium risk): bring real `@hanzo/ui@8` into the tree ALONGSIDE shadcn —
  package.json `@hanzo/ui-shadcn: ^5.9.0` (real name) + `@hanzo/ui: ^8.0.7`; codemod the
  ~155 files importing primitives from `@hanzo/ui` → `@hanzo/ui-shadcn`; retarget
  `modularizeImports`. Now `@hanzo/ui` = the v8 product layer (on gui).
- Phase 2 (~1–2wk, per-surface): replace shadcn Button/Input/Select/Dialog/DropdownMenu/
  ContextMenu with `@hanzo/gui` primitives + the v8.0.7 menu primitive (portal-theme-safe,
  purple hover) the parallel agent is building. Surface order: composer → header → sidebar
  → dialogs → tables. THIS is where chrome becomes truly gui (Tailwind className → gui style
  props, file by file).
- Phase 3 (~0.5d): sync GuiProvider's Tamagui theme to next-themes so there's ONE theme
  controller — removes the `--background !important` + `--surface-0` workarounds.
- Phase 4 (~2–3d): rip Tailwind once shadcn + utility classes are gone from chrome.
Total ~3–4 weeks phased. NEVER hard-fork brand token values.

### Iteration 5 (2026-07-25) — Phase 3 DONE (theme controller) + v8 menu blocker

**Phase 3 landed + verified.** `app/providers.tsx` now has a `GuiThemeBridge`: it reads
next-themes' `resolvedTheme` and drives `GuiProvider`'s `defaultTheme` dynamically (the
Tamagui `useRootTheme` pattern), replacing the permanently-pinned `t_dark`. The
`cloud-usage-panel` probe follows it too. **Verified live:** in light mode `<html>` now
carries `t_light` (was `t_dark`), body bg white — the Tamagui root theme FOLLOWS the app
theme, so every @hanzo/gui surface renders light-in-light / dark-in-dark. This is the gate
for adopting gui components.

The `--background !important` assertion STAYS (reframed, not removed): Phase 3 killed the
t_dark PIN, but Tamagui's theme still sets its own `--background` (light #f7f7f7 / dark
#141414) and its runtime-injected CSS wins source-order (empirically verified: removing the
assertion → bg becomes #f7f7f7/#141414). The v2 spec wants #080808 layered blacks + pure
white, so re-asserting `--background` per theme is now a deliberate token-value precedence,
not the old pinning hack. (Same reasoning would apply if we consumed more Tamagui surface
tokens — bind theme-critical bg to `--background`.)

**v8 menu (@hanzo/ui@8.0.7) — BLOCKED on a real package-integration issue, reverted.**
Attempted to adopt the portal-theme-safe `DropdownMenu` from `@hanzo/ui/product` (added a
temp `@hanzo/ui8` alias + `@hanzo/data` peer + Next transpile config). Build fails:
`Module parse failed: Unexpected token` at `export { Donut as DonutRing, type DonutSegment }`
in `@hanzo/ui@8.0.7/src/product/index.ts`. Root cause: **v8 ships RAW `.ts` `'use client'`
modules using `export { X, type Y }` inline-type syntax; Next 16's flight-client loader
chain (`next-flight-client-module-loader` → `next-swc-loader`) processes them WITHOUT TS
transpilation and webpack's JS parser rejects the inline `type`.** The flight loader
preempts the app's custom swc-loader rule, and `transpilePackages: ['@hanzo/ui8']` did not
fix it. Blocker fix is Phase-1 / package-owner scope: **v8 must ship a COMPILED dist**
(tsup/tsc — no raw-`.ts` `'use client'` at the consumer), OR a Next transpile path that
handles v8's client modules. Until then the gui menu cannot be adopted here. Phase 3 (the
theme controller) is done and independent — the menu unblocks the moment v8 ships dist.

### Iteration 6 — the console dock (the footer became a handle)

The bottom strip was a plain `<footer>`: it painted state and nothing else, so
there was no way to discover — let alone perform — a resize. It is now
`components/editor/console/`, a dock whose BAR is that same status strip:

- **One height, no `expanded` flag** (`console/dock.ts`). `open = height > BAR`,
  so a dragged size and a toggled state cannot disagree. `restore` remembers the
  last height the dock stood open at — read only while collapsed — which is what
  a click reopens to (never a hardcoded default). Persisted under one key,
  `hanzo.console`, so the size survives navigation. Every gesture funnels through
  `resolveHeight`: at or below `COLLAPSE_AT` it closes, otherwise it is clamped
  into `[MIN_OPEN, 70% of viewport]` — so it can never be dragged into a sliver.
- **One gesture, two meanings.** A pointer that moved is a resize; one that did
  not is a click. Starting collapsed, a drag begins at `MIN_OPEN` so the first
  pixel upward opens the dock and then tracks the cursor 1:1 (no dead travel).
  Arrow keys nudge, shift-arrow by four, Enter/Space toggles.
- **No verb on the bar.** No "Open", no "Hide" — the row-resize cursor, the grip
  that fades in on hover/focus/drag, and the click ARE the affordance. Screen
  readers get a named `role="separator"` carrying `aria-expanded` +
  `aria-valuenow/min/max`, which cannot go stale the way a word would.
- **Far right: the workspace controls.** The chat/AI panel toggle moved OFF the
  header onto this bar (same handler, same icons), next to the dictation mic.
  They are absolutely positioned OVER the separator so the drag target underneath
  stays one uninterrupted strip, and the status readout is `pointer-events-none`
  for the same reason.
- **The mic moved too**, and there is still exactly one of it. `ask-ai/dictation.ts`
  is the seam: the composer registers where a transcript lands, the mic delivers
  one. The mic is an input DEVICE (chrome); the prompt is a VALUE (the composer).
- **Real content**: `console/capture.ts` patches the preview iframe's `console`
  plus `error`/`unhandledrejection`. The preview is double-buffered and rewrites
  `srcDoc` mid-stream, so it re-patches on every frame load — caught by listening
  for `load` in the CAPTURE phase on `document` (load does not bubble, but it does
  capture), which keeps `preview/` unaware this panel exists.

Monochrome throughout except the pre-existing accent "live" dot and `destructive`
for error lines (console output is content, not chrome). Contract tests:
`tests/unit/console-dock.test.tsx`.
