"use client";

import { command, isFrameEvent, type ElementInfo } from "../preview/bridge";
import { SizableText, YStack, XStack, H3 } from '@hanzo/ui';
import { glass } from "@/lib/chrome";
import { useState, useEffect, useCallback } from "react";
import {
  Wand2,
  MousePointer2,
  Edit3,
  Move,
  SlidersHorizontal,
  MoreVertical,
  PanelBottom,
  PanelLeft,
  PanelRight,
  PanelTop,
  Minimize2,
  EyeOff,
  Monitor,
  Sun,
  Moon,
  Keyboard,
  GripHorizontal,
  GripVertical,
  Box,
  Code,
  X,
  Check
} from "lucide-react";
import { Button, Tabs, TabsContent, TabsList, TabsTrigger, Input, Label, Switch, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@hanzo/ui';
import { cn } from "@/lib/utils";
import type { CodeEditorHandle } from "@/components/code-editor";

import { locate, type SourceLocation } from "@/lib/source-locate";

/**
 * What the panel edits. The preview frame is isolated (no `allow-same-origin`),
 * so this is a DESCRIPTION that crossed a postMessage — never a handle into the
 * other document. `element: HTMLElement` and `styles: CSSStyleDeclaration` were
 * the two live references that could not survive the boundary; `selector` is how
 * the frame finds the node again when a change is sent back.
 */
type SelectedElementInfo = ElementInfo & { sourceLocation?: SourceLocation };

interface VisualEditorProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  editorRef: React.RefObject<CodeEditorHandle | null>;
  /** Which file the editor currently holds. The panel rewrites lines in it, so
   *  a wrong name here is a wrong answer reported confidently. */
  pagePath: string;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onElementSelect?: (element: SelectedElementInfo) => void;
  onCodeUpdate?: (newHtml: string, location?: SourceLocation) => void;
}

// --- Floating-dock persistence -------------------------------------------------
// All dock chrome state lives client-side in localStorage so the toolbar never
// needs to reach up into the editor shell (index.tsx). One key per concern.
type DockPosition = "bottom" | "top" | "left" | "right";
type PreviewTheme = "auto" | "light" | "dark";

const LS = {
  dock: "hanzo.dev.visualEditor.dock",
  minimized: "hanzo.dev.visualEditor.minimized",
  hidden: "hanzo.dev.visualEditor.hidden",
  theme: "hanzo.dev.visualEditor.theme",
  shortcuts: "hanzo.dev.visualEditor.shortcuts"
} as const;

// Single persisted-state primitive. Initial render uses `fallback` on both
// server and client (no hydration mismatch); the stored value is read in on
// mount and every setter mirrors back to localStorage.
function usePersisted<T>(key: string, fallback: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // Malformed / unavailable storage — keep the fallback.
    }
  }, [key]);

  const set = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Quota / disabled storage — state still updates in memory.
      }
    },
    [key]
  );

  return [value, set];
}

