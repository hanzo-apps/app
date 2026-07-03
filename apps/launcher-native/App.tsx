import { SafeAreaProvider } from 'react-native-safe-area-context'
import { LauncherApp } from '@hanzo/launcher'

import { commands, onSearch } from './src/actions.native'

/**
 * iOS / Android / native-web entry. Identical shape to the desktop entry
 * (`apps/launcher/src/main.tsx`): mount the shared `LauncherApp` and inject this
 * platform's commands. The launcher UI itself is the exact same `@hanzo/gui`
 * component — Metro just resolves Gui's `react-native` build instead of the
 * `react-native-web` one.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <LauncherApp commands={commands} onSearch={onSearch} />
    </SafeAreaProvider>
  )
}
