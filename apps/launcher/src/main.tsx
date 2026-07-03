import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LauncherApp } from '@hanzo/launcher'

import { commands, onSearch } from './actions'

/**
 * Web + Tauri desktop entry. It is deliberately tiny: mount the shared
 * `LauncherApp` (Gui root + palette) and hand it this platform's commands. The
 * SAME bundle is served in the browser and loaded by the Tauri window.
 */
async function requestClose(): Promise<void> {
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    await getCurrentWindow().hide()
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LauncherApp commands={commands} onSearch={onSearch} onRequestClose={() => void requestClose()} />
  </StrictMode>,
)
