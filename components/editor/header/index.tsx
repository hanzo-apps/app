'use client';

import { XStack, SizableText, YStack } from '@hanzo/ui';
import { Children, ReactNode, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ExternalLink,
  History,
  Monitor,
  PanelLeft,
  RefreshCcw,
  Smartphone,
} from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger, Button } from '@hanzo/ui';
import { accent, selected } from "@/lib/chrome";
import { HanzoLogo } from "@/components/HanzoLogo";
import { PagePanel } from "@/components/editor/page-navigator";
import { WorkspaceMenu } from "@/components/editor/workspace-menu";
import type { Page, Project } from "@/types";
// The panes come from `lib/panes` — the switcher and the body read one list, so
// a pane cannot appear in the bar and render nothing.
import { PANES, paneLabel } from "@/lib/panes";
import { pageName } from "@/lib/pages/name";

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
  booted = true,
  leftWidth = 0,
  chatOpen,
  onToggleChat,
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
  /**
   * Whether there is a workspace to switch around. A fresh project boots as
   * conversation alone, and the pane pills + preview tooling describe an app
   * that does not exist yet — chrome for a missing thing reads as broken.
   */
  booted?: boolean;
  /**
   * The chat pane's current width in px (0 = none docked). The bar mirrors the
   * split below it: identity sits over the chat, the pane switcher and the
   * preview tooling sit over the pane they control. Without this the switcher
   * floated beside the project name while its subject was half a screen away.
   */
  leftWidth?: number;
  /** Whether the chat column is showing. */
  chatOpen?: boolean;
  /** Show/hide the chat column — the PanelLeft toggle, in the reference's seat. */
  onToggleChat?: () => void;
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
      <XStack flexShrink={1} minWidth={0} alignItems="center" gap="$1.5" overflow="scroll" className="no-scrollbar" {...(leftWidth > 0 ? { $lg: { width: leftWidth, flexShrink: 0 } } : null)}>
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
            display="none" $lg={{ display: "flex" }} size="icon-sm" borderRadius={999} {...{ ...selected(Boolean(historyOpen)), hoverStyle: historyOpen ? undefined : { backgroundColor: "$color3" } }}
          >
            <History size={16} />
          </Button>
        )}
        {/* The chat-column toggle, beside history — the reference's seat for it,
            and now its ONLY seat: it lived on the console bar, which is where
            you look for the SHELL, not for the chat. One glyph (PanelLeft, the
            fleet rule), state on aria-expanded. */}
        {onToggleChat && (
          <Button
            type="button"
            onClick={onToggleChat}
            title={chatOpen ? "Hide chat" : "Show chat"}
            aria-label="Chat panel"
            aria-expanded={Boolean(chatOpen)}
            variant="ghost"
            display="none" $lg={{ display: "flex" }} size="icon-sm" borderRadius={999} hoverStyle={{ backgroundColor: "$color3" }}
          >
            <PanelLeft size={16} />
          </Button>
        )}
      </XStack>

        {/* NO group fill and NO group radius.

            The segments used to sit in a `$color3` trough, which is the shape a
            SEGMENTED control has — every option equally present, one of them
            marked. This bar is not that: it is a set of places to go, and the
            one you are in is the loud thing. So the inactive panes are bare
            glyphs on the bar itself, and the active one is the raised
            pushbutton (`accent` — $color5 on $color6) wearing its own name.
            A trough behind that pill would draw a box around the only element
            that is already a box. */}
        {booted && (
        <XStack
          role="tablist"
          aria-label="Editor view"
          flexShrink={0} alignItems="center" gap="$0.5" borderRadius="$5" backgroundColor="$color3"
        >
          {PANES.map((item) => {
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
                // ONE size for both states (`sm` = 32), so switching panes never
                // changes the bar's height. A size variant sets a `minHeight`
                // FLOOR, not a height, and a style prop cannot argue a floor
                // down — asking for 28 here once drew 36 and left a 2px halo of
                // group showing round the hover. Ask the ladder for a size.
                //
                // The active pane is the pushbutton and carries its LABEL; the
                // rest are glyphs. That is why only this one is `accent` and why
                // only this one gets horizontal padding worth the name: a label
                // needs room, an icon needs a square.
                size="sm" alignItems="center" gap="$1.5" borderRadius="$3" paddingHorizontal={active ? "$3" : "$2"} {...{ $lg: "mobileOnly" in item && item.mobileOnly ? {"display":"none"} : undefined, ...(active ? { ...accent, borderWidth: 0 } : sel), hoverStyle: active ? undefined : { backgroundColor: "$color4" } }}
              >
                <SizableText color={active ? accent.color : sel.color}>
                  <item.icon size={16} />
                </SizableText>
                {/* The label belongs to the ACTIVE pane only. Every pane wearing
                    its name turns a row of destinations into a menu bar, and the
                    bar has three other clusters to fit; every pane wearing NONE
                    leaves the open pane unnamed. One label, on the one that
                    matters, is also what the reference does. */}
                {active && (
                  <SizableText display="none" $sm={{ display: "inline" }} color={accent.color}>
                    {item.label}
                  </SizableText>
                )}
              </Button>
            );
          })}
        </XStack>
        )}

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
          its room below $sm, because it is a label and these are the tools.

          `center-safe`, a CLASS rather than `justifyContent="center"`, because
          this row scrolls. Plain centring overflows equally in BOTH directions
          and the half that goes past the scroll origin cannot be scrolled back
          to — at 390px this box holds 254px of controls in 128px, so the
          Preview/Code tabs would sit permanently out of reach. CSS
          `justify-content: safe center` centres while it fits and falls back to
          start the moment it does not; there is no gui prop that says that. */}
      {!booted ? (
        /* Boot: nothing to point tooling at — the flexible middle still grows
           so the right cluster stays pinned to the edge. */
        <XStack flexGrow={1} flexShrink={1} flexBasis="auto" minWidth={0} />
      ) : (
      <XStack alignItems="center" gap="$2" flexGrow={1} flexShrink={1} flexBasis="auto" minWidth={0} overflow="scroll" className="no-scrollbar center-safe">

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
          {/* `size="sm"` (32) — this sits between the two segmented groups and
                has to be their height exactly. It said `height={32}` and drew 36:
                the size variant sets a `minHeight` FLOOR (default 36) and a style
                prop cannot argue a floor down, so the picker stood 4px proud of
                the groups on either side of it. */}
            <PopoverTrigger asChild>
              <Button
                type="button"
                title="Browse pages"
                aria-label="Browse pages"
                minWidth={0} $md={{ minWidth: 180 }} maxWidth="14rem" size="sm" alignItems="center" justifyContent="center" gap="$1.5" borderRadius="$4" backgroundColor="$color3" paddingHorizontal="$3" hoverStyle={{ backgroundColor: "$color4" }}
              >
                {/* The NAME, not the filename: a person calls index.html the
                    Homepage, and the picker inside still shows real paths for
                    anyone who needs them. */}
                <SizableText numberOfLines={1} fontSize="$2">
                  {pageName(currentPage)}
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



        <XStack display="none" $md={{ display: "flex" }} alignItems="center">
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
      )}

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
