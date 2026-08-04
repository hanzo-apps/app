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
import { YStack, SizableText } from '@hanzo/gui';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Button } from '@hanzo/ui';
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
  return (
    <Button
      type="button"
      onClick={onClick}
      group width="100%" alignItems="flex-start" gap="$3" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$4" outlineWidth={0} hoverStyle={{ borderColor: "$color", backgroundColor: "$color3" }}
    >
      <SizableText height={36} width={36} flexShrink={0} alignItems="center" justifyContent="center" borderRadius="$5" backgroundColor="$color" color="$color">
        <Icon size={20} />
      </SizableText>
      <SizableText minWidth={0} flex={1}>
        <SizableText alignItems="center" justifyContent="space-between" gap="$2">
          <SizableText fontSize="$3" fontWeight="500" color="$color">{title}</SizableText>
          <ArrowRight size={16} color="$color11" />
        </SizableText>
        <SizableText marginTop="$0.5" fontSize="$1" lineHeight={1.625} color="$color11">{desc}</SizableText>
      </SizableText>
    </Button>
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
    <SizableText alignItems="center" gap="$2" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2" fontSize="$1" color="$color11" display="flex" flexDirection="row">
      <Wallet size={14} />
      <span>Current balance</span>
      <SizableText marginLeft="auto" fontFamily="$mono" color="$color">{fmtUsd(cents)}</SizableText>
    </SizableText>
  );
}

export default UsageLimitDialog;
