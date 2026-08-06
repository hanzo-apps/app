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
import { YStack } from '@hanzo/ui';
import {useRouter} from 'next/navigation'
import {User, Wallet} from 'lucide-react'
import {UserMenu, resolveIdentity} from '@hanzo/iam/react'

import {portrait} from '@/lib/avatar'
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
  // store, which is what makes IamCookieBridge clear the session cookie and
  // lands the user on `/`. The route that used to clear only the cookie left the
  // SDK holding the token, so the bridge wrote it straight back on next mount.
  const {user, logout} = useUser()
  const {ctx} = useOrg()
  const router = useRouter()
  const {phase, balance} = useCloudBalance()
  // NO `useUserTheme()`, and therefore no `theme` prop on UserMenu (@hanzo/iam
  // hides the light/dark/system control when it is omitted). That hook is a THEME
  // CONTROLLER, not a read: on mount it calls applyTheme(mode), which for the
  // default `system` resolves `prefers-color-scheme` and does
  // `documentElement.classList.toggle('dark', resolved === 'dark')` plus
  // data-theme and style.colorScheme.
  //
  // hanzo.app is dark-only and the ONE authority is the literal `dark` class the
  // server renders (app/layout.tsx). This hook was a second one that disagreed —
  // and because it rides the SIDEBAR, it fired on every shell route while the
  // marketing pages were untouched, which is exactly the shape of the bug:
  // /catalog and /gallery painted WHITE on an OS set to light while / and
  // /pricing stayed black. Measured: `dark` was stripped ~857ms after load, only
  // under `prefers-color-scheme: light`.
  //
  // EVERY hook this component calls is still called before the first `return` —
  // a hook below `if (!user) return null` gives the signed-out first paint a
  // shorter hook list than the paint after the session resolves (React #310,
  // thrown during commit and fatal to the whole tree, not just this control).
  const cents = spendableCents(balance)

  if (!user) return null

  // resolveIdentity is the ONE identity resolution (@hanzo/iam): it refuses
  // id-shaped values wherever they arrive, which is why this used to render
  // `e7d7fda0-4c53-…` — hanzo.app's user object carries the uuid in `name`.
  const resolved = resolveIdentity(
    user as unknown as Record<string, unknown>,
    {},
  )
  // UserMenu renders `avatarUrl ? <img> : <monogram>` and puts no onError on that
  // img, so a URL that fails to load is a broken-image glyph — permanently, for
  // everyone. IAM gives every photo-less account a stand-in that 404s, which is
  // exactly that case, and it is what put a question mark in the account row.
  // `portrait` decides there is no photo, so the monogram renders instead.
  const identity = resolved && { ...resolved, avatarUrl: portrait(resolved.avatarUrl) || null }
  const name = identity?.name ?? 'Account'
  // The ACTIVE org the wallet (and every scoped call) attributes to — resolved
  // exactly like the OrgSwitcher, so the person's identity is bound to a
  // clearly-named org at the bottom of the sidebar.
  const org = orgDisplayName(
    ctx?.orgs ?? [],
    currentOrg() || ctx?.currentOrg || '',
  )

  // ONE control, everywhere: identity, the org, the balance, settings/usage and
  // sign-out all come from @hanzo/iam's UserMenu — the same widget hanzo.chat
  // mounts. hanzo.app supplies only what is its own (profile, top-up, the live
  // per-org balance) and, when collapsed, hides the label so the rail stays narrow.
  return (
    // Collapsed, the sidebar is an icon rail: `.rail` (assets/globals.css) hides
    // the label so the trigger is just the avatar.
    <YStack borderTopWidth={1} padding="$2" className={collapsed ? 'rail' : undefined}>
      <UserMenu
        identity={identity}
        isAuthenticated
        onSignOut={() => void logout()}
        align="up"
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
            icon: <User size={16} />,
            onSelect: () => router.push('/profile'),
          },
          {
            label: 'Top up',
            icon: <Wallet size={16} />,
            onSelect: openTopUp,
          },
        ]}
        brand={{name: 'Hanzo AI', href: 'https://hanzo.ai'}}
        // No `classNames`: each one REPLACES the component's own class rather
        // than adding to it (`classNames.trigger ?? 'hz-iam-trigger'`), and the
        // values here were Tailwind — a vocabulary this app does not compile. So
        // the trigger lost the `display:flex; width:100%; align-items:center`
        // that IS the row, and the name dropped under the avatar in a 33px
        // column; `hidden` never hid anything either.
  />
    </YStack>
  )
}
