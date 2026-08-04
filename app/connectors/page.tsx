"use client";

/**
 * /connectors — the ONE org-scoped connectors surface for hanzo.app.
 *
 * "Connectors" is the product name; the data is the cloud `/v1/connectors`
 * org-connector store (via the same-origin `/v1/connectors` BFF), the SAME
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

import { SizableText, H1, Paragraph, YStack, XStack, H2 } from '@hanzo/gui';
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  type LucideIcon,
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
import { Button, Badge, Input, toast } from '@hanzo/ui';

import { useUser } from "@/hooks/useUser";
import { useOrg } from "@/lib/org/client";
import { AppShell } from "@/components/app-shell";
import { currentOrg, orgDisplayName } from "@/lib/org-scope";
import {
  fetchConnectors,
  connectProvider,
  disconnectProvider,
  type Provider,
} from "@/lib/connectors";

/** Known provider marks (lucide). Unknown providers get a neutral plug — honest,
 *  never a wrong logo. */
const ICONS: Record<string, LucideIcon> = {
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
  // Connectors live UNDER the consistent chrome shell (the same sidebar the
  // dashboard uses), with the "Connectors" nav item active — matching chat +
  // desktop. AppShell provides the ONE OrgProvider scope for the shell + page,
  // so useOrg has a provider ancestor without a second, nested one here.
  return (
    <AppShell currentView="connectors">
      <ConnectorsInner />
    </AppShell>
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
      <YStack minHeight="100%" alignItems="center" justifyContent="center" gap="$4" backgroundColor="$background" paddingHorizontal="$5">
        <Plug size={32} />
        <div>
          <H1 textAlign="center" fontSize="$6" fontWeight="500">Sign in to manage connectors</H1>
          <Paragraph textAlign="center" marginTop="$1" fontSize="$3" color="$color11">
            Connectors are scoped to your workspace.
          </Paragraph>
        </div>
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </YStack>
    );
  }

  return (
    <YStack minHeight="100%" backgroundColor="$background">
      {/* Header */}
      <YStack position="sticky" top="$0" zIndex={10} borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$background" backdropFilter="blur(8px)">
        <XStack alignSelf="center" maxWidth={768} alignItems="center" justifyContent="space-between" gap="$4" paddingHorizontal="$5" paddingVertical="$4">
          <XStack minWidth={0} alignItems="center" gap="$3">
            <Button variant="ghost" size="sm" onClick={() => router.back()} gap="$2">
              <ArrowLeft size={16} />
              Back
            </Button>
            <YStack minWidth={0}>
              <H1 numberOfLines={1} fontSize="$7" fontWeight="500">Connectors</H1>
              <Paragraph numberOfLines={1} fontSize="$1" color="$color11">
                {orgName ? `Connect services to ${orgName}` : "Connect services to your workspace"}
              </Paragraph>
            </YStack>
          </XStack>
          <XStack flexShrink={0} alignItems="center" gap="$2">
            {connectedCount > 0 && (
              <Badge variant="outline">
                <SizableText width="$1.5" height="$1.5" borderRadius="$10" backgroundColor="$green9" />
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
              <RefreshCw size={16} />
            </Button>
          </XStack>
        </XStack>
      </YStack>

      <YStack alignSelf="center" maxWidth={768} paddingHorizontal="$5" paddingVertical="$5">
        {/* Search */}
        <YStack position="relative" marginBottom="$4">
          <Search size={16} />
          <Input
            placeholder="Search connectors…"
            paddingLeft={36}
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
  />
        </YStack>

        {/* Category filter — only when the catalog spans more than one. */}
        {categories.length > 2 && (
          <XStack marginBottom="$5" flexWrap="wrap" gap="$1.5">
            {categories.map((c) => (
              <Button
                key={c}
                onClick={() => setCategory(c)}
                borderRadius="$10" paddingHorizontal="$3" paddingVertical="$1" backgroundColor={category === c ? "$color" : undefined} hoverStyle={category === c ? undefined : { backgroundColor: "$color3" }}
              >
                <SizableText fontSize="$1" textTransform="capitalize" color={category === c ? "$background" : "$color11"}>{c}</SizableText>
              </Button>
            ))}
          </XStack>
        )}

        {/* Loading */}
        {loading && providers.length === 0 ? (
          <YStack rowGap="$3">
            {[0, 1, 2].map((i) => (
              <YStack key={i} height={92} borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" />
            ))}
          </YStack>
        ) : providers.length === 0 ? (
          /* Empty — honest about the org-scoped surface being unpopulated. */
          <YStack borderRadius="$6" borderWidth={1} borderStyle="dashed" borderColor="$borderColor" paddingHorizontal="$5" paddingVertical="$10">
            <Plug size={32} />
            <H2 textAlign="center" fontSize="$3" fontWeight="500">No connectors available yet</H2>
            <Paragraph textAlign="center" alignSelf="center" marginTop="$1" maxWidth={384} fontSize="$3" color="$color11">
              Connectors for this workspace will appear here once they're enabled. Nothing to set
              up in the meantime.
            </Paragraph>
          </YStack>
        ) : filtered.length === 0 ? (
          <Paragraph paddingVertical="$10" textAlign="center" fontSize="$3" color="$color11">
            No connectors match “{query}”.
          </Paragraph>
        ) : (
          <YStack rowGap="$6">
            <Section title="Connected" rows={connected} busyId={busyId} onConnect={onConnect} onDisconnect={onDisconnect} />
            <Section title="Available" rows={available} busyId={busyId} onConnect={onConnect} onDisconnect={onDisconnect} />
            <Section title="Coming soon" rows={unavailable} busyId={busyId} onConnect={onConnect} onDisconnect={onDisconnect} muted />
          </YStack>
        )}
      </YStack>
    </YStack>
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
      <H2 marginBottom="$3" fontSize="$1" fontWeight="500" textTransform="uppercase" letterSpacing={0.8} color="$color11">
        {title}
      </H2>
      <YStack rowGap="$3">
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
      </YStack>
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
    <XStack
      alignItems="center" gap="$4" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$4" paddingVertical="$3.5" {...{ opacity: muted ? 0.6 : undefined }}
    >
      <XStack width="$7" height="$7" flexShrink={0} alignItems="center" justifyContent="center" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3">
        <Icon size={20} />
      </XStack>

      <YStack minWidth={0} flex={1}>
        <XStack alignItems="center" gap="$2">
          <SizableText numberOfLines={1} fontWeight="500">{p.name}</SizableText>
          {p.connected && (
            <XStack alignItems="center" gap="$1">
              <SizableText width="$1.5" height="$1.5" borderRadius="$10" backgroundColor="$green9" />
              <SizableText fontSize="$1" color="$green10" $theme-dark={{ color: "$green9" }}>Connected</SizableText>
            </XStack>
          )}
          {p.category && !p.connected && (
            <YStack display="none">
              <Badge variant="outline">{p.category}</Badge>
            </YStack>
          )}
        </XStack>
        <Paragraph numberOfLines={1} fontSize="$3" color="$color11">
          {p.connected && p.connection?.account
            ? `${p.connection.account}${since ? ` · ${since}` : ""}`
            : p.description}
        </Paragraph>
      </YStack>

      <YStack flexShrink={0}>
        {p.connected ? (
          <Button
            variant="outline"
            size="sm"
            gap="$1.5"
            disabled={busy || disabled}
            onClick={() => onDisconnect(p)}
          >
            {busy ? <Loader2 size={14} /> : <X size={14} />}
            Disconnect
          </Button>
        ) : p.available ? (
          <Button
            size="sm"
            gap="$1.5" backgroundColor="$color" hoverStyle={{ backgroundColor: "$color" }}
            disabled={busy || disabled}
            onClick={() => onConnect(p)}
          >
            {busy ? <Loader2 size={14} /> : <LinkIcon size={14} />}
            Connect
          </Button>
        ) : (
          <SizableText fontSize="$1" color="$color11">Unavailable</SizableText>
        )}
      </YStack>
    </XStack>
  );
}
