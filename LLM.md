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

- **`group` collapses content-sized elements.** The prop emits
  `container-type: inline-size` (for `$group-<size>` container queries), and a
  container-query container cannot size itself from its contents — so a group'd
  pill/chip/button collapses to bare padding (~26px) with the text overflowing.
  This app uses group for STATE only (`$group-hover/press/focus`, descendant
  selectors), so `assets/globals.css` neutralizes the containment app-wide
  (`.t_group_true { container-type: normal }`). If a `$group-<size>` query is
  ever needed, scope it deliberately — don't delete that rule wholesale.
- **Numeric `lineHeight` is pixels** (`lineHeight={1.5}` → `1.5px`, lines stack
  on each other). Always the string form for multipliers: `lineHeight="1.5"`.
- **`$color` is the foreground** (white in dark). Never a container background —
  surfaces are `$color2/3/4`, alphas `$color005…$color06` for outline chrome.

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

**Numeric `lineHeight` renders as PIXELS, and that is not new.** ~75 call sites
write `lineHeight={1.625}` expecting the CSS unitless multiplier; Tamagui emits
`_lh-1--625px{line-height:1.625px}`. Worth fixing — but fix it as its own piece
of work, and do not bill it to a gui bump. Measured on both sides of 7.3.1 →
8.0.1: the served landing page carries byte-identical rules, and its whole style
sheet differs by exactly one ADDED rule (`_pointer{cursor:pointer}`), 205 → 206,
none removed or changed. `styleCompat: "web"` does not govern this. The obvious
guess — that the 8.x `styleCompat` flip caused it — is wrong, and confirming it
costs one baseline build.

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



### A refusal is not an outage — `lib/gateway.ts`

The gateway states a reason when it refuses, and every route used to read it
into a `detail` local and drop it: 401 and 403 both collapsed into
`{ openLogin: true, message: "Sign in to build" }`, everything else became a 502
the builder renders as "unavailable — try again in a minute". So a revoked key
read as an outage. The platform owner spent an afternoon waiting for a healthy
service while his key had simply been replaced — the gateway had said exactly
that, naming the key prefix and the mint URL, and we threw the sentence away.

`refusal(status, detail)` is the ONE translation. It returns an envelope and a
status, never a Response, so each route keeps its own headers and the mapping
stays a pure function the tests read directly:

- **401 — the credential.** A JWKS-verified session (`lib/iam.ts`, `exp`
  honored) is what got the request to the gateway at all, so signing in again
  changes nothing; what was rejected is the credential behind the session.
  Never `openLogin` here — that loop IS the time-waster.
- **403 — permission.** Real credential, healthy service, this identity is not
  allowed. Retrying cannot help, so it never suggests it.
- **402 — credit.** Keeps `needCredits` so the usage modal still opens.
- **anything else — the service.** The only case where "try again" is honest,
  and the only user of `UNAVAILABLE`.

`openLogin` still belongs to the genuinely-unauthenticated case, which each
route checks before it ever calls the gateway. Those two conditions sharing one
response was the whole bug.

`reason()` is strict JSON (`msg`, `error.message`, `error`, `message`) and
returns `""` for an HTML error page — dumping markup into a toast is worse than
the honest generic. It redacts `hk-…` to a prefix at the boundary rather than
trusting every upstream to have been careful, and caps at 300 chars.

`useCallAi` imports the same `UNAVAILABLE` string so both sides of the boundary
say it in one voice, and no longer toasts errors itself — `ask-ai`'s
`handleError` already toasts every result exactly once, so the hook doing it too
was two toasts per failure.

### The 8.x line, resolved

The two-runtime landmine that used to live here is closed: the app runs
`@hanzo/ui@^8.0.55` on `@hanzo/gui@^8.1.0`, ONE shared gui runtime (app and
`@hanzo/ui` resolve the same physical path — verified), and
`pnpm install --frozen-lockfile` passes at HEAD. If a fresh install produces
two `@hanzogui/*` trees, that is a regression, not the documented state.

### The token layer arrives from the package, in one import

`app/layout.tsx` imports **`@hanzo/ui/theme.css`** — @hanzo/design's whole
sheet, this package's remainder and `glass.css` composed into one file. It
replaced the material-only `@hanzo/ui/glass.css` import and the twenty-odd
semantic names `assets/globals.css` used to declare beside it, which had
drifted from canon on every one: ground `#080808` vs `#0a0a0a`, foreground
`#ededed` vs `#fafafa`, popover LIGHTER than card, a solid `#262626` hairline
where design's border is alpha, an opaque ring, and @hanzo/brand's radius ramp
a full rung low because nothing challenged it. **Do not re-declare a name
design publishes.** What globals.css still owns is what design does not ship:
`--focus-ring`/`--focus-edge` and `--tint`.

