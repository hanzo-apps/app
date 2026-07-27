import { Children, ReactNode, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Code2,
  Eye,
  ExternalLink,
  History,
  MessageCircleCode,
  Monitor,
  RefreshCcw,
  Smartphone,
} from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/overlay";
import { HanzoLogo } from "@/components/HanzoLogo";
import { PagePanel } from "@/components/editor/page-navigator";
import { WorkspaceMenu } from "@/components/editor/workspace-menu";
import type { Page, Project } from "@/types";
import classNames from "classnames";

// The ONE view switcher (Lovable's grouped segmented control). "Chat" only means
// anything on mobile, where a single pane shows at a time — on desktop the chat
// pane is always docked on the left, so Preview/Code drive the RIGHT pane and
// the Chat segment is hidden.
const TABS = [
  { value: "chat", label: "Chat", icon: MessageCircleCode, mobileOnly: true },
  { value: "preview", label: "Preview", icon: Eye },
  { value: "code", label: "Code", icon: Code2 },
] as const;

const DEVICES = [
  { name: "desktop", icon: Monitor },
  { name: "mobile", icon: Smartphone },
] as const;

/**
 * Builder top chrome — the ONE bar (Lovable structure, Hanzo true-black
 * monochrome). It sits on the SAME flat workspace field as the panels below it,
 * with NO bottom border, so the chrome reads as one continuous surface and the
 * raised preview card is the only thing that lifts off it.
 *
 *   LEFT   the workspace menu (org·project identity, credits, wallet, account —
 *          the ONE identity anchor). The chat/AI panel toggle lives on the
 *          console bar at the bottom, with the other workspace controls.
 *   CENTER the view switcher (Chat·Preview·Code), device switcher, refresh, the
 *          page selector, and open-in-new-tab — one grouped cluster
 *   RIGHT  the primary actions passed as `children` (Share · Load · Push …
 *          the sole solid compact Publish button) — lean, no identity here
 */
