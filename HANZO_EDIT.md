# Hanzo Edit

An ever-present **"contribute to this page"** capability for every Hanzo app. A
page self-declares its source repo; from the widget (or any app's own chat)
anyone can **suggest** a fix, and a signed-in user with credits — or an admin —
can have Hanzo's agent **fork → edit → open a PR** against the declared repo,
across git providers.

The primary deliverable is the **shared backend** (`/v1/me`, `/v1/suggest`,
`/v1/edit`), served by hanzo.app. `public/edit.js` is the drop-in widget for apps
that don't already have a chat surface.

---

## Drop it into any app

Add the tag (served by hanzo.app) and the declaration metas:

```html
<script async src="https://hanzo.app/edit.js"></script>

<meta name="hanzo:repo"     content="owner/repo">      <!-- required -->
<meta name="hanzo:path"     content="path/to/file.mdx"><!-- optional override; auto-resolved otherwise -->
<meta name="hanzo:branch"   content="main">            <!-- optional, default main -->
<meta name="hanzo:provider" content="github">          <!-- optional: github|gitlab|gitea, default github -->
<meta name="hanzo:key"      content="pk_...">           <!-- optional publishable project key -->
```

With **no `hanzo:repo`** the widget renders nothing. **You no longer need
`hanzo:path`** — the widget auto-resolves the source file(s) for the current
view and pre-fills the field (see below). `hanzo:path` remains an optional
explicit override that wins when a page maps 1:1 to a known file.

In Next.js, declare the repo-wide metas once in `app/layout.tsx`:

```ts
export const metadata = {
  // …
  other: {
    "hanzo:repo": "hanzoai/app",
    "hanzo:branch": "main",
    "hanzo:provider": "github",
  },
};
```

A route that maps to a specific source file adds `"hanzo:path"` in its own
`metadata.other`.

Apps that already have a chat widget don't need `edit.js` — they call the same
backend (`POST /v1/suggest`, `POST /v1/edit`, `GET /v1/me`) directly.

---

## Zero manual path — auto-resolving the source file

The widget resolves a **ranked list of candidate source files** for the current
view and pre-fills the path field (the user may override, or pick another
candidate chip). It uses the best available signal, in priority order:

1. **`hanzo:path`** — an explicit 1:1 declaration, when present.
2. **React `_debugSource`** on the element in view — the exact `file:line`, but
   only in **dev** builds (the production JSX runtime strips it), so it's a bonus
   when present and never a dependency.
3. **The route manifest** (`/edit-manifest.json`) — the reliable signal. A
   build step (`scripts/gen-edit-manifest.mjs`, wired as `prebuild`/`predev`)
   scans `app/` and emits the App-Router pathname → `app/…/page.tsx` (+ its
   layout chain) map. It's exact by construction — derived from the same
   filesystem convention Next routes on (route groups `(x)` are URL-transparent;
   `[seg]`/`[...seg]`/`[[...seg]]` are dynamic). The widget fetches it
   **same-origin** (each app serves its own; a mismatched `repo` is ignored) and
   picks the most **specific** match (static ≫ dynamic).
4. **Convention guess** — `app/<segments>/page.tsx` + root layout, when no
   manifest is served (most apps today) or no route matched.

The manifest is generated at build and **git-ignored** (never committed stale);
absent, step 4 keeps the widget useful. Run it manually with
`npm run gen:edit-manifest`.

---

## The context trace

Every `suggest`/`edit` submission carries a trace so an agent or dev can review
and finish the fix — the payload is:

```jsonc
{
  // base
  "repo": "hanzoai/app", "provider": "github", "branch": "main",
  "url": "https://…", "key": "pk_…?", "context": "selected text?",
  "path": "auto-filled top candidate (optional — server falls back to it)",
  // auto-context
  "route": "/dev",
  "candidateFiles": [{ "path": "app/dev/page.tsx", "score": 0.9, "why": "route → page" }],
  "domBreadcrumb": "main > section[hero] > h1",
  "appVersion": "1.42.121",
  "sessionId": "…",              // @hanzo/event `hz_session` id (analytics/insights session)
  "replayRef": { "sessionId": "…", "deepLink": "https://insights.hanzo.ai/replay/…" },
  "usageTrace": [{ "route": "/", "kind": "load" }, { "route": "/dev", "kind": "nav" }]
}
```

`lib/edit/context.ts` shapes this **once** (parse+sanitize → render) for both the
issue body (`/v1/suggest`) and the PR body (`/v1/edit`), and resolves the
effective path from `candidateFiles` when `path` is omitted. The trace is
untrusted input: file paths run through `safePath`, and the replay deep-link is
**reconstructed** from the session id server-side (never echoed from the client).

**Session replay is present-when-available.** Replay INGEST is a separate,
not-yet-live workstream, so the `deepLink` is well-formed now and simply *lights
up* once ingest lands — it never blocks a fix, and when no session id is
resolvable the reference is omitted entirely.

---

## Who can do what (enforced server-side)

| Caller | Capability | Cost |
|---|---|---|
| Anyone (incl. anonymous) | **Suggest** — files a lightweight issue on the repo | free |
| Signed-in **with credits** | **fork → edit → PR** via the agent | debits credits (the agent run) |
| **Admin** (IAM `admin` org) | same PR flow | **free** |

`/v1/edit`'s gate is `isGlobalAdmin || (authenticated && hasCredits)`. The widget
hiding a button is only cosmetic — **the route is the security boundary**:

- not signed in → `401 { openLogin: true }`
- signed in, no credits, not admin → `402 { needsCredits: true }`
- otherwise → allowed (admin free; a credit-holder's run debits them)

Identity is always **IAM-validated** (`resolveOrgIdentity(req, { validate: true })`),
so `isGlobalAdmin` can never be spoofed by a client. Credits are the real per-org
balance the gateway debits (`/v1/billing/balance`).

---

## The endpoints

- **`GET /v1/me`** → `{ authenticated, isGlobalAdmin, org, balance, hasCredits }`.
  Shapes the widget CTA (admin "Open PR — free" · user+credits "Submit fix" ·
  user "Top up" · anon "Suggest a fix / Log in").
- **`POST /v1/suggest`** → files an issue on the declared repo (via the caller's
  linked forge token, else a configured Hanzo bot). `{ ok, filed, issueUrl? }`.
  Records the auto-context trace in the issue body.
- **`POST /v1/edit`** → runs the vertical, returns `{ ok, prUrl, branch, forked }`.
  `path` is optional (resolved from `candidateFiles`); the trace lands in the PR body.

All three are **cross-origin by design** (the widget runs on other Hanzo
origins): they accept the IAM bearer via same-origin cookie **or** an
`Authorization` header, and set CORS to reflect Hanzo-family origins with
credentials (extend via `EDIT_ALLOWED_ORIGIN_SUFFIXES`). The forge token is
resolved and used **server-side only** — it never reaches the browser.

---

## The fork → edit → PR flow

`lib/edit/flow.ts` runs it once against the `GitProvider` interface
(`lib/edit/provider.ts`):

1. `getFile(repo, path, branch)` — read the current file.
2. Compute the rewrite with Hanzo's model stack (`lib/edit/agent.ts` → the
   `/chat/completions` gateway, single file) — **this run is the credit charge**.
3. `hasWriteAccess(repo)` →
   - **yes**: branch + commit + PR directly on the repo.
   - **no**: `fork(repo)` → branch + commit on the fork → PR from the fork into
     the upstream base branch.
4. Return `{ prUrl, forked }`.

The acting forge token is (in order) the user's IAM-linked
`oauth_<Provider>_accessToken`, else a configured bot identity
(`HANZO_EDIT_BOT_TOKEN`) for users with no linked account.

---

## Providers

`GitProvider` (`lib/edit/provider.ts`) is the one interface every forge
implements: `whoami`, `getFile`, `hasWriteAccess`, `fork`, `createBranch`,
`commitFile`, `openPR`, `openIssue`.

- **GitHub** — live (`lib/edit/github.ts`).
- **GitLab**, **git.hanzo.ai (Gitea)** — declared, not yet implemented: they
  fail closed with `501` today. To add one, write `lib/edit/<forge>.ts`
  implementing `GitProvider` (mirror the GitHub driver) and return it from
  `providerFor()`.

---

## Config

| Env | Purpose |
|---|---|
| `HANZO_EDIT_BOT_TOKEN` | Optional forge token for a Hanzo bot identity, used to fork/PR or file issues when the caller has no linked account. Never hardcoded; absent → that fallback is skipped. |
| `HANZO_EDIT_BOT_LOGIN` | The bot's forge login (default `hanzo-bot`). |
| `EDIT_ALLOWED_ORIGIN_SUFFIXES` | Comma-separated extra host suffixes allowed to send the first-party cookie credentialed (adds to the built-in Hanzo-family list). |
| `HANZO_AI_BASE_URL` | The model gateway base (shared with `/v1/generate`). |
