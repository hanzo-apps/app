import { ReactNode } from "react";
import { Eye, MessageCircleCode } from "lucide-react";
import Link from "next/link";

import { HanzoLogo } from "@/components/HanzoLogo";
import { CrossSurfaceLinks } from "@/components/editor/cross-surface-links";

import { Button } from "@hanzo/ui";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import classNames from "classnames";

const TABS = [
  {
    value: "chat",
    label: "Chat",
    icon: MessageCircleCode,
  },
  {
    value: "preview",
    label: "Preview",
    icon: Eye,
  },
];

export function Header({
  tab,
  onNewTab,
  children,
}: {
  tab: string;
  onNewTab: (tab: string) => void;
  children?: ReactNode;
}) {
  return (
    <header className="border-b bg-neutral-950 border-neutral-800 px-3 lg:px-6 py-2 flex items-center max-lg:gap-3 justify-between lg:grid lg:grid-cols-3 z-20">
      <div className="flex items-center justify-start gap-3 min-w-0">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            {/* Left-click → home; right-click → the app-shell menu (settings / brand / docs). */}
            <Link
              href="/"
              className="group flex items-center shrink-0 rounded-md p-1 -m-1 transition-colors hover:bg-white/5"
              aria-label="Hanzo"
            >
              {/* Animated mark unifies the surfaces — a subtle idle drift that
                  lifts on hover; the SVG's own animation is reduced-motion safe. */}
              <HanzoLogo
                animated
                className="w-8 h-8 text-white transition-opacity duration-200 opacity-90 group-hover:opacity-100 motion-reduce:opacity-100"
              />
            </Link>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-56">
            <ContextMenuLabel className="text-xs text-neutral-400">Hanzo Dev</ContextMenuLabel>
            <ContextMenuSeparator />
            <ContextMenuItem asChild>
              <Link href="/settings">Settings &amp; preferences</Link>
            </ContextMenuItem>
            <ContextMenuItem asChild>
              <a href="https://hanzo.ai/brand" target="_blank" rel="noopener noreferrer">Brand &amp; assets</a>
            </ContextMenuItem>
            <ContextMenuItem asChild>
              <a href="https://hanzo.ai/docs" target="_blank" rel="noopener noreferrer">Docs</a>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem asChild>
              <a href="https://hanzo.ai" target="_blank" rel="noopener noreferrer">About Hanzo</a>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
      <div className="flex items-center justify-start lg:justify-center gap-1 max-lg:pl-3 flex-1 max-lg:border-l max-lg:border-l-neutral-800">
        {TABS.map((item) => (
          <Button
            key={item.value}
            variant={tab === item.value ? "secondary" : "ghost"}
            className={classNames("", {
              "opacity-60": tab !== item.value,
            })}
            size="sm"
            onClick={() => onNewTab(item.value)}
          >
            <item.icon className="size-4" />
            <span className="hidden md:inline">{item.label}</span>
          </Button>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 lg:gap-3">
        <CrossSurfaceLinks />
        {children}
      </div>
    </header>
  );
}
