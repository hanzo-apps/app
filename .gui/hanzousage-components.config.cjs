var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/.pnpm/@hanzo+usage@0.1.6_@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-na_9763093f82e9564e964c8197a9b6f274/node_modules/@hanzo/usage/dist/index.js
var dist_exports = {};
__export(dist_exports, {
  Reporter: () => Reporter,
  UsageError: () => UsageError,
  UsageStore: () => UsageStore,
  accountKind: () => accountKind,
  accountLabel: () => accountLabel,
  allProviders: () => allProviders,
  bearer: () => bearer,
  byoProvider: () => byoProvider,
  chutesProvider: () => chutesProvider,
  claudeProvider: () => claudeProvider,
  codexProvider: () => codexProvider,
  createReporter: () => createReporter,
  deepgramProvider: () => deepgramProvider,
  deepseekProvider: () => deepseekProvider,
  deltaDirection: () => deltaDirection,
  elevenlabsProvider: () => elevenlabsProvider,
  expandHome: () => expandHome,
  fetchCloudUsage: () => fetchCloudUsage,
  fetchProviderUsage: () => fetchProviderUsage,
  forMode: () => forMode,
  formatBucket: () => formatBucket,
  formatCents: () => formatCents,
  formatCount: () => formatCount,
  formatCurrency: () => formatCurrency,
  formatDeltaPct: () => formatDeltaPct,
  groqProvider: () => groqProvider,
  hanzoProvider: () => hanzoProvider,
  kimiProvider: () => kimiProvider,
  kimik2Provider: () => kimik2Provider,
  linkPayload: () => linkPayload,
  litellmProvider: () => litellmProvider,
  llmproxyProvider: () => llmproxyProvider,
  makeApiTokenProvider: () => makeApiTokenProvider,
  makeApiTokenStrategy: () => makeApiTokenStrategy,
  minimaxProvider: () => minimaxProvider,
  moonshotProvider: () => moonshotProvider,
  normalizeCloudUsage: () => normalizeCloudUsage,
  normalizeProviderUsage: () => normalizeProviderUsage,
  numberOrUndefined: () => numberOrUndefined,
  openaiProvider: () => openaiProvider,
  openrouterProvider: () => openrouterProvider,
  poeProvider: () => poeProvider,
  providerCatalog: () => providerCatalog,
  providerCatalogById: () => providerCatalogById,
  providerRegistry: () => providerRegistry,
  readJsonFile: () => readJsonFile,
  remainingPercent: () => remainingPercent,
  resolveApiKey: () => resolveApiKey,
  resolveBaseUrl: () => resolveBaseUrl,
  runPipeline: () => runPipeline,
  trackedProviderIds: () => trackedProviderIds,
  updatedLabel: () => updatedLabel,
  usageOf: () => usageOf,
  veniceProvider: () => veniceProvider,
  zaiProvider: () => zaiProvider
});
module.exports = __toCommonJS(dist_exports);

// node_modules/.pnpm/@hanzo+usage@0.1.6_@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-na_9763093f82e9564e964c8197a9b6f274/node_modules/@hanzo/usage/dist/types.js
var remainingPercent = /* @__PURE__ */ __name((w) => Math.max(0, 100 - w.usedPercent), "remainingPercent");

// node_modules/.pnpm/@hanzo+usage@0.1.6_@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-na_9763093f82e9564e964c8197a9b6f274/node_modules/@hanzo/usage/dist/cloud-usage.js
var UsageError = class extends Error {
  static {
    __name(this, "UsageError");
  }
  status;
  constructor(message, status = 0) {
    super(message);
    this.name = "UsageError";
    this.status = status;
  }
};
var num = /* @__PURE__ */ __name((v) => typeof v === "number" && Number.isFinite(v) ? v : 0, "num");
var str = /* @__PURE__ */ __name((v) => typeof v === "string" ? v : "", "str");
var bool = /* @__PURE__ */ __name((v) => v === true, "bool");
var pct = /* @__PURE__ */ __name((v) => typeof v === "number" && Number.isFinite(v) ? v : null, "pct");
function normalizeTotals(t) {
  const o = t ?? {};
  return {
    tokens: num(o.tokens),
    promptTokens: num(o.promptTokens),
    completionTokens: num(o.completionTokens),
    requests: num(o.requests),
    spendCents: num(o.spendCents),
    models: num(o.models),
    providers: num(o.providers)
  };
}
__name(normalizeTotals, "normalizeTotals");
function normalizeDeltas(d) {
  const out = {};
  if (d && typeof d === "object") {
    for (const [k, v] of Object.entries(d)) {
      const o = v ?? {};
      out[k] = { current: num(o.current), prior: num(o.prior), pct: pct(o.pct) };
    }
  }
  return out;
}
__name(normalizeDeltas, "normalizeDeltas");
function normalizeSeries(s) {
  if (!Array.isArray(s))
    return [];
  return s.map((p) => {
    const o = p ?? {};
    return { t: str(o.t), tokens: num(o.tokens), spendCents: num(o.spendCents), requests: num(o.requests), models: num(o.models) };
  });
}
__name(normalizeSeries, "normalizeSeries");
function normalizeByModel(b) {
  const o = b ?? {};
  const items = Array.isArray(o.items) ? o.items.map((m) => {
    const r = m ?? {};
    return { model: str(r.model), provider: str(r.provider), spendCents: num(r.spendCents), tokens: num(r.tokens), requests: num(r.requests), pct: num(r.pct) };
  }) : [];
  let other = null;
  if (o.other && typeof o.other === "object") {
    const r = o.other;
    other = { spendCents: num(r.spendCents), tokens: num(r.tokens), requests: num(r.requests), pct: num(r.pct), modelCount: num(r.modelCount) };
  }
  return { items, other, totalCents: num(o.totalCents) };
}
__name(normalizeByModel, "normalizeByModel");
function normalizeActivity(a) {
  const o = a ?? {};
  const items = Array.isArray(o.items) ? o.items.map((r) => {
    const x = r ?? {};
    return {
      time: str(x.time),
      model: str(x.model),
      provider: str(x.provider),
      type: str(x.type),
      status: str(x.status),
      tokens: num(x.tokens),
      promptTokens: num(x.promptTokens),
      completionTokens: num(x.completionTokens),
      costCents: num(x.costCents),
      stream: bool(x.stream),
      premium: bool(x.premium),
      requestId: str(x.requestId),
      org: str(x.org),
      user: str(x.user)
    };
  }) : [];
  return { items, limit: num(o.limit), offset: num(o.offset), total: num(o.total), type: str(o.type) };
}
__name(normalizeActivity, "normalizeActivity");
function normalizeCloudUsage(raw) {
  const o = raw ?? {};
  const scope = o.scope ?? {};
  return {
    range: str(o.range),
    start: str(o.start),
    end: str(o.end),
    interval: str(o.interval) || "day",
    scope: { org: str(scope.org), allOrgs: bool(scope.allOrgs) },
    totals: normalizeTotals(o.totals),
    deltas: normalizeDeltas(o.deltas),
    series: normalizeSeries(o.series),
    byModel: normalizeByModel(o.byModel),
    activity: normalizeActivity(o.activity)
  };
}
__name(normalizeCloudUsage, "normalizeCloudUsage");
async function fetchCloudUsage(opts) {
  const doFetch = opts.fetch ?? globalThis.fetch;
  if (!doFetch)
    throw new UsageError("no fetch implementation available");
  const base = opts.baseUrl.replace(/\/+$/, "");
  const q = new URLSearchParams();
  if (opts.range)
    q.set("range", opts.range);
  if (opts.start)
    q.set("start", opts.start);
  if (opts.end)
    q.set("end", opts.end);
  if (opts.org)
    q.set("org", opts.org);
  if (opts.topModels != null)
    q.set("topModels", String(opts.topModels));
  if (opts.activityType)
    q.set("activityType", opts.activityType);
  if (opts.activityLimit != null)
    q.set("activityLimit", String(opts.activityLimit));
  if (opts.activityOffset != null)
    q.set("activityOffset", String(opts.activityOffset));
  const query = q.toString();
  let res;
  try {
    res = await doFetch(`${base}/v1/get-cloud-usages${query ? `?${query}` : ""}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${opts.token}`, Accept: "application/json" },
      signal: opts.signal
    });
  } catch (e) {
    throw new UsageError(e instanceof Error ? e.message : String(e));
  }
  if (!res.ok)
    throw new UsageError(`get-cloud-usages HTTP ${res.status}`, res.status);
  const body = await res.json();
  if (body && typeof body === "object" && "status" in body && body.status && body.status !== "ok") {
    throw new UsageError(body.msg || "usage ledger unavailable", res.status);
  }
  const payload = body && typeof body === "object" && "data" in body ? body.data : body;
  return normalizeCloudUsage(payload);
}
__name(fetchCloudUsage, "fetchCloudUsage");

// node_modules/.pnpm/@hanzo+usage@0.1.6_@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-na_9763093f82e9564e964c8197a9b6f274/node_modules/@hanzo/usage/dist/provider-usage.js
var num2 = /* @__PURE__ */ __name((v) => typeof v === "number" && Number.isFinite(v) ? v : 0, "num");
var str2 = /* @__PURE__ */ __name((v) => typeof v === "string" ? v : "", "str");
var bool2 = /* @__PURE__ */ __name((v) => v === true, "bool");
function normalizeTotals2(t) {
  const o = t ?? {};
  return {
    spendCents: num2(o.spendCents),
    tokens: num2(o.tokens),
    inputTokens: num2(o.inputTokens),
    outputTokens: num2(o.outputTokens),
    requests: num2(o.requests)
  };
}
__name(normalizeTotals2, "normalizeTotals");
function normalizeSeries2(s) {
  if (!Array.isArray(s))
    return [];
  return s.map((p) => {
    const o = p ?? {};
    return { t: str2(o.t), spendCents: num2(o.spendCents), tokens: num2(o.tokens), requests: num2(o.requests) };
  });
}
__name(normalizeSeries2, "normalizeSeries");
function normalizeByModel2(b) {
  if (!Array.isArray(b))
    return [];
  return b.map((m) => {
    const o = m ?? {};
    return { model: str2(o.model), spendCents: num2(o.spendCents), tokens: num2(o.tokens), requests: num2(o.requests) };
  });
}
__name(normalizeByModel2, "normalizeByModel");
function normalizeProviderUsage(raw, providerFallback = "") {
  const o = raw ?? {};
  const note = typeof o.note === "string" && o.note ? o.note : void 0;
  return {
    provider: str2(o.provider) || providerFallback,
    connected: bool2(o.connected),
    available: bool2(o.available),
    note,
    currency: str2(o.currency) || "usd",
    start: str2(o.start),
    end: str2(o.end),
    interval: str2(o.interval) || "day",
    totals: normalizeTotals2(o.totals),
    series: normalizeSeries2(o.series),
    byModel: normalizeByModel2(o.byModel)
  };
}
__name(normalizeProviderUsage, "normalizeProviderUsage");
async function fetchProviderUsage(opts) {
  const doFetch = opts.fetch ?? globalThis.fetch;
  if (!doFetch)
    throw new UsageError("no fetch implementation available");
  const base = opts.baseUrl.replace(/\/+$/, "");
  const provider = encodeURIComponent(opts.provider);
  const q = new URLSearchParams();
  if (opts.from)
    q.set("from", opts.from);
  if (opts.to)
    q.set("to", opts.to);
  const query = q.toString();
  let res;
  try {
    res = await doFetch(`${base}/v1/ai/connections/${provider}/usage${query ? `?${query}` : ""}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${opts.token}`, Accept: "application/json" },
      signal: opts.signal
    });
  } catch (e) {
    throw new UsageError(e instanceof Error ? e.message : String(e));
  }
  if (!res.ok)
    throw new UsageError(`connection usage HTTP ${res.status}`, res.status);
  const body = await res.json();
  if (body && typeof body === "object" && "status" in body && body.status && body.status !== "ok") {
    throw new UsageError(body.msg || "usage import unavailable", res.status);
  }
  const payload = body && typeof body === "object" && "data" in body ? body.data : body;
  return normalizeProviderUsage(payload, opts.provider);
}
__name(fetchProviderUsage, "fetchProviderUsage");

