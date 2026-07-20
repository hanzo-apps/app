'use client';

/**
 * Sidebar wallet — always-visible identity + per-org credit balance, pinned to
 * the bottom of the sidebar so the customer's account, balance, top-up, and
 * sign-out are one glance / one click away on every page.
 *
 * MIRRORED FROM console2's `SidebarWallet.tsx` (identical behavior), rendered with
 * hanzo.app's `@hanzo/ui`/lucide instead of `@hanzo/gui`:
 *  - Identity from the signed-in IAM account (`useUser`).
 *  - Balance from the ONE shared live store (`useCloudBalance`) → the per-tenant
 *    `/v1/wallet` proxy, scoped to the ACTIVE org (the org the switcher selected,
 *    stamped as X-Org-Id). The exact credit the gateway debits — never fabricated.
 *  - Top up → the brand billing portal (payment is never rebuilt here).
 *  - Honest states: loading (—), a real balance, or "—" when unauthenticated /
 *    billing not configured on this deployment.
 */
import { useRouter } from 'next/navigation';
import { LogOut, Wallet } from 'lucide-react';

import { useUser } from '@/hooks/useUser';
import { useOrg } from '@/lib/org/client';
import { currentOrg, orgDisplayName } from '@/lib/org-scope';
import { useCloudBalance, spendableCents } from '@/lib/billing/live-balance';

const BILLING_URL = process.env.NEXT_PUBLIC_BILLING_URL || 'https://billing.hanzo.ai';

const fmtUsd = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function openTopUp(): void {
  if (typeof window !== 'undefined') window.open(`${BILLING_URL}/topup`, '_blank', 'noopener');
}

export function SidebarWallet({ collapsed }: { collapsed: boolean }) {
  // ONE logout: the @hanzo/iam SDK (useUser().logout) clears the SDK token
  // store, which lets IamCookieBridge clear the hanzo_token cookie and lands
  // the user on `/`. A server-only /v1/auth/logout cleared the cookie but not
  // the SDK store, so the bridge resurrected it on the next mount.
  const { user, logout } = useUser();
  const { ctx } = useOrg();
  const router = useRouter();
  const { phase, balance } = useCloudBalance();
  const cents = spendableCents(balance);

  if (!user) return null;

  const name = user.fullname || user.name || 'Account';
  const avatar = (user as { avatarUrl?: string }).avatarUrl;
  // The ACTIVE org the wallet (and every scoped call) attributes to — resolved
  // exactly like the OrgSwitcher, so the person's identity is bound to a
  // clearly-named org at the bottom of the sidebar.
  const org = orgDisplayName(ctx?.orgs ?? [], currentOrg() || ctx?.currentOrg || '');
  // Honest balance text: a real number when ready, else "—" (loading / no-auth /
  // billing unconfigured) — never a fabricated value.
  const balanceText = phase === 'ready' && cents !== null ? fmtUsd(cents) : '—';

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 border-t p-2">
        <button
          onClick={() => router.push('/profile')}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium"
          title={name}
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={name} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            initials(name)
          )}
        </button>
        <button onClick={openTopUp} className="p-1.5 text-muted-foreground hover:text-foreground" title={`Wallet ${balanceText}${org ? ` · ${org}` : ''} — top up`}>
          <Wallet className="h-4 w-4" />
        </button>
        <button onClick={() => void logout()} className="p-1.5 text-muted-foreground hover:text-foreground" title="Sign out">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t p-2">
      <div className="space-y-2 rounded-lg border bg-card p-2.5">
        {/* Identity → Profile */}
        <button
          onClick={() => router.push('/profile')}
          className="flex w-full items-center gap-2.5 text-left hover:opacity-85"
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={name} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {initials(name)}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{name}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{user.email || 'View profile'}</span>
          </span>
        </button>

        {/* Balance — the ACTIVE org's credit, labeled with that org so the
            per-org scope is unmistakable at the bottom identity. */}
        <div className="flex items-center justify-between gap-2 px-1 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" />
            {balanceText}
          </span>
          {phase === 'unconfigured' ? (
            <span className="text-[10px] text-muted-foreground">billing not set up</span>
          ) : org ? (
            <span
              className="min-w-0 max-w-[9rem] truncate text-[10px] text-muted-foreground"
              title={`Active organization: ${org}`}
            >
              {org}
            </span>
          ) : null}
        </div>

        <button onClick={openTopUp} className="w-full rounded-md bg-foreground px-2 py-1.5 text-sm font-medium text-background hover:opacity-90">
          Top up
        </button>
        <button onClick={() => void logout()} className="flex w-full items-center justify-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent">
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );
}
