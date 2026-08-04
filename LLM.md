# hanzo.app — the build surface

AI-driven web app builder: Next.js 16 / React 19 / TypeScript, with the
generated preview at `/dev`. Stack, scripts and layout are in `package.json`
and the tree — this file carries only what those cannot tell you.

Typecheck is `pnpm typecheck` → `tsgo` (`@typescript/native-preview`, the Go
compiler). It agrees with `tsc` on every diagnostic this tree produces except
`TS2783` ("specified more than once"), which it does not implement yet — two
benign call sites in `components/table-of-contents`. It is ~8x faster, so it is
the one typecheck entry point; `typescript` stays installed because Next, ESLint
and `ts-node` each load it themselves. Neither is a build gate:
`typescript.ignoreBuildErrors` is on, and behind it sit ~676 real errors.

Data plane: Hanzo Base (SQLite) locally, cloud `/v1/` APIs as the source of
truth for shared state. Never Redis; Hanzo KV if a key/value store is needed.

Telemetry: `@hanzo/event` is the ONE client — pageviews, product events AND
errors go to `POST api.hanzo.ai/v1/event`, fanned out server-side to the web,
product and error lenses. It subsumes `@sentry`; there is no separate DSN.
Wired in `components/providers/analytics.tsx`.

Directory notes load on demand: `components/landing/CLAUDE.md` for the
marketing landing, `components/editor/CLAUDE.md` for the `/dev` builder chrome
and the design-token convergence.

### One library: `@hanzo/ui@8`

The chrome is `@hanzo/ui@8+`, the canonical library built on `@hanzo/gui`.
`@hanzo/ui-shadcn` (Radix/Tailwind) is GONE — 155 files moved off it. Do not
reintroduce it, and do not add Radix or `tailwind-merge` back alongside it.

`@hanzo/gui` is mounted app-wide (`app/providers.tsx` wraps the tree in
`GuiProvider`), so the Tamagui runtime is already paid for on every route and a
`@hanzo/ui` component costs only its own bytes.

**These are gui primitives, not DOM elements, and that difference is the whole
migration.** A prop that looks like an HTML attribute may not be typed, and one
that IS typed may not behave the way the DOM one does:

- The field emits **text**, not a change event: `onChangeText={(t) => …}`, never
  `onChange={(e) => e.target.value}`. The DOM spelling type-checked only while
  the package was declared `any`, and it never fired — six handlers in this app
  were dead code that way.
- Toast placement belongs to the `Toaster` viewport. There is no per-toast
  `position`.
- Web-only attributes (`title`, `type`, `indicatorClassName`) are declared on
  the components that spread them, from `@hanzo/ui@8.0.33`. If one is missing,
  widen the type in `@hanzo/ui` — do not work around it here, and never
  re-declare the package as `any`.

### The gui 8 line: two things moved, and only one is visible

`@hanzo/gui` 7.3.1 → 8.0.1 changed no export this app touches — the barrel, the
`GuiProvider` props, `@hanzogui/shell` and `@hanzogui/telemetry` are all
API-identical. Two packaging facts did change, and both are landmines:

- **gui no longer depends on `react-native-web`.** 7.3.1 declared
  `react-native-web: ^0.21.0`; 8.0.1 declares none, while ~44 of its own dist
  files still import it. This app therefore declares it directly, and
  `next.config.ts` resolves the alias from the APP, not through gui — the old
  `require.resolve(..., { paths: [guiPkg] })` throws outright on 8.x. Keep
  `react-native-web` in `dependencies`; it is not an incidental transitive.
- **`@hanzogui/config/v5` flipped `styleCompat` from `"react-native"` to
  `"web"`.** That is CSS flex semantics instead of Yoga's, and unitless numeric
  `lineHeight` instead of raw px. It is a silent default change reached through
  `@hanzo/ui/gui-config`, so nothing in this repo names it. If spacing or line
  height ever looks subtly wrong after a gui bump, look here first.

8.0.0 is uninstallable under strict pnpm (six gui packages statically import
siblings they never declared); **8.0.1 is the floor**. `@hanzogui/themes` stays
at 8.0.0 by design, so the `lux`/`zoo`/`pars` brand themes and the
`--hz-font-sans` typeface variable exist upstream but are NOT published — do not
build on them yet.

`@hanzogui/loader` (the renamed `hanzogui-loader`) is the webpack loader for the
gui optimizing compiler, consumed only by `@hanzogui/next-plugin`. This app uses
neither — plain `transpilePackages` — so it is not a dependency here.

That last rule has teeth: `@types/hanzo-ui.d.ts` used to declare every export as
`any`. "Zero type errors" then meant no types existed to check. Deleting it
surfaced 79 real errors, one of which was the dead-handler bug above.

### Five composers, five Enter rules

