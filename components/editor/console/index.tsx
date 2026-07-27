"use client";

import { useEffect, useRef } from "react";
import { Check, GitBranch, PanelLeft, PanelLeftClose } from "lucide-react";
import classNames from "classnames";

import { VoiceInput } from "@/components/editor/ask-ai/voice-input";
import { dictate } from "@/components/editor/ask-ai/dictation";

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
    <span aria-hidden className="text-muted-foreground/40">
      ·
    </span>
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
    <footer
      data-console
      className="relative z-20 flex shrink-0 flex-col overflow-hidden bg-card"
      style={{ height }}
    >
      <div className="relative shrink-0" style={{ height: BAR }}>
        <div
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
          className="group/dock absolute inset-0 cursor-row-resize touch-none select-none border-t border-border focus-visible:outline-none"
        >
          {/* The affordance: a hairline that lifts and a grip that fades in on
              hover, focus or drag. Nothing is drawn while the bar is at rest. */}
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-transparent transition-colors duration-150 group-hover/dock:bg-foreground/20 group-focus-visible/dock:bg-foreground/30 group-active/dock:bg-foreground/30" />
          <span className="pointer-events-none absolute left-1/2 top-[3px] h-1 w-8 -translate-x-1/2 rounded-full bg-transparent transition-colors duration-150 group-hover/dock:bg-foreground/30 group-focus-visible/dock:bg-foreground/45 group-active/dock:bg-foreground/45" />
        </div>

        {/* State, inert: it rides on the bar but never eats the drag. */}
        <div className="pointer-events-none relative flex h-full items-center gap-2.5 pl-3 pr-[4.75rem] text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="relative flex size-1.5 items-center justify-center">
              <span className="absolute inline-flex size-1.5 animate-ping rounded-full bg-[var(--brand-accent)] opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[var(--brand-accent)]" />
            </span>
            Live
          </span>
          <Sep />
          <span>{isAiWorking ? "Building…" : "Auto-saved"}</span>
          <Sep />
          <span className="inline-flex items-center gap-1">
            <GitBranch className="size-3" />
            {branch}
          </span>
          <Sep />
          <span>
            {pageCount} file{pageCount === 1 ? "" : "s"}
          </span>
          <span className="ml-auto inline-flex items-center gap-1">
            {isAiWorking ? (
              <span className="thread-shimmer-text">Working</span>
            ) : (
              <>
                <Check className="size-3" />
                Ready
              </>
            )}
          </span>
        </div>

        {/* Far right — the workspace controls, floated over the bar so the
            separator underneath stays one clean, uninterrupted drag target. */}
        <div className="absolute right-2 top-0 flex h-full items-center gap-0.5">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Chat panel"
            aria-expanded={!sidebarCollapsed}
            className="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {sidebarCollapsed ? (
              <PanelLeft className="size-3.5" />
            ) : (
              <PanelLeftClose className="size-3.5" />
            )}
          </button>
          <span className="flex items-center [&_button]:size-5 [&_button]:min-w-0 [&_svg]:size-3.5">
            <VoiceInput onTranscript={dictate} disabled={isAiWorking} />
          </span>
        </div>
      </div>

      {open && (
        <div className="min-h-0 flex-1 overflow-y-auto border-t border-border bg-background px-3 py-2 font-mono text-[11px] leading-relaxed">
          {entries.length === 0 ? (
            <p className="text-muted-foreground">
              Nothing logged yet — output and errors from the preview appear here.
            </p>
          ) : (
            entries.map((entry) => (
              <p
                key={entry.id}
                className={classNames(
                  "whitespace-pre-wrap break-words",
                  entry.level === "error"
                    ? "text-destructive"
                    : entry.level === "warn"
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {entry.text}
              </p>
            ))
          )}
          <div ref={tail} />
        </div>
      )}
    </footer>
  );
}
