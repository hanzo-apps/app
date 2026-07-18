# APP-SHELL — the ONE cross-surface shell contract

**Status:** Authoritative. CTO-owned. Source of truth for chrome across the three
Hanzo product surfaces. Surface agents implement against this; they do not
redefine it. One and only one way.

**Surfaces**

| Surface | Repo | Framework | UI kit |
|---|---|---|---|
| hanzo.app | `~/work/hanzo/app` | Next.js 15 | `@hanzo/ui` |
| hanzo.chat | `~/work/hanzo/chat` | LibreChat fork (Vite/React) | `@hanzo/ui` + LibreChat |
| console.hanzo.ai | `~/work/hanzo/console` | Next.js | `@hanzo/gui` (Tamagui) |

**Design bar (Vercel head-of-design):** simplicity, consistency, monochrome
true-black matching hanzo.ai, content-forward — chrome recedes so the user's
AI-generated content (preview / chat / dashboard) is the star. Zero hue except
semantic (green live-dot, red destructive). No gradients in chrome. No wordmark
in the top-left. No fabricated data — honest empty states (`—`).

The reference implementation already exists: **`~/work/hanzo/app/components/editor/header/index.tsx`** (top-left)
and **`~/work/hanzo/app/components/editor/identity-bar/index.tsx`** (bottom-left).
Every surface converges to those two patterns. Do not invent a new system.

---

## 1. Shell anatomy

```
┌──────────────────────────────────────────────────────────────┐
│ [◈]  ·  <primary tabs / actions>            <cross-surface> │  top bar
│  ▲                                                            │
│  └ geometric HanzoLogo ALONE (animated), left-click → home,   │
│    right-click → app-shell context menu                       │
│                                                               │
│                    ⟨ CONTENT — the star ⟩                     │
│                                                               │
│  ┌─────────────────────────────────┐                         │
│  │ [org ▾] │ [avatar name ▾] │ [⚡wallet] │                   │  bottom-left
│  └─────────────────────────────────┘   menus open UPWARD     │  identity cluster
└──────────────────────────────────────────────────────────────┘
```

Two fixed anchors, nothing else competes for the corners:

- **Top-left** = brand + app-shell menu. Nothing else lives here.
- **Bottom-left** = ONE consolidated identity cluster (org · user · wallet).

Everything between recedes. The canvas is `#000`; panels barely lift.

---

## 2. Top-left — brand mark + context menu

**Contract**

1. Render the geometric **`HanzoLogo`** mark **alone**. No "Hanzo" wordmark, no
   "Dev" text, no version string, no product name in the corner. The mark is the
   brand; the surface is identified by its domain and its content.
2. Use the **`animated`** variant (subtle pulse). `text-white`, `w-8 h-8`,
   hover → `text-white/80`.
3. **Left-click → home/dashboard** (`/`). Wrap the mark in the surface's router link.
4. **Right-click → app-shell context menu** (Radix `ContextMenu`), exactly these
   items in this order:
   - label: current surface (`Hanzo`, `Hanzo Dev`, `Hanzo Chat`, `Hanzo Console`)
   - `Settings & preferences` → surface settings route
   - `Brand & assets` → `https://hanzo.ai/brand` (new tab)
   - `Docs` → `https://hanzo.ai/docs` (new tab)
   - separator
   - `About Hanzo` → `https://hanzo.ai` (new tab)

**Canonical mark:** `@hanzo/ui/assets` → `HanzoLogo` (`~/work/hanzo/ui/pkgs/ui/assets/hanzo-logo.tsx`).
Geometric 7-path origami mark, `viewBox="0 0 67 67"`, `fill="currentColor"`,
two accent paths at `opacity 0.85`. **This is the ONE brand mark for chrome —
never a bare letter "H", never the old white-rounded-square "HHH" glyph.**