// node_modules/.pnpm/@hanzo+usage@0.1.6_@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-na_9763093f82e9564e964c8197a9b6f274/node_modules/@hanzo/usage/dist/format.js
function formatCents(cents) {
  const d = (Number.isFinite(cents) ? cents : 0) / 100;
  const abs = Math.abs(d);
  if (abs >= 1e6)
    return `$${(d / 1e6).toFixed(1)}M`;
  if (abs >= 1e4)
    return `$${(d / 1e3).toFixed(1)}K`;
  return `$${d.toFixed(2)}`;
}
__name(formatCents, "formatCents");
function formatCurrency(value, currencyCode = "USD") {
  try {
    return new Intl.NumberFormat(void 0, { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currencyCode}`;
  }
}
__name(formatCurrency, "formatCurrency");
function formatCount(n) {
  if (!Number.isFinite(n))
    return "\u2014";
  const abs = Math.abs(n);
  if (abs >= 1e9)
    return `${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6)
    return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3)
    return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}
__name(formatCount, "formatCount");
function formatDeltaPct(pct3) {
  if (pct3 == null)
    return "new";
  const r = Math.round(pct3);
  return `${r > 0 ? "+" : ""}${r}%`;
}
__name(formatDeltaPct, "formatDeltaPct");
function deltaDirection(pct3) {
  if (pct3 == null || Math.round(pct3) === 0)
    return "flat";
  return pct3 > 0 ? "up" : "down";
}
__name(deltaDirection, "deltaDirection");
function formatBucket(iso, interval) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()))
    return iso;
  if (interval === "hour")
    return `${String(d.getUTCHours()).padStart(2, "0")}:00`;
  return d.toLocaleDateString(void 0, { month: "short", day: "numeric", timeZone: "UTC" });
}
__name(formatBucket, "formatBucket");
function updatedLabel(t) {
  if (t == null)
    return null;
  const ms = typeof t === "string" ? Date.parse(t) : t.getTime();
  if (!Number.isFinite(ms))
    return null;
  const mins = Math.floor((Date.now() - ms) / 6e4);
  if (mins < 1)
    return "updated just now";
  if (mins < 60)
    return `updated ${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24)
    return `updated ${h}h ago`;
  return `updated ${Math.floor(h / 24)}d ago`;
}
__name(updatedLabel, "updatedLabel");

// node_modules/.pnpm/@hanzo+usage@0.1.6_@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-na_9763093f82e9564e964c8197a9b6f274/node_modules/@hanzo/usage/dist/host.js
var expandHome = /* @__PURE__ */ __name((host, path) => path.startsWith("~/") ? `${host.homeDir()}/${path.slice(2)}` : path, "expandHome");
var readJsonFile = /* @__PURE__ */ __name(async (host, path) => {
  const text = await host.readTextFile(expandHome(host, path));
  if (text === void 0)
    return void 0;
  try {
    return JSON.parse(text);
  } catch {
    return void 0;
  }
}, "readJsonFile");

// node_modules/.pnpm/@hanzo+usage@0.1.6_@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-na_9763093f82e9564e964c8197a9b6f274/node_modules/@hanzo/usage/dist/provider.js
var matchesMode = /* @__PURE__ */ __name((kind, mode) => {
  if (mode === "auto")
    return true;
  if (mode === "web")
    return kind === "web";
  if (mode === "cli")
    return kind === "cli" || kind === "localProbe";
  if (mode === "oauth")
    return kind === "oauth";
  return kind === "apiToken";
}, "matchesMode");
var forMode = /* @__PURE__ */ __name((all, mode) => all.filter((s) => matchesMode(s.kind, mode)), "forMode");
var runPipeline = /* @__PURE__ */ __name(async (descriptor, ctx) => {
  const attempts = [];
  let lastError;
  for (const strategy of descriptor.strategies(ctx.sourceMode)) {
    if (!await strategy.isAvailable(ctx)) {
      attempts.push({ strategyId: strategy.id, ok: false, skipped: true });
      continue;
    }
    try {
      const result = await strategy.fetch(ctx);
      attempts.push({ strategyId: strategy.id, ok: true });
      return { result, attempts };
    } catch (error) {
      attempts.push({
        strategyId: strategy.id,
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      });
      lastError = error;
      const fallback = strategy.shouldFallback?.(error, ctx) ?? true;
      if (!fallback)
        break;
    }
  }
  return { error: lastError ?? new Error(`${descriptor.id}: no strategy available`), attempts };
}, "runPipeline");

// node_modules/.pnpm/@hanzo+usage@0.1.6_@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-na_9763093f82e9564e964c8197a9b6f274/node_modules/@hanzo/usage/dist/store.js
var HISTORY_MAX_ENTRIES = 2e3;
var UsageStore = class {
  static {
    __name(this, "UsageStore");
  }
  opts;
  state = { providers: {}, refreshing: false };
  listeners = /* @__PURE__ */ new Set();
  timer;
  history = /* @__PURE__ */ new Map();
  constructor(opts) {
    this.opts = opts;
    for (const p of opts.providers) {
      this.state.providers[p.id] = { refreshing: false };
    }
  }
  getState() {
    return this.state;
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  emit(next) {
    this.state = { ...this.state, ...next };
    for (const l of this.listeners)
      l();
  }
  setProvider(id, patch) {
    this.emit({
      providers: {
        ...this.state.providers,
        [id]: { ...this.state.providers[id], refreshing: false, ...patch }
      }
    });
  }
  async refresh(providerId) {
    const targets = this.opts.providers.filter((p) => !providerId || p.id === providerId);
    this.emit({ refreshing: true });
    await Promise.all(targets.map((p) => this.refreshProvider(p)));
    this.emit({ refreshing: false, lastRefreshAt: this.opts.host.now().toISOString() });
  }
  async refreshProvider(descriptor) {
    this.setProvider(descriptor.id, { refreshing: true });
    const ctx = {
      host: this.opts.host,
      sourceMode: this.opts.sourceMode ?? "auto",
      settings: this.opts.settings?.[descriptor.id]
    };
    const outcome = await runPipeline(descriptor, ctx);
    if (outcome.result) {
      this.setProvider(descriptor.id, {
        snapshot: outcome.result.usage,
        credits: outcome.result.credits,
        sourceLabel: outcome.result.sourceLabel,
        attempts: outcome.attempts,
        error: void 0
      });
      await this.captureHistory(outcome.result.usage);
    } else {
      this.setProvider(descriptor.id, {
        error: outcome.error instanceof Error ? outcome.error.message : String(outcome.error),
        attempts: outcome.attempts
      });
    }
  }
  start() {
    if (this.timer)
      return;
    const interval = this.opts.intervalMs ?? 5 * 60 * 1e3;
    this.timer = setInterval(() => void this.refresh(), interval);
    void this.refresh();
  }
  stop() {
    if (this.timer)
      clearInterval(this.timer);
    this.timer = void 0;
  }
  // ---- plan-utilization history (sparkline data) ----
  getHistory(providerId) {
    return this.history.get(providerId) ?? [];
  }
  async captureHistory(snapshot) {
    const lanes = [
      {
        name: "session",
        windowMinutes: snapshot.primary?.windowMinutes ?? 300,
        usedPercent: snapshot.primary?.usedPercent,
        resetsAt: snapshot.primary?.resetsAt
      },
      {
        name: "weekly",
        windowMinutes: snapshot.secondary?.windowMinutes ?? 10080,
        usedPercent: snapshot.secondary?.usedPercent,
        resetsAt: snapshot.secondary?.resetsAt
      }
    ];
    let series = this.history.get(snapshot.providerId);
    if (!series) {
      series = await this.loadHistory(snapshot.providerId);
      this.history.set(snapshot.providerId, series);
    }
    const capturedAt = snapshot.updatedAt;
    const bucket = capturedAt.slice(0, 13);
    for (const lane of lanes) {
      if (typeof lane.usedPercent !== "number")
        continue;
      let s = series.find((x) => x.name === lane.name);
      if (!s) {
        s = { name: lane.name, windowMinutes: lane.windowMinutes, entries: [] };
        series.push(s);
      }
      const last = s.entries.at(-1);
      if (last && last.capturedAt.slice(0, 13) === bucket) {
        last.usedPercent = lane.usedPercent;
        last.resetsAt = lane.resetsAt;
      } else {
        s.entries.push({ capturedAt, usedPercent: lane.usedPercent, resetsAt: lane.resetsAt });
        if (s.entries.length > HISTORY_MAX_ENTRIES)
          s.entries.splice(0, s.entries.length - HISTORY_MAX_ENTRIES);
      }
    }
    await this.persistHistory(snapshot.providerId, series);
  }
  historyPath(providerId) {
    return this.opts.historyDir ? `${this.opts.historyDir}/${providerId}.json` : void 0;
  }
  async loadHistory(providerId) {
    const path = this.historyPath(providerId);
    if (!path)
      return [];
    const text = await this.opts.host.readTextFile(path);
    if (!text)
      return [];
    try {
      const file = JSON.parse(text);
      return file.version === 1 ? file.unscoped : [];
    } catch {
      return [];
    }
  }
  async persistHistory(providerId, series) {
    const path = this.historyPath(providerId);
    if (!path)
      return;
    const file = { version: 1, unscoped: series };
    await this.opts.host.writeTextFile(path, JSON.stringify(file));
  }
};

// node_modules/.pnpm/@hanzo+usage@0.1.6_@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-na_9763093f82e9564e964c8197a9b6f274/node_modules/@hanzo/usage/dist/report.js
var num3 = /* @__PURE__ */ __name((v) => typeof v === "number" && Number.isFinite(v) ? v : 0, "num");
var SUBSCRIPTION_PROVIDERS = /* @__PURE__ */ new Set(["claude", "codex"]);
function accountKind(providerId, snapshot) {
  if (providerId === "hanzo")
    return "apikey";
  const lm = (snapshot?.identity?.loginMethod ?? "").toLowerCase();
  if (lm.includes("api") || lm.includes("token") || lm.includes("key"))
    return "apikey";
  if (lm.includes("oauth") || lm.includes("web") || lm.includes("cli") || lm.includes("subscription")) {
    return "subscription";
  }
  return SUBSCRIPTION_PROVIDERS.has(providerId) ? "subscription" : "apikey";
}
__name(accountKind, "accountKind");
function accountLabel(snapshot) {
  return snapshot?.identity?.accountEmail?.trim() || snapshot?.identity?.accountOrganization?.trim() || "";
}
__name(accountLabel, "accountLabel");
function usageOf(snapshot) {
  const cost = snapshot.providerCost;
  return {
    sessionPct: num3(snapshot.primary?.usedPercent),
    weeklyPct: num3(snapshot.secondary?.usedPercent),
    resetsAt: snapshot.primary?.resetsAt,
    tokens: num3(snapshot.totals?.tokens),
    inputTokens: snapshot.totals?.inputTokens,
    outputTokens: snapshot.totals?.outputTokens,
    spendCents: cost ? Math.round(num3(cost.used) * 100) : 0,
    currency: cost?.currencyCode,
    confidence: snapshot.dataConfidence,
    updatedAt: snapshot.updatedAt
  };
}
__name(usageOf, "usageOf");
function linkPayload(providerId, state, cfg) {
  const snapshot = state.snapshot;
  if (!snapshot)
    return null;
  return {
    machine: cfg.machine,
    host: cfg.hostname,
    os: cfg.os,
    provider: providerId,
    account: accountLabel(snapshot),
    plan: snapshot.identity?.plan,
    kind: accountKind(providerId, snapshot),
    usage: usageOf(snapshot)
  };
}
__name(linkPayload, "linkPayload");
var Reporter = class {
  static {
    __name(this, "Reporter");
  }
  store;
  cfg;
  constructor(store, cfg) {
    this.store = store;
    this.cfg = cfg;
  }
  /** Report the current store state to the registry (one upsert per signed-in
   *  account). A missing bearer is an honest no-op (the collector is not linked to
   *  a cloud account yet), never an error. */
  async report() {
    const out = { reported: 0, skipped: 0, errors: [] };
    const providers = this.store.getState().providers;
    const token = await this.cfg.getToken();
    if (!token) {
      out.skipped = Object.keys(providers).length;
      return out;
    }
    const base = this.cfg.baseUrl.replace(/\/+$/, "");
    for (const [id, state] of Object.entries(providers)) {
      const payload = linkPayload(id, state, this.cfg);
      if (!payload) {
        out.skipped++;
        continue;
      }
      try {
        const res = await this.cfg.host.http({
          url: `${base}/v1/links`,
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(payload),
          timeoutMs: 15e3
        });
        if (res.status >= 200 && res.status < 300)
          out.reported++;
        else
          out.errors.push({ provider: id, error: `HTTP ${res.status}` });
      } catch (e) {
        out.errors.push({ provider: id, error: e instanceof Error ? e.message : String(e) });
      }
    }
    return out;
  }
  /** Report on every store change (debounced) so a fresh usage snapshot flows to
   *  the registry as the engine polls. Reports the current state immediately.
   *  Returns a stop function. */
  start(debounceMs = 3e3) {
    let timer;
    const schedule = /* @__PURE__ */ __name(() => {
      if (timer)
        return;
      timer = setTimeout(() => {
        timer = void 0;
        void this.report();
      }, debounceMs);
    }, "schedule");
    const unsub = this.store.subscribe(schedule);
    void this.report();
    return () => {
      if (timer)
        clearTimeout(timer);
      unsub();
    };
  }
};
function createReporter(store, cfg) {
  return new Reporter(store, cfg);
}
__name(createReporter, "createReporter");

// node_modules/.pnpm/@hanzo+usage@0.1.6_@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-na_9763093f82e9564e964c8197a9b6f274/node_modules/@hanzo/usage/dist/providers/codex.js
var codexHome = /* @__PURE__ */ __name((ctx) => ctx.host.env("CODEX_HOME") ?? expandHome(ctx.host, "~/.codex"), "codexHome");
var toWindow = /* @__PURE__ */ __name((w) => {
  if (!w || typeof w.used_percent !== "number")
    return void 0;
  return {
    usedPercent: w.used_percent,
    windowMinutes: w.limit_window_seconds ? Math.round(w.limit_window_seconds / 60) : void 0,
    resetsAt: w.reset_at ? new Date(w.reset_at * 1e3).toISOString() : void 0
  };
}, "toWindow");
var oauthStrategy = {
  id: "codex.oauth",
  kind: "oauth",
  async isAvailable(ctx) {
    const auth = await readJsonFile(ctx.host, `${codexHome(ctx)}/auth.json`);
    return Boolean(auth?.tokens?.access_token);
  },
  async fetch(ctx) {
    const auth = await readJsonFile(ctx.host, `${codexHome(ctx)}/auth.json`);
    const token = auth?.tokens?.access_token;
    if (!token)
      throw new Error("codex: no access token in auth.json");
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent": "HanzoUsage"
    };
    if (auth?.tokens?.account_id)
      headers["ChatGPT-Account-Id"] = auth.tokens.account_id;
    const res = await ctx.host.http({
      url: "https://chatgpt.com/backend-api/wham/usage",
      headers,
      timeoutMs: 3e4
    });
    if (res.status !== 200)
      throw new Error(`codex usage HTTP ${res.status}`);
    const body = JSON.parse(res.text);
    const now = ctx.host.now().toISOString();
    const usage = {
      providerId: "codex",
      primary: toWindow(body.rate_limit?.primary_window),
      secondary: toWindow(body.rate_limit?.secondary_window),
      extraRateWindows: (body.additional_rate_limits ?? []).map((extra) => {
        const window = toWindow(extra.rate_limit?.primary_window);
        if (!window || !extra.limit_name)
          return void 0;
        return { id: extra.limit_name, title: extra.limit_name, window, usageKnown: true };
      }).filter((w) => Boolean(w)),
      identity: { providerId: "codex", plan: body.plan_type, loginMethod: "oauth" },
      dataConfidence: "percentOnly",
      updatedAt: now
    };
    let credits;
    if (body.credits?.has_credits) {
      credits = {
        remaining: body.credits.balance ?? 0,
        unlimited: body.credits.unlimited,
        updatedAt: now
      };
    }
    return {
      usage,
      credits,
      sourceLabel: "OpenAI OAuth",
      strategyId: this.id,
      strategyKind: this.kind
    };
  }
};
var codexProvider = {
  id: "codex",
  metadata: {
    displayName: "Codex",
    sessionLabel: "5h limit",
    weeklyLabel: "Weekly limit",
    supportsCredits: true,
    defaultEnabled: true,
    dashboardUrl: "https://chatgpt.com/codex/settings/usage",
    statusPageUrl: "https://status.openai.com",
    color: "#10a37f"
  },
  strategies: /* @__PURE__ */ __name((mode) => forMode([oauthStrategy], mode), "strategies")
};

// node_modules/.pnpm/@hanzo+usage@0.1.6_@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-na_9763093f82e9564e964c8197a9b6f274/node_modules/@hanzo/usage/dist/providers/claude.js
var WINDOW_MINUTES = {
  five_hour: 300,
  seven_day: 10080,
  seven_day_sonnet: 10080,
  seven_day_opus: 10080
};
var toWindow2 = /* @__PURE__ */ __name((key, w) => {
  const used = w?.utilization ?? w?.used_percent;
  if (typeof used !== "number")
    return void 0;
  return { usedPercent: used, windowMinutes: WINDOW_MINUTES[key], resetsAt: w?.resets_at };
}, "toWindow");
var mapUsage = /* @__PURE__ */ __name((body, now, loginMethod, plan) => {
  const extras = [];
  for (const [key, title] of [
    ["seven_day_sonnet", "Sonnet weekly"],
    ["seven_day_opus", "Opus weekly"]
  ]) {
    const window = toWindow2(key, body[key]);
    if (window)
      extras.push({ id: key, title, window, usageKnown: true });
  }
  return {
    providerId: "claude",
    primary: toWindow2("five_hour", body.five_hour),
    secondary: toWindow2("seven_day", body.seven_day),
    extraRateWindows: extras.length ? extras : void 0,
    identity: {
      providerId: "claude",
      plan: plan ?? body.subscriptionType ?? body.rate_limit_tier,
      loginMethod
    },
    providerCost: body.extra_usage && typeof body.extra_usage.used_cents === "number" ? {
      used: body.extra_usage.used_cents / 100,
      limit: typeof body.extra_usage.limit_cents === "number" ? body.extra_usage.limit_cents / 100 : void 0,
      currencyCode: "USD",
      period: "monthly",
      updatedAt: now
    } : void 0,
    dataConfidence: "percentOnly",
    updatedAt: now
  };
}, "mapUsage");
var credentialPaths = ["~/.claude/.credentials.json", "~/.config/claude/.credentials.json"];
var readCredentials = /* @__PURE__ */ __name(async (ctx) => {
  for (const path of credentialPaths) {
    const file = await readJsonFile(ctx.host, path);
    if (file?.claudeAiOauth?.accessToken)
      return file.claudeAiOauth;
  }
  return void 0;
}, "readCredentials");
var oauthStrategy2 = {
  id: "claude.oauth",
  kind: "oauth",
  async isAvailable(ctx) {
    return Boolean(await readCredentials(ctx));
  },
  async fetch(ctx) {
    const creds = await readCredentials(ctx);
    if (!creds?.accessToken)
      throw new Error("claude: no OAuth credentials");
    const res = await ctx.host.http({
      url: "https://api.anthropic.com/api/oauth/usage",
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        "anthropic-beta": "oauth-2025-04-20",
        Accept: "application/json"
      },
      timeoutMs: 3e4
    });
    if (res.status !== 200)
      throw new Error(`claude usage HTTP ${res.status}`);
    const body = JSON.parse(res.text);
    return {
      usage: mapUsage(body, ctx.host.now().toISOString(), "oauth", creds.subscriptionType),
      sourceLabel: "Claude OAuth",
      strategyId: this.id,
      strategyKind: this.kind
    };
  }
};
var webStrategy = {
  id: "claude.web",
  kind: "web",
  async isAvailable(ctx) {
    return typeof ctx.settings?.cookieHeader === "string";
  },
  async fetch(ctx) {
    const cookie = String(ctx.settings?.cookieHeader);
    const get = /* @__PURE__ */ __name(async (path) => {
      const res = await ctx.host.http({
        url: `https://claude.ai/api${path}`,
        headers: { Cookie: cookie, Accept: "application/json" },
        timeoutMs: 3e4
      });
      if (res.status !== 200)
        throw new Error(`claude.ai${path} HTTP ${res.status}`);
      return JSON.parse(res.text);
    }, "get");
    const orgs = await get("/organizations");
    const orgId = orgs[0]?.uuid;
    if (!orgId)
      throw new Error("claude: no organization for session");
    const body = await get(`/organizations/${orgId}/usage`);
    return {
      usage: mapUsage(body, ctx.host.now().toISOString(), "web"),
      sourceLabel: "claude.ai session",
      strategyId: this.id,
      strategyKind: this.kind
    };
  }
};
var claudeProvider = {
  id: "claude",
  metadata: {
    displayName: "Claude",
    sessionLabel: "Session (5h)",
    weeklyLabel: "Weekly limit",
    defaultEnabled: true,
    dashboardUrl: "https://claude.ai/settings/usage",
    statusPageUrl: "https://status.anthropic.com",
    color: "#d97757"
  },
  strategies: /* @__PURE__ */ __name((mode) => forMode([oauthStrategy2, webStrategy], mode), "strategies")
};

