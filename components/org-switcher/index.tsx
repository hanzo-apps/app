'use client';

/**
 * OrgSwitcher + OrgGate — this app's render of the shared org-switcher contract.
 * The CANONICAL component is `OrgSwitcher` in `@hanzo/ui@8` (`@hanzo/gui`-based,
 * hoisted per hanzoai/ui#36); this stays a LOCAL Tailwind/Radix render (recorded
 * debt) because `@hanzo/ui` here is aliased to `@hanzo/ui-shadcn` and the
 * identity bar needs `direction="up"` + the personal badge/settings affordances
 * the hoisted popover doesn't carry. The LOGIC (`lib/org-scope.ts`) matches the
 * hoisted `orgScope` contract.
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
 */
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Check, ChevronsUpDown, Loader2, Plus, Search, Settings, Sparkles } from 'lucide-react';
import { Button } from '@hanzo/ui';

import { useOrg } from '@/lib/org/client';
import { currentOrg, switchOrg, filterOrgs, isScopedAway, setCurrentOrg, getHomeOrg, orgDisplayName, titleCase } from '@/lib/org-scope';
import type { Org } from '@/lib/org/types';
import { resolveOrgLogo, isEmoji, isImageUrl } from '@/lib/avatar';

/**
 * The org's identity mark for the chrome. Renders, in priority (see
 * `resolveOrgLogo`): (a) an image if the resolved logo is a URL; (b) an emoji if
 * it's a short emoji string (full color — monochrome-safe); (c) the org's
 * initial in a neutral rounded square. `logo` is the server-supplied mark (from
 * `/v1/orgs`); a client-side override / known-default is layered on top of it.
 * ONE avatar, reused by the switcher AND the account menu.
 */
export function OrgAvatar({
  name,
  logo,
  className = "h-5 w-5 text-[11px]",
}: {
  name: string;
  logo?: string;
  className?: string;
}) {
  const resolved = resolveOrgLogo(name, logo);
  const [imgError, setImgError] = useState(false);
  // Reset the image-failed flag when the mark changes (list rows reuse instances).
  useEffect(() => setImgError(false), [resolved]);

  // (a) image logo — a rounded, cover-fit <img>; on load failure fall through.
  if (resolved && isImageUrl(resolved) && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote org logo, not a bundled asset
      <img
        src={resolved}
        alt=""
        aria-hidden="true"
        onError={() => setImgError(true)}
        className={`shrink-0 rounded-md border border-border object-cover ${className}`}
      />
    );
  }
  // (b) emoji logo — centered + a touch larger, in full color. The glyph carries
  //     the color; the box stays borderless here (inline size beats the class).
  if (resolved && isEmoji(resolved)) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center leading-none ${className}`}
        style={{ fontSize: "1.05rem" }}
        aria-hidden="true"
      >
        {resolved}
      </span>
    );
  }
  // (c) fallback — the org's initial in a neutral rounded square (monochrome).
  const initial = (name || "").trim().charAt(0).toUpperCase() || "•";
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-md border border-border bg-muted font-semibold text-foreground ${className}`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

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

  const currentName = orgDisplayName(allOrgs, currentId) || '…';
  const currentLogo = allOrgs.find((o) => o.name === currentId)?.logo;
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
      <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground">
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
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
        title="Active organization"
      >
        <OrgAvatar name={currentName} logo={currentLogo} />
        <span className="inline max-w-[7.5rem] truncate font-medium text-foreground">{currentName}</span>
        {isScopedAway() && <span className="rounded border border-border px-1 text-[10px] text-muted-foreground">scoped</span>}
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={`absolute left-0 z-50 w-72 rounded-xl border border-border bg-popover p-2 shadow-2xl ${
              direction === "up" ? "bottom-full mb-2" : "mt-2"
            }`}
          >
            {creating ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Create organization</p>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value.slice(0, 60))}
                  placeholder="Organization name"
                  className="w-full rounded-md border border-border bg-transparent px-2 py-1.5 text-sm outline-none focus:border-ring"
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
                <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter organizations…"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Organizations · {allOrgs.length}
                </p>
                <div className="max-h-64 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="px-2 py-2 text-sm text-muted-foreground">No organizations match &quot;{query}&quot;.</p>
                  ) : (
                    filtered.map((org) => {
                      const isCurrent = org.name === currentId;
                      return (
                        <button
                          key={org.name}
                          onClick={() => select(org)}
                          className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm ${
                            isCurrent ? 'bg-muted' : 'hover:bg-muted'
                          }`}
                        >
                          <OrgAvatar name={orgDisplayName(allOrgs, org.name)} logo={org.logo} />
                          <span className="flex-1 truncate text-left text-foreground">
                            {orgDisplayName(allOrgs, org.name)}
                          </span>
                          {org.isPersonal && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">personal</span>
                          )}
                          {isCurrent && <Check className="h-4 w-4 text-foreground" />}
                        </button>
                      );
                    })
                  )}
                </div>
                {/* The org's avatar/emoji picker lives on its own settings page
                    now (the switcher stays a switcher). */}
                <Link
                  href="/settings/organization"
                  onClick={() => setOpen(false)}
                  className="mt-1 flex w-full items-center gap-2 rounded-md border-t border-border px-2 py-2 text-sm text-foreground hover:bg-muted"
                >
                  <Settings className="h-4 w-4" />
                  Organization settings
                  <span className="ml-auto text-muted-foreground">→</span>
                </Link>
                <button
                  onClick={() => { setCreating(true); setErr(null); }}
                  className="mt-1 flex w-full items-center gap-2 rounded-md border-t border-border px-2 py-2 text-sm text-foreground hover:bg-muted"
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted">
        <Sparkles className="h-7 w-7 text-foreground" />
      </div>
      <h1 className="mb-2 text-2xl font-medium">Set up your workspace</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Every project belongs to an organization — that&apos;s where it&apos;s billed and
        shared. Start with a personal workspace, or name a team organization.
      </p>

      <Button className="w-full" onClick={() => run({ personal: true })} disabled={busy !== null}>
        {busy === 'personal' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue with a personal workspace'}
      </Button>

      <div className="my-4 text-xs uppercase tracking-wide text-muted-foreground">or</div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 60))}
        placeholder="Team organization name"
        className="mb-2 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-ring"
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
