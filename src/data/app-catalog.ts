/**
 * Hanzo App Catalog
 *
 * Every surface a user can install or connect to Hanzo. All share one
 * foundation: the @hanzo/ai gateway + @hanzo/iam identity — sign in once,
 * one `hk-` key, and every app below is authenticated.
 *
 * Two kinds of entry:
 *   - install  → downloadable extensions/apps. Action links to the latest
 *                release of the unified Hanzo extension bundle.
 *   - connect  → hosted / OAuth apps. Action links to the docs for wiring up.
 */

import {
  AppWindow,
  Bot,
  Braces,
  Calculator,
  Chrome,
  Cloud,
  Code,
  Command,
  Compass,
  Figma,
  FileSignature,
  FileText,
  Flame,
  Github,
  Gitlab,
  HardHat,
  Headset,
  HeartPulse,
  LayoutGrid,
  Mail,
  Megaphone,
  MousePointer2,
  Notebook,
  NotebookText,
  Orbit,
  PenTool,
  Scale,
  Search,
  ShoppingBag,
  Slack,
  Terminal,
  Users,
  Video,
  Webcam,
  Wind,
  type LucideIcon,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export type AppAction = 'install' | 'connect';

export interface AppEntry {
  name: string;
  blurb: string;
  icon: LucideIcon;
}

export interface AppGroup {
  category: string;
  apps: AppEntry[];
}

// =============================================================================
// ACTION TARGETS — one URL per action kind (see task contract)
// =============================================================================

/** Latest release of the unified Hanzo extension bundle (all installers). */
export const INSTALL_URL = 'https://github.com/hanzoai/extension/releases/latest';

/** Docs home — connect / OAuth setup for hosted apps. */
export const CONNECT_URL = 'https://docs.hanzo.ai';

// =============================================================================
// EXTENSIONS — download & install (→ INSTALL_URL)
// =============================================================================

export const installCatalog: AppGroup[] = [
  {
    category: 'Browser',
    apps: [
      { name: 'Chrome', blurb: 'Ask Hanzo about any page, capture context, and run agents from the toolbar.', icon: Chrome },
      { name: 'Edge', blurb: 'Full Hanzo assistant for Microsoft Edge with the same Chromium feature set.', icon: AppWindow },
      { name: 'Firefox', blurb: 'Privacy-first Hanzo add-on for Mozilla Firefox.', icon: Flame },
      { name: 'Safari', blurb: 'Native Hanzo extension for Safari on macOS and iOS.', icon: Compass },
    ],
  },
  {
    category: 'IDEs & editors',
    apps: [
      { name: 'VS Code', blurb: 'Inline completions, chat, and agentic edits inside Visual Studio Code.', icon: Code },
      { name: 'Cursor', blurb: 'Wire Hanzo models and MCP tools into the Cursor editor.', icon: MousePointer2 },
      { name: 'Windsurf', blurb: 'Hanzo agents and gateway models in the Windsurf editor.', icon: Wind },
      { name: 'Antigravity', blurb: 'Connect Hanzo to the Antigravity agentic IDE.', icon: Orbit },
      { name: 'JetBrains', blurb: 'One plugin for IntelliJ, PyCharm, GoLand, WebStorm, and the rest.', icon: Braces },
    ],
  },
  {
    category: 'Office',
    apps: [
      { name: 'Word, Excel & PowerPoint', blurb: 'Draft, analyze, and generate slides with Hanzo inside Microsoft Office.', icon: FileText },
      { name: 'Outlook', blurb: 'Summarize threads and draft replies from your Outlook inbox.', icon: Mail },
    ],
  },
  {
    category: 'Design',
    apps: [
      { name: 'Figma', blurb: 'Generate copy, components, and design specs from inside Figma.', icon: Figma },
      { name: 'Sketch', blurb: 'Bring Hanzo assistance into your Sketch design workflow.', icon: PenTool },
    ],
  },
  {
    category: 'Team apps',
    apps: [
      { name: 'Microsoft Teams', blurb: 'Chat with Hanzo and run agents without leaving Teams.', icon: Users },
      { name: 'Zendesk', blurb: 'Draft, triage, and resolve support tickets with Hanzo in Zendesk.', icon: Headset },
    ],
  },
  {
    category: 'Desktop app',
    apps: [
      { name: 'macOS', blurb: 'Menubar app with a global hotkey — Hanzo anywhere on your Mac.', icon: Command },
      { name: 'Windows', blurb: 'System-tray app with a global hotkey for Hanzo on Windows.', icon: AppWindow },
      { name: 'Linux', blurb: 'Native desktop app with a global hotkey for Hanzo on Linux.', icon: Terminal },
    ],
  },
  {
    category: 'AI hosts & notebooks',
    apps: [
      { name: 'Claude Desktop', blurb: 'One-click .dxt bundle that adds Hanzo tools to Claude Desktop.', icon: Bot },
      { name: 'JupyterLab', blurb: 'pip-installable extension bringing Hanzo into your notebooks.', icon: Notebook },
    ],
  },
];

// =============================================================================
// CONNECTED APPS — OAuth / hosted (→ CONNECT_URL)
// =============================================================================

export const connectCatalog: AppGroup[] = [
  {
    category: 'Communication',
    apps: [
      { name: 'Slack', blurb: 'Summarize channels, answer in-thread, and run agents from Slack.', icon: Slack },
      { name: 'Zoom', blurb: 'Live notes, transcripts, and action items from your Zoom calls.', icon: Video },
      { name: 'Google Meet', blurb: 'Real-time notetaking and summaries for Google Meet.', icon: Webcam },
    ],
  },
  {
    category: 'Business',
    apps: [
      { name: 'Salesforce', blurb: 'Enrich records and automate CRM workflows with Hanzo.', icon: Cloud },
      { name: 'DocuSign', blurb: 'Draft, review, and route agreements for signature.', icon: FileSignature },
      { name: 'Notion', blurb: 'Query and update your Notion workspace from any Hanzo surface.', icon: NotebookText },
      { name: 'HubSpot', blurb: 'Automate marketing and sales pipelines in HubSpot.', icon: Megaphone },
      { name: 'Shopify', blurb: 'Manage products, orders, and support for your Shopify store.', icon: ShoppingBag },
    ],
  },
  {
    category: 'Developer',
    apps: [
      { name: 'GitHub', blurb: 'Review PRs, triage issues, and ship code with Hanzo agents.', icon: Github },
      { name: 'GitLab', blurb: 'Automate merge requests and CI workflows in GitLab.', icon: Gitlab },
    ],
  },
  {
    category: 'Productivity',
    apps: [
      { name: 'Google Workspace', blurb: 'Gmail, Docs, Sheets, and Calendar connected to Hanzo.', icon: LayoutGrid },
      { name: 'PDF', blurb: 'Extract, summarize, and chat with any PDF document.', icon: FileText },
      { name: 'Clio', blurb: 'Draft and manage legal matters inside Clio.', icon: Scale },
      { name: 'Raycast', blurb: 'Run Hanzo agents from the Raycast launcher.', icon: Search },
    ],
  },
  {
    category: 'Verticals',
    apps: [
      { name: 'Epic', blurb: 'Healthcare — summarize charts and draft notes in Epic.', icon: HeartPulse },
      { name: 'Procore', blurb: 'Construction — automate project and document workflows in Procore.', icon: HardHat },
      { name: 'QuickBooks', blurb: 'Finance — reconcile books and generate reports in QuickBooks.', icon: Calculator },
    ],
  },
];
