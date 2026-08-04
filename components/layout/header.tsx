"use client";

// The UNIFIED Hanzo marketing header — the SHARED shell component
// (@hanzogui/shell `HanzoHeader`), the same chrome hanzo.ai runs: sticky glass
// (backdrop blur), "Meet Hanzo" + the ten-category Products mega-menu, and the
// per-surface nav/CTAs from the ONE canonical registry (`surface="hanzo.app"`
// IS the customization — data, not a fork). This module stays the app's stable
// header entry point (mirror of components/landing/site-footer.tsx) so call
// sites are untouched. The hand-rolled nav + AppSwitcher popover this replaces
// were the last per-app copies of cross-app chrome.
//
// Auth is the only app-owned piece: the signed-in account menu / sign-in CTAs
// ride `identitySlot`, on the ONE IAM PKCE flow via useUser. "Get started" is
// the SIGNUP funnel (IAM registration hint → builder, where OrgGate onboards
// the new org); "Sign In" is plain login() for returning users.

import { HanzoHeader, HANZO_PRODUCT_CATEGORIES } from "@hanzogui/shell";
import { SizableText, YStack, Paragraph, XStack } from "@hanzo/gui";
import { useRouter } from "next/navigation";
import { Home, Settings, DollarSign, LogOut } from "lucide-react";
import {
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hanzo/ui";
import { HeaderSearch } from "@/components/layout/header-search";
import { useUser } from "@/hooks/useUser";

export default function Header() {
  const { user, isAuthenticated, login, logout } = useUser();
  const router = useRouter();

  const getStarted = () => login("/dev", { signup: true });

  // Identity is resolved ONCE, in useUser — never re-derived per surface.
  const displayName = user?.name || "User";
  const userInitial = user?.initials || "U";

  const accountMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" gap="$2">
          <Avatar height={28} width={28}>
            <AvatarImage src={user?.avatarUrl} alt={displayName} />
            <AvatarFallback backgroundColor="$color4">{userInitial}</AvatarFallback>
          </Avatar>
          <SizableText maxWidth={150} numberOfLines={1}>{displayName}</SizableText>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent minWidth={224}>
        <DropdownMenuLabel>
          <YStack rowGap="$1">
            <Paragraph fontSize="$3" fontWeight="500" lineHeight="1">{displayName}</Paragraph>
            <Paragraph fontSize="$1" lineHeight="1" color="$color11">
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
        <DropdownMenuItem onClick={() => logout()}>
          <LogOut size={16} />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const signedOutCTAs = (
    <>
      <Button onClick={() => login()} variant="ghost">
        Sign In
      </Button>
      <Button onClick={getStarted} variant="primary">
        Get started
      </Button>
    </>
  );

  return (
    <HanzoHeader
      surface="hanzo.app"
      productsTaxonomy={HANZO_PRODUCT_CATEGORIES}
      currentHref="https://hanzo.app"
      identitySlot={
        <XStack alignItems="center" gap="$2">
          <HeaderSearch />
          {isAuthenticated && user ? accountMenu : signedOutCTAs}
        </XStack>
      }
    />
  );
}
