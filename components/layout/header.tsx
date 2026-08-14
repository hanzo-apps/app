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
// the new org). There is no separate "Sign In": it called the same login()
// and offered a choice that does not exist.

import { HanzoHeader, resolveSurface } from "@hanzogui/shell";
import { SizableText, YStack, Paragraph, XStack } from "@hanzo/ui";
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
import { PrimaryButton } from "@hanzo/ui/product";
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
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // ONE way in.
  //
  // There were two — a ghost "Sign In" beside "Get started" — and they are the
  // same door: both call `login()`, so the header offered a choice that does
  // not exist and spent its most valuable inches doing it. The pair also read
  // as equals, which is the opposite of what a header should say: one action,
  // one weight.
  //
  // It is WHITE, and `PrimaryButton` is what makes it white.
  //
  // `accent` is `$color5` — a raised neutral, right for a secondary action and
  // too quiet for the one thing we want a visitor to do. hanzo.ai and
  // cloud.hanzo.ai both put a white pill in this slot; this header was the odd
  // one out. Spelling white here instead would break two rules the tests hold: a
  // Button in this shell carries a variant or a recipe (ui-centralization), and
  // re-spelling a foreground on a filled label is exactly how login-modal reached
  // 1.07:1 and went invisible (signed-out-emphasis).
  //
  // `PrimaryButton` is that recipe, already published, and already described as
  // "the one white, high-emphasis action … sign in, save, get started": it flips
  // the control to `theme="light"`, so the fill and its label move TOGETHER —
  // white ground, near-black label — with no colour named at this call site.
  const signedOutCTAs = (
    <PrimaryButton onClick={getStarted}>Get started</PrimaryButton>
  );

  // The registry surface with THIS surface's nav as DATA (never a fork). The
  // registry's own localNav is written for hanzo.ai's cloud framing — Product /
  // Templates / Pricing / Enterprise, on absolute hanzo.app URLs. Here the five
  // rows are the questions a builder actually arrives with, in the order they
  // ask them, on local routes so navigation stays client-side.
  //
  // No `productsTaxonomy`: the ten-category cloud mega-menu belongs to the cloud
  // surfaces. This one gets the flat nav plus the universal Meet Hanzo menu.
  const surface = resolveSurface("hanzo.app");
  // THREE, not five. Pricing and Help are gone from the bar: pricing is a row in
  // the Meet Hanzo menu and a section of /features, and Help is a support link,
  // not a peer of what the product does. Five flat words spent the bar's width on
  // the two nobody arrives for.
  const nav = [
    { id: "features", label: "Features", href: "/features" },
    { id: "resources", label: "Templates", href: "/templates" },
    { id: "solutions", label: "Enterprise", href: "/enterprise" },
  ];

  // `primaryCTA` is overridden for the same reason `localNav` is: the shared
  // registry describes hanzo.app from the OUTSIDE, so its "+ New project" points
  // at `U.app` — this site's own root. On every other surface that is a link to
  // the builder; here it is a self-link, and the most action-oriented control on
  // the page reloads the marketing page instead of starting anything. Verified
  // on production HTML: href="https://hanzo.app".
  //
  // `/new` rather than `/dev`: it matches the label, and it is the route that
  // mounts OrgGate, so a first-time visitor with no organization is onboarded
  // instead of meeting that requirement later at deploy.
  const primaryCTA = { id: "newproject", label: "+ New project", href: "/new" };
  // …and then HIDDEN in assets/globals.css (`[data-hanzo-shell] a[href="/new"]`):
  // the owner removed the "+ New project" button from the menu header. This object
  // stays only because HanzoHeader REQUIRES a primaryCTA and its CTA reads
  // `link.href` unguarded, so it cannot be dropped from here; /new keeps it a
  // valid, harmless target while the CSS takes it off the page.

  return (
    <HanzoHeader
      surface={{ ...surface, localNav: nav, primaryCTA }}
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
