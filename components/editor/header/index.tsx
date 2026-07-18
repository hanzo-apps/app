import { ReactNode } from "react";
import { Eye, MessageCircleCode } from "lucide-react";
import Link from "next/link";

import { HanzoLogo } from "@/components/HanzoLogo";
import { CrossSurfaceLinks } from "@/components/editor/cross-surface-links";
import { OrgSwitcher } from "@/components/org-switcher";
import { EditorAccountMenu } from "@/components/editor/account-menu";

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

/**
 * Builder top chrome, Lovable structure in Hanzo-darker monochrome.
 *
 *   LEFT   brand/home anchor + the active org·project switcher (top-left, like
 *          Lovable's project icon)
 *   CENTER the view switcher as a segmented control
 *   RIGHT  account + credits, cross-surface links, then the primary actions
 *          passed as `children` (Share … the prominent Publish button)
 *
 * True-black `#080808` field, white/10 hairline border, white/[0.03–0.10]
 * surfaces — the chrome recedes so the generated preview stays the star. The
 * switcher and account/credits are the canonical shared controls (`OrgSwitcher`
 * / `EditorAccountMenu`) composed here — one way to switch orgs, one account
 * cluster — never re-implemented.
 */
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
    <header className="border-b bg-[#080808] border-white/10 px-3 lg:px-4 py-2 flex items-center gap-2 sm:gap-3 z-20 lg:grid lg:grid-cols-[auto_1fr_auto]">
      {/* LEFT — brand/home anchor + org·project switcher. */}
      <div className="flex items-center gap-2 shrink-0">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            {/* Left-click → home; right-click → the app-shell menu (settings / brand / docs). */}
            <Link
              href="/"
              className="group flex items-center shrink-0 rounded-md p-1 -m-1 transition-colors hover:bg-white/[0.06]"
              aria-label="Hanzo — home"
            >
              {/* Animated mark unifies the surfaces — a subtle idle drift that
                  lifts on hover; the SVG's own animation is reduced-motion safe. */}
              <HanzoLogo
                animated
                className="w-7 h-7 text-white transition-opacity duration-200 opacity-90 group-hover:opacity-100 motion-reduce:opacity-100"
              />
            </Link>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-56">
            <ContextMenuLabel className="text-xs text-white/40">Hanzo Dev</ContextMenuLabel>
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

        {/* The org the builder is scoped to — the canonical switcher (its own
            hairline-bordered trigger + chevron dropdown). Collapses on the
            tightest widths so the mark + tabs keep priority. */}
        <div className="hidden min-w-0 sm:block">
          <OrgSwitcher />
        </div>
      </div>

      {/* CENTER — Chat/Preview switcher as a compact segmented control. Icon-only
          on the smallest widths, labels from `sm` up. It never grabs flex, so it
          can't push into the actions cluster; the surface rail keeps it distinct
          from the neighbouring action buttons. */}
      <div
        role="tablist"
        aria-label="Editor view"
        className="flex shrink-0 items-center gap-0.5 rounded-lg bg-white/[0.03] p-0.5 ring-1 ring-white/10 lg:justify-self-center"
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
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/50 hover:bg-white/[0.06] hover:text-white/90"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* RIGHT — account + credits, cross-surface links, then the primary actions.
          `min-w-0` + `overflow-x-auto` means the lane scrolls within itself on the
          narrowest widths instead of overlapping the switcher; `shrink` lets it
          give up space first. The Publish button (last child) stays the prominent,
          right-most CTA. */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 overflow-x-auto lg:flex-none lg:gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <EditorAccountMenu />
        <CrossSurfaceLinks />
        {children}
      </div>
    </header>
  );
}
