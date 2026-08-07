'use client';

import { XStack, SizableText, YStack } from '@hanzo/ui';
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
import { selected } from "@/lib/chrome";
import { HanzoLogo } from "@/components/HanzoLogo";
import { PagePanel } from "@/components/editor/page-navigator";
import { WorkspaceMenu } from "@/components/editor/workspace-menu";
import type { Page, Project } from "@/types";
// The ONE view switcher (a grouped segmented control). "Chat" only means anything
// on mobile, where a single pane shows at a time — on desktop the chat pane is
// always docked on the left, so Preview/Code drive the RIGHT pane and the Chat
// segment is hidden.
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
 * The bar's ONE control size. Every square box here — the brand corner, each
 * icon button — measures exactly this, and the segmented pills reach it as
 * 28 + their group's `$0.5` padding.
 *
 * A literal, not a size token. Four boxes asked for `width="$6" height="$6"`
 * meaning 32; `$6` is 64 on gui's size scale, so each drew at DOUBLE its
 * intended size. 64px of brand corner plus two 64px icon buttons overran the
 * bar, and the three clusters ended up painting over one another — measured at
 * 1440px: `Load ⨯ Preview`, `Preview ⨯ Publish`, `Publish ⨯ Code`, which is the
 * push icon sitting on top of the Publish pill in the owner's screenshot.
 *
 * Naming the number is the fix: there is no token that reads 32, so every call
 * site was guessing, and one guess was wrong four times.
 */
const CONTROL = 32;

