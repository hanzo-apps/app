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
 * `where` is the surface that ANSWERS the section, and it is the honest part.
 * A section with a `where` reads real state from a real endpoint. A section
 * without one is named, reachable, and says plainly that it is not connected
 * yet — because a settings pane that renders a convincing empty dashboard over
 * nothing is worse than one that admits the gap: the first teaches you to
 * distrust every number on the screen.
 */
export interface Section {
  id: string;
  label: string;
  icon: typeof Cloud;
  /** The BFF path that backs it. Absent = named but not connected yet. */
  where?: string;
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
    where: '/v1/analytics',
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
        where: '/v1/provision',
        blurb: 'What is provisioned for this project, and what is still to come.',
      },
      {
        id: 'cloud-database',
        label: 'Database',
        icon: Database,
        where: '/v1/base',
        blurb: 'Hanzo Base — the per-project store your app reads and writes.',
      },
      {
        id: 'cloud-users',
        label: 'Users',
        icon: Users,
        blurb: 'Sign-in for your app, on Hanzo IAM. Not connected yet.',
      },
      {
        id: 'cloud-storage',
        label: 'Storage',
        icon: FolderOpen,
        blurb: 'Files, images and documents your app uploads. Not connected yet.',
      },
      {
        id: 'cloud-secrets',
        label: 'Secrets',
        icon: KeyRound,
        blurb: 'API keys and credentials, held in Hanzo KMS. Not connected yet.',
      },
      {
        id: 'cloud-logs',
        label: 'Logs',
        icon: FileClock,
        where: '/v1/o11y',
        blurb: 'What your app did, and what went wrong.',
      },
      {
        id: 'cloud-usage',
        label: 'Usage',
        icon: Activity,
        where: '/v1/usage',
        blurb: 'What this project has consumed, and what it costs.',
      },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    icon: Sparkles,
    where: '/v1/models',
    blurb: 'The models this project can call, and which one it calls by default.',
  },
  {
    id: 'agents',
    label: 'Agent integrations',
    icon: Boxes,
    where: '/v1/mcp',
    blurb: 'MCP servers and tools your app can hand to an agent.',
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: CreditCard,
    where: '/v1/commerce',
    blurb: 'Take money in your app — catalog, checkout and orders.',
  },
  {
    id: 'connectors',
    label: 'Connectors',
    icon: Plug,
    where: '/v1/connectors',
    blurb: 'Third-party services this project is linked to.',
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
