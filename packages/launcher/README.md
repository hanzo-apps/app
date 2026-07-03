# @hanzo/launcher

A portable ⌘Space launcher (Apple-style command palette) — **one UI codebase**,
rendered on `@hanzo/gui` (Tamagui), that targets **desktop (Tauri) + web + iOS +
Android** from the same source.

## Why it's a case study for `@hanzo/gui`

`@hanzo/gui` is a Tamagui fork: the same components render to `react-native-web`
on web/desktop and to native views on iOS/Android via Metro. This package proves
it end to end with a real app. The launcher UI (`src/Launcher.tsx`) is written
once with Gui primitives (`YStack`/`XStack`/`Input`/`Text`/`ScrollView`/
`Spinner`) and shorthand style props, and never touches a platform API. Each host
injects behaviour through two seams:

- `commands: CommandItem[]` — the things the palette can do; each `run()` is the
  host's (Tauri `invoke`, `window.open`, RN `Linking`, …).
- `onSearch(query)` — an optional async source (installed apps, remote hits).

## Targets

| Target | Entry | How Gui renders |
|--------|-------|-----------------|
| Desktop | `apps/launcher` (Tauri) | react-native-web bundle in a Tauri window |
| Web | `apps/launcher` (`vite build`) | react-native-web |
| iOS / Android | `apps/launcher-native` (Expo) | native views via Metro |

## Usage

```tsx
import { LauncherApp, type CommandItem } from '@hanzo/launcher'

const commands: CommandItem[] = [
  { id: 'open', title: 'Open Hanzo', group: 'Web', run: () => open('https://hanzo.ai') },
]

export default () => <LauncherApp commands={commands} />
```

`LauncherApp` includes the Gui root. Use `GuiRoot` + `Launcher` directly to mount
the palette inside an existing Gui tree. Peer deps: `@hanzo/gui`,
`@hanzogui/config`, `@hanzogui/lucide-icons-2`, `react` (>=19), `react-native`.
