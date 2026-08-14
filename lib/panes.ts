import { Code2, FileText, Globe, Layers, MessageCircleCode } from "lucide-react";

/**
 * The panes of the builder, named once.
 *
 * The header's switcher and the right side's renderer both read THIS, so a pane
 * cannot exist in the bar and not in the body — which is exactly what happened
 * the first time `code` was added: the tab list was a literal in the header and
 * the body switched on a string, and the two agreed only because one person
 * held both in their head.
 *
 * `chat` is not a right-hand pane at all — it is the left column, permanently
 * docked on desktop, and only means anything below `$lg` where one column shows
 * at a time. It lives in this list because it IS a pane on a phone, and the
 * switcher needs it there; `mobileOnly` is what keeps it out of the desktop bar.
 */
export const PANES = [
  { value: "chat", label: "Chat", icon: MessageCircleCode, mobileOnly: true },
  { value: "preview", label: "Preview", icon: Globe },
  { value: "files", label: "Files", icon: FileText },
  { value: "code", label: "Code", icon: Code2 },
  { value: "more", label: "More", icon: Layers },
] as const;

export type Pane = (typeof PANES)[number]["value"];

/** The panes that render on the RIGHT — everything except the chat column. */
export type RightPane = Exclude<Pane, "chat">;

const RIGHT = new Set<string>(PANES.filter((p) => p.value !== "chat").map((p) => p.value));

/**
 * Which pane the right side shows for a given tab.
 *
 * `chat` is the one tab with no right-hand answer of its own: on a phone it
 * replaces the right side entirely, and on desktop it is always visible beside
 * whatever is there, so the right side keeps showing the preview. Returning a
 * real pane rather than `null` is what lets the caller render unconditionally.
 */
export function rightPane(tab: string): RightPane {
  return RIGHT.has(tab) ? (tab as RightPane) : "preview";
}

/** A pane's human label — the title the bar shows for whatever is open. */
export function paneLabel(pane: string): string {
  return PANES.find((p) => p.value === pane)?.label ?? "";
}
