"use client";

import { Button } from '@hanzo/ui';
import { SizableText, YStack, XStack, Paragraph } from '@hanzo/gui';
import { useEffect, useRef } from "react";
import { Check, GitBranch, PanelLeft, PanelLeftClose } from "lucide-react";

import { Voice } from "@hanzo/voice";

import { useMic } from "@/components/editor/ask-ai/mic";

import { BAR, MIN_OPEN, STEP, maxOpen, useDock } from "./dock";
import { usePreviewConsole } from "./capture";

/**
 * The developer console — the builder's bottom dock.
 *
 * Its BAR is the thin strip of real state the builder always showed (live ·
 * autosave · branch · files · ready), and it is now also the handle: hover it
 * for a row-resize cursor and a grip, drag it up for a taller console, click it
 * to open to the last size you dragged it to, arrow-key it for fine control.
 *
 * The bar carries no verb — no "Open", no "Hide". The cursor, the grip and the
 * click ARE the affordance; screen readers get `aria-expanded` on a named
 * separator instead of a word that goes stale the moment it is toggled.
 *
 * Far right sit the two controls that belong to the workspace rather than the
 * top bar: the chat/AI panel toggle and the dictation mic.
 */
function Sep() {
  return (
    <SizableText aria-hidden fontSize={11} color="$color11">
      ·
    </SizableText>
  );
}

