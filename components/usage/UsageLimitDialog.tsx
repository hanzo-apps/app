'use client';

/**
 * UsageLimitDialog — the "Need more usage?" modal (claude.ai pattern).
 *
 * Shown when a metered action (an AI generation, a deploy) comes back with an
 * out-of-credit / limit signal — a 402 from the gateway/cloud — instead of
 * failing silently.
 *
 * It says what the REFUSAL said. The description used to read "You've reached
 * your limit" no matter what came back, which is a claim about the reader's
 * money made by a component that has read none of it — and it was shown, in
 * production, above a balance line reading six figures. `reason` carries the
 * gateway's own sentence here (see lib/gateway.ts `said`); absent one, the
 * modal states no cause at all rather than inventing the likeliest.
 *
 * Two honest paths forward, no fabricated numbers:
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

/**
 * The CAUSE the refusal gave, without the instruction it gave with it.
 *
 * A gateway sentence is written for a caller that has no UI: "Insufficient
 * balance. Add credits to your wallet at https://pay.hanzo.ai". This modal is
 * the UI, and it offers both of those as real buttons — so printing that
 * sentence whole put a THIRD destination in prose above two controls that do
 * the same job, and ran it straight into "To keep going:" with no break,
 * because the reason ends in a URL and not a full stop. Measured in production:
 * "…at https://pay.hanzo.ai To keep going:".
 *
 * So the rule is about the sentence's JOB, not about one string: keep what
 * states the cause, drop what states a way forward, because a way forward is
 * exactly what the rows below are. A sentence carrying a link is an
 * instruction; nothing else here is.
 *
 * Returns undefined when nothing survives, which is the case the caller already
 * handles by stating no cause at all rather than inventing the likeliest.
 */
export function cause(reason?: string): string | undefined {
  if (!reason) return undefined;
  const kept = reason
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim() && !/https?:\/\/|\bwww\./i.test(s))
    .join(' ')
    .trim();
  if (!kept) return undefined;
  // It is about to be followed by another sentence, so it has to end like one.
  return /[.!?]$/.test(kept) ? kept : `${kept}.`;
}

export function UsageLimitDialog({
  open,
  onOpenChange,
  reason,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * The sentence the refusal actually stated, when it stated one. It replaces
   * the generic below rather than joining it: a reader shown both reads the
   * vague one first and the true one as a footnote.
   */
  reason?: string;
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
            {(() => { const c = cause(reason); return c ? `${c} To keep going:` : 'To keep going:'; })()}
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
