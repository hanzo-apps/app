"use client";

// The editor theme registry for the ONE code editor. Each theme is a CodeMirror
// extension = a chrome theme (background/gutter/selection) + a Dracula-family
// syntax HighlightStyle. Default is Hanzo Dracula: the Dracula palette on a
// true-black background, aligned to the Hanzo Dev TUI's Dracula/Alucard identity.
// Editor font is always Geist Mono.
import { useCallback, useEffect, useState } from "react";
import { EditorView, type Extension } from "@uiw/react-codemirror";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

const MONO =
  "var(--font-geist-mono), ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace";

interface Chrome {
  dark: boolean;
  bg: string;
  fg: string;
  caret: string;
  selection: string;
  gutterFg: string;
  activeFg: string;
  activeLine: string;
}

interface Palette {
  comment: string;
  keyword: string;
  string: string;
  number: string;
  type: string;
  func: string;
  variable: string;
  property: string;
  operator: string;
  punctuation: string;
  invalid: string;
}

function makeTheme(chrome: Chrome, p: Palette): Extension {
  const view = EditorView.theme(
    {
      "&": { backgroundColor: chrome.bg, color: chrome.fg },
      ".cm-content": { caretColor: chrome.caret, fontFamily: MONO },
      ".cm-scroller": { fontFamily: MONO },
      ".cm-gutters": { backgroundColor: chrome.bg, color: chrome.gutterFg, border: "none" },
      ".cm-activeLine": { backgroundColor: chrome.activeLine },
      ".cm-activeLineGutter": { backgroundColor: chrome.activeLine, color: chrome.activeFg },
      ".cm-cursor, .cm-dropCursor": { borderLeftColor: chrome.caret },
      "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
        { backgroundColor: chrome.selection },
      ".cm-selectionMatch": { backgroundColor: chrome.selection },
      "&.cm-focused": { outline: "none" },
    },
    { dark: chrome.dark },
  );

  const highlight = HighlightStyle.define([
    { tag: [t.comment, t.lineComment, t.blockComment, t.meta], color: p.comment, fontStyle: "italic" },
    { tag: [t.keyword, t.modifier, t.controlKeyword, t.operatorKeyword, t.definitionKeyword], color: p.keyword },
    { tag: [t.string, t.special(t.string), t.regexp, t.attributeValue], color: p.string },
    { tag: [t.number, t.bool, t.null, t.atom], color: p.number },
    { tag: [t.typeName, t.className, t.namespace, t.tagName], color: p.type, fontStyle: "italic" },
    { tag: [t.function(t.variableName), t.function(t.propertyName), t.definition(t.function(t.variableName))], color: p.func },
    { tag: [t.propertyName, t.attributeName], color: p.property },
    { tag: [t.variableName, t.self], color: p.variable },
    { tag: [t.operator, t.derefOperator, t.arithmeticOperator, t.logicOperator, t.compareOperator], color: p.operator },
    { tag: [t.punctuation, t.separator, t.bracket, t.angleBracket, t.squareBracket, t.paren, t.brace], color: p.punctuation },
    { tag: [t.heading], color: p.type, fontWeight: "bold" },
    { tag: [t.link, t.url], color: p.func, textDecoration: "underline" },
    { tag: [t.strong], fontWeight: "bold" },
    { tag: [t.emphasis], fontStyle: "italic" },
    { tag: [t.invalid], color: p.invalid },
  ]);

  return [view, syntaxHighlighting(highlight)];
}

// Hanzo Dracula — the Dracula palette on a true-black (#0a0a0a) ground.
const HANZO_DRACULA = makeTheme(
  {
    dark: true,
    bg: "#0a0a0a",
    fg: "#f8f8f2",
    caret: "#ff79c6",
    selection: "rgba(189,147,249,0.28)",
    gutterFg: "#4b4b57",
    activeFg: "#bd93f9",
    activeLine: "rgba(255,255,255,0.035)",
  },
  {
    comment: "#6272a4",
    keyword: "#ff79c6",
    string: "#f1fa8c",
    number: "#bd93f9",
    type: "#8be9fd",
    func: "#50fa7b",
    variable: "#f8f8f2",
    property: "#66d9ef",
    operator: "#ff79c6",
    punctuation: "#abb2c0",
    invalid: "#ff5555",
  },
);

// Hanzo Alucard — Dracula's light sibling (matches the dev TUI's Alucard).
const HANZO_ALUCARD = makeTheme(
  {
    dark: false,
    bg: "#fbf7f0",
    fg: "#1f1f1f",
    caret: "#a3144d",
    selection: "rgba(100,74,201,0.18)",
    gutterFg: "#b3ac9c",
    activeFg: "#644ac9",
    activeLine: "rgba(0,0,0,0.04)",
  },
  {
    comment: "#7b7554",
    keyword: "#a3144d",
    string: "#846e15",
    number: "#644ac9",
    type: "#036a96",
    func: "#14710a",
    variable: "#1f1f1f",
    property: "#036a96",
    operator: "#a3144d",
    punctuation: "#635d54",
    invalid: "#cb3a2a",
  },
);

// One Dark — the classic, on the same true-black ground.
const ONE_DARK = makeTheme(
  {
    dark: true,
    bg: "#0a0a0a",
    fg: "#abb2bf",
    caret: "#528bff",
    selection: "rgba(97,175,239,0.22)",
    gutterFg: "#4b5263",
    activeFg: "#abb2bf",
    activeLine: "rgba(255,255,255,0.035)",
  },
  {
    comment: "#7d8799",
    keyword: "#c678dd",
    string: "#98c379",
    number: "#d19a66",
    type: "#e5c07b",
    func: "#61afef",
    variable: "#e06c75",
    property: "#abb2bf",
    operator: "#56b6c2",
    punctuation: "#abb2bf",
    invalid: "#e06c75",
  },
);

export interface EditorTheme {
  id: string;
  label: string;
  extension: Extension;
}

export const EDITOR_THEMES: EditorTheme[] = [
  { id: "hanzo-dracula", label: "Hanzo Dracula", extension: HANZO_DRACULA },
  { id: "hanzo-alucard", label: "Hanzo Alucard", extension: HANZO_ALUCARD },
  { id: "one-dark", label: "One Dark", extension: ONE_DARK },
];

export const DEFAULT_EDITOR_THEME_ID = "hanzo-dracula";
const STORAGE_KEY = "hanzo-editor-theme";
const CHANGE_EVENT = "hanzo-editor-theme-change";

export function editorThemeExtension(id: string): Extension {
  return (EDITOR_THEMES.find((th) => th.id === id) ?? EDITOR_THEMES[0]).extension;
}

/**
 * The user's selected editor theme, persisted in localStorage and synced across
 * every editor instance on the page via a window event. SSR-safe: renders the
 * default until mounted, so the server HTML and first client render agree.
 */
export function useEditorTheme(): { themeId: string; setThemeId: (id: string) => void } {
  const [themeId, setThemeIdState] = useState(DEFAULT_EDITOR_THEME_ID);

  useEffect(() => {
    const read = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && EDITOR_THEMES.some((th) => th.id === stored)) setThemeIdState(stored);
      else setThemeIdState(DEFAULT_EDITOR_THEME_ID);
    };
    read();
    window.addEventListener(CHANGE_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(CHANGE_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  const setThemeId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setThemeIdState(id);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { themeId, setThemeId };
}