// node_modules/.pnpm/@hanzo+usage@0.1.6_@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-na_9763093f82e9564e964c8197a9b6f274/node_modules/@hanzo/usage/dist/providers/hanzo.js
var num4 = /* @__PURE__ */ __name((v) => typeof v === "number" && Number.isFinite(v) ? v : 0, "num");
var cloudStrategy = {
  id: "hanzo.cloud",
  kind: "apiToken",
  async isAvailable(ctx) {
    return Boolean(ctx.settings?.getToken || ctx.settings?.apiKey);
  },
  async fetch(ctx) {
    const base = ctx.settings?.baseUrl ?? "https://api.hanzo.ai";
    const token = await ctx.settings?.getToken?.() ?? ctx.settings?.apiKey;
    if (!token)
      throw new Error("hanzo: no token for cloud usage");
    const res = await ctx.host.http({
      url: `${base}/v1/billing/usage`,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      timeoutMs: 3e4
    });
    if (res.status !== 200)
      throw new Error(`hanzo billing usage HTTP ${res.status}`);
    const body = JSON.parse(res.text);
    const entries = Array.isArray(body.usage) ? body.usage : Array.isArray(body.data) ? body.data : [];
    let tokens = num4(body.total_tokens ?? body.totalTokens);
    let spendCents = num4(body.spend_cents ?? body.spendCents);
    let requests = num4(body.total_requests ?? body.requests);
    for (const e of entries) {
      tokens += num4(e.total_tokens ?? e.totalTokens ?? e.tokens);
      spendCents += num4(e.spend_cents ?? e.spendCents ?? e.cost_cents);
      requests += num4(e.requests ?? e.request_count ?? 1) - (e.requests === void 0 && e.request_count === void 0 ? 1 : 0);
    }
    const now = ctx.host.now().toISOString();
    const usage = {
      providerId: "hanzo",
      identity: { providerId: "hanzo", loginMethod: "iam" },
      providerCost: {
        used: spendCents / 100,
        currencyCode: "USD",
        period: "monthly",
        updatedAt: now
      },
      totals: { tokens, requests },
      dataConfidence: "exact",
      updatedAt: now
    };
    return {
      usage,
      sourceLabel: "Hanzo Cloud",
      strategyId: this.id,
      strategyKind: this.kind
    };
  }
};
var devHome = /* @__PURE__ */ __name(async (ctx) => {
  const candidates = [
    ctx.host.env("HANZO_HOME"),
    ctx.host.env("CODEX_HOME"),
    expandHome(ctx.host, "~/.hanzo"),
    expandHome(ctx.host, "~/.codex")
  ].filter((c) => Boolean(c));
  for (const dir of candidates) {
    if ((await ctx.host.listDir(`${dir}/sessions`)).length > 0)
      return dir;
  }
  return void 0;
}, "devHome");
var newest = /* @__PURE__ */ __name((names) => names.filter((n) => /^\d+$/.test(n)).sort().at(-1), "newest");
var toRateWindow = /* @__PURE__ */ __name((w, now) => {
  if (!w || typeof w.used_percent !== "number")
    return void 0;
  return {
    usedPercent: w.used_percent,
    windowMinutes: w.window_minutes,
    resetsAt: typeof w.resets_in_seconds === "number" ? new Date(now.getTime() + w.resets_in_seconds * 1e3).toISOString() : void 0
  };
}, "toRateWindow");
var devStrategy = {
  id: "hanzo.dev",
  kind: "localProbe",
  async isAvailable(ctx) {
    return Boolean(await devHome(ctx));
  },
  async fetch(ctx) {
    const home = await devHome(ctx);
    if (!home)
      throw new Error("hanzo: no dev CLI home with sessions");
    const sessions = `${home}/sessions`;
    const year = newest(await ctx.host.listDir(sessions));
    const month = year && newest(await ctx.host.listDir(`${sessions}/${year}`));
    const day = month && newest(await ctx.host.listDir(`${sessions}/${year}/${month}`));
    if (!day)
      throw new Error("hanzo: no dev sessions found");
    const dayDir = `${sessions}/${year}/${month}/${day}`;
    const rollouts = (await ctx.host.listDir(dayDir)).filter((f) => f.endsWith(".jsonl")).sort();
    const latest = rollouts.at(-1);
    if (!latest)
      throw new Error("hanzo: no rollout files today");
    const text = await ctx.host.readTextFile(`${dayDir}/${latest}`) ?? "";
    let payload;
    for (const line of text.split("\n")) {
      if (!line.includes('"token_count"'))
        continue;
      try {
        const item = JSON.parse(line);
        if (item.payload?.type === "token_count")
          payload = item.payload;
      } catch {
      }
    }
    const now = ctx.host.now();
    const totals = payload?.info?.total_token_usage;
    const usage = {
      providerId: "hanzo",
      primary: toRateWindow(payload?.rate_limits?.primary, now),
      secondary: toRateWindow(payload?.rate_limits?.secondary, now),
      identity: { providerId: "hanzo", loginMethod: "dev-cli" },
      totals: totals ? {
        tokens: totals.total_tokens ?? 0,
        inputTokens: totals.input_tokens ?? 0,
        outputTokens: totals.output_tokens ?? 0,
        cachedInputTokens: totals.cached_input_tokens ?? 0
      } : void 0,
      dataConfidence: totals ? "exact" : "unknown",
      updatedAt: now.toISOString()
    };
    return {
      usage,
      sourceLabel: "Hanzo Dev CLI",
      strategyId: this.id,
      strategyKind: this.kind
    };
  }
};
var hanzoProvider = {
  id: "hanzo",
  metadata: {
    displayName: "Hanzo",
    sessionLabel: "5h limit",
    weeklyLabel: "Weekly limit",
    defaultEnabled: true,
    dashboardUrl: "https://console.hanzo.ai/billing/usage",
    color: "#ff2d55"
  },
  strategies: /* @__PURE__ */ __name((mode) => forMode([cloudStrategy, devStrategy], mode), "strategies")
};

