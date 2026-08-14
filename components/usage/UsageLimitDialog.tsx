'use client';

/**
 * UsageLimitDialog — the "Need more usage?" modal (claude.ai pattern).
 *
 * Shown when a metered action (an AI generation, a deploy) comes back with an
 * out-of-credit / limit signal — a 402 from the gateway/cloud — instead of
 * failing silently. Two honest paths forward, no fabricated numbers:
 *   • Add credits  → the existing in-app wallet / top-up surface (/billing).
 *   • Upgrade plan → the plans page (/pricing).
 *
 * Presentational + reusable: it renders open state only; the trigger lives in
 * UsageLimitProvider (components/usage/usage-limit) so ANY metered action can
 * raise the same modal. Accessibility (focus trap, Esc, aria-labelled title +
 * description) comes from the @hanzo/ui Dialog (Radix).
 */
import { YStack, XStack, SizableText } from '@hanzo/ui';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@hanzo/ui';
import { Wallet, Sparkles, ArrowRight, type LucideIcon } from 'lucide-react';

import { useCloudBalance, spendableCents } from '@/lib/billing/live-balance';

const fmtUsd = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

export function UsageLimitDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent borderColor="$borderColor" backgroundColor="$background" $sm={{ maxWidth: 448 }}>
        <DialogHeader>
          <DialogTitle fontSize="$7" fontWeight="500" letterSpacing={-0.4}>Need more usage?</DialogTitle>
          <DialogDescription color="$color11">
            You&apos;ve reached your limit. To keep going:
          </DialogDescription>
        </DialogHeader>

        {/* Honest live balance — only mounted while the dialog is open. */}
        {open ? <BalanceLine /> : null}

        <YStack marginTop="$1" gap="$2">
          <OptionCard
            icon={Wallet}
            title="Add credits"
            desc="Top up your balance and keep building — pay only for what you use."
            onClick={() => go('/billing')}
  />
          <OptionCard
            icon={Sparkles}
            title="Upgrade your plan"
            desc="Move to a plan with more included usage, higher limits, and premium models."
            onClick={() => go('/pricing')}
  />
        </YStack>
      </DialogContent>
    </Dialog>
  );
}

function OptionCard({
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  // A pressable XStack, not a Button. Button sizes itself for a single-line
  // label — it takes its height from the token, so a second line of wrapping
  // description cannot grow the box. The text rendered OUTSIDE the card and
  // the next card overlapped it. A card that wraps has to own its own height.
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ all: 'unset', display: 'block', width: '100%', cursor: 'pointer' }}
    >
      <XStack
        width="100%"
        alignItems="flex-start"
        gap="$3"
        borderRadius="$6"
        borderWidth={1}
        borderColor="$borderColor"
        backgroundColor="$background"
        padding="$4"
        hoverStyle={{ borderColor: '$color', backgroundColor: '$color3' }}
        pressStyle={{ backgroundColor: '$color3' }}
      >
        <XStack height={36} width={36} flexShrink={0} alignItems="center" justifyContent="center" borderRadius="$5" backgroundColor="$color3">
          <SizableText color="$color"><Icon size={20} /></SizableText>
        </XStack>
        {/* flexGrow + an AUTO basis, never `flex={1}`.
            `flex={1}` compiles to `flex-basis: 0` in gui's flex model, so in a
            content-sized row the column's hypothetical height is 0 and it does
            not reserve the space its own text needs. The wrapping description
            then painted OUTSIDE the card and landed on the card below it — the
            live modal showed "…for what you use." running through "Upgrade your
            plan". Same collapse this app already fixed on TabsContent and
            CardContent; the remedy is the same: keep the growing, restore the
            basis. */}
        <YStack minWidth={0} flexGrow={1} flexBasis="auto" gap="$1">
          <XStack alignItems="center" justifyContent="space-between" gap="$2">
            <SizableText fontSize="$3" fontWeight="500" color="$color">{title}</SizableText>
            <SizableText color="$color11" flexShrink={0}><ArrowRight size={16} /></SizableText>
          </XStack>
          <SizableText fontSize="$1" lineHeight={18} color="$color11">{desc}</SizableText>
        </YStack>
      </XStack>
    </button>
  );
}

/** The signed-in org's live credit balance — the exact number the gateway
 *  debits (via the ONE shared store). Renders nothing until a real value loads,
 *  so it never shows a fabricated placeholder. */
function BalanceLine() {
  const { phase, balance } = useCloudBalance();
  const cents = spendableCents(balance);
  if (phase !== 'ready' || cents === null) return null;
  return (
    <XStack alignItems="center" gap="$2" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2">
      <SizableText color="$color11"><Wallet size={14} /></SizableText>
      <SizableText fontSize="$1" color="$color11">Current balance</SizableText>
      <SizableText marginLeft="auto" fontFamily="$mono" fontSize="$1" color="$color">{fmtUsd(cents)}</SizableText>
    </XStack>
  );
}

export default UsageLimitDialog;
