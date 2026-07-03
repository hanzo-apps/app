/**
 * `@hanzo/launcher` — the portable launcher UI, a case study for `@hanzo/gui`.
 *
 * ONE UI codebase → desktop (Tauri) + web + iOS/Android (Expo). Import the
 * component here; inject your platform's `commands` / `onSearch`; mount it under
 * `GuiRoot` (or use `LauncherApp`, which includes the root).
 */
export { Launcher } from './Launcher'
export { LauncherApp } from './LauncherApp'
export { GuiRoot } from './Provider'
export { createIndex, search } from './search'
export type { CommandIndex } from './search'
export { evalMathExpression } from './math'
export type { CommandItem, IconComponent, LauncherProps } from './types'
export { config as guiConfig } from '../gui.config'
