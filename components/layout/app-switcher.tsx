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
import { SizableText, XStack, YStack, Anchor } from '@hanzo/gui';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger, Button } from '@hanzo/ui';
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
        <Button
          type="button"
          aria-label="Open Hanzo apps"
          group flexShrink={0} alignItems="center" gap="$2" borderRadius="$5" paddingHorizontal="$1" paddingVertical="$1" outlineWidth={0} hoverStyle={{ backgroundColor: "$background" }}
        >
          <HanzoLogo className="h-7 w-7 text-foreground" />
          <SizableText fontSize="$6" fontWeight="500" letterSpacing={-0.4} color="$color">Hanzo</SizableText>
          <ChevronDown size={16} color="$color11" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        width={340} overflow="hidden" padding="$0"
      >
        <XStack alignItems="center" justifyContent="space-between" borderBottomWidth={1} borderColor="$borderColor" paddingHorizontal="$4" paddingVertical="$2.5">
          <SizableText fontSize={11} fontWeight="600" textTransform="uppercase" letterSpacing={0.4} color="$color11">
            Hanzo Apps
          </SizableText>
          <Link
            href="/"
            aria-label="Hanzo App home"
          ><SizableText height={28} width={28} alignItems="center" justifyContent="center" borderRadius="$3" color="$color11" hoverStyle={{ backgroundColor: "$color3", color: "$color" }}>
            <Home size={16} />
          </SizableText></Link>
        </XStack>
        <YStack maxHeight="70vh" padding="$2" overflow="scroll">
          {GROUPS.map((group) => {
            const apps = HANZO_APPS.filter((a) => a.group === group);
            if (apps.length === 0) return null;
            return (
              <YStack key={group} marginBottom="$1.5" className="last:mb-0">
                <SizableText paddingHorizontal="$2" paddingBottom="$1" paddingTop="$1.5" fontSize={10} fontWeight="500" textTransform="uppercase" letterSpacing={0.4} color="$color11" display="flex" flexDirection="column">
                  {group}
                </SizableText>
                <YStack gap="$1">
                  {apps.map((app) => {
                    const current = app.id === currentApp;
                    const Icon = app.icon;
                    return (
                      <Anchor
                        key={app.id}
                        href={app.href}
                        aria-current={current ? 'page' : undefined}
                        flexDirection="column" alignItems="center" gap="$1.5" borderRadius="$5" borderWidth={1} paddingHorizontal="$2" paddingVertical="$2.5" textAlign="center" outlineWidth={0} {...{ borderColor: current ? "$borderColor" : "transparent", backgroundColor: current ? "$color3" : undefined, color: current ? "$color" : "$color11", hoverStyle: current ? undefined : {"backgroundColor":"$color3","color":"$color"} }}
                      >
                        <Icon className="h-5 w-5" />
                        <SizableText width="100%" numberOfLines={1} fontSize="$1" fontWeight="500">{app.label}</SizableText>
                      </Anchor>
                    );
                  })}
                </YStack>
              </YStack>
            );
          })}
        </YStack>
      </PopoverContent>
    </Popover>
  );
}

export default AppSwitcher;
