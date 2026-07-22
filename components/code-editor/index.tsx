"use client";

// The one code editor for the whole app. CodeMirror 6 (via @uiw/react-codemirror)
// bundled locally — no CDN, no web workers — so it is CSP-clean where Monaco was
// not (Monaco pulled its CSS + workers from jsdelivr, which prod CSP blocks).
//
// Every call site uses THIS component. No per-file CodeMirror setup lives
// anywhere else. Dark, monochrome chrome (true-black to match the #0a0a0a
// builder panels); readable one-dark token colors on top.

import { useCallback, useEffect, useMemo, useRef } from "react";
import CodeMirror, {
  EditorView,
  type Extension,
} from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { sql } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";

// LiteralUnion: keep the common suggestions while accepting any language string
// the file-type detectors produce (json / markdown / xml / yaml / plaintext …).
export type CodeEditorLanguage =
  | "html"
  | "css"
  | "javascript"
  | "typescript"
  | "sql"
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {});

// Imperative handle for the few callers that need to drive the document
// (the builder's visual editor + "scroll to bottom"). Monaco exposed an
// IStandaloneCodeEditor; this is the minimal, CodeMirror-backed equivalent.
// All methods no-op safely once the editor has unmounted (view === null).
export interface CodeEditorHandle {
  getValue(): string;
  getLineCount(): number;
  /** 1-based line -> that line's text (without the trailing newline). */
  getLineContent(lineNumber: number): string;
  /** char offset -> 1-based { lineNumber, column } (Monaco getPositionAt shape). */
  getPositionAt(offset: number): { lineNumber: number; column: number };
  /** Scroll a 1-based line to the center of the viewport. */
  revealLine(lineNumber: number): void;
  /** Replace a whole 1-based line's text. */
  replaceLine(lineNumber: number, text: string): void;
}

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: CodeEditorLanguage;
  readOnly?: boolean;
  className?: string;
  height?: string;
  /** Called once when the editor is ready; hand back for imperative access. */
  onReady?: (handle: CodeEditorHandle) => void;
}

function languageExtension(language?: string): Extension[] {
  switch ((language ?? "").toLowerCase()) {
    case "html":
    case "htm":
      return [html()];
    case "css":
      return [css()];
    case "javascript":
    case "js":
    case "mjs":
    case "jsx":
      return [javascript({ jsx: true })];
    case "typescript":
    case "ts":
    case "tsx":
      return [javascript({ jsx: true, typescript: true })];
    case "sql":
      return [sql()];
    default:
      // json / markdown / xml / yaml / plaintext: edit as plain text.
      return [];
  }
}

// True-black monochrome chrome. Layered AFTER oneDark so it overrides oneDark's
// bluish background/selection while keeping oneDark's readable token colors.
const blackChrome = EditorView.theme(
  {
    "&": { backgroundColor: "#0a0a0a", color: "#e5e5e5" },
    ".cm-content": {
      caretColor: "#fafafa",
      fontFamily:
        "var(--font-geist-mono), ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
    },
    ".cm-scroller": {
      fontFamily:
        "var(--font-geist-mono), ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
    },
    ".cm-gutters": {
      backgroundColor: "#0a0a0a",
      color: "#525252",
      border: "none",
    },
    ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.04)" },
    ".cm-activeLineGutter": {
      backgroundColor: "rgba(255,255,255,0.04)",
      color: "#a3a3a3",
    },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#fafafa" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      { backgroundColor: "rgba(255,255,255,0.15)" },
    "&.cm-focused": { outline: "none" },
  },
  { dark: true }
);

const hanzoDark: Extension = [oneDark, blackChrome];

function makeHandle(
  viewRef: { current: EditorView | null }
): CodeEditorHandle {
  const clampLine = (view: EditorView, n: number) =>
    Math.min(Math.max(1, Math.floor(n) || 1), view.state.doc.lines);
  return {
    getValue: () => viewRef.current?.state.doc.toString() ?? "",
    getLineCount: () => viewRef.current?.state.doc.lines ?? 0,
    getLineContent: (lineNumber) => {
      const view = viewRef.current;
      if (!view) return "";
      return view.state.doc.line(clampLine(view, lineNumber)).text;
    },
    getPositionAt: (offset) => {
      const view = viewRef.current;
      if (!view) return { lineNumber: 1, column: 1 };
      const pos = Math.min(Math.max(0, offset), view.state.doc.length);
      const line = view.state.doc.lineAt(pos);
      return { lineNumber: line.number, column: pos - line.from + 1 };
    },
    revealLine: (lineNumber) => {
      const view = viewRef.current;
      if (!view) return;
      const line = view.state.doc.line(clampLine(view, lineNumber));
      view.dispatch({ effects: EditorView.scrollIntoView(line.from, { y: "center" }) });
    },
    replaceLine: (lineNumber, text) => {
      const view = viewRef.current;
      if (!view) return;
      const line = view.state.doc.line(clampLine(view, lineNumber));
      view.dispatch({ changes: { from: line.from, to: line.to, insert: text } });
    },
  };
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  className,
  height = "100%",
  onReady,
}: CodeEditorProps) {
  const viewRef = useRef<EditorView | null>(null);
  const handleRef = useRef<CodeEditorHandle | null>(null);

  const extensions = useMemo<Extension[]>(
    () => [...languageExtension(language), EditorView.lineWrapping],
    [language]
  );

  const handleCreate = useCallback(
    (view: EditorView) => {
      viewRef.current = view;
      if (!handleRef.current) handleRef.current = makeHandle(viewRef);
      onReady?.(handleRef.current);
    },
    [onReady]
  );

  const handleChange = useCallback(
    (val: string) => {
      onChange?.(val);
    },
    [onChange]
  );

  // Drop the view reference on unmount so the imperative handle's methods
  // safely no-op once the editor is gone (the handle object may outlive it).
  useEffect(() => () => {
    viewRef.current = null;
  }, []);

  return (
    <CodeMirror
      value={value}
      theme={hanzoDark}
      height={height}
      style={{ height, width: "100%" }}
      className={className}
      extensions={extensions}
      readOnly={readOnly}
      basicSetup={{ foldGutter: false }}
      onChange={handleChange}
      onCreateEditor={handleCreate}
    />
  );
}

export default CodeEditor;