// node_modules/.pnpm/@hanzo+usage@0.1.6_@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-na_9763093f82e9564e964c8197a9b6f274/node_modules/@hanzo/usage/dist/providers/api-token.js
var resolveBaseUrl = /* @__PURE__ */ __name((ctx, envKeys = []) => {
  const fromSettings = ctx.settings?.baseUrl;
  if (typeof fromSettings === "string" && fromSettings.length > 0)
    return fromSettings;
  for (const name of envKeys) {
    const value = ctx.host.env(name);
    if (value)
      return value;
  }
  return void 0;
}, "resolveBaseUrl");
var resolveApiKey = /* @__PURE__ */ __name((ctx, envKeys = []) => {
  const fromSettings = ctx.settings?.apiKey;
  if (typeof fromSettings === "string" && fromSettings.length > 0)
    return fromSettings;
  for (const name of envKeys) {
    const value = ctx.host.env(name);
    if (value)
      return value;
  }
  return void 0;
}, "resolveApiKey");
var makeApiTokenStrategy = /* @__PURE__ */ __name((config) => {
  const label = config.sourceLabel ?? config.metadata.displayName;
  return {
    id: `${config.id}.apiToken`,
    kind: "apiToken",
    async isAvailable(ctx) {
      if (!resolveApiKey(ctx, config.envKeys))
        return false;
      if (config.requireBaseUrl && !resolveBaseUrl(ctx, config.baseUrlEnv))
        return false;
      return true;
    },
    async fetch(ctx) {
      const apiKey = resolveApiKey(ctx, config.envKeys);
      if (!apiKey)
        throw new Error(`${config.id}: no API key`);
      const baseUrl = resolveBaseUrl(ctx, config.baseUrlEnv);
      if (config.requireBaseUrl && !baseUrl)
        throw new Error(`${config.id}: no base URL`);
      const settings = { ...ctx.settings, apiKey, ...baseUrl ? { baseUrl } : {} };
      const req = config.request(settings, ctx);
      const res = await ctx.host.http({ method: "GET", timeoutMs: 3e4, ...req });
      if (res.status !== 200)
        throw new Error(`${config.id} HTTP ${res.status}`);
      let body;
      try {
        body = JSON.parse(res.text);
      } catch {
        throw new Error(`${config.id}: invalid JSON body`);
      }
      const now = ctx.host.now();
      const iso = now.toISOString();
      const { usage, credits } = config.map(body, now, settings);
      return {
        usage: { ...usage, providerId: config.id, updatedAt: iso },
        credits: credits ? { ...credits, updatedAt: iso } : void 0,
        sourceLabel: label,
        strategyId: `${config.id}.apiToken`,
        strategyKind: "apiToken"
      };
    },
    // API-key providers have exactly one source; nothing to fall back to.
    shouldFallback() {
      return false;
    }
  };
}, "makeApiTokenStrategy");
var makeApiTokenProvider = /* @__PURE__ */ __name((config) => {
  const strategy = makeApiTokenStrategy(config);
  return {
    id: config.id,
    metadata: config.metadata,
    strategies: /* @__PURE__ */ __name((mode) => forMode([strategy], mode), "strategies")
  };
}, "makeApiTokenProvider");
var numberOrUndefined = /* @__PURE__ */ __name((v) => typeof v === "number" && Number.isFinite(v) ? v : void 0, "numberOrUndefined");
var bearer = /* @__PURE__ */ __name((key) => ({
  Authorization: `Bearer ${key}`,
  Accept: "application/json"
}), "bearer");

