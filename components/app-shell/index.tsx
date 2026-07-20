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
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search } from 'lucide-react';

import { Sidebar } from '@/components/sidebar';
import { OrgProvider } from '@/lib/org/client';
import { HanzoLogo } from '@/components/HanzoLogo';
import { CommandPalette } from '@/components/command-palette';
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

  // Global ⌘K / Ctrl+K opens the command palette (toggles).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    // ONE org scope for the whole shell — the Sidebar's org switcher AND every
    // page rendered as {children} (Connectors, Settings, …) read the SAME context,
    // so a page that calls useOrg never crashes for lack of a provider ancestor.
    <OrgProvider>
    <div className="relative flex h-screen overflow-hidden bg-black text-white">
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

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar — the ONLY way to reach the nav below md (the sidebar is
            an off-canvas drawer there). Hidden at md+, where the sidebar is
            always visible in-flow. */}
        <div className="flex h-12 items-center gap-2 border-b border-white/10 bg-black px-3 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
          <HanzoLogo className="h-5 w-5 text-white" />
          <span className="text-sm font-medium">Hanzo App</span>
          <button
            onClick={() => setPaletteOpen(true)}
            aria-label="Search"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        {children}
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
    </OrgProvider>
  );
}

export default AppShell;