/**
 * Builder top chrome — the ONE bar (three clusters across, Hanzo true-black
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
      <XStack flexShrink={1} minWidth={0} alignItems="center" gap="$1.5">
        {/* The ONE Hanzo block-H (mark from @hanzo/logo MARK_PATHS, via the
            shared HanzoLogo). Home anchor, top-left — the IDE's brand corner. */}
        <Link
          href="/"
          aria-label="Hanzo home"
        >{/* No marginRight: it sat INSIDE the anchor, so the <a> measured 34x32
             — the one control in the bar that was not square — while the parent
             row's `gap="$1.5"` was already doing that spacing. */}
        <XStack width={CONTROL} height={CONTROL} alignItems="center" justifyContent="center" borderRadius="$5" hoverStyle={{ backgroundColor: "$color3" }}>
          <HanzoLogo size={20} />
        </XStack></Link>
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
            variant="ghost"
            display="none" $lg={{ display: "flex" }} size="icon-sm" borderRadius="$5" {...{ ...selected(Boolean(historyOpen)), hoverStyle: historyOpen ? undefined : { backgroundColor: "$color3" } }}
          >
            <History size={16} />
          </Button>
        )}
      </XStack>

      {/* CENTER — view switcher + device switcher + refresh + page selector +
          open-in-new-tab, one control cluster.

          THE CONTROLS WERE BEING STARVED, and the older note here called it an
          overlap because it measured the DESCENDANTS. They do not overlap: the
          three clusters tile cleanly at every width (390: 12→204, 212→241,
          249→378). What looked like overlap was this cluster's own
          `overflow: scroll` — a descendant's `getBoundingClientRect()` reports
          where it WOULD be, un-clipped, so controls scrolled out of view read
          as sitting on top of the Publish button. Measure the clusters, not
          the buttons.

          The real fault was `flex={1}` — `flex: 1 1 0`, a ZERO basis, so this
          cluster asked for nothing and took only what the other two left over.
          Measured on prod at 390px: 29px of width holding 254px of controls,
          which is why the page selector read "index.htm" cut mid-word. With
          `flexBasis: auto` it asks for its content and shrinks from there:

            390px   29px → 128px      560px  199px → 226px      860px  448px → 476px

          The other half is in the workspace menu: the project NAME now gives up
          its room below $sm, because it is a label and these are the tools. */}
      <XStack alignItems="center" gap="$2" flexGrow={1} flexShrink={1} flexBasis="auto" minWidth={0} overflow="scroll" className="no-scrollbar">
        <XStack
          role="tablist"
          aria-label="Editor view"
          flexShrink={0} alignItems="center" gap="$0.5" borderRadius="$5" backgroundColor="$color3" padding="$0.5"
        >
          {TABS.map((item) => {
            const active = tab === item.value;
            const sel = selected(active);
            return (
              <Button
                key={item.value}
                type="button"
                role="tab"
                variant="ghost"
                aria-selected={active}
                title={item.label}
                onClick={() => onNewTab(item.value)}
                // height 28, NOT vertical padding. Inside this group's $0.5 padding that
                // makes the pill 32px — the header's one control height, shared with the
                // device group beside it and every icon button. Padding + line-height
                // computed to 32px of CONTENT, so the group rendered 36px and sat 4px
                // taller than its own sibling. Set the height; never let padding decide it.
                height={28} alignItems="center" gap="$1.5" borderRadius="$3" paddingHorizontal="$2.5" {...{ $lg: "mobileOnly" in item && item.mobileOnly ? {"display":"none"} : undefined, ...sel, hoverStyle: active ? undefined : { backgroundColor: "$color4" } }}
              >
                <SizableText color={sel.color}>
                  <item.icon size={16} />
                </SizableText>
                <SizableText display="none" $sm={{ display: "inline" }}>{item.label}</SizableText>
              </Button>
            );
          })}
        </XStack>

        {/* THE PAGE BROWSER IS NAVIGATION, NOT PREVIEW TOOLING, so it is not
            behind the `$md` gate below. It was, and that meant a phone could
            not switch pages AT ALL: the whole cluster is `display: none` under
            md, and the only page list — and the only SEARCH over it, which is
            the one way to find a page in a project with more than a handful —
            went with it. The device toggle and refresh legitimately stay
            desktop-only; a device switcher on a phone is answering a question
            nobody asked.

            It sits in the centre cluster's scroll track, so on a narrow screen
            it is reachable by scrolling rather than by being dropped. */}
        {/* Page browser — search + folder-grouped list of every page in the
            project (not just index.html). The working page is highlighted. */}
        {pages.length > 0 && (
          <Popover open={pageMenuOpen} onOpenChange={setPageMenuOpen}>
          {/* A fixed 32px box, not vertical padding: this control sits in a
                row with the others and has to match their height exactly, which
                padding around a variable-height label does not. */}
            <PopoverTrigger asChild>
              <Button
                type="button"
                title="Browse pages"
                aria-label="Browse pages"
                maxWidth="12rem" height={32} alignItems="center" gap="$1.5" borderRadius="$5" backgroundColor="$color3" paddingHorizontal="$2.5" hoverStyle={{ backgroundColor: "$color4" }}
              >
                <SizableText numberOfLines={1} fontFamily="$mono" fontSize="$1">
                  {currentPage}
                </SizableText>
                <ChevronDown size={14} />
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


        {/* Preview-frame TOOLING — device, refresh, open-in-new. Desktop only:
            below `md` there is no room, and none of the three answers a
            question a phone user is asking. The page browser is NOT here; it is
            navigation and lives above, at every width. */}
        <XStack display="none" $md={{ display: "flex" }} alignItems="center" gap="$2">
          {/* No padding on the group: its items are `size="icon-sm"` (32), the
              same as every other icon control in this bar, so the group is
              exactly one control tall and the row does not gain a step. A
              bespoke 28 here was the last squashed glyph — 28 minus a Button's
              24px of label padding left 4, and it painted at 2px. */}
          <XStack
            role="tablist"
            aria-label="Preview device"
            alignItems="center" gap="$0.5" borderRadius="$5" backgroundColor="$color3"
          >
            {DEVICES.map((d) => {
              const active = device === d.name;
              const sel = selected(active);
              return (
                <Button
                  key={d.name}
                  type="button"
                  role="tab"
                  variant="ghost"
                  aria-selected={active}
                  title={`${d.name[0].toUpperCase()}${d.name.slice(1)} preview`}
                  onClick={() => setDevice(d.name as "desktop" | "mobile")}
                  size="icon-sm" borderRadius="$3" {...{ ...sel, hoverStyle: active ? undefined : { backgroundColor: "$color4" } }}
                >
                  <SizableText color={sel.color}>
                    <d.icon size={16} />
                  </SizableText>
                </Button>
              );
            })}
          </XStack>
          <Button
            type="button"
            onClick={handleRefreshIframe}
            title="Refresh preview"
            variant="ghost"
            size="icon-sm" borderRadius="$5" hoverStyle={{ backgroundColor: "$color3" }}
          >
            <RefreshCcw size={14} />
          </Button>

          <Button
            type="button"
            onClick={onOpenExternal}
            title="Open preview in a new tab"
            aria-label="Open preview in a new tab"
            variant="ghost"
            size="icon-sm" borderRadius="$5" hoverStyle={{ backgroundColor: "$color3" }}
          >
            <ExternalLink size={14} />
          </Button>
        </XStack>
      </XStack>

      {/* RIGHT — the actions. NEVER shrinks: it holds the primary, and a
          primary you cannot press is not a primary.

          This carried `flex={1}` and that was the overlap. `flex: 1` is
          `1 1 0%` — basis ZERO — so the cluster's own size is nothing and it
          only ever gets LEFTOVER space. With the left and centre clusters both
          `flexShrink: 0` there was no leftover, so it measured 15px at 390 and
          44px at 834 while holding Share AND Publish, and its children spilled
          out and painted over the tabs:

            mobile 390px   actions box 15px   4 overlapping pairs
            tablet 834px   actions box 44px   2 overlapping pairs
            laptop 1440px  actions box 684px  none

          The note this replaces reasoned that growing "is the whole job — it is
          what carries justifyContent flex-end". Growing does push the cluster
          right, but it cannot protect it: a `flex-basis: 0` box has no size of
          its own to defend. The CENTRE cluster grows instead, which pushes this
          one to the right edge just the same, and this one is now sized by its
          contents and pinned. */}
      <XStack flexShrink={0} alignItems="center" gap="$1.5" $lg={{ gap: "$2" }}>
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
