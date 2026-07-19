'use client';

/**
 * /connectors — the org's connected external resources.
 *
 * A thin, org-scoped view over the ONE shared connector store (cloud
 * `/v1/integrations`, the SAME backend console reads — see lib/connectors). An
 * org connects a resource once here and it's available across every Hanzo
 * surface and usable by the apps it builds. Org scope is resolved server-side
 * from the signed-in IAM identity; the browser never chooses a tenant.
 *
 * Honest states: a real provider list, a "sign in" prompt on 401, or an honest
 * "no connectors yet" when the store is empty / the endpoint isn't deployed —
 * never a fabricated list.
 */

import { useCallback, useEffect, useState } from 'react';
import { Button, Badge } from '@hanzo/ui';
import {
  Plug,
  Github,
  Slack,
  Mail,
  Database,
  Cloud,
  Boxes,
  Check,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { useUser } from '@/hooks/useUser';
import { listConnectors, connect, disconnect, type Provider } from '@/lib/connectors';

/** Derive a logo from the provider id (the wire model carries no icon). */
function providerIcon(id: string): React.ElementType {
  const key = id.toLowerCase();
  if (key.includes('github')) return Github;
  if (key.includes('slack')) return Slack;
  if (key.includes('google') || key.includes('gmail')) return Mail;
  if (key.includes('salesforce')) return Cloud;
  if (key.includes('postgres') || key.includes('mysql') || key.includes('db')) return Database;
  if (key.includes('s3') || key.includes('storage')) return Boxes;
  return Plug;
}

type LoadState = 'loading' | 'ready' | 'unauthed' | 'error';

export default function ConnectorsPage() {
  const { user, openLoginWindow } = useUser();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [busy, setBusy] = useState<string | null>(null);

  // A provider callback redirects back here with ?connected=<id> or ?error=<id>.
  // Read from the URL client-side (no useSearchParams → no Suspense requirement).
  const [justConnected, setJustConnected] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setJustConnected(q.get('connected'));
    setConnectError(q.get('error'));
  }, []);

  const load = useCallback(async () => {
    setState('loading');
    try {
      setProviders(await listConnectors());
      setState('ready');
    } catch (e) {
      setState(e instanceof Error && e.message.includes('401') ? 'unauthed' : 'error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, justConnected]);

  const onConnect = async (id: string) => {
    setBusy(id);
    try {
      window.location.href = await connect(id);
    } catch {
      setBusy(null);
    }
  };

  const onDisconnect = async (id: string) => {
    setBusy(id);
    try {
      await disconnect(id);
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppShell currentView="connectors">
      <div className="flex-1 overflow-y-auto bg-black text-white">
        {/* Hero */}
        <header className="border-b border-neutral-900 bg-gradient-to-b from-neutral-950 to-black">
          <div className="container mx-auto px-6 py-10">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                <Plug className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-medium">Connectors</h1>
            </div>
            <p className="max-w-2xl text-neutral-400">
              Connect a resource once for your organization and it&apos;s available across every
              Hanzo surface — the builder, chat, and the apps you ship. Connections are scoped to
              your org and shared by your whole team.
            </p>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          {/* Callback banners */}
          {justConnected && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              <Check className="h-4 w-4" />
              Connected {justConnected}.
            </div>
          )}
          {connectError && (
            <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              Couldn&apos;t connect {connectError}. Please try again.
            </div>
          )}

          {state === 'loading' && (
            <div className="py-20 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-500" />
            </div>
          )}

          {state === 'unauthed' && (
            <EmptyPanel
              title="Sign in to manage connectors"
              body="Connectors are scoped to your organization. Sign in to see what's connected and add new resources."
              action={
                <Button
                  className="bg-white text-black hover:bg-white/90"
                  onClick={() => (user ? load() : openLoginWindow())}
                >
                  {user ? 'Reload' : 'Sign in'}
                </Button>
              }
            />
          )}

          {state === 'error' && (
            <EmptyPanel
              title="No connectors available yet"
              body="Your organization has no connectors configured on this deployment. Once the connector backend is enabled, connectable resources (Slack, GitHub, databases, storage, and more) appear here."
              action={
                <Button variant="outline" className="gap-1.5 border-white/20" onClick={load}>
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              }
            />
          )}

          {state === 'ready' && providers.length === 0 && (
            <EmptyPanel
              title="No connectors yet"
              body="Nothing is connected for your organization. Connectable providers appear here as they're enabled for your deployment."
              action={
                <Button variant="outline" className="gap-1.5 border-white/20" onClick={load}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              }
            />
          )}

          {state === 'ready' && providers.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {providers.map((p) => {
                const Icon = providerIcon(p.id);
                const working = busy === p.id;
                return (
                  <div
                    key={p.id}
                    className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-900/50 p-5"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                        <Icon className="h-5 w-5 text-white/80" />
                      </div>
                      {p.connected ? (
                        <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-neutral-400">
                          {p.category}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium text-white">{p.name}</h3>
                    <p className="mt-1 flex-1 text-sm text-neutral-500">{p.description}</p>
                    {p.connected && p.connection?.account && (
                      <p className="mt-2 truncate font-mono text-[11px] text-neutral-600">
                        {p.connection.account}
                      </p>
                    )}

                    <div className="mt-4">
                      {p.connected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={working}
                          onClick={() => onDisconnect(p.id)}
                          className="w-full border-white/15 text-white/80"
                        >
                          {working ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disconnect'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={!p.available || working}
                          onClick={() => onConnect(p.id)}
                          className="w-full bg-white text-black hover:bg-white/90 disabled:opacity-40"
                          title={p.available ? undefined : 'Not configured on this deployment'}
                        >
                          {working ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : p.available ? (
                            'Connect'
                          ) : (
                            'Unavailable'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function EmptyPanel({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
        <Plug className="h-6 w-6 text-white/50" />
      </div>
      <h3 className="font-medium text-white">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-white/40">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