export function Console({
  isAiWorking,
  saveText,
  branch,
  pageCount,
  sidebarCollapsed,
  onToggleSidebar,
}: {
  isAiWorking: boolean;
  /** Honest persistence state — see lib/pages/save-label. */
  saveText: string;
  /** The linked repo's branch, or undefined when the project has no repo. */
  branch?: string;
  pageCount: number;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const { height, open, setHeight, toggle, nudge } = useDock();
  const { entries } = usePreviewConsole();
  // The composer's voice, drawn here. Null until a composer is mounted.
  const voice = useMic();

  // OLD: `const branch = "main"` — stated unconditionally. Builder projects are
  // single-branch when they have a repo, but MOST HAVE NONE: the only paths that
  // create one are publish and an explicit git sync. So the bar drew a branch
  // icon and a branch name for a project that was never version-controlled,
  // which is chrome asserting a fact nothing checked.
  // Kept for reference; the real value now arrives as a prop.
  // Builder projects are single-branch by construction: git-on-publish commits
  // to `main`. The editor's Project carries no branch field, so state it rather
  // than invent one from a type that cannot hold it.
  // (superseded by the `branch` prop)

  // One gesture, two meanings: a pointer that moved is a resize, a pointer that
  // did not is a click — so drag and click-to-expand act on the same height,
  // with no second "expanded" flag that could disagree with it.
  const drag = useRef<{ y: number; base: number; moved: boolean } | null>(null);

  const tail = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (open) tail.current?.scrollIntoView({ block: "end" });
  }, [entries, open]);

  return (
    <YStack
      data-console
      position="relative" zIndex={20} flexShrink={0} overflow="hidden" backgroundColor="$background"
      style={{ height }}
    >
      <YStack position="relative" flexShrink={0} style={{ height: BAR }}>
        <YStack
          role="separator"
          aria-orientation="horizontal"
          aria-label="Console"
          aria-expanded={open}
          aria-valuenow={height}
          aria-valuemin={BAR}
          aria-valuemax={
            typeof window === "undefined" ? MIN_OPEN : maxOpen(window.innerHeight)
          }
          tabIndex={0}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // Capture is an optimisation (it keeps the drag alive outside the
              // bar); it throws for a pointer the browser no longer tracks, and
              // a dock that cannot capture must still resize.
            }
            // Starting collapsed, the drag begins at the minimum open height so
            // the first pixel upwards opens the dock and then tracks the cursor
            // 1:1 — no dead travel before anything happens.
            drag.current = {
              y: e.clientY,
              base: open ? height : MIN_OPEN,
              moved: false,
            };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            const delta = d.y - e.clientY; // dragging up makes it taller
            if (Math.abs(delta) > 3) d.moved = true;
            if (d.moved) setHeight(d.base + delta);
          }}
          onPointerUp={(e) => {
            const d = drag.current;
            drag.current = null;
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
              e.currentTarget.releasePointerCapture(e.pointerId);
            }
            if (d && !d.moved) toggle();
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") nudge(e.shiftKey ? STEP * 4 : STEP);
            else if (e.key === "ArrowDown") nudge(-(e.shiftKey ? STEP * 4 : STEP));
            else if (e.key === "Enter" || e.key === " ") toggle();
            else return;
            e.preventDefault();
          }}
          position="absolute" top={0} right={0} bottom={0} left={0} cursor="row-resize" userSelect="none" borderTopWidth={1} borderColor="$borderColor" focusVisibleStyle={{ outlineWidth: 0 }} group
        >
          {/* The affordance: a hairline that lifts and a grip that fades in on
              hover, focus or drag. Nothing is drawn while the bar is at rest. */}
          <SizableText pointerEvents="none" position="absolute" left="$0" right="$0" top="$0" height={1} backgroundColor="transparent" $group-hover={{ backgroundColor: "$color" }} $group-focus={{ backgroundColor: "$color" }} $group-press={{ backgroundColor: "$color" }} />
          <SizableText pointerEvents="none" position="absolute" left="50%" top={3} height="$1" width="$6" x="50%" borderRadius="$10" backgroundColor="transparent" $group-hover={{ backgroundColor: "$color" }} $group-focus={{ backgroundColor: "$color" }} $group-press={{ backgroundColor: "$color" }} />
        </YStack>

        {/* Far LEFT — the chat/AI panel toggle. It shows and hides the LEFT pane,
            so it belongs on the left: a right-side control that collapsed the left
            pane read as belonging to the preview, and people could not find it.
            Floated over the bar like the right cluster so the separator underneath
            stays one clean, uninterrupted drag target. */}
        <XStack position="absolute" left="$2" top="$0" height="100%" alignItems="center">
          <Button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Chat panel"
            aria-expanded={!sidebarCollapsed}
            group
            width="$4.5" height="$4.5" alignItems="center" justifyContent="center" borderRadius="$2" hoverStyle={{ backgroundColor: "$color" }} focusVisibleStyle={{ outlineWidth: 0 }}
          >
            <SizableText color="$color11" $group-hover={{ color: "$color" }}>
              {sidebarCollapsed ? (
                <PanelLeft size={14} />
              ) : (
                <PanelLeftClose size={14} />
              )}
            </SizableText>
          </Button>
        </XStack>

        {/* State, inert: it rides on the bar but never eats the drag. Padded to
            clear the panel toggle on the left and the mic + Enso on the right —
            measured clearances, so they stay the measurements they are. */}
        <XStack pointerEvents="none" position="relative" height="100%" alignItems="center" gap="$2.5" paddingLeft="2.25rem" paddingRight="4.25rem">
          <XStack alignItems="center" gap="$1.5">
            <XStack position="relative" width="$1.5" height="$1.5" alignItems="center" justifyContent="center">
              <SizableText position="absolute" width="$1.5" height="$1.5" borderRadius="$10" backgroundColor="var(--brand-accent)" opacity={0.6} />
              <SizableText position="relative" width="$1.5" height="$1.5" borderRadius="$10" backgroundColor="var(--brand-accent)" />
            </XStack>
            <SizableText fontSize={11} color="$color11">Live</SizableText>
          </XStack>
          <Sep />
          {/* The real save state. This said "Auto-saved" unconditionally, checked
              against nothing, while the project lived only in the browser. */}
          <SizableText fontSize={11} color="$color11">{isAiWorking ? "Building…" : saveText}</SizableText>
          {branch && (
            <>
              <Sep />
              <XStack alignItems="center" gap="$1">
                <GitBranch size={12} />
                <SizableText fontSize={11} color="$color11">{branch}</SizableText>
              </XStack>
            </>
          )}
          <Sep />
          <SizableText fontSize={11} color="$color11">
            {pageCount} file{pageCount === 1 ? "" : "s"}
          </SizableText>
          <XStack marginLeft="auto" alignItems="center" gap="$1">
            {isAiWorking ? (
              <SizableText className="thread-shimmer-text" fontSize={11} color="$color11">Working</SizableText>
            ) : (
              <>
                <Check size={12} />
                <SizableText fontSize={11} color="$color11">Ready</SizableText>
              </>
            )}
          </XStack>
        </XStack>

        {/* Far right — the workspace AI controls, floated over the bar so the
            separator underneath stays one clean, uninterrupted drag target.
            Order is mic then Enso: the mic is the conversation, Enso the editor,
            and the user asked for the mark to sit to the RIGHT of the mic. */}
        <XStack position="absolute" right="$2" top="$0" height="100%" alignItems="center" gap="$0.5">
          {voice && (
            <Voice
              voice={voice}
              disabled={isAiWorking}
              className="voice-control"
  />
          )}
          {/* Enso mounts HERE (public/edit.js, `hanzo:anchor` in app/dev/layout),
              to the RIGHT of the mic. It used to float at the viewport corner, on
              top of the customer's preview — so /dev turned it off entirely. In
              the control plane it is out of the canvas and beside the other
              workspace controls, which is where a tool for editing hanzo.app
              belongs. Anchored size is pinned small in public/edit.js. The host
              it injects is a descendant that arrives after render, so THAT one
              rule lives in assets/globals.css — see #enso-dock. */}
          <XStack id="enso-dock" alignItems="center" />
        </XStack>
      </YStack>

      {open && (
        <YStack minHeight={0} flex={1} borderTopWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2" overflow="scroll">
          {entries.length === 0 ? (
            <Paragraph fontFamily="$mono" fontSize={11} lineHeight={1.625} color="$color11">
              Nothing logged yet — output and errors from the preview appear here.
            </Paragraph>
          ) : (
            entries.map((entry) => (
              <Paragraph
                key={entry.id}
                className="break-words"
                fontFamily="$mono" fontSize={11} lineHeight={1.625}
                whiteSpace="pre-wrap" {...{ color: entry.level === "error" ? "var(--destructive)" : entry.level === "warn"
                      ? "$color"
                      : "$color11" }}
              >
                {entry.text}
              </Paragraph>
            ))
          )}
          <div ref={tail} />
        </YStack>
      )}
    </YStack>
  );
}
