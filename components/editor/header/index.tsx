import { ReactNode } from "react";
import { Eye, MessageCircleCode } from "lucide-react";
import Link from "next/link";

import { HanzoLogo } from "@/components/HanzoLogo";
import { CrossSurfaceLinks } from "@/components/editor/cross-surface-links";

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
    <header className="border-b bg-neutral-950 border-neutral-800 px-3 lg:px-6 py-2 flex items-center gap-2 sm:gap-3 z-20 lg:grid lg:grid-cols-[auto_1fr_auto]">
      <div className="flex items-center justify-start gap-3 shrink-0">
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
      {/* Chat/Preview switcher — a compact segmented control. Icon-only on the
          smallest widths, labels appear from `sm` up. It never grabs flex, so it
          can't push into the actions cluster; the rail keeps it visually distinct
          from the neighbouring action buttons. */}
      <div
        role="tablist"
        aria-label="Editor view"
        className="flex shrink-0 items-center gap-0.5 rounded-lg bg-neutral-900 p-0.5 ring-1 ring-neutral-800 lg:justify-self-center"
      >
        {TABS.map((item) => {
          const active = tab === item.value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              title={item.label}
              onClick={() => onNewTab(item.value)}
              className={classNames(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                active
                  ? "bg-neutral-700 text-white shadow-sm"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </div>
      {/* Actions cluster. `min-w-0` + `overflow-x-auto` means that on the
          narrowest widths the actions scroll within their own lane instead of
          overlapping the switcher; `shrink` lets the lane give up space first. */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 overflow-x-auto lg:flex-none lg:gap-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <CrossSurfaceLinks />
        {children}
      </div>
    </header>
  );
}
