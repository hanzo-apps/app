'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Project } from '@/lib/vfs/types';
import { getSyncOverviewStatus, SyncOverviewStatus } from '@/lib/vfs/auto-sync';
import { Button } from '@hanzo/ui';
import { HanzoLogo } from '@/components/HanzoLogo';
import {
  Activity,
  FolderOpen,
  Folder,
  FolderPlus,
  Settings,
  Info,
  BookOpen,
  Bot,
  Cloud,
  LogOut,
  LayoutDashboard,
  PanelLeft,
  X,
  Search,
  Sparkles,
  Plug,
  Star,
  User,
  Users,
  GraduationCap,
  Globe,
  Zap,
  Share2,
  Check,
  MoreHorizontal,
  Plus,
  Copy,
  Gift,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@hanzo/ui';
import { cn } from '@/lib/utils';
import { OrgProvider } from '@/lib/org/client';
import { OrgSwitcher } from '@/components/org-switcher';
import { SidebarWallet } from '@/components/SidebarWallet';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';
import { useUser } from '@/hooks/useUser';
import { builderLink } from '@/lib/api/projects';
import { useFolders } from '@/hooks/useFolders';
import { markProjectOpened, orderByRecentlyOpened } from '@/lib/recent-projects';
import pkg from '@/package.json';

// Collapsed sidebar width (icon-only rail). Kept exported for callers that lay
// out around the sidebar; the width itself is applied via a Tailwind class now.
export const COLLAPSED_SIDEBAR_WIDTH = 56;

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  /** Canonical ABSOLUTE internal route (e.g. `/skills`). */
  route?: string;
  action?: string;
  href?: string; // external link (opens in a new tab)
  serverModeOnly?: boolean;
  /** A ⌘K affordance shown on the right of the row (Search). */
  kbd?: string;
}

// ── Primary destinations (top of the rail) ──────────────────────────────────
// Games is intentionally ABSENT: it is folded into Resources as a category
// (the games→templates merge). Search opens the ⌘K palette.
const PRIMARY_ITEMS: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' },
  { id: 'search', label: 'Search', icon: Search, action: 'open-search', kbd: '⌘K' },
  { id: 'resources', label: 'Resources', icon: Sparkles, route: '/resources' },
  { id: 'connectors', label: 'Connectors', icon: Plug, route: '/connectors' },
  { id: 'agents', label: 'Agents', icon: Bot, route: '/agents' },
];

// ── Projects group ──────────────────────────────────────────────────────────
const PROJECT_ITEMS: SidebarItem[] = [
  { id: 'all-projects', label: 'All projects', icon: FolderOpen, route: '/projects' },
  { id: 'starred', label: 'Starred', icon: Star, route: '/projects?filter=starred' },
  { id: 'created-by-me', label: 'Created by me', icon: User, route: '/projects?filter=mine' },
  { id: 'shared', label: 'Shared with me', icon: Users, route: '/projects?filter=shared' },
];

