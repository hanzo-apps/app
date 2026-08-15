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
  //
  // The middle one is RESOURCES, which is what its id has said since the day it
  // was written — the label had drifted to "Templates", one of the things a
  // resource IS. So the bar named a page and hid the other six: /games,
  // /community, /docs, /learn and /help were reachable from this header only by
  // opening the ecosystem menu, which answers "what is Hanzo", not "where do I
  // start". The entry keeps `href="/templates"` (the catalog is still the page
  // behind the word, and the row is a real link before hydration) and now HOLDS
  // the rest, which is exactly what `HanzoNav.items` is for — data, not a fork.
  //
  // Every row names its mark. A menu of six words in one weight is read; a menu
  // of six marks is scanned, and scanning is what a header is for. The names are
  // the shell's own (`GlyphName`), so a row draws the same shape here as it does
  // in the launcher and in both drapes — `spark` is what /resources already
  // wears in the sidebar rail and in the ⌘K palette.
  const nav = [
    { id: "features", label: "Features", href: "/features" },
    {
      id: "resources",
      label: "Resources",
      href: "/templates",
      glyph: "spark" as const,
      items: [
        { id: "templates", label: "Templates", href: "/templates", glyph: "template" as const, hint: "Start from a working app" },
        // The catalog directly, not `/games`: that route is a redirect to this
        // very URL, and a menu should name the page it opens.
        { id: "games", label: "Games", href: "/templates?category=Games", glyph: "gamepad" as const, hint: "Open-source games to fork" },
        { id: "community", label: "Community", href: "/community", glyph: "users" as const, hint: "What people shipped on Hanzo" },
        { id: "docs", label: "Documentation", href: "/docs", glyph: "book" as const, hint: "Guides and the API reference" },
        { id: "learn", label: "Learn", href: "/learn", glyph: "cap" as const, hint: "Build your first app, step by step" },
        { id: "help", label: "Help", href: "/help", glyph: "ring" as const, hint: "Answers, and how to reach us" },
      ],
    },
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
      // This app brought its own palette (HeaderSearch → components/command-palette),
      // and it holds what the shared one cannot know: the visitor's projects and
      // every operation the cloud answers. Two ⌕⌘K controls in one bar, both on
      // the same key, is a choice a reader cannot make.
      search={false}
      identitySlot={
        <XStack alignItems="center" gap="$2">
          <HeaderSearch />
          {isAuthenticated && user ? accountMenu : signedOutCTAs}
        </XStack>
      }
    />
  );
}
