"use client";

// The UNIFIED Hanzo marketing header — the SHARED shell component
// (@hanzogui/shell `HanzoHeader`), the same chrome every Hanzo property runs:
// sticky glass, the "Hanzo ⌄" menu, the ten-category taxonomy, and the
// per-surface nav/CTAs from the ONE canonical registry. `surface="app"` IS the
// customization — data, not a fork. This module stays the app's stable header
// entry point (mirror of components/landing/site-footer.tsx) so call sites are
// untouched.
//
// The app owns NO chrome here any more. It contributes four things and they are
// all data: which surface this is, the local nav, the palette this site opens,
// and who is signed in.

import { HanzoHeader, resolveSurface, HANZO_PRODUCT_CATEGORIES } from "@hanzogui/shell";
import { useCallback, useMemo, useState } from "react";
import { useCommandK } from "@hanzo/ui/product";
import { CommandPalette } from "@/components/command-palette";
import { useUser } from "@/hooks/useUser";

export default function Header() {
  const { user, isAuthenticated, login, logout } = useUser();

  // The palette mounts only while open, so a visitor who never searches never
  // pays for its project fetch. ⌘K and `/` reach it without the control.
  const [paletteOpen, setPaletteOpen] = useState(false);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  useCommandK(useCallback(() => setPaletteOpen((o) => !o), []));

  // Identity is DATA and two callbacks — never a session. The shell renders one
  // hanzo.id action when signed out and the account menu when signed in, so
  // this surface cannot drift into its own spelling of either, and there is no
  // password field or provider button anywhere near it: IAM owns the whole flow
  // and `onSignIn` only starts it.
  //
  // "Get started" is the SIGNUP funnel (IAM registration hint → the builder,
  // where OrgGate onboards the new org). There is no separate "Sign in": it
  // called the same login() and offered a choice that does not exist.
  const auth = useMemo(
    () => ({
      user:
        isAuthenticated && user
          ? { name: user.name, email: user.email, avatar: user.avatarUrl }
          : null,
      onSignIn: () => login("/dev", { signup: true }),
      onSignOut: () => void logout(),
      label: "Get started",
      items: [
        { id: "dashboard", label: "Dashboard", href: "/dashboard", external: false },
        { id: "settings", label: "Settings", href: "/settings", external: false },
        { id: "billing", label: "Billing", href: "/billing", external: false },
      ],
    }),
    [isAuthenticated, user, login, logout],
  );

  // The registry surface with THIS surface's nav as DATA (never a fork). The
  // registry's own localNav is written for hanzo.ai's cloud framing, on absolute
  // hanzo.app URLs; here the rows are the questions a builder actually arrives
  // with, in the order they ask them, on local routes so navigation stays
  // client-side. Every row names its mark from the shell's own `GlyphName`, so a
  // row draws the same shape here, in the launcher and in the ⌘K palette.
  const surface = resolveSurface("app");
  const nav = useMemo(
    () => [
      // The landing page IS what this row means, so it points at the root rather
      // than a second page repeating it. Opening hanzo.app already shows it.
      { id: "about", label: "About", href: "/" },
      { id: "features", label: "Features", href: "/features" },
      // Learn carries what Resources used to hold, so a reader who hovers still
      // finds every one of these pages and the top row stays four words. It keeps
      // `href="/learn"`, so the row is a real link before hydration.
      {
        id: "learn",
        label: "Learn",
        href: "/learn",
        glyph: "cap" as const,
        items: [
          { id: "learn-start", label: "Learn", href: "/learn", glyph: "cap" as const, hint: "Build your first app, step by step" },
          { id: "templates", label: "Templates", href: "/templates", glyph: "template" as const, hint: "Start from a working app" },
          // The catalog directly, not `/games`: that route is a redirect to this
          // very URL, and a menu should name the page it opens.
          { id: "games", label: "Games", href: "/templates?category=Games", glyph: "gamepad" as const, hint: "Open-source games to fork" },
          { id: "community", label: "Community", href: "/community", glyph: "users" as const, hint: "What people shipped on Hanzo" },
          { id: "docs", label: "Documentation", href: "/docs", glyph: "book" as const, hint: "Guides and the API reference" },
          { id: "help", label: "Help", href: "/help", glyph: "ring" as const, hint: "Answers, and how to reach us" },
        ],
      },
      // This site's own pricing (the builder's plans, not the cloud's) — the
      // second question every visitor has.
      { id: "pricing", label: "Pricing", href: "/pricing" },
    ],
    [],
  );

  return (
    <>
      <HanzoHeader
        // The registry's own primary action is back, because the shell can now
        // say the thing that had kept it off: from 8.1.22 any control naming the
        // CURRENT place — either CTA, a nav row, a mobile sheet row, and the
        // brand mark — renders `aria-current="page"` with NO href, keeping its
        // exact appearance. So `+ New project` is a real pill again and is not a
        // link to the page you are already on.
        //
        // That mattered more than the pill. The brand mark was the same bare
        // self-link on this surface, so fixing only the CTA would have left one
        // behind — and a self-link is worst BEFORE hydration, which is exactly
        // when a static export is read.
        // "Hanzo AI" is the company, and that is what the mark should say on
        // every surface. "Hanzo App" named the property instead, which reads as a
        // different product from the one the Platform menu beside it lists.
        surface={{ ...surface, brandName: "Hanzo AI", localNav: nav }}
        // The ten categories, called what a builder is looking for when they
        // open them. A LABEL, not a second menu — one taxonomy, one component.
        // There is no /platform page to link, and there should not be: the
        // taxonomy IS that page, and a row that only opens a menu is the menu.
        productsTaxonomy={HANZO_PRODUCT_CATEGORIES}
        productsLabel="Platform"
        // ONE destination, not a menu. A visitor here has already chosen the
        // builder, and the other products are a hover away in Platform — so the
        // pill's job is to start a project, and a second list of doors beside
        // that list is the same choice asked twice.
        auth={auth}
        // The ROUTE, not the absolute URL. This is what the shell matches an
        // entry against to decide it names the current place.
        currentHref="/"
        // The bar's own search control, opening THIS app's palette: it holds
        // what a shared header cannot know — the visitor's projects and every
        // operation the cloud answers.
        onSearch={openPalette}
      />
      {paletteOpen ? (
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      ) : null}
    </>
  );
}
