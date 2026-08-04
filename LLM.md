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
a release. The transpile list lives in `./transpile.js` because `jest.config.js`
needs the same array; one list, so build and tests cannot disagree.

### The `react-resizable-panels` shim (GONE — do not restore it)

There used to be a shim, a webpack alias pointing at it, a test guarding it and
a dependency under it. All four served exactly one consumer: `@hanzo/ui-shadcn`'s
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

