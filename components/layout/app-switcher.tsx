'use client';

/**
 * AppSwitcher — the Hanzo cross-app product switcher, triggered by the LOGO.
 *
 * The Hanzo mark + wordmark in the header top-left IS the trigger: clicking it
 * opens a popover grid of every Hanzo app (Chat, App, Studio, Bot, Dev, World,
 * Console, Gateway, Desktop, Browser, CLI, Account, Admin, …). This is the ONE
 * way to reach the switcher — there is no separate 9-dot grid button.
 *
 * The app list mirrors the canonical `HANZO_APPS` in @hanzo/gui's shell
 * (`pkgs/ui/shell/src/hanzo-apps.tsx`) — same ids, labels, grouping, and
 * canonical URLs from the shell registry `U` table. That package doesn't ship a
 * Next-importable entry here, so the data is replicated (monochrome lucide icons
 * in place of the shell's inline SVGs). Keep the two in sync when apps change.
 *
 * Accessible: the trigger is a real button (aria-haspopup / aria-expanded); the
 * Radix Popover traps focus, closes on Esc, and returns focus to the trigger;
 * every tile is a focusable link (Tab / Shift-Tab / Enter). The current app is
 * marked `aria-current="page"`.
 */
import Link from 'next/link';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@hanzo/ui';
import {
  MessageSquare,
  LayoutGrid,
  Users,
  Sparkles,
  Bot,
  Cloud,
  Code2,
  Globe,
  Search,
  Terminal,
  Waypoints,
  Layers,
  Monitor,
  Puzzle,
  Code,
  SquareTerminal,
  CircleUser,
  CreditCard,
  ShieldCheck,
  ChevronDown,
  Home,
  type LucideIcon,
} from 'lucide-react';
import { HanzoLogo } from '@/components/HanzoLogo';
import { cn } from '@/lib/utils';

type AppGroup = 'Products' | 'Platform' | 'Install' | 'Account';

interface HanzoApp {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  group: AppGroup;
}

// Canonical cross-app list — order = launcher order. URLs match the shell
// registry `U` table (single source in @hanzo/gui). ONE edit here adds an app.
const HANZO_APPS: HanzoApp[] = [
  // Products
  { id: 'chat', label: 'Chat', href: 'https://hanzo.chat', icon: MessageSquare, group: 'Products' },
  { id: 'app', label: 'App', href: 'https://hanzo.app', icon: LayoutGrid, group: 'Products' },
  { id: 'team', label: 'Team', href: 'https://hanzo.team', icon: Users, group: 'Products' },
  { id: 'studio', label: 'Studio', href: 'https://studio.hanzo.ai', icon: Sparkles, group: 'Products' },
  { id: 'bot', label: 'Bot', href: 'https://hanzo.bot', icon: Bot, group: 'Products' },
  { id: 'cloud', label: 'Cloud', href: 'https://cloud.hanzo.ai', icon: Cloud, group: 'Products' },
  { id: 'dev', label: 'Dev', href: 'https://hanzo.ai/dev', icon: Code2, group: 'Products' },
  { id: 'world', label: 'World', href: 'https://world.hanzo.ai', icon: Globe, group: 'Products' },
  { id: 'search', label: 'Search', href: 'https://hanzo.ai/search', icon: Search, group: 'Products' },
  // Platform
  { id: 'console', label: 'Console', href: 'https://console.hanzo.ai', icon: Terminal, group: 'Platform' },
  { id: 'gateway', label: 'Gateway', href: 'https://console.hanzo.ai/gateway', icon: Waypoints, group: 'Platform' },
  { id: 'platform', label: 'Platform', href: 'https://platform.hanzo.ai', icon: Layers, group: 'Platform' },
  // Install
  { id: 'desktop', label: 'Desktop', href: 'https://hanzo.ai/desktop', icon: Monitor, group: 'Install' },
  { id: 'extension', label: 'Browser', href: 'https://hanzo.ai/extension', icon: Puzzle, group: 'Install' },
  { id: 'vscode', label: 'VS Code', href: 'https://hanzo.ai/vscode', icon: Code, group: 'Install' },
  { id: 'cli', label: 'CLI', href: 'https://hanzo.ai/cli', icon: SquareTerminal, group: 'Install' },
  // Account
  { id: 'account', label: 'Account', href: 'https://hanzo.id/account', icon: CircleUser, group: 'Account' },
  { id: 'billing', label: 'Billing', href: 'https://billing.hanzo.ai', icon: CreditCard, group: 'Account' },
  { id: 'admin', label: 'Admin', href: 'https://admin.hanzo.ai', icon: ShieldCheck, group: 'Account' },
];

const GROUPS: AppGroup[] = ['Products', 'Platform', 'Install', 'Account'];

export function AppSwitcher({ currentApp = 'app' }: { currentApp?: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Open Hanzo apps"
          className="group flex shrink-0 items-center gap-2 rounded-lg px-1 py-1 outline-none transition-colors hover:bg-card focus-visible:ring-2 focus-visible:ring-foreground/30"
        >
          <HanzoLogo className="h-7 w-7 text-foreground" />
          <span className="text-lg font-medium tracking-tight text-foreground">Hanzo</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[340px] max-w-[calc(100vw-24px)] overflow-hidden border-border bg-popover p-0 text-popover-foreground"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Hanzo Apps
          </span>
          <Link
            href="/"
            aria-label="Hanzo App home"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Home className="h-4 w-4" />
          </Link>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-2">
          {GROUPS.map((group) => {
            const apps = HANZO_APPS.filter((a) => a.group === group);
            if (apps.length === 0) return null;
            return (
              <div key={group} className="mb-1.5 last:mb-0">
                <div className="px-2 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                  {group}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {apps.map((app) => {
                    const current = app.id === currentApp;
                    const Icon = app.icon;
                    return (
                      <a
                        key={app.id}
                        href={app.href}
                        aria-current={current ? 'page' : undefined}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-foreground/30',
                          current
                            ? 'border-border bg-accent text-foreground'
                            : 'border-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="w-full truncate text-xs font-medium">{app.label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default AppSwitcher;