**Gap to close in @hanzo/ui:** the published `HanzoLogo` has **no `animated`
prop**. The app's local copy (`~/work/hanzo/app/components/HanzoLogo.tsx`) added
`animated` (wraps the `<g>` in `animate-pulse`). Hoist that one prop into the
canonical `@hanzo/ui` `HanzoLogo` so every surface imports the same component
with the same API. After the hoist, the app deletes its local copy and imports
from `@hanzo/ui`. (DRY: two HanzoLogo definitions is one too many.)

**Context menu primitive:** `@hanzo/ui/context-menu` (Radix). App currently uses a
local `components/ui/context-menu.tsx` (shadcn copy) — acceptable, but prefer the
`@hanzo/ui/context-menu` export for parity. Console (Tamagui) implements the same
menu with its Popover/menu primitive — same items, same order, same behavior.

---

## 3. Bottom-left — consolidated identity cluster

**Contract**

ONE cluster, pinned bottom-left, identical placement + behavior on all three
surfaces. Left→right (or top→bottom in a vertical sidebar):

1. **Org switcher** — active org the surface is scoped to (X-Org-Id from IAM JWT
   `owner`, HIP-0111). Filter list, switch-in-place (persist + reload), create org.
2. **User / account menu** — avatar + name; menu has: identity header (name +
   email), Dashboard, Chat, Billing (with balance), Settings, separator, Sign out.
3. **Wallet** — network switcher + non-custodial wallet (injected EIP-1193), and
   the org-scoped credit balance (honest `—` when unknown), Top-up.

**Menus open UPWARD** (`direction="up"` / `side="top"`) — the cluster sits at the
bottom edge.

**Reference:** `~/work/hanzo/app/components/editor/identity-bar/index.tsx`
(`BuilderIdentityBar`) — composes `OrgSwitcher` + `EditorAccountMenu` +
`NetworkWallet`, all `direction="up"`. Its own doc comment names the chat and
console convergence targets. This is the canonical arrangement.

**Composed pieces (app):**
- `~/work/hanzo/app/components/org-switcher/index.tsx` — `OrgSwitcher({direction})`
- `~/work/hanzo/app/components/editor/account-menu/index.tsx` — `EditorAccountMenu({direction})`
- `~/work/hanzo/app/components/network-wallet/index.tsx` — `NetworkWallet` (`@hanzo/ui/network` + `@hanzo/ui/wallet`)

**Convergence targets by surface:**
- **app** → `BuilderIdentityBar`
- **chat** → `client/src/components/Nav/AccountSettings.tsx` (already bottom-left) +
  `NetworkWallet.tsx` (currently mis-placed top-right) + a NEW org switcher.
- **console** → `DashboardShell.tsx` `SidebarIdentity` + `OrgSwitcher` + `SidebarWallet`
  (already bottom-left, already consolidated — the maturity reference).

The three surfaces use different UI kits and different data hooks; that is fine.
What must be identical is **placement (bottom-left), order (org · user · wallet),
upward menus, and behavior**. Logic (`lib/org-scope`, balance hooks) is shared or
mirrored verbatim, never re-invented.

---

## 4. Theme — true-black monochrome tokens

**Canonical source:** `@hanzo/ui` → `~/work/hanzo/ui/pkgs/ui/style/hanzo-default-colors.css`,
selector `.dark, .hanzo-ui-dark-theme` (lines 87–146). Every surface consumes
these tokens; no surface hardcodes its own dark palette.

