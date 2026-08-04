'use client';

import { SizableText, YStack, XStack, H2, Paragraph, Anchor } from '@hanzo/gui';
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Project } from '@/lib/vfs/types';
import { usePlan, unpaid } from '@/lib/billing/entitlements';
import { getSyncOverviewStatus, SyncOverviewStatus } from '@/lib/vfs/auto-sync';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Input } from '@hanzo/ui';
import { HanzoLogo } from '@/components/HanzoLogo';
import {
  Activity,
  TerminalSquare,
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
import { VERSION } from '@/lib/version';

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
  { id: 'sessions', label: 'Terminals', icon: TerminalSquare, route: 'https://tabs.hanzo.ai/app' },
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
  const { logout } = useUser();
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
      // ONE logout: the @hanzo/iam SDK. Clearing the SDK token store is what
      // makes the session end — a route that only cleared a cookie left the SDK
      // holding the token, and the next mount wrote the cookie straight back.
      await logout();
    }
  };

  const renderNavButton = (item: SidebarItem) => {
    const Icon = item.icon;
    const isActive = currentView === item.id;
    return (
      <Button
        key={item.id}
        variant="ghost"
        width="100%" gap="$2" {...{ justifyContent: collapsed ? "center" : "flex-start", paddingHorizontal: collapsed ? "$2" : undefined, backgroundColor: isActive ? "var(--brand-accent-soft)" : undefined, color: isActive ? "var(--brand-accent-muted)" : "$color11", hoverStyle: isActive ? {"backgroundColor":"var(--brand-accent-soft)"} : {"backgroundColor":"$color3"} }}
        onClick={() => handleItemAction(item)}
        title={collapsed ? item.label : undefined}
      >
        <Icon size={16} />
        {!collapsed && <SizableText flex={1} textAlign="left">{item.label}</SizableText>}
        {!collapsed && item.kbd && <kbd>{item.kbd}</kbd>}
      </Button>
    );
  };

  const Divider = () => <YStack marginVertical="$1" height={1} backgroundColor="$borderColor" />;

  const visibleSecondary = SECONDARY_ITEMS.filter((i) => !i.serverModeOnly || isServerMode);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <YStack
          position="fixed" top={0} right={0} bottom={0} left={0} backgroundColor="black" zIndex={40} $md={{ display: "none" }}
          onClick={() => onMobileOpenChange?.(false)}
  />
      )}

      <YStack
        height="100%" backgroundColor="$background" position="fixed" right="$0" top="$0" zIndex={50} width={256} borderLeftWidth={1} {...{ $md: mobileOpen ? collapsed ? {"width":"$9"} : {"width":240} : {"x":"$0"}, x: mobileOpen ? "$0" : "100%" }}
      >
        {/* Top: brand mark + collapse toggle. */}
        <XStack
          alignItems="center" height={54} borderBottomWidth={1} paddingHorizontal="$2" {...{ justifyContent: collapsed ? "center" : "space-between", gap: collapsed ? undefined : "$2" }}
        >
          {collapsed ? (
            <Button
              onClick={toggleCollapsed}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              height={36} width={36} alignItems="center" justifyContent="center" borderRadius="$3" hoverStyle={{ backgroundColor: "$color3" }}
            >
              <HanzoLogo size={20} color="var(--foreground)" />
            </Button>
          ) : (
            <>
              <Button
                onClick={() => (isMobile ? onMobileOpenChange?.(false) : onLogoClick?.())}
                minWidth={0} alignItems="center" gap="$2" borderRadius="$3" padding="$1" hoverStyle={{ backgroundColor: "$color3" }}
                title="Hanzo App"
              >
                <HanzoLogo size={20} color="var(--foreground)" />
                <SizableText minWidth={0} flexDirection="column" textAlign="left">
                  <SizableText numberOfLines={1} fontSize="$3" fontWeight="500" lineHeight={1}>Hanzo&nbsp;App</SizableText>
                  <SizableText marginTop="$0.5" fontSize={10} lineHeight={10} color="$color11">
                    {isServerMode ? `Server · v${VERSION}` : `v${VERSION}`}
                  </SizableText>
                </SizableText>
              </Button>

              <Button
                onClick={toggleCollapsed}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                display="none" height="$6" width="$6" flexShrink={0} alignItems="center" justifyContent="center" borderRadius="$3" {...{ color: "$color11" }} hoverStyle={{ backgroundColor: "$color3" }}
              >
                <PanelLeft size={16} />
              </Button>

              <Button
                onClick={() => onMobileOpenChange?.(false)}
                title="Close menu"
                aria-label="Close menu"
                height="$6" width="$6" flexShrink={0} alignItems="center" justifyContent="center" borderRadius="$3" {...{ color: "$color11" }} $md={{ display: "none" }} hoverStyle={{ backgroundColor: "$color3" }}
              >
                <X size={16} />
              </Button>
            </>
          )}
        </XStack>

        {/* Org selector + nav + wallet all share the OrgProvider scope. */}
        <OrgProvider>
          {!collapsed && (
            <YStack borderBottomWidth={1} paddingHorizontal="$2" paddingVertical="$2">
              <OrgSwitcher />
            </YStack>
          )}

          {/* Scrollable nav */}
          <YStack flex={1} rowGap="$0.5" padding="$2" paddingBottom="$4" overflow="scroll" className="scroll-fade-b">
            {/* Primary */}
            {PRIMARY_ITEMS.map(renderNavButton)}

            {/* Projects — header carries the Create project / Create folder menu */}
            {collapsed ? (
              <Divider />
            ) : (
              <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$3" paddingBottom="$1" paddingTop="$3">
                <SizableText fontSize={11} fontWeight="500" textTransform="uppercase" letterSpacing={0.8} color="$color11">
                  Projects
                </SizableText>
                <DropdownMenu placement="bottom-end">
                  <DropdownMenuTrigger asChild>
                    <Button
                      aria-label="Project actions"
                      borderRadius="$2" padding="$0.5" {...{ color: "$color11" }} hoverStyle={{ backgroundColor: "$color3" }}
                    >
                      <MoreHorizontal size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => router.push('/dev')}>
                      <Plus size={16} />
                      Create project
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCreatingFolder(true)}>
                      <FolderPlus size={16} />
                      Create folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </XStack>
            )}
            {PROJECT_ITEMS.map(renderNavButton)}

            {/* Folders (app-side grouping — persists locally; see lib/folders) */}
            {!collapsed && creatingFolder && (
              <Input
                autoFocus
                value={newFolderName}
                onChangeText={(value) => setNewFolderName(value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitNewFolder();
                  else if (e.key === 'Escape') {
                    setCreatingFolder(false);
                    setNewFolderName('');
                  }
                }}
                onBlur={submitNewFolder}
                placeholder="Folder name…"
                marginHorizontal="$1" width="calc(100%-0.5rem)" borderRadius="$3" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$2" paddingVertical="$1.5" fontSize="$3" outlineWidth={0} focusStyle={{ borderColor: "$color8" }}
  />
            )}
            {!collapsed &&
              folders.map((f) => (
                <Button
                  key={f.id}
                  variant="ghost"
                  size="sm"
                  width="100%" justifyContent="flex-start"
                  onClick={() => {
                    onMobileOpenChange?.(false);
                    router.push(`/projects?folder=${encodeURIComponent(f.id)}`);
                  }}
                  title={f.name}
                >
                  <Folder size={14} color="$color11" />
                  <SizableText numberOfLines={1} fontSize="$3">{f.name}</SizableText>
                </Button>
              ))}

            {/* Recents — from the REAL cloud list (survives reload) */}
            {recents.length > 0 && (
              <>
                {collapsed ? <Divider /> : (
                  <SizableText paddingHorizontal="$3" paddingBottom="$1" paddingTop="$3" fontSize={11} fontWeight="500" textTransform="uppercase" letterSpacing={0.8} color="$color11" display="flex" flexDirection="column">
                    Recents
                  </SizableText>
                )}
                {recents.map((project) => (
                  <Button
                    key={project.id}
                    variant="ghost"
                    size="sm"
                    {...{ height: collapsed ? "$6" : undefined, width: collapsed ? "100%" : "100%", justifyContent: collapsed ? "center" : "flex-start", padding: collapsed ? "$0" : undefined }}
                    onClick={() => openCloudProject(project.slug || project.id, project.org)}
                    title={project.name}
                  >
                    <FolderOpen
                      size={14} color="$color11"
  />
                    {!collapsed && <SizableText numberOfLines={1} fontSize="$3">{project.name}</SizableText>}
                  </Button>
                ))}
              </>
            )}

            {/* Secondary (kept reachable) */}
            {collapsed ? <Divider /> : (
              <SizableText paddingHorizontal="$3" paddingBottom="$1" paddingTop="$3" fontSize={11} fontWeight="500" textTransform="uppercase" letterSpacing={0.8} color="$color11" display="flex" flexDirection="column">
                More
              </SizableText>
            )}
            {visibleSecondary.map(renderNavButton)}
          </YStack>

          {/* System Actions (Server Mode only) */}
          {isServerMode && (
            <YStack rowGap="$1" borderTopWidth={1} padding="$2">
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
                    position="relative" width="100%" gap="$2" {...{ justifyContent: collapsed ? "center" : "flex-start", paddingHorizontal: collapsed ? "$2" : undefined, color: isLogout ? "$red9" : undefined, hoverStyle: isLogout ? {"backgroundColor":"$red9"} : undefined }}
                    onClick={() => handleItemAction(item)}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={16} />
                    {!collapsed && item.label}
                    {showSyncIndicator && (
                      <SizableText position="absolute" right="$1" top="$1" height="$2" width="$2" borderRadius="$10" backgroundColor="var(--brand-accent)" />
                    )}
                  </Button>
                );
              })}
            </YStack>
          )}

          {/* Share + Upgrade cards (expanded only) */}
          {!collapsed && (
            <YStack rowGap="$2" borderTopWidth={1} padding="$2">
              <ShareCard />
              <UpgradeCard onClick={() => router.push('/billing')} />
            </YStack>
          )}

          {/* Per-org identity + credit balance, pinned to the bottom. */}
          <SidebarWallet collapsed={collapsed} />
        </OrgProvider>
      </YStack>
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
      <Button
        onClick={() => setOpen(true)}
        title="Share Hanzo, earn free weeks"
        width="100%" alignItems="center" gap="$2" borderRadius="$3" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$2.5" paddingVertical="$1.5" {...{ color: "$color11" }} hoverStyle={{ backgroundColor: "$color3" }}
      >
        <Share2 size={14} />
        <SizableText numberOfLines={1} fontWeight="500" fontSize="$1" color="$color11">Share app</SizableText>
      </Button>
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
    <XStack
      position="fixed" top={0} right={0} bottom={0} left={0} zIndex={70} alignItems="center" justifyContent="center" backgroundColor="black" padding="$4"
      onClick={onClose}
      role="dialog"
      aria-modal={true}
      aria-label="Share Hanzo"
    >
      <SizableText
        position="relative" width="100%" maxWidth={448} borderRadius="$8" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" padding="$5" color="$color" elevation={6} display="flex" flexDirection="column"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          onClick={onClose}
          aria-label="Close"
          position="absolute" right="$4" top="$4" borderRadius="$3" padding="$1" {...{ color: "$color11" }} hoverStyle={{ backgroundColor: "$color3" }}
        >
          <X size={16} />
        </Button>

        <SizableText height={44} width={44} alignItems="center" justifyContent="center" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3">
          <Gift size={20} strokeWidth={1.5} />
        </SizableText>
        <H2 marginTop="$4" fontSize="$6" fontWeight="600" letterSpacing={-0.4}>
          Share Hanzo, earn free weeks
        </H2>
        <Paragraph marginTop="$2" fontSize="$3" lineHeight={1.625} color="$color11">
          For every friend who signs up and subscribes to a paid plan through your
          link, you get{' '}
          <SizableText fontWeight="500" color="$color">1 week free</SizableText> — up to{' '}
          <SizableText fontWeight="500" color="$color">1 year</SizableText> (52 weeks).
        </Paragraph>

        <XStack marginTop="$4.5" alignItems="center" gap="$2" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" padding="$1.5">
          <Input
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            minWidth={0} flex={1} backgroundColor="transparent" paddingHorizontal="$2" fontSize="$3" color="$color" outlineWidth={0}
            aria-label="Your referral link"
  />
          <Button
            onClick={copy}
            flexShrink={0} alignItems="center" gap="$1.5" borderRadius="$3" backgroundColor="$color12" paddingHorizontal="$3" paddingVertical="$1.5" {...{ color: "$background" }} hoverStyle={{ backgroundColor: "$color12" }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <SizableText fontSize="$1" fontWeight="500" color="$background">{copied ? 'Copied' : 'Copy'}</SizableText>
          </Button>
        </XStack>

        <XStack marginTop="$3" flexWrap="wrap" gap="$2">
          <Button
            onClick={nativeShare}
            alignItems="center" gap="$1.5" borderRadius="$3" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$3" paddingVertical="$1.5" {...{ color: "$color11" }} hoverStyle={{ borderColor: "$borderColor" }}
          >
            <Share2 size={14} /> <SizableText fontSize="$1" color="$color11">Share</SizableText>
          </Button>
          <Anchor
            href={`https://x.com/intent/post?text=${shareText}&url=${enc}`}
            target="_blank"
            rel="noopener noreferrer"
            alignItems="center" gap="$1.5" borderRadius="$3" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$3" paddingVertical="$1.5" fontSize="$1" color="$color11" hoverStyle={{ borderColor: "$borderColor", color: "$color" }}
          >
            Post on X
          </Anchor>
          <Anchor
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc}`}
            target="_blank"
            rel="noopener noreferrer"
            alignItems="center" gap="$1.5" borderRadius="$3" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$3" paddingVertical="$1.5" fontSize="$1" color="$color11" hoverStyle={{ borderColor: "$borderColor", color: "$color" }}
          >
            Share on LinkedIn
          </Anchor>
        </XStack>

        <Paragraph marginTop="$4" fontSize={11} lineHeight={1.625} color="$color11">
          Free weeks are credited when a referred friend&apos;s paid subscription
          starts. Rewards cap at 52 weeks.
        </Paragraph>
      </SizableText>
    </XStack>
  );
}

/**
 * Upgrade card → billing. Renders ONLY for a caller we know pays for nothing.
 *
 * It used to render unconditionally, so a customer on a paid plan was told to
 * upgrade to the thing they had already bought. `unpaid` is false while the plan
 * is loading AND when the read failed, because neither is evidence of a free
 * account — an upgrade offer is a claim about someone's billing, and a UI that
 * makes that claim has to have asked.
 */
function UpgradeCard({ onClick }: { onClick: () => void }) {
  const plan = usePlan();
  if (!unpaid(plan)) return null;
  return (
    <Button
      onClick={onClick}
      title="More credits & private apps"
      width="100%" alignItems="center" gap="$2" borderRadius="$3" borderWidth={1} borderColor="$borderColor" paddingHorizontal="$2.5" paddingVertical="$1.5" {...{ color: "$color" }}
    >
      <Zap size={14} />
      <SizableText numberOfLines={1} fontWeight="500" fontSize="$1" color="$color">Upgrade to Pro</SizableText>
    </Button>
  );
}

// Wrapper with a Suspense boundary (kept for router hooks under Next 15).
export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<YStack height="100%" width="100%" backgroundColor="$background" />}>
      <SidebarContent {...props} />
    </Suspense>
  );
}
