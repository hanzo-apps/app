import { Linking } from 'react-native'
import { evalMathExpression, type CommandItem } from '@hanzo/launcher'
import { Calculator, Globe, Rocket, Search } from '@hanzogui/lucide-icons-2'

/**
 * Native platform actions. Same command identities as the desktop/web host
 * (`apps/launcher/src/actions.ts`), different backend: URLs open through React
 * Native's `Linking` instead of `window.open` / the Tauri opener plugin. The
 * shared launcher UI is unchanged.
 */
const open = (url: string): void => {
  void Linking.openURL(url)
}

export const commands: CommandItem[] = [
  {
    id: 'open-hanzo',
    title: 'Open Hanzo',
    subtitle: 'hanzo.ai',
    keywords: 'home website hanzo ai',
    group: 'Web',
    icon: Rocket,
    run: () => open('https://hanzo.ai'),
  },
  {
    id: 'open-github',
    title: 'Open Hanzo on GitHub',
    subtitle: 'github.com/hanzoai',
    keywords: 'source code repo git',
    group: 'Web',
    icon: Globe,
    run: () => open('https://github.com/hanzoai'),
  },
  {
    id: 'search-web',
    title: 'Search the web',
    subtitle: 'Open a Google search',
    keywords: 'google find lookup query',
    group: 'Web',
    icon: Search,
    run: () => open('https://www.google.com'),
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

export async function onSearch(query: string): Promise<CommandItem[]> {
  const value = evalMathExpression(query)
  if (value !== null) {
    return [
      {
        id: 'calc-result',
        title: `= ${value}`,
        subtitle: `Result of ${query.trim()}`,
        group: 'Calculator',
        icon: Calculator,
        run: () => undefined,
      },
    ]
  }
  return []
}
