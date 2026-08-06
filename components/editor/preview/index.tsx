"use client";
import { XStack, YStack, Paragraph, SizableText, type GuiElement } from '@hanzo/gui';
import { useUpdateEffect } from "react-use";
import { withBridge, isFrameEvent, command, type ElementInfo } from "./bridge";
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
  onClickElement?: (element: ElementInfo) => void;
}) => {
  // Serialisable, not a node: the frame is on its way to an opaque origin and a
  // DOM handle cannot survive that. The rect is what the overlay below needs.
  const [hoveredElement, setHoveredElement] = useState<{
    selector: string;
    tagName: string;
    rect: { top: number; left: number; width: number; height: number };
  } | null>(
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

  // ── The frame talks; we listen ───────────────────────────────────────────
  // This used to be four handlers bound onto `iframe.contentDocument`. That is
  // the access an opaque origin takes away, and it is the only reason this pane
  // still carries `allow-same-origin` while generated, imported and forked HTML
  // runs on the origin holding the IAM refresh token. Everything the pane needs
  // now arrives as a message from the injected bridge instead, addressed by CSS
  // selector rather than by node.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const frame = iframeRef?.current ?? null;
      if (!isFrameEvent(event, frame)) return;
      const msg = event.data;

      if (msg.type === "preview:hover") {
        setHoveredElement(
          msg.selector && msg.rect && msg.tagName
            ? { selector: msg.selector, tagName: msg.tagName, rect: msg.rect }
            : null,
        );
        return;
      }

      if (msg.type === "preview:select") {
        onClickElement?.(msg.info);
        return;
      }

      if (msg.type === "preview:navigate") {
        // Same rule as before: only a page this build actually has. An unknown
        // href is ignored rather than navigating the pane somewhere blank.
        const href = msg.path.split(".html")[0] + ".html";
        if (pages.some((page) => page.path === href)) setCurrentPage(href);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [iframeRef, onClickElement, pages, setCurrentPage]);

  // Editable mode is a command now, not a set of listeners we attach and detach.
  // Both frames are told: the double buffer means the one being written to is
  // not always the one in front.
  useUpdateEffect(() => {
    for (const ref of [iframeA, iframeB]) {
      command(ref.current, { type: "preview:editable", active: !!isEditableModeEnabled });
    }
    if (!isEditableModeEnabled) setHoveredElement(null);
  }, [isEditableModeEnabled]);

  const selectedElement = useMemo(
    () => (isEditableModeEnabled ? hoveredElement : null),
    [hoveredElement, isEditableModeEnabled],
  );

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

  // Follow the stream to the bottom while the model writes, settle at the top
  // when it stops. A command now: `contentWindow.document` is exactly what an
  // opaque origin denies. The anchor wiring that used to live here is gone —
  // the bridge intercepts link clicks in the document itself and sends
  // `preview:navigate`, so there is nothing to bind from out here.
  const wireFrame = (el: HTMLIFrameElement | null) => {
    command(el, {
      type: "preview:scroll",
      align: isAiWorking ? "end" : "start",
      smooth: !isAiWorking,
    });
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
        position="absolute" right="$3" zIndex={20} width={36} height={36} alignItems="center" justifyContent="center" borderRadius="$5" backgroundColor="$background" backdropFilter="blur(8px)" hoverStyle={{ backgroundColor: "$color3" }} {...{ top: isFullscreen ? "$3" : "$5", opacity: isFullscreen ? 1 : 0, "$group-preview-hover": isFullscreen ? undefined : {"opacity":1}, focusVisibleStyle: isFullscreen ? undefined : {"opacity":1} }}
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
            top: selectedElement.rect.top + (currentTab === "preview" ? 0 : 24),
            left: selectedElement.rect.left + (currentTab === "preview" ? 0 : 24),
            width: selectedElement.rect.width,
            height: selectedElement.rect.height,
          }}
        >
          <SizableText backgroundColor="$color5" borderWidth={1} borderColor="$color6" borderTopLeftRadius="$3" borderTopRightRadius="$3" fontSize="$3" color="$color12" paddingHorizontal="$2" paddingVertical="$0.5" y={-28} position="absolute" top="$0" left="$0">
            {htmlTagToText(selectedElement.tagName)}
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
            // NO `allow-same-origin`. That flag is what let generated, imported
            // and forked HTML read `top.localStorage` — where the IAM access and
            // refresh tokens live — and even drop its own sandbox. It is gone
            // because nothing here needs it any more: hover, click-to-select,
            // navigation, theming and scroll-follow all travel over the bridge
            // injected by `withBridge`, addressed by CSS selector instead of by
            // node, and the selection crosses as a description rather than as a
            // handle into another document.
            //
            // Proven in Chromium against a real frame with exactly this
            // attribute (e2e/bridge): `contentDocument` is null, reading through
            // `contentWindow` throws SecurityError, and the exfiltration script
            // from the report comes back DENIED instead of a token.
            sandbox="allow-scripts allow-forms"
            srcDoc={withBridge(srcA)}
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
            // Same sandbox as the frame above — the double buffer means both
            // frames show untrusted HTML, so both are isolated or neither is.
            sandbox="allow-scripts allow-forms"
            srcDoc={withBridge(srcB)}
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
