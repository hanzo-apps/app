"use client";
import { useUpdateEffect } from "react-use";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";
import { toast } from "@hanzo/ui";
import { Maximize2, Minimize2 } from "lucide-react";
import { useThrottleFn } from "react-use";

import { cn } from "@/lib/utils";
import { GridPattern } from "@/components/magic-ui/grid-pattern";
import { htmlTagToText } from "@/lib/html-tag-to-text";
import { isTheSameHtml } from "@/lib/compare-html-diff";
import { Page } from "@/types";

/**
 * The idle/building overlay — the preview is NEVER a flat black rect. It covers
 * the (theme-agnostic) idle iframe with a THEME-AWARE canvas: while building, a
 * skeleton → wireframe pulse; when idle, the empty-state invite + a blinking
 * cursor. Both sit on the subtle `.preview-stage` grid, correct in light + dark.
 */
function PreviewOverlay({ building }: { building: boolean }) {
  return (
    <div className="preview-stage pointer-events-none absolute inset-0 z-[5] flex items-center justify-center bg-background">
      {building ? (
        <div className="w-full max-w-2xl px-8">
          <div className="mx-auto flex flex-col gap-3">
            <div className="h-8 w-1/3 rounded-md bg-foreground/[0.06] animate-pulse" />
            <div className="h-28 w-full rounded-lg bg-foreground/[0.05] animate-pulse [animation-delay:120ms]" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-20 rounded-lg bg-foreground/[0.05] animate-pulse [animation-delay:200ms]" />
              <div className="h-20 rounded-lg bg-foreground/[0.05] animate-pulse [animation-delay:280ms]" />
              <div className="h-20 rounded-lg bg-foreground/[0.05] animate-pulse [animation-delay:360ms]" />
            </div>
            <div className="h-4 w-2/3 rounded bg-foreground/[0.06] animate-pulse [animation-delay:440ms]" />
            <div className="h-4 w-1/2 rounded bg-foreground/[0.06] animate-pulse [animation-delay:520ms]" />
          </div>
          <p className="mt-6 text-center text-[13px]">
            <span className="thread-shimmer-text">Building your app…</span>
          </p>
        </div>
      ) : (
        <div className="max-w-sm px-8 text-center">
          <p className="text-[15px] font-semibold text-foreground">Describe your idea.</p>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            <span aria-hidden className="mr-1">↓</span>Watch Hanzo build it live
            <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-[3px] animate-pulse bg-foreground align-middle motion-reduce:animate-none" />
          </p>
        </div>
      )}
    </div>
  );
}

