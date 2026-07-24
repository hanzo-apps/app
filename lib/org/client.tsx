'use client';

/**
 * Client org context — the ONE way the builder reads/switches the active org.
 *
 * Mirrors console2's org-scope pattern: the effective org is a server-resolved
 * value (`/v1/orgs`), the selector switches it (`POST /v1/orgs`), and a zero-org
 * user is gated into onboarding before they can build. The browser never picks
 * its own tenant — the server pins a normal user to their home org.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import type { Org, OrgContext } from '@/lib/org/types';
import { setHomeOrg, switchOrg } from '@/lib/org-scope';

/** The raw org row as `/v1/orgs` may send it — the logo field name isn't settled
 *  in IAM yet, so we accept any of `logo`/`icon`/`avatar` (all optional). */
type RawOrg = Partial<Org> & { icon?: string; avatar?: string };

interface OrgState {
  ctx: OrgContext | null;
  loading: boolean;
  error: string | null;
  /** Re-fetch the org context. */
  refresh: () => Promise<void>;
  /** Create a personal or named org, then re-auth so the new owner takes effect. */
  createOrg: (opts?: { name?: string; personal?: boolean }) => Promise<void>;
}

const Ctx = createContext<OrgState | null>(null);

async function getOrgContext(): Promise<OrgContext | null> {
  const res = await fetch('/v1/orgs', { credentials: 'include', cache: 'no-store' });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Failed to load orgs (${res.status})`);
  const raw = (await res.json()) as OrgContext & { orgs?: RawOrg[] };
  // Reshape each row defensively: carry a server-supplied logo through under one
  // name (`logo`/`icon`/`avatar` — IAM hasn't settled it), so OrgAvatar renders
  // real identity when present. Absent → undefined (avatar falls back to an
  // override / known-default / initial). Never fabricated.
  const orgs: Org[] = (raw.orgs ?? []).map((o: RawOrg) => ({
    name: o.name ?? '',
    displayName: o.displayName ?? o.name ?? '',
    isPersonal: Boolean(o.isPersonal),
    logo: o.logo ?? o.icon ?? o.avatar ?? undefined,
  }));
  return { ...raw, orgs };
}

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [ctx, setCtx] = useState<OrgContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await getOrgContext();
      // Seed org-scope with the home org so `currentOrg()` defaults correctly
      // (mirrors console2 seeding the brand org). A stamped X-Org-Id only takes
      // effect server-side for a global admin; a normal user is pinned to owner.
      if (c?.homeOrg) setHomeOrg(c.homeOrg);
      setCtx(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createOrg = useCallback(async (opts?: { name?: string; personal?: boolean }) => {
    const res = await fetch('/onboard', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts ?? { personal: true }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Could not create organization (${res.status})`);
    }
    const data = (await res.json()) as { org?: string; additional?: boolean };
    // A zero-org user was MOVED into the new org → their JWT owner changed, so
    // re-auth to mint a token carrying the new owner. An ADDITIONAL org (they
    // already had one) needs no re-auth; scope into it (persists + reloads so
    // every module refetches under the new X-Org-Id) — mirrors console2.
    //
    // Re-auth through the ONE active path (`@hanzo/iam` PKCE at `/login` →
    // registered `/auth/callback`). The callback restores `redirectAfterLogin`,
    // so stash where we were. Never the legacy `/api/auth/login` BFF — its
    // `/api/auth/callback` redirect_uri is unregistered and bounces the user.
    if (!data.additional && typeof window !== 'undefined') {
      const here = window.location.pathname + window.location.search;
      try {
        window.localStorage.setItem('redirectAfterLogin', here);
      } catch {
        /* storage unavailable — fall through to a bare re-login */
      }
      window.location.href = '/login';
      return;
    }
    if (data.org) switchOrg(data.org);
    else await refresh();
  }, [refresh]);

  return (
    <Ctx.Provider value={{ ctx, loading, error, refresh, createOrg }}>
      {children}
    </Ctx.Provider>
  );
}

/** Access the org context. Must be used under <OrgProvider>. */
export function useOrg(): OrgState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useOrg must be used within <OrgProvider>');
  return v;
}

/** The current effective org slug (or '' before load / when signed out). */
export function useCurrentOrg(): string {
  const { ctx } = useOrg();
  return ctx?.currentOrg ?? '';
}