// ── Secondary group (kept reachable — reorganized, not deleted) ─────────────
const SECONDARY_ITEMS: SidebarItem[] = [
  { id: 'deployments', label: 'Deployments', icon: Globe, route: '/admin/deployments', serverModeOnly: true },
  { id: 'skills', label: 'Skills', icon: GraduationCap, route: '/skills' },
  { id: 'usage', label: 'Usage', icon: Activity, route: '/usage' },
  { id: 'docs', label: 'Docs', icon: BookOpen, route: '/docs' },
  { id: 'settings', label: 'Settings', icon: Settings, action: 'open-settings' },
  { id: 'tour', label: 'Guided Tour', icon: Info, action: 'start-tour' },
  { id: 'about', label: 'About', icon: Info, action: 'open-about' },
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
  /** Open the ⌘K command palette (owned by the shell). */
  onOpenSearch?: () => void;
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
  onStartTour,
  onOpenAbout,
  onOpenSettings,
  onServerSync,
  onOpenSearch,
  onLogoClick,
  onCollapsedChange,
  mobileOpen = false,
  onMobileOpenChange,
}: SidebarProps) {
  const router = useRouter();
  const [syncStatus, setSyncStatus] = useState<SyncOverviewStatus | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // REAL projects: the org-scoped cloud list (client-side; persists across
  // reloads/devices). Local VFS is only an offline fallback inside the hook.
  const { projects: cloudProjects } = useProjects();
  const { folders, createFolder } = useFolders();

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

  useEffect(() => {
    onCollapsedChange?.(collapsed);
  }, [collapsed, onCollapsedChange]);

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

  // Recents: recently-OPENED first (real local signal), then most-recently
  // updated, deduped — all from the cloud list so they survive a reload.
  const recents = useMemo(() => {
    const opened = orderByRecentlyOpened(cloudProjects, (p) => p.slug || p.id);
    const byUpdated = [...cloudProjects].sort((a, b) => b.updatedAt - a.updatedAt);
    const seen = new Set<string>();
    const out: typeof cloudProjects = [];
    for (const p of [...opened, ...byUpdated]) {
      const key = p.slug || p.id;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(p);
      if (out.length >= 6) break;
    }
    return out;
  }, [cloudProjects]);

  const openCloudProject = (slug: string, org?: string) => {
    onMobileOpenChange?.(false);
    markProjectOpened(slug);
    router.push(builderLink(slug, org));
  };

  const submitNewFolder = () => {
    const name = newFolderName.trim();
    if (name) createFolder(name);
    setNewFolderName('');
    setCreatingFolder(false);
  };

  const handleItemAction = async (item: SidebarItem) => {
    onMobileOpenChange?.(false);
    if (item.href) {
      window.open(item.href, '_blank', 'noopener,noreferrer');
    } else if (item.route) {
      router.push(item.route);
    } else if (item.action === 'open-search') {
      onOpenSearch?.();
    } else if (item.action === 'open-settings') {
      if (onOpenSettings) onOpenSettings();
      else router.push('/settings');
    } else if (item.action === 'start-tour') {
      onStartTour?.();
    } else if (item.action === 'open-about') {
      onOpenAbout?.();
    } else if (item.action === 'server-sync') {
      onServerSync?.();
    } else if (item.action === 'logout') {
      try {
        const response = await fetch('/v1/auth/logout', { method: 'POST' });
        if (response.ok) router.push('/admin/login');
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
  };

  const renderNavButton = (item: SidebarItem) => {
    const Icon = item.icon;
    const isActive = currentView === item.id;
    return (
      <Button
        key={item.id}
        variant={isActive ? 'default' : 'ghost'}
        className={cn(
          'w-full',
          collapsed ? 'justify-center px-2' : 'justify-start',
          // Vercel-calm: inactive nav is muted, brightens AND gets a visible
          // surface on hover; only the active item is full-strength. The explicit
          // bg-sidebar-accent doesn't depend on the ghost variant's own hover token.
          !isActive &&
            'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
        )}
        onClick={() => handleItemAction(item)}
        title={collapsed ? item.label : undefined}
      >
        <Icon className={cn('h-4 w-4', !collapsed && 'mr-2')} />
        {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
        {!collapsed && item.kbd && (
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {item.kbd}
          </kbd>
        )}
      </Button>
    );
  };

  const Divider = () => <div className="my-1 h-px bg-border" />;

  const visibleSecondary = SECONDARY_ITEMS.filter((i) => !i.serverModeOnly || isServerMode);

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
          'fixed right-0 top-0 z-50 w-64 border-l',
          'md:static md:right-auto md:z-auto md:border-l-0 md:border-r',
          collapsed ? 'md:w-14' : 'md:w-60',
          mobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0',
        )}
      >
        {/* Top: brand mark + collapse toggle. */}
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

              <button
                onClick={toggleCollapsed}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                className="hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <PanelLeft className="h-4 w-4" />
              </button>

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

          {/* Scrollable nav */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto p-2 pb-4 [mask-image:linear-gradient(to_bottom,#000_calc(100%-1.5rem),transparent)]">
            {/* Primary */}
            {PRIMARY_ITEMS.map(renderNavButton)}

            {/* Projects — header carries the Create project / Create folder menu */}
            {collapsed ? (
              <Divider />
            ) : (
              <div className="flex items-center justify-between px-3 pb-1 pt-3">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Projects
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="Project actions"
                      className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push('/dev')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create project
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCreatingFolder(true)}>
                      <FolderPlus className="mr-2 h-4 w-4" />
                      Create folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            {PROJECT_ITEMS.map(renderNavButton)}

            {/* Folders (app-side grouping — persists locally; see lib/folders) */}
            {!collapsed && creatingFolder && (
              <input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitNewFolder();
                  else if (e.key === 'Escape') {
                    setCreatingFolder(false);
                    setNewFolderName('');
                  }
                }}
                onBlur={submitNewFolder}
                placeholder="Folder name…"
                className="mx-1 w-[calc(100%-0.5rem)] rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-ring"
              />
            )}
            {!collapsed &&
              folders.map((f) => (
                <Button
                  key={f.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    onMobileOpenChange?.(false);
                    router.push(`/projects?folder=${encodeURIComponent(f.id)}`);
                  }}
                  title={f.name}
                >
                  <Folder className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm">{f.name}</span>
                </Button>
              ))}

            {/* Recents — from the REAL cloud list (survives reload) */}
            {recents.length > 0 && (
              <>
                {collapsed ? <Divider /> : (
                  <div className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Recents
                  </div>
                )}
                {recents.map((project) => (
                  <Button
                    key={project.id}
                    variant="ghost"
                    size="sm"
                    className={cn(collapsed ? 'h-8 w-full justify-center p-0' : 'w-full justify-start')}
                    onClick={() => openCloudProject(project.slug || project.id, project.org)}
                    title={project.name}
                  >
                    <FolderOpen
                      className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground', !collapsed && 'mr-2')}
                    />
                    {!collapsed && <span className="truncate text-sm">{project.name}</span>}
                  </Button>
                ))}
              </>
            )}

            {/* Secondary (kept reachable) */}
            {collapsed ? <Divider /> : (
              <div className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                More
              </div>
            )}
            {visibleSecondary.map(renderNavButton)}
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

          {/* Share + Upgrade cards (expanded only) */}
          {!collapsed && (
            <div className="space-y-2 border-t p-2">
              <ShareCard />
              <UpgradeCard onClick={() => router.push('/billing')} />
            </div>
          )}

          {/* Per-org identity + credit balance, pinned to the bottom. */}
          <SidebarWallet collapsed={collapsed} />
        </OrgProvider>
      </div>
    </>
  );
}

/**
 * Share card → opens the referral widget. The reward is real: for every friend
 * who signs up and subscribes to a PAID plan through your link, you get one free
 * week — up to one year (52 weeks). Attribution rides the `?ref=` param, which
 * the commerce referral program credits on a referred paid signup.
 */
function ShareCard() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Share Hanzo, earn free weeks"
        className="flex w-full items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Share2 className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate font-medium">Share app</span>
      </button>
      {open && <ReferralDialog onClose={() => setOpen(false)} />}
    </>
  );
}

