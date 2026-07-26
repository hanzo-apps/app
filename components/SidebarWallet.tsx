'use client'

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
import {useRouter} from 'next/navigation'
import {User, Wallet} from 'lucide-react'
import {UserMenu, resolveIdentity, useUserTheme} from '@hanzo/iam/react'

import {useUser} from '@/hooks/useUser'
import {useOrg} from '@/lib/org/client'
import {currentOrg, orgDisplayName} from '@/lib/org-scope'
import {useCloudBalance, spendableCents} from '@/lib/billing/live-balance'

const BILLING_URL =
  process.env.NEXT_PUBLIC_BILLING_URL || 'https://billing.hanzo.ai'

const fmtUsd = (cents: number): string => `$${(cents / 100).toFixed(2)}`

function openTopUp(): void {
  if (typeof window !== 'undefined')
    window.open(`${BILLING_URL}/topup`, '_blank', 'noopener')
}

export function SidebarWallet({collapsed}: {collapsed: boolean}) {
  // ONE logout: the @hanzo/iam SDK (useUser().logout) clears the SDK token
  // store, which lets IamCookieBridge clear the hanzo_token cookie and lands
  // the user on `/`. A server-only /v1/auth/logout cleared the cookie but not
  // the SDK store, so the bridge resurrected it on the next mount.
  const {user, logout} = useUser()
  const {ctx} = useOrg()
  const router = useRouter()
  const {phase, balance} = useCloudBalance()
  const cents = spendableCents(balance)

  if (!user) return null

  // resolveIdentity is the ONE identity resolution (@hanzo/iam): it refuses
  // id-shaped values wherever they arrive, which is why this used to render
  // `e7d7fda0-4c53-…` — hanzo.app's user object carries the uuid in `name`.
  const identity = resolveIdentity(
    user as unknown as Record<string, unknown>,
    {},
  )
  const name = identity?.name ?? 'Account'
  // The ACTIVE org the wallet (and every scoped call) attributes to — resolved
  // exactly like the OrgSwitcher, so the person's identity is bound to a
  // clearly-named org at the bottom of the sidebar.
  const org = orgDisplayName(
    ctx?.orgs ?? [],
    currentOrg() || ctx?.currentOrg || '',
  )

  const theme = useUserTheme()

  // ONE control, everywhere: identity, the org, the balance, settings/usage and
  // sign-out all come from @hanzo/iam's UserMenu — the same widget hanzo.chat
  // mounts. hanzo.app supplies only what is its own (profile, top-up, the live
  // per-org balance) and, when collapsed, hides the label so the rail stays narrow.
  return (
    <div className="border-t p-2">
      <UserMenu
        identity={identity}
        isAuthenticated
        onSignOut={() => void logout()}
        align="up"
        theme={theme}
        settingsUrl="/profile"
        settingsLabel="Profile & settings"
        usageUrl={`${BILLING_URL}/usage`}
        balance={
          phase === 'ready' && cents !== null
            ? {
                amountUsd: cents / 100,
                label: org ? `Balance · ${org}` : 'Balance',
                topUpLabel: 'Top up',
                topUpUrl: `${BILLING_URL}/topup`,
              }
            : undefined
        }
        items={[
          {
            label: 'Profile',
            icon: <User className="h-4 w-4" />,
            onSelect: () => router.push('/profile'),
          },
          {
            label: 'Top up',
            icon: <Wallet className="h-4 w-4" />,
            onSelect: openTopUp,
          },
        ]}
        brand={{name: 'Hanzo AI', href: 'https://hanzo.ai'}}
        classNames={{
          trigger:
            'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-accent',
          triggerLabel: collapsed
            ? 'hidden'
            : 'min-w-0 flex-1 truncate text-sm font-medium',
        }}
      />
    </div>
  )
}