export function VisualEditor({
  iframeRef,
  editorRef,
  pagePath,
  isEnabled,
  onToggle,
  onElementSelect,
  onCodeUpdate
}: VisualEditorProps) {
  const [selectedElement, setSelectedElement] = useState<SelectedElementInfo | null>(null);
  const [editMode, setEditMode] = useState<"select" | "edit" | "move">("select");
  const [showPanel, setShowPanel] = useState(true);
  const [highlightedElement, setHighlightedElement] = useState<string | null>(null);

  // Dock chrome (persisted).
  const [dockPosition, setDockPosition] = usePersisted<DockPosition>(LS.dock, "bottom");
  const [isMinimized, setIsMinimized] = usePersisted<boolean>(LS.minimized, false);
  const [isHidden, setIsHidden] = usePersisted<boolean>(LS.hidden, false);
  const [previewTheme, setPreviewTheme] = usePersisted<PreviewTheme>(LS.theme, "auto");
  const [shortcutsEnabled, setShortcutsEnabled] = usePersisted<boolean>(LS.shortcuts, true);

  // On narrow viewports the dock is forced bottom-center (still reachable, no
  // overflow) regardless of the persisted edge — the stored choice is intact.
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const position: DockPosition = isNarrow ? "bottom" : dockPosition;
  const isVertical = position === "left" || position === "right";

  // Style editing states
  const [elementText, setElementText] = useState("");
  // Whatever the frame reported, not a fixed shape read off a live
  // CSSStyleDeclaration — the bridge sends the tracked properties.
  const [elementStyles, setElementStyles] = useState<Record<string, string>>({});

  // Generate XPath for element
  const getXPath = (element: HTMLElement): string => {
    if (element.id) return `//*[@id="${element.id}"]`;
    if (element === document.body) return "/html/body";

    let ix = 0;
    const siblings = element.parentNode?.childNodes || [];
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling === element) {
        return (
          getXPath(element.parentElement as HTMLElement) +
          "/" +
          element.tagName.toLowerCase() +
          "[" +
          (ix + 1) +
          "]"
        );
      }
      if (sibling.nodeType === 1 && (sibling as HTMLElement).tagName === element.tagName) {
        ix++;
      }
    }
    return "";
  };

  // Generate CSS selector for element
  const getCSSSelector = (element: HTMLElement): string => {
    if (element.id) return `#${element.id}`;

    let path: string[] = [];
    while (element && element.nodeType === Node.ELEMENT_NODE) {
      let selector = element.nodeName.toLowerCase();
      if (element.id) {
        selector += "#" + element.id;
        path.unshift(selector);
        break;
      } else {
        let sibling = element;
        let nth = 1;
        while (sibling.previousElementSibling) {
          sibling = sibling.previousElementSibling as HTMLElement;
          if (sibling.nodeName.toLowerCase() === selector) nth++;
        }
        if (nth !== 1) selector += `:nth-of-type(${nth})`;
      }
      path.unshift(selector);
      element = element.parentElement as HTMLElement;
    }
    return path.join(" > ");
  };

  // WHERE the selected element is written, by the ONE locator (lib/source-locate).
  //
  // This used to be a private copy: it regex-matched `element.html.slice(0,100)`
  // against the buffer and labelled every answer "index.html", a literal. Both
  // halves were wrong in the same direction — the DOM rewrites attribute order
  // and quoting on the way out, so that substring is frequently absent from the
  // source, and the name was a guess. This path does not merely REPORT the line,
  // it hands it to `editor.replaceLine`, so a confident wrong answer rewrites a
  // line the user never selected.
  const findSourceLocation = useCallback((element: ElementInfo): SourceLocation | undefined => {
    const editor = editorRef.current;
    if (!editor) return undefined;
    return locate(
      {
        id: element.id,
        className: element.className,
        tagName: element.tagName,
        html: element.html,
        text: element.text,
      },
      [{ path: pagePath, html: editor.getValue() }],
    );
  }, [editorRef, pagePath]);

  // Handle element selection
  // Selection and hover ARRIVE now; they are not read off the frame's DOM.
  // The bridge sends a description, this adds the source location the panel
  // needs to write the change back into the code, and the outline goes back as
  // a highlight command so the frame paints it on its own node.
  useEffect(() => {
    if (!isEnabled) return;

    const onMessage = (event: MessageEvent) => {
      const frame = iframeRef.current;
      if (!isFrameEvent(event, frame)) return;
      const msg = event.data;

      if (msg.type === "preview:select" && editMode === "select") {
        const info: SelectedElementInfo = {
          ...msg.info,
          sourceLocation: findSourceLocation(msg.info),
        };
        setSelectedElement(info);
        setElementStyles(info.styles);
        setElementText(info.text ?? "");
        command(frame, { type: "preview:highlight", selector: info.selector });
        onElementSelect?.(info);
        return;
      }

      if (msg.type === "preview:hover" && editMode === "select") {
        setHighlightedElement(msg.selector);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [isEnabled, editMode, findSourceLocation, onElementSelect, iframeRef]);

  // Editable mode is what makes the frame report clicks at all.
  useEffect(() => {
    command(iframeRef.current, { type: "preview:editable", active: isEnabled });
  }, [isEnabled, iframeRef]);

  // Apply style changes to element
  const applyStyleChange = (property: string, value: string) => {
    if (!selectedElement) return;

    // A command, not a write into another document's DOM.
    command(iframeRef.current, {
      type: "preview:style",
      selector: selectedElement.selector,
      property,
      value,
    });

    // Update in the code editor
    const editor = editorRef.current;
    if (editor && selectedElement.sourceLocation) {
      const lineContent = editor.getLineContent(selectedElement.sourceLocation.line);
      let newLineContent = lineContent;

      // Try to update inline style
      const styleMatch = /style="([^"]*)"/.exec(lineContent);
      if (styleMatch) {
        const currentStyles = styleMatch[1];
        const styleObj = Object.fromEntries(
          currentStyles.split(';').filter(s => s.trim()).map(s => {
            const [key, val] = s.split(':').map(str => str.trim());
            return [key, val];
          })
        );
        styleObj[property] = value;
        const newStyles = Object.entries(styleObj).map(([k, v]) => `${k}: ${v}`).join('; ');
        newLineContent = lineContent.replace(styleMatch[0], `style="${newStyles}"`);
      } else {
        // Add style attribute
        const tagEnd = lineContent.indexOf('>');
        if (tagEnd !== -1) {
          newLineContent = lineContent.slice(0, tagEnd) + ` style="${property}: ${value}"` + lineContent.slice(tagEnd);
        }
      }

      editor.replaceLine(selectedElement.sourceLocation.line, newLineContent);

      if (onCodeUpdate) {
        onCodeUpdate(editor.getValue(), selectedElement.sourceLocation);
      }
    }

    setElementStyles(prev => ({ ...prev, [property]: value }));
  };

  // Apply text change
  const applyTextChange = () => {
    if (!selectedElement) return;

    command(iframeRef.current, {
      type: "preview:text",
      selector: selectedElement.selector,
      text: elementText,
    });

    // Update in the code editor
    const editor = editorRef.current;
    if (editor && selectedElement.sourceLocation) {
      const lineContent = editor.getLineContent(selectedElement.sourceLocation.line);
      const tagMatch = />([^<]*)</.exec(lineContent);

      if (tagMatch) {
        const newLineContent = lineContent.replace(tagMatch[0], `>${elementText}<`);
        editor.replaceLine(selectedElement.sourceLocation.line, newLineContent);

        if (onCodeUpdate) {
          onCodeUpdate(editor.getValue(), selectedElement.sourceLocation);
        }
      }
    }
  };

  // The effect that used to live here bound click/mouseover onto
  // `iframe.contentDocument` and injected the outline CSS the same way. Both are
  // gone: the frame is isolated, so it reports events over the bridge instead,
  // and BRIDGE_STYLES ships `.visual-editor-selected` / `.hovered-element` into
  // the document itself. Leaving the effect would not have failed loudly — it
  // would simply have stopped selecting, which is how this nearly shipped.

  // Preview theme — wired to the ref'd preview frame (the same frame the edit
  // engine drives). Generated docs hardcode `:root{color-scheme:dark}`; an
  // inline color-scheme on <html> overrides that stylesheet rule, and a
  // `data-theme` attribute gives doc CSS a hook. "auto" removes the override so
  // the document's own theme / the OS preference win. Re-applied on every frame
  // reload so a fresh stream keeps the chosen theme.
  useEffect(() => {
    const iframe = iframeRef.current;
    const apply = () => {
      // A command: `contentDocument` is exactly what the isolated frame denies,
      // and this silently stopped applying the moment the flag came off.
      command(iframe, { type: "preview:theme", mode: previewTheme });
    };
    apply();
    iframe?.addEventListener("load", apply);
    return () => iframe?.removeEventListener("load", apply);
  }, [previewTheme, iframeRef]);

  // Visual-editor keyboard shortcuts (gated on the persisted toggle + editing
  // being armed). Fire only when focus is in the parent document and not in a
  // form field. Cross-document iframe key events don't bubble here — that's the
  // known limit of an iframe'd preview.
  useEffect(() => {
    if (!isEnabled || !shortcutsEnabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      switch (e.key.toLowerCase()) {
        case "v":
          setEditMode("select");
          break;
        case "e":
          setEditMode("edit");
          break;
        case "m":
          setEditMode("move");
          break;
        case "p":
          setShowPanel((s) => !s);
          break;
        case "escape":
          setSelectedElement(null);
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isEnabled, shortcutsEnabled]);

  // Anchor the dock to the chosen edge: bottom/top → horizontal pill centered on
  // the X axis; left/right → vertical pill centered on the Y axis.
  const anchorProps: Record<DockPosition, object> = {
    bottom: { bottom: 12, left: "50%", x: "-50%" },
    top: { top: 12, left: "50%", x: "-50%" },
    left: { left: 12, top: "50%", y: "-50%" },
    right: { right: 12, top: "50%", y: "-50%" }
  };
  // Keep the bottom edge clear of the mobile safe-area inset.
  const anchorStyle: React.CSSProperties | undefined =
    position === "bottom" ? { bottom: "max(0.75rem, env(safe-area-inset-bottom))" } : undefined;
  const dividerProps = isVertical
    ? { marginVertical: "$0.5", height: 1, width: 20 }
    : { marginHorizontal: "$0.5", height: 20, width: 1 };
  const menuPlacement =
    position === "bottom" ? "top-end" : position === "top" ? "bottom-end" : position === "left" ? "right-end" : "left-end";

  const dockPositionOptions: { value: DockPosition; label: string; icon: typeof PanelBottom }[] = [
    { value: "bottom", label: "Bottom", icon: PanelBottom },
    { value: "top", label: "Top", icon: PanelTop },
    { value: "left", label: "Left", icon: PanelLeft },
    { value: "right", label: "Right", icon: PanelRight }
  ];

  // The `⋮` overflow menu — rendered inline at the end of the dock's icon row.
  // Check marks come free from Radix radio/checkbox items.
  const overflowMenu = (
    <DropdownMenu placement={menuPlacement}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          flexShrink={0} padding="$0" {...{ color: "$color11" }} hoverStyle={{ backgroundColor: "$color3" }}
          title="More"
          aria-label="Visual editor options"
        >
          <MoreVertical size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        sideOffset={8}
        minWidth={224}
      >
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <PanelBottom size={16} />
            <span>Dock</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent minWidth={160}>
            <DropdownMenuRadioGroup
              value={dockPosition}
              onValueChange={(v) => setDockPosition(v as DockPosition)}
            >
              {dockPositionOptions.map(({ value, label, icon: Icon }) => (
                <DropdownMenuRadioItem key={value} value={value}>
                  <Icon size={16} />
                  <span>{label}</span>
                  {value === "bottom" && (
                    <SizableText marginLeft="auto" fontSize={10} color="$color11">Default</SizableText>
                  )}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuCheckboxItem
          checked={isMinimized}
          onCheckedChange={(c) => setIsMinimized(c === true)}
         
        >
          <Minimize2 size={16} />
          <span>Minimize</span>
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={isHidden}
          onCheckedChange={(c) => setIsHidden(c === true)}
         
        >
          <EyeOff size={16} />
          <span>Hide</span>
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator backgroundColor="$borderColor" />
        <DropdownMenuLabel fontSize={10} fontWeight="500" color="$color11">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={previewTheme}
          onValueChange={(v) => setPreviewTheme(v as PreviewTheme)}
        >
          <DropdownMenuRadioItem value="auto">
            <Monitor size={16} />
            <span>Auto</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light">
            <Sun size={16} />
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon size={16} />
            <span>Dark</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator backgroundColor="$borderColor" />
        <XStack
          alignItems="center" justifyContent="space-between" gap="$4" paddingHorizontal="$2" paddingVertical="$1.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <XStack alignItems="center" gap="$2">
            <Keyboard size={16} />
            <SizableText fontSize="$3" color="$color">Keyboard shortcuts</SizableText>
          </XStack>
          <Switch checked={shortcutsEnabled} onCheckedChange={setShortcutsEnabled} />
        </XStack>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      {/* Floating visual-editor dock — anchored to the chosen edge of the preview
          card. Monochrome pill, hairline dividers between tool groups. */}
      {isHidden ? (
        // Always-present affordance so the toolbar is never unrecoverable.
        <Button
          type="button"
          onClick={() => setIsHidden(false)}
          title="Show visual editor"
          aria-label="Show visual editor"
          {...glass(2)} position="absolute" bottom="$3" right="$3" zIndex={50} width="$6" height="$6" alignItems="center" justifyContent="center" borderRadius="$10" borderWidth={1} {...{ color: "$color11" }} hoverStyle={{ backgroundColor: "$color3" }}
          style={anchorStyle}
        >
          <Wand2 size={16} />
        </Button>
      ) : isMinimized ? (
        // Collapsed to a single grip; click to restore the full dock.
        <YStack position="absolute" zIndex={50} {...anchorProps[position]} style={anchorStyle}>
          <Button
            type="button"
            onClick={() => setIsMinimized(false)}
            title="Expand visual editor"
            aria-label="Expand visual editor"
            {...glass(2)} width="$6" height="$6" alignItems="center" justifyContent="center" borderRadius="$10" borderWidth={1} {...{ color: "$color11" }} hoverStyle={{ backgroundColor: "$color3" }}
          >
            {isVertical ? <GripVertical size={16} /> : <GripHorizontal size={16} />}
          </Button>
        </YStack>
      ) : (
        <XStack
          role="toolbar"
          aria-label="Visual editor"
          aria-orientation={isVertical ? "vertical" : "horizontal"}
          {...glass(2)} position="absolute" zIndex={50} alignItems="center" gap="$1" borderWidth={1} padding="$1" {...{ maxHeight: isVertical ? "calc(100% - 1.5rem)" : undefined, flexDirection: isVertical ? "column" : "row", borderRadius: isVertical ? "$8" : "$10", maxWidth: isVertical ? undefined : "calc(100% - 1.5rem)" }} {...anchorProps[position]}
          style={anchorStyle}
        >
          {/* Master arm/disarm — turns the visual editor on for the preview. */}
          <Button
            variant={isEnabled ? "default" : "ghost"}
            size="sm"
            onClick={() => onToggle(!isEnabled)}
            title={isEnabled ? "Disable visual editing" : "Enable visual editing"}
            aria-pressed={isEnabled}
            width="$6" height="$6" flexShrink={0} padding="$0" {...{ backgroundColor: isEnabled ? "$color12" : undefined, color: isEnabled ? "$background" : "$color11", hoverStyle: isEnabled ? {"backgroundColor":"$color12"} : {"backgroundColor":"$color3"} }}
          >
            <Wand2 size={16} />
          </Button>

          {isEnabled && (
            <>
              <YStack flexShrink={0} backgroundColor="$borderColor" {...dividerProps} />
              <Button
                variant={editMode === "select" ? "secondary" : "ghost"}
                size="sm"
                width="$6" height="$6" flexShrink={0} padding="$0" {...{ color: editMode !== "select" ? "$color11" : undefined, hoverStyle: editMode !== "select" ? {"backgroundColor":"$color3"} : undefined }}
                onClick={() => setEditMode("select")}
                title="Select (V)"
                aria-pressed={editMode === "select"}
              >
                <MousePointer2 size={16} />
              </Button>
              <Button
                variant={editMode === "edit" ? "secondary" : "ghost"}
                size="sm"
                width="$6" height="$6" flexShrink={0} padding="$0" {...{ color: editMode !== "edit" ? "$color11" : undefined, hoverStyle: editMode !== "edit" ? {"backgroundColor":"$color3"} : undefined }}
                onClick={() => setEditMode("edit")}
                title="Edit (E)"
                aria-pressed={editMode === "edit"}
              >
                <Edit3 size={16} />
              </Button>
              <Button
                variant={editMode === "move" ? "secondary" : "ghost"}
                size="sm"
                width="$6" height="$6" flexShrink={0} padding="$0" {...{ color: editMode !== "move" ? "$color11" : undefined, hoverStyle: editMode !== "move" ? {"backgroundColor":"$color3"} : undefined }}
                onClick={() => setEditMode("move")}
                title="Move (M)"
                aria-pressed={editMode === "move"}
              >
                <Move size={16} />
              </Button>
              <YStack flexShrink={0} backgroundColor="$borderColor" {...dividerProps} />
              <Button
                variant={showPanel ? "secondary" : "ghost"}
                size="sm"
                width="$6" height="$6" flexShrink={0} padding="$0" {...{ color: !showPanel ? "$color11" : undefined, hoverStyle: !showPanel ? {"backgroundColor":"$color3"} : undefined }}
                onClick={() => setShowPanel(!showPanel)}
                title="Properties panel (P)"
                aria-pressed={showPanel}
              >
                <SlidersHorizontal size={16} />
              </Button>
            </>
          )}

          <YStack flexShrink={0} backgroundColor="$borderColor" {...dividerProps} />
          {overflowMenu}
        </XStack>
      )}

      {/* Properties Panel */}
      {!isHidden && !isMinimized && isEnabled && showPanel && selectedElement && (
        <YStack {...glass(2)} position="absolute" top="$11" right="$4" zIndex={50} width={320} borderRadius="$5" borderWidth={1} maxHeight={600} overflow="hidden">
          <YStack padding="$4" borderBottomWidth={1} borderColor="$borderColor">
            <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
              <H3 fontSize="$3" fontWeight="500" color="$color">Element Properties</H3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedElement(null)}
                padding="$1"
              >
                <X size={16} />
              </Button>
            </XStack>
            <YStack rowGap="$1">
              <XStack alignItems="center" gap="$2">
                <Box size={12} />
                <SizableText fontFamily="$mono" fontSize="$1" color="$color11">{selectedElement.tagName}</SizableText>
                {selectedElement.id && (
                  <SizableText fontSize="$1" color="$color11">#{selectedElement.id}</SizableText>
                )}
              </XStack>
              {selectedElement.className && (
                <YStack>
                  <SizableText fontSize="$1" color="$color11" numberOfLines={1}>
                    .{selectedElement.className.split(' ').join('.')}
                  </SizableText>
                </YStack>
              )}
              {selectedElement.sourceLocation && (
                <XStack alignItems="center" gap="$1">
                  <Code size={12} />
                  <SizableText fontSize="$1" color="$color11">Line {selectedElement.sourceLocation.line}</SizableText>
                </XStack>
              )}
            </YStack>
          </YStack>

          <Tabs defaultValue="content" flex={1} overflow="hidden">
            <TabsList width="100%" backgroundColor="$color3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="styles">Styles</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>

            <YStack maxHeight={400} overflow="scroll">
              <TabsContent value="content" padding="$4" rowGap="$4">
                <div>
                  <Label fontSize="$1" color="$color11">Text Content</Label>
                  <XStack gap="$2" marginTop="$1">
                    <Input
                      value={elementText}
                      onChangeText={(value) => setElementText(value)}
                      flex={1} backgroundColor="$color3" borderColor="$borderColor" color="$color" fontSize="$3"
  />
                    <Button size="sm" onClick={applyTextChange}>
                      <Check size={16} />
                    </Button>
                  </XStack>
                </div>

                <div>
                  <Label fontSize="$1" color="$color11">CSS Selector</Label>
                  <SizableText marginTop="$1" padding="$2" backgroundColor="$color3" borderRadius="$2" fontSize="$1" color="$color11" fontFamily="$mono">
                    {selectedElement.selector}
                  </SizableText>
                </div>
              </TabsContent>

              <TabsContent value="styles" padding="$4" rowGap="$4">
                <div>
                  <Label fontSize="$1" color="$color11">Text Color</Label>
                  <XStack gap="$2" marginTop="$1">
                    <YStack
                      width="$7" height="$7" borderRadius="$2" borderWidth={1} borderColor="$borderColor" cursor="pointer"
                      style={{ backgroundColor: elementStyles.color }}
                      onClick={() => {
                        const color = prompt("Enter color (hex, rgb, or name):", elementStyles.color);
                        if (color) applyStyleChange("color", color);
                      }}
  />
                    <Input
                      value={elementStyles.color}
                      onChangeText={(value) => applyStyleChange("color", value)}
                      flex={1} backgroundColor="$color3" borderColor="$borderColor" color="$color" fontSize="$3"
  />
                  </XStack>
                </div>

                <div>
                  <Label fontSize="$1" color="$color11">Background</Label>
                  <XStack gap="$2" marginTop="$1">
                    <YStack
                      width="$7" height="$7" borderRadius="$2" borderWidth={1} borderColor="$borderColor" cursor="pointer"
                      style={{ backgroundColor: elementStyles.backgroundColor }}
                      onClick={() => {
                        const color = prompt("Enter background color:", elementStyles.backgroundColor);
                        if (color) applyStyleChange("backgroundColor", color);
                      }}
  />
                    <Input
                      value={elementStyles.backgroundColor}
                      onChangeText={(value) => applyStyleChange("backgroundColor", value)}
                      flex={1} backgroundColor="$color3" borderColor="$borderColor" color="$color" fontSize="$3"
  />
                  </XStack>
                </div>

                <div>
                  <Label fontSize="$1" color="$color11">Font Size</Label>
                  <Input
                    value={elementStyles.fontSize}
                    onChangeText={(value) => applyStyleChange("fontSize", value)}
                    backgroundColor="$color3" borderColor="$borderColor" color="$color" fontSize="$3" marginTop="$1"
  />
                </div>

                <div>
                  <Label fontSize="$1" color="$color11">Font Weight</Label>
                  <select
                    value={elementStyles.fontWeight}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => applyStyleChange("fontWeight", e.target.value)}
                    className="ve-input"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                    <option value="300">300</option>
                    <option value="400">400</option>
                    <option value="500">500</option>
                    <option value="600">600</option>
                    <option value="700">700</option>
                    <option value="800">800</option>
                    <option value="900">900</option>
                  </select>
                </div>
              </TabsContent>

              <TabsContent value="layout" padding="$4" rowGap="$4">
                <YStack gap="$2">
                  <div>
                    <Label fontSize="$1" color="$color11">Width</Label>
                    <Input
                      value={elementStyles.width}
                      onChangeText={(value) => applyStyleChange("width", value)}
                      placeholder="auto"
                      backgroundColor="$color3" borderColor="$borderColor" color="$color" fontSize="$3" marginTop="$1"
  />
                  </div>
                  <div>
                    <Label fontSize="$1" color="$color11">Height</Label>
                    <Input
                      value={elementStyles.height}
                      onChangeText={(value) => applyStyleChange("height", value)}
                      placeholder="auto"
                      backgroundColor="$color3" borderColor="$borderColor" color="$color" fontSize="$3" marginTop="$1"
  />
                  </div>
                </YStack>

                <div>
                  <Label fontSize="$1" color="$color11">Padding</Label>
                  <Input
                    value={elementStyles.padding}
                    onChangeText={(value) => applyStyleChange("padding", value)}
                    placeholder="0px"
                    backgroundColor="$color3" borderColor="$borderColor" color="$color" fontSize="$3" marginTop="$1"
  />
                </div>

                <div>
                  <Label fontSize="$1" color="$color11">Margin</Label>
                  <Input
                    value={elementStyles.margin}
                    onChangeText={(value) => applyStyleChange("margin", value)}
                    placeholder="0px"
                    backgroundColor="$color3" borderColor="$borderColor" color="$color" fontSize="$3" marginTop="$1"
  />
                </div>

                <div>
                  <Label fontSize="$1" color="$color11">Display</Label>
                  <select
                    value={elementStyles.display}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => applyStyleChange("display", e.target.value)}
                    className="ve-input"
                  >
                    <option value="block">Block</option>
                    <option value="inline">Inline</option>
                    <option value="inline-block">Inline Block</option>
                    <option value="flex">Flex</option>
                    <option value="grid">Grid</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div>
                  <Label fontSize="$1" color="$color11">Position</Label>
                  <select
                    value={elementStyles.position}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => applyStyleChange("position", e.target.value)}
                    className="ve-input"
                  >
                    <option value="static">Static</option>
                    <option value="relative">Relative</option>
                    <option value="absolute">Absolute</option>
                    <option value="fixed">Fixed</option>
                    <option value="sticky">Sticky</option>
                  </select>
                </div>
              </TabsContent>
            </YStack>
          </Tabs>
        </YStack>
      )}
    </>
  );
}
