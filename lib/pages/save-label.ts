import type { SaveState } from "@/hooks/useAutosave";

/**
 * What the status bar says about persistence.
 *
 * It lives apart from the hook because the WORDS are the thing that was wrong:
 * the bar printed "Auto-saved" unconditionally while nothing saved, so the one
 * rule here is that no state may claim saved unless a server write actually
 * landed. Keeping the mapping in one testable function is what stops a new state
 * being added without deciding what it tells the user.
 */
export function saveLabel(state: SaveState, at: Date | null): string {
  const time = at
    ? at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "";

  switch (state) {
    case "saving":
      return "Saving…";
    case "error":
      // Never soften this. A failed write with a cheerful label is how work is
      // lost by someone who had every reason to think it was safe.
      return "Not saved — retrying";
    case "unsaved":
      // No project record: there is nowhere to save. Publish creates one.
      return "Not saved — publish to keep it";
    case "saved":
    case "idle":
      return at ? `Saved ${time}` : "Not saved yet";
  }
}
