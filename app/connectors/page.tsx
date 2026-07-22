"use client";

/**
 * /connectors — the ONE org-scoped connectors surface for hanzo.app.
 *
 * "Connectors" is the product name; the data is the cloud `/v1/integrations`
 * org-connector store (via the same-origin `/v1/integrations` BFF), the SAME
 * store console.hanzo.ai renders — one contract, two surfaces. Connections are
 * scoped to the signed-in user's org (derived server-side from the bearer owner),
 * so this page manages the connectors for whichever workspace you're in.
 *
 * This is the canonical destination the AI builder's connect chips fall back to
 * (`ask-ai` opens `connectUrl || "/connectors"`) and the workspace menu's
 * "Project connectors" item points here.
 *
 * Honesty (this app's law): every row is a REAL provider from cloud with its REAL
 * org connection status — no fabricated integrations, no fake usage meters. If the
 * cloud surface returns nothing (unauthenticated, or not yet enabled for the org),
 * the page shows a clean empty state, never a crash and never invented rows.
 *
 * Strictly monochrome + theme-safe: black/white/neutral via theme tokens
 * (renders correctly in light AND dark); green is kept ONLY as the semantic
 * "connected" signal.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Loader2,
  Plug,
  Link as LinkIcon,
  X,
  Github,
  Slack,
  MessageSquare,
  Users,
  Send,
  Cloud,
  Mail,
} from "lucide-react";
import { Button, Input, Badge } from "@hanzo/ui";
import { toast } from "sonner";

import { useUser } from "@/hooks/useUser";
import { OrgProvider, useOrg } from "@/lib/org/client";
import { currentOrg, orgDisplayName } from "@/lib/org-scope";
import { cn } from "@/lib/utils";
import {
  fetchConnectors,
  connectProvider,
  disconnectProvider,
  type Provider,
} from "@/lib/connectors";

/** Known provider marks (lucide). Unknown providers get a neutral plug — honest,
 *  never a wrong logo. */
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  github: Github,
  slack: Slack,
  discord: MessageSquare,
  teams: Users,
  telegram: Send,
  cloudflare: Cloud,
  google: Mail,
  gmail: Mail,
};
const iconFor = (id: string) => ICONS[id] ?? Plug;

/** "connected 3d ago" — compact relative time; empty when the timestamp is absent. */
function sinceLabel(iso: string): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  const units: [number, string][] = [
    [31536000, "y"],
    [2592000, "mo"],
    [604800, "w"],
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ];
  for (const [size, label] of units) {
    if (s >= size) return `connected ${Math.floor(s / size)}${label} ago`;
  }
  return "connected just now";
}

export default function ConnectorsPage() {
  // The page reads org scope via useOrg — provide it here (this route renders
  // standalone, not under AppShell), so useOrg has a provider ancestor.
  return (
    <OrgProvider>
      <ConnectorsInner />
    </OrgProvider>
  );
}

