/**
 * Every way to get Hanzo, in one list — the model behind /download.
 *
 * A surface appears here only if something real is behind it: a resolved
 * release asset, or a host that answers. The URLs are NOT written here — they
 * come from `data/releases.json`, which `scripts/sync-releases.mjs` resolves
 * against the actual releases on every build. So a platform whose build stopped
 * publishing stops rendering, rather than becoming a button that 404s.
 *
 * There is no mobile card. No iOS or Android build exists in any repo
 * (hanzoai/mobile, hanzoai/ios and hanzoai/android have no releases), and a
 * tile that says "coming soon" is an apology occupying the place of a product.
 * When a build ships, add the pattern to the sync and a card here.
 */

import {
  AppWindow,
  Chrome,
  Code,
  Command,
  Compass,
  Flame,
  MousePointer2,
  Braces,
  Terminal,
  Wind,
  type LucideIcon,
} from 'lucide-react'

import releases from './releases.json'

/** One row: a platform, and the artifact it downloads. */
export interface Build {
  name: string
  url: string
  /** Bytes, from the release payload — shown so a reader knows what they are taking. */
  size: number
  icon?: LucideIcon
}

export interface Surface {
  id: string
  name: string
  /** What it is, in the reader's words. */
  blurb: string
  /** A real capture of this surface doing its job. Omitted when we have none. */
  visual?: string
  /** The version behind the builds, when they come from a release. */
  version?: string
  /** One command that installs it, for the surfaces that have one. */
  command?: string
  /** Per-platform downloads, as rows. */
  builds?: Build[]
  /** A hosted surface opens rather than downloads. */
  open?: { href: string; label: string }
  /** Where the full list of builds lives. */
  all?: string
}

type Resolved = Record<string, { repo: string; version: string; platforms: Record<string, { url: string; size: number }> }>
const R = releases as Resolved

/** Rows for a resolved surface, in the declared order, skipping what did not publish. */
const builds = (id: string, order: [string, LucideIcon?][]): Build[] =>
  order
    .filter(([name]) => R[id]?.platforms[name])
    .map(([name, icon]) => ({ name, icon, ...R[id].platforms[name] }))

/**
 * The order is the order a reader wants them: the two we lead with, then the
 * app on their machine, then the hosted workspace, then the two that install
 * into something they already have open.
 */
export const SURFACES: Surface[] = [
  {
    id: 'cli',
    name: 'Hanzo CLI',
    blurb:
      'The coding agent, in your terminal. It reads the repo you are in, writes and runs code, and drives every product of the Hanzo cloud from one binary.',
    command: 'curl -fsSL hanzo.sh | sh',
    version: R.cli?.version,
    visual: '/download/cli.png',
    builds: builds('cli', [
      ['macOS (Apple Silicon)', Command],
      ['macOS (Intel)', Command],
      ['Windows', AppWindow],
      ['Linux (x86_64)', Terminal],
      ['Linux (arm64)', Terminal],
    ]),
    all: 'https://github.com/hanzoai/cli/releases/latest',
  },
  {
    id: 'team',
    name: 'Hanzo Team',
    blurb:
      'Chat, channels and threads for your whole company, with Hanzo in the room. Ask it to summarize a channel or answer in-thread, and it already has your org context.',
    open: { href: 'https://hanzo.team', label: 'Open Hanzo Team' },
  },
  {
    id: 'desktop',
    name: 'Desktop',
    blurb:
      'A native app with a global hotkey. Talk to Hanzo from any window, capture a region of the screen, and put the answer back where you were typing.',
    version: R.desktop?.version,
    builds: builds('desktop', [
      ['macOS', Command],
      ['Windows', AppWindow],
      ['Linux (AppImage)', Terminal],
      ['Linux (deb)', Terminal],
    ]),
    all: 'https://github.com/hanzoai/extension/releases/latest',
  },
  {
    id: 'studio',
    name: 'Hanzo Studio',
    blurb:
      'Build, run and ship AI apps in the browser. Compose agents, wire your models and data, and deploy without leaving the page.',
    open: { href: 'https://studio.hanzo.ai', label: 'Open Studio' },
  },
  {
    id: 'browser',
    name: 'Browser extension',
    blurb:
      'Ask Hanzo about the page you are on. It reads the tab for context, captures what you select, and runs agents from the toolbar.',
    version: R.browser?.version,
    builds: builds('browser', [
      ['Chrome', Chrome],
      ['Firefox', Flame],
      ['Safari', Compass],
      ['Edge', AppWindow],
    ]),
    all: 'https://github.com/hanzoai/extension/releases/latest',
  },
  {
    id: 'editor',
    name: 'Editors',
    blurb:
      'Completions, chat and agentic edits where you already write code. One extension, every editor that takes one.',
    version: R.editor?.version,
    builds: builds('editor', [
      ['VS Code', Code],
      ['Cursor', MousePointer2],
      ['Windsurf', Wind],
      ['JetBrains', Braces],
    ]),
    all: 'https://github.com/hanzoai/extension/releases/latest',
  },
]

/** The one surface the page leads with, and the rest as a grid. */
export const [LEAD, ...REST] = SURFACES

/** Bytes as a reader reads them. */
export const weigh = (bytes: number): string =>
  bytes >= 1 << 20 ? `${Math.round(bytes / (1 << 20))} MB` : `${Math.round(bytes / 1024)} KB`
