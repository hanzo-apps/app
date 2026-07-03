import type { ComponentType } from 'react'

/**
 * Render-minimal icon slot. The launcher only ever passes `size`, so any icon
 * component that accepts an optional `size` satisfies it — Gui/lucide icons on
 * web/desktop and `lucide-react-native` icons on native alike. Keeping the
 * contract to `size` (rather than a themed `color`) is what lets the SAME
 * `CommandItem` carry a web themed-icon or a native icon without a type clash.
 */
export type IconComponent = ComponentType<{ size?: number }>

/**
 * A single launchable thing — an app, a command, an action, a search hit.
 *
 * `run` is the ONLY platform-specific surface. The UI never knows whether
 * `run` shells out through Tauri `invoke`, opens a URL in the browser, or fires
 * a native intent — the host injects it. That is what makes ONE launcher UI
 * portable across desktop, web and native.
 */
export interface CommandItem {
  id: string
  title: string
  subtitle?: string
  /** Extra text folded into fuzzy matching (synonyms, ids, paths). */
  keywords?: string
  /** Section header this item groups under (e.g. "Commands", "Applications"). */
  group?: string
  icon?: IconComponent
  run: () => void | Promise<void>
}

export interface LauncherProps {
  /** Base commands, fuzzy-filtered locally on every keystroke. */
  commands: CommandItem[]
  /**
   * Optional async source (installed-app search, remote results). Appended to
   * the local matches. Debounced by the launcher. Injected by the host so the
   * UI stays free of platform APIs.
   */
  onSearch?: (query: string) => Promise<CommandItem[]>
  placeholder?: string
  /** Called on Escape (empty query) — host hides / closes the window. */
  onRequestClose?: () => void
  autoFocus?: boolean
}
