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
import { SizableText, YStack, Paragraph } from "@hanzo/ui";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
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
import { PrimaryButton, useCommandK } from "@hanzo/ui/product";
import { CommandPalette } from "@/components/command-palette";
import { useUser } from "@/hooks/useUser";

export default function Header() {
  const { user, isAuthenticated, login, logout } = useUser();
  const router = useRouter();

  const getStarted = () => login("/dev", { signup: true });

  // The palette mounts only while open, so a visitor who never searches never
  // pays for its project fetch. ⌘K and `/` reach it without the control.
  const [paletteOpen, setPaletteOpen] = useState(false);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  useCommandK(useCallback(() => setPaletteOpen((o) => !o), []));

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

  // One way in: signing in and signing up are the same door, `login()`.
  //
  // `PrimaryButton` is the recipe for the one white, high-emphasis action, the
  // same pill hanzo.ai and cloud.hanzo.ai put in this slot. It flips the control
  // to `theme="light"` so fill and label move together; naming a colour here
  // instead breaks the rule that a Button carries a variant or a recipe, and
  // re-spelling a foreground on a filled label is how a label goes invisible.
  //
  // It does NOT currently match the shell's own CTA in that row — measured at
  // 1440, every other header item is 34px tall on the row's baseline and this
  // one is 44, with a different radius, weight and fill. The answer is not a
  // local restyle: the shell exports `cta()` for exactly this slot, and the
  // canonical header that owns all of it is being built there. This waits for
  // that version rather than growing a fifth spelling of one pill.
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
  // Three rows, not five: pricing is a row in the Meet Hanzo menu and a section
  // of /features, and Help is a support link rather than a peer of what the
  // product does. Resources holds the other six pages under one word and keeps
  // `href="/templates"`, so the row is a real link before hydration. Every row
  // names its mark from the shell's own `GlyphName`, so a row draws the same
  // shape here, in the launcher and in the ⌘K palette.
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
    // "Business", not "Enterprise", on the same page: the word names WHO it is
    // for rather than a procurement tier, which is what a reader is actually
    // deciding when they look at this row.
    { id: "business", label: "Business", href: "/enterprise" },
    // Pricing is a row again, and it is THIS site's pricing. It had been folded
    // into the Meet Hanzo menu and into a section of /features on the reasoning
    // that a peer of "what the product does" it is not — but it is the second
    // question every visitor has, and hanzo.app publishes its own page for it
    // (the builder's plans, not the cloud's).
    { id: "pricing", label: "Pricing", href: "/pricing" },
  ];

  // No primary action here: the create action lives in the page and in the
  // account menu, so the header carries none (shell >= 8.1.17). The registry's
  // own primaryCTA describes hanzo.app from the outside and points at this
  // site's root, which is a self-link on this surface.

  return (
    <>
      <HanzoHeader
        surface={{ ...surface, localNav: nav, primaryCTA: undefined }}
        currentHref="https://hanzo.app"
        // The bar's own search control, opening THIS app's palette: it holds
        // what a shared header cannot know — the visitor's projects and every
        // operation the cloud answers.
        onSearch={openPalette}
        identitySlot={isAuthenticated && user ? accountMenu : signedOutCTAs}
      />
      {paletteOpen ? (
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      ) : null}
    </>
  );
}