// node_modules/.pnpm/@hanzo+usage@0.1.6_@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-na_9763093f82e9564e964c8197a9b6f274/node_modules/@hanzo/usage/dist/providers/groq.js
var ENV_KEYS = ["GROQ_API_KEY"];
var ENV_URL = "GROQ_API_URL";
var DEFAULT_BASE = "https://api.groq.com/v1";
var QUERIES = {
  requests: "sum(model_project_id_status_code:requests:rate5m)",
  tokensIn: "sum(model_project_id:tokens_in:rate5m)",
  tokensOut: "sum(model_project_id:tokens_out:rate5m)"
};
var sumRate = /* @__PURE__ */ __name((body) => {
  if (body.status !== "success")
    return 0;
  let total = 0;
  for (const series of body.data?.result ?? []) {
    const raw = series.value?.[1];
    const n = typeof raw === "number" ? raw : Number(raw);
    if (Number.isFinite(n))
      total += n;
  }
  return total;
}, "sumRate");
var groqStrategy = {
  id: "groq.apiToken",
  kind: "apiToken",
  async isAvailable(ctx) {
    return Boolean(resolveApiKey(ctx, ENV_KEYS));
  },
  async fetch(ctx) {
    const key = resolveApiKey(ctx, ENV_KEYS);
    if (!key)
      throw new Error("groq: no API key");
    const base = ctx.settings?.baseUrl ?? ctx.host.env(ENV_URL) ?? DEFAULT_BASE;
    const query = /* @__PURE__ */ __name(async (promql) => {
      const res = await ctx.host.http({
        url: `${base}/metrics/prometheus/api/v1/query?query=${encodeURIComponent(promql)}`,
        headers: bearer(key),
        timeoutMs: 3e4
      });
      if (res.status !== 200)
        throw new Error(`groq metrics HTTP ${res.status}`);
      return JSON.parse(res.text);
    }, "query");
    const [requests, tokensIn, tokensOut] = await Promise.all([
      query(QUERIES.requests),
      query(QUERIES.tokensIn),
      query(QUERIES.tokensOut)
    ]);
    const requestsPerMin = Math.round(sumRate(requests) * 60);
    const tokensPerMin = Math.round((sumRate(tokensIn) + sumRate(tokensOut)) * 60);
    const now = ctx.host.now().toISOString();
    const usage = {
      providerId: "groq",
      identity: { providerId: "groq", loginMethod: "api" },
      totals: { tokens: tokensPerMin, requests: requestsPerMin },
      dataConfidence: "estimated",
      updatedAt: now
    };
    return { usage, sourceLabel: "Groq metrics", strategyId: this.id, strategyKind: this.kind };
  },
  shouldFallback() {
    return false;
  }
};
var groqProvider = {
  id: "groq",
  metadata: {
    displayName: "Groq",
    sessionLabel: "Throughput (req/min)",
    weeklyLabel: "Tokens/min",
    dashboardUrl: "https://console.groq.com/metrics",
    color: "#f55036"
  },
  strategies: /* @__PURE__ */ __name((mode) => forMode([groqStrategy], mode), "strategies")
};

// node_modules/.pnpm/@hanzo+usage@0.1.6_@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-na_9763093f82e9564e964c8197a9b6f274/node_modules/@hanzo/usage/dist/providers/deepgram.js
var ENV_KEYS2 = ["DEEPGRAM_API_KEY"];
var ENV_URL2 = "DEEPGRAM_API_URL";
var ENV_PROJECT = "DEEPGRAM_PROJECT_ID";
var DEFAULT_BASE2 = "https://api.deepgram.com/v1";
var num5 = /* @__PURE__ */ __name((v) => typeof v === "number" && Number.isFinite(v) ? v : 0, "num");
var deepgramStrategy = {
  id: "deepgram.apiToken",
  kind: "apiToken",
  async isAvailable(ctx) {
    return Boolean(resolveApiKey(ctx, ENV_KEYS2));
  },
  async fetch(ctx) {
    const key = resolveApiKey(ctx, ENV_KEYS2);
    if (!key)
      throw new Error("deepgram: no API key");
    const base = ctx.settings?.baseUrl ?? ctx.host.env(ENV_URL2) ?? DEFAULT_BASE2;
    const headers = { Authorization: `Token ${key}`, Accept: "application/json" };
    const get = /* @__PURE__ */ __name(async (path) => {
      const res = await ctx.host.http({ url: `${base}${path}`, headers, timeoutMs: 3e4 });
      if (res.status !== 200)
        throw new Error(`deepgram ${path} HTTP ${res.status}`);
      return JSON.parse(res.text);
    }, "get");
    const configured = (typeof ctx.settings?.projectId === "string" ? ctx.settings.projectId : void 0) ?? ctx.host.env(ENV_PROJECT);
    let projectIds;
    if (configured) {
      projectIds = [configured];
    } else {
      const body = await get("/projects");
      const projects = Array.isArray(body.projects) ? body.projects : [];
      projectIds = projects.map((p) => p.project_id).filter((id) => Boolean(id));
    }
    let hours = 0;
    let tokens = 0;
    let requests = 0;
    for (const id of projectIds) {
      const body = await get(`/projects/${id}/usage/breakdown`);
      for (const r of Array.isArray(body.results) ? body.results : []) {
        hours += num5(r.total_hours);
        tokens += num5(r.tokens_in) + num5(r.tokens_out);
        requests += num5(r.requests);
      }
    }
    const now = ctx.host.now().toISOString();
    const usage = {
      providerId: "deepgram",
      identity: {
        providerId: "deepgram",
        loginMethod: "api",
        accountOrganization: projectIds.length === 1 ? projectIds[0] : `${projectIds.length} projects`
      },
      totals: { tokens, requests },
      dataConfidence: tokens > 0 || requests > 0 || hours > 0 ? "exact" : "unknown",
      updatedAt: now
    };
    return { usage, sourceLabel: "Deepgram usage", strategyId: this.id, strategyKind: this.kind };
  },
  shouldFallback() {
    return false;
  }
};
var deepgramProvider = {
  id: "deepgram",
  metadata: {
    displayName: "Deepgram",
    sessionLabel: "Usage",
    weeklyLabel: "Requests",
    dashboardUrl: "https://console.deepgram.com/usage",
    color: "#13ef93"
  },
  strategies: /* @__PURE__ */ __name((mode) => forMode([deepgramStrategy], mode), "strategies")
};

// node_modules/.pnpm/@hanzo+usage@0.1.6_@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-na_9763093f82e9564e964c8197a9b6f274/node_modules/@hanzo/usage/dist/providers/byo.js
var ENV_KEYS3 = ["BYO_API_KEY"];
var ENV_URL3 = ["BYO_BASE_URL"];
var num6 = /* @__PURE__ */ __name((v) => typeof v === "number" && Number.isFinite(v) ? v : 0, "num");
var obj = /* @__PURE__ */ __name((v) => v && typeof v === "object" ? v : {}, "obj");
var stripV1 = /* @__PURE__ */ __name((base) => base.replace(/\/v1\/?$/, "").replace(/\/$/, ""), "stripV1");
var keyInfo = /* @__PURE__ */ __name(async (ctx, base, key, now) => {
  const res = await ctx.host.http({
    url: `${stripV1(base)}/key/info`,
    headers: bearer(key),
    timeoutMs: 15e3
  });
  if (res.status !== 200)
    return void 0;
  let info;
  try {
    info = obj(obj(JSON.parse(res.text)).info);
  } catch {
    return void 0;
  }
  if (Object.keys(info).length === 0)
    return void 0;
  const spend = num6(info.spend);
  return {
    providerId: "byo",
    identity: {
      providerId: "byo",
      loginMethod: "api",
      accountEmail: typeof info.user_id === "string" ? info.user_id : void 0,
      accountOrganization: typeof info.team_id === "string" ? info.team_id : void 0,
      plan: typeof info.key_name === "string" ? info.key_name : void 0
    },
    providerCost: { used: spend, currencyCode: "USD", period: "key", updatedAt: now.toISOString() },
    subscriptionExpiresAt: typeof info.expires === "string" ? info.expires : void 0,
    dataConfidence: "exact",
    updatedAt: now.toISOString()
  };
}, "keyInfo");
var modelsLiveness = /* @__PURE__ */ __name(async (ctx, base, key, now) => {
  const root = stripV1(base);
  const res = await ctx.host.http({
    url: `${root}/v1/models`,
    headers: bearer(key),
    timeoutMs: 15e3
  });
  if (res.status !== 200)
    throw new Error(`byo: /v1/models HTTP ${res.status}`);
  let count;
  try {
    const data = obj(JSON.parse(res.text)).data;
    if (Array.isArray(data))
      count = data.length;
  } catch {
  }
  return {
    providerId: "byo",
    identity: {
      providerId: "byo",
      loginMethod: "api",
      accountOrganization: count !== void 0 ? `${count} models` : void 0
    },
    dataConfidence: "unknown",
    updatedAt: now.toISOString()
  };
}, "modelsLiveness");
var byoStrategy = {
  id: "byo.apiToken",
  kind: "apiToken",
  async isAvailable(ctx) {
    return Boolean(resolveApiKey(ctx, ENV_KEYS3) && resolveBaseUrl(ctx, ENV_URL3));
  },
  async fetch(ctx) {
    const key = resolveApiKey(ctx, ENV_KEYS3);
    const base = resolveBaseUrl(ctx, ENV_URL3);
    if (!key || !base)
      throw new Error("byo: baseUrl and apiKey are required");
    const now = ctx.host.now();
    const info = await keyInfo(ctx, base, key, now);
    if (info) {
      return { usage: info, sourceLabel: "BYO /key/info", strategyId: this.id, strategyKind: this.kind };
    }
    const usage = await modelsLiveness(ctx, base, key, now);
    return { usage, sourceLabel: "BYO liveness", strategyId: this.id, strategyKind: this.kind };
  },
  shouldFallback() {
    return false;
  }
};
var byoProvider = {
  id: "byo",
  metadata: {
    displayName: "BYO endpoint",
    sessionLabel: "Key spend",
    weeklyLabel: "Liveness",
    dashboardUrl: "https://docs.hanzo.ai/docs/gateway",
    color: "#64748b"
  },
  strategies: /* @__PURE__ */ __name((mode) => forMode([byoStrategy], mode), "strategies")
};

