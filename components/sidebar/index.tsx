'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Project } from '@/lib/vfs/types';
import { vfs } from '@/lib/vfs';
import { getSyncOverviewStatus, SyncOverviewStatus } from '@/lib/vfs/auto-sync';
import { Button } from '@/components/ui/button';
import { HanzoLogo } from '@/components/HanzoLogo';
import {
  FolderOpen,
  Globe,
  LayoutTemplate,
  Gamepad2,
  Sparkles,
  Settings,
  Info,
  Github,
  ChevronDown,
  BookOpen,
  Cloud,
  LogOut,
  LayoutDashboard,
  PanelLeft,
  X,
} from 'lucide-react';
import { DiscordIcon } from '@/components/ui/discord-icon';
import { cn } from '@/lib/utils';
import { OrgProvider } from '@/lib/org/client';
import { OrgSwitcher } from '@/components/org-switcher';
import { SidebarWallet } from '@/components/SidebarWallet';
import { useRouter } from 'next/navigation';
import pkg from '@/package.json';

// Collapsed sidebar width (icon-only rail). Kept exported for callers that lay
// out around the sidebar; the width itself is applied via a Tailwind class now.
export const COLLAPSED_SIDEBAR_WIDTH = 56;

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  /** Canonical ABSOLUTE internal route (e.g. `/skills`). One way: every nav item
   *  resolves to a real top-level page — no mode branching, no dead-ends. */
  route?: string;
  action?: string;
  href?: string; // external link (opens in a new tab)
  serverModeOnly?: boolean;
  hasRecentProjects?: boolean; // Projects shows recent projects as sub-items
}

// Canonical top-level routes — each maps to a real `app/<route>/page.tsx`.
const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' },
  { id: 'projects', label: 'Projects', icon: FolderOpen, route: '/projects', hasRecentProjects: true },
  { id: 'deployments', label: 'Deployments', icon: Globe, route: '/admin/deployments', serverModeOnly: true },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate, route: '/templates' },
  { id: 'games', label: 'Games', icon: Gamepad2, route: '/games' },
  { id: 'skills', label: 'Skills', icon: Sparkles, route: '/skills' },
  { id: 'docs', label: 'Docs', icon: BookOpen, route: '/docs' },
  { id: 'settings', label: 'Settings', icon: Settings, route: '/settings' },
  { id: 'tour', label: 'Guided Tour', icon: Info, action: 'start-tour' },
  { id: 'about', label: 'About', icon: Info, action: 'open-about' },
  { id: 'discord', label: 'Discord', icon: DiscordIcon, href: 'https://discord.gg/mAJ8Ss4u' },
  { id: 'github', label: 'GitHub', icon: Github, href: 'https://github.com/hanzoai/app' },
];

const SYSTEM_ACTIONS: SidebarItem[] = [
  { id: 'sync', label: 'Server Sync', icon: Cloud, action: 'server-sync' },
  { id: 'logout', label: 'Logout', icon: LogOut, action: 'logout' },
];

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onProjectSelect: (project: Project) => void;
  onStartTour?: () => void;
  onOpenAbout?: () => void;
  onOpenSettings?: () => void;
  onServerSync?: () => void;
  onLogoClick?: () => void;
  /** @deprecated pin/hover model retired for a top collapse toggle (console pattern). */
  onPinnedChange?: (pinned: boolean) => void;
  /** @deprecated pin/hover model retired for a top collapse toggle (console pattern). */
  onHoverChange?: (hovering: boolean) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

const COLLAPSE_STORAGE_KEY = 'hanzo-app-sidebar-collapsed';

