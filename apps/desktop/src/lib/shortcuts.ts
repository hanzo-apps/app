export const validShortcutTokensRegex = /^[a-zA-Z0-9\s\+\-\.\,\;\:\!\?\@\#\$\%\^\&\*\(\)\_\=\[\]\{\}\|\\\<\>\/\~\`\'\"]+$/;

export const defaultShortcuts = [
  {
    id: 'toggle-launcher',
    name: 'Toggle Launcher',
    keys: ['cmd', 'k'],
    description: 'Show/hide the launcher window'
  },
  {
    id: 'toggle-ai-chat',
    name: 'Toggle AI Chat',
    keys: ['cmd', 'shift', 'k'],
    description: 'Show/hide the AI chat window'
  },
  {
    id: 'dismiss',
    name: 'Dismiss',
    keys: ['escape'],
    description: 'Close current window or dialog'
  },
  {
    id: 'search-focus',
    name: 'Focus Search',
    keys: ['cmd', 'f'],
    description: 'Focus the search input'
  },
  {
    id: 'new-chat',
    name: 'New Chat',
    keys: ['cmd', 'n'],
    description: 'Start a new chat conversation'
  },
  {
    id: 'settings',
    name: 'Settings',
    keys: ['cmd', ','],
    description: 'Open settings'
  },
  {
    id: 'quit',
    name: 'Quit',
    keys: ['cmd', 'q'],
    description: 'Quit the application'
  }
];

export function parseShortcut(shortcut: string): string[] {
  return shortcut.toLowerCase().split('+').map(s => s.trim());
}

export function formatShortcut(keys: string[]): string {
  return keys.map(k => {
    switch(k) {
      case 'cmd':
      case 'command':
        return '⌘';
      case 'shift':
        return '⇧';
      case 'alt':
      case 'option':
        return '⌥';
      case 'ctrl':
      case 'control':
        return '⌃';
      default:
        return k.toUpperCase();
    }
  }).join('');
}