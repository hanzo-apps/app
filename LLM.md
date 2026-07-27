# hanzo.app — the build surface

AI-driven web app builder: Next.js 15.5 / React 19 / TypeScript, with the
generated preview at `/dev`. Stack, scripts and layout are in `package.json`
and the tree — this file carries only what those cannot tell you.

Data plane: Hanzo Base (SQLite) locally, cloud `/v1/` APIs as the source of
truth for shared state. Never Redis; Hanzo KV if a key/value store is needed.

Telemetry: `@hanzo/event` is the ONE client — pageviews, product events AND
errors go to `POST api.hanzo.ai/v1/event`, fanned out server-side to the web,
product and error lenses. It subsumes `@sentry`; there is no separate DSN.
Wired in `components/providers/analytics.tsx`.

Directory notes load on demand: `components/landing/CLAUDE.md` for the
marketing landing, `components/editor/CLAUDE.md` for the `/dev` builder chrome
and the design-token convergence.

### Local-dev landmine: `react-resizable-panels` shim (dev-only crash)

`next.config.js` aliases `react-resizable-panels` → `lib/shims/react-resizable-panels.js`,
but the shim does `export … from 'react-resizable-panels'` — the alias re-catches
the shim's own import, so it re-exports **itself**. In `next dev` (webpack HMR
harmony getters) this recurses → `RangeError: Maximum call stack size exceeded`
on EVERY route through the layout (500). The **production** build/`next start`
does NOT crash (webpack resolves the circular re-export to `undefined` bindings
instead of recursing — which is why live 1.42.x works), but Panel/Group/Separator
from the shim are effectively `undefined` in prod too. The installed real package
is v4.7.4 which already exports `Group`/`Panel`/`Separator` natively, so the shim
is largely obsolete. To fix properly: alias only the exact bare specifier
(`react-resizable-panels$`) to the shim and have the shim re-export from a
sentinel (`react-resizable-panels-real$` → `require.resolve('react-resizable-panels')`),
never from the bare specifier. Until then, verify the landing via
`next build && next start` (production), not `next dev`.

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