export function Header({
  tab,
  onNewTab,
  children,
  device,
  setDevice,
  iframeRef,
  pages,
  currentPage,
  onSelectPage,
  onOpenExternal,
  historyOpen,
  onToggleHistory,
  project,
  onRenamed,
}: {
  tab: string;
  onNewTab: (tab: string) => void;
  children?: ReactNode;
  device: "desktop" | "mobile";
  setDevice: React.Dispatch<React.SetStateAction<"desktop" | "mobile">>;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
  pages: Page[];
  currentPage: string;
  onSelectPage: (path: string) => void;
  onOpenExternal: () => void;
  /** Whether the left-pane history/rollback panel is showing (item 10). */
  historyOpen?: boolean;
  /** Toggle the history/rollback panel over the chat pane. */
  onToggleHistory?: () => void;
  project?: Project | null;
  onRenamed?: (name: string) => void;
}) {
  // Controls the page-browser popover so selecting a page closes it.
  const [pageMenuOpen, setPageMenuOpen] = useState(false);

  // Hard reload of the preview iframe (blank then restore srcdoc).
  const handleRefreshIframe = () => {
    if (iframeRef?.current) {
      const iframe = iframeRef.current;
      const content = iframe.srcdoc;
      iframe.srcdoc = "";
      setTimeout(() => {
        iframe.srcdoc = content;
      }, 10);
    }
  };

  // The action cluster is authored `Share · Load · Push … Publish`, the solid
  // Publish primary always LAST. Split it so the secondaries scroll within their
  // own track on tight widths while the primary stays pinned and fully visible —
  // never clipped off the right on mobile.
  const actions = Children.toArray(children);
  const primary = actions.length ? actions[actions.length - 1] : null;
  const secondary = actions.slice(0, -1);

  return (
    <header className="z-20 flex items-center gap-2 bg-card px-3 py-2 sm:gap-3 lg:grid lg:grid-cols-[auto_1fr_auto] lg:px-4">
      {/* LEFT — the workspace menu (identity/home anchor) + version history.
          Everything about who/where you are lives in the menu. */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* The ONE Hanzo block-H (mark from @hanzo/logo MARK_PATHS, via the
            shared HanzoLogo). Home anchor, top-left — the IDE's brand corner. */}
        <Link
          href="/"
          aria-label="Hanzo home"
          className="mr-0.5 flex size-8 items-center justify-center rounded-lg text-foreground transition-colors duration-150 hover:bg-foreground/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <HanzoLogo className="size-5" />
        </Link>
        <div className="min-w-0">
          <WorkspaceMenu project={project} onRenamed={onRenamed} />
        </div>
        {/* History / rollback — toggles the version-history panel over the chat
            pane (item 10). Chat is the default; this flips to the git timeline. */}
        {onToggleHistory && (
          <button
            type="button"
            onClick={onToggleHistory}
            title={historyOpen ? "Back to chat" : "Version history"}
            aria-label={historyOpen ? "Back to chat" : "Version history"}
            aria-pressed={Boolean(historyOpen)}
            className={classNames(
              "hidden size-8 items-center justify-center rounded-lg ring-1 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex",
              historyOpen
                ? "bg-muted text-foreground ring-foreground/25"
                : "text-muted-foreground ring-border hover:bg-foreground/[0.08] hover:text-foreground",
            )}
          >
            <History className="size-4" />
          </button>
        )}
      </div>

      {/* CENTER — view switcher + device switcher + refresh + page selector +
          open-in-new-tab, one control cluster. */}
      <div className="flex items-center gap-2 lg:justify-self-center">
        <div
          role="tablist"
          aria-label="Editor view"
          className="flex shrink-0 items-center gap-0.5 rounded-lg bg-foreground/[0.04] p-0.5 ring-1 ring-border"
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
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "mobileOnly" in item && item.mobileOnly ? "lg:hidden" : "",
                  active
                    ? "bg-muted text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-foreground/[0.08] hover:text-foreground"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Preview-frame controls — device, refresh, page selector, external.
            Hidden below `md` where there's no room. */}
        <div className="hidden items-center gap-2 md:flex">
          <div
            role="tablist"
            aria-label="Preview device"
            className="flex items-center gap-0.5 rounded-lg bg-foreground/[0.04] p-0.5 ring-1 ring-border"
          >
            {DEVICES.map((d) => {
              const active = device === d.name;
              return (
                <button
                  key={d.name}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  title={`${d.name[0].toUpperCase()}${d.name.slice(1)} preview`}
                  onClick={() => setDevice(d.name as "desktop" | "mobile")}
                  className={classNames(
                    "flex size-7 items-center justify-center rounded-md text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-muted text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-foreground/[0.08] hover:text-foreground"
                  )}
                >
                  <d.icon className="size-4" />
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleRefreshIframe}
            title="Refresh preview"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground ring-1 ring-border transition-colors duration-150 hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RefreshCcw className="size-3.5" />
          </button>

          {/* Page browser — search + folder-grouped list of every page in the
              project (not just index.html). The working page is highlighted. */}
          {pages.length > 0 && (
            <Popover open={pageMenuOpen} onOpenChange={setPageMenuOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  title="Browse pages"
                  aria-label="Browse pages"
                  className="flex max-w-[12rem] items-center gap-1.5 rounded-lg bg-foreground/[0.04] px-2.5 py-1.5 text-sm text-foreground ring-1 ring-border transition-colors duration-150 hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="truncate font-mono text-xs">
                    {currentPage}
                  </span>
                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="center"
                sideOffset={6}
                className="w-64 overflow-hidden p-0"
              >
                <PagePanel
                  pages={pages}
                  currentPage={currentPage}
                  onSelectPage={onSelectPage}
                  onClose={() => setPageMenuOpen(false)}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          )}

          <button
            type="button"
            onClick={onOpenExternal}
            title="Open preview in a new tab"
            aria-label="Open preview in a new tab"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground ring-1 ring-border transition-colors duration-150 hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ExternalLink className="size-3.5" />
          </button>
        </div>
      </div>

      {/* RIGHT — the solid Publish primary is pinned `shrink-0` OUTSIDE the
          scroll track so it always paints fully; the secondary actions
          (Share · Load · Push) scroll within their own track on tight widths. */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 lg:flex-none lg:gap-2">
        {secondary.length > 0 && (
          <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto lg:gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {secondary}
          </div>
        )}
        {primary && <div className="shrink-0">{primary}</div>}
      </div>
    </header>
  );
}