/** The referral share widget — link + reward, in a solid, self-contained modal. */
function ReferralDialog({ onClose }: { onClose: () => void }) {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);

  // Referral link: a stable `?ref=<code>` the commerce referral program credits.
  // Code = the signed-in user's handle (never their email); anonymous → bare site.
  const code = (user?.username || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const link = code ? `https://hanzo.app/?ref=${code}` : 'https://hanzo.app';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — no-op */
    }
  };
  const nativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Build apps with Hanzo',
          text: 'Describe an app — Hanzo builds and ships it. Join with my link:',
          url: link,
        });
      } else {
        copy();
      }
    } catch {
      /* dismissed — no-op */
    }
  };
  const shareText = encodeURIComponent(
    'Describe an app — Hanzo builds and ships it. Join with my link:',
  );
  const enc = encodeURIComponent(link);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Share Hanzo"
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-popover p-6 text-foreground shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted">
          <Gift className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <h2 className="mt-4 text-lg font-semibold tracking-tight">
          Share Hanzo, earn free weeks
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          For every friend who signs up and subscribes to a paid plan through your
          link, you get{' '}
          <span className="font-medium text-foreground">1 week free</span> — up to{' '}
          <span className="font-medium text-foreground">1 year</span> (52 weeks).
        </p>

        <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-muted p-1.5">
          <input
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 bg-transparent px-2 text-sm text-foreground outline-none"
            aria-label="Your referral link"
          />
          <button
            onClick={copy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={nativeShare}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
          <a
            href={`https://x.com/intent/post?text=${shareText}&url=${enc}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            Post on X
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            Share on LinkedIn
          </a>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          Free weeks are credited when a referred friend&apos;s paid subscription
          starts. Rewards cap at 52 weeks.
        </p>
      </div>
    </div>
  );
}

/** Upgrade card → billing. */
function UpgradeCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="More credits & private apps"
      className="flex w-full items-center gap-2 rounded-md border border-border bg-gradient-to-br from-white/[0.06] to-transparent px-2.5 py-1.5 text-left text-xs text-foreground transition-colors hover:from-white/[0.1]"
    >
      <Zap className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate font-medium">Upgrade to Pro</span>
    </button>
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
