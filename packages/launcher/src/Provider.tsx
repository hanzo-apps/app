import type { ReactNode } from 'react'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui.config'

/**
 * The one Gui root. Wrap any target's tree in this and the launcher renders with
 * the shared theme on web, desktop and native. On web/desktop `GuiProvider`
 * injects the stylesheet at runtime; on native it wires the RN driver.
 */
export function GuiRoot({
  children,
  defaultTheme = 'dark',
}: {
  children: ReactNode
  defaultTheme?: string
}) {
  return (
    <GuiProvider config={config} defaultTheme={defaultTheme}>
      {children}
    </GuiProvider>
  )
}
