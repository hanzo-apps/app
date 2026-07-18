import { ReactNode } from "react";
import { Eye, MessageCircleCode, RefreshCcw } from "lucide-react";
import { FaLaptopCode } from "react-icons/fa6";
import { FaMobileAlt } from "react-icons/fa";

import { CrossSurfaceLinks } from "@/components/editor/cross-surface-links";
import { OrgSwitcher } from "@/components/org-switcher";
import { EditorAccountMenu } from "@/components/editor/account-menu";
import { History } from "@/components/editor/history";
import type { HtmlHistory, Page } from "@/types";
import classNames from "classnames";

const TABS = [
  { value: "chat", label: "Chat", icon: MessageCircleCode },
  { value: "preview", label: "Preview", icon: Eye },
];

const DEVICES = [
  { name: "desktop", icon: FaLaptopCode },
  { name: "mobile", icon: FaMobileAlt },
] as const;

/**
 * Builder top chrome — the ONE bar (Lovable structure, Hanzo-darker monochrome).
 * There is no bottom footer: every view control lives here so the workspace is
 * one bar over the split (chat | preview), and the chat composer stays inside
 * the chat pane.
 *
 *   LEFT   the active org·project switcher (the identity/home anchor — no brand
 *          mark) + the revision-history control
 *   CENTER the view switcher, the device switcher, and refresh — one grouped
 *          cluster of view controls
 *   RIGHT  account + credits, cross-surface links, then the primary actions
 *          passed as `children` (Share … the prominent Publish button)
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
}: {
  tab: string;
  onNewTab: (tab: string) => void;
  children?: ReactNode;
  device: "desktop" | "mobile";
  setDevice: React.Dispatch<React.SetStateAction<"desktop" | "mobile">>;
  htmlHistory?: HtmlHistory[];
  setPages: (pages: Page[]) => void;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
}) {
  // Hard reload of the preview iframe (blank then restore srcdoc) — the refresh
  // that used to live in the footer, now beside the device switcher.
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
      {/* LEFT — org·project switcher (the left anchor; no brand H) + history. */}
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="min-w-0">
          <OrgSwitcher />
        </div>
        {htmlHistory && htmlHistory.length > 0 && (
          <History history={htmlHistory} setPages={setPages} />
        )}
      </div>

      {/* CENTER — view switcher + device switcher + refresh, one control cluster. */}
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

        {/* Device switcher + refresh — preview-frame controls, hidden below `md`
            where the phone frame has no room. */}
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
        </div>
      </div>

      {/* RIGHT — account + credits, cross-surface links, then the primary actions
          (`children`: Share … Publish). Scrolls within itself on tight widths. */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 overflow-x-auto lg:flex-none lg:gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <EditorAccountMenu />
        <CrossSurfaceLinks />
        {children}
      </div>
    </header>
  );
}