`components/editor/ask-ai` (the builder), `components/build-composer`,
`components/chat-panel`, `app/chat` and `app/new` each hand-roll Enter-to-send,
and they disagree: chat-panel needs Ctrl/Cmd+Enter, `app/new` accepts Cmd, Ctrl
OR bare Enter, the rest are Enter-unless-Shift. **None checks
`e.isComposing`**, so an open IME candidate — every Japanese, Chinese and Korean
user, mid-word — submits the turn instead of accepting the candidate. The fix is
`sends()` from `@hanzo/ui/chat`, which is one function with those cases already
covered; do not write a sixth copy here.

### ONE next config

`next.config.ts` is the only config. Next resolves `['next.config.js',
'next.config.mjs', 'next.config.ts']` in that order, so a `next.config.js`
silently wins and any edit to the `.ts` is a no-op — that happened, and it cost
a release. It then happened AGAIN in the other direction: a `next.config.ts` was
re-added beside the live `.js` and sat inert, missing the gui aliases, the
absolute `react-native-web` path and the annotate loader. Deleting the `.js`
without first moving those three into the `.ts` would have shipped a build that
compiles and then throws "Missing theme." at runtime. If you ever see two
configs, the `.js` is the one running — diff them before deleting either.

The transpile list lives in `./transpile.js` because `jest.config.js` needs the
same array; one list, so build and tests cannot disagree.

**That list is a transitive closure, and it has to be.** `@hanzo/gui` names 63
`@hanzogui/*` dependencies but reaches 99. `@hanzogui/web` is the proof: nothing
depends on it directly, `@hanzogui/spacer` pulls it in, and untransformed it
hands jest a bare `export *` that fails 18 suites. Do not compute this set by
reading `node_modules/@hanzogui` either — under pnpm that directory holds only
this app's two DIRECT gui deps, so a listing silently misses the other 97.

### The `react-resizable-panels` shim (GONE — do not restore it)

There used to be a shim, a webpack alias pointing at it, a test guarding it and
a dependency under it. All four are now actually gone; for a while only the shim
and its test were, and the alias sat in `next.config.js` pointing at a deleted
file with the dependency still installed under it. A webpack alias resolves
lazily, so a dangling one is invisible until something imports the specifier —
which is exactly why it survived. All four served one consumer: `@hanzo/ui-shadcn`'s
`resizable` module, which imported the v2 names `{ Panel, PanelGroup,
PanelResizeHandle }` from a package that had moved to `{ Panel, Group,
Separator }`. Nothing in this app ever imported it; the shadcn barrel pulled it
in.

That barrel is gone, so the chain lost its only consumer and became a closed
loop: an alias pointing at a shim, guarded by a test that tested the shim.
Deleted whole. The builder's own resizers (the chat/preview splitter, the
console dock) are hand-rolled pointer handlers and never used the package, so
nothing visible changed.

Recorded because the shape recurs: when a dependency's last real consumer
leaves, the scaffolding around it keeps passing its own tests and reads as
load-bearing. Check who imports it, not whether it is referenced.

Note: a local `next start` bounces anon users to IAM (`hanzo.id`/`console.hanzo.ai`)
because the prod build points auth at the in-cluster `iam.hanzo.svc` (unreachable
off-cluster). This is an env artifact — the live `/` is public (middleware treats
`/` as a public route). Block those hosts in the browser to verify below-fold
sections locally.

### Typography landmine: three packages claim `:root`, and Tamagui wins on proximity

`@hanzo/gui`'s provider wraps the whole tree in `<span class="_dsp_contents
font_body">` **inside** `<body>`, and Tamagui pairs `.font_body, .font_heading,
.is_View { font-family: var(--f-family) }` with a `:root .font_*` declaration of
`--f-family`. Inheritance follows proximity, so that one span silently beat
`<body>`'s Geist for every heading, paragraph and link — only elements that set
their own family (`button`, `code`/`pre`) kept the webfont. Separately,
`@hanzo/brand` ships `:root { --font-sans: 'Geist Sans', … }`, a family with no
`@font-face` at all: next/font generates `Geist` / `Geist Fallback`.

Next decides stylesheet order and puts both upstream sheets **after**
`assets/globals.css` (brand as its own chunk, gui as an inline `<style>`), so an
equal-specificity `:root` override loses. globals.css therefore anchors on
`html:root` (0,1,1 and 0,2,1) to outrank them, and points every token at
next/font's generated `--font-geist-sans` — never a literal family name, which is
what drifted in the first place. next/font's variables live on `<html>` for the
same reason: they are tokens and must resolve at `:root`.

Verify font work with CDP `CSS.getPlatformFontsForNode` (`familyName` +
`isCustomFont`) and `FontFace.status`. Never `document.fonts.check()` — it returns
true even on a page with zero `@font-face` rules, so it proves nothing.

