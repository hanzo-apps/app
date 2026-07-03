import { YStack } from '@hanzo/gui'

import { Launcher } from './Launcher'
import { GuiRoot } from './Provider'
import type { LauncherProps } from './types'

/**
 * The whole launcher window — Gui root + centered palette. This is the single
 * screen every thin per-platform entry mounts (Tauri `main.tsx`, Expo `App.tsx`,
 * web `main.tsx`). The only thing that differs between platforms is the
 * `commands` / `onSearch` the host injects.
 */
export function LauncherApp({
  defaultTheme = 'dark',
  ...launcher
}: LauncherProps & { defaultTheme?: string }) {
  return (
    <GuiRoot defaultTheme={defaultTheme}>
      <YStack flex={1} width="100%" px="$4" pt="$8" items="center" bg="$color1">
        <Launcher {...launcher} />
      </YStack>
    </GuiRoot>
  )
}
