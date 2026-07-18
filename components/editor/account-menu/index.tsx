"use client";

/**
 * EditorAccountMenu — the builder's workspace/account dropdown (the panel that
 * opens from the bottom-left identity cluster), styled to Hanzo's darker chrome
 * and modeled on Lovable's project menu: dashboard shortcut, the active
 * workspace/org row, a live CREDITS card (balance + a spendable progress bar),
 * project actions, appearance (theme), help, then account + sign-out.
 *
 * Honesty rules (this app's law):
 *  - Identity comes from the signed-in IAM account (`useUser`); the org from the
 *    same scope the OrgSwitcher/SidebarWallet use (`useOrg` + `org-scope`).
 *  - The credit number is the ONE shared live store (`useCloudBalance`), the
 *    exact per-org credit the gateway debits — never fabricated. When it isn't
 *    ready we show "—" and an honest hint, never a made-up value. The progress
 *    bar is a REAL ratio (spendable ÷ total), only drawn from real fields.
 *  - Actions with a real destination are wired (Dashboard, Settings, Billing,
 *    Appearance, Help, Sign out). Project actions whose backend isn't reachable
 *    from this cluster render but fire an honest "coming soon" toast — see the
 *    followups returned with this change.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Wallet,
  Settings,
  Plug,
  GitFork,
  Share2,
  Pencil,
  Star,
  FolderInput,
  Info,
  SunMoon,
  LifeBuoy,
  LogOut,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@hanzo/ui";

import { useUser } from "@/hooks/useUser";
import { useOrg } from "@/lib/org/client";
import { currentOrg, orgDisplayName } from "@/lib/org-scope";
import { useCloudBalance, spendableCents } from "@/lib/billing/live-balance";
import { OrgAvatar } from "@/components/org-switcher";
import { gravatarUrl } from "@/lib/avatar";

const fmtUsd = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

// Shared item styling — Hanzo darker chrome: white-on-black, hairline focus.
const ITEM =
  "cursor-pointer gap-2 rounded-md px-2 py-1.5 text-sm text-white/80 focus:bg-white/[0.06] focus:text-white";
const ICON = "size-4 text-white/40";

export function EditorAccountMenu({
  direction = "down",
}: {
  /** "up" opens the menu above the trigger — for the bottom-left cluster. */
  direction?: "up" | "down";
}) {
  const { user, logout } = useUser();
  const { ctx } = useOrg();
  const { phase, balance } = useCloudBalance();
  const { theme, setTheme } = useTheme();

  // next-themes resolves only on the client — defer the checked radio until
  // mount so SSR and first paint agree (no hydration mismatch).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const cents = spendableCents(balance);
  const ready = phase === "ready" && cents !== null;
  // Honest balance text: a real number when ready, else "—" (inline null-check
  // so `cents` narrows to a number — never a fabricated fallback).
  const balanceText = phase === "ready" && cents !== null ? fmtUsd(cents) : "—";

  // Progress = spendable ÷ total balance — a REAL ratio from the commerce
  // fields (holds are the consumed remainder). When only `available` is known
  // (no total), all known funds are spendable → full. Never a fabricated quota.
  const total = typeof balance?.balance === "number" ? balance.balance : null;
  const holds = typeof balance?.holds === "number" ? balance.holds : null;
  const pct = ready
    ? total !== null && total > 0
      ? Math.max(0, Math.min(100, Math.round(((cents ?? 0) / total) * 100)))
      : 100
    : 0;

  const creditHint =
    phase === "unconfigured"
      ? "Billing not set up on this workspace"
      : phase === "noauth"
        ? "Sign in to view credits"
        : phase === "error"
          ? "Couldn’t load balance"
          : !ready
            ? "Loading balance…"
            : holds !== null && holds > 0
              ? `${fmtUsd(holds)} on hold`
              : "Credits debit as you build";

  if (!user) return null;

  const name = user.fullname || user.name || "Account";
  const initial = name.charAt(0).toUpperCase();
  // Gravatar fallback: when IAM carries no `picture`, derive one from the email.
  // `d=404` ⇒ "no gravatar for this email" → the <img> errors → Radix Avatar
  // swaps to the initial (its onError-driven <AvatarFallback>). Never fabricated.
  const gravatar = user.email ? gravatarUrl(user.email, 64) : "";
  const avatarSrc = user.avatarUrl || gravatar || undefined;

  // Active org scope — resolved exactly like the OrgSwitcher/SidebarWallet, so
  // the workspace row names the ORG the credits attribute to (never the person).
  const orgId = currentOrg() || ctx?.currentOrg || "";
  const orgName = orgDisplayName(ctx?.orgs ?? [], orgId) || "Workspace";
  const activeOrg = (ctx?.orgs ?? []).find((o) => o.name === orgId);
  const orgKind = activeOrg?.isPersonal ? "Personal" : "Team";

  // Project actions whose backend isn't reachable from this cluster (no project
  // is in scope here). Render them, but be honest that they're not yet wired.
  const comingSoon = (label: string) =>
    toast(label, { description: "Not wired up yet — coming soon." });

  return (
    <div className="flex items-center gap-2">
      {/* Credits pill → billing. Glanceable balance; hidden on tight widths. */}
      <Link
        href="/billing"
        title="Credit balance — manage billing"
        className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white md:flex"
      >
        <Wallet className="size-3.5 text-white/40" />
        <span className="font-mono tabular-nums">{balanceText}</span>
      </Link>

      {/* Identity + workspace/project menu. */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 px-1.5">
            <Avatar className="size-7">
              <AvatarImage src={avatarSrc} alt={name} />
              <AvatarFallback className="bg-white/10 text-xs text-white">
                {initial}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[120px] truncate lg:inline">{name}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side={direction === "up" ? "top" : "bottom"}
          align="start"
          className="w-72 rounded-xl border border-white/10 bg-[#0a0a0a] p-1.5 text-white shadow-2xl"
        >
          {/* Who you're signed in as. */}
          <DropdownMenuLabel className="px-2 py-2 font-normal">
            <div className="flex items-center gap-2">
              <Avatar className="size-7">
                <AvatarImage src={avatarSrc} alt={name} />
                <AvatarFallback className="bg-white/10 text-xs text-white">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-tight text-white">{name}</p>
                {user.email && (
                  <p className="truncate text-xs leading-tight text-white/50">{user.email}</p>
                )}
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuItem asChild className={ITEM}>
            <Link href="/dashboard">
              <LayoutDashboard className={ICON} />
              Go to Dashboard
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="-mx-1.5 my-1.5 bg-white/10" />

          {/* Active workspace/org — real mark (image/emoji/initial) + plan/kind. */}
          <DropdownMenuLabel className="flex items-center gap-2.5 px-2 py-1.5 font-normal">
            <OrgAvatar name={orgName} logo={activeOrg?.logo} className="size-7 text-[11px]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-white">{orgName}</span>
              <span className="block text-[11px] text-white/40">Workspace</span>
            </span>
            <span className="shrink-0 rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-white/50">
              {orgKind}
            </span>
          </DropdownMenuLabel>

          {/* Credits — the real per-org balance + a real spendable bar. The whole
              card is one focusable affordance → billing. */}
          <DropdownMenuItem
            asChild
            className="mt-1 cursor-pointer flex-col items-stretch gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 focus:bg-white/[0.06]"
          >
            <Link href="/billing" aria-label="Credits — manage billing">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium text-white/70">
                  <Wallet className="size-3.5 text-white/40" />
                  Credits
                </span>
                <span className="font-mono text-sm tabular-nums text-white">{balanceText}</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Credits spendable"
                className="h-1 w-full overflow-hidden rounded-full bg-white/10"
              >
                <div
                  className="h-full rounded-full bg-white/80 transition-[width] duration-500 ease-out motion-reduce:transition-none"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] text-white/40">{creditHint}</span>
                <span className="shrink-0 text-[11px] font-medium text-white/60">Manage →</span>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="-mx-1.5 my-1.5 bg-white/10" />

          <DropdownMenuItem asChild className={ITEM}>
            <Link href="/settings">
              <Settings className={ICON} />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className={ITEM} onSelect={() => comingSoon("Project connectors")}>
            <Plug className={ICON} />
            Project connectors
          </DropdownMenuItem>
          <DropdownMenuItem className={ITEM} onSelect={() => comingSoon("Remix this project")}>
            <GitFork className={ICON} />
            Remix this project
          </DropdownMenuItem>
          <DropdownMenuItem className={ITEM} onSelect={() => comingSoon("Publish to profile")}>
            <Share2 className={ICON} />
            Publish to profile
          </DropdownMenuItem>
          <DropdownMenuItem className={ITEM} onSelect={() => comingSoon("Rename project")}>
            <Pencil className={ICON} />
            Rename project
          </DropdownMenuItem>
          <DropdownMenuItem className={ITEM} onSelect={() => comingSoon("Star project")}>
            <Star className={ICON} />
            Star project
          </DropdownMenuItem>
          <DropdownMenuItem className={ITEM} onSelect={() => comingSoon("Move to folder")}>
            <FolderInput className={ICON} />
            Move to folder
          </DropdownMenuItem>
          <DropdownMenuItem className={ITEM} onSelect={() => comingSoon("Project details")}>
            <Info className={ICON} />
            Details
          </DropdownMenuItem>

          <DropdownMenuSeparator className="-mx-1.5 my-1.5 bg-white/10" />

          {/* Appearance — real theme control (next-themes). */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className={`${ITEM} data-[state=open]:bg-white/[0.06] data-[state=open]:text-white`}
            >
              <SunMoon className={ICON} />
              Appearance
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="space-y-0.5 rounded-lg border border-white/10 bg-[#0a0a0a] p-1 text-white shadow-2xl">
              <DropdownMenuRadioGroup
                value={mounted ? (theme ?? "system") : undefined}
                onValueChange={setTheme}
              >
                <DropdownMenuRadioItem
                  value="system"
                  className="cursor-pointer rounded-md py-1.5 pr-2 text-sm text-white/80 focus:bg-white/[0.06] focus:text-white"
                >
                  System
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="light"
                  className="cursor-pointer rounded-md py-1.5 pr-2 text-sm text-white/80 focus:bg-white/[0.06] focus:text-white"
                >
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="dark"
                  className="cursor-pointer rounded-md py-1.5 pr-2 text-sm text-white/80 focus:bg-white/[0.06] focus:text-white"
                >
                  Dark
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem asChild className={ITEM}>
            <a href="https://hanzo.ai/docs" target="_blank" rel="noopener noreferrer">
              <LifeBuoy className={ICON} />
              Help
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="-mx-1.5 my-1.5 bg-white/10" />

          <DropdownMenuItem
            onSelect={() => void logout()}
            className={`${ITEM} text-white/70`}
          >
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