function SidebarContent({
  currentView,
  onNavigate: _onNavigate,
  onProjectSelect,
  onStartTour,
  onOpenAbout,
  onServerSync,
  onLogoClick,
  onCollapsedChange,
  mobileOpen = false,
  onMobileOpenChange,
}: SidebarProps) {
  const router = useRouter();
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loadingRecentProjects, setLoadingRecentProjects] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncOverviewStatus | null>(null);

  // Expanded set — only Projects (recent projects) can expand now.
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (currentView === 'projects') initial.add('projects');
    return initial;
  });

  const isServerMode = process.env.NEXT_PUBLIC_SERVER_MODE === 'true';

  // Track mobile (client-side only). On mobile the sidebar is a drawer, never
  // a collapsed rail — collapse is a desktop affordance.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Collapse is an EXPLICIT toggle (console.hanzo.ai `DashboardShell` pattern),
  // persisted per-device — no hover-to-expand, no pin. Mobile is never collapsed.
  const [collapsedPref, setCollapsedPref] = useState(false);
  const collapsed = !isMobile && collapsedPref;

  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (stored !== null) setCollapsedPref(stored === 'true');
  }, []);

  const toggleCollapsed = () => {
    setCollapsedPref((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      return next;
    });
  };

  // Notify parent of collapsed state (content layout may want it).
  useEffect(() => {
    onCollapsedChange?.(collapsed);
  }, [collapsed, onCollapsedChange]);

  // Auto-expand Projects when on that view.
  useEffect(() => {
    if (currentView === 'projects') {
      setExpandedItems((prev) => new Set(prev).add('projects'));
    }
  }, [currentView]);

  // Load recent projects.
  useEffect(() => {
    async function loadRecentProjects() {
      try {
        await vfs.init();
        const projects = await vfs.listProjects();
        const sorted = projects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        setRecentProjects(sorted.slice(0, 3));
      } catch (error) {
        console.error('Failed to load recent projects:', error);
      } finally {
        setLoadingRecentProjects(false);
      }
    }
    loadRecentProjects();
  }, []);

  // Load sync status for Server Mode.
  useEffect(() => {
    if (!isServerMode) return;
    async function loadSyncStatus() {
      try {
        setSyncStatus(await getSyncOverviewStatus());
      } catch (error) {
        console.error('Failed to load sync status:', error);
      }
    }
    loadSyncStatus();
  }, [isServerMode]);

  const visibleSidebarItems = SIDEBAR_ITEMS.filter(
    (item) => !item.serverModeOnly || isServerMode,
  );

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      return newSet;
    });
  };

  const handleItemAction = async (item: SidebarItem) => {
    // Close the mobile drawer whenever a nav item is chosen.
    onMobileOpenChange?.(false);

    if (item.href) {
      window.open(item.href, '_blank', 'noopener,noreferrer');
    } else if (item.route) {
      router.push(item.route);
    } else if (item.action === 'start-tour') {
      onStartTour?.();
    } else if (item.action === 'open-about') {
      onOpenAbout?.();
    } else if (item.action === 'server-sync') {
      onServerSync?.();
    } else if (item.action === 'logout') {
      try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (response.ok) router.push('/admin/login');
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => onMobileOpenChange?.(false)}
        />
      )}

      <div
        className={cn(
          'flex flex-col h-screen bg-card transition-[width] duration-300',
          // Mobile: fixed drawer sliding in from the right.
          'fixed right-0 top-0 z-50 w-64 border-l',
          // Desktop: static, in-flow left column with a right border.
          'md:static md:right-auto md:z-auto md:border-l-0 md:border-r',
          collapsed ? 'md:w-14' : 'md:w-60',
          mobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0',
        )}
      >
        {/* Top: brand mark + collapse toggle — the ONE collapse control lives at
            the TOP (console.hanzo.ai `DashboardShell` pattern), not a bottom pin. */}
        <div
          className={cn(
            'flex items-center h-[54px] border-b px-2',
            collapsed ? 'justify-center' : 'gap-2 justify-between',
          )}
        >
          {collapsed ? (
            <button
              onClick={toggleCollapsed}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors"
            >
              <HanzoLogo className="h-5 w-5 text-foreground" />
            </button>
          ) : (
            <>
              <button
                onClick={() => (isMobile ? onMobileOpenChange?.(false) : onLogoClick?.())}
                className="flex min-w-0 items-center gap-2 rounded-md p-1 hover:bg-accent/50 transition-colors"
                title="Hanzo App"
              >
                <HanzoLogo className="h-5 w-5 shrink-0 text-foreground" />
                <span className="flex min-w-0 flex-col text-left">
                  <span className="truncate text-sm font-medium leading-none">Hanzo&nbsp;App</span>
                  <span className="mt-0.5 text-[10px] leading-[10px] text-muted-foreground">
                    {isServerMode ? `Server · v${pkg.version}` : `v${pkg.version}`}
                  </span>
                </span>
              </button>

              {/* Desktop collapse toggle */}
              <button
                onClick={toggleCollapsed}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                className="hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <PanelLeft className="h-4 w-4" />
              </button>

              {/* Mobile drawer close */}
              <button
                onClick={() => onMobileOpenChange?.(false)}
                title="Close menu"
                aria-label="Close menu"
                className="flex md:hidden h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Org selector + nav + wallet all share the OrgProvider scope. */}
        <OrgProvider>
          {!collapsed && (
            <div className="border-b px-2 py-2">
              <OrgSwitcher />
            </div>
          )}

          {/* Main navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-2">
            {visibleSidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const hasChildren = !!item.hasRecentProjects;
              const isExpanded = expandedItems.has(item.id);

              return (
                <div key={item.id}>
                  <div className={cn('p-1', isExpanded && hasChildren && 'rounded-2xl bg-muted')}>
                    <div className="relative">
                      <Button
                        variant={isActive && !hasChildren ? 'default' : 'ghost'}
                        className={cn(
                          'w-full',
                          collapsed ? 'justify-center px-2' : 'justify-start',
                          !collapsed && hasChildren && 'pr-8',
                        )}
                        onClick={() => {
                          if (!hasChildren || currentView !== item.id) handleItemAction(item);
                        }}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className={cn('h-4 w-4', !collapsed && 'mr-2')} />
                        {!collapsed && item.label}
                      </Button>
                      {!collapsed && hasChildren && (
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 transition-colors hover:bg-accent"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleExpanded(item.id);
                          }}
                          aria-label={isExpanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
                        >
                          <ChevronDown
                            className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
                          />
                        </button>
                      )}
                    </div>

                    {/* Recent projects (Projects only) */}
                    {item.hasRecentProjects && isExpanded && (
                      <div className={cn('mt-1 space-y-1', collapsed ? 'flex flex-col items-center' : 'ml-4')}>
                        {loadingRecentProjects ? (
                          <>
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className={cn(
                                  'flex items-center gap-2',
                                  collapsed ? 'justify-center p-1' : 'h-8 px-2',
                                )}
                              >
                                <div className="h-3 w-3 animate-pulse rounded bg-muted-foreground/20" />
                                {!collapsed && (
                                  <div className="h-3 flex-1 animate-pulse rounded bg-muted-foreground/20" />
                                )}
                              </div>
                            ))}
                          </>
                        ) : recentProjects.length > 0 ? (
                          recentProjects.map((project) => (
                            <Button
                              key={project.id}
                              variant="ghost"
                              size="sm"
                              className={cn(
                                collapsed ? 'h-8 w-8 justify-center p-0' : 'w-full justify-start text-xs',
                              )}
                              onClick={() => {
                                onMobileOpenChange?.(false);
                                onProjectSelect(project);
                              }}
                              title={project.name}
                            >
                              <FolderOpen className={cn('h-3 w-3 flex-shrink-0', !collapsed && 'mr-2')} />
                              {!collapsed && <span className="truncate">{project.name}</span>}
                            </Button>
                          ))
                        ) : (
                          !collapsed && (
                            <div className="px-2 py-1 text-xs text-muted-foreground">No recent projects</div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* System Actions (Server Mode only) */}
          {isServerMode && (
            <div className="space-y-1 border-t p-2">
              {SYSTEM_ACTIONS.map((item) => {
                const Icon = item.icon;
                const isLogout = item.id === 'logout';
                const isSync = item.id === 'sync';
                const showSyncIndicator = isSync && syncStatus?.needsSync;

                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'relative w-full',
                      collapsed ? 'justify-center px-2' : 'justify-start',
                      isLogout && 'text-destructive hover:bg-destructive/10 hover:text-destructive',
                    )}
                    onClick={() => handleItemAction(item)}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={cn('h-4 w-4', !collapsed && 'mr-2')} />
                    {!collapsed && item.label}
                    {showSyncIndicator && (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-orange-500" />
                    )}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Per-org identity + credit balance, pinned to the bottom (console
              SidebarIdentity placement). */}
          <SidebarWallet collapsed={collapsed} />
        </OrgProvider>
      </div>
    </>
  );
}

// Wrapper with a Suspense boundary (kept for router hooks under Next 15).
export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<div className="h-full w-full bg-card" />}>
      <SidebarContent {...props} />
    </Suspense>
  );
}
