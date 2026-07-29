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

### Two packages, two names

`@hanzo/ui-shadcn@5.9.x` is the Radix/Tailwind library this app's chrome is
built from. It used to be installed under the alias `"@hanzo/ui":
"npm:@hanzo/ui-shadcn@^5.9.0"`, which spent the name that belongs to the real
`@hanzo/ui@8+` — the one canonical library, built on `@hanzo/gui`, where the
chat shell lives. The alias is gone; each package now goes by its own name, so
an app file can import BOTH.

`@hanzo/gui` is already mounted app-wide (`app/providers.tsx` wraps the tree in
`GuiProvider`), so a `@hanzo/ui@8` component costs only its own bytes — the
Tamagui runtime is already paid for on every route. Measured by building
`app/chat/page.tsx`'s composer against `@hanzo/ui@8.0.29`: **+9,427 raw /
+4,941 gzip** over the whole client bundle, landing in ONE 14,623 / 5,703 chunk,
with no `tailwind-merge` and no Radix added. Importing `Composer` alone left
`Thread` and `Message` out of that chunk, so the `./chat` subpath tree-shakes.

That adoption is NOT in the tree: `@hanzo/ui@8.0.29` is the first version with
`./chat`, and npm still serves 8.0.28. Adopting it means one dependency line and
one import — do not re-derive it, and never pin a `file:` tarball (that is what
made `origin/blue/gui-migration` unmergeable).

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
a release. The transpile list lives in `./transpile.js` because `jest.config.js`
needs the same array; one list, so build and tests cannot disagree.

### The `react-resizable-panels` shim (fixed — keep it, keep it exact-match)

`next.config.ts` aliases the bare specifier `react-resizable-panels$` →
`lib/shims/react-resizable-panels.js`. The shim exists because
`@hanzo/ui-shadcn`'s `resizable` module imports the **v2** names `{ Panel,
PanelGroup, PanelResizeHandle }` while the installed package is **v4.7.4**,
which exports `{ Panel, Group, Separator }`. Nothing in the app imports the
package directly, but the `@hanzo/ui-shadcn` barrel pulls that module in — so
the bare specifier must resolve to something carrying BOTH name sets. **The
shim is load-bearing; do not delete it.**

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