// node_modules/.pnpm/@hanzo+usage@0.1.6_@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-na_9763093f82e9564e964c8197a9b6f274/node_modules/@hanzo/usage/dist/providers/api-token-providers.js
var num7 = /* @__PURE__ */ __name((v) => typeof v === "number" && Number.isFinite(v) ? v : 0, "num");
var loose = /* @__PURE__ */ __name((v) => {
  if (typeof v === "number" && Number.isFinite(v))
    return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : void 0;
  }
  return void 0;
}, "loose");
var pct2 = /* @__PURE__ */ __name((used, limit) => limit > 0 ? Math.min(100, Math.max(0, used / limit * 100)) : 0, "pct");
var obj2 = /* @__PURE__ */ __name((v) => v && typeof v === "object" ? v : {}, "obj");
var openrouterProvider = makeApiTokenProvider({
  id: "openrouter",
  metadata: {
    displayName: "OpenRouter",
    sessionLabel: "Credits used",
    weeklyLabel: "Credit limit",
    supportsCredits: true,
    dashboardUrl: "https://openrouter.ai/settings/credits",
    color: "#6467f2"
  },
  envKeys: ["OPENROUTER_API_KEY"],
  request: /* @__PURE__ */ __name((s, ctx) => ({
    url: `${s.baseUrl ?? ctx.host.env("OPENROUTER_API_URL") ?? "https://openrouter.ai/api/v1"}/credits`,
    headers: bearer(s.apiKey)
  }), "request"),
  map: /* @__PURE__ */ __name((json, now) => {
    const d = obj2(obj2(json).data);
    const total = num7(d.total_credits);
    const used = num7(d.total_usage);
    return {
      usage: {
        identity: { providerId: "openrouter", loginMethod: "api" },
        providerCost: { used, limit: total, currencyCode: "USD", period: "total", updatedAt: now.toISOString() },
        dataConfidence: "exact"
      },
      credits: { remaining: Math.max(0, total - used) }
    };
  }, "map")
});
var deepseekProvider = makeApiTokenProvider({
  id: "deepseek",
  metadata: {
    displayName: "DeepSeek",
    sessionLabel: "Balance",
    weeklyLabel: "Balance",
    supportsCredits: true,
    dashboardUrl: "https://platform.deepseek.com/usage",
    color: "#527df0"
  },
  envKeys: ["DEEPSEEK_API_KEY", "DEEPSEEK_KEY"],
  request: /* @__PURE__ */ __name((s) => ({ url: "https://api.deepseek.com/user/balance", headers: bearer(s.apiKey) }), "request"),
  map: /* @__PURE__ */ __name((json) => {
    const infos = Array.isArray(obj2(json).balance_infos) ? obj2(json).balance_infos : [];
    const bal = /* @__PURE__ */ __name((r) => loose(r.total_balance) ?? 0, "bal");
    const row = infos.find((r) => r.currency === "USD" && bal(r) > 0) ?? infos.find((r) => bal(r) > 0) ?? infos.find((r) => r.currency === "USD") ?? infos[0];
    return {
      usage: {
        identity: { providerId: "deepseek", loginMethod: "api", plan: typeof row?.currency === "string" ? row.currency : void 0 },
        dataConfidence: "exact"
      },
      credits: { remaining: row ? bal(row) : 0 }
    };
  }, "map")
});
var elevenlabsProvider = makeApiTokenProvider({
  id: "elevenlabs",
  metadata: {
    displayName: "ElevenLabs",
    sessionLabel: "Characters",
    weeklyLabel: "Character limit",
    dashboardUrl: "https://elevenlabs.io/app/subscription",
    color: "#ebebe6"
  },
  envKeys: ["ELEVENLABS_API_KEY", "XI_API_KEY"],
  request: /* @__PURE__ */ __name((s, ctx) => ({
    url: `${s.baseUrl ?? ctx.host.env("ELEVENLABS_API_URL") ?? "https://api.elevenlabs.io"}/v1/user/subscription`,
    headers: { "xi-api-key": s.apiKey, Accept: "application/json" }
  }), "request"),
  map: /* @__PURE__ */ __name((json, now) => {
    const b = obj2(json);
    const count = num7(b.character_count);
    const limit = num7(b.character_limit);
    const resetUnix = numberOrUndefined(b.next_character_count_reset_unix);
    const resetsAt = resetUnix !== void 0 ? new Date(resetUnix * 1e3).toISOString() : void 0;
    const overage = obj2(b.current_overage);
    const overageAmount = loose(overage.amount);
    return {
      usage: {
        primary: { usedPercent: pct2(count, limit), resetsAt },
        identity: { providerId: "elevenlabs", loginMethod: "api", plan: typeof b.tier === "string" ? b.tier : void 0 },
        subscriptionRenewsAt: resetsAt,
        providerCost: overageAmount !== void 0 && overageAmount > 0 ? {
          used: overageAmount,
          currencyCode: typeof overage.currency === "string" ? overage.currency : "USD",
          period: "overage",
          updatedAt: now.toISOString()
        } : void 0,
        dataConfidence: "exact"
      }
    };
  }, "map")
});
var poeProvider = makeApiTokenProvider({
  id: "poe",
  metadata: {
    displayName: "Poe",
    sessionLabel: "Points",
    weeklyLabel: "Points",
    supportsCredits: true,
    dashboardUrl: "https://poe.com/api/keys",
    color: "#5d5cde"
  },
  envKeys: ["POE_API_KEY"],
  request: /* @__PURE__ */ __name((s) => ({ url: "https://api.poe.com/usage/current_balance", headers: bearer(s.apiKey) }), "request"),
  map: /* @__PURE__ */ __name((json) => ({
    usage: { identity: { providerId: "poe", loginMethod: "api" }, dataConfidence: "exact" },
    credits: { remaining: num7(obj2(json).current_point_balance) }
  }), "map")
});
var veniceProvider = makeApiTokenProvider({
  id: "venice",
  metadata: {
    displayName: "Venice",
    sessionLabel: "Balance",
    weeklyLabel: "DIEM allocation",
    supportsCredits: true,
    dashboardUrl: "https://venice.ai/settings/api",
    color: "#3399ff"
  },
  envKeys: ["VENICE_API_KEY", "VENICE_KEY"],
  request: /* @__PURE__ */ __name((s) => ({ url: "https://api.venice.ai/api/v1/billing/balance", headers: bearer(s.apiKey) }), "request"),
  map: /* @__PURE__ */ __name((json) => {
    const b = obj2(json);
    const balances = obj2(b.balances);
    const canConsume = b.canConsume !== false;
    const currency = (typeof b.consumptionCurrency === "string" ? b.consumptionCurrency : "USD").toUpperCase();
    const usd = loose(balances.usd);
    const diem = loose(balances.diem);
    const alloc = loose(b.diemEpochAllocation);
    const isDiem = currency === "DIEM";
    const remaining = (isDiem ? diem : usd) ?? 0;
    let usedPercent = 0;
    if (!canConsume)
      usedPercent = 100;
    else if (isDiem && alloc && alloc > 0)
      usedPercent = pct2(Math.max(0, alloc - remaining), alloc);
    return {
      usage: {
        primary: { usedPercent },
        identity: { providerId: "venice", loginMethod: "api", plan: currency },
        dataConfidence: "exact"
      },
      credits: { remaining }
    };
  }, "map")
});
var chutesWindow = /* @__PURE__ */ __name((container, windowMinutes) => {
  const w = obj2(container);
  const pick = /* @__PURE__ */ __name((keys) => {
    for (const k of keys) {
      const v = loose(w[k]);
      if (v !== void 0)
        return v;
    }
    return void 0;
  }, "pick");
  const explicit = pick(["percent_used", "usage_percent", "used_percent", "utilization", "utilization_percent"]);
  const remainingPct = pick(["percent_remaining", "remaining_percent"]);
  const used = pick(["used", "usage", "consumed", "current", "requests", "tokens", "monthly_usage"]);
  const limit = pick(["limit", "cap", "max", "maximum", "quota", "quota_limit", "monthly_limit", "total"]);
  const remaining = pick(["remaining", "available", "balance", "left"]);
  let usedPercent = explicit;
  if (usedPercent === void 0 && remainingPct !== void 0)
    usedPercent = 100 - remainingPct;
  if (usedPercent !== void 0 && usedPercent <= 1 && usedPercent >= 0)
    usedPercent *= 100;
  if (usedPercent === void 0 && limit !== void 0) {
    const u = used ?? (remaining !== void 0 ? limit - remaining : void 0);
    if (u !== void 0)
      usedPercent = pct2(u, limit);
  }
  if (usedPercent === void 0)
    return void 0;
  const resetRaw = pick(["reset_at", "resets_at", "next_reset_at", "period_end", "current_period_end", "expires_at", "window_end"]);
  return {
    usedPercent: Math.min(100, Math.max(0, usedPercent)),
    windowMinutes,
    resetsAt: resetRaw !== void 0 ? new Date(resetRaw * 1e3).toISOString() : void 0
  };
}, "chutesWindow");
var chutesProvider = makeApiTokenProvider({
  id: "chutes",
  metadata: {
    displayName: "Chutes",
    sessionLabel: "4h quota",
    weeklyLabel: "Monthly quota",
    dashboardUrl: "https://chutes.ai",
    color: "#eab308"
  },
  envKeys: ["CHUTES_API_KEY"],
  request: /* @__PURE__ */ __name((s, ctx) => ({
    url: `${s.baseUrl ?? ctx.host.env("CHUTES_API_URL") ?? "https://api.chutes.ai"}/users/me/subscription_usage`,
    headers: bearer(s.apiKey)
  }), "request"),
  map: /* @__PURE__ */ __name((json) => {
    const b = obj2(json);
    const rolling = chutesWindow(b.rolling, 240) ?? chutesWindow(b.rolling_window, 240) ?? chutesWindow(b.four_hour, 240);
    const monthly = chutesWindow(b.monthly, 43200) ?? chutesWindow(b.subscription, 43200) ?? chutesWindow(b.subscription_usage, 43200);
    const plan = b.plan_name ?? b.plan ?? b.tier;
    return {
      usage: {
        primary: rolling,
        secondary: monthly,
        identity: { providerId: "chutes", loginMethod: "api", plan: typeof plan === "string" ? plan : void 0 },
        dataConfidence: rolling || monthly ? "percentOnly" : "unknown"
      }
    };
  }, "map")
});
var moonshotBase = /* @__PURE__ */ __name((region) => region === "china" ? "https://api.moonshot.cn" : "https://api.moonshot.ai", "moonshotBase");
var moonshotProvider = makeApiTokenProvider({
  id: "moonshot",
  metadata: {
    displayName: "Moonshot",
    sessionLabel: "Balance",
    weeklyLabel: "Balance",
    supportsCredits: true,
    dashboardUrl: "https://platform.moonshot.ai/console/info",
    color: "#16a34a"
  },
  envKeys: ["MOONSHOT_API_KEY", "MOONSHOT_KEY"],
  request: /* @__PURE__ */ __name((s, ctx) => ({
    url: `${s.baseUrl ?? moonshotBase(s.region ?? ctx.host.env("MOONSHOT_REGION"))}/v1/users/me/balance`,
    headers: bearer(s.apiKey)
  }), "request"),
  map: /* @__PURE__ */ __name((json) => {
    const d = obj2(obj2(json).data);
    return {
      usage: { identity: { providerId: "moonshot", loginMethod: "api" }, dataConfidence: "exact" },
      credits: { remaining: num7(d.available_balance) }
    };
  }, "map")
});
var kimiProvider = makeApiTokenProvider({
  id: "kimi",
  metadata: {
    displayName: "Kimi",
    sessionLabel: "Weekly",
    weeklyLabel: "Rate (5h)",
    dashboardUrl: "https://www.kimi.com/code/console",
    color: "#111111"
  },
  envKeys: ["KIMI_CODE_API_KEY"],
  request: /* @__PURE__ */ __name((s, ctx) => ({
    url: `${s.baseUrl ?? ctx.host.env("KIMI_CODE_BASE_URL") ?? "https://api.kimi.com"}/coding/v1/usages`,
    headers: bearer(s.apiKey)
  }), "request"),
  map: /* @__PURE__ */ __name((json) => {
    const b = obj2(json);
    const detail = obj2(b.usage);
    const limit = loose(detail.limit) ?? 0;
    const used = loose(detail.used) ?? (limit && loose(detail.remaining) !== void 0 ? limit - loose(detail.remaining) : 0);
    const resetTime = detail.resetTime ?? detail.resetAt ?? detail.reset_time;
    const rate = obj2(obj2(Array.isArray(b.limits) ? b.limits[0] : void 0).detail);
    const rateLimit = loose(rate.limit);
    const rateUsed = loose(rate.used);
    const secondary = rateLimit !== void 0 ? { usedPercent: pct2(rateUsed ?? 0, rateLimit), windowMinutes: 300 } : void 0;
    return {
      usage: {
        primary: { usedPercent: pct2(used, limit), resetsAt: typeof resetTime === "string" ? resetTime : void 0 },
        secondary,
        identity: { providerId: "kimi", loginMethod: "api" },
        dataConfidence: "percentOnly"
      }
    };
  }, "map")
});
var kimik2Provider = makeApiTokenProvider({
  id: "kimik2",
  metadata: {
    displayName: "Kimi K2",
    sessionLabel: "Credits",
    weeklyLabel: "Credits",
    supportsCredits: true,
    dashboardUrl: "https://kimi-k2.ai",
    color: "#111111"
  },
  envKeys: ["KIMI_K2_API_KEY", "KIMI_API_KEY", "KIMI_KEY"],
  request: /* @__PURE__ */ __name((s) => ({ url: "https://kimi-k2.ai/api/user/credits", headers: bearer(s.apiKey) }), "request"),
  map: /* @__PURE__ */ __name((json) => {
    const b = obj2(json);
    const nested = { ...obj2(b.data), ...obj2(b.result), ...obj2(b.usage), ...obj2(b.credits) };
    const pick = /* @__PURE__ */ __name((keys) => {
      for (const k of keys) {
        const v = loose(b[k]) ?? loose(nested[k]);
        if (v !== void 0)
          return v;
      }
      return void 0;
    }, "pick");
    const remaining = pick([
      "credits_remaining",
      "creditsRemaining",
      "remaining_credits",
      "remainingCredits",
      "available_credits",
      "availableCredits",
      "credits_left",
      "creditsLeft",
      "remaining"
    ]) ?? 0;
    return {
      usage: { identity: { providerId: "kimik2", loginMethod: "api" }, dataConfidence: "exact" },
      credits: { remaining }
    };
  }, "map")
});
var zaiBase = /* @__PURE__ */ __name((region) => region === "bigmodel-cn" ? "https://open.bigmodel.cn" : "https://api.z.ai", "zaiBase");
var ZAI_UNIT_MINUTES = { 1: 1440, 3: 60, 5: 1, 6: 10080 };
var zaiWindow = /* @__PURE__ */ __name((raw) => {
  const limit = loose(raw.usage) ?? 0;
  const current = loose(raw.currentValue);
  const remaining = loose(raw.remaining);
  const used = current ?? (remaining !== void 0 ? Math.max(0, limit - remaining) : void 0);
  const explicit = loose(raw.percentage);
  const usedPercent = used !== void 0 && limit > 0 ? pct2(used, limit) : explicit ?? 0;
  const unit = loose(raw.unit);
  const number = loose(raw.number);
  const resetMs = loose(raw.nextResetTime);
  return {
    usedPercent,
    windowMinutes: unit !== void 0 && number !== void 0 ? (ZAI_UNIT_MINUTES[unit] ?? 0) * number : void 0,
    resetsAt: resetMs !== void 0 ? new Date(resetMs).toISOString() : void 0
  };
}, "zaiWindow");
var zaiProvider = makeApiTokenProvider({
  id: "zai",
  metadata: {
    displayName: "z.ai",
    sessionLabel: "Token quota",
    weeklyLabel: "Time quota",
    dashboardUrl: "https://z.ai/manage-apikey/coding-plan/personal/my-plan",
    color: "#3b82f6"
  },
  envKeys: ["Z_AI_API_KEY"],
  baseUrlEnv: ["Z_AI_API_HOST"],
  request: /* @__PURE__ */ __name((s, ctx) => ({
    url: `${resolveZaiBase(s, ctx.host.env("Z_AI_API_HOST"))}/api/monitor/usage/quota/limit`,
    headers: { ...bearer(s.apiKey), accept: "application/json" }
  }), "request"),
  map: /* @__PURE__ */ __name((json) => {
    const data = obj2(obj2(json).data);
    const limits = Array.isArray(data.limits) ? data.limits : [];
    const tokens = limits.filter((l) => l.type === "TOKENS_LIMIT").map(zaiWindow);
    const time = limits.find((l) => l.type === "TIME_LIMIT");
    const plan = data.planName ?? data.plan ?? data.planType ?? data.packageName;
    return {
      usage: {
        primary: tokens[0],
        secondary: time ? zaiWindow(time) : void 0,
        tertiary: tokens[1],
        identity: { providerId: "zai", loginMethod: "api", plan: typeof plan === "string" ? plan : void 0 },
        dataConfidence: tokens.length || time ? "percentOnly" : "unknown"
      }
    };
  }, "map")
});
var resolveZaiBase = /* @__PURE__ */ __name((s, hostEnv) => s.baseUrl ?? hostEnv ?? zaiBase(s.region), "resolveZaiBase");
var openaiProvider = makeApiTokenProvider({
  id: "openai",
  metadata: {
    displayName: "OpenAI",
    sessionLabel: "Credits used",
    weeklyLabel: "Credit grant",
    supportsCredits: true,
    dashboardUrl: "https://platform.openai.com/usage",
    statusPageUrl: "https://status.openai.com",
    color: "#0f826e"
  },
  envKeys: ["OPENAI_ADMIN_KEY", "OPENAI_API_KEY"],
  request: /* @__PURE__ */ __name((s) => ({
    url: "https://api.openai.com/v1/dashboard/billing/credit_grants",
    headers: bearer(s.apiKey)
  }), "request"),
  map: /* @__PURE__ */ __name((json, now) => {
    const b = obj2(json);
    const granted = num7(b.total_granted);
    const used = num7(b.total_used);
    const available = num7(b.total_available);
    return {
      usage: {
        primary: { usedPercent: pct2(used, granted) },
        identity: { providerId: "openai", loginMethod: "api" },
        providerCost: { used, limit: granted, currencyCode: "USD", period: "grant", updatedAt: now.toISOString() },
        dataConfidence: "exact"
      },
      credits: { remaining: available }
    };
  }, "map")
});
var stripV12 = /* @__PURE__ */ __name((base) => base.replace(/\/v1\/?$/, ""), "stripV1");
var litellmProvider = makeApiTokenProvider({
  id: "litellm",
  metadata: {
    displayName: "LiteLLM",
    sessionLabel: "Key spend",
    weeklyLabel: "Budget",
    dashboardUrl: "https://docs.litellm.ai/docs/proxy/cost_tracking",
    color: "#22c55e"
  },
  envKeys: ["LITELLM_API_KEY"],
  baseUrlEnv: ["LITELLM_BASE_URL"],
  requireBaseUrl: true,
  request: /* @__PURE__ */ __name((s) => ({ url: `${stripV12(s.baseUrl)}/key/info`, headers: bearer(s.apiKey) }), "request"),
  map: /* @__PURE__ */ __name((json, now) => {
    const info = obj2(obj2(json).info);
    const spend = num7(info.spend);
    return {
      usage: {
        identity: {
          providerId: "litellm",
          loginMethod: "api",
          accountOrganization: typeof info.team_id === "string" ? info.team_id : void 0,
          accountEmail: typeof info.user_id === "string" ? info.user_id : void 0,
          plan: typeof info.key_name === "string" ? info.key_name : void 0
        },
        providerCost: { used: spend, currencyCode: "USD", period: "key", updatedAt: now.toISOString() },
        subscriptionExpiresAt: typeof info.expires === "string" ? info.expires : void 0,
        dataConfidence: "exact"
      }
    };
  }, "map")
});
var llmProxyV1 = /* @__PURE__ */ __name((base) => /\/v1\/?$/.test(base) ? base.replace(/\/$/, "") : `${base.replace(/\/$/, "")}/v1`, "llmProxyV1");
var llmproxyProvider = makeApiTokenProvider({
  id: "llmproxy",
  metadata: {
    displayName: "LLM Proxy",
    sessionLabel: "Quota used",
    weeklyLabel: "Approx. spend",
    dashboardUrl: "https://github.com/hzruo/LLM-API-Key-Proxy",
    color: "#8b5cf6"
  },
  envKeys: ["LLM_PROXY_API_KEY"],
  baseUrlEnv: ["LLM_PROXY_BASE_URL"],
  requireBaseUrl: true,
  request: /* @__PURE__ */ __name((s) => ({ url: `${llmProxyV1(s.baseUrl)}/quota-stats`, headers: bearer(s.apiKey) }), "request"),
  map: /* @__PURE__ */ __name((json, now) => {
    const b = obj2(json);
    const providers = obj2(b.providers);
    const summary = obj2(b.summary);
    let minRemaining = 100;
    let earliestReset;
    let sumTokens = 0;
    let sumRequests = 0;
    let sumCost = 0;
    for (const p of Object.values(providers)) {
      const stats = obj2(p);
      sumRequests += num7(stats.total_requests);
      sumCost += num7(stats.approx_cost);
      const t = obj2(stats.tokens);
      sumTokens += num7(t.input_cached) + num7(t.input_uncached) + num7(t.output);
      const groups = Array.isArray(stats.quota_groups) ? stats.quota_groups : Object.values(obj2(stats.quota_groups));
      for (const g of groups) {
        const grp = obj2(g);
        const rem = loose(grp.remaining_percent);
        if (rem !== void 0 && rem < minRemaining)
          minRemaining = rem;
        const reset = typeof grp.reset_time === "string" ? grp.reset_time : void 0;
        if (reset && (!earliestReset || reset < earliestReset))
          earliestReset = reset;
      }
    }
    const totalRequests = numberOrUndefined(summary.total_requests) ?? sumRequests;
    const totalTokens = numberOrUndefined(summary.total_tokens) ?? sumTokens;
    const approxCost = numberOrUndefined(summary.approx_cost) ?? sumCost;
    return {
      usage: {
        primary: { usedPercent: Math.min(100, Math.max(0, 100 - minRemaining)), resetsAt: earliestReset },
        identity: { providerId: "llmproxy", loginMethod: "api" },
        totals: { tokens: totalTokens, requests: totalRequests },
        providerCost: approxCost > 0 ? { used: approxCost, currencyCode: "USD", period: "approx", updatedAt: now.toISOString() } : void 0,
        dataConfidence: "exact"
      }
    };
  }, "map")
});
var minimaxApiBase = /* @__PURE__ */ __name((region) => region === "cn" || region === "china" ? "https://api.minimaxi.com" : "https://api.minimax.io", "minimaxApiBase");
var minimaxWindow = /* @__PURE__ */ __name((m, prefix, windowMinutes) => {
  const remainingPct = loose(m[`${prefix}_remaining_percent`]);
  const total = loose(m[`${prefix}_total_count`]);
  const usedCount = loose(m[`${prefix}_usage_count`]);
  let usedPercent;
  if (remainingPct !== void 0)
    usedPercent = 100 - remainingPct;
  else if (total !== void 0 && usedCount !== void 0)
    usedPercent = pct2(usedCount, total);
  if (usedPercent === void 0)
    return void 0;
  return { usedPercent: Math.min(100, Math.max(0, usedPercent)), windowMinutes };
}, "minimaxWindow");
var minimaxProvider = makeApiTokenProvider({
  id: "minimax",
  metadata: {
    displayName: "MiniMax",
    sessionLabel: "Interval",
    weeklyLabel: "Weekly",
    dashboardUrl: "https://platform.minimax.io/user-center/payment/coding-plan",
    color: "#f43f5e"
  },
  envKeys: ["MINIMAX_CODING_API_KEY", "MINIMAX_API_KEY"],
  request: /* @__PURE__ */ __name((s, ctx) => ({
    url: `${s.baseUrl ?? minimaxApiBase(s.region ?? ctx.host.env("MINIMAX_REGION"))}/v1/api/openplatform/coding_plan/remains`,
    headers: { ...bearer(s.apiKey), accept: "application/json", "MM-API-Source": "HanzoUsage" }
  }), "request"),
  map: /* @__PURE__ */ __name((json) => {
    const data = obj2(obj2(json).data);
    const models = Array.isArray(data.model_remains) ? data.model_remains : [];
    const m = obj2(models[0]);
    const plan = data.plan_name ?? data.current_plan_title ?? data.current_subscribe_title;
    const points = loose(data.points_balance) ?? loose(data.balance);
    return {
      usage: {
        primary: minimaxWindow(m, "current_interval", 0),
        secondary: minimaxWindow(m, "current_weekly", 10080),
        identity: { providerId: "minimax", loginMethod: "api", plan: typeof plan === "string" ? plan : void 0 },
        dataConfidence: models.length ? "percentOnly" : "unknown"
      },
      credits: points !== void 0 ? { remaining: points } : void 0
    };
  }, "map")
});

