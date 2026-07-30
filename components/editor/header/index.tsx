'use client';

import { XStack, SizableText, YStack } from '@hanzo/gui';
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

import { Popover, PopoverContent, PopoverTrigger, Button } from '@hanzo/ui';
import { HanzoLogo } from "@/components/HanzoLogo";
import { PagePanel } from "@/components/editor/page-navigator";
import { WorkspaceMenu } from "@/components/editor/workspace-menu";
import type { Page, Project } from "@/types";
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
    <XStack zIndex={20} alignItems="center" gap="$2" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2" $sm={{ gap: "$3" }} $lg={{ paddingHorizontal: "$4" }}>
      {/* LEFT — the workspace menu (identity/home anchor) + version history.
          Everything about who/where you are lives in the menu. */}
      <XStack flexShrink={0} alignItems="center" gap="$1.5">
        {/* The ONE Hanzo block-H (mark from @hanzo/logo MARK_PATHS, via the
            shared HanzoLogo). Home anchor, top-left — the IDE's brand corner. */}
        <Link
          href="/"
          aria-label="Hanzo home"
        ><SizableText marginRight="$0.5" width="$6" height="$6" alignItems="center" justifyContent="center" borderRadius="$5" color="$color" hoverStyle={{ backgroundColor: "$color" }} focusVisibleStyle={{ outlineWidth: 0 }}>
          <HanzoLogo size={20} />
        </SizableText></Link>
        <YStack minWidth={0}>
          <WorkspaceMenu project={project} onRenamed={onRenamed} />
        </YStack>
        {/* History / rollback — toggles the version-history panel over the chat
            pane (item 10). Chat is the default; this flips to the git timeline. */}
        {onToggleHistory && (
          <Button
            type="button"
            onClick={onToggleHistory}
            title={historyOpen ? "Back to chat" : "Version history"}
            aria-label={historyOpen ? "Back to chat" : "Version history"}
            aria-pressed={Boolean(historyOpen)}
            display="none" width="$6" height="$6" alignItems="center" justifyContent="center" borderRadius="$5" focusVisibleStyle={{ outlineWidth: 0 }} {...{ backgroundColor: historyOpen ? "$color3" : undefined, color: historyOpen ? "$color" : "$color11", hoverStyle: historyOpen ? undefined : {"backgroundColor":"$color","color":"$color"} }}
          >
            <History size={16} />
          </Button>
        )}
      </XStack>

      {/* CENTER — view switcher + device switcher + refresh + page selector +
          open-in-new-tab, one control cluster. */}
      <XStack alignItems="center" gap="$2">
        <XStack
          role="tablist"
          aria-label="Editor view"
          flexShrink={0} alignItems="center" gap="$0.5" borderRadius="$5" backgroundColor="$color" padding="$0.5"
        >
          {TABS.map((item) => {
            const active = tab === item.value;
            return (
              <Button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={active}
                title={item.label}
                onClick={() => onNewTab(item.value)}
                alignItems="center" gap="$1.5" borderRadius="$3" paddingHorizontal="$2.5" paddingVertical="$1.5" fontSize="$3" fontWeight="500" focusVisibleStyle={{ outlineWidth: 0 }} {...{ $lg: "mobileOnly" in item && item.mobileOnly ? {"display":"none"} : undefined, backgroundColor: active ? "$color3" : undefined, color: active ? "$color" : "$color11", elevation: active ? 1 : undefined, hoverStyle: active ? undefined : {"backgroundColor":"$color","color":"$color"} }}
              >
                <item.icon size={16} />
                <SizableText display="none">{item.label}</SizableText>
              </Button>
            );
          })}
        </XStack>

        {/* Preview-frame controls — device, refresh, page selector, external.
            Hidden below `md` where there's no room. */}
        <YStack display="none" alignItems="center" gap="$2">
          <XStack
            role="tablist"
            aria-label="Preview device"
            alignItems="center" gap="$0.5" borderRadius="$5" backgroundColor="$color" padding="$0.5"
          >
            {DEVICES.map((d) => {
              const active = device === d.name;
              return (
                <Button
                  key={d.name}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  title={`${d.name[0].toUpperCase()}${d.name.slice(1)} preview`}
                  onClick={() => setDevice(d.name as "desktop" | "mobile")}
                  width={28} height={28} alignItems="center" justifyContent="center" borderRadius="$3" fontSize="$3" focusVisibleStyle={{ outlineWidth: 0 }} {...{ backgroundColor: active ? "$color3" : undefined, color: active ? "$color" : "$color11", elevation: active ? 1 : undefined, hoverStyle: active ? undefined : {"backgroundColor":"$color","color":"$color"} }}
                >
                  <d.icon size={16} />
                </Button>
              );
            })}
          </XStack>
          <Button
            type="button"
            onClick={handleRefreshIframe}
            title="Refresh preview"
            width="$6" height="$6" alignItems="center" justifyContent="center" borderRadius="$5" color="$color11" hoverStyle={{ backgroundColor: "$color", color: "$color" }} focusVisibleStyle={{ outlineWidth: 0 }}
          >
            <RefreshCcw size={14} />
          </Button>

          {/* Page browser — search + folder-grouped list of every page in the
              project (not just index.html). The working page is highlighted. */}
          {pages.length > 0 && (
            <Popover open={pageMenuOpen} onOpenChange={setPageMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  title="Browse pages"
                  aria-label="Browse pages"
                  maxWidth="12rem" alignItems="center" gap="$1.5" borderRadius="$5" backgroundColor="$color" paddingHorizontal="$2.5" paddingVertical="$1.5" fontSize="$3" color="$color" hoverStyle={{ backgroundColor: "$color", color: "$color" }} focusVisibleStyle={{ outlineWidth: 0 }}
                >
                  <SizableText numberOfLines={1} fontFamily="$mono" fontSize="$1">
                    {currentPage}
                  </SizableText>
                  <ChevronDown size={14} color="$color11" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="center"
                sideOffset={6}
                width={256} overflow="hidden" padding="$0"
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

          <Button
            type="button"
            onClick={onOpenExternal}
            title="Open preview in a new tab"
            aria-label="Open preview in a new tab"
            width="$6" height="$6" alignItems="center" justifyContent="center" borderRadius="$5" color="$color11" hoverStyle={{ backgroundColor: "$color", color: "$color" }} focusVisibleStyle={{ outlineWidth: 0 }}
          >
            <ExternalLink size={14} />
          </Button>
        </YStack>
      </XStack>

      {/* RIGHT — the solid Publish primary is pinned `shrink-0` OUTSIDE the
          scroll track so it always paints fully; the secondary actions
          (Share · Load · Push) scroll within their own track on tight widths. */}
      <XStack minWidth={0} flex={1} alignItems="center" justifyContent="flex-end" gap="$1.5" $lg={{ flex: 0, gap: "$2" }}>
        {secondary.length > 0 && (
          <XStack minWidth={0} alignItems="center" gap="$1.5" overflow="scroll" $lg={{ gap: "$2" }} className="no-scrollbar">
            {secondary}
          </XStack>
        )}
        {primary && <YStack flexShrink={0}>{primary}</YStack>}
      </XStack>
    </XStack>
  );
}
