# Agentic Coding Harness (Track B)

A cloud coding agent for hanzo.app: a per-project sandbox + an agent↔MCP tool
loop whose reasoning, tool use, and results stream live to the builder UI. This
document is the architecture and the increment plan. **D1 is built** (this
document's companion code); D2–D5 are the path to the full harness.

The engine we converge on is **`~/work/hanzo/dev`** (`@hanzo/dev`) — the Rust
coding agent (a `codex-rs` workspace, ~50 crates). We do **not** grow a second
long-lived agent runtime; every increment moves the app closer to `dev` as the
one engine and retires the interim pieces.

---

## 1. What already exists (measured, not assumed)

**hanzo.app builder — two modes today**

- **Single-shot** (`app/v1/generate/route.ts`): streams SEARCH/REPLACE +
  NEW_PAGE blocks from the gateway; no tools, no sandbox, no repo. This is the
  landing / `/dev` path via `hooks/useCallAi.ts`.
- **Client agent loop** (`lib/llm/multi-agent-orchestrator.ts`, ~56KB): a real
  reason→act loop with a tool registry (`lib/llm/tool-registry.ts` — shell /
  write / evaluation), streaming parser, string-patch, cost calculator, skills.
  It runs **client-side** against a **browser VFS** (`lib/vfs/*` IndexedDB +
  `cli-shell.ts` virtual shell). Server execution today is only
  `app/api/shell/execute` (proxies `sqlite3` into the SQLite VFS adapter).

**`~/work/hanzo/dev` — the engine (local today, cloud-ready plumbing)**

- Agent loop + real sandboxes in `core` (`exec.rs`, `exec-server`,
  `unified_exec`, `sandboxing/`, `landlock.rs`, seatbelt on macOS); bundled
  `bwrap` fallback (`linux-sandbox`, `bwrap` crates); `execpolicy`, `apply-patch`.
- **Cloud plumbing already present**: `exec-server` (JSON-RPC subprocess control;
  `--remote URL --environment-id ID` registers against an environment registry
  and reconnects over a Noise relay rendezvous websocket), `cloud-tasks` /
  `cloud-tasks-client` / `cloud-config`, and **`app-server`** (bidirectional
  JSON-RPC 2.0 over stdio / unix / ws — the interface that powers IDE
  extensions; its protocol already has Skills, Apps, Approvals, Events, Auth).
- `skills` / `core-skills` crates, a `hooks` engine, `codex-mcp` + `mcp-server`
  (MCP client **and** server). Config home `~/.hanzo` (reads legacy
  `~/.code` / `~/.codex`); auth via hanzo.id JWT; default provider
  `api.hanzo.ai/v1`.
- **Gap**: there is **no deployed environment registry / hosted sandbox pool**.
  `dev` has the client half of remote exec; the hosted half is net-new.

**`~/work/hanzo/mcp` (`@hanzo/mcp`) — the tool supply**: 260+ tools incl.
`mcp__hanzo__fs` (read/write/tree/grep), `exec`, `git`, `code`, `lsp`, `search`.
The live server exists; the app orchestrator does **not** use it yet (it has its
own 3-tool registry).

**Sandbox runtime hosted anywhere: NONE.** No e2b / firecracker / daytona /
modal / gVisor in `hanzo/app` or `hanzo/*`. The only real-process isolation that
exists is `dev`'s local bwrap/landlock/seatbelt + the `exec-server` remote seed.
The app's "sandbox" is the in-browser VFS. ZAP `zip` is app-hosting/MCP-mount,
not a coding sandbox.

---

## 2. Target architecture

```
 Browser (chat-panel)  ──SSE/WS──▶  /v1/agent  (BFF, per-user IAM bearer)
   renders reasoning /                   │
   tool-use / result cards               │  opens a session, forwards bearer
                                         ▼
                              sandbox-orchestrator (DOKS, hanzo-k8s)
                                         │  provisions & tracks
                                         ▼
                   per-project workspace pod (gVisor/Kata runtimeClass)
                     ├─ repo seeded from git.hanzo.ai / cloud VFS
                     ├─ headless `dev` (app-server) — THE agent runtime
                     │     └─ tool calls ─▶ hanzo MCP (mcp__hanzo__fs/exec/git/lsp)
                     └─ real process exec under bwrap/landlock
```

Three planes, each independently completable:

1. **Sandbox provisioning** — an isolated workspace per session, seeded with the
   project repo, GC'd on idle. Backed by `dev` `exec-server` (remote mode) →
   a gVisor/Kata pod on DOKS.
2. **Agent↔MCP loop** — a bounded reason→act loop; tools are the canonical
   `mcp__hanzo__*` surface; the runtime is `dev`'s `app-server`.
3. **UI streaming** — one stable event contract (`AgentEvent`) the chat panel
   renders as reasoning / tool-call / tool-result / text cards.

**Cross-cutting invariants** (hold from D1):

- **Auth is the per-user IAM bearer end-to-end** — same as `/v1/generate` and
  `/v1/agents`. No shared server key; billing is per-user.
- **Tenant isolation** via the gateway-minted `X-Org-Id` from the validated
  bearer — never a client-supplied header.
- **Secrets in KMS.** **One agent engine** long-term (`dev`) — no second
  orchestrator.
- **Bound everything**: turn caps + per-turn commerce metering + idle-GC of pods.

---

## 3. The `AgentEvent` contract (stable across D1→D5)

`lib/agent/types.ts` defines the wire contract the UI renders. It is
transport-agnostic on purpose so the same events ride SSE (D1), a `dev`
`app-server` JSON-RPC relay (D4), or an in-process callback (tests):

| event         | meaning                                   |
| ------------- | ----------------------------------------- |
| `turn`        | a new reason→act turn began               |
| `reasoning`   | incremental thinking tokens               |
| `text`        | incremental assistant prose               |
| `tool_call`   | model invoked a tool (name + raw args)    |
| `tool_result` | tool output fed back (with `isError`)     |
| `error`       | terminal failure                          |
| `done`        | final snapshot + list of changed paths    |

The chat panel already renders tool-use + reasoning cards from the client
orchestrator's events, so this maps onto existing UI with no new render layer.

---

## 4. Increment plan

### D1 — Server-side agent mode, no new infra ✅ BUILT

- `app/v1/agent/route.ts`: a POST **SSE** endpoint. Same same-origin CSRF guard
  + IAM-bearer-cookie gate as `/v1/generate`. **Flag-gated** by the server env
  `AGENT_SERVER_ENABLED` (returns 404 when off) — ships dark, **not** wired into
  the live builder UI.
- `lib/agent/*`: a bounded (≤8, hard-capped 24) tool-calling loop against
  `${HANZO_AI_BASE_URL}/chat/completions` with a minimal MCP-shaped toolset —
  `list_files`, `read_file`, `search_files`, `write_file`, `apply_patch` —
  executed **server-side** against an **in-memory project snapshot**
  (`InMemoryProjectFs`, update/rewrite semantics mirroring
  `lib/llm/string-patch.ts`). Streams `reasoning` / `text` / `tool_call` /
  `tool_result` / `done` events.
- Verified by `tests/integration/agent-loop.test.ts` (mocked gateway): reasoning
  + tool events stream, files are actually edited, `maxTurns` is enforced,
  gateway failure surfaces as an `error` event.

**Honesty**: D1 is **not** a sandbox. The in-memory FS does file tools only — no
real process exec, no git, no network isolation. Those arrive in D3/D4. D1 is
"server-side file-tool agent mode", the proven client loop moved server-side.

### D2 — Point the loop at hanzo MCP

Replace the bespoke 5-tool executor binding with an MCP client to the
`mcp__hanzo__*` server (`fs` / `exec` / `git` / `search` / `lsp`). The loop and
the `AgentEvent` contract do **not** change — only where tools execute. This
kills the 3-toolsets-diverging risk (app registry vs hanzo MCP vs `dev` builtins)
by making hanzo MCP the one tool surface.

### D3 — Real sandbox execution seam

Swap the in-memory FS's exec for `dev`'s `exec-server` in **remote mode**. Stand
up a minimal environment-registry endpoint + Noise relay so a per-session
`exec-server` registers; the D2 `exec` tool now runs **real processes under
bwrap/landlock** instead of a virtual shell. Repo still synced from cloud VFS /
git. (`dev` ships the client half of this today; the registry + relay are the
net-new server half.)

### D4 — Per-project hosted sandbox pods

`sandbox-orchestrator` on DOKS (hanzo-k8s) provisions an isolated workspace pod
per session (gVisor/Kata `runtimeClass`), seeds it from git.hanzo.ai / cloud VFS,
runs headless `dev` (`app-server`) inside, and registers it in the environment
registry. `/v1/agent` becomes the BFF that opens a session, forwards the bearer,
and relays `dev` `app-server` turn / tool / approval / reasoning events to the
browser. **Bridge targets stdio or unix socket** (the stable `app-server`
transports) — `ws` is marked experimental upstream. Commerce credit metering per
turn; idle-GC of pods.

### D5 — Full `dev` engine + Hermes merge

`dev`'s `app-server` is THE agent runtime; the UI streams its native events.
Skills, MCP config, and openclaw/Claude-Code settings-import (`~/.claude`, MCP
servers, `CLAUDE.md`) land in `dev`'s config/skills layer and surface via the
`app-server` Skills/Apps API. Publish reuses the existing `/v1/publish`
(hanzoai/spa|static on ingress). **Retire the client-side VFS orchestrator** once
server mode reaches parity.

---

## 5. Risks & how the plan answers them

- **Third-orchestrator risk.** Two loops already exist (client
  `multi-agent-orchestrator`, `dev` `core`). D1 reuses the proven pattern +
  edit semantics server-side rather than inventing a new engine; D5 converges on
  `dev` and retires the client loop.
- **"Sandbox" honesty.** D1's in-memory FS is not isolation. Real exec/git/net
  isolation is D3/D4 only. Do not market D1 as a sandbox.
- **Toolset divergence.** Pick **one** surface — hanzo MCP — by D2.
- **Model tool-call reliability.** Some Zen/DeepSeek models emit tool calls as
  text or double-encode arg arrays. D1 already tolerates stringified/
  double-encoded `operations` and never throws on a bad call; carry the
  `detectMalformedToolCalls` / json-repair hardening from the client
  orchestrator forward as models require.
- **Billing/abuse.** Per-user bearer + turn caps from D1; per-turn commerce
  metering + pod idle-GC from D4.
- **`app-server` `ws` is experimental.** The D4 bridge uses stdio / unix socket.

---

## 6. File map (D1)

| path                              | role                                             |
| --------------------------------- | ------------------------------------------------ |
| `lib/agent/types.ts`              | `AgentEvent` + `AgentFile` wire contract         |
| `lib/agent/fs.ts`                 | `InMemoryProjectFs` (list/read/write/search/patch) |
| `lib/agent/tools.ts`              | MCP-shaped toolset + dispatch (`executeAgentTool`) |
| `lib/agent/loop.ts`               | bounded reason→act loop (`runAgent`)             |
| `lib/agent/index.ts`              | public surface                                   |
| `app/v1/agent/route.ts`           | flag-gated SSE BFF (`AGENT_SERVER_ENABLED`)      |
| `tests/integration/agent-loop.test.ts` | behavioral verification                     |

**Enable D1 for local trial**: set `AGENT_SERVER_ENABLED=1`, then `POST /v1/agent`
(same-origin, signed in) with `{ "prompt": "...", "files": [{ "path": "/index.html", "content": "..." }] }`
and read the SSE `data:` frames. The future UI opt-in is a separate
`NEXT_PUBLIC_AGENT_SERVER` flag in the chat panel.