// node_modules/.pnpm/@hanzo+usage@0.1.6_@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-na_9763093f82e9564e964c8197a9b6f274/node_modules/@hanzo/usage/dist/catalog.js
var providerCatalog = [
  { id: "hanzo", name: "Hanzo", color: "#ff2d55" },
  { id: "byo", name: "BYO endpoint", color: "#64748b" },
  { id: "abacus", name: "Abacus AI", icon: "providers/abacus.svg" },
  { id: "alibaba", name: "Alibaba", icon: "providers/alibaba.svg" },
  { id: "alibabatokenplan", name: "Alibaba Token Plan" },
  { id: "amp", name: "Amp", icon: "providers/amp.svg" },
  { id: "antigravity", name: "Antigravity", icon: "providers/antigravity.svg" },
  { id: "augment", name: "Augment", icon: "providers/augment.svg" },
  { id: "azureopenai", name: "Azure OpenAI" },
  { id: "bedrock", name: "AWS Bedrock", color: "#ff9900", icon: "providers/bedrock.svg" },
  { id: "chutes", name: "Chutes", icon: "providers/chutes.svg" },
  { id: "claude", name: "Claude", icon: "providers/claude.svg" },
  { id: "clawrouter", name: "ClawRouter", icon: "providers/clawrouter.svg" },
  { id: "codebuff", name: "Codebuff", icon: "providers/codebuff.svg" },
  { id: "codex", name: "Codex", icon: "providers/codex.svg" },
  { id: "commandcode", name: "Command Code", icon: "providers/commandcode.svg" },
  { id: "copilot", name: "Copilot", icon: "providers/copilot.svg" },
  { id: "crof", name: "Crof", color: "#2eab94", icon: "providers/crof.svg" },
  { id: "crossmodel", name: "CrossModel", icon: "providers/crossmodel.svg" },
  { id: "cursor", name: "Cursor", icon: "providers/cursor.svg" },
  { id: "deepgram", name: "Deepgram", icon: "providers/deepgram.svg" },
  { id: "deepseek", name: "DeepSeek", color: "#527df0", icon: "providers/deepseek.svg" },
  { id: "devin", name: "Devin", icon: "providers/devin.svg" },
  { id: "doubao", name: "Doubao", icon: "providers/doubao.svg" },
  { id: "elevenlabs", name: "ElevenLabs", color: "#ebebe6", icon: "providers/elevenlabs.svg" },
  { id: "factory", name: "Droid", icon: "providers/factory.svg" },
  { id: "gemini", name: "Gemini", icon: "providers/gemini.svg" },
  { id: "grok", name: "Grok", icon: "providers/grok.svg" },
  { id: "groq", name: "Groq", icon: "providers/groq.svg" },
  { id: "jetbrains", name: "JetBrains AI", icon: "providers/jetbrains.svg" },
  { id: "kilo", name: "Kilo", icon: "providers/kilo.svg" },
  { id: "kimi", name: "Kimi", icon: "providers/kimi.svg" },
  { id: "kimik2", name: "Kimi K2 (unofficial)" },
  { id: "kiro", name: "Kiro", icon: "providers/kiro.svg" },
  { id: "litellm", name: "LiteLLM", icon: "providers/litellm.svg" },
  { id: "llmproxy", name: "LLM Proxy", icon: "providers/llmproxy.svg" },
  { id: "manus", name: "Manus", icon: "providers/manus.svg" },
  { id: "mimo", name: "Xiaomi MiMo", icon: "providers/mimo.svg" },
  { id: "minimax", name: "MiniMax", icon: "providers/minimax.svg" },
  { id: "mistral", name: "Mistral", icon: "providers/mistral.svg" },
  { id: "moonshot", name: "Moonshot / Kimi API" },
  { id: "ollama", name: "Ollama", icon: "providers/ollama.svg" },
  { id: "openai", name: "OpenAI", color: "#0f826e" },
  { id: "opencode", name: "OpenCode", icon: "providers/opencode.svg" },
  { id: "opencodego", name: "OpenCode Go", icon: "providers/opencodego.svg" },
  { id: "openrouter", name: "OpenRouter", icon: "providers/openrouter.svg" },
  { id: "perplexity", name: "Perplexity", icon: "providers/perplexity.svg" },
  { id: "poe", name: "Poe", icon: "providers/poe.svg" },
  { id: "qoder", name: "Qoder", icon: "providers/qoder.svg" },
  { id: "sakana", name: "Sakana AI", color: "#2975db", icon: "providers/sakana.svg" },
  { id: "stepfun", name: "StepFun", color: "#2196f2", icon: "providers/stepfun.svg" },
  { id: "synthetic", name: "Synthetic", icon: "providers/synthetic.svg" },
  { id: "t3chat", name: "T3 Chat", icon: "providers/t3chat.svg" },
  { id: "venice", name: "Venice", color: "#3399ff", icon: "providers/venice.svg" },
  { id: "vertexai", name: "Vertex AI", icon: "providers/vertexai.svg" },
  { id: "warp", name: "Warp", icon: "providers/warp.svg" },
  { id: "windsurf", name: "Windsurf", icon: "providers/windsurf.svg" },
  { id: "zai", name: "z.ai", icon: "providers/zai.svg" },
  { id: "zed", name: "Zed", icon: "providers/zed.svg" }
];
var providerCatalogById = Object.fromEntries(providerCatalog.map((p) => [p.id, p]));