export const Preview = ({
  html,
  isResizing,
  isAiWorking,
  ref,
  device,
  currentTab,
  iframeRef,
  pages,
  setCurrentPage,
  isEditableModeEnabled,
  onClickElement,
}: {
  html: string;
  isResizing: boolean;
  isAiWorking: boolean;
  pages: Page[];
  setCurrentPage: React.Dispatch<React.SetStateAction<string>>;
  ref: React.RefObject<HTMLDivElement | null>;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
  device: "desktop" | "mobile";
  currentTab: string;
  isEditableModeEnabled?: boolean;
  onClickElement?: (element: HTMLElement) => void;
}) => {
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(
    null
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen expands the preview container to a true fullscreen surface via the
  // native Fullscreen API; the browser restores it on Escape (or on our own
  // toggle). We mirror the platform state so the button icon always reflects the
  // real fullscreen status, even when the user presses Escape directly.
  const toggleFullscreen = useCallback(() => {
    const el = ref?.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {
        toast.error("Fullscreen isn't available in this browser.");
      });
    }
  }, [ref]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const handleMouseOver = (event: MouseEvent) => {
    if (iframeRef?.current) {
      const iframeDocument = iframeRef.current.contentDocument;
      if (iframeDocument) {
        const targetElement = event.target as HTMLElement;
        if (
          hoveredElement !== targetElement &&
          targetElement !== iframeDocument.body
        ) {
          setHoveredElement(targetElement);
          targetElement.classList.add("hovered-element");
        } else {
          return setHoveredElement(null);
        }
      }
    }
  };
  const handleMouseOut = () => {
    setHoveredElement(null);
  };
  const handleClick = (event: MouseEvent) => {
    if (iframeRef?.current) {
      const iframeDocument = iframeRef.current.contentDocument;
      if (iframeDocument) {
        const targetElement = event.target as HTMLElement;
        if (targetElement !== iframeDocument.body) {
          onClickElement?.(targetElement);
        }
      }
    }
  };
  const handleCustomNavigation = (event: MouseEvent) => {
    if (iframeRef?.current) {
      const iframeDocument = iframeRef.current.contentDocument;
      if (iframeDocument) {
        const findClosestAnchor = (
          element: HTMLElement
        ): HTMLAnchorElement | null => {
          let current = element;
          while (current && current !== iframeDocument.body) {
            if (current.tagName === "A") {
              return current as HTMLAnchorElement;
            }
            current = current.parentElement as HTMLElement;
          }
          return null;
        };

        const anchorElement = findClosestAnchor(event.target as HTMLElement);
        if (anchorElement) {
          let href = anchorElement.getAttribute("href");
          if (href) {
            event.stopPropagation();
            event.preventDefault();

            if (href.includes("#") && !href.includes(".html")) {
              const targetElement = iframeDocument.querySelector(href);
              if (targetElement) {
                targetElement.scrollIntoView({ behavior: "smooth" });
              }
              return;
            }

            href = href.split(".html")[0] + ".html";
            const isPageExist = pages.some((page) => page.path === href);
            if (isPageExist) {
              setCurrentPage(href);
            }
          }
        }
      }
    }
  };

  useUpdateEffect(() => {
    const cleanupListeners = () => {
      if (iframeRef?.current?.contentDocument) {
        const iframeDocument = iframeRef.current.contentDocument;
        iframeDocument.removeEventListener("mouseover", handleMouseOver);
        iframeDocument.removeEventListener("mouseout", handleMouseOut);
        iframeDocument.removeEventListener("click", handleClick);
      }
    };

    if (iframeRef?.current) {
      const iframeDocument = iframeRef.current.contentDocument;
      if (iframeDocument) {
        cleanupListeners();

        if (isEditableModeEnabled) {
          iframeDocument.addEventListener("mouseover", handleMouseOver);
          iframeDocument.addEventListener("mouseout", handleMouseOut);
          iframeDocument.addEventListener("click", handleClick);
        }
      }
    }

    return cleanupListeners;
  }, [iframeRef, isEditableModeEnabled]);

  const selectedElement = useMemo(() => {
    if (!isEditableModeEnabled) return null;
    if (!hoveredElement) return null;
    return hoveredElement;
  }, [hoveredElement, isEditableModeEnabled]);

  // ── Double-buffered preview ──────────────────────────────────────────────
  // Streaming a build used to write `srcDoc` on the ONE iframe every update —
  // each write is a full document teardown/reload → a visible white flash. We
  // now keep TWO stacked iframes: while the model streams, updates paint into
  // the HIDDEN back-buffer at a ≥500ms cadence; on its load event we crossfade
  // and swap roles, so the VISIBLE frame never reloads in place. Idle settles to
  // the single front frame (the parent's `iframeRef`), leaving the editable /
  // visual-editor path exactly as before.
  const iframeA = useRef<HTMLIFrameElement | null>(null);
  const iframeB = useRef<HTMLIFrameElement | null>(null);
  const [frontA, setFrontA] = useState(true);
  // Ref mirror of `frontA`, kept in lock-step so the back-buffer paint doesn't
  // depend on `frontA` state (which would repaint the new back on every swap
  // and ping-pong). It flips synchronously at the moment we reveal a frame.
  const frontRef = useRef(true);
  const [srcA, setSrcA] = useState(html);
  const [srcB, setSrcB] = useState("");
  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );
  // Back-buffer paint cadence (≥500ms) so long streams don't thrash the swap.
  const streamHtml = useThrottleFn((h: string) => h, 500, [html]) as string;

  // Keep the parent's ref (used by the visual editor / element selection)
  // pointed at whichever frame is currently visible.
  useEffect(() => {
    frontRef.current = frontA;
    if (iframeRef) iframeRef.current = frontA ? iframeA.current : iframeB.current;
  }, [frontA, iframeRef]);

  // Idle: settle the FRONT frame on the final html (one reload, no stream).
  useEffect(() => {
    if (isAiWorking) return;
    if (frontRef.current) setSrcA(html);
    else setSrcB(html);
  }, [html, isAiWorking]);

  // Streaming: paint the throttled html into the hidden BACK frame only. Depends
  // on the stream (not `frontA`) so a swap never re-triggers a paint.
  useEffect(() => {
    if (!isAiWorking) return;
    if (frontRef.current) setSrcB(streamHtml);
    else setSrcA(streamHtml);
  }, [streamHtml, isAiWorking]);

  const wireFrame = (el: HTMLIFrameElement | null) => {
    const doc = el?.contentWindow?.document;
    if (!doc) return;
    if (doc.body) {
      doc.body.scrollIntoView({
        block: isAiWorking ? "end" : "start",
        inline: "nearest",
        behavior: isAiWorking ? "instant" : "smooth",
      });
    }
    doc
      .querySelectorAll("a")
      .forEach((link) => link.addEventListener("click", handleCustomNavigation));
  };

  const handleFrameLoad = (which: "a" | "b") => {
    const isFront = (which === "a") === frontRef.current;
    wireFrame(which === "a" ? iframeA.current : iframeB.current);
    // The BACK frame just finished painting the newest stream → reveal it.
    // Flip the ref synchronously so the next stream paint targets the new back.
    if (isAiWorking && !isFront) {
      frontRef.current = !frontRef.current;
      setFrontA(frontRef.current);
    }
  };

  // Idle default vs real generated content — drives the themed overlay so the
  // preview is never a flat black rect (the default iframe is dark by design).
  const isEmpty = useMemo(() => isTheSameHtml(html), [html]);

  const frameClass = (visible: boolean) =>
    classNames(
      "absolute inset-0 w-full select-none bg-background h-full transition-opacity ease-out",
      {
        "opacity-100": visible,
        "opacity-0": !visible,
        "pointer-events-none": !visible || isResizing || isAiWorking,
        "lg:max-w-md lg:mx-auto lg:!rounded-[42px] lg:border-[8px] lg:border-border lg:shadow-2xl lg:h-[80dvh] lg:max-h-[996px]":
          device === "mobile" && !isFullscreen,
        "!h-full !max-w-none !rounded-none !border-0 !ring-0": isFullscreen,
      }
    );
  const frameStyle = { transitionDuration: reduced ? "0ms" : "180ms" };

  return (
    <div
      ref={ref}
      className={classNames(
        // No border/padding seam here — the raised preview CARD (in the editor
        // shell) owns the frame; this just fills it edge-to-edge.
        "group/preview w-full h-full relative z-0 flex items-center justify-center bg-background",
        {
          "max-lg:h-0": currentTab === "chat" && !isFullscreen,
          "max-lg:h-full": currentTab === "preview",
          // In native fullscreen the container IS the fullscreen surface — go
          // edge-to-edge and force full height so the iframe fills the screen
          // regardless of the current tab/device.
          "!h-full !p-0": isFullscreen,
        }
      )}
      onClick={(e) => {
        if (isAiWorking) {
          e.preventDefault();
          e.stopPropagation();
          toast.warning("Please wait for the AI to finish working.");
        }
      }}
    >
      {/* Fullscreen toggle — pinned to the elevated preview surface. Escape (or a
          second press) restores; the icon mirrors the real fullscreen state. */}
      <button
        type="button"
        onClick={toggleFullscreen}
        title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen preview"}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        aria-pressed={isFullscreen}
        className={classNames(
          "absolute right-3 z-20 inline-flex size-9 items-center justify-center rounded-lg bg-card/80 text-muted-foreground ring-1 ring-border backdrop-blur transition-all hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          // Fade in on hover of the surface (always visible while fullscreen).
          isFullscreen
            ? "top-3 opacity-100"
            : "top-6 opacity-0 group-hover/preview:opacity-100 focus-visible:opacity-100"
        )}
      >
        {isFullscreen ? (
          <Minimize2 className="size-4" />
        ) : (
          <Maximize2 className="size-4" />
        )}
      </button>
      <GridPattern
        x={-1}
        y={-1}
        strokeDasharray={"4 2"}
        className={cn(
          "[mask-image:radial-gradient(900px_circle_at_center,white,transparent)]"
        )}
      />
      {!isAiWorking && hoveredElement && selectedElement && (
        <div
          className="cursor-pointer absolute bg-white/10 border-[2px] border-dashed border-white rounded-r-lg rounded-b-lg p-3 z-10 pointer-events-none"
          style={{
            top:
              selectedElement.getBoundingClientRect().top +
              (currentTab === "preview" ? 0 : 24),
            left:
              selectedElement.getBoundingClientRect().left +
              (currentTab === "preview" ? 0 : 24),
            width: selectedElement.getBoundingClientRect().width,
            height: selectedElement.getBoundingClientRect().height,
          }}
        >
          <span className="bg-white rounded-t-md text-sm text-neutral-900 px-2 py-0.5 -translate-y-7 absolute top-0 left-0">
            {htmlTagToText(selectedElement.tagName.toLowerCase())}
          </span>
        </div>
      )}
      {/* Two stacked frames: the visible one holds the settled/streamed result;
          the hidden one paints the next stream update and crossfades in on load.
          The container fills the surface so both frames share the same box. */}
      <div className="relative h-full w-full">
        <iframe
          id={frontA ? "preview-iframe" : undefined}
          ref={iframeA}
          title="output"
          className={frameClass(frontA)}
          style={frameStyle}
          srcDoc={srcA}
          onLoad={() => handleFrameLoad("a")}
        />
        <iframe
          id={!frontA ? "preview-iframe" : undefined}
          ref={iframeB}
          title="output"
          aria-hidden={frontA}
          className={frameClass(!frontA)}
          style={frameStyle}
          srcDoc={srcB}
          onLoad={() => handleFrameLoad("b")}
        />
      </div>
      {/* Themed idle/building canvas over the (dark-by-design) default iframe —
          only while nothing real has been generated yet. Real streamed/settled
          HTML clears `isEmpty`, revealing the iframe underneath. */}
      {isEmpty && <PreviewOverlay building={isAiWorking} />}
    </div>
  );
};
