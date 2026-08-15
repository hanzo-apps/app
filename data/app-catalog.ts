/**
 * The Hanzo app catalog — the one list behind /install.
 *
 * Every surface a user can reach shares ONE foundation: the @hanzo/ai gateway
 * and @hanzo/iam identity. Sign in once, mint one `hk-` key, and every app
 * below is authenticated — no per-app credentials.
 *
 * Each entry declares its `action`:
 *   - install → an artifact you add to a host you already run
 *   - connect → a hosted / OAuth app you link to your Hanzo account
 *
 * No URL is written in this file. An install card names the ARTIFACT it
 * installs — a surface and a platform in `data/releases.json`, which
 * `scripts/sync-releases.mjs` resolves against the real releases on every build
 * — and a card whose artifact did not publish never reaches the page. So the
 * catalog cannot offer a build that does not exist, and cannot go stale when
 * the next release renames a file.
 *
 * The coordinates are plain strings rather than keys typed off that JSON on
 * purpose: releases.json is data, and a platform that stops publishing should
 * drop one card, not fail the build. `tests/unit/releases.test.ts` is what
 * catches a coordinate that resolves to nothing.
 *
 * The catalog is a flat list; the view groups it by category.
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

import releases from "./releases.json";

// =============================================================================
// TYPES
// =============================================================================

export type AppAction = "install" | "connect";

/** Where a card's bytes are: a surface in releases.json, and a platform in it. */
export type Asset = [surface: string, platform: string];

/** What a card says, before it knows where it points. */
interface Card {
  /** Product / surface name shown on the card. */
  name: string;
  /** One line on what Hanzo does here. */
  blurb: string;
  /** Lucide icon rendered in the card. */
  icon: LucideIcon;
  /** Grouping bucket within a section (e.g. "Browser", "Verticals"). */
  category: string;
}

/** A card as declared: an install names its artifact, a connect names none. */
type Declared =
  | (Card & { action: "install"; asset: Asset })
  | (Card & { action: "connect" });

/** A card as rendered: its link resolved. There is no card without one. */
export type AppEntry = Card & { action: AppAction; url: string };

// =============================================================================
// WHERE A CARD POINTS
// =============================================================================

/** A connect is a hosted app you link to your account, so it opens the docs. */
const DOCS = "https://docs.hanzo.ai";

/** The verb every card in a section shows. */
export const ACTION_LABEL: Record<AppAction, string> = {
  install: "Install",
  connect: "Connect",
};

/**
 * What a screen reader hears on the link. The two actions are different
 * sentences: an install card is named for its HOST ("macOS", "Chrome"), so the
 * verb alone would announce installing an operating system.
 */
export const actionName = (app: AppEntry): string =>
  app.action === "install" ? `Install Hanzo for ${app.name}` : `Connect ${app.name}`;

type Resolved = Record<string, { platforms: Record<string, { url: string }> }>;
const R = releases as Resolved;

const resolve = ([surface, platform]: Asset): string | undefined =>
  R[surface]?.platforms[platform]?.url;

// =============================================================================
// CATALOG — one flat, ordered list (grouped by the view)
// =============================================================================

