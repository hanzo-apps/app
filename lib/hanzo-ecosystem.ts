// hanzo-ecosystem.ts — the ONE source of truth for the shared Hanzo global
// navigation system: the universal "Meet Hanzo" menu, the ecosystem footer, the
// per-domain header config, and the pre-footer CTAs. Every Hanzo property renders
// from THIS so the menu + footer are byte-identical everywhere (the spec's hard
// requirement) and only the per-domain header row changes.
//
// This is intentionally framework-agnostic data (no JSX) so it can be lifted into
// @hanzo/ui and consumed unchanged by chat / team / studio / bot / cloud / hanzo.ai.

export interface NavLink {
  label: string;
  href: string;
  desc?: string;
}

// ── Product identity ────────────────────────────────────────────────────────
// The canonical product boundaries — one line each, consistent across every menu
// and page (the spec's "Product boundaries" section).
export type ProductKey =
  | "chat" | "app" | "team" | "studio" | "bot" | "cloud" | "dev" | "hanzo";

export interface Product {
  key: ProductKey;
  name: string; // "Hanzo Chat"
  verb: string; // menu eyebrow: "Use AI"
  boundary: string; // the one-line definition
  tagline: string; // menu row description
  href: string;
}

// Flagship products — the six shown in the Meet Hanzo menu's top grid, in spec order.
export const FLAGSHIP: Product[] = [
  { key: "chat",   name: "Hanzo Chat",   verb: "Use AI",        boundary: "use AI",                    tagline: "Ask anything",              href: "https://hanzo.chat" },
  { key: "app",    name: "Hanzo App",    verb: "Build",         boundary: "build applications",        tagline: "Build and ship apps",       href: "https://hanzo.app" },
  { key: "team",   name: "Hanzo Team",   verb: "Work",          boundary: "organize collaborative work", tagline: "People and AI together",  href: "https://hanzo.team" },
  { key: "studio", name: "Hanzo Studio", verb: "Design AI",     boundary: "create and evaluate intelligence", tagline: "Models, prompts and agents", href: "https://studio.hanzo.ai" },
  { key: "bot",    name: "Hanzo Bot",    verb: "Deploy agents", boundary: "distribute agents into channels", tagline: "Publish AI anywhere",  href: "https://hanzo.bot" },
  { key: "cloud",  name: "Hanzo Cloud",  verb: "Operate",       boundary: "operate infrastructure",    tagline: "Run the platform",          href: "https://cloud.hanzo.ai" },
];

// The two non-flagship products referenced in boundaries / footer.
export const PRODUCTS: Record<ProductKey, Product> = {
  ...Object.fromEntries(FLAGSHIP.map((p) => [p.key, p])) as Record<ProductKey, Product>,
  dev:   { key: "dev",   name: "Hanzo Dev",   verb: "Develop", boundary: "build software from the editor or terminal", tagline: "Editor + terminal", href: "https://hanzo.ai/code" },
  hanzo: { key: "hanzo", name: "Hanzo",       verb: "Platform", boundary: "explain and connect the entire ecosystem", tagline: "The complete platform", href: "https://hanzo.ai" },
};

// ── Meet Hanzo menu columns (identical everywhere) ──────────────────────────
export const PLATFORM_LINKS: NavLink[] = [
  { label: "Models", href: "https://hanzo.ai/models" },
  { label: "Enso", href: "https://hanzo.ai/enso" },
  { label: "Managed Agents", href: "https://hanzo.ai/agents" },
  { label: "MCP Tools", href: "https://hanzo.ai/mcp" },
  { label: "Hanzo Dev", href: "https://hanzo.ai/code" },
  { label: "Developer Console", href: "https://console.hanzo.ai" },
  { label: "API Platform", href: "https://cloud.hanzo.ai" },
  { label: "All cloud products", href: "https://cloud.hanzo.ai/products" },
];

export const INSTALL_LINKS: NavLink[] = [
  { label: "Desktop app", href: "https://hanzo.ai/desktop" },
  { label: "Browser extension", href: "https://hanzo.ai/extension" },
  { label: "VS Code", href: "https://hanzo.ai/vscode" },
  { label: "Hanzo CLI", href: "https://hanzo.ai/cli" },
  { label: "SDKs", href: "https://hanzo.ai/sdks" },
  { label: "All downloads", href: "https://hanzo.ai/download" },
];

export const RESOURCE_LINKS: NavLink[] = [
  { label: "Documentation", href: "https://docs.hanzo.ai" },
  { label: "Quickstarts", href: "https://docs.hanzo.ai/quickstarts" },
  { label: "Learn", href: "https://hanzo.ai/learn" },
  { label: "Community", href: "https://hanzo.ai/community" },
  { label: "Showcase", href: "https://hanzo.ai/showcase" },
  { label: "Changelog", href: "https://hanzo.ai/changelog" },
  { label: "Status", href: "https://status.hanzo.ai" },
  { label: "Support", href: "https://hanzo.ai/support" },
];

