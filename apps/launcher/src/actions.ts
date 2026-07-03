import { evalMathExpression, type CommandItem } from '@hanzo/launcher'
import { Calculator, Clipboard, Globe, Rocket, Search, Terminal } from '@hanzogui/lucide-icons-2'

/**
 * Platform action injection for the shared launcher UI.
 *
 * Same command list, two backends: inside a Tauri window the actions shell out
 * through `@tauri-apps/*` (open URLs via the opener plugin, list installed apps
 * via an `invoke('search_apps')` command); in a plain browser they fall back to
 * `window.open` / a static demo catalog. The launcher component never sees this
 * split — it only calls `CommandItem.run` and `onSearch`.
 */
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

async function openUrl(url: string): Promise<void> {
  if (isTauri) {
    const { openUrl } = await import('@tauri-apps/plugin-opener')
    await openUrl(url)
  } else if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener')
  }
}

async function copyText(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(text)
  }
}

export const commands: CommandItem[] = [
  {
    id: 'open-hanzo',
    title: 'Open Hanzo',
    subtitle: 'hanzo.ai',
    keywords: 'home website hanzo ai',
    group: 'Web',
    icon: Rocket,
    run: () => openUrl('https://hanzo.ai'),
  },
  {
    id: 'open-github',
    title: 'Open Hanzo on GitHub',
    subtitle: 'github.com/hanzoai',
    keywords: 'source code repo git',
    group: 'Web',
    icon: Globe,
    run: () => openUrl('https://github.com/hanzoai'),
  },
  {
    id: 'search-web',
    title: 'Search the web',
    subtitle: 'Open a Google search',
    keywords: 'google find lookup query',
    group: 'Web',
    icon: Search,
    run: () => openUrl('https://www.google.com'),
  },
  {
    id: 'copy-time',
    title: 'Copy current time',
    subtitle: 'Copies the local time to the clipboard',
    keywords: 'clock now clipboard date',
    group: 'Utilities',
    icon: Clipboard,
    run: () => copyText(new Date().toLocaleString()),
  },
  {
    id: 'terminal',
    title: 'Open Terminal',
    subtitle: isTauri ? 'Launch the system terminal' : 'Available in the desktop app',
    keywords: 'shell console command',
    group: 'System',
    icon: Terminal,
    run: async () => {
      if (isTauri) {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('open_terminal').catch(() => undefined)
      }
    },
  },
  {
    id: 'calculator',
    title: 'Calculator',
    subtitle: 'Type a math expression to evaluate it',
    keywords: 'math compute sum arithmetic',
    group: 'Utilities',
    icon: Calculator,
    run: () => undefined,
  },
]

/**
 * Async result source. On desktop it asks the Rust side for installed apps; on
 * web it evaluates a math expression (so the async path is exercised in the
 * browser too) and otherwise returns nothing.
 */
export async function onSearch(query: string): Promise<CommandItem[]> {
  const q = query.trim()

  // Math: "12 * (3 + 4)" -> a result row. Shared, safe evaluator.
  const value = evalMathExpression(q)
  if (value !== null) {
    return [
      {
        id: 'calc-result',
        title: `= ${value}`,
        subtitle: `Copy the result of ${q}`,
        group: 'Calculator',
        icon: Calculator,
        run: () => copyText(String(value)),
      },
    ]
  }

  if (isTauri) {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const apps = await invoke<Array<{ name: string; path: string }>>('search_apps', { query: q })
      return apps.slice(0, 8).map((app) => ({
        id: `app:${app.path}`,
        title: app.name,
        subtitle: app.path,
        group: 'Applications',
        icon: Rocket,
        run: async () => {
          const { invoke: inv } = await import('@tauri-apps/api/core')
          await inv('open_app', { path: app.path }).catch(() => undefined)
        },
      }))
    } catch {
      return []
    }
  }

  return []
}
