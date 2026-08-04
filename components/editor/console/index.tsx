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
    <SizableText aria-hidden color="$color11">
      ·
    </SizableText>
  );
}

export function Console({
  isAiWorking,
  pageCount,
  sidebarCollapsed,
  onToggleSidebar,
}: {
  isAiWorking: boolean;
  pageCount: number;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const { height, open, setHeight, toggle, nudge } = useDock();
  const { entries } = usePreviewConsole();
  // The composer's voice, drawn here. Null until a composer is mounted.
  const voice = useMic();

  // Builder projects are single-branch by construction: git-on-publish commits
  // to `main`. The editor's Project carries no branch field, so state it rather
  // than invent one from a type that cannot hold it.
  const branch = "main";

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
          position="absolute" top={0} right={0} bottom={0} left={0} cursor="row-resize" userSelect="none" borderTopWidth={1} borderColor="$borderColor" focusVisibleStyle={{ outlineWidth: 0 }} group="dock"
        >
          {/* The affordance: a hairline that lifts and a grip that fades in on
              hover, focus or drag. Nothing is drawn while the bar is at rest. */}
          <SizableText pointerEvents="none" position="absolute" left="$0" right="$0" top="$0" height={1} backgroundColor="transparent" $group-dock-hover={{ backgroundColor: "$color" }} $group-dock-focus={{ backgroundColor: "$color" }} $group-dock-press={{ backgroundColor: "$color" }} />
          <SizableText pointerEvents="none" position="absolute" left="50%" top={3} height="$1" width="$6" x="50%" borderRadius="$10" backgroundColor="transparent" $group-dock-hover={{ backgroundColor: "$color" }} $group-dock-focus={{ backgroundColor: "$color" }} $group-dock-press={{ backgroundColor: "$color" }} />
        </YStack>

        {/* State, inert: it rides on the bar but never eats the drag. */}
        <SizableText pointerEvents="none" position="relative" height="100%" alignItems="center" gap="$2.5" paddingLeft="$3" paddingRight="4.75rem" fontSize={11} color="$color11" display="flex" flexDirection="row">
          <SizableText alignItems="center" gap="$1.5">
            <SizableText position="relative" width="$1.5" height="$1.5" alignItems="center" justifyContent="center">
              <SizableText position="absolute" width="$1.5" height="$1.5" borderRadius="$10" backgroundColor="var(--brand-accent)" opacity={0.6} />
              <SizableText position="relative" width="$1.5" height="$1.5" borderRadius="$10" backgroundColor="var(--brand-accent)" />
            </SizableText>
            Live
          </SizableText>
          <Sep />
          <span>{isAiWorking ? "Building…" : "Auto-saved"}</span>
          <Sep />
          <SizableText alignItems="center" gap="$1">
            <GitBranch size={12} />
            {branch}
          </SizableText>
          <Sep />
          <span>
            {pageCount} file{pageCount === 1 ? "" : "s"}
          </span>
          <SizableText marginLeft="auto" alignItems="center" gap="$1">
            {isAiWorking ? (
              <SizableText className="thread-shimmer-text">Working</SizableText>
            ) : (
              <>
                <Check size={12} />
                Ready
              </>
            )}
          </SizableText>
        </SizableText>

        {/* Far right — the workspace controls, floated over the bar so the
            separator underneath stays one clean, uninterrupted drag target. */}
        <XStack position="absolute" right="$2" top="$0" height="100%" alignItems="center" gap="$0.5">
          <Button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Chat panel"
            aria-expanded={!sidebarCollapsed}
            width="$4.5" height="$4.5" alignItems="center" justifyContent="center" borderRadius="$2" color="$color11" hoverStyle={{ backgroundColor: "$color", color: "$color" }} focusVisibleStyle={{ outlineWidth: 0 }}
          >
            {sidebarCollapsed ? (
              <PanelLeft size={14} />
            ) : (
              <PanelLeftClose size={14} />
            )}
          </Button>
          {voice && (
            <Voice
              voice={voice}
              disabled={isAiWorking}
              className="voice-control"
  />
          )}
        </XStack>
      </YStack>

      {open && (
        <SizableText minHeight={0} flex={1} borderTopWidth={1} borderColor="$borderColor" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2" fontFamily="$mono" fontSize={11} lineHeight={1.625} overflow="scroll" display="flex" flexDirection="column">
          {entries.length === 0 ? (
            <Paragraph color="$color11">
              Nothing logged yet — output and errors from the preview appear here.
            </Paragraph>
          ) : (
            entries.map((entry) => (
              <Paragraph
                key={entry.id}
                whiteSpace="pre-wrap" wordBreak="break-word" {...{ color: entry.level === "error" ? "var(--destructive)" : entry.level === "warn"
                      ? "$color"
                      : "$color11" }}
              >
                {entry.text}
              </Paragraph>
            ))
          )}
          <div ref={tail} />
        </SizableText>
      )}
    </YStack>
  );
}