// node_modules/.pnpm/@hanzo+usage@0.1.6_@hanzo+gui@7.3.0_expo@57.0.6_react-dom@19.2.4_react@19.2.4__react-na_9763093f82e9564e964c8197a9b6f274/node_modules/@hanzo/usage/dist/index.js
var providerRegistry = {
  hanzo: hanzoProvider,
  codex: codexProvider,
  claude: claudeProvider,
  openai: openaiProvider,
  openrouter: openrouterProvider,
  deepseek: deepseekProvider,
  elevenlabs: elevenlabsProvider,
  deepgram: deepgramProvider,
  groq: groqProvider,
  poe: poeProvider,
  venice: veniceProvider,
  chutes: chutesProvider,
  moonshot: moonshotProvider,
  kimi: kimiProvider,
  kimik2: kimik2Provider,
  zai: zaiProvider,
  litellm: litellmProvider,
  llmproxy: llmproxyProvider,
  minimax: minimaxProvider,
  byo: byoProvider
};
var allProviders = Object.values(providerRegistry);
var trackedProviderIds = Object.keys(providerRegistry);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Reporter,
  UsageError,
  UsageStore,
  accountKind,
  accountLabel,
  allProviders,
  bearer,
  byoProvider,
  chutesProvider,
  claudeProvider,
  codexProvider,
  createReporter,
  deepgramProvider,
  deepseekProvider,
  deltaDirection,
  elevenlabsProvider,
  expandHome,
  fetchCloudUsage,
  fetchProviderUsage,
  forMode,
  formatBucket,
  formatCents,
  formatCount,
  formatCurrency,
  formatDeltaPct,
  groqProvider,
  hanzoProvider,
  kimiProvider,
  kimik2Provider,
  linkPayload,
  litellmProvider,
  llmproxyProvider,
  makeApiTokenProvider,
  makeApiTokenStrategy,
  minimaxProvider,
  moonshotProvider,
  normalizeCloudUsage,
  normalizeProviderUsage,
  numberOrUndefined,
  openaiProvider,
  openrouterProvider,
  poeProvider,
  providerCatalog,
  providerCatalogById,
  providerRegistry,
  readJsonFile,
  remainingPercent,
  resolveApiKey,
  resolveBaseUrl,
  runPipeline,
  trackedProviderIds,
  updatedLabel,
  usageOf,
  veniceProvider,
  zaiProvider
});
