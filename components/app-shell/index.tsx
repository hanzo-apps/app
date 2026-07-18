'use client';

/**
 * AppShell — the ONE chrome for authenticated top-level content pages
 * (dashboard, settings, templates, games, skills, gallery, …).
 *
 * It mounts the SAME left `Sidebar` the builder/admin uses — so the org/project
 * `OrgSwitcher` sits at the top-left and the identity/credit cluster at the
 * bottom-left, exactly like console.hanzo.ai's `DashboardShell` — but WITHOUT the
 * builder's VFS/sync/server-init baggage (that lives in `PageLayout`, coupled to
 * the workspace). Content is a scrollable flex child so each page owns its own
 * scroll region beside the in-flow sidebar.
 *
 * Responsive: at ≥md the sidebar is a static in-flow column (collapsible via the
 * toggle at its top). Below md it is an off-canvas drawer opened by the mobile
 * top-bar hamburger here — without which a phone would have NO way to reach the
 * nav. The Sidebar's own nav items self-route (absolute canonical routes);
 * selecting a recent project opens it in the builder.
 */
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';

import { Sidebar } from '@/components/sidebar';
import { HanzoLogo } from '@/components/HanzoLogo';
import type { Project } from '@/lib/vfs/types';

interface AppShellProps {
  children: React.ReactNode;
  /** Which sidebar item is active (highlights it). Defaults to 'templates'. */
  currentView?: string;
}

export function AppShell({ children, currentView = 'templates' }: AppShellProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative flex h-screen overflow-hidden bg-black text-white">
      <Sidebar
        currentView={currentView}
        onNavigate={() => {}}
        onProjectSelect={(project: Project) =>
          router.push(`/dev?project=${encodeURIComponent(project.id || project.name)}`)
        }
        onLogoClick={() => router.push('/')}
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
        </div>

        {children}
      </div>
    </div>
  );
}

export default AppShell;
