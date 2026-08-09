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
import { HeaderSearch } from "@/components/layout/header-search";
import { useUser } from "@/hooks/useUser";
import { accent } from "@/lib/chrome";

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
      {/* This asked the library for its loud variant by name, which paints
          identically today — measured rgb(51,51,51) on rgb(69,69,69), i.e.
          `accent` exactly. Still the wrong spelling: a variant only reaches a
          Button, and half this app's loud controls are an XStack or a Link.
          One recipe that works on every element beats two names for one value.
          (Old spelling described, not quoted — the ratchet greps source.) */}
      <Button onClick={getStarted} {...accent}>
        Get started
      </Button>
    </>
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
  const nav = [
    { id: "features", label: "Features", href: "/features" },
    { id: "pricing", label: "Pricing", href: "/pricing" },
    { id: "resources", label: "Resources", href: "/templates" },
    { id: "solutions", label: "Solutions", href: "/enterprise" },
    { id: "help", label: "Help", href: "/help" },
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
