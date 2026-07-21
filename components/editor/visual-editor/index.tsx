"use client";

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
import {
  Button,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Switch,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@hanzo/ui";
import { cn } from "@/lib/utils";
import type { CodeEditorHandle } from "@/components/code-editor";

interface SourceLocation {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

interface SelectedElementInfo {
  element: HTMLElement;
  tagName: string;
  id?: string;
  className?: string;
  text?: string;
  styles: CSSStyleDeclaration;
  sourceLocation?: SourceLocation;
  xpath: string;
  selector: string;
}

interface VisualEditorProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  editorRef: React.RefObject<CodeEditorHandle | null>;
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
  isEnabled,
  onToggle,
  onElementSelect,
  onCodeUpdate
}: VisualEditorProps) {
  const [selectedElement, setSelectedElement] = useState<SelectedElementInfo | null>(null);
  const [editMode, setEditMode] = useState<"select" | "edit" | "move">("select");
  const [showPanel, setShowPanel] = useState(true);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

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
  const [elementStyles, setElementStyles] = useState({
    color: "",
    backgroundColor: "",
    fontSize: "",
    fontWeight: "",
    padding: "",
    margin: "",
    border: "",
    borderRadius: "",
    width: "",
    height: "",
    display: "",
    position: "",
  });

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

  // Find source location in Monaco editor
  const findSourceLocation = useCallback((element: HTMLElement): SourceLocation | undefined => {
    const editor = editorRef.current;
    if (!editor) return undefined;

    const htmlContent = editor.getValue();
    const selector = getCSSSelector(element);
    const xpath = getXPath(element);

    // Try to find by ID first (most precise)
    if (element.id) {
      const idPattern = new RegExp(`id=["']${element.id}["']`, "g");
      const match = idPattern.exec(htmlContent);
      if (match) {
        const position = editor.getPositionAt(match.index);
        return {
          file: "index.html",
          line: position.lineNumber,
          column: position.column,
        };
      }
    }

    // Try to find by outerHTML snippet
    const outerHTML = element.outerHTML.substring(0, 100);
    const escapedHTML = outerHTML.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const htmlPattern = new RegExp(escapedHTML);
    const match = htmlPattern.exec(htmlContent);
    if (match) {
      const position = editor.getPositionAt(match.index);
      return {
        file: "index.html",
        line: position.lineNumber,
        column: position.column,
      };
    }

    // Add data attribute for tracking
    element.setAttribute('data-source-line', '0');

    return undefined;
  }, [editorRef]);

  // Handle element selection
  const handleElementClick = useCallback((event: MouseEvent) => {
    if (!isEnabled || editMode !== "select") return;

    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLElement;
    if (!target) return;

    const info: SelectedElementInfo = {
      element: target,
      tagName: target.tagName.toLowerCase(),
      id: target.id,
      className: target.className,
      text: target.textContent || "",
      styles: window.getComputedStyle(target),
      xpath: getXPath(target),
      selector: getCSSSelector(target),
      sourceLocation: findSourceLocation(target),
    };

    setSelectedElement(info);
    setElementText(info.text || "");
    setElementStyles({
      color: info.styles.color,
      backgroundColor: info.styles.backgroundColor,
      fontSize: info.styles.fontSize,
      fontWeight: info.styles.fontWeight,
      padding: info.styles.padding,
      margin: info.styles.margin,
      border: info.styles.border,
      borderRadius: info.styles.borderRadius,
      width: info.styles.width,
      height: info.styles.height,
      display: info.styles.display,
      position: info.styles.position,
    });

    if (onElementSelect) {
      onElementSelect(info);
    }

    // Jump to source in the code editor
    if (info.sourceLocation && editorRef.current) {
      editorRef.current.revealLine(info.sourceLocation.line);
    }
  }, [isEnabled, editMode, findSourceLocation, onElementSelect, editorRef]);

  // Handle element hover
  const handleElementHover = useCallback((event: MouseEvent) => {
    if (!isEnabled || editMode !== "select") return;

    const target = event.target as HTMLElement;
    if (highlightedElement && highlightedElement !== target) {
      highlightedElement.style.outline = "";
    }

    target.style.outline = "2px solid #ffffff";
    target.style.outlineOffset = "2px";
    setHighlightedElement(target);
  }, [isEnabled, editMode, highlightedElement]);

  // Apply style changes to element
  const applyStyleChange = (property: string, value: string) => {
    if (!selectedElement) return;

    // Apply to element
    (selectedElement.element.style as any)[property] = value;

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

    selectedElement.element.textContent = elementText;

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

  // Setup iframe event listeners
  useEffect(() => {
    if (!iframeRef.current || !isEnabled) return;

    const iframeDoc = iframeRef.current.contentDocument;
    if (!iframeDoc) return;

    // Add visual editor styles to iframe
    const styleId = "visual-editor-styles";
    if (!iframeDoc.getElementById(styleId)) {
      const style = iframeDoc.createElement("style");
      style.id = styleId;
      style.textContent = `
        .visual-editor-selected {
          outline: 2px solid #ffffff !important;
          outline-offset: 2px !important;
        }
        .visual-editor-hover {
          outline: 2px dashed rgba(255, 255, 255, 0.6) !important;
          outline-offset: 2px !important;
        }
        [data-visual-editor-mode="edit"] * {
          cursor: crosshair !important;
        }
      `;
      iframeDoc.head.appendChild(style);
    }

    // Add event listeners
    iframeDoc.addEventListener("click", handleElementClick);
    iframeDoc.addEventListener("mouseover", handleElementHover);

    return () => {
      iframeDoc.removeEventListener("click", handleElementClick);
      iframeDoc.removeEventListener("mouseover", handleElementHover);
    };
  }, [iframeRef, isEnabled, handleElementClick, handleElementHover]);

  // Preview theme — wired to the ref'd preview frame (the same frame the edit
  // engine drives). Generated docs hardcode `:root{color-scheme:dark}`; an
  // inline color-scheme on <html> overrides that stylesheet rule, and a
  // `data-theme` attribute gives doc CSS a hook. "auto" removes the override so
  // the document's own theme / the OS preference win. Re-applied on every frame
  // reload so a fresh stream keeps the chosen theme.
  useEffect(() => {
    const iframe = iframeRef.current;
    const apply = () => {
      const root = iframe?.contentDocument?.documentElement;
      if (!root) return;
      if (previewTheme === "auto") {
        root.style.removeProperty("color-scheme");
        root.removeAttribute("data-theme");
      } else {
        root.style.colorScheme = previewTheme;
        root.setAttribute("data-theme", previewTheme);
      }
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
  const anchorClass: Record<DockPosition, string> = {
    bottom: "bottom-3 left-1/2 -translate-x-1/2",
    top: "top-3 left-1/2 -translate-x-1/2",
    left: "left-3 top-1/2 -translate-y-1/2",
    right: "right-3 top-1/2 -translate-y-1/2"
  };
  // Keep the bottom edge clear of the mobile safe-area inset.
  const anchorStyle: React.CSSProperties | undefined =
    position === "bottom" ? { bottom: "max(0.75rem, env(safe-area-inset-bottom))" } : undefined;
  const dividerClass = cn("shrink-0 bg-border", isVertical ? "my-0.5 h-px w-5" : "mx-0.5 h-5 w-px");
  const menuSide =
    position === "bottom" ? "top" : position === "top" ? "bottom" : position === "left" ? "right" : "left";
  const menuItemClass =
    "gap-2 text-foreground focus:bg-muted focus:text-foreground data-[highlighted]:bg-muted data-[highlighted]:text-foreground";

  const dockPositionOptions: { value: DockPosition; label: string; icon: typeof PanelBottom }[] = [
    { value: "bottom", label: "Bottom", icon: PanelBottom },
    { value: "top", label: "Top", icon: PanelTop },
    { value: "left", label: "Left", icon: PanelLeft },
    { value: "right", label: "Right", icon: PanelRight }
  ];

  // The `⋮` overflow menu — rendered inline at the end of the dock's icon row.
  // Check marks come free from Radix radio/checkbox items.
  const overflowMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 shrink-0 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="More"
          aria-label="Visual editor options"
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={menuSide}
        align="end"
        sideOffset={8}
        className="min-w-56 border-border bg-card/95 text-foreground shadow-xl shadow-black/40 backdrop-blur"
      >
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className={menuItemClass}>
            <PanelBottom className="size-4" />
            <span>Dock</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="min-w-40 border-border bg-card/95 text-foreground backdrop-blur">
            <DropdownMenuRadioGroup
              value={dockPosition}
              onValueChange={(v) => setDockPosition(v as DockPosition)}
            >
              {dockPositionOptions.map(({ value, label, icon: Icon }) => (
                <DropdownMenuRadioItem key={value} value={value} className={menuItemClass}>
                  <Icon className="size-4" />
                  <span>{label}</span>
                  {value === "bottom" && (
                    <span className="ml-auto text-[10px] text-muted-foreground">Default</span>
                  )}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuCheckboxItem
          checked={isMinimized}
          onCheckedChange={(c) => setIsMinimized(c === true)}
          className={menuItemClass}
        >
          <Minimize2 className="size-4" />
          <span>Minimize</span>
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={isHidden}
          onCheckedChange={(c) => setIsHidden(c === true)}
          className={menuItemClass}
        >
          <EyeOff className="size-4" />
          <span>Hide</span>
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuLabel className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={previewTheme}
          onValueChange={(v) => setPreviewTheme(v as PreviewTheme)}
        >
          <DropdownMenuRadioItem value="auto" className={menuItemClass}>
            <Monitor className="size-4" />
            <span>Auto</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light" className={menuItemClass}>
            <Sun className="size-4" />
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" className={menuItemClass}>
            <Moon className="size-4" />
            <span>Dark</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator className="bg-border" />
        <div
          className="flex items-center justify-between gap-4 px-2 py-1.5 text-sm text-foreground"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span className="flex items-center gap-2">
            <Keyboard className="size-4" />
            Keyboard shortcuts
          </span>
          <Switch checked={shortcutsEnabled} onCheckedChange={setShortcutsEnabled} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      {/* Floating visual-editor dock — anchored to the chosen edge of the preview
          card. Monochrome pill, hairline dividers between tool groups. */}
      {isHidden ? (
        // Always-present affordance so the toolbar is never unrecoverable.
        <button
          type="button"
          onClick={() => setIsHidden(false)}
          title="Show visual editor"
          aria-label="Show visual editor"
          className="absolute bottom-3 right-3 z-50 inline-flex size-8 items-center justify-center rounded-full border border-border bg-card/95 text-muted-foreground shadow-lg shadow-black/40 backdrop-blur transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          style={anchorStyle}
        >
          <Wand2 className="size-4" />
        </button>
      ) : isMinimized ? (
        // Collapsed to a single grip; click to restore the full dock.
        <div className={cn("absolute z-50", anchorClass[position])} style={anchorStyle}>
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            title="Expand visual editor"
            aria-label="Expand visual editor"
            className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-card/95 text-muted-foreground shadow-lg shadow-black/40 backdrop-blur transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            {isVertical ? <GripVertical className="size-4" /> : <GripHorizontal className="size-4" />}
          </button>
        </div>
      ) : (
        <div
          role="toolbar"
          aria-label="Visual editor"
          aria-orientation={isVertical ? "vertical" : "horizontal"}
          className={cn(
            "absolute z-50 flex items-center gap-1 border border-border bg-card/95 p-1 shadow-lg shadow-black/40 backdrop-blur",
            isVertical
              ? "max-h-[calc(100%-1.5rem)] flex-col rounded-2xl"
              : "max-w-[calc(100%-1.5rem)] flex-row rounded-full",
            anchorClass[position]
          )}
          style={anchorStyle}
        >
          {/* Master arm/disarm — turns the visual editor on for the preview. */}
          <Button
            variant={isEnabled ? "default" : "ghost"}
            size="sm"
            onClick={() => onToggle(!isEnabled)}
            title={isEnabled ? "Disable visual editing" : "Enable visual editing"}
            aria-pressed={isEnabled}
            className={cn(
              "size-8 shrink-0 p-0",
              isEnabled
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Wand2 className="size-4" />
          </Button>

          {isEnabled && (
            <>
              <div className={dividerClass} />
              <Button
                variant={editMode === "select" ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "size-8 shrink-0 p-0",
                  editMode !== "select" && "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => setEditMode("select")}
                title="Select (V)"
                aria-pressed={editMode === "select"}
              >
                <MousePointer2 className="size-4" />
              </Button>
              <Button
                variant={editMode === "edit" ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "size-8 shrink-0 p-0",
                  editMode !== "edit" && "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => setEditMode("edit")}
                title="Edit (E)"
                aria-pressed={editMode === "edit"}
              >
                <Edit3 className="size-4" />
              </Button>
              <Button
                variant={editMode === "move" ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "size-8 shrink-0 p-0",
                  editMode !== "move" && "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => setEditMode("move")}
                title="Move (M)"
                aria-pressed={editMode === "move"}
              >
                <Move className="size-4" />
              </Button>
              <div className={dividerClass} />
              <Button
                variant={showPanel ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "size-8 shrink-0 p-0",
                  !showPanel && "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => setShowPanel(!showPanel)}
                title="Properties panel (P)"
                aria-pressed={showPanel}
              >
                <SlidersHorizontal className="size-4" />
              </Button>
            </>
          )}

          <div className={dividerClass} />
          {overflowMenu}
        </div>
      )}

      {/* Properties Panel */}
      {!isHidden && !isMinimized && isEnabled && showPanel && selectedElement && (
        <div className="absolute top-20 right-4 z-50 w-80 bg-card/95 backdrop-blur-sm rounded-lg border border-border max-h-[600px] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-foreground">Element Properties</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedElement(null)}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Box className="w-3 h-3" />
                <span className="font-mono">{selectedElement.tagName}</span>
                {selectedElement.id && (
                  <span className="text-muted-foreground">#{selectedElement.id}</span>
                )}
              </div>
              {selectedElement.className && (
                <div className="text-xs text-muted-foreground truncate">
                  .{selectedElement.className.split(' ').join('.')}
                </div>
              )}
              {selectedElement.sourceLocation && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Code className="w-3 h-3" />
                  Line {selectedElement.sourceLocation.line}
                </div>
              )}
            </div>
          </div>

          <Tabs defaultValue="content" className="flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-3 bg-muted">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="styles">Styles</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>

            <div className="overflow-y-auto max-h-[400px]">
              <TabsContent value="content" className="p-4 space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Text Content</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={elementText}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setElementText(e.target.value)}
                      className="flex-1 bg-muted border-border text-foreground text-sm"
                    />
                    <Button size="sm" onClick={applyTextChange}>
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">CSS Selector</Label>
                  <code className="block mt-1 p-2 bg-muted rounded text-xs text-muted-foreground font-mono">
                    {selectedElement.selector}
                  </code>
                </div>
              </TabsContent>

              <TabsContent value="styles" className="p-4 space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Text Color</Label>
                  <div className="flex gap-2 mt-1">
                    <div
                      className="w-10 h-10 rounded border border-border cursor-pointer"
                      style={{ backgroundColor: elementStyles.color }}
                      onClick={() => {
                        const color = prompt("Enter color (hex, rgb, or name):", elementStyles.color);
                        if (color) applyStyleChange("color", color);
                      }}
                    />
                    <Input
                      value={elementStyles.color}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => applyStyleChange("color", e.target.value)}
                      className="flex-1 bg-muted border-border text-foreground text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Background</Label>
                  <div className="flex gap-2 mt-1">
                    <div
                      className="w-10 h-10 rounded border border-border cursor-pointer"
                      style={{ backgroundColor: elementStyles.backgroundColor }}
                      onClick={() => {
                        const color = prompt("Enter background color:", elementStyles.backgroundColor);
                        if (color) applyStyleChange("backgroundColor", color);
                      }}
                    />
                    <Input
                      value={elementStyles.backgroundColor}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => applyStyleChange("backgroundColor", e.target.value)}
                      className="flex-1 bg-muted border-border text-foreground text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Font Size</Label>
                  <Input
                    value={elementStyles.fontSize}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => applyStyleChange("fontSize", e.target.value)}
                    className="bg-muted border-border text-foreground text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Font Weight</Label>
                  <select
                    value={elementStyles.fontWeight}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => applyStyleChange("fontWeight", e.target.value)}
                    className="w-full bg-muted border border-border text-foreground text-sm rounded px-3 py-1 mt-1"
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

              <TabsContent value="layout" className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Width</Label>
                    <Input
                      value={elementStyles.width}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => applyStyleChange("width", e.target.value)}
                      placeholder="auto"
                      className="bg-muted border-border text-foreground text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Height</Label>
                    <Input
                      value={elementStyles.height}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => applyStyleChange("height", e.target.value)}
                      placeholder="auto"
                      className="bg-muted border-border text-foreground text-sm mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Padding</Label>
                  <Input
                    value={elementStyles.padding}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => applyStyleChange("padding", e.target.value)}
                    placeholder="0px"
                    className="bg-muted border-border text-foreground text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Margin</Label>
                  <Input
                    value={elementStyles.margin}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => applyStyleChange("margin", e.target.value)}
                    placeholder="0px"
                    className="bg-muted border-border text-foreground text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Display</Label>
                  <select
                    value={elementStyles.display}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => applyStyleChange("display", e.target.value)}
                    className="w-full bg-muted border border-border text-foreground text-sm rounded px-3 py-1 mt-1"
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
                  <Label className="text-xs text-muted-foreground">Position</Label>
                  <select
                    value={elementStyles.position}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => applyStyleChange("position", e.target.value)}
                    className="w-full bg-muted border border-border text-foreground text-sm rounded px-3 py-1 mt-1"
                  >
                    <option value="static">Static</option>
                    <option value="relative">Relative</option>
                    <option value="absolute">Absolute</option>
                    <option value="fixed">Fixed</option>
                    <option value="sticky">Sticky</option>
                  </select>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </>
  );
}