| Role | Token | OKLCH | Hex | Rule |
|---|---|---|---|---|
| Canvas | `--background`, `--sidebar` | `oklch(0 0 0)` | `#000000` | true black, matches hanzo.ai |
| Panel | `--card`, `--popover` | `oklch(0.06 0 0)` | `#050505` | barely lifts off canvas |
| Elevated / border | `--secondary`, `--muted`, `--border`, `--sidebar-border` | `oklch(0.205 0 0)` | `#171717` | interactive surfaces + hairlines |
| Input / accent | `--accent`, `--input` | `oklch(0.269 0 0)` | `#262626` | |
| Foreground | `--foreground` | `oklch(0.985 0 0)` | `#fafafa` | near-white text |
| Muted fg | `--muted-foreground` | `oklch(0.708 0 0)` | `#a1a1a1` | |
| Destructive | `--destructive` | `oklch(0.704 0.191 22.216)` | `#ff6467` | ONLY semantic red allowed |
| Live-dot | (semantic green) | — | green | ONLY semantic green allowed |

**Bug to fix in @hanzo/ui:** `--card` / `--popover` are currently
`oklch(0.045 0 0)` which renders as **pure `#000`** (invisible against the
canvas — panels don't lift). Bump to **`oklch(0.06 0 0)` (`#050505`)** so panels
read as a distinct layer. This is the single token defect blocking the ladder.

**Type system:** Basel Grotesk (Book 400 + Medium 500) for UI/body/display/heading;
Geist Mono for code/data. `font-synthesis: none` (never fake bold). Canonical
font wiring: `~/work/hanzo/ui/pkg/ui/... fonts` (`--font-basel-sans` /
`--font-geist-mono`). The app labels its Next font var `--font-basel-sans` but
currently loads **Geist**, not Basel — see per-surface table.

**Monochrome rule:** all decorative hues (blue/violet/teal/etc.) collapse to the
neutral grey ramp (chroma 0). The ONLY color in the entire shell is: green
live-dot (status) and red destructive. Any other hue in chrome is a bug. This
includes the onboarding gradient and any `chart-*` blue that leaks into chrome.

---

## 5. Cross-surface links

**Contract:** a project round-trips across all three surfaces by its **org-unique
slug**, carried as `?project=<slug>`. The org is derived server-side from the IAM
JWT owner claim (HIP-0111); it never travels in the URL. Slug grammar:
`/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/` — validate before reflecting into any
outbound link (no reflected XSS).

**Canonical URLs (the ONE set — do not fork):**

| From → To | URL |
|---|---|
| → app builder | `https://hanzo.app/dev?project=<slug>` |
| → chat | `https://hanzo.chat/c/new?project=<slug>` |
| → console | `https://console.hanzo.ai/?project=<slug>` |

**Reference:** `~/work/hanzo/app/components/editor/cross-surface-links.tsx`
(`chatProjectUrl` / `consoleProjectUrl` + the `CrossSurfaceLinks` component).
Compact icon links, shown only when a project is scoped, `target="_blank"
rel="noopener noreferrer"`.

**Divergence to fix:** chat and console currently point the app link at
`hanzo.app/dev?project=` while app's own `chatProjectUrl` uses `/c/new?project=`
and console uses `/?project=`. Standardize on the table above. All three surfaces
import the same helper shape; hoist the URL builders to a shared util
(`@hanzo/ui` or a tiny shared `cross-surface` module) so there is ONE definition.

---

## 6. Per-surface compliance

Legend: ✅ compliant · ◑ partial · ❌ divergent.

### hanzo.app

The app has **two shells**. The `/dev` builder header is the reference; the
legacy `sidebar/index.tsx` (gallery/dashboard/settings via `AppShell`) is not.

| Element | State | File | Note |
|---|---|---|---|
| Top-left mark (builder) | ✅ | `components/editor/header/index.tsx:47–71` | geometric `HanzoLogo` alone + ContextMenu + left-click home |
| Top-left `animated` variant | ◑ | `components/editor/header/index.tsx:51` | uses `HanzoLogo` but NOT `animated` — add `animated` |
| Top-left mark (legacy sidebar) | ❌ | `components/sidebar/index.tsx:361` | uses `ui/logo` "HHH" glyph + wordmark "Open Source Web Studio" + version; left-click toggles PIN, no context menu |
| Bottom-left cluster (component) | ✅ | `components/editor/identity-bar/index.tsx` | `BuilderIdentityBar` fully composed, `direction="up"` |
| Bottom-left cluster (WIRED IN) | ❌ | `components/editor/index.tsx:239` | builder still renders the three controls in the TOP `Header`; `BuilderIdentityBar` is defined but rendered NOWHERE |
| Bottom-left (legacy sidebar) | ❌ | `components/sidebar/index.tsx:406,624` | OrgSwitcher at TOP, wallet at bottom — split, not consolidated |
| `direction="up"` wired | ✅ | org-switcher `:33`, account-menu `:34,77` | both accept + honor `direction` |
| Cross-surface links | ✅ | `components/editor/cross-surface-links.tsx` | correct pattern; URL for chat is `/c/new` (reconcile §5) |
| Canvas `#000` | ✅ | `assets/globals.css:229` | `--background: oklch(0 0 0)` |
| Panel `#050505` | ❌ | `assets/globals.css:231` | `--card: #0a0a0a` (should be `#050505`) |
| Border `#171717` | ❌ | `assets/globals.css:244` | `--border: #1f1f1f` (should be `#171717`) |
| Type = Basel | ❌ | `app/layout.tsx:18` | loads **Geist** but names var `--font-basel-sans`; must load Basel Grotesk |
| Monochrome chrome | ◑ | `org-switcher/index.tsx:234` | onboarding gradient `from-[#fd4444] to-[#ff6b6b]`; dropdown `bg-[#141414]` (should be `#171717`) |
| PHILOSOPHY: no TODO | ❌ | `org-switcher/index.tsx:20` | `TODO: hoist to @hanzo/ui` — do it or delete it |

### hanzo.chat

| Element | State | File | Note |
|---|---|---|---|
| Top-left mark | ◑ | `client/src/components/svg/HanzoLogoIcon.tsx` | correct geometric mark exists BUT not mounted as a clickable top-left brand; landing nav renders it inert |
| Top-left `animated` | ❌ | — | no animated variant |
| Top-left context menu | ❌ | — | no `onContextMenu` anywhere |
| Top-left left-click home | ❌ | `client/src/components/Landing/LandingPage.tsx:69` | logo not clickable |
| Bottom-left user menu | ✅ | `client/src/components/Nav/AccountSettings.tsx:11–140` | bottom of left sidebar; email + balance + files + settings + logout |
| Bottom-left wallet | ❌ | `client/src/components/Nav/NetworkWallet.tsx` | exists but mounted TOP-RIGHT (`HanzoHeader` headerRight), not in the bottom cluster |
| Bottom-left org switcher | ❌ | — | none — chat has no org switcher UI |
| Cluster consolidation | ❌ | — | account is bottom-left, wallet is top-right, org absent — not one cluster |
| Cross-surface links | ✅ | `client/src/utils/project.ts:83–90` + `ProjectBanner.tsx` | slug round-trip implemented |
| Canvas `#000` | ✅ | `client/src/style.css` (`--surface-primary`, `--background:0 0% 0%`) | true black |
| Panel `#050505` | ✅ | `client/src/style.css` (`--surface-secondary: --gray-950` = `#050505`) | matches |
| Border `#171717` | ◑ | `client/src/style.css` | `--border-light: #171717` ✅ but shadcn `--border: 0 0% 11%` = `#1c1c1c` — reconcile to `#171717` |
| Type = Basel | ✅ | `tailwind.config.cjs:34` | `sans: ['Basel', …]`, `mono: ['Geist Mono', …]` |
| Monochrome chrome | ✅ | `style.css:24` | green ramp collapsed; red for destructive only |

### console.hanzo.ai

Most mature surface for the bottom-left cluster and tokens.

| Element | State | File | Note |
|---|---|---|---|
| Top-left mark | ◑ | `src/components/ui/BrandLogo.tsx` | `BrandMark` (`H` glyph, white-label) **+ wordmark "Hanzo Console"** — must drop wordmark in chrome and use geometric `HanzoLogo` |
| Top-left `animated` | ❌ | — | static |
| Top-left context menu | ❌ | `DashboardShell.tsx:683` | left-click home ✅, but no right-click menu |
| Top-left left-click home | ✅ | `DashboardShell.tsx:683` | `onPress → go('/')` |
| Bottom-left cluster | ✅ | `DashboardShell.tsx:437–548` (`SidebarIdentity`) → `OrgSwitcher` → `SidebarWallet` | consolidated, bottom-left — the reference for the other two |
| Org switcher | ✅ | `src/components/OrgSwitcher.tsx` | filter, paginate, create, keyboard nav |
| Wallet | ✅ | `src/components/SidebarWallet.tsx` | live balance, top-up, honest `—` |
| Account menu order | ◑ | `DashboardShell.tsx:457–484` | Profile / Theme / Sign out — align items to §3 (add Dashboard/Chat/Billing/Settings) |
| Cross-surface links | ◑ | `src/lib/products/cross-surface.ts` | uses `?project=<iamProjectId>` (id, not slug) — reconcile to slug per §5 |
| Canvas `#000` | ✅ | `app/globals.css` (`--background:#000000`) | true black |
| Panel `#050505` | ✅ | `app/globals.css` (`--color1:#050505`) | matches |
| Border `#171717` | ◑ | `app/globals.css` | `--color3:#171717` ✅ but `--borderColor:#1f1f1f` — reconcile to `#171717` |
| Type = Geist | ◑ | `app/globals.css:4` | Geist Sans, not Basel — align to Basel Grotesk for cross-surface parity |
| Monochrome chrome | ✅ | — | one neutral scale, red destructive |

---

## 7. Convergence tasks (assignments)

Ordered. Each task is small, complete, production-ready. No stubs, no TODO.

### @hanzo/ui agent (do FIRST — the shared substrate everything depends on)

1. **Add `animated` prop to `HanzoLogo`** in `pkgs/ui/assets/hanzo-logo.tsx`:
   `animated?: boolean` → wrap the paths in `<g className="animate-pulse">` when
   true (port the app's local behavior verbatim). Keep the geometric mark; no
   wordmark. Export unchanged from `@hanzo/ui` and `@hanzo/ui/assets`.
2. **Fix the panel token**: in `pkgs/ui/style/hanzo-default-colors.css` change
   `--card` and `--popover` from `oklch(0.045 0 0)` (renders `#000`, invisible)
   to `oklch(0.06 0 0)` (`#050505`). Verify `--secondary/--muted/--border` stay
   `oklch(0.205 0 0)` (`#171717`). Ladder becomes `#000 / #050505 / #171717 / #262626`.
3. Confirm the canonical font wiring exports Basel Grotesk (Book+Medium) +
   Geist Mono with `font-synthesis: none`. Publish a patch (never a major bump).

### app agent

1. **Delete the local `HanzoLogo.tsx`**; import `HanzoLogo` from `@hanzo/ui` and
   pass `animated`. Update `editor/header/index.tsx:51` to `<HanzoLogo animated … />`.
2. **Wire `BuilderIdentityBar` into the builder** (`components/editor/index.tsx`):
   render it bottom-left of the builder frame; **remove** `OrgSwitcher`,
   `EditorAccountMenu`, `NetworkWallet` from the top `Header` (keep the H mark +
   primary tabs + cross-surface links there). Chrome recedes; the cluster owns
   the bottom-left corner.
3. **Retire the legacy sidebar brand**: replace `ui/logo` "HHH" glyph + "Open
   Source Web Studio" wordmark in `sidebar/index.tsx` with the geometric
   `HanzoLogo` alone + the app-shell ContextMenu; left-click → `/`. Move the
   legacy sidebar's OrgSwitcher from the top into the bottom cluster so
   `AppShell` pages match the builder. One shell pattern, not two.
4. **Sync tokens to canonical**: in `assets/globals.css` set `--card: #050505`,
   `--border: #171717` (drop `#0a0a0a` / `#1f1f1f`). Prefer consuming
   `@hanzo/ui` tokens directly over redefining locally.
5. **Load Basel Grotesk** in `app/layout.tsx` (self-hosted, Book+Medium) instead
   of Geist; keep the `--font-basel-sans` var name (now honest).
6. **Kill non-monochrome chrome**: replace the onboarding
   `from-[#fd4444] to-[#ff6b6b]` gradient with a neutral surface; change
   OrgSwitcher dropdown `bg-[#141414]` → `bg-[#171717]` (or `bg-popover`).
7. **Delete the TODO** at `org-switcher/index.tsx:20` (the hoist happens via the
   @hanzo/ui task — remove the comment).

### chat agent

1. **Mount the top-left brand**: render `@hanzo/ui` `HanzoLogo animated` alone as
   a clickable top-left mark (left-click → `/`), wrapped in a `ContextMenu` with
   the §2 items (label "Hanzo Chat"). Retire the inert landing-nav logo as the
   chrome brand. (Chat's own `HanzoLogoIcon` is the same geometry — prefer the
   shared `@hanzo/ui` component so there is one source.)
2. **Consolidate the bottom-left cluster**: move `NetworkWallet` OUT of the
   top-right `HanzoHeader` into the bottom sidebar next to `AccountSettings`;
   order it org · user · wallet; menus open upward.
3. **Add an org switcher** to the cluster (mirror app's `OrgSwitcher` behavior /
   `lib/org-scope`; drive it from the IAM session). Chat currently has none.
4. **Reconcile tokens**: set shadcn `--border` to `#171717` (currently `#1c1c1c`)
   so hairlines match; keep the `--surface-*` ladder (already `#000/#050505/#171717`).
5. **Reconcile cross-surface URLs** to §5 (app → `/dev?project=`, chat → `/c/new?project=`,
   console → `/?project=`) via the shared helper.

### console agent

1. **Top-left**: drop the "Console" wordmark from the chrome brand; render the
   geometric `HanzoLogo` (white-label-aware fill) alone. Keep left-click → `/`.
2. **Add the right-click app-shell context menu** to the logo (Tamagui
   Popover/menu) with the §2 items (label "Hanzo Console"). Left-click stays home.
3. **Align account-menu items** in `SidebarIdentity` to §3 (add Dashboard, Chat,
   Billing-with-balance, Settings alongside Profile / Sign out).
4. **Reconcile the border token**: `--borderColor` → `#171717` (currently `#1f1f1f`);
   keep `--color1 #050505` / `--color3 #171717`.
5. **Reconcile cross-surface** to slug (`?project=<slug>`) not id, per §5.
6. **Type**: adopt Basel Grotesk for cross-surface parity (Geist Mono for code
   stays). Lower priority than the structural items above.

---

## 8. Definition of done (all surfaces)

A surface is compliant when, verified in a real browser (Playwright, not a
status-code check):

1. Top-left is the geometric `HanzoLogo` (animated) **alone** — no wordmark.
   Left-click goes home; right-click opens the §2 menu.
2. Bottom-left is ONE cluster: org · user · wallet, menus opening upward.
3. Canvas is `#000`, panels `#050505`, borders/elevated `#171717`; the only
   color anywhere in chrome is the green live-dot and red destructive.
4. Type is Basel Grotesk + Geist Mono, no faux bold.
5. A project slug round-trips app ↔ chat ↔ console via `?project=<slug>`.
6. No TODO, no stub, no fabricated data (honest `—`), no plaintext anything.

The three surfaces must be visually indistinguishable in their chrome — same
corners, same tokens, same behavior. Only the content between differs.
