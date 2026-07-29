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
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@hanzo/ui';
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
      <DialogContent className="border-border bg-card text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium tracking-tight">Need more usage?</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            You&apos;ve reached your limit. To keep going:
          </DialogDescription>
        </DialogHeader>

        {/* Honest live balance — only mounted while the dialog is open. */}
        {open ? <BalanceLine /> : null}

        <div className="mt-1 flex flex-col gap-2">
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
        </div>
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
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-start gap-3 rounded-xl border border-border bg-background/40 p-4 text-left outline-none transition-colors hover:border-foreground/25 hover:bg-accent focus-visible:ring-2 focus-visible:ring-foreground/30"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/10 text-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">{title}</span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{desc}</span>
      </span>
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
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground">
      <Wallet className="h-3.5 w-3.5" />
      <span>Current balance</span>
      <span className="ml-auto font-mono text-foreground">{fmtUsd(cents)}</span>
    </div>
  );
}

export default UsageLimitDialog;
