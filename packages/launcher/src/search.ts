import Fuse from 'fuse.js'

import type { CommandItem } from './types'

/**
 * Portable fuzzy matching. Pure data in, pure data out — no DOM, no RN, no
 * platform APIs — so the identical index powers web, desktop and native.
 */
export type CommandIndex = Fuse<CommandItem>

export function createIndex(commands: CommandItem[]): CommandIndex {
  return new Fuse(commands, {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'keywords', weight: 1 },
      { name: 'subtitle', weight: 0.5 },
      { name: 'group', weight: 0.25 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
  })
}

export function search(index: CommandIndex, all: CommandItem[], query: string, limit = 12): CommandItem[] {
  const q = query.trim()
  if (!q) return all.slice(0, limit)
  return index
    .search(q)
    .slice(0, limit)
    .map((r) => r.item)
}
