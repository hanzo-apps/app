"use client";

// The ONE public/marketing header for hanzo.app — native, minimal, monochrome.
//
// One clear nav and nothing else: a few real marketing routes plus the Community
// showcase (/community). The LOGO (top-left) is the cross-app switcher trigger
// (AppSwitcher) — the ONE way to reach the Hanzo app grid; there is no separate
// 9-dot button. A "Search ⌘K" pill (HeaderSearch) opens the existing command
// palette (⌘K / `/`). Auth lives at the right: Sign In / Get started when signed
// out, the account menu when signed in — all on the ONE IAM PKCE flow via
// useUser (the single auth facade). Matches hanzo.ai's true-black / Geist register.

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, Settings, Home, DollarSign, ChevronDown } from "lucide-react";
import { Button, Avatar, AvatarFallback, AvatarImage } from "@hanzo/ui-shadcn";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/overlay";
import { AppSwitcher } from "@/components/layout/app-switcher";
import { HeaderSearch } from "@/components/layout/header-search";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

// The marketing nav — real routes only (no /product 404, no per-app grid).
const NAV = [
  { label: "Templates", href: "/templates" },
  { label: "Pricing", href: "/pricing" },
  { label: "Enterprise", href: "/enterprise" },
  { label: "Community", href: "/community" },
];

export default function Header() {
  const { user, isAuthenticated, login, logout } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // "Get started" = the SIGNUP funnel (IAM registration hint → builder, where
  // OrgGate onboards the new org). "Sign In" is plain login() for returning
  // users. Both ride the one canonical IAM PKCE flow.
  const getStarted = () => login("/dev", { signup: true });

  // Identity is resolved ONCE, in useUser — never re-derived per surface.
  const displayName = user?.name || "User";
  const userInitial = user?.initials || "U";

  const isActive = (href: string) =>
    pathname === href || (pathname?.startsWith(href + "/") ?? false);

  const accountMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 text-foreground/80 hover:text-foreground">
          <Avatar className="h-7 w-7">
            <AvatarImage src={user?.avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-foreground/10 text-xs text-foreground">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[150px] truncate">{displayName}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || user?.username}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard")}>
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/billing")}>
          <DollarSign className="mr-2 h-4 w-4" />
          Billing
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()} className="text-foreground/70">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const signedOutCTAs = (
    <>
      <Button
        onClick={() => login()}
        variant="ghost"
        className="text-sm font-medium text-foreground/70 hover:text-foreground"
      >
        Sign In
      </Button>
      <Button
        onClick={getStarted}
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Get started
      </Button>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        {/* Brand mark = the cross-app switcher trigger (the ONE way in) */}
        <AppSwitcher currentApp="app" />

        {/* One nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm transition-colors",
                isActive(link.href)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Search — opens the command palette (⌘K / `/`). Always visible. */}
        <HeaderSearch />

        {/* Auth (desktop) */}
        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated && user ? accountMenu : signedOutCTAs}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-card md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-3 md:hidden">
          <nav className="flex flex-col" aria-label="Primary">
            {NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive(link.href)
                    ? "bg-card text-foreground"
                    : "text-foreground/90 hover:bg-card"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            {isAuthenticated && user ? (
              accountMenu
            ) : (
              <>
                <Button
                  onClick={() => login()}
                  variant="ghost"
                  className="justify-start text-sm font-medium text-foreground/80 hover:text-foreground"
                >
                  Sign In
                </Button>
                <Button
                  onClick={getStarted}
                  className="rounded-xl bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
