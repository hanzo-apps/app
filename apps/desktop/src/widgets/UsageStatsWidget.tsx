import { useEffect, useState } from 'react';
import {
  UsageStore,
  allProviders,
  type ProviderDescriptor,
  type RateWindow,
  type UsageSnapshot,
} from '@hanzo/usage';
import { useUsage } from '@hanzo/usage/react';
import { createTauriHost } from '@hanzo/usage/tauri';
import * as fs from '@tauri-apps/plugin-fs';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { homeDir } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';
import { Key } from '@/components/Key';
import { Assets } from '@/assets';

// One store for the whole app — reads local CLI credentials (~/.codex, ~/.claude,
// ~/.hanzo) and provider usage APIs through the Tauri fs + http plugins.
let storeSingleton: Promise<UsageStore> | null = null;
function getUsageStore(): Promise<UsageStore> {
  if (!storeSingleton) {
    storeSingleton = createTauriHost({ fs, fetch: tauriFetch, homeDir }).then((host) => {
      const store = new UsageStore({ host, providers: allProviders });
      store.start();
      void store.refresh();
      return store;
    });
  }
  return storeSingleton;
}

// Short codes for the macOS status-bar title, e.g. "C 42% · CL 61%".
const SHORT_CODE: Record<string, string> = { codex: 'C', claude: 'CL', hanzo: 'H' };

const tightestPercent = (s: UsageSnapshot): number | undefined => {
  const lanes = [s.primary?.usedPercent, s.secondary?.usedPercent].filter(
    (p): p is number => typeof p === 'number',
  );
  return lanes.length ? Math.max(...lanes) : undefined;
};

const formatReset = (w?: RateWindow): string | undefined => {
  if (!w) return undefined;
  if (w.resetDescription) return w.resetDescription;
  if (!w.resetsAt) return undefined;
  const ms = new Date(w.resetsAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return undefined;
  if (ms <= 0) return 'resets now';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h >= 1 ? `resets in ${h}h ${m}m` : `resets in ${m}m`;
};

const Lane = ({ label, w }: { label: string; w: RateWindow }) => {
  const pct = Math.round(w.usedPercent);
  const reset = formatReset(w);
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--hanzo-text-secondary)]">{label}</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 bg-[var(--hanzo-bg-tertiary)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--hanzo-accent)]"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
      {reset && <div className="mt-1 text-xs text-[var(--hanzo-text-tertiary)]">{reset}</div>}
    </div>
  );
};

const ProviderCard = ({
  descriptor,
  snapshot,
  error,
  sourceLabel,
}: {
  descriptor: ProviderDescriptor;
  snapshot?: UsageSnapshot;
  error?: string;
  sourceLabel?: string;
}) => {
  const { metadata } = descriptor;
  const tokens = snapshot?.totals?.tokens;
  return (
    <div className="bg-[var(--hanzo-bg-secondary)] rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{metadata.displayName}</span>
        <span className="text-xs text-[var(--hanzo-text-tertiary)]">
          {snapshot?.identity?.plan || sourceLabel || (error ? 'unavailable' : '')}
        </span>
      </div>

      {snapshot?.primary && <Lane label={metadata.sessionLabel} w={snapshot.primary} />}
      {snapshot?.secondary && <Lane label={metadata.weeklyLabel} w={snapshot.secondary} />}

      {typeof tokens === 'number' && (
        <div className="flex items-center justify-between text-sm pt-1">
          <span className="text-[var(--hanzo-text-secondary)]">Tokens (local CLI)</span>
          <span className="font-medium">{tokens.toLocaleString()}</span>
        </div>
      )}

      {!snapshot?.primary && !snapshot?.secondary && typeof tokens !== 'number' && (
        <div className="text-sm text-[var(--hanzo-text-tertiary)]">
          {error ? `Error: ${error}` : 'No local session — sign in to the CLI to see usage.'}
        </div>
      )}
    </div>
  );
};

const UsageContent = ({ store }: { store: UsageStore }) => {
  const state = useUsage(store);

  // Drive the macOS status-bar title from the tightest constraint per provider.
  useEffect(() => {
    const parts: string[] = [];
    for (const d of allProviders) {
      const snap = state.providers[d.id]?.snapshot;
      const pct = snap ? tightestPercent(snap) : undefined;
      if (typeof pct === 'number') {
        parts.push(`${SHORT_CODE[d.id] ?? d.id} ${Math.round(pct)}%`);
      }
    }
    void invoke('set_status_bar_item_title', { title: parts.join(' · ') });
  }, [state]);

  return (
    <div className="p-6 space-y-4">
      {allProviders.map((d) => {
        const ps = state.providers[d.id];
        return (
          <ProviderCard
            key={d.id}
            descriptor={d}
            snapshot={ps?.snapshot}
            error={ps?.error}
            sourceLabel={ps?.sourceLabel}
          />
        );
      })}
    </div>
  );
};

const UsageStatsWidget = () => {
  const [store, setStore] = useState<UsageStore | null>(null);
  useEffect(() => {
    getUsageStore().then(setStore);
  }, []);

  return (
    <div className="hanzo-window" style={{ height: '600px' }}>
      <div className="hanzo-search">
        <img
          src={Assets.logo.white}
          alt="Hanzo"
          className="hanzo-search-icon"
          style={{ width: 24, height: 24, marginRight: 8 }}
        />
        <h2 className="text-lg font-semibold">AI Usage</h2>
        <button
          className="ml-auto text-xs text-[var(--hanzo-text-secondary)] hover:text-[var(--hanzo-text)]"
          onClick={() => store?.refresh()}
        >
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {store ? (
          <UsageContent store={store} />
        ) : (
          <div className="p-6 text-sm text-[var(--hanzo-text-tertiary)]">Loading usage…</div>
        )}
      </div>

      <div className="hanzo-footer">
        <div className="hanzo-footer-hints">
          <span className="hanzo-footer-hint">
            <Key k="Esc" size="small" /> Close
          </span>
        </div>
      </div>
    </div>
  );
};

export { UsageStatsWidget };
