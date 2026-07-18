"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MousePointer,
  Edit3,
  Code,
  Type,
  Palette,
  Move,
  Square,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Layers,
  Settings,
  X,
  Check,
  ChevronRight,
  Box
} from "lucide-react";
import { Button } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import { Label } from "@hanzo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hanzo/ui";
import { cn } from "@/lib/utils";
import { HexColorPicker } from "react-colorful";
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

export function VisualEditor({
  iframeRef,
  editorRef,
  isEnabled,
  onToggle,
  onElementSelect,
  onCodeUpdate
}: VisualEditorProps) {
  const [selectedElement, setSelectedElement] = useState<SelectedElementInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<"select" | "edit" | "move">("select");
  const [showPanel, setShowPanel] = useState(true);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

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

    target.style.outline = "2px solid #8b5cf6";
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
          outline: 2px solid #8b5cf6 !important;
          outline-offset: 2px !important;
        }
        .visual-editor-hover {
          outline: 2px dashed #a78bfa !important;
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

  return (
    <>
      {/* Visual Editor Toolbar — compact icon rail. */}
      <div className="absolute top-3 left-3 z-50 flex items-center gap-1 rounded-lg border border-white/10 bg-neutral-900/95 p-1 backdrop-blur-sm">
        <Button
          variant={isEnabled ? "default" : "ghost"}
          size="sm"
          onClick={() => onToggle(!isEnabled)}
          className={cn(
            "h-7 gap-1.5 px-2 text-xs",
            isEnabled && "bg-white text-neutral-900 hover:bg-neutral-200"
          )}
        >
          <MousePointer className="w-3.5 h-3.5" />
          Edit
        </Button>

        {isEnabled && (
          <>
            <div className="w-px h-5 bg-white/10" />
            <Button
              variant={editMode === "select" ? "secondary" : "ghost"}
              size="sm"
              className="size-7 p-0"
              onClick={() => setEditMode("select")}
            >
              <MousePointer className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={editMode === "edit" ? "secondary" : "ghost"}
              size="sm"
              className="size-7 p-0"
              onClick={() => setEditMode("edit")}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={editMode === "move" ? "secondary" : "ghost"}
              size="sm"
              className="size-7 p-0"
              onClick={() => setEditMode("move")}
            >
              <Move className="w-3.5 h-3.5" />
            </Button>
            <div className="w-px h-5 bg-white/10" />
            <Button
              variant="ghost"
              size="sm"
              className="size-7 p-0"
              onClick={() => setShowPanel(!showPanel)}
            >
              {showPanel ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </Button>
          </>
        )}
      </div>

      {/* Properties Panel */}
      {isEnabled && showPanel && selectedElement && (
        <div className="absolute top-20 right-4 z-50 w-80 bg-neutral-900/95 backdrop-blur-sm rounded-lg border border-neutral-800 max-h-[600px] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-white">Element Properties</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedElement(null)}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-1 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <Box className="w-3 h-3" />
                <span className="font-mono">{selectedElement.tagName}</span>
                {selectedElement.id && (
                  <span className="text-neutral-300">#{selectedElement.id}</span>
                )}
              </div>
              {selectedElement.className && (
                <div className="text-xs text-neutral-500 truncate">
                  .{selectedElement.className.split(' ').join('.')}
                </div>
              )}
              {selectedElement.sourceLocation && (
                <div className="flex items-center gap-1 text-xs text-neutral-300">
                  <Code className="w-3 h-3" />
                  Line {selectedElement.sourceLocation.line}
                </div>
              )}
            </div>
          </div>

          <Tabs defaultValue="content" className="flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-3 bg-neutral-800">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="styles">Styles</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>

            <div className="overflow-y-auto max-h-[400px]">
              <TabsContent value="content" className="p-4 space-y-4">
                <div>
                  <Label className="text-xs text-neutral-400">Text Content</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={elementText}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setElementText(e.target.value)}
                      className="flex-1 bg-neutral-800 border-neutral-700 text-white text-sm"
                    />
                    <Button size="sm" onClick={applyTextChange}>
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-neutral-400">CSS Selector</Label>
                  <code className="block mt-1 p-2 bg-neutral-800 rounded text-xs text-neutral-300 font-mono">
                    {selectedElement.selector}
                  </code>
                </div>
              </TabsContent>

              <TabsContent value="styles" className="p-4 space-y-4">
                <div>
                  <Label className="text-xs text-neutral-400">Text Color</Label>
                  <div className="flex gap-2 mt-1">
                    <div
                      className="w-10 h-10 rounded border border-neutral-700 cursor-pointer"
                      style={{ backgroundColor: elementStyles.color }}
                      onClick={() => {
                        const color = prompt("Enter color (hex, rgb, or name):", elementStyles.color);
                        if (color) applyStyleChange("color", color);
                      }}
                    />
                    <Input
                      value={elementStyles.color}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => applyStyleChange("color", e.target.value)}
                      className="flex-1 bg-neutral-800 border-neutral-700 text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-neutral-400">Background</Label>
                  <div className="flex gap-2 mt-1">
                    <div
                      className="w-10 h-10 rounded border border-neutral-700 cursor-pointer"
                      style={{ backgroundColor: elementStyles.backgroundColor }}
                      onClick={() => {
                        const color = prompt("Enter background color:", elementStyles.backgroundColor);
                        if (color) applyStyleChange("backgroundColor", color);
                      }}
                    />
                    <Input
                      value={elementStyles.backgroundColor}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => applyStyleChange("backgroundColor", e.target.value)}
                      className="flex-1 bg-neutral-800 border-neutral-700 text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-neutral-400">Font Size</Label>
                  <Input
                    value={elementStyles.fontSize}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => applyStyleChange("fontSize", e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs text-neutral-400">Font Weight</Label>
                  <select
                    value={elementStyles.fontWeight}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => applyStyleChange("fontWeight", e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 text-white text-sm rounded px-3 py-1 mt-1"
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
                    <Label className="text-xs text-neutral-400">Width</Label>
                    <Input
                      value={elementStyles.width}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => applyStyleChange("width", e.target.value)}
                      placeholder="auto"
                      className="bg-neutral-800 border-neutral-700 text-white text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-neutral-400">Height</Label>
                    <Input
                      value={elementStyles.height}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => applyStyleChange("height", e.target.value)}
                      placeholder="auto"
                      className="bg-neutral-800 border-neutral-700 text-white text-sm mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-neutral-400">Padding</Label>
                  <Input
                    value={elementStyles.padding}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => applyStyleChange("padding", e.target.value)}
                    placeholder="0px"
                    className="bg-neutral-800 border-neutral-700 text-white text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs text-neutral-400">Margin</Label>
                  <Input
                    value={elementStyles.margin}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => applyStyleChange("margin", e.target.value)}
                    placeholder="0px"
                    className="bg-neutral-800 border-neutral-700 text-white text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs text-neutral-400">Display</Label>
                  <select
                    value={elementStyles.display}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => applyStyleChange("display", e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 text-white text-sm rounded px-3 py-1 mt-1"
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
                  <Label className="text-xs text-neutral-400">Position</Label>
                  <select
                    value={elementStyles.position}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => applyStyleChange("position", e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 text-white text-sm rounded px-3 py-1 mt-1"
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