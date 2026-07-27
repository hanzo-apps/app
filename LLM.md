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

### The `react-resizable-panels` shim (fixed — keep it, keep it exact-match)

`next.config.js` aliases the bare specifier `react-resizable-panels$` →
`lib/shims/react-resizable-panels.js`. The shim exists because `@hanzo/ui`'s
`resizable` module imports the **v2** names `{ Panel, PanelGroup,
PanelResizeHandle }` while the installed package is **v4.7.4**, which exports
`{ Panel, Group, Separator }`. Nothing in the app imports the package directly,
but the `@hanzo/ui` barrel pulls that module in — so the bare specifier must
resolve to something carrying BOTH name sets. **The shim is load-bearing; do
not delete it.**

It used to re-export from the bare specifier, which the alias caught again and
pointed back at the shim — it re-exported *itself*: infinite recursion in
`next dev` (`RangeError` on every route) and silently `undefined` bindings in
the production build. Two things keep that from coming back, and
`tests/unit/resizable-shim.test.ts` fails if either is undone:

1. the shim imports the `react-resizable-panels/dist/…` **subpath**, never the
   bare specifier, and
2. the alias key is **exact-match** (`…$`), so only the bare specifier is
   caught and the shim's own subpath import reaches the real package.

Note that the builder's own resizers (the chat/preview splitter and the console
dock) are hand-rolled pointer handlers — they do not use this package at all.

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

