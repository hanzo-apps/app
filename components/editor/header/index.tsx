import { ReactNode } from "react";
import {
  ChevronDown,
  Code2,
  Eye,
  ExternalLink,
  MessageCircleCode,
  PanelLeft,
  PanelLeftClose,
  RefreshCcw,
} from "lucide-react";
import { FaLaptopCode } from "react-icons/fa6";
import { FaMobileAlt } from "react-icons/fa";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@hanzo/ui";
import { OrgSwitcher } from "@/components/org-switcher";
import { EditorAccountMenu } from "@/components/editor/account-menu";
import { History } from "@/components/editor/history";
import type { HtmlHistory, Page } from "@/types";
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
  { name: "desktop", icon: FaLaptopCode },
  { name: "mobile", icon: FaMobileAlt },
] as const;

/**
 * Builder top chrome — the ONE bar (Lovable structure, Hanzo true-black
 * monochrome). No bottom footer: every view control lives here.
 *
 *   LEFT   org·project switcher (the identity/home anchor — no brand mark) +
 *          revision-history + the panel/sidebar toggle
 *   CENTER the view switcher (Chat·Preview·Code), device switcher, refresh, the
 *          page selector, and open-in-new-tab — one grouped cluster
 *   RIGHT  account + credits, then the primary actions passed as `children`
 *          (Share … the sole solid Publish button)
 *
 * True-black `#080808` field, white/10 hairline border, white/[0.03–0.10]
 * surfaces — the chrome recedes so the generated preview stays the star.
 */
export function Header({
  tab,
  onNewTab,
  children,
  device,
  setDevice,
  htmlHistory,
  setPages,
  iframeRef,
  pages,
  currentPage,
  onSelectPage,
  onOpenExternal,
  sidebarCollapsed,
  onToggleSidebar,
}: {
  tab: string;
  onNewTab: (tab: string) => void;
  children?: ReactNode;
  device: "desktop" | "mobile";
  setDevice: React.Dispatch<React.SetStateAction<"desktop" | "mobile">>;
  htmlHistory?: HtmlHistory[];
  setPages: (pages: Page[]) => void;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
  pages: Page[];
  currentPage: string;
  onSelectPage: (path: string) => void;
  onOpenExternal: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
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

  return (
    <header className="z-20 flex items-center gap-2 border-b border-white/10 bg-[#080808] px-3 py-2 sm:gap-3 lg:grid lg:grid-cols-[auto_1fr_auto] lg:px-4">
      {/* LEFT — org·project switcher (the left anchor; no brand H) + history +
          the desktop sidebar toggle. */}
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="min-w-0">
          <OrgSwitcher />
        </div>
        {htmlHistory && htmlHistory.length > 0 && (
          <History history={htmlHistory} setPages={setPages} />
        )}
        <button
          type="button"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? "Show chat panel" : "Hide chat panel"}
          aria-label={sidebarCollapsed ? "Show chat panel" : "Hide chat panel"}
          aria-pressed={!sidebarCollapsed}
          className="hidden size-8 items-center justify-center rounded-lg text-white/50 ring-1 ring-white/10 transition-colors hover:bg-white/[0.06] hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 lg:flex"
        >
          {sidebarCollapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>
      </div>

      {/* CENTER — view switcher + device switcher + refresh + page selector +
          open-in-new-tab, one control cluster. */}
      <div className="flex items-center gap-2 lg:justify-self-center">
        <div
          role="tablist"
          aria-label="Editor view"
          className="flex shrink-0 items-center gap-0.5 rounded-lg bg-white/[0.03] p-0.5 ring-1 ring-white/10"
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
                  "mobileOnly" in item && item.mobileOnly ? "lg:hidden" : "",
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

        {/* Preview-frame controls — device, refresh, page selector, external.
            Hidden below `md` where there's no room. */}
        <div className="hidden items-center gap-2 md:flex">
          <div
            role="tablist"
            aria-label="Preview device"
            className="flex items-center gap-0.5 rounded-lg bg-white/[0.03] p-0.5 ring-1 ring-white/10"
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
                    "flex size-7 items-center justify-center rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                    active
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-white/50 hover:bg-white/[0.06] hover:text-white/90"
                  )}
                >
                  <d.icon />
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleRefreshIframe}
            title="Refresh preview"
            className="flex size-8 items-center justify-center rounded-lg text-white/50 ring-1 ring-white/10 transition-colors hover:bg-white/[0.06] hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <RefreshCcw className="size-3.5" />
          </button>

          {/* Page selector — the working page among the project's pages. */}
          {pages.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title="Select page"
                  className="flex max-w-[12rem] items-center gap-1.5 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-sm text-white/70 ring-1 ring-white/10 transition-colors hover:bg-white/[0.06] hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  <span className="truncate font-mono text-xs">
                    {currentPage}
                  </span>
                  <ChevronDown className="size-3.5 shrink-0 text-white/40" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="max-h-72 w-56 overflow-y-auto rounded-xl border border-white/10 bg-[#0a0a0a] p-1 text-white shadow-2xl"
              >
                {pages.map((page) => (
                  <DropdownMenuItem
                    key={page.path}
                    onSelect={() => onSelectPage(page.path)}
                    className={classNames(
                      "cursor-pointer rounded-md px-2 py-1.5 font-mono text-xs focus:bg-white/10 focus:text-white",
                      page.path === currentPage
                        ? "bg-white/[0.06] text-white"
                        : "text-white/70"
                    )}
                  >
                    {page.path}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <button
            type="button"
            onClick={onOpenExternal}
            title="Open preview in a new tab"
            aria-label="Open preview in a new tab"
            className="flex size-8 items-center justify-center rounded-lg text-white/50 ring-1 ring-white/10 transition-colors hover:bg-white/[0.06] hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <ExternalLink className="size-3.5" />
          </button>
        </div>
      </div>

      {/* RIGHT — account + credits, then the primary actions (`children`:
          Share … Publish). Scrolls within itself on tight widths. */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 overflow-x-auto lg:flex-none lg:gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <EditorAccountMenu />
        {children}
      </div>
    </header>
  );
}