// ── Unified footer (identical everywhere; highlight current product) ─────────
export interface FooterColumn {
  title: string;
  links: NavLink[];
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Products",
    links: [
      { label: "Hanzo Chat", href: "https://hanzo.chat" },
      { label: "Hanzo App", href: "https://hanzo.app" },
      { label: "Hanzo Team", href: "https://hanzo.team" },
      { label: "Hanzo Studio", href: "https://studio.hanzo.ai" },
      { label: "Hanzo Bot", href: "https://hanzo.bot" },
      { label: "Hanzo Cloud", href: "https://cloud.hanzo.ai" },
      { label: "Hanzo Dev", href: "https://hanzo.ai/code" },
      { label: "All products", href: "https://hanzo.ai/products" },
    ],
  },
  {
    title: "AI Platform",
    links: [
      { label: "Models", href: "https://hanzo.ai/models" },
      { label: "Enso", href: "https://hanzo.ai/enso" },
      { label: "Managed Agents", href: "https://hanzo.ai/agents" },
      { label: "MCP Tools", href: "https://hanzo.ai/mcp" },
      { label: "API Platform", href: "https://cloud.hanzo.ai" },
      { label: "Developer Console", href: "https://console.hanzo.ai" },
      { label: "All cloud products", href: "https://cloud.hanzo.ai/products" },
    ],
  },
  {
    title: "Install",
    links: [
      { label: "Desktop app", href: "https://hanzo.ai/desktop" },
      { label: "Browser extension", href: "https://hanzo.ai/extension" },
      { label: "VS Code", href: "https://hanzo.ai/vscode" },
      { label: "Hanzo CLI", href: "https://hanzo.ai/cli" },
      { label: "SDKs", href: "https://hanzo.ai/sdks" },
      { label: "All downloads", href: "https://hanzo.ai/download" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Documentation", href: "https://docs.hanzo.ai" },
      { label: "API Reference", href: "https://docs.hanzo.ai/api" },
      { label: "SDKs", href: "https://hanzo.ai/sdks" },
      { label: "MCP Tools", href: "https://hanzo.ai/mcp" },
      { label: "CLI Reference", href: "https://docs.hanzo.ai/cli" },
      { label: "GitHub", href: "https://github.com/hanzoai" },
      { label: "System Status", href: "https://status.hanzo.ai" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Quickstarts", href: "https://docs.hanzo.ai/quickstarts" },
      { label: "Learn", href: "https://hanzo.ai/learn" },
      { label: "Community", href: "https://hanzo.ai/community" },
      { label: "Showcase", href: "https://hanzo.ai/showcase" },
      { label: "Changelog", href: "https://hanzo.ai/changelog" },
      { label: "Research", href: "https://hanzo.ai/research" },
      { label: "Support", href: "https://hanzo.ai/support" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Hanzo", href: "https://hanzo.ai/about" },
      { label: "Customers", href: "https://hanzo.ai/customers" },
      { label: "Blog", href: "https://hanzo.ai/blog" },
      { label: "Careers", href: "https://hanzo.ai/careers" },
      { label: "Enterprise", href: "https://hanzo.ai/enterprise" },
      { label: "Security", href: "https://hanzo.ai/security" },
      { label: "Contact", href: "https://hanzo.ai/contact" },
    ],
  },
];

export const FOOTER_BOTTOM: NavLink[] = [
  { label: "Status", href: "https://status.hanzo.ai" },
  { label: "Security", href: "https://hanzo.ai/security" },
  { label: "Privacy", href: "https://hanzo.ai/privacy" },
  { label: "Terms", href: "https://hanzo.ai/terms" },
  { label: "Cookies", href: "https://hanzo.ai/cookies" },
];

export const COPYRIGHT = "© 2026 Hanzo AI, Inc.";

// ── Per-domain header config ────────────────────────────────────────────────
// Brand + local nav + secondary/primary CTA per property (the spec's headers table).
export interface HeaderConfig {
  product: ProductKey;
  brand: string;
  localNav: NavLink[];
  secondary: NavLink; // e.g. Documentation
  primary: NavLink;   // e.g. Open Chat / New project
}

export const HEADERS: Record<string, HeaderConfig> = {
  "hanzo.ai": {
    product: "hanzo", brand: "Hanzo",
    localNav: [
      { label: "Models", href: "/models" }, { label: "Agents", href: "/agents" },
      { label: "Solutions", href: "/solutions" }, { label: "Developers", href: "/developers" },
      { label: "Pricing", href: "/pricing" }, { label: "Enterprise", href: "/enterprise" },
    ],
    secondary: { label: "Documentation", href: "https://docs.hanzo.ai" },
    primary: { label: "Open Chat", href: "https://hanzo.chat" },
  },
  "hanzo.chat": {
    product: "chat", brand: "Hanzo Chat",
    localNav: [
      { label: "Product", href: "/product" }, { label: "Models", href: "/models" },
      { label: "Agents", href: "/agents" }, { label: "Download", href: "/download" },
      { label: "Pricing", href: "/pricing" },
    ],
    secondary: { label: "Install Hanzo", href: "https://hanzo.ai/download" },
    primary: { label: "New chat", href: "/" },
  },
  "hanzo.app": {
    product: "app", brand: "Hanzo App",
    localNav: [
      { label: "Product", href: "/product" }, { label: "Templates", href: "/gallery" },
      { label: "Showcase", href: "/showcase" }, { label: "Pricing", href: "/pricing" },
      { label: "Enterprise", href: "/enterprise" },
    ],
    secondary: { label: "Download", href: "https://hanzo.ai/download" },
    primary: { label: "New project", href: "/new" },
  },
  "cloud.hanzo.ai": {
    product: "cloud", brand: "Hanzo Cloud",
    localNav: [
      { label: "Products", href: "/products" }, { label: "Solutions", href: "/solutions" },
      { label: "Developers", href: "/developers" }, { label: "Pricing", href: "/pricing" },
      { label: "Docs", href: "https://docs.hanzo.ai" },
    ],
    secondary: { label: "Get API key", href: "/api-keys" },
    primary: { label: "Open Console", href: "https://console.hanzo.ai" },
  },
  "hanzo.team": {
    product: "team", brand: "Hanzo Team",
    localNav: [
      { label: "Product", href: "/product" }, { label: "Solutions", href: "/solutions" },
      { label: "Integrations", href: "/integrations" }, { label: "Pricing", href: "/pricing" },
      { label: "Enterprise", href: "/enterprise" },
    ],
    secondary: { label: "Download", href: "https://hanzo.ai/download" },
    primary: { label: "Open workspace", href: "/workspace" },
  },
  "hanzo.bot": {
    product: "bot", brand: "Hanzo Bot",
    localNav: [
      { label: "Product", href: "/product" }, { label: "Channels", href: "/channels" },
      { label: "Templates", href: "/templates" }, { label: "Integrations", href: "/integrations" },
      { label: "Pricing", href: "/pricing" },
    ],
    secondary: { label: "Documentation", href: "https://docs.hanzo.ai" },
    primary: { label: "Create bot", href: "/new" },
  },
  "studio.hanzo.ai": {
    product: "studio", brand: "Hanzo Studio",
    localNav: [
      { label: "Models", href: "/models" }, { label: "Prompts", href: "/prompts" },
      { label: "Agents", href: "/agents" }, { label: "Evaluations", href: "/evaluations" },
      { label: "Docs", href: "https://docs.hanzo.ai" },
    ],
    secondary: { label: "API Reference", href: "https://docs.hanzo.ai/api" },
    primary: { label: "Open Studio", href: "/" },
  },
};

// ── Product-specific pre-footer CTA (above the shared footer) ────────────────
export interface PreFooterCTA {
  message: string;
  actions: NavLink[];
}

export const PRE_FOOTER: Record<string, PreFooterCTA> = {
  "hanzo.ai": { message: "Meet the complete Hanzo AI platform", actions: [{ label: "Explore products", href: "/products" }, { label: "Open Chat", href: "https://hanzo.chat" }] },
  "hanzo.chat": { message: "Take Hanzo everywhere you work", actions: [{ label: "Download Hanzo", href: "https://hanzo.ai/download" }, { label: "Add browser extension", href: "https://hanzo.ai/extension" }] },
  "hanzo.app": { message: "Turn an idea into a live application", actions: [{ label: "New project", href: "/new" }, { label: "Browse templates", href: "/gallery" }] },
  "cloud.hanzo.ai": { message: "Build and operate on the AI cloud", actions: [{ label: "Get API key", href: "/api-keys" }, { label: "Open Console", href: "https://console.hanzo.ai" }] },
  "hanzo.team": { message: "Bring your people and AI coworkers together", actions: [{ label: "Create organization", href: "/new" }, { label: "Open workspace", href: "/workspace" }] },
  "hanzo.bot": { message: "Put an intelligent agent in every channel", actions: [{ label: "Create bot", href: "/new" }, { label: "View channels", href: "/channels" }] },
  "studio.hanzo.ai": { message: "Take models and agents from idea to production", actions: [{ label: "Open Studio", href: "/" }, { label: "Read quickstart", href: "https://docs.hanzo.ai/quickstarts" }] },
};

// The property this build renders as. Every Hanzo app sets ONE constant; the shared
// components read it to pick the header, highlight the current product, and choose
// the pre-footer CTA. hanzo.app's is "hanzo.app".
export const CURRENT_SITE = "hanzo.app";
