'use client';

/**
 * OrgSwitcher + OrgGate — MIRRORED from console2 (`src/components/OrgSwitcher.tsx`
 * + `OrgGate.tsx` + `OrgOnboarding.tsx`), identical API + behavior, rendered with
 * hanzo.app's `@hanzo/ui` primitives instead of `@hanzo/gui` (the two apps use
 * different UI kits; the LOGIC — `lib/org-scope.ts` — is shared verbatim).
 *
 * OrgSwitcher: shows the org the builder is scoped to, filters the orgs the user
 * can see, switches IN PLACE (`switchOrg` persists + reloads so every module
 * refetches under the new X-Org-Id), and CREATEs a new org (→ `/onboard`). The org
 * list comes from `/v1/orgs` (a normal user sees their own org; a global admin
 * sees the switchable set) — never fabricated.
 *
 * OrgGate: a zero-org user is sent to onboarding (personal workspace default)
 * BEFORE building — a project is never created org-less; and a normal user is
 * hard-pinned to their home org (a stale switched scope is reset), matching the
 * server which pins them to their bearer owner.
 *
 * TODO: hoist to @hanzo/ui (task #36) — share one <OrgSwitcher> across apps.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Check, ChevronsUpDown, Loader2, Plus, Search, Sparkles } from 'lucide-react';
import { Button } from '@hanzo/ui';

import { useOrg } from '@/lib/org/client';
import { currentOrg, switchOrg, filterOrgs, isScopedAway, setCurrentOrg, getHomeOrg } from '@/lib/org-scope';
import type { Org } from '@/lib/org/types';

const titleCase = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** The org selector for the builder/dashboard chrome. */
export function OrgSwitcher({ direction = "down" }: { direction?: "up" | "down" } = {}) {
  const { ctx, loading, createOrg } = useOrg();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const currentId = currentOrg() || ctx?.currentOrg || '';

  // Always include the current org so the switcher is meaningful even when the
  // list is a single entry (a normal user). Same shape as console2.
  const allOrgs = useMemo<Org[]>(() => {
    const orgs = ctx?.orgs ?? [];
    if (currentId && !orgs.some((o) => o.name === currentId)) {
      return [{ name: currentId, displayName: titleCase(currentId), isPersonal: false }, ...orgs];
    }
    return orgs;
  }, [ctx, currentId]);

  const currentName = allOrgs.find((o) => o.name === currentId)?.displayName || titleCase(currentId || '…');
  const filtered = useMemo(() => filterOrgs(allOrgs, query), [allOrgs, query]);

  const select = (org: Org) => {
    setOpen(false);
    switchOrg(org.name); // persists + reloads
  };

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    setErr(null);
    try {
      // createOrg switches into an additional org (or re-auths a zero-org user).
      await createOrg({ name });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create the organization.');
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/50">
        <Building2 className="h-4 w-4" />
        <span className="hidden sm:inline">…</span>
      </div>
    );
  }
  if (!ctx) return null; // signed out — no org chrome

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/80 hover:bg-white/5 transition-colors"
        title="Active organization"
      >
        <Building2 className="h-4 w-4 text-white/50" />
        <span className="max-w-[10rem] truncate">{currentName}</span>
        {isScopedAway() && <span className="rounded border border-white/20 px-1 text-[10px] text-white/60">scoped</span>}
        <ChevronsUpDown className="h-3.5 w-3.5 text-white/40" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={`absolute left-0 z-50 w-72 rounded-xl border border-white/10 bg-[#141414] p-2 shadow-2xl ${
              direction === "up" ? "bottom-full mb-2" : "mt-2"
            }`}
          >
            {creating ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-white/90">Create organization</p>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value.slice(0, 60))}
                  placeholder="Organization name"
                  className="w-full rounded-md border border-white/15 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-white/40"
                  onKeyDown={(e) => e.key === 'Enter' && void create()}
                  disabled={busy}
                />
                {err && <p className="text-xs text-red-400">{err}</p>}
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setErr(null); }} disabled={busy}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => void create()} disabled={busy || !newName.trim()}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2 rounded-md border border-white/10 px-2 py-1">
                  <Search className="h-3.5 w-3.5 text-white/40" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter organizations…"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
                  />
                </div>
                <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white/30">
                  Organizations · {allOrgs.length}
                </p>
                <div className="max-h-64 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="px-2 py-2 text-sm text-white/40">No organizations match &quot;{query}&quot;.</p>
                  ) : (
                    filtered.map((org) => {
                      const isCurrent = org.name === currentId;
                      return (
                        <button
                          key={org.name}
                          onClick={() => select(org)}
                          className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm ${
                            isCurrent ? 'bg-white/10' : 'hover:bg-white/5'
                          }`}
                        >
                          <Building2 className="h-4 w-4 text-white/50" />
                          <span className="flex-1 truncate text-left text-white/85">
                            {org.displayName || titleCase(org.name)}
                          </span>
                          {org.isPersonal && (
                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">personal</span>
                          )}
                          {isCurrent && <Check className="h-4 w-4 text-white" />}
                        </button>
                      );
                    })
                  )}
                </div>
                <button
                  onClick={() => { setCreating(true); setErr(null); }}
                  className="mt-1 flex w-full items-center gap-2 rounded-md border-t border-white/10 px-2 py-2 text-sm text-white/70 hover:bg-white/5"
                >
                  <Plus className="h-4 w-4" />
                  Create organization
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Gate that requires an org before rendering children. Mirrors console2's OrgGate:
 * a zero-org user gets onboarding; a signed-in user with an org proceeds, and a
 * stale switched scope is reset for a non-global-admin (they can only build in
 * their own org). While loading it renders a spinner; signed out → children.
 */
export function OrgGate({ children }: { children: React.ReactNode }) {
  const { ctx, loading } = useOrg();

  // Hard-pin a non-global-admin to their home org (reset a stale switched scope),
  // matching the server which pins them to their bearer owner. The reload is
  // guarded on `currentOrg() !== owner`, so it never loops.
  useEffect(() => {
    if (!ctx || !ctx.homeOrg) return;
    if (!ctx.isGlobalAdmin && isScopedAway()) {
      setCurrentOrg(ctx.homeOrg);
      if (typeof window !== 'undefined' && currentOrg() !== getHomeOrg()) window.location.reload();
    }
  }, [ctx]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (!ctx) return <>{children}</>; // signed out — caller's auth handles it
  if (ctx.needsOnboarding) return <OnboardingPanel />;
  return <>{children}</>;
}

/** First-run onboarding: create a personal org (personal billing) to start. */
function OnboardingPanel() {
  const { createOrg } = useOrg();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState<'personal' | 'named' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (opts: { name?: string; personal?: boolean }) => {
    setBusy(opts.personal ? 'personal' : 'named');
    setError(null);
    try {
      await createOrg(opts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create organization');
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5">
        <Sparkles className="h-7 w-7 text-white" />
      </div>
      <h1 className="mb-2 text-2xl font-medium">Set up your workspace</h1>
      <p className="mb-8 text-sm text-white/60">
        Every project belongs to an organization — that&apos;s where it&apos;s billed and
        shared. Start with a personal workspace, or name a team organization.
      </p>

      <Button className="w-full" onClick={() => run({ personal: true })} disabled={busy !== null}>
        {busy === 'personal' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue with a personal workspace'}
      </Button>

      <div className="my-4 text-xs uppercase tracking-wide text-white/30">or</div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 60))}
        placeholder="Team organization name"
        className="mb-2 w-full rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/40"
        disabled={busy !== null}
      />
      <Button
        variant="outline"
        className="w-full"
        onClick={() => run({ name: name.trim() })}
        disabled={busy !== null || name.trim().length < 2}
      >
        {busy === 'named' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create team organization'}
      </Button>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </div>
  );
}
