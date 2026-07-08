'use client';

/**
 * AppShell — the ONE chrome for authenticated top-level content pages
 * (gallery, and any other non-builder page that should sit in the app frame).
 *
 * It mounts the SAME left `Sidebar` the builder/admin uses — so the org/project
 * `OrgSwitcher` sits at the top-left exactly like console.hanzo.ai — but WITHOUT
 * the builder's VFS/sync/server-init baggage (that lives in `PageLayout`, which
 * is coupled to the workspace). Content is a scrollable flex child so each page
 * owns its own scroll region beneath a fixed sidebar.
 *
 * Nav routing is the Sidebar's own (its `path` items self-route via the router);
 * `onNavigate` is only used for the browser-mode doc/settings special cases, so a
 * no-op is correct here. Selecting a recent project opens it in the builder.
 */
import React from 'react';
import { useRouter } from 'next/navigation';

import { Sidebar } from '@/components/sidebar';
import type { Project } from '@/lib/vfs/types';

interface AppShellProps {
  children: React.ReactNode;
  /** Which sidebar item is active (highlights it). Defaults to 'templates'. */
  currentView?: string;
}

export function AppShell({ children, currentView = 'templates' }: AppShellProps) {
  const router = useRouter();

  return (
    <div className="relative flex h-screen overflow-hidden bg-black text-white">
      <Sidebar
        currentView={currentView}
        onNavigate={() => {}}
        onProjectSelect={(project: Project) =>
          router.push(`/dev?project=${encodeURIComponent(project.id || project.name)}`)
        }
        onLogoClick={() => router.push('/')}
      />

      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
}

export default AppShell;