const CATALOG: Declared[] = [
  // ── Install: browser ──────────────────────────────────────────────────────
  { name: "Chrome", category: "Browser", action: "install", icon: Chrome, asset: ["browser", "Chrome"], blurb: "Ask Hanzo about any page, capture context, and run agents from the toolbar." },
  { name: "Edge", category: "Browser", action: "install", icon: AppWindow, asset: ["browser", "Edge"], blurb: "The full Hanzo assistant for Microsoft Edge with the Chromium feature set." },
  { name: "Firefox", category: "Browser", action: "install", icon: Flame, asset: ["browser", "Firefox"], blurb: "Privacy-first Hanzo add-on for Mozilla Firefox." },
  { name: "Safari", category: "Browser", action: "install", icon: Compass, asset: ["browser", "Safari"], blurb: "Native Hanzo extension for Safari on macOS and iOS." },

  // ── Install: IDEs & editors ───────────────────────────────────────────────
  { name: "VS Code", category: "IDEs & editors", action: "install", icon: Code, asset: ["editor", "VS Code"], blurb: "Inline completions, chat, and agentic edits inside Visual Studio Code." },
  { name: "Cursor", category: "IDEs & editors", action: "install", icon: MousePointer2, asset: ["editor", "Cursor"], blurb: "Wire Hanzo models and MCP tools into the Cursor editor." },
  { name: "Windsurf", category: "IDEs & editors", action: "install", icon: Wind, asset: ["editor", "Windsurf"], blurb: "Hanzo agents and gateway models in the Windsurf editor." },
  { name: "Antigravity", category: "IDEs & editors", action: "install", icon: Orbit, asset: ["editor", "Antigravity"], blurb: "Connect Hanzo to the Antigravity agentic IDE." },
  { name: "JetBrains", category: "IDEs & editors", action: "install", icon: Braces, asset: ["editor", "JetBrains"], blurb: "One plugin for IntelliJ, PyCharm, GoLand, WebStorm, and the rest." },

  // ── Install: Office ───────────────────────────────────────────────────────
  { name: "Word, Excel & PowerPoint", category: "Office", action: "install", icon: FileText, asset: ["host", "Office"], blurb: "Draft, analyze, and generate slides with Hanzo inside Microsoft Office." },
  { name: "Outlook", category: "Office", action: "install", icon: Mail, asset: ["host", "Outlook"], blurb: "Summarize threads and draft replies from your Outlook inbox." },

  // ── Install: design ───────────────────────────────────────────────────────
  { name: "Figma", category: "Design", action: "install", icon: Figma, asset: ["host", "Figma"], blurb: "Generate copy, components, and design specs from inside Figma." },
  { name: "Sketch", category: "Design", action: "install", icon: PenTool, asset: ["host", "Sketch"], blurb: "Bring Hanzo assistance into your Sketch design workflow." },

  // ── Install: team apps ────────────────────────────────────────────────────
  { name: "Microsoft Teams", category: "Team apps", action: "install", icon: Users, asset: ["host", "Teams"], blurb: "Chat with Hanzo and run agents without leaving Teams." },
  { name: "Zendesk", category: "Team apps", action: "install", icon: Headset, asset: ["host", "Zendesk"], blurb: "Draft, triage, and resolve support tickets with Hanzo in Zendesk." },

  // ── Install: desktop app ──────────────────────────────────────────────────
  { name: "macOS", category: "Desktop app", action: "install", icon: Command, asset: ["desktop", "macOS"], blurb: "Menubar app with a global hotkey — Hanzo anywhere on your Mac." },
  { name: "Windows", category: "Desktop app", action: "install", icon: AppWindow, asset: ["desktop", "Windows"], blurb: "System-tray app with a global hotkey for Hanzo on Windows." },
  { name: "Linux", category: "Desktop app", action: "install", icon: Terminal, asset: ["desktop", "Linux (AppImage)"], blurb: "Native desktop app with a global hotkey for Hanzo on Linux." },

  // ── Install: AI hosts & notebooks ─────────────────────────────────────────
  { name: "Claude Desktop", category: "AI hosts & notebooks", action: "install", icon: Bot, asset: ["host", "Claude Desktop"], blurb: "One-click .dxt bundle that adds Hanzo tools to Claude Desktop." },
  { name: "JupyterLab", category: "AI hosts & notebooks", action: "install", icon: Notebook, asset: ["host", "JupyterLab"], blurb: "pip-installable extension bringing Hanzo into your notebooks." },

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

/**
 * The catalog as the page sees it — every card carrying a link that resolved.
 * An install whose artifact is absent from this build's releases.json is
 * dropped rather than pointed somewhere generic, because a card that lands on
 * a page without the build on it is the failure this file exists to prevent.
 */
export const appCatalog: AppEntry[] = CATALOG.flatMap((card) => {
  const url = card.action === "connect" ? DOCS : resolve(card.asset);
  return url ? [{ ...card, url }] : [];
});