`html.dark { --background: … !important }` is gone with it. It existed because
gui's generated theme declares `--background` at bare `:root`, ties design on
specificity and wins on load order — `scripts/gen-gui-css.mjs` now drops the
names design owns out of gui's root themes (the same prune @hanzo/ui runs on
its own sheet), so design's value simply resolves. **Regenerate `app/gui.css`
after any `@hanzo/ui` bump** (`node scripts/gen-gui-css.mjs`): it is a build
product of `lib/gui.ts`, and a stale one silently keeps the old theme.

The elevation ladder owns `--glass-shadow-1/2/3` (declared per canvas upstream
since 8.0.52) — glass rules never read brand's generic `--shadow-*` names;
`tests/unit/glass.test.ts` bites on exactly that.

### Focus is decided in ONE place, and it is not a prop

`assets/globals.css` states the whole law: a link/button/`[role=button]`/
`[tabindex]` rings (`2px solid var(--focus-ring)`, offset 2), a text field
brightens its own edge and draws no ring, and a `[data-field-box]` — a box whose
field has no edge of its own, the composers and the search rows — lights up on
`:focus-within`. All three are anchored on **`html:root`**, and that is
load-bearing: `:is(a, button, …):focus-visible` is (0,2,0), a dead tie with
every atomic class gui compiles, decided by load order, and `gui.css` is
imported last. gui therefore won, and the way each author silenced gui's own
outline was `focusVisibleStyle={{ outlineWidth: 0 }}` on the element — which
does not restore the rule, it deletes the indicator. That reached 37 call sites,
eleven in the builder chrome. **Never write that prop.** If a control rings
wrongly, the answer is in globals.css or in `@hanzo/ui`'s gui theme, never at
the call site.

Measured by tabbing every focusable control on `/` — live production before,
local build after:

| indicator | before | after |
|---|---:|---:|
| a real ring (`2px`, `--focus-ring` or the old opaque `--ring`) | 23 | 83 |
| `0px` — the rule's colour resolved, its width suppressed | 56 | 0 |
| `2px rgba(69,69,69,.6)` — present, ~1.4:1, invisible | 11 | 0 |
| the box rings instead (`[data-field-box]`) | 0 | 2 |
| **controls with no visible indicator** | **67 of 90** | **0 of 85** |

(The commit that landed this said "48 of 85" for the before column. That number
was never measured — the real one is 23 of 90, above. The counts differ by five
because the landing page gained controls between the two measurements.)

### Work items live in the cloud tracker, and "task" is the wrong word

`/dev/:org/:project/issues` is the project's board. It stores NOTHING: rows come
from cloud `/v1/tracker` through the same-origin BFF at `app/v1/tracker`, which
is `proxy()` plus a prefix.

The name matters, because three planes are easy to braid and cloud
`apps/tracker/contract.go` is law about it. A **tracker Issue** is the ONE
work-item primitive — the thing a human moves across a board. **hanzoai/tasks**
is durable async EXECUTION, a different plane entirely. And the hanzo-mcp
`tasks` tool is a private todo file on disk. So this surface is called Issues
end to end, and the MCP tools are `tracker_*` — naming any of it "tasks" points
the next reader at one of the two planes that cannot answer the question.

Two rules the types cannot state:

- **An agent's run is a SESSION, not a "mission".** Nothing in the fleet models a
  mission; `/v1/agents/sessions` (status `running|paused|done|error`) is the
  agent-run plane, and "mission-control" is only an informal name for the console
  over it. An issue points at one through `extRef`, which the tracker contract
  already defines as "a link INTO another plane", using the anchor
  `session:<id>` (`sessionRef`/`refSession` in `lib/api/tracker.ts`). No new
  column, no metadata bag. The board joins the two planes in ONE extra request
  and renders status inline — never one lookup per row.
- **A project slug and a board key are different alphabets** (`my-site` vs
  `^[A-Z][A-Z0-9]{1,7}$`), and there is no total function between them — four
  leading characters collide constantly. So the app never DERIVES the mapping: it
  lists boards and matches key-then-name (`boardFor`), which is why both
  `/dev/acme/ENG/issues` and `/dev/acme/my-site/issues` open the same board.
  `proposeKey` mirrors cloud's own `deriveKey` for the create form's prefill
  only, and widens the one-character case that cloud's regex would refuse.

Tenancy is never ours to assert: cloud `middleware_identity.go` STRIPS every
client-supplied authority header and re-mints `X-Org-Id` from the validated
bearer, so the BFF forwards the token and nothing else.
