"use client";
import { XStack, YStack, Paragraph, SizableText, type GuiElement } from '@hanzo/gui';
import { useUpdateEffect } from "react-use";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast, Button } from '@hanzo/ui';
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
    <XStack pointerEvents="none" position="absolute" top={0} right={0} bottom={0} left={0} zIndex={5} alignItems="center" justifyContent="center" backgroundColor="$background" className="preview-stage">
      {building ? (
        <YStack width="100%" maxWidth={672} paddingHorizontal="$6">
          <YStack alignSelf="center" gap="$3">
            <YStack height="$6" width="33.333%" borderRadius="$3" backgroundColor="$color4" className="skeleton" />
            <YStack height="$13" width="100%" borderRadius="$5" backgroundColor="$color4" className="skeleton" style={{ animationDelay: "120ms" }} />
            <YStack gap="$3">
              <YStack height="$11" borderRadius="$5" backgroundColor="$color4" className="skeleton" style={{ animationDelay: "200ms" }} />
              <YStack height="$11" borderRadius="$5" backgroundColor="$color4" className="skeleton" style={{ animationDelay: "280ms" }} />
              <YStack height="$11" borderRadius="$5" backgroundColor="$color4" className="skeleton" style={{ animationDelay: "360ms" }} />
            </YStack>
            <YStack height="$4" width="66.667%" borderRadius="$2" backgroundColor="$color4" className="skeleton" style={{ animationDelay: "440ms" }} />
            <YStack height="$4" width="50%" borderRadius="$2" backgroundColor="$color4" className="skeleton" style={{ animationDelay: "520ms" }} />
          </YStack>
          <Paragraph marginTop="$5" textAlign="center" fontSize={13}>
            <SizableText className="thread-shimmer-text">Building your app…</SizableText>
          </Paragraph>
        </YStack>
      ) : (
        <YStack maxWidth={384} paddingHorizontal="$6">
          <Paragraph fontSize={15} fontWeight="600" color="$color">Describe your idea.</Paragraph>
          <Paragraph marginTop="$1.5" fontSize={13} color="$color11">
            <SizableText aria-hidden marginRight="$1">↓</SizableText>Watch Hanzo build it live
            <SizableText marginLeft="$0.5" height="$4" width={2} y={3} backgroundColor="$color" verticalAlign="middle" />
          </Paragraph>
        </YStack>
      )}
    </XStack>
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

  // The iframe is an atomic host element: gui cannot style it, so its fill
  // lives in one app CSS rule and everything that VARIES is a style prop on the
  // box around it.
  const frameBox = (visible: boolean) => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: visible ? 1 : 0,
    pointerEvents: (!visible || isResizing || isAiWorking ? 'none' : 'auto') as 'none' | 'auto',
    backgroundColor: '$background',
    userSelect: 'none' as const,
    ...(device === 'mobile' && !isFullscreen
      ? { $lg: { maxWidth: 448, alignSelf: 'center' as const, borderRadius: 42, borderWidth: 8, borderColor: '$borderColor', height: '80dvh', maxHeight: 996 } }
      : null),
    ...(isFullscreen ? { height: '100%', maxWidth: 'none', borderRadius: 0, borderWidth: 0 } : null),
  })
  const frameStyle = { transitionDuration: reduced ? "0ms" : "180ms" };

  return (
    <XStack
      ref={ref as React.Ref<GuiElement>}
      width="100%" position="relative" zIndex={0} alignItems="center" justifyContent="center" backgroundColor="$background" {...{ $lg: currentTab === "preview" ? {"height":"100%"} : currentTab === "chat" && !isFullscreen ? {"height":"$0"} : undefined, height: isFullscreen ? "100%" : "100%", padding: isFullscreen ? "$0" : undefined }}
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
      <Button
        type="button"
        onClick={toggleFullscreen}
        title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen preview"}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        aria-pressed={isFullscreen}
        group
        position="absolute" right="$3" zIndex={20} width={36} height={36} alignItems="center" justifyContent="center" borderRadius="$5" backgroundColor="$background" backdropFilter="blur(8px)" hoverStyle={{ backgroundColor: "$color3" }} {...{ top: isFullscreen ? "$3" : "$5", opacity: isFullscreen ? 1 : 0, "$group-preview-hover": isFullscreen ? undefined : {"opacity":1}, focusVisibleStyle: isFullscreen ? { outlineWidth: 0 } : {"opacity":1} }}
      >
        <SizableText color="$color11" $group-hover={{ color: "$color" }}>
          {isFullscreen ? (
            <Minimize2 size={16} />
          ) : (
            <Maximize2 size={16} />
          )}
        </SizableText>
      </Button>
      <GridPattern
        x={-1}
        y={-1}
        strokeDasharray={"4 2"}
        className="preview-grid"
  />
      {!isAiWorking && hoveredElement && selectedElement && (
        <YStack
          cursor="pointer" position="absolute" backgroundColor="$color01" borderWidth={1} borderColor="$color" borderStyle="dashed" borderTopRightRadius="$5" borderBottomRightRadius="$5" borderBottomLeftRadius="$5" padding="$3" zIndex={10} pointerEvents="none"
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
          <SizableText backgroundColor="$color5" borderWidth={1} borderColor="$color6" borderTopLeftRadius="$3" borderTopRightRadius="$3" fontSize="$3" color="$color12" paddingHorizontal="$2" paddingVertical="$0.5" y={-28} position="absolute" top="$0" left="$0">
            {htmlTagToText(selectedElement.tagName.toLowerCase())}
          </SizableText>
        </YStack>
      )}
      {/* Two stacked frames: the visible one holds the settled/streamed result;
          the hidden one paints the next stream update and crossfades in on load.
          The container fills the surface so both frames share the same box. */}
      <YStack position="relative" height="100%" width="100%">
        <YStack overflow="hidden" {...frameBox(frontA)}>
          <iframe
            id={frontA ? "preview-iframe" : undefined}
            ref={iframeA}
            title="output"
            className="preview-frame"
            style={frameStyle}
            srcDoc={srcA}
            onLoad={() => handleFrameLoad("a")}
          />
        </YStack>
        <YStack overflow="hidden" {...frameBox(!frontA)}>
          <iframe
            id={!frontA ? "preview-iframe" : undefined}
            ref={iframeB}
            title="output"
            aria-hidden={frontA}
            className="preview-frame"
            style={frameStyle}
            srcDoc={srcB}
            onLoad={() => handleFrameLoad("b")}
          />
        </YStack>
      </YStack>
      {/* Themed idle/building canvas over the (dark-by-design) default iframe —
          only while nothing real has been generated yet. Real streamed/settled
          HTML clears `isEmpty`, revealing the iframe underneath. */}
      {isEmpty && <PreviewOverlay building={isAiWorking} />}
    </XStack>
  );
};
