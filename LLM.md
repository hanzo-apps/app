# hanzo.app — the build surface

AI-driven web app builder: Next.js 16 / React 19 / TypeScript, with the
generated preview at `/dev`. Stack, scripts and layout are in `package.json`
and the tree — this file carries only what those cannot tell you.

Typecheck is `pnpm typecheck` → plain `tsc --noEmit`, and CI runs the same
two gates (`tsc --noEmit`, `pnpm test`) — an earlier `tsgo` experiment is gone
from the scripts; if a doc or agent still says tsgo, the scripts are the truth.
It is not a build gate: `typescript.ignoreBuildErrors` is on. Lint runs eslint
9 (`pnpm lint`, exit 1 = findings, exit 2 = crashed) — eslint 10 is
uninstallable until `eslint-plugin-react` ships support; ~336 real errors
(mostly react-hooks 7 compiler rules) are tracked backlog, so there is no lint
CI gate yet on purpose.

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

- The field emits text as well as an event. Prefer `onChangeText={(t) => …}` —
  it hands you the string instead of an event to dig through — but **`onChange`
  fires too, so that is a preference, not a bug report.** This line used to say
  the DOM spelling "never fired"; measured at `@hanzo/ui@8.0.69`, both fire on
  `Input` and on `Textarea`, because gui renders a real `<input>` on web and
  forwards the handler. **70 call sites here use `onChange`; they work. Do not
  sweep them.** `tests/unit/field-change.test.tsx` pins it, because the failure
  would be invisible: a gui bump that stopped forwarding breaks no build, raises
  no type error and throws nothing — 70 fields would just quietly stop accepting
  input. (Six handlers really were dead once, in a different since-fixed shape.
  Trusting that sentence at face value nearly bought a pointless 70-file
  refactor — measure the claim before acting on it.)
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

### The left panel has ONE glyph, and a shortcut is not a keycap

Two chrome laws this app shares with hanzo.chat rather than decides for itself.
Both are stated where they apply and pinned by `tests/unit/panel-affordance.test.ts`;
this is only the pointer.