function ConnectorsInner() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { ctx } = useOrg();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Which org these connectors belong to — resolved exactly like the workspace
  // menu / OrgSwitcher, so the header names the ORG the connections attribute to.
  const orgId = currentOrg() || ctx?.currentOrg || "";
  const orgName = orgDisplayName(ctx?.orgs ?? [], orgId) || "";

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchConnectors();
    setProviders(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Surface the outcome of an OAuth round-trip. Cloud's callback normally lands on
  // console (its configured redirect), but if it ever returns here we report it
  // honestly and strip the params so a refresh doesn't re-toast.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const connected = sp.get("connected");
    const error = sp.get("error");
    if (!connected && !error) return;
    if (connected) toast.success(`Connected ${connected}`);
    else toast.error(`Couldn't connect ${error}${sp.get("reason") ? `: ${sp.get("reason")}` : ""}`);
    window.history.replaceState({}, "", window.location.pathname);
    void load();
  }, [load]);

  const onConnect = async (p: Provider) => {
    setBusyId(p.id);
    const r = await connectProvider(p.id);
    if (r.authorizeUrl) {
      // Top-level navigate to the provider's consent screen (leaves the app).
      window.location.href = r.authorizeUrl;
      return;
    }
    toast.error(r.error || `Couldn't start connecting ${p.name}`);
    setBusyId(null);
  };

  const onDisconnect = async (p: Provider) => {
    setBusyId(p.id);
    const r = await disconnectProvider(p.id);
    if (r.ok) {
      setProviders((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, connected: false, connection: null } : x)),
      );
      toast.success(`Disconnected ${p.name}`);
    } else {
      toast.error(r.error || `Couldn't disconnect ${p.name}`);
    }
    setBusyId(null);
  };

  // Category filter derived from the real catalog (only shown when it helps).
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of providers) if (p.category) set.add(p.category);
    return ["all", ...Array.from(set).sort()];
  }, [providers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return providers.filter((p) => {
      const matchesQ =
        !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matchesC = category === "all" || p.category === category;
      return matchesQ && matchesC;
    });
  }, [providers, query, category]);

  const connected = filtered.filter((p) => p.connected);
  const available = filtered.filter((p) => !p.connected && p.available);
  const unavailable = filtered.filter((p) => !p.connected && !p.available);
  const connectedCount = providers.filter((p) => p.connected).length;

  // Auth gate — connectors are org-scoped, so an unauthenticated visitor gets an
  // honest sign-in CTA rather than an empty list.
  if (!userLoading && !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
        <Plug className="size-8 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-medium">Sign in to manage connectors</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connectors are scoped to your workspace.
          </p>
        </div>
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-medium">Connectors</h1>
              <p className="truncate text-xs text-muted-foreground">
                {orgName ? `Connect services to ${orgName}` : "Connect services to your workspace"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {connectedCount > 0 && (
              <Badge variant="outline" className="gap-1.5">
                <span className="size-1.5 rounded-full bg-green-500" />
                {connectedCount} connected
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void load()}
              aria-label="Refresh"
              title="Refresh"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-6">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search connectors…"
            className="pl-9"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          />
        </div>

        {/* Category filter — only when the catalog spans more than one. */}
        {categories.length > 2 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs capitalize transition-colors",
                  category === c
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && providers.length === 0 ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[92px] animate-pulse rounded-xl border border-border bg-muted/40" />
            ))}
          </div>
        ) : providers.length === 0 ? (
          /* Empty — honest about the org-scoped surface being unpopulated. */
          <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
            <Plug className="mx-auto mb-3 size-8 text-muted-foreground" />
            <h2 className="text-sm font-medium">No connectors available yet</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Connectors for this workspace will appear here once they're enabled. Nothing to set
              up in the meantime.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No connectors match “{query}”.
          </p>
        ) : (
          <div className="space-y-8">
            <Section title="Connected" rows={connected} busyId={busyId} onConnect={onConnect} onDisconnect={onDisconnect} />
            <Section title="Available" rows={available} busyId={busyId} onConnect={onConnect} onDisconnect={onDisconnect} />
            <Section title="Coming soon" rows={unavailable} busyId={busyId} onConnect={onConnect} onDisconnect={onDisconnect} muted />
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  rows,
  busyId,
  onConnect,
  onDisconnect,
  muted,
}: {
  title: string;
  rows: Provider[];
  busyId: string | null;
  onConnect: (p: Provider) => void;
  onDisconnect: (p: Provider) => void;
  muted?: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-3">
        {rows.map((p) => (
          <ConnectorRow
            key={p.id}
            p={p}
            busy={busyId === p.id}
            disabled={busyId !== null && busyId !== p.id}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
            muted={muted}
          />
        ))}
      </div>
    </section>
  );
}

function ConnectorRow({
  p,
  busy,
  disabled,
  onConnect,
  onDisconnect,
  muted,
}: {
  p: Provider;
  busy: boolean;
  disabled: boolean;
  onConnect: (p: Provider) => void;
  onDisconnect: (p: Provider) => void;
  muted?: boolean;
}) {
  const Icon = iconFor(p.id);
  const since = p.connection ? sinceLabel(p.connection.connectedAt) : "";
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors",
        muted && "opacity-60",
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-foreground">
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{p.name}</span>
          {p.connected && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-500">
              <span className="size-1.5 rounded-full bg-green-500" />
              Connected
            </span>
          )}
          {p.category && !p.connected && (
            <Badge variant="outline" className="hidden capitalize sm:inline-flex">
              {p.category}
            </Badge>
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {p.connected && p.connection?.account
            ? `${p.connection.account}${since ? ` · ${since}` : ""}`
            : p.description}
        </p>
      </div>

      <div className="shrink-0">
        {p.connected ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={busy || disabled}
            onClick={() => onDisconnect(p)}
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
            Disconnect
          </Button>
        ) : p.available ? (
          <Button
            size="sm"
            className="gap-1.5 !bg-foreground !text-background hover:!bg-foreground/90"
            disabled={busy || disabled}
            onClick={() => onConnect(p)}
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <LinkIcon className="size-3.5" />}
            Connect
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Unavailable</span>
        )}
      </div>
    </div>
  );
}
