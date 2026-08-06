'use client';

/**
 * The org selector for the builder/dashboard chrome — `OrgSwitcher` from
 * `@hanzo/ui/product`, given this app's scope, list and create hook.
 *
 * This file used to BE the switcher: a hand-rolled popover kept local for two
 * capabilities the hoisted one lacked — a panel that opens UPWARD (it sits in the
 * bottom identity bar, where a downward panel opens off the viewport) and rows of
 * its own below the list. Both now exist upstream as `direction` and `footer`, so
 * the reason to keep a copy is gone and what is left here is the binding: which
 * orgs, named how, and what creating one does.
 *
 * The list is already in hand — `/v1/orgs` returns the whole set the user may act
 * in (one row for a normal user, the tenant list for a global admin) — so the
 * pager below pages an array rather than the server. That is the honest shape for
 * this app: the loader contract exists so a surface with thousands of orgs can
 * ask for them a page at a time, and hanzo.app is not that surface.
 */
import { XStack, SizableText, YStack } from '@hanzo/ui';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { OrgSwitcher as Switcher, type Org as Shown } from '@hanzo/ui/product';

import { useOrg } from '@/lib/org/client';
import { currentOrg, display, filterOrgs, scope, titleCase } from '@/lib/org-scope';

/** Rows per page — the whole list arrives at once, so this only bounds a page. */
const PAGE = 20;

export function OrgSwitcher({ direction = 'down' }: { direction?: 'up' | 'down' } = {}) {
  const { ctx, loading, createOrg } = useOrg();

  const currentId = currentOrg() || ctx?.currentOrg || '';

  if (loading) {
    return (
      <XStack alignItems="center" gap="$2" height={44} paddingHorizontal="$2">
        <SizableText fontSize="$3" color="$color11">…</SizableText>
      </XStack>
    );
  }
  if (!ctx) return null; // signed out — no org chrome

  // Always include the org the surface is scoped to, so the switcher names the
  // right workspace even when the list has not resolved it.
  const rows =
    !currentId || ctx.orgs.some((o) => o.name === currentId)
      ? ctx.orgs
      : [{ name: currentId, displayName: titleCase(currentId), isPersonal: false }, ...ctx.orgs];

  const current = ctx.orgs.find((o) => o.name === currentId);

  return (
    <Switcher
      scope={scope}
      direction={direction}
      current={currentId ? display({ name: currentId, logo: current?.logo }) : undefined}
      orgs={async (page: number, query: string): Promise<Shown[]> =>
        filterOrgs(rows, query)
          .slice(page * PAGE, (page + 1) * PAGE)
          .map(display)
      }
      pageSize={PAGE}
      // `createOrg` already lands the user in the new org — it re-auths a
      // zero-org user (their JWT `owner` changed) or scopes into an additional
      // one. Handing back the org we are now in makes the switcher's own
      // follow-up switch a no-op rather than a second navigation.
      create={async (name: string) => {
        await createOrg({ name });
        return currentOrg();
      }}
      footer={
        <YStack>
          {current?.isPersonal && (
            <SizableText paddingHorizontal="$2" paddingVertical="$1" fontSize={10} color="$color11">
              Personal workspace
            </SizableText>
          )}
          {/* The org's mark and emoji picker live on their own settings page —
              the switcher stays a switcher. */}
          <Link href="/settings/organization">
            <XStack
              marginTop="$1" width="100%" alignItems="center" gap="$2" borderRadius="$3"
              borderTopWidth={1} borderColor="$borderColor" paddingHorizontal="$2" paddingVertical="$2"
              hoverStyle={{ backgroundColor: '$color3' }}
            >
              <Settings size={16} />
              <SizableText fontSize="$3" color="$color">Organization settings</SizableText>
              <SizableText marginLeft="auto" color="$color11">→</SizableText>
            </XStack>
          </Link>
        </YStack>
      }
    />
  );
}
