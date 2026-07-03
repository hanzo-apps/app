"use client";

/**
 * Compact account + credits cluster for the builder top bar, so a customer
 * always knows WHO they are and how much balance they have while building.
 *
 * Identity comes from the signed-in IAM account (`useUser`); the credit balance
 * from the ONE shared live store (`useCloudBalance`), scoped to the active org
 * the OrgSwitcher selected — the exact credit the gateway debits, never
 * fabricated. Org context itself is the sibling <OrgSwitcher/> in the header.
 */
import Link from "next/link";
import { Wallet, Home, MessageCircleCode, Settings, CreditCard, LogOut } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hanzo/ui";

import { useUser } from "@/hooks/useUser";
import { useCloudBalance, spendableCents } from "@/lib/billing/live-balance";

const fmtUsd = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

export function EditorAccountMenu() {
  const { user, logout } = useUser();
  const { phase, balance } = useCloudBalance();
  const cents = spendableCents(balance);
  // Honest: a real number when ready, else "—" (loading / no-auth / billing
  // unconfigured on this deployment) — never a fabricated value.
  const balanceText = phase === "ready" && cents !== null ? fmtUsd(cents) : "—";

  if (!user) return null;

  const name = user.fullname || user.name || "Account";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      {/* Credits pill → top up. Hidden on the tightest widths. */}
      <Link
        href="/billing"
        title="Credit balance — top up"
        className="hidden md:flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 px-2.5 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-700 hover:text-white"
      >
        <Wallet className="size-3.5 text-neutral-500" />
        {balanceText}
      </Link>

      {/* Identity + quick account actions. */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 px-1.5">
            <Avatar className="size-7">
              <AvatarImage src={user.avatarUrl} alt={name} />
              <AvatarFallback className="text-xs bg-white/10 text-white">
                {initial}
              </AvatarFallback>
            </Avatar>
            <span className="hidden lg:inline max-w-[120px] truncate">{name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none truncate">{name}</p>
              {user.email && (
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user.email}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link href="/dashboard">
            <DropdownMenuItem>
              <Home className="mr-2 size-4 text-neutral-400" />
              Dashboard
            </DropdownMenuItem>
          </Link>
          <Link href="/chat">
            <DropdownMenuItem>
              <MessageCircleCode className="mr-2 size-4 text-neutral-400" />
              Chat
            </DropdownMenuItem>
          </Link>
          <Link href="/billing">
            <DropdownMenuItem>
              <CreditCard className="mr-2 size-4 text-neutral-400" />
              Billing
              <span className="ml-auto text-xs text-muted-foreground">{balanceText}</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/settings">
            <DropdownMenuItem>
              <Settings className="mr-2 size-4 text-neutral-400" />
              Settings
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void logout()} className="text-white/70">
            <LogOut className="mr-2 size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
