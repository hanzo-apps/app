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

import { H2, Paragraph, SizableText, Spinner, XStack, YStack } from '@hanzo/ui';
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  type LucideIcon,
  Search,
  RefreshCw,
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
import { AppShell } from "@/components/app-shell";
import { selected } from "@/lib/chrome";
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
  // Connectors live UNDER the shell, with the "Connectors" nav item active, and
  // the shell draws the title — so this page has no header of its own.
  return (
    <AppShell
      currentView="connectors"
      title="Connectors"
      subtitle="Connect services to your workspace"
    >
      <ConnectorsInner />
    </AppShell>
  );
}

function ConnectorsInner() {
  const { user, loading: userLoading } = useUser();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);

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
    else toast.error(`Could not connect ${error}${sp.get("reason") ? `: ${sp.get("reason")}` : ""}`);
    window.history.replaceState({}, "", window.location.pathname);
    void load();
  }, [load]);

  /**
   * Connect. ONE handler for both kinds, because it is one route — what differs
   * is whether there is a body and whether the answer is a place to go.
   *
   * `values` present means a CREDENTIAL connector: cloud verifies the pasted
   * fields against the provider and seals them inside that one request, so the
   * reply is final and the list reloads in place. Absent means OAuth, and the
   * reply is a consent URL to leave for.
   */
  const onConnect = async (p: Provider, values?: Record<string, string>) => {
    setBusyId(p.id);
    const r = await connectProvider(p.id, values);
    if (r.authorizeUrl) {
      // Top-level navigate to the provider's consent screen (leaves the app).
      window.location.href = r.authorizeUrl;
      return;
    }
    if (r.connected) {
      toast.success(`Connected ${p.name}${r.account ? ` · ${r.account}` : ""}`);
      setBusyId(null);
      void load();
      return;
    }
    toast.error(r.error || `Could not start connecting ${p.name}. Try again in a moment.`);
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
      toast.error(r.error || `${p.name} is still connected — the server refused the change. Try again.`);
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
      <YStack alignItems="center" justifyContent="center" gap="$4" paddingVertical="$10">
        <Plug size={32} />
        <div>
          <H2 textAlign="center" fontSize="$6" fontWeight="500">Sign in to manage connectors</H2>
          <Paragraph textAlign="center" marginTop="$1" fontSize="$3" color="$color11">
            Connectors are scoped to your workspace.
          </Paragraph>
        </div>
        <Button variant="outline" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </YStack>
    );
  }

  return (
    <>
      {/* The list's own toolbar. The count and Refresh used to ride in a sticky
          page header alongside a hand-rolled title and a "← Back" button that
          stood in for the sidebar this page had forgotten to mount. The shell
          carries the title now; these two belong beside the list they describe
          and refresh. */}
        <XStack marginBottom="$4" alignItems="center" gap="$2">
          <YStack flex={1}>
            <Input
              placeholder="Search connectors…"
              startAdornment={<Search size={16} />}
              value={query}
              onChangeText={(v: string) => setQuery(v)}
  />
          </YStack>
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

        {/* Category filter — only when the catalog spans more than one. */}
        {categories.length > 2 && (
          <XStack marginBottom="$5" flexWrap="wrap" gap="$1.5">
            {categories.map((c) => (
              <Button
                key={c}
                onClick={() => setCategory(c)}
                variant="ghost"
                {...selected(category === c)}
                borderRadius="$10" paddingHorizontal="$3" paddingVertical="$1" hoverStyle={category === c ? undefined : { backgroundColor: "$color3" }}
              >
                <SizableText fontSize="$1" textTransform="capitalize" color={category === c ? "$color" : "$color11"}>{c}</SizableText>
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
          /* Empty — honest about the org-scoped surface being unpopulated. The
             icon was pinned to the container's left edge while the text was
             centered, so the state read as broken. One centered column now: a
             muted glyph in a soft chip, title, then what a connector is for. */
          <YStack alignItems="center" gap="$3" borderRadius="$6" borderWidth={1} borderStyle="dashed" borderColor="$borderColor" paddingHorizontal="$5" paddingVertical="$10">
            <XStack width={44} height={44} alignItems="center" justifyContent="center" borderRadius={999} backgroundColor="$color3">
              <SizableText color="$color11"><Plug size={20} /></SizableText>
            </XStack>
            <H2 textAlign="center" fontSize="$3" fontWeight="500">No connectors for this workspace</H2>
            <Paragraph textAlign="center" maxWidth={384} fontSize="$3" color="$color11">
              A connector lets your apps read from an outside service you already
              use. An owner of this organization turns them on; until one does,
              there is nothing here to set up.
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
    </>
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
  onConnect: (p: Provider, values?: Record<string, string>) => void;
  onDisconnect: (p: Provider) => void;
  muted?: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <section>
      <H2 marginBottom="$3" fontSize="$1" fontWeight="500" color="$color11">
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
  onConnect: (p: Provider, values?: Record<string, string>) => void;
  onDisconnect: (p: Provider) => void;
  muted?: boolean;
}) {
  const Icon = iconFor(p.id);
  // A credential connector has no consent screen to leave for, so the row opens
  // its own form instead of a button that would have nowhere to send anyone.
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const missing = p.fields.some((f) => f.required && !(values[f.name] ?? "").trim());
  const credential = !p.connected && p.kind === "credential";
  const since = p.connection ? sinceLabel(p.connection.connectedAt) : "";
  return (
    <YStack borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" {...{ opacity: muted ? 0.6 : undefined }}>
    <XStack
      alignItems="center" gap="$4" paddingHorizontal="$4" paddingVertical="$3.5"
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
            <YStack display="none" $sm={{ display: "inline-flex" }}>
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
            {busy ? <Spinner size={14} /> : <X size={14} />}
            Disconnect
          </Button>
        ) : p.available ? (
          <Button
            variant="outline"
            size="sm"
            gap="$1.5"
            disabled={busy || disabled}
            onClick={() => (credential ? setOpen((v) => !v) : onConnect(p))}
          >
            {busy ? <Spinner size={14} /> : <LinkIcon size={14} />}
            Connect
          </Button>
        ) : (
          <SizableText fontSize="$1" color="$color11">Unavailable</SizableText>
        )}
      </YStack>
    </XStack>

    {/* The form is rendered from the CATALOG — cloud publishes each field's
        name, label and whether it is secret — so a connector added on the
        backend appears here with no change to this file. A secret field is a
        password input: it is the org's real credential and it travels one way
        only. */}
    {credential && open ? (
      <YStack gap="$2" paddingHorizontal="$4" paddingBottom="$3.5">
        {p.fields.map((f) => (
          <YStack key={f.name} gap="$1">
            <SizableText fontSize="$1" color="$color11">
              {f.label}
              {f.required ? " *" : ""}
            </SizableText>
            <Input
              size="$3"
              secureTextEntry={f.secret}
              value={values[f.name] ?? ""}
              onChangeText={(v: string) => setValues((prev) => ({ ...prev, [f.name]: v }))}
            />
          </YStack>
        ))}
        <XStack gap="$2" alignItems="center">
          <Button variant="default" size="sm" disabled={busy || missing} onClick={() => onConnect(p, values)}>
            {busy ? <Spinner size={14} /> : null}
            Save
          </Button>
          {/* Say what happens, because it is not a redirect: the credentials are
              checked with the provider before anything is stored, so a wrong
              paste is refused here rather than on the first real send. */}
          <SizableText fontSize="$1" color="$color11">
            Checked with {p.name} before they are saved.
          </SizableText>
        </XStack>
      </YStack>
    ) : null}
    </YStack>
  );
}
