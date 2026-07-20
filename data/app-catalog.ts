/**
 * Hanzo app & extension catalog — the single source of truth for /apps.
 *
 * Every surface a user can reach shares ONE foundation: the @hanzo/ai gateway
 * and @hanzo/iam identity. Sign in once, mint one `hk-` key, and every app
 * below is authenticated — no per-app credentials.
 *
 * Each entry declares its `action`:
 *   - install → a downloadable extension / app (browser, IDE, Office, desktop …)
 *   - connect → a hosted / OAuth app you link to your Hanzo account
 *
 * The action alone determines where a card links (ACTION_URL) and the verb it
 * shows (ACTION_LABEL) — one rule, no per-entry URLs. The catalog is a flat
 * list; the view groups it by (action, category). Add a surface by appending
 * one row here and it renders everywhere.
 */

import {
  AppWindow,
  Bot,
  Braces,
  Briefcase,
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
  Gavel,
  Github,
  Gitlab,
  GraduationCap,
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
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

export type AppAction = "install" | "connect";

export interface AppEntry {
  /** Product / surface name shown on the card. */
  name: string;
  /** One line on what Hanzo does here. */
  blurb: string;
  /** Lucide icon rendered in the card. */
  icon: LucideIcon;
  /** Grouping bucket within a section (e.g. "Browser", "Verticals"). */
  category: string;
  /** Drives the card's LABEL, and its link when no per-app `href` is set. */
  action: AppAction;
  /**
   * The exact download / listing this surface installs from, when it has its
   * own published destination (a store listing or a per-OS release asset). When
   * omitted the card falls back to the action's generic URL (ACTION_URL). Only
   * REAL, verified URLs live here — the same links the Hanzo extension site uses.
   */
  href?: string;
}

/** The one link a card opens: its own `href` if published, else the action URL. */
export function appUrl(app: AppEntry): string {
  return app.href ?? ACTION_URL[app.action];
}

// =============================================================================
// ACTION → destination + verb (one rule per action, DRY)
// =============================================================================

/** Install links to the unified extension bundle; connect links to the docs. */
export const ACTION_URL: Record<AppAction, string> = {
  install: "https://github.com/hanzoai/extension/releases/latest",
  connect: "https://docs.hanzo.ai",
};

/** The verb every card in a section shows. */
export const ACTION_LABEL: Record<AppAction, string> = {
  install: "Install",
  connect: "Connect",
};

// =============================================================================
// CATALOG — one flat, ordered list (grouped by the view)
// =============================================================================

export const appCatalog: AppEntry[] = [
  // ── Install: browser ──────────────────────────────────────────────────────
  { name: "Chrome", category: "Browser", action: "install", icon: Chrome, href: "https://chrome.google.com/webstore/detail/hanzo-ai", blurb: "Ask Hanzo about any page, capture context, and run agents from the toolbar." },
  { name: "Edge", category: "Browser", action: "install", icon: AppWindow, href: "https://microsoftedge.microsoft.com/addons/detail/hanzo-ai", blurb: "The full Hanzo assistant for Microsoft Edge with the Chromium feature set." },
  { name: "Firefox", category: "Browser", action: "install", icon: Flame, href: "https://addons.mozilla.org/addon/hanzo-ai", blurb: "Privacy-first Hanzo add-on for Mozilla Firefox." },
  { name: "Safari", category: "Browser", action: "install", icon: Compass, href: "https://apps.apple.com/app/hanzo-ai", blurb: "Native Hanzo extension for Safari on macOS and iOS." },

  // ── Install: IDEs & editors ───────────────────────────────────────────────
  { name: "VS Code", category: "IDEs & editors", action: "install", icon: Code, href: "https://marketplace.visualstudio.com/items?itemName=hanzo-ai.hanzo-ai", blurb: "Inline completions, chat, and agentic edits inside Visual Studio Code." },
  { name: "Cursor", category: "IDEs & editors", action: "install", icon: MousePointer2, href: "https://open-vsx.org/namespace/hanzo-ai", blurb: "Wire Hanzo models and MCP tools into the Cursor editor." },
  { name: "Windsurf", category: "IDEs & editors", action: "install", icon: Wind, href: "https://open-vsx.org/namespace/hanzo-ai", blurb: "Hanzo agents and gateway models in the Windsurf editor." },
  { name: "Antigravity", category: "IDEs & editors", action: "install", icon: Orbit, href: "https://open-vsx.org/namespace/hanzo-ai", blurb: "Connect Hanzo to the Antigravity agentic IDE." },
  { name: "JetBrains", category: "IDEs & editors", action: "install", icon: Braces, blurb: "One plugin for IntelliJ, PyCharm, GoLand, WebStorm, and the rest." },

  // ── Install: Office ───────────────────────────────────────────────────────
  { name: "Word, Excel & PowerPoint", category: "Office", action: "install", icon: FileText, blurb: "Draft, analyze, and generate slides with Hanzo inside Microsoft Office." },
  { name: "Outlook", category: "Office", action: "install", icon: Mail, blurb: "Summarize threads and draft replies from your Outlook inbox." },

  // ── Install: design ───────────────────────────────────────────────────────
  { name: "Figma", category: "Design", action: "install", icon: Figma, blurb: "Generate copy, components, and design specs from inside Figma." },
  { name: "Sketch", category: "Design", action: "install", icon: PenTool, blurb: "Bring Hanzo assistance into your Sketch design workflow." },

  // ── Install: team apps ────────────────────────────────────────────────────
  { name: "Microsoft Teams", category: "Team apps", action: "install", icon: Users, blurb: "Chat with Hanzo and run agents without leaving Teams." },
  { name: "Zendesk", category: "Team apps", action: "install", icon: Headset, blurb: "Draft, triage, and resolve support tickets with Hanzo in Zendesk." },

  // ── Install: desktop app ──────────────────────────────────────────────────
  { name: "macOS", category: "Desktop app", action: "install", icon: Command, href: "https://github.com/hanzoai/desktop/releases/latest/download/hanzo-macos.dmg", blurb: "Menubar app with a global hotkey — Hanzo anywhere on your Mac." },
  { name: "Windows", category: "Desktop app", action: "install", icon: AppWindow, href: "https://github.com/hanzoai/desktop/releases/latest/download/hanzo-windows.exe", blurb: "System-tray app with a global hotkey for Hanzo on Windows." },
  { name: "Linux", category: "Desktop app", action: "install", icon: Terminal, href: "https://github.com/hanzoai/desktop/releases/latest/download/hanzo-linux.AppImage", blurb: "Native desktop app with a global hotkey for Hanzo on Linux." },

  // ── Install: AI hosts & notebooks ─────────────────────────────────────────
  { name: "Claude Desktop", category: "AI hosts & notebooks", action: "install", icon: Bot, blurb: "One-click .dxt bundle that adds Hanzo tools to Claude Desktop." },
  { name: "JupyterLab", category: "AI hosts & notebooks", action: "install", icon: Notebook, blurb: "pip-installable extension bringing Hanzo into your notebooks." },

  // ── Connect: communication ────────────────────────────────────────────────
  { name: "Slack", category: "Communication", action: "connect", icon: Slack, blurb: "Summarize channels, answer in-thread, and run agents from Slack." },
  { name: "Zoom", category: "Communication", action: "connect", icon: Video, blurb: "Live notes, transcripts, and action items from your Zoom calls." },
  { name: "Google Meet", category: "Communication", action: "connect", icon: Webcam, blurb: "Real-time notetaking and summaries for Google Meet." },

  // ── Connect: business ─────────────────────────────────────────────────────
  { name: "Salesforce", category: "Business", action: "connect", icon: Cloud, blurb: "Enrich records and automate CRM workflows with Hanzo." },
  { name: "DocuSign", category: "Business", action: "connect", icon: FileSignature, blurb: "Draft, review, and route agreements for signature." },
  { name: "Notion", category: "Business", action: "connect", icon: NotebookText, blurb: "Query and update your Notion workspace from any Hanzo surface." },
  { name: "HubSpot", category: "Business", action: "connect", icon: Megaphone, blurb: "Automate marketing and sales pipelines in HubSpot." },
  { name: "Shopify", category: "Business", action: "connect", icon: ShoppingBag, blurb: "Manage products, orders, and support for your Shopify store." },

  // ── Connect: developer ────────────────────────────────────────────────────
  { name: "GitHub", category: "Developer", action: "connect", icon: Github, blurb: "Review PRs, triage issues, and ship code with Hanzo agents." },
  { name: "GitLab", category: "Developer", action: "connect", icon: Gitlab, blurb: "Automate merge requests and CI workflows in GitLab." },

  // ── Connect: productivity ─────────────────────────────────────────────────
  { name: "Google Workspace", category: "Productivity", action: "connect", icon: LayoutGrid, blurb: "Gmail, Docs, Sheets, and Calendar connected to Hanzo." },
  { name: "PDF", category: "Productivity", action: "connect", icon: FileText, blurb: "Extract, summarize, and chat with any PDF document." },
  { name: "Clio", category: "Productivity", action: "connect", icon: Scale, blurb: "Draft and manage legal matters inside Clio." },
  { name: "Raycast", category: "Productivity", action: "connect", icon: Search, blurb: "Run Hanzo agents from the Raycast launcher." },

  // ── Connect: verticals ────────────────────────────────────────────────────
  { name: "Epic", category: "Verticals", action: "connect", icon: HeartPulse, blurb: "Healthcare — summarize charts and draft notes in Epic." },
  { name: "Procore", category: "Verticals", action: "connect", icon: HardHat, blurb: "Construction — automate project and document workflows in Procore." },
  { name: "QuickBooks", category: "Verticals", action: "connect", icon: Calculator, blurb: "Finance — reconcile books and generate reports in QuickBooks." },
  { name: "Canvas", category: "Verticals", action: "connect", icon: GraduationCap, blurb: "Education — draft assignments and summarize submissions in Canvas." },
  { name: "Workday", category: "Verticals", action: "connect", icon: Briefcase, blurb: "HR — automate onboarding, approvals, and reporting in Workday." },
  { name: "iManage", category: "Verticals", action: "connect", icon: Gavel, blurb: "Legal — search, summarize, and draft against your iManage vault." },
];
