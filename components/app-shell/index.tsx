'use client';

/**
 * AppShell — the ONE chrome for authenticated top-level content pages
 * (dashboard, resources, connectors, settings, skills, gallery, …).
 *
 * It mounts the SAME left `Sidebar` the builder/admin uses — so the org/project
 * `OrgSwitcher` sits at the top-left and the identity/credit cluster at the
 * bottom-left, exactly like console.hanzo.ai's `DashboardShell` — but WITHOUT the
 * builder's VFS/sync/server-init baggage (that lives in `PageLayout`, coupled to
 * the workspace). Content is a scrollable flex child so each page owns its own
 * scroll region beside the in-flow sidebar.
 *
 * There is no mode bar. hanzo.app IS the dev surface — the app builder and the
 * work around it — and hanzo.chat is the chat surface, until the two converge on
 * one thing. A three-way switcher across surfaces that do not yet behave alike
 * advertises a choice the product has not made.
 *
 * The shell also owns the ⌘K command palette: a global keydown opens it, the
 * sidebar's "Search" item opens it (`onOpenSearch`), and it renders here so it is
 * reachable from every content page.
 *
 * Responsive: at ≥md the sidebar is a static in-flow column (collapsible via the
 * toggle at its top). Below md it is an off-canvas drawer opened by the mobile
 * top-bar hamburger here — without which a phone would have NO way to reach the
 * nav. The Sidebar's own nav items self-route (absolute canonical routes);
 * selecting a recent project opens it in the builder.
 */
import { Button } from '@hanzo/ui';
import { YStack, XStack } from '@hanzo/gui';
import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search } from 'lucide-react';

import { Sidebar } from '@/components/sidebar';
import { OrgProvider } from '@/lib/org/client';
import { HanzoLogo } from '@/components/HanzoLogo';
import { CommandPalette } from '@/components/command-palette';
import { useCommandK } from '@/hooks/useCommandK';
import type { Project } from '@/lib/vfs/types';
import { builderLink } from '@/lib/api/projects';

interface AppShellProps {
  children: React.ReactNode;
  /** Which sidebar item is active (highlights it). Defaults to 'templates'. */
  currentView?: string;
}

export function AppShell({ children, currentView = 'templates' }: AppShellProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // ⌘K / `/` opens the command palette — the ONE shared keybinding.
  useCommandK(useCallback(() => setPaletteOpen((o) => !o), []));

  return (
    // ONE org scope for the whole shell — the Sidebar's org switcher AND every
    // page rendered as {children} (Connectors, Settings, …) read the SAME context,
    // so a page that calls useOrg never crashes for lack of a provider ancestor.
    <OrgProvider>
    {/* The shell owns the viewport, so it MEASURES the viewport. `height="100%"`
        looked equivalent and was not: a percentage resolves against the parent's
        computed height, every ancestor up to <body> is `height: auto` (globals.css
        gives body a min-height only), so it fell back to auto. The shell then sized
        to its content — 275px — and the sidebar's `flex={1}` nav, which has
        `min-height: 0` so it can scroll, collapsed to a 24px slot that showed the
        top half of "Dashboard" and hid every item below it. */}
    <XStack position="relative" height="100dvh" overflow="hidden" backgroundColor="$background">
      <Sidebar
        currentView={currentView}
        onNavigate={() => {}}
        onProjectSelect={(project: Project) =>
          router.push(builderLink(project.id || project.name))
        }
        onLogoClick={() => router.push('/')}
        onOpenSearch={() => setPaletteOpen(true)}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
  />

      <YStack minWidth={0} flex={1} overflow="hidden">
        {/* Mobile top bar — the ONLY way to reach the nav below md (the sidebar is
            an off-canvas drawer there). Hidden at md+, where the sidebar is
            always visible in-flow. */}
        <XStack height="$8" alignItems="center" gap="$2" borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" $md={{ display: "none" }}>
          <Button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            variant="ghost"
            height={36} width={36} alignItems="center" justifyContent="center" borderRadius="$3"
          >
            <Menu size={20} />
          </Button>
          <HanzoLogo size={20} color="var(--foreground)" />
          <Button
            onClick={() => setPaletteOpen(true)}
            aria-label="Search"
            variant="ghost"
            marginLeft="auto" height={36} width={36} alignItems="center" justifyContent="center" borderRadius="$3"
          >
            <Search size={20} />
          </Button>
        </XStack>

        {children}
      </YStack>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </XStack>
    </OrgProvider>
  );
}

export default AppShell;