**`PanelLeft`, open or shut, everywhere a column on the left shows and hides.**
The rule is written into hanzo.chat's own copy of the mark
(`packages/client/src/svgs/Sidebar.tsx` — "Unified across hanzo.chat, hanzo.app,
and hanzo console so the open/close affordance is the SAME icon everywhere"), and
this app had three answers at once: `PanelLeft` alone in the sidebar, a
`PanelLeft`↔`PanelLeftClose` swap in the builder console and on `/chat`, and the
Hanzo mark standing in for the toggle on the collapsed rail. Two of them were
visible together — on `/chat` the shell's toggle and the conversation rail's sit
~330px apart and wore different shapes. State belongs to `aria-expanded`; a
second glyph says nothing extra and costs the eye a shape to re-learn.

**One glyph means one SIZE too: 16.** The builder console was the last 14
(`components/editor/console/index.tsx`) against 16 at every other call site.

**An icon-only Button must say `size="icon"` — a padding prop CANNOT do it.**
`@hanzo/ui` sets a Button's horizontal padding from
`[data-variant][data-size]:not([data-size^="icon"]):not([data-slot="item"]) {
padding-inline: .75rem }`. That is (0,3,0), and every style prop gui compiles is
an atomic class at (0,2,0) — so the rule wins whatever the call site writes.
Measured: `paddingHorizontal={0}` on the collapsed rail's toggle emitted
`_pl-0px _pr-0px` and lost, leaving 36 − 12 − 12 − 2px of border = a 10px content
box, which rendered a 16px `PanelLeft` at 10×16 on the ONE affordance the rail
has. The `:not([data-size^="icon"])` in that selector IS the library's contract:
declare the button an icon button and the padding is `0` by design. Reach for
`size="icon"`, never for a padding override — and if a box looks wrong and no
prop moves it, check specificity against `@hanzo/ui`'s own sheet before assuming
the prop is unsupported.

**This rule was written here and then lost twenty times, so it is now checked**
(`tests/unit/icon-button.test.ts`). The worst of the twenty was on the FIRST
screen a visitor sees: the hero's replay control declared `width={22}`, kept the
24px it could not refuse, and rendered its icon at **0×0** — a control with
nothing in it. Nothing errored, nothing typed wrong, the build was green. The
comparison arrows declared 36 and drew a 10px glyph in it.

Two things the test had to get right, both of which cost a wrong answer first:

- **The scanner is brace- and quote-aware.** `onClick={() => run()}` contains a
  `>`, so a regex that takes the first `>` as the tag end stops mid-props. That
  version missed a third of the call sites — including every one on the landing
  page — and would have shipped a guard that certified the bug.
- **`size="icon"` is a FLOOR (30), not a box**, like every `@hanzo/ui` size. The
  hero's mock browser chrome is drawn at 22, so those three controls are 22×30
  rather than square. The icon is visible, which is what was broken; the row's
  ground is transparent at rest, so the extra 8px shows only under a pointer.

Eleven call sites are deliberately exempt and the test names each with its
reason: seven render two glyphs side by side (an icon plus a close ✕) and are
tabs, not squares — `size="icon"` would squash them; three carry a text label;
one is a switch track.

**A tap target is a BOX, and the floor applies to the smaller side.** The
`@media (pointer: coarse)` rule in `assets/globals.css` set `min-height` alone,
and the deploy gate (universe `charts/app/templates/e2e-gate.yaml`) checked
`r.height` alone — so rule and check agreed with each other and were both wrong.
Six routes reported clean over four controls measuring 22, 28, 36 and 39 wide:
the brand mark, the composer's mic and send, and a filter chip. Both assert
`min(width, height)` now, `tests/unit/touch-target.test.ts` pins the CSS half,
and the gate's failure line prints the box rather than one number.

The `!important` on that rule is load-bearing and is the reason it is pinned:
`size="icon"` writes its floor INLINE, which beats a stylesheet rule on the same
property whatever the specificity (the collision `.t_group_true` needs it for).
Without it the rule is a silent no-op on exactly the controls it exists for.

Corollary for the composer: its two action controls are ONE box at 36. The mic
comes from `@hanzo/voice` at 28 and the send from the icon floor at 36, so they
sat 8px apart in one row. 36 is this app's icon box — Lovable's 32 is
unreachable without either dropping `size="icon"` (which the test above forbids)
or overriding the library's floor, and inventing a third authority for one box
is worse than a 4px delta.

**A `<kbd>` is a hint, not a keycap** — one element rule in `assets/globals.css`,
`var(--text-tertiary)` + `var(--text-xs)`, no box. Same shape hanzo.chat draws
(`DropdownPopup.tsx`), and the colour and size come from `@hanzo/ui/theme.css`,
the token layer both surfaces already import, so the two mute a hint by the same
rung rather than by two similar numbers. **It carries no `margin-left: auto`.**
That declaration used to sit here as the "label left, shortcut right" law, and it
decided nothing: measured used value at all three call sites is 4px / 0px / 0px,
each produced by the row itself — `.hs-kbd`'s own `margin-left: 4px`, the sidebar
row's `flex: 1` label, and the palette hint's content-sized XStack. A global
element rule that governs only layouts nobody has written yet is a liability, not
a law; alignment belongs to the row that has the space to give.

The icon library needs no decision: both surfaces are already lucide (this app
`lucide-react` direct, chat the same package plus the gui-wrapped
`@hanzogui/lucide-icons-2`), so parity here is a matter of picking the same
NAMES, never of adding a dependency.

### The release lane: two things that stop an image existing

`.hanzo/workflows/release.yml` builds **`Dockerfile.production`** (not the root
`Dockerfile`, which nothing references, nor `docker/Dockerfile`, which is
compose's), then moves the universe pin through `charts/app/pin.sh`.

- **`patches/` must be copied with the manifest.** `package.json`'s
  `pnpm.patchedDependencies` names a file inside it and pnpm hashes that file
  during RESOLUTION, not at a later patch step. From `167cb522` (when the first
  patch landed) every build died at `pnpm install` with `ENOENT … open
  '/app/patches/@hanzo__ui@8.0.70.patch'`, exit 254 — and the `test` job runs
  separately and stayed GREEN, so each run showed a passing gate beside a red
  build while main kept moving and no image was cut for a day.
- **There is no version write-back, and no version-drift gate.** Both are
  deleted. The number is DERIVED — `scripts/version.sh next` scans git tags union
  the container tags and reads `package.json` as nothing — so main never held the
  floor, only a copy of it. Keeping that copy honest needed a push to a protected
  branch, which the forge refuses for the Actions token, so a release that had
  already built, pushed, tagged and pinned its image still ended RED. One source
  (the stream), no copy, nothing to keep in sync.
  `release.yml` still STAMPS the derived number into the build context, because
  `lib/version.ts` reads `pkg.version` for the sidebar and about modal. That is a
  display string written downstream of the derivation, never an input to it.
- **`[skip ci]` works, and a run on your sha is not proof it did not.** The
  forge honours `[skip ci]` / `[ci skip]` / `[no ci]` / `[skip actions]` on
  **push and pull_request only** — that is upstream's rule, and correctly so: a
  `workflow_dispatch` or a `schedule` is someone asking on purpose, not your
  commit. Both also fire against the branch tip, so they carry YOUR sha and read
  exactly like a push you thought you had skipped.
  Check the event, not the sha:

      kubectl -n hanzo exec sql-0 -- psql -U hanzo -d git -tAc \
        "SELECT substring(r.commit_sha,1,8), r.event, r.trigger_event
           FROM action_run r JOIN repository p ON p.id=r.repo_id
          WHERE p.owner_name='hanzo-apps' AND p.name='app'
          ORDER BY r.id DESC LIMIT 10;"

  Measured this way: two `[skip ci]` commits produced ZERO runs of any kind and
  a third produced zero PUSH runs. `paths-ignore: ['**.md']` holds too.

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

### The ten dependabot alerts: transitive, and none reachable

Every push prints "10 vulnerabilities (7 high, 3 moderate)". Triaged
2026-08-08 — **not one is a direct dependency and not one is imported by this
app.** `sharp`, `image-size`, `postcss`, `nanoid`, `brace-expansion` and
`@hey-api/openapi-ts` appear nowhere in `app/`, `lib/` or `components/`; they
arrive under `next@16` and build tooling.

The only one with a runtime path is **`sharp` (libvips CVEs), reached through
`next/image` — and `next.config.ts` sets `images: { unoptimized: true }`, so
nothing passes through the optimizer.** That line is load-bearing for this
triage: turning optimization on puts attacker-influenced bytes into a
vulnerable `sharp 0.34.5`, so treat it as a security decision and not only a
performance one. (The `remotePatterns` beside it are dead config — they are
only consulted when optimization is on.)

`postcss` runs at BUILD, over CSS from this repo. Generated sites never touch
it: the builder renders one self-contained HTML document in an iframe and
publish writes static bytes to S3, so no user CSS reaches the toolchain.

So the alerts are real and the exposure is nil. Fixing them means pnpm
`overrides` on packages we do not use, which risks the build for no gain —
they clear when `next` bumps. **Re-check the reachability, not the count**: the
number will keep climbing, and the question that matters is whether anything
here imports one, or whether `unoptimized` ever flips.

### The sandbox is a working copy, and git.hanzo.ai is the only git

A Code turn is a `dev` process inside a gVisor pod, and for a long time that pod
was a shadow of the forge rather than a clone of it. `openSandbox` never cloned,
so the agent's first run on any project started in an EMPTY directory;
`runHarness` never committed, so the work stayed on the released volume and
reached git.hanzo.ai never. What the history panel drew was the browser
rebuilding a checkout it could not see, out of the `done` event's file list.

Three files carry the fix and nothing else needs to know:

- **`lib/agent/checkout.ts`** — the two verbs that bracket a turn. `checkout()`
  clones the project's repo into the pod (guarded by `[ -d .git ] ||`, because the
  volume re-attaches and a re-clone would throw away `node_modules`); `land()`
  adds, commits, fetches, rebases and pushes. Both answer with a SENTENCE, empty
  when nothing is wrong.
- **`openSandbox({ repo })`** does the first, so every door into a project's pod
  — the agent and the terminal — gets the project. **`runHarness({ repo })`** does
  the second, after `dev` exits 0.
- **`lib/git/forge.ts`** owns the credential. `forgeRemote()` hands back a CLEAN
  url plus the `git credential-store` line separately, and the line travels on the
  command's **stdin** (`Sandbox.exec`'s third argument → cloud's `RunIn.Stdin`).
  Cloud has no env field on `/run` and `sh -c` puts a command in the pod's process
  table, so stdin is the only channel a secret may take. Nothing puts a token in a
  URL: it would land in `.git/config` and in every error git prints.

Consequences worth knowing before you touch any of it:

- **The commit is the record; the `done` event is a display.** A harness run emits
  `files: []` and only `changed`. The browser takes files up ONLY when the run was
  not durable (`components/editor/ask-ai/index.tsx`) — an in-memory run is the one
  case where the tab holds the only copy. Feeding a durable run's files back into
  `pages` is what committed `.tsx` and `.json` as HTML pages.
- **`land` rebases before pushing.** `/v1/git/native` (autosave) commits the
  browser's pages to the SAME repo, so a project used in both modes has a branch
  that moved under the pod's clone; a straight push is a non-fast-forward.
- **`.git/info/exclude`** is written at checkout with `node_modules`, `.next`,
  `dist`, … — `git add -A` takes everything, and a browser-built project's repo has
  no `.gitignore` at all, because its pages went through the forge API and never
  through a git client.
- **One backend.** `lib/git/sync.ts` is the export path to somebody ELSE's forge:
  `PushOptions.provider` is `Exclude<GitProvider, 'hanzo'>` and the type is what
  keeps the second one from growing back. Publish (`/v1/git/sync` with
  `provider: 'hanzo'`) goes through `forge.ts` to `git.hanzo.ai/<user>/<slug>` —
  the same owner+slug the sandbox clones and `/v1/git/native` commits to. Owner is
  always the session's IAM username, never anything the browser names.
- **Still on `api.hanzo.ai/v1/git`:** the READ half in `lib/git/log.ts`
  (`listCommitsHanzo` / `getCommitHanzo`). It is unreachable — `/v1/git/commits`
  short-circuits `provider === 'hanzo'` to `forge.ts` before it — but it is still
  compiled and still tested by `tests/unit/git-log.test.ts`. Delete it and its
  tests together, or leave it alone; do not half-cut it.
