"use client";

import { SizableText, YStack, Paragraph, XStack } from '@hanzo/gui';
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
import { Button, Avatar, AvatarFallback, AvatarImage, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@hanzo/ui';
import { AppSwitcher } from "@/components/layout/app-switcher";
import { HeaderSearch } from "@/components/layout/header-search";
import { useUser } from "@/hooks/useUser";
// The marketing nav — real routes only (no /product 404, no per-app grid).
const NAV = [
  { label: "Community", href: "/community" },
  { label: "Features", href: "/features" },
  { label: "Templates", href: "/templates" },
  { label: "Pricing", href: "/pricing" },
  { label: "Enterprise", href: "/enterprise" },
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
        <Button variant="ghost" gap="$2" color="$color" hoverStyle={{ color: "$color" }}>
          <Avatar height={28} width={28}>
            <AvatarImage src={user?.avatarUrl} alt={displayName} />
            <AvatarFallback backgroundColor="$color" fontSize="$1" color="$color">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <SizableText maxWidth={150} numberOfLines={1}>{displayName}</SizableText>
          <ChevronDown size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" width={224}>
        <DropdownMenuLabel>
          <YStack rowGap="$1">
            <Paragraph fontSize="$3" fontWeight="500" lineHeight={1}>{displayName}</Paragraph>
            <Paragraph fontSize="$1" lineHeight={1} color="$color11">
              {user?.email || user?.username}
            </Paragraph>
          </YStack>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard")}>
          <Home size={16} />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings size={16} />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/billing")}>
          <DollarSign size={16} />
          Billing
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()} color="$color">
          <LogOut size={16} />
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
        fontSize="$3" fontWeight="500" color="$color" hoverStyle={{ color: "$color" }}
      >
        Sign In
      </Button>
      <Button
        onClick={getStarted}
        borderRadius="$6" backgroundColor="$color12" paddingHorizontal="$4.5" paddingVertical="$2.5" fontSize="$3" fontWeight="500" color="$background" hoverStyle={{ backgroundColor: "$color12" }}
      >
        Get started
      </Button>
    </>
  );

  return (
    <YStack position="sticky" top="$0" zIndex={50} borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$background" backdropFilter="blur(12px)">
      <XStack alignSelf="center" height="$10" maxWidth={1280} alignItems="center" gap="$3" paddingHorizontal="$4" $sm={{ gap: "$4", paddingHorizontal: "$5" }}>
        {/* Brand mark = the cross-app switcher trigger (the ONE way in) */}
        <AppSwitcher currentApp="app" />

        {/* One nav */}
        <YStack display="none" alignItems="center" gap="$1" aria-label="Primary">
          {NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
            ><SizableText borderRadius="$5" paddingHorizontal="$3" paddingVertical="$2" fontSize="$3">
              {link.label}
            </SizableText></Link>
          ))}
        </YStack>

        <YStack flex={1} />

        {/* Search — opens the command palette (⌘K / `/`). Always visible. */}
        <HeaderSearch />

        {/* Auth (desktop) */}
        <YStack display="none" alignItems="center" gap="$2">
          {isAuthenticated && user ? accountMenu : signedOutCTAs}
        </YStack>

        {/* Mobile toggle */}
        <Button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          height="$7" width="$7" alignItems="center" justifyContent="center" borderRadius="$5" color="$color" hoverStyle={{ backgroundColor: "$background" }} $md={{ display: "none" }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </XStack>

      {/* Mobile sheet */}
      {mobileOpen && (
        <YStack borderTopWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$4" paddingVertical="$3" $md={{ display: "none" }}>
          <YStack aria-label="Primary">
            {NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
              ><SizableText borderRadius="$5" paddingHorizontal="$3" paddingVertical="$2.5" fontSize="$3">
                {link.label}
              </SizableText></Link>
            ))}
          </YStack>
          <YStack marginTop="$3" gap="$2" borderTopWidth={1} borderColor="$borderColor" paddingTop="$3">
            {isAuthenticated && user ? (
              accountMenu
            ) : (
              <>
                <Button
                  onClick={() => login()}
                  variant="ghost"
                  justifyContent="flex-start" fontSize="$3" fontWeight="500" color="$color" hoverStyle={{ color: "$color" }}
                >
                  Sign In
                </Button>
                <Button
                  onClick={getStarted}
                  borderRadius="$6" backgroundColor="$color12" fontSize="$3" fontWeight="500" color="$background" hoverStyle={{ backgroundColor: "$color12" }}
                >
                  Get started
                </Button>
              </>
            )}
          </YStack>
        </YStack>
      )}
    </YStack>
  );
}
