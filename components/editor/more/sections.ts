import {
  Activity,
  Boxes,
  Cloud,
  CreditCard,
  Database,
  FileClock,
  FolderOpen,
  Gauge,
  KeyRound,
  LineChart,
  Plug,
  Search,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';

/**
 * Everything the More pane can show, in one list.
 *
 * The nav and the body both read this, so a row cannot exist in the sidebar and
 * render nothing when clicked — the failure that makes a settings screen feel
 * broken rather than incomplete.
 *
 * A row is either READ or it is not connected, and nothing in between. Every
 * section here except Security and SEO has a reader in `./index` that goes to a
 * live surface; those two say plainly that nothing answers them. There is no
 * third state announcing an endpoint nobody drew, because a settings pane that
 * describes what it would show teaches you to distrust what it does show.
 *
 * Each reader names its own endpoint where it renders it — a hint under a table,
 * the way every Hanzo product surface does it. Declaring the path here as well
 * would be a second copy free to drift from the fetch that actually runs.
 */
export interface Section {
  id: string;
  label: string;
  icon: typeof Cloud;
  /** One line: what this section is for. Shown as the pane's lede. */
  blurb: string;
  /** Nested rows, for a section that is really a group (Cloud). */
  children?: Section[];
}

export const SECTIONS: Section[] = [
  {
    id: 'analytics',
    label: 'Analytics',
    icon: LineChart,
    blurb: 'Traffic to your published app — visitors, pages, sources and devices.',
  },
  {
    id: 'cloud',
    label: 'Cloud',
    icon: Cloud,
    blurb: 'The Hanzo services this project runs on.',
    children: [
      {
        id: 'cloud-overview',
        label: 'Overview',
        icon: Gauge,
        blurb: 'What is provisioned for this project, and what is still to come.',
      },
      {
        id: 'cloud-database',
        label: 'Database',
        icon: Database,
        blurb: 'Hanzo Base — the data door your app reads and writes, proven live.',
      },
      {
        id: 'cloud-users',
        label: 'Users',
        icon: Users,
        blurb: 'Everyone who can sign in to this workspace, on Hanzo IAM.',
      },
      {
        id: 'cloud-storage',
        label: 'Storage',
        icon: FolderOpen,
        blurb: 'Buckets your app stores files, images and documents in.',
      },
      {
        id: 'cloud-secrets',
        label: 'Secrets',
        icon: KeyRound,
        blurb: 'API keys and credentials held in Hanzo KMS — names only, never a value.',
      },
      {
        id: 'cloud-logs',
        label: 'Logs',
        icon: FileClock,
        blurb: 'What your app did, and what went wrong.',
      },
      {
        id: 'cloud-usage',
        label: 'Usage',
        icon: Activity,
        blurb: 'What this project has consumed, and what it costs.',
      },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    icon: Sparkles,
    blurb: 'The models this project can call, and which one it calls by default.',
  },
  {
    id: 'agents',
    label: 'Agent integrations',
    icon: Boxes,
    blurb: 'MCP servers and tools your app can hand to an agent.',
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: CreditCard,
    blurb: 'Take money in your app — the real catalog, checkout and orders from commerce.',
  },
  {
    id: 'connectors',
    label: 'Connectors',
    icon: Plug,
    blurb: 'Third-party services this workspace has connected — any project can use them.',
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    blurb: 'Scan this project for exposed secrets, unsafe headers and vulnerable dependencies. Not connected yet.',
  },
  {
    id: 'seo',
    label: 'SEO & AI search',
    icon: Search,
    blurb: 'How your published app reads to a search engine and to an agent. Not connected yet.',
  },
];

/** Flatten to every addressable section, parents included. */
export function allSections(): Section[] {
  return SECTIONS.flatMap((s) => [s, ...(s.children ?? [])]);
}

export function findSection(id: string): Section | undefined {
  return allSections().find((s) => s.id === id);
}
