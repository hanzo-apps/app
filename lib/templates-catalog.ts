// The ONE source of truth for the redesigned templates gallery + detail pages.
//
// Every entry here is a REAL template that exists in this repo's gallery catalog
// (lib/gallery-snapshot.json, mirrored from gallery.hanzo.ai). Slugs are kept
// verbatim so the self-hosted preview shots (public/templates/<slug>.webp, tracked
// in lib/template-shots.ts) and the fork wire (/dev?template=hanzo-apps/<slug>)
// keep working unchanged.
//
// What this module adds on top of the raw snapshot is EDITORIAL: each template is
// filed under exactly one primary category from a fixed, SEO-shaped taxonomy and
// given Hanzo-original marketing copy (name, tagline, description, highlights,
// about, "perfect for", per-page SEO title/description). The copy is written from
// each template's real framework + features — no fabricated metrics, no borrowed
// catalog names or descriptions from any other gallery.
//
// Pure data + selectors. No React. Consumers (gallery grid, category landings,
// detail pages) import TEMPLATES / CATEGORIES / the helpers below.

import { TEMPLATE_SHOTS } from "./template-shots";

// ---------------------------------------------------------------------------
// Taxonomy
// ---------------------------------------------------------------------------

/** The fixed, ordered category taxonomy. "All templates" is implicit (not here). */
export type CategoryLabel =
  | "Websites"
  | "Apps"
  | "Portfolio"
  | "SaaS"
  | "Blog"
  | "Internal Tools"
  | "Developer Tools"
  | "Editorial"
  | "Music"
  | "Product Management"
  | "Ecommerce"
  | "Project Management"
  | "Events"
  | "Services"
  | "Resume"
  | "Landing Page";

export interface CategoryDescriptor {
  /** URL-safe slug, e.g. "developer-tools". */
  slug: string;
  /** Human label, exactly as it appears in the taxonomy. */
  label: CategoryLabel;
  /** One-line description for the category chip / hero subtitle. */
  blurb: string;
  /** <title> for the category landing page. */
  seoTitle: string;
  /** <meta name="description"> for the category landing page. */
  seoDescription: string;
}

/** The taxonomy, in canonical display order. */
export const CATEGORIES: readonly CategoryDescriptor[] = [
  {
    slug: "websites",
    label: "Websites",
    blurb: "Complete marketing and brand sites for businesses, agencies and studios.",
    seoTitle: "Website Templates — Fork & Deploy Free | Hanzo",
    seoDescription:
      "Browse free website templates for businesses, agencies and brands. Fork any design, edit it with AI, and ship it live on Hanzo in minutes.",
  },
  {
    slug: "apps",
    label: "Apps",
    blurb: "Full-stack web and mobile app starters with real product surfaces.",
    seoTitle: "Web & Mobile App Templates | Hanzo",
    seoDescription:
      "Start from a working app template — social, full-stack and mobile starters you can fork, extend with AI, and deploy on Hanzo.",
  },
  {
    slug: "portfolio",
    label: "Portfolio",
    blurb: "Showcases for designers, developers, photographers and creative studios.",
    seoTitle: "Portfolio Website Templates — Free to Fork | Hanzo",
    seoDescription:
      "Free portfolio templates for designers, developers and photographers. Grid, masonry and case-study layouts you can fork and publish today.",
  },
  {
    slug: "saas",
    label: "SaaS",
    blurb: "SaaS product platforms and high-intent marketing sites, ready to monetize.",
    seoTitle: "SaaS Website & Platform Templates | Hanzo",
    seoDescription:
      "Fork a SaaS template — AI platforms, pricing pages and animated product sites built in Next.js and React. Edit with AI and launch on Hanzo.",
  },
  {
    slug: "blog",
    label: "Blog",
    blurb: "Clean, readable layouts for writing, publishing and content.",
    seoTitle: "Blog Templates — Fork & Publish | Hanzo",
    seoDescription:
      "Readable blog and publishing templates you can fork, style with AI and deploy on Hanzo. More designs added continuously.",
  },
  {
    slug: "internal-tools",
    label: "Internal Tools",
    blurb: "Admin dashboards, CRMs and analytics consoles for running the business.",
    seoTitle: "Admin Dashboard & Internal Tool Templates | Hanzo",
    seoDescription:
      "Fork a dashboard, CRM or analytics console. Charts, tables and admin layouts ready to wire to your data and ship on Hanzo.",
  },
  {
    slug: "developer-tools",
    label: "Developer Tools",
    blurb: "Component libraries and layout kits that make you build faster.",
    seoTitle: "Developer UI Kits & Component Templates | Hanzo",
    seoDescription:
      "Component libraries and bento-card layout kits for shipping interfaces faster. Fork the blocks, compose your pages, deploy on Hanzo.",
  },
  {
    slug: "editorial",
    label: "Editorial",
    blurb: "Magazine and long-form layouts built around typography.",
    seoTitle: "Editorial & Magazine Templates | Hanzo",
    seoDescription:
      "Editorial, typography-led templates for stories and long-form content. Fork, restyle with AI and publish on Hanzo.",
  },
  {
    slug: "music",
    label: "Music",
    blurb: "Sites for artists, releases, labels and audio products.",
    seoTitle: "Music & Artist Website Templates | Hanzo",
    seoDescription:
      "Templates for artists, releases and audio products you can fork and deploy on Hanzo. More music designs added continuously.",
  },
  {
    slug: "product-management",
    label: "Product Management",
    blurb: "Roadmaps, changelogs and feedback surfaces for product teams.",
    seoTitle: "Product Management Templates | Hanzo",
    seoDescription:
      "Roadmap, changelog and feedback templates for product teams. Fork a starter, connect your data and ship on Hanzo.",
  },
  {
    slug: "ecommerce",
    label: "Ecommerce",
    blurb: "Storefronts, shops and ordering flows built to sell.",
    seoTitle: "Ecommerce & Online Store Templates | Hanzo",
    seoDescription:
      "Fork an ecommerce template — storefronts, shops and food-ordering flows. Edit with AI, wire up checkout and launch on Hanzo.",
  },
  {
    slug: "project-management",
    label: "Project Management",
    blurb: "Boards, trackers and team workspaces for shipping work.",
    seoTitle: "Project Management Templates | Hanzo",
    seoDescription:
      "Board, tracker and workspace templates for teams. Fork a starter, wire it to your data and deploy on Hanzo.",
  },
  {
    slug: "events",
    label: "Events",
    blurb: "Conference, meetup and ticketing sites that fill the room.",
    seoTitle: "Event & Conference Website Templates | Hanzo",
    seoDescription:
      "Event, conference and ticketing templates you can fork, personalize with AI and publish on Hanzo. More designs added continuously.",
  },
  {
    slug: "services",
    label: "Services",
    blurb: "Booking-driven sites for fitness, studios and local service businesses.",
    seoTitle: "Service Business & Booking Templates | Hanzo",
    seoDescription:
      "Fork a service-business template with booking and class scheduling — built for fitness, studios and local providers. Launch on Hanzo.",
  },
  {
    slug: "resume",
    label: "Resume",
    blurb: "Personal resume, bio and about pages that introduce you well.",
    seoTitle: "Resume, Bio & About Page Templates | Hanzo",
    seoDescription:
      "Fork a personal resume, bio or about-page template. Clean, responsive and ready to publish on Hanzo in minutes.",
  },
  {
    slug: "landing-page",
    label: "Landing Page",
    blurb: "High-converting launch and marketing pages for any product.",
    seoTitle: "Landing Page Templates — Free to Fork | Hanzo",
    seoDescription:
      "High-converting landing and launch page templates for apps and products. Fork, edit with AI and deploy on Hanzo in minutes.",
  },
] as const;

const CATEGORY_BY_LABEL = new Map<string, CategoryDescriptor>(
  CATEGORIES.map((c) => [c.label, c]),
);
const CATEGORY_BY_SLUG = new Map<string, CategoryDescriptor>(
  CATEGORIES.map((c) => [c.slug, c]),
);

/** Slug for a taxonomy label (e.g. "Developer Tools" -> "developer-tools"). */
export function categorySlug(label: CategoryLabel): string {
  return CATEGORY_BY_LABEL.get(label)?.slug ?? label.toLowerCase().replace(/\s+/g, "-");
}

/** Resolve a category descriptor from either its label or its slug. */
export function getCategory(labelOrSlug: string): CategoryDescriptor | undefined {
  return CATEGORY_BY_LABEL.get(labelOrSlug) ?? CATEGORY_BY_SLUG.get(labelOrSlug.toLowerCase());
}

// ---------------------------------------------------------------------------
// Template entries
// ---------------------------------------------------------------------------

export interface Highlight {
  title: string;
  body: string;
}

export interface TemplateEntry {
  /** Real gallery slug — matches TEMPLATE_SHOTS + the snapshot + the fork wire. */
  slug: string;
  /** SEO marketing name (an improvement on the raw displayName, still truthful). */
  name: string;
  /** One punchy line for cards and the detail hero. */
  tagline: string;
  /** 2-3 sentence marketing/SEO paragraph: what it is + why fork it. */
  description: string;
  /** Exactly one primary taxonomy category. */
  category: CategoryLabel;
  /** 0-3 extra tags (secondary categories or descriptors) for cross-surfacing. */
  tags: string[];
  /** 4-6 real capabilities for the detail page. */
  keyHighlights: Highlight[];
  /** Short "About this template" paragraph. */
  about: string;
  /** 3-5 short audience / use-case bullets. */
  perfectFor: string[];
  /** Exact framework string from the snapshot. */
  framework: string;
  /**
   * Fork behavior. 'page' (default) templates brief-seed the builder from the
   * gallery slug; 'repo' starters are real hanzo-apps repos the builder
   * clones-and-runs. Drives the `fork` wire below.
   */
  kind?: "page" | "repo";
  /** Default builder starters float to the top of the gallery. */
  featured?: boolean;
  /**
   * Fork source repo. For 'page' templates the GitHub source page
   * (github.com/hanzo-apps/<slug>); for 'repo' starters the clone URL (….git).
   */
  repo: string;
  /** Live preview page for the template. */
  previewUrl: string;
  /** The established fork wire the whole app uses. */
  fork: string;
  /** True when a real self-hosted shot exists at public/templates/<slug>.webp. */
  hasShot: boolean;
  /** <title> for the template detail page. */
  seoTitle: string;
  /** <meta name="description"> for the template detail page. */
  seoDescription: string;
}

/**
 * Authoring shape — mechanical fields (previewUrl/fork/hasShot) are derived.
 * `repo` is derived for 'page' templates but may be supplied as the clone URL
 * for 'repo' starters.
 */
type RawEntry = Omit<TemplateEntry, "previewUrl" | "fork" | "hasShot" | "repo"> & {
  repo?: string;
};

function entry(raw: RawEntry): TemplateEntry {
  const kind = raw.kind ?? "page";
  const repo = raw.repo ?? `https://github.com/hanzo-apps/${raw.slug}`;
  return {
    ...raw,
    kind,
    repo,
    previewUrl: `https://gallery.hanzo.ai/templates/${raw.slug}`,
    fork:
      kind === "repo"
        ? `/dev?repo=${repo}&action=edit`
        : `/dev?template=hanzo-apps/${raw.slug}&action=edit`,
    hasShot: TEMPLATE_SHOTS.has(raw.slug),
  };
}

// Entries are in gallery/snapshot order so the grid and relatedTemplates() stay
// stable and match the underlying catalog.
const RAW: RawEntry[] = [
  {
    slug: "synapse",
    name: "Synapse AI SaaS Platform",
    tagline: "A production-shaped AI product: chat, media tools and pricing in one Next.js app.",
    description:
      "Synapse is a complete front end for an AI SaaS product — a conversational chat surface, audio and video processing screens, an image editor and a pricing page, wired together in a modern Next.js 14 app. Start here when you want to ship an AI tool that looks funded, not prototyped. Fork it, point the chat at your models through Hanzo's gateway, and go live.",
    category: "SaaS",
    tags: ["Apps", "AI"],
    keyHighlights: [
      { title: "AI chat surface", body: "A ready conversational UI with threaded messages and a streaming-friendly layout you can point at any model." },
      { title: "Multimodal screens", body: "Dedicated audio/video and photo-editing views so media features have a home from day one." },
      { title: "Pricing built in", body: "A conversion-ready pricing section to gate features and collect upgrades without extra design work." },
      { title: "50+ components", body: "A deep component set spanning the whole product, so new screens compose instead of starting from scratch." },
      { title: "Typed Next.js core", body: "Next.js 14.2 with TypeScript and responsive layouts — a stack that scales from MVP to real traffic." },
    ],
    about:
      "Synapse packages the hard parts of an AI SaaS front end — chat, media tooling and monetization — into one coherent, typed Next.js codebase. It is the highest-rated starter in the gallery for teams building an actual product rather than a demo.",
    perfectFor: [
      "Founders shipping an AI product MVP",
      "Adding a chat or copilot surface to a SaaS",
      "Multimodal tools across audio, video and images",
      "Launches that need pricing on day one",
    ],
    framework: "Next.js 14.2 + TS",
    seoTitle: "Synapse — AI SaaS Platform Template | Hanzo",
    seoDescription:
      "Fork Synapse, a Next.js 14 AI SaaS starter with chat, audio/video, photo editing and pricing. Free to remix with AI and deploy on Hanzo.",
  },
  {
    slug: "circle",
    name: "Circle Social Network",
    tagline: "A full social app shell — feed, messaging and profiles, ready to make your own.",
    description:
      "Circle is a social platform front end with a posting feed, direct messages, member profiles and a notifications system already laid out and connected. Instead of rebuilding the same primitives every social product needs, you fork Circle and focus on what makes your community different. Built in Next.js 14 with TypeScript for a fast, typed foundation.",
    category: "Apps",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Posting feed", body: "A timeline of posts with the interactions people expect from a modern social app." },
      { title: "Direct messages", body: "A messaging surface so members can talk one-to-one without bolting on a chat later." },
      { title: "Profiles", body: "Member profile pages that give each user a real identity and home in the product." },
      { title: "Notifications", body: "A notifications pattern to keep people coming back to activity that matters to them." },
      { title: "40+ components", body: "A broad component set covering the whole social surface, responsive out of the box." },
    ],
    about:
      "Circle gives a new community product its skeleton — feed, messaging, profiles and notifications — so you can spend your time on the parts that are actually novel. It is a top-tier, five-star starter for anything social.",
    perfectFor: [
      "Community and social apps",
      "Niche networks around an interest",
      "Team or member portals with a feed",
      "Adding social features to an existing product",
    ],
    framework: "Next.js 14.2 + TS",
    seoTitle: "Circle — Social Network App Template | Hanzo",
    seoDescription:
      "Fork Circle, a Next.js 14 social app template with feed, DMs, profiles and notifications. Remix it with AI and launch on Hanzo.",
  },
  {
    slug: "metrics",
    name: "Metrics Admin Dashboard",
    tagline: "One console for analytics, CRM, finance and projects — batteries included.",
    description:
      "Metrics is a broad admin dashboard that already covers analytics, a CRM view, finance and project tracking in a single, consistent interface. It is the fastest way to stand up an internal console without designing every table, chart and layout from zero. Next.js 13 with TypeScript and 60+ components keep it clean as you wire it to your own data.",
    category: "Internal Tools",
    tags: ["SaaS", "Dashboard"],
    keyHighlights: [
      { title: "Analytics views", body: "Chart and metric layouts ready to bind to your real numbers, not placeholder art." },
      { title: "CRM section", body: "Customer records and pipeline screens so a sales view ships with the console." },
      { title: "Finance & projects", body: "Finance summaries and project tracking give the dashboard genuine operational range." },
      { title: "60+ components", body: "One of the deepest component sets in the gallery — tables, cards, filters and more." },
      { title: "Typed foundation", body: "Next.js 13 with TypeScript keeps a large admin surface maintainable as it grows." },
    ],
    about:
      "Metrics is a do-everything internal console: analytics, CRM, finance and projects under one roof. Fork it when you need an operations dashboard yesterday and want a single design language across every module.",
    perfectFor: [
      "Internal operations dashboards",
      "Founders who need admin now",
      "Multi-module back offices",
      "A shared design system for internal tools",
    ],
    framework: "Next.js 13.3 + TS",
    seoTitle: "Metrics — Admin Dashboard Template | Hanzo",
    seoDescription:
      "Fork Metrics, a Next.js admin dashboard with analytics, CRM, finance and project views plus 60+ components. Wire your data and ship on Hanzo.",
  },
  {
    slug: "kinetic",
    name: "Kinetic Motion Portfolio",
    tagline: "A GSAP-driven portfolio with buttery smooth scroll and real presence.",
    description:
      "Kinetic is a creative portfolio built around motion — GSAP animations and smooth scrolling give your work a cinematic, high-craft feel the moment it loads. It is for people whose portfolio is the pitch and who want movement doing some of the talking. Next.js 14 with TypeScript keeps the animation layer fast and controllable.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "GSAP motion", body: "Professional animation choreography that makes scrolling through your work feel intentional." },
      { title: "Smooth scroll", body: "Inertial, eased scrolling that reads as premium without fighting usability." },
      { title: "Portfolio-first", body: "Layouts designed to frame projects as the hero, with room for context and story." },
      { title: "Modern Next.js", body: "Next.js 14.2 with TypeScript so the effects stay performant and easy to extend." },
    ],
    about:
      "Kinetic is for creatives who want their portfolio to move — literally. GSAP and smooth scroll turn a project list into an experience, and the Next.js core keeps it fast. A five-star pick when motion is part of your brand.",
    perfectFor: [
      "Designers and motion artists",
      "Creative directors and studios",
      "Anyone whose reel is the sell",
      "Standing out with tasteful animation",
    ],
    framework: "Next.js 14.2 + TS",
    seoTitle: "Kinetic — Animated Portfolio Template | Hanzo",
    seoDescription:
      "Fork Kinetic, a Next.js 14 portfolio with GSAP motion and smooth scroll. Remix it with AI and publish your work on Hanzo.",
  },
  {
    slug: "quantum",
    name: "Quantum Animated SaaS Landing",
    tagline: "A motion-rich landing page that makes a new product feel inevitable.",
    description:
      "Quantum is a modern SaaS landing page with Framer Motion animation woven through the hero, sections and calls to action. It is engineered to make a launch feel polished and confident, so first-time visitors take you seriously. Built in Next.js 14 and fully responsive, it drops straight into a product marketing site.",
    category: "SaaS",
    tags: ["Landing Page"],
    keyHighlights: [
      { title: "Framer Motion", body: "Animated hero and section reveals that give the page rhythm and a premium feel." },
      { title: "Launch-ready hero", body: "A focal hero built to state your value fast and push visitors toward one action." },
      { title: "Modern sections", body: "A clean set of marketing sections you can reorder and rewrite for your product." },
      { title: "Responsive", body: "Looks composed from phone to widescreen without extra layout work." },
    ],
    about:
      "Quantum is a five-star SaaS landing page for teams who want motion and polish without hiring for it. Fork it, drop in your copy and product shots, and you have a launch page that punches above its weight.",
    perfectFor: [
      "SaaS product launches",
      "Waitlist and early-access pages",
      "Rebranding a tired marketing site",
      "Teams that want motion without the build cost",
    ],
    framework: "Next.js 14.1",
    seoTitle: "Quantum — Animated SaaS Landing Template | Hanzo",
    seoDescription:
      "Fork Quantum, a Next.js 14 SaaS landing page with Framer Motion animation. Edit with AI and launch a polished product site on Hanzo.",
  },
  {
    slug: "blocks",
    name: "Blocks — shadcn/ui Kit",
    tagline: "100+ shadcn/ui blocks to assemble interfaces at speed.",
    description:
      "Blocks is a library of 100+ prebuilt shadcn/ui sections and components — the exact building blocks modern product teams reach for. Instead of hand-coding every hero, pricing table and form, you compose pages from proven blocks and move on. Built on Next.js 14 with shadcn/ui so it fits the stack most teams already use.",
    category: "Developer Tools",
    tags: ["Landing Page", "SaaS"],
    keyHighlights: [
      { title: "100+ blocks", body: "A large, ready-to-drop set of sections that turn page-building into composition." },
      { title: "shadcn/ui native", body: "Built on the shadcn/ui system, so it slots into the toolkit your team already knows." },
      { title: "Composable", body: "Mix and match blocks to assemble landing pages, dashboards and product surfaces fast." },
      { title: "Responsive", body: "Every block is responsive, so composed pages hold together at any width." },
    ],
    about:
      "Blocks is a five-star developer resource: a deep catalog of shadcn/ui sections you can lift into any project. Fork it as your internal component shelf and stop rebuilding the same UI over and over.",
    perfectFor: [
      "Developers building on shadcn/ui",
      "Assembling pages from proven sections",
      "Internal design-system starters",
      "Shipping UI faster across projects",
    ],
    framework: "Next.js 14 + shadcn",
    seoTitle: "Blocks — shadcn/ui Component Kit | Hanzo",
    seoDescription:
      "Fork Blocks, 100+ shadcn/ui sections and components for Next.js. Compose pages fast, remix with AI and deploy on Hanzo.",
  },
  {
    slug: "savor",
    name: "Savor Food Delivery",
    tagline: "A food-ordering front end with menus, carts and order flow, ready to serve.",
    description:
      "Savor is an ordering and delivery experience — browsable menus, a cart, and an order flow designed for restaurants and food brands. It gives a delivery product its whole customer-facing surface so you can concentrate on kitchens, not components. Next.js 14 with TypeScript keeps checkout fast and the codebase clean.",
    category: "Ecommerce",
    tags: ["Apps", "Websites"],
    keyHighlights: [
      { title: "Menu browsing", body: "Appetizing menu and item layouts built to turn hungry visitors into orders." },
      { title: "Cart & orders", body: "A cart and ordering flow so the path from craving to checkout is already wired." },
      { title: "Delivery-shaped", body: "Screens organized around real food-delivery journeys, not a generic shop." },
      { title: "30+ components", body: "A focused component set covering the ordering surface, responsive throughout." },
    ],
    about:
      "Savor is a five-star starter for anything that sells food. Fork it for a restaurant, ghost kitchen or delivery app and you inherit the menus, cart and order flow that would otherwise eat your first sprint.",
    perfectFor: [
      "Restaurants and cafes going online",
      "Food delivery and pickup apps",
      "Ghost kitchens and meal brands",
      "Any menu-plus-checkout product",
    ],
    framework: "Next.js 14.2 + TS",
    seoTitle: "Savor — Food Delivery App Template | Hanzo",
    seoDescription:
      "Fork Savor, a Next.js 14 food-ordering template with menus, cart and delivery flow. Remix with AI and launch your restaurant online on Hanzo.",
  },
  {
    slug: "mint",
    name: "Mint Creative Portfolio",
    tagline: "A clean, modern portfolio that lets the work breathe.",
    description:
      "Mint is a modern creative portfolio with a calm, considered layout that puts your projects front and center. It is for people who want polish without noise — a site that feels current and gets out of the way of the work. Next.js 14 with TypeScript makes it quick to load and easy to keep fresh.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Work-forward layout", body: "Generous space and clean structure so projects read as the main event." },
      { title: "Modern styling", body: "A contemporary aesthetic that signals current taste without trend-chasing." },
      { title: "Responsive", body: "Holds its composure from mobile to desktop with no extra effort." },
      { title: "Typed Next.js", body: "Next.js 14 with TypeScript keeps updates fast and the code approachable." },
    ],
    about:
      "Mint is a five-star creative portfolio for people who prefer restraint. Fork it, drop in your projects, and you have a modern, professional presence you will not be embarrassed to send.",
    perfectFor: [
      "Designers and creatives",
      "Freelancers building a presence",
      "Anyone who wants clean over flashy",
      "A portfolio you can update quickly",
    ],
    framework: "Next.js 14 + TS",
    seoTitle: "Mint — Creative Portfolio Template | Hanzo",
    seoDescription:
      "Fork Mint, a clean Next.js 14 creative portfolio. Remix it with AI, add your work and publish a modern portfolio on Hanzo.",
  },
  {
    slug: "matrix",
    name: "Matrix AI Bento Layout",
    tagline: "An AI-themed bento grid for landing pages that look designed, not templated.",
    description:
      "Matrix is a bento-card layout system with an AI-forward aesthetic — the modular grid look that powers today's best product and landing pages. You get a set of composable card layouts to tell a product story in tiles rather than a wall of sections. Built in Next.js 14 with TypeScript.",
    category: "Developer Tools",
    tags: ["Landing Page", "AI"],
    keyHighlights: [
      { title: "Bento grid", body: "Modular card layouts that arrange features and stats into a modern, scannable grid." },
      { title: "AI aesthetic", body: "Styling tuned for AI and technical products so it looks the part immediately." },
      { title: "30 layouts", body: "A generous set of arrangements to mix and match for different page stories." },
      { title: "Next.js + TS", body: "A typed Next.js foundation that keeps the grid fast and easy to extend." },
    ],
    about:
      "Matrix is a five-star bento-card kit for building the tiled, modern landing look without designing every cell. Fork it to assemble AI-flavored product pages from proven layouts.",
    perfectFor: [
      "AI and technical product pages",
      "Feature and stat showcases",
      "Modern bento-style landing sections",
      "Composing pages from layout tiles",
    ],
    framework: "Next.js 14.2 + TS",
    seoTitle: "Matrix — AI Bento Card Layout Template | Hanzo",
    seoDescription:
      "Fork Matrix, a Next.js 14 bento-card layout kit with an AI aesthetic and 30 layouts. Compose modern landing pages and ship on Hanzo.",
  },
  {
    slug: "mosaic",
    name: "Mosaic Bento Layout Kit",
    tagline: "A general-purpose bento grid for any modern product page.",
    description:
      "Mosaic is the versatile sibling of the bento family — the same modular card system, styled to suit any product rather than one vertical. It is the quickest way to get the tiled, contemporary landing look across a range of use cases. Next.js 14 with TypeScript keeps 30 layouts fast and flexible.",
    category: "Developer Tools",
    tags: ["Landing Page"],
    keyHighlights: [
      { title: "Multipurpose grid", body: "Neutral, flexible bento layouts that fit SaaS, agencies, apps and more." },
      { title: "30 layouts", body: "A broad arrangement library so you rarely need to design a new tile." },
      { title: "Composable", body: "Combine cards to build feature sections, showcases and hero grids." },
      { title: "Next.js + TS", body: "Typed Next.js 14 foundation for performant, maintainable pages." },
    ],
    about:
      "Mosaic gives you the modern bento layout without an AI or crypto slant — a neutral, five-star kit that adapts to whatever you are building. Fork it as a general-purpose page-assembly toolkit.",
    perfectFor: [
      "Any product landing page",
      "Feature grids and showcases",
      "Agencies serving many verticals",
      "A flexible bento starting point",
    ],
    framework: "Next.js 14.2 + TS",
    seoTitle: "Mosaic — Bento Card Layout Template | Hanzo",
    seoDescription:
      "Fork Mosaic, a general-purpose Next.js 14 bento-card layout kit with 30 layouts. Build modern pages fast and deploy on Hanzo.",
  },
  {
    slug: "prism-react",
    name: "Prism Modern SaaS Landing",
    tagline: "An animated, Vite-fast SaaS landing for a confident launch.",
    description:
      "Prism (React) is a modern SaaS landing page with tasteful animation and a snappy Vite build. It gives a product marketing site real polish and speed without the overhead of a full framework. React 18 and Vite make local iteration instant while the design stays current.",
    category: "SaaS",
    tags: ["Landing Page"],
    keyHighlights: [
      { title: "Animated UI", body: "Motion accents that make the page feel alive without getting in the way." },
      { title: "Modern landing", body: "A clean marketing structure ready for your value prop and CTAs." },
      { title: "Vite speed", body: "React 18 on Vite for near-instant dev feedback and fast builds." },
      { title: "Responsive", body: "Composed and legible across every screen size." },
    ],
    about:
      "Prism (React) is for teams who want a polished SaaS landing on a lean React + Vite stack. Fork it for quick iteration and a marketing page that looks the part.",
    perfectFor: [
      "SaaS and product launches",
      "React teams who prefer Vite",
      "Fast marketing-page iteration",
      "A modern site without a heavy framework",
    ],
    framework: "React 18 + Vite",
    seoTitle: "Prism — Modern SaaS Landing (React) | Hanzo",
    seoDescription:
      "Fork Prism, a React 18 + Vite SaaS landing page with animation. Remix with AI and launch a polished product site on Hanzo.",
  },
  {
    slug: "matrix-react",
    name: "Matrix AI Bento (React)",
    tagline: "The AI bento grid on a plain React stack.",
    description:
      "Matrix (React) is the AI-themed bento-card layout system delivered as plain React 18 — the same modern tiled look without Next.js. Fork it when your project already lives in React and you want the AI-flavored grid to drop straight in. Thirty layouts give you room to tell any product story.",
    category: "Developer Tools",
    tags: ["Landing Page", "AI"],
    keyHighlights: [
      { title: "Bento grid", body: "Modular AI-styled card layouts for a modern, scannable page." },
      { title: "React 18", body: "Plain React so it fits an existing React app without framework friction." },
      { title: "30 layouts", body: "A wide set of arrangements to mix for features, stats and heroes." },
      { title: "Responsive", body: "Every tile holds up across breakpoints." },
    ],
    about:
      "Matrix (React) is the framework-free version of the AI bento kit. Fork it to bring the tiled, technical aesthetic into any React project.",
    perfectFor: [
      "React apps needing a bento look",
      "AI and technical landing sections",
      "Teams avoiding Next.js",
      "Composable feature grids",
    ],
    framework: "React 18",
    seoTitle: "Matrix — AI Bento Layout (React) | Hanzo",
    seoDescription:
      "Fork Matrix (React), an AI-themed bento-card layout kit in React 18 with 30 layouts. Build modern pages and deploy on Hanzo.",
  },
  {
    slug: "mosaic-react",
    name: "Mosaic Bento Kit (React)",
    tagline: "The multipurpose bento grid as a React starter.",
    description:
      "Mosaic (React) delivers the versatile bento-card layout system as a React 18 app on Create React App. It is the neutral, adaptable tiled look for teams who want plain React rather than a framework. Thirty layouts keep page assembly flexible across any vertical.",
    category: "Developer Tools",
    tags: ["Landing Page"],
    keyHighlights: [
      { title: "Multipurpose grid", body: "Neutral bento layouts that suit any kind of product page." },
      { title: "React 18 + CRA", body: "A familiar React setup that drops into existing projects easily." },
      { title: "30 layouts", body: "A deep arrangement library so new sections are composition, not design." },
      { title: "Responsive", body: "Tiles reflow cleanly from mobile to desktop." },
    ],
    about:
      "Mosaic (React) is the general-purpose bento kit for React teams. Fork it as a flexible, framework-free toolkit for building modern tiled pages.",
    perfectFor: [
      "React landing pages",
      "Feature and showcase grids",
      "Agencies across verticals",
      "A neutral bento starting point",
    ],
    framework: "React 18 + CRA",
    seoTitle: "Mosaic — Bento Layout Kit (React) | Hanzo",
    seoDescription:
      "Fork Mosaic (React), a multipurpose React 18 bento-card kit with 30 layouts. Compose modern pages fast and ship on Hanzo.",
  },
  {
    slug: "soar",
    name: "Soar Fitness & Booking",
    tagline: "A fitness studio site with classes and booking built in.",
    description:
      "Soar is a fitness and wellness front end with class schedules and a booking flow ready to go. It is built for studios, gyms and instructors who need clients to find a class and reserve a spot without friction. React 18 on Create React App keeps it approachable and quick to customize.",
    category: "Services",
    tags: ["Apps", "Websites"],
    keyHighlights: [
      { title: "Class schedules", body: "Layouts for listing classes and sessions so clients can see what's on at a glance." },
      { title: "Booking flow", body: "A reservation path that turns interest into a booked spot without extra tooling." },
      { title: "Wellness styling", body: "A look tuned for fitness and wellness brands, energetic but clean." },
      { title: "30+ components", body: "A solid component set covering the studio surface, responsive throughout." },
    ],
    about:
      "Soar is a service-business starter for the fitness world — classes and booking without stitching together plugins. Fork it for a studio or instructor site that can actually take reservations.",
    perfectFor: [
      "Gyms and fitness studios",
      "Yoga and wellness instructors",
      "Class-based service businesses",
      "Any booking-driven local brand",
    ],
    framework: "React 18 + CRA",
    seoTitle: "Soar — Fitness & Class Booking Template | Hanzo",
    seoDescription:
      "Fork Soar, a React fitness template with class schedules and booking. Remix with AI and launch your studio site on Hanzo.",
  },
  {
    slug: "cipher-react",
    name: "Cipher Crypto Dashboard",
    tagline: "A trading console with charts and portfolio views, ready to wire up.",
    description:
      "Cipher (React) is a crypto exchange and trading dashboard — charts, order surfaces and portfolio views arranged into a dense, professional console. It gives a fintech or exchange product its whole operator-facing UI so you can focus on the data behind it. Built in React with 40+ components for a serious surface.",
    category: "Internal Tools",
    tags: ["Apps", "Dashboard"],
    keyHighlights: [
      { title: "Trading charts", body: "Chart-forward layouts built to visualize markets and price action." },
      { title: "Dashboard surface", body: "A dense, organized console that reads as a real exchange back office." },
      { title: "Portfolio views", body: "Screens for balances and holdings so account state has a clear home." },
      { title: "40+ components", body: "One of the richest component sets in the gallery for data-heavy UIs." },
    ],
    about:
      "Cipher (React) is a crypto trading dashboard for fintech teams who need a credible console fast. Fork it and connect your market data — the layouts, charts and tables are already done.",
    perfectFor: [
      "Crypto exchanges and wallets",
      "Trading and markets dashboards",
      "Fintech back-office tools",
      "Any data-dense operator console",
    ],
    framework: "React 17",
    seoTitle: "Cipher — Crypto Trading Dashboard (React) | Hanzo",
    seoDescription:
      "Fork Cipher, a React crypto trading dashboard with charts, portfolio views and 40+ components. Wire your data and deploy on Hanzo.",
  },
  {
    slug: "launch",
    name: "Launch SaaS Marketing Site",
    tagline: "A straightforward, modern SaaS landing that ships in an afternoon.",
    description:
      "Launch is a no-nonsense SaaS landing page — a clean, modern marketing site you can put your product into and publish the same day. It skips the complexity and gives you the sections a launch actually needs. Built on Next.js 13 and fully responsive.",
    category: "SaaS",
    tags: ["Landing Page"],
    keyHighlights: [
      { title: "Launch-ready", body: "The core marketing sections a SaaS needs, arranged and ready for your copy." },
      { title: "Modern & clean", body: "A current look that reads as professional without heavy customization." },
      { title: "Next.js 13", body: "A dependable framework base that is easy to extend as the product grows." },
      { title: "Responsive", body: "Looks right on every device out of the box." },
    ],
    about:
      "Launch is the pragmatic SaaS landing: everything you need, nothing you don't. Fork it when the goal is to be live today with a marketing page that does the job well.",
    perfectFor: [
      "Fast SaaS launches",
      "Solo founders and small teams",
      "Product waitlists and MVPs",
      "A clean marketing page in a day",
    ],
    framework: "Next.js 13",
    seoTitle: "Launch — SaaS Landing Page Template | Hanzo",
    seoDescription:
      "Fork Launch, a clean Next.js SaaS landing page. Remix it with AI, drop in your product and go live on Hanzo the same day.",
  },
  {
    slug: "construct",
    name: "Construct App Landing",
    tagline: "A focused landing page for launching an app.",
    description:
      "Construct is an app landing page built to sell a single product — a hero, the key sections and clear calls to action, arranged for conversion. It is the right starting point when you have an app to launch and want a page that drives installs or signups. Next.js 14 and responsive throughout.",
    category: "Landing Page",
    tags: ["Apps"],
    keyHighlights: [
      { title: "App-focused hero", body: "A hero built to communicate one app's value and push visitors to act." },
      { title: "Conversion sections", body: "The features, proof and CTA blocks a launch page needs, already laid out." },
      { title: "Modern design", body: "A current, credible look that fits consumer and product apps alike." },
      { title: "Responsive", body: "Reads cleanly on the phones most of your visitors will use." },
    ],
    about:
      "Construct is a purpose-built app launch page. Fork it, add your screenshots and copy, and point your campaigns at a page designed to convert.",
    perfectFor: [
      "Mobile and web app launches",
      "Install and signup campaigns",
      "Single-product marketing pages",
      "Pre-launch and waitlist pages",
    ],
    framework: "Next.js 14",
    seoTitle: "Construct — App Landing Page Template | Hanzo",
    seoDescription:
      "Fork Construct, a Next.js 14 app landing page built for conversions. Remix with AI and launch your app site on Hanzo.",
  },
  {
    slug: "deploy",
    name: "Deploy Marketing Landing",
    tagline: "A versatile marketing landing for any product or campaign.",
    description:
      "Deploy is a general marketing landing page — a flexible, modern layout that adapts to products, services and campaigns alike. When you need a strong page and don't want it tied to one vertical, Deploy is the neutral, capable choice. Built on Next.js 14 and responsive by default.",
    category: "Landing Page",
    tags: ["Websites", "Marketing"],
    keyHighlights: [
      { title: "Versatile layout", body: "A neutral marketing structure that fits nearly any offer or campaign." },
      { title: "Modern sections", body: "Clean hero, features and CTA blocks ready for your message." },
      { title: "Next.js 14", body: "A current framework base that stays fast and easy to extend." },
      { title: "Responsive", body: "Composed across every screen with no extra work." },
    ],
    about:
      "Deploy is the do-anything marketing landing page. Fork it for a launch, a campaign or a one-pager and shape it to whatever you are promoting.",
    perfectFor: [
      "Product and service marketing",
      "Campaign and promo pages",
      "One-page sites",
      "A neutral landing starting point",
    ],
    framework: "Next.js 14",
    seoTitle: "Deploy — Marketing Landing Page Template | Hanzo",
    seoDescription:
      "Fork Deploy, a versatile Next.js 14 marketing landing page. Remix with AI and ship a campaign or product page on Hanzo.",
  },
  {
    slug: "loop",
    name: "Loop Bento Layout v3",
    tagline: "The latest-generation bento grid for expressive product pages.",
    description:
      "Loop is a v3 bento-card layout system — a fresh take on the modular grid with newer arrangements for building expressive, modern pages. Delivered as React 18, it drops the current tiled look into any React project. Thirty layouts give you plenty of range.",
    category: "Developer Tools",
    tags: ["Landing Page"],
    keyHighlights: [
      { title: "v3 bento", body: "A newer generation of card arrangements for a more expressive grid." },
      { title: "React 18", body: "Plain React so it fits straight into an existing app." },
      { title: "30 layouts", body: "A broad set of tiles to compose features, stats and heroes." },
      { title: "Responsive", body: "Layouts reflow cleanly at every breakpoint." },
    ],
    about:
      "Loop is the v3 evolution of the bento kit. Fork it when you want the freshest tiled layouts for a modern React landing page.",
    perfectFor: [
      "Modern React landing pages",
      "Expressive feature grids",
      "Product showcases",
      "Refreshing an older bento look",
    ],
    framework: "React 18",
    seoTitle: "Loop — Bento Layout Kit v3 (React) | Hanzo",
    seoDescription:
      "Fork Loop, a v3 React 18 bento-card layout kit with 30 layouts. Build expressive modern pages and deploy on Hanzo.",
  },
  {
    slug: "unfixed",
    name: "Unfixed Bento Layout",
    tagline: "An alternate v3 bento grid for a different modern look.",
    description:
      "Unfixed is a v3 bento-card variant — the same modern tiled system with a distinct arrangement and feel, so your page doesn't look like everyone else's. Built in React 18 with thirty layouts, it is a fresh alternative when the standard bento is too familiar. A quick way to differentiate a modern page.",
    category: "Developer Tools",
    tags: ["Landing Page"],
    keyHighlights: [
      { title: "Alternate bento", body: "A distinct v3 layout variant for a look that stands apart from the default grid." },
      { title: "React 18", body: "Framework-free React that slots into existing projects." },
      { title: "30 layouts", body: "A full arrangement set for composing varied page stories." },
      { title: "Responsive", body: "Every layout holds together across screen sizes." },
    ],
    about:
      "Unfixed is the contrarian bento kit — the modern grid with a different personality. Fork it when you want the tiled look but not the obvious one.",
    perfectFor: [
      "Differentiated landing pages",
      "Teams tired of the default bento",
      "Modern feature grids",
      "A distinct React layout base",
    ],
    framework: "React 18",
    seoTitle: "Unfixed — Alternate Bento Layout (React) | Hanzo",
    seoDescription:
      "Fork Unfixed, an alternate React 18 bento-card layout kit with 30 layouts. Build a distinct modern page and ship on Hanzo.",
  },
  {
    slug: "unity",
    name: "Unity Full-Stack App",
    tagline: "A modern full-stack app shell you can build a real product on.",
    description:
      "Unity is a full-stack application starter — a modern, structured app shell ready to grow into a real product rather than a one-off page. It gives you a coherent foundation for authenticated, data-driven features without wiring everything from scratch. Next.js 14 with TypeScript keeps it typed and scalable.",
    category: "Apps",
    tags: ["SaaS", "Websites"],
    keyHighlights: [
      { title: "Full-stack shell", body: "An app structure built to support real features, not just a marketing page." },
      { title: "Modern foundation", body: "Current patterns and layouts that keep a growing app coherent." },
      { title: "30+ components", body: "A solid component base so new screens compose quickly." },
      { title: "Typed Next.js", body: "Next.js 14 with TypeScript for a scalable, maintainable codebase." },
    ],
    about:
      "Unity is a general-purpose full-stack starter for teams building an actual application. Fork it as the backbone for a product and spend your energy on features, not scaffolding.",
    perfectFor: [
      "Full-stack web apps",
      "Product MVPs that will grow",
      "Authenticated, data-driven tools",
      "A typed app foundation",
    ],
    framework: "Next.js 14 + TS",
    seoTitle: "Unity — Full-Stack App Template | Hanzo",
    seoDescription:
      "Fork Unity, a modern Next.js 14 full-stack app starter. Remix with AI, add your features and deploy your product on Hanzo.",
  },
  {
    slug: "prism",
    name: "Prism Creative Agency",
    tagline: "A GSAP-animated agency portfolio with real motion craft.",
    description:
      "Prism is a creative agency portfolio built with GSAP motion — animation and scroll craft that make a studio look established and in demand. It is for agencies whose reputation rests on how the work is presented. Hand-built in HTML/SCSS with GSAP for full control over every animation.",
    category: "Portfolio",
    tags: ["Websites", "Services"],
    keyHighlights: [
      { title: "GSAP motion", body: "Considered animation that signals craft and makes the work feel premium." },
      { title: "Agency-shaped", body: "Layouts built to present a studio, its services and its case studies." },
      { title: "HTML/SCSS", body: "A framework-free build with full control over styling and behavior." },
      { title: "Responsive", body: "The motion and layout hold up from phone to desktop." },
    ],
    about:
      "Prism is an agency portfolio that leads with motion. Fork it when the presentation of the work is the pitch and you want GSAP-grade animation without building it from zero.",
    perfectFor: [
      "Creative and design agencies",
      "Studios showcasing case work",
      "Motion-led brand sites",
      "Standing out with animation craft",
    ],
    framework: "HTML/SCSS + GSAP",
    seoTitle: "Prism — Creative Agency Portfolio Template | Hanzo",
    seoDescription:
      "Fork Prism, a GSAP-animated HTML/SCSS agency portfolio. Remix with AI and publish a motion-rich studio site on Hanzo.",
  },
  {
    slug: "canvas",
    name: "Canvas Design Studio",
    tagline: "A GSAP portfolio built for design studios and their work.",
    description:
      "Canvas is a design-studio portfolio with GSAP motion and a gallery-minded layout that frames projects like exhibits. It suits studios and creatives who treat their site as part of the craft. Built in HTML/SCSS with GSAP so every transition is yours to shape.",
    category: "Portfolio",
    tags: ["Websites", "Services"],
    keyHighlights: [
      { title: "Studio layout", body: "A gallery-style structure that presents projects as curated pieces." },
      { title: "GSAP motion", body: "Smooth animation that adds polish and a sense of intent." },
      { title: "HTML/SCSS", body: "A clean, framework-free build you fully control." },
      { title: "Responsive", body: "Composed across breakpoints without extra effort." },
    ],
    about:
      "Canvas is a portfolio for design studios who want their site to feel curated. Fork it, load in the work, and let the motion and layout do the presenting.",
    perfectFor: [
      "Design studios and collectives",
      "Curated project showcases",
      "Creatives who value presentation",
      "A motion-accented portfolio",
    ],
    framework: "HTML/SCSS + GSAP",
    seoTitle: "Canvas — Design Studio Portfolio Template | Hanzo",
    seoDescription:
      "Fork Canvas, a GSAP HTML/SCSS design-studio portfolio. Remix with AI and publish a curated studio site on Hanzo.",
  },
  {
    slug: "vault",
    name: "Vault Architecture Portfolio",
    tagline: "A clean, structural portfolio for architecture and spatial work.",
    description:
      "Vault is an architecture portfolio with a clean, structural aesthetic that lets buildings and spaces speak for themselves. It is tuned for architects and studios whose work is about form, light and restraint. Built in plain HTML/CSS/JS for a fast, dependable site.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Structural design", body: "A restrained, grid-led layout that suits architectural and spatial work." },
      { title: "Clean presentation", body: "Ample space so photography of projects carries the page." },
      { title: "Plain HTML/CSS/JS", body: "No framework overhead — a fast site that is simple to host anywhere." },
      { title: "Responsive", body: "Holds its proportions across devices." },
    ],
    about:
      "Vault is for architects who want their portfolio as considered as their buildings. Fork it for a clean, structural site that puts the work first.",
    perfectFor: [
      "Architects and firms",
      "Interior and spatial designers",
      "Photography-led project showcases",
      "A restrained, professional portfolio",
    ],
    framework: "HTML/CSS/JS",
    seoTitle: "Vault — Architecture Portfolio Template | Hanzo",
    seoDescription:
      "Fork Vault, a clean HTML/CSS architecture portfolio. Remix with AI and publish a structural, photography-led site on Hanzo.",
  },
  {
    slug: "studio",
    name: "Studio Digital Agency",
    tagline: "A digital agency site built to present services and win work.",
    description:
      "Studio is a digital agency portfolio — a professional layout for presenting services, case studies and a point of view. It is for agencies that need a credible site to convert prospects into conversations. Built in plain HTML/CSS/JS so it is fast and easy to maintain.",
    category: "Portfolio",
    tags: ["Services", "Websites"],
    keyHighlights: [
      { title: "Agency structure", body: "Sections for services, work and story arranged to build trust and pitch capability." },
      { title: "Professional look", body: "A polished, credible aesthetic suited to client-facing agencies." },
      { title: "Plain stack", body: "HTML/CSS/JS keeps the site quick and simple to host and update." },
      { title: "Responsive", body: "Reads cleanly on every device a prospect might use." },
    ],
    about:
      "Studio is a digital agency site focused on turning visitors into clients. Fork it to present your services and case work with a professional, trustworthy feel.",
    perfectFor: [
      "Digital and creative agencies",
      "Freelance collectives",
      "Service-led studios",
      "Pitching work to prospects",
    ],
    framework: "HTML/CSS/JS",
    seoTitle: "Studio — Digital Agency Template | Hanzo",
    seoDescription:
      "Fork Studio, a professional HTML/CSS digital agency site. Remix with AI and publish a services-and-work portfolio on Hanzo.",
  },
  {
    slug: "kalli",
    name: "Kalli Creative Portfolio",
    tagline: "A modern creative portfolio with a considered, gallery feel.",
    description:
      "Kalli is a modern creative portfolio with a clean, gallery-minded layout for showing off a body of work. It suits designers, artists and multi-disciplinary creatives who want something current and uncluttered. Built with an HTML/Gulp workflow for a fast, static site.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Gallery layout", body: "A clean structure that frames projects as a curated collection." },
      { title: "Modern styling", body: "A contemporary look that reads as current without noise." },
      { title: "HTML/Gulp build", body: "A static workflow that produces a fast, easy-to-host site." },
      { title: "Responsive", body: "Composed across mobile and desktop." },
    ],
    about:
      "Kalli is a clean, modern portfolio for creatives who want a curated feel. Fork it, add your work and publish a professional presence quickly.",
    perfectFor: [
      "Designers and artists",
      "Multi-disciplinary creatives",
      "A curated project showcase",
      "Freelancers building a presence",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Kalli — Creative Portfolio Template | Hanzo",
    seoDescription:
      "Fork Kalli, a modern HTML/Gulp creative portfolio. Remix with AI and publish a curated, professional portfolio on Hanzo.",
  },
  {
    slug: "innovise",
    name: "Innovise Agency Website",
    tagline: "A modern business site for agencies and consultancies.",
    description:
      "Innovise is an agency and business website — a modern, professional layout for presenting a company, its services and its credibility. It is for consultancies and firms that need a site to look established and clear. Built in straightforward HTML/CSS for a fast, dependable presence.",
    category: "Websites",
    tags: ["Services", "Business"],
    keyHighlights: [
      { title: "Business structure", body: "Sections for services, about and contact arranged to present a company well." },
      { title: "Professional look", body: "A modern, credible aesthetic suited to agencies and consultancies." },
      { title: "HTML/CSS", body: "A clean, framework-free build that is easy to host and maintain." },
      { title: "Responsive", body: "Looks composed on every device." },
    ],
    about:
      "Innovise is a professional business site for agencies and consultancies. Fork it to present your company and services with a modern, trustworthy feel.",
    perfectFor: [
      "Agencies and consultancies",
      "Professional services firms",
      "Company and about sites",
      "A credible business presence",
    ],
    framework: "HTML/CSS",
    seoTitle: "Innovise — Agency & Business Website Template | Hanzo",
    seoDescription:
      "Fork Innovise, a modern HTML/CSS agency and business website. Remix with AI and publish a professional company site on Hanzo.",
  },
  {
    slug: "drive",
    name: "Drive Automotive Website",
    tagline: "A modern automotive site for dealers, brands and services.",
    description:
      "Drive is an automotive business website with a modern, confident look for dealerships, car brands and vehicle services. It presents inventory, services and the brand in a layout tuned for the industry. Built in HTML/CSS for a fast, straightforward site.",
    category: "Websites",
    tags: ["Services", "Business"],
    keyHighlights: [
      { title: "Automotive styling", body: "A bold, industry-appropriate look for cars, dealers and vehicle brands." },
      { title: "Business sections", body: "Layouts for showcasing vehicles, services and the brand story." },
      { title: "HTML/CSS", body: "A clean, framework-free build that is quick to host and edit." },
      { title: "Responsive", body: "Presents well across phones and desktops." },
    ],
    about:
      "Drive is an automotive website built for the industry's look and needs. Fork it for a dealership, brand or vehicle service that wants a modern online home.",
    perfectFor: [
      "Car dealerships",
      "Automotive brands",
      "Vehicle service businesses",
      "Any auto-industry site",
    ],
    framework: "HTML/CSS",
    seoTitle: "Drive — Automotive Website Template | Hanzo",
    seoDescription:
      "Fork Drive, a modern HTML/CSS automotive website for dealers and brands. Remix with AI and publish an auto site on Hanzo.",
  },
  {
    slug: "drive-html",
    name: "Drive Automotive (HTML Build)",
    tagline: "The Drive automotive site on a Gulp build workflow.",
    description:
      "Drive (HTML) is the automotive website delivered through an HTML/Gulp build pipeline — the same industry-tuned design with a static build workflow for teams who prefer it. It suits dealers and vehicle brands that want a modern site and a conventional static toolchain. Fast, responsive and easy to host.",
    category: "Websites",
    tags: ["Services", "Business"],
    keyHighlights: [
      { title: "Automotive design", body: "The same confident, industry-appropriate look as Drive." },
      { title: "Gulp workflow", body: "An HTML/Gulp build for teams who want a static pipeline." },
      { title: "Business sections", body: "Vehicle, service and brand layouts ready for your content." },
      { title: "Responsive", body: "Holds up across devices out of the box." },
    ],
    about:
      "Drive (HTML) is the Gulp-built edition of the automotive site. Fork it when you want Drive's design with a traditional static build workflow.",
    perfectFor: [
      "Dealers wanting a static build",
      "Automotive brands",
      "Vehicle service sites",
      "Teams on a Gulp toolchain",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Drive (HTML) — Automotive Website Template | Hanzo",
    seoDescription:
      "Fork Drive (HTML), a Gulp-built automotive website for dealers and brands. Remix with AI and publish an auto site on Hanzo.",
  },
  {
    slug: "oasis",
    name: "Oasis Resort & Hospitality",
    tagline: "A luxury resort site that sells the escape.",
    description:
      "Oasis is a hospitality website for resorts, hotels and luxury stays — an elegant layout built to convey atmosphere and invite bookings. It gives a property the aspirational presentation guests expect before they reserve. Built in HTML/CSS for a fast, refined site.",
    category: "Websites",
    tags: ["Services", "Hospitality"],
    keyHighlights: [
      { title: "Luxury aesthetic", body: "An elegant, aspirational look tuned to sell an experience and a place." },
      { title: "Hospitality sections", body: "Layouts for rooms, amenities and atmosphere that lead toward a booking." },
      { title: "HTML/CSS", body: "A clean, framework-free build that loads fast and is simple to host." },
      { title: "Responsive", body: "Looks refined on the phones travelers browse from." },
    ],
    about:
      "Oasis is a resort and hospitality site built to make a stay feel irresistible. Fork it for a hotel, resort or retreat that needs an elegant online presence.",
    perfectFor: [
      "Resorts and hotels",
      "Luxury retreats and villas",
      "Boutique hospitality brands",
      "Any stay that sells atmosphere",
    ],
    framework: "HTML/CSS",
    seoTitle: "Oasis — Resort & Hospitality Website Template | Hanzo",
    seoDescription:
      "Fork Oasis, an elegant HTML/CSS resort and hospitality website. Remix with AI and publish a luxury stay site on Hanzo.",
  },
  {
    slug: "solo",
    name: "Solo Simple SaaS Landing",
    tagline: "A simple, single-focus SaaS landing that gets to the point.",
    description:
      "Solo is a pared-back SaaS landing page — one clear message, the essential sections and a strong call to action, nothing extra. It is ideal for a single product or a focused pitch where simplicity converts. Built with an HTML/Gulp workflow for a fast static site.",
    category: "SaaS",
    tags: ["Landing Page"],
    keyHighlights: [
      { title: "Single focus", body: "A layout built around one product and one clear action." },
      { title: "Simple & clean", body: "The essential sections only, so the message stays sharp." },
      { title: "HTML/Gulp build", body: "A static workflow that produces a fast, easy-to-host page." },
      { title: "Responsive", body: "Reads well on every device." },
    ],
    about:
      "Solo is the minimalist SaaS landing: clear, focused and quick to ship. Fork it when simplicity is the strategy and you want the message to carry the page.",
    perfectFor: [
      "Single-product SaaS",
      "Focused pitches and MVPs",
      "Waitlist and coming-soon pages",
      "Teams that value simplicity",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Solo — Simple SaaS Landing Template | Hanzo",
    seoDescription:
      "Fork Solo, a simple HTML/Gulp SaaS landing page. Remix with AI and publish a focused product page on Hanzo.",
  },
  {
    slug: "prism-html",
    name: "Prism SaaS Landing (HTML)",
    tagline: "The animated Prism SaaS landing on a static HTML build.",
    description:
      "Prism (HTML) is the modern, animated SaaS landing delivered through an HTML/Gulp build — the same polished marketing design without a JavaScript framework. It suits teams who want animation and a current look on a static, dependable toolchain. Fast, responsive and simple to host anywhere.",
    category: "SaaS",
    tags: ["Landing Page"],
    keyHighlights: [
      { title: "Animated UI", body: "Motion accents that give the page life and a premium feel." },
      { title: "Modern landing", body: "A clean marketing structure ready for your product story." },
      { title: "HTML/Gulp build", body: "A static workflow — no framework needed to host or ship it." },
      { title: "Responsive", body: "Composed across every screen size." },
    ],
    about:
      "Prism (HTML) is the static edition of the Prism SaaS landing. Fork it when you want the animated, modern design without adopting a framework.",
    perfectFor: [
      "SaaS landings without a framework",
      "Static-hosted marketing pages",
      "Teams on a Gulp toolchain",
      "A polished page that ships fast",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Prism (HTML) — SaaS Landing Template | Hanzo",
    seoDescription:
      "Fork Prism (HTML), an animated static SaaS landing page. Remix with AI and publish a polished product site on Hanzo.",
  },
  {
    slug: "forge",
    name: "Forge Admin Dashboard",
    tagline: "A clean analytics and admin dashboard for internal tools.",
    description:
      "Forge is an admin dashboard with analytics views and the tables, cards and charts an internal console needs. It gives operations, admin and reporting tools a clean, consistent home so you can wire data instead of drawing layouts. Built with an HTML/Gulp workflow for a fast static admin.",
    category: "Internal Tools",
    tags: ["SaaS", "Dashboard"],
    keyHighlights: [
      { title: "Analytics views", body: "Chart and metric layouts ready to bind to your real data." },
      { title: "Admin surface", body: "Tables, cards and controls arranged into a clean operational console." },
      { title: "30+ components", body: "A solid component set covering the common dashboard needs." },
      { title: "HTML/Gulp build", body: "A static workflow that produces a fast, easy-to-host admin." },
    ],
    about:
      "Forge is a straightforward admin dashboard for internal tools and reporting. Fork it to stand up an operations console without designing every widget from scratch.",
    perfectFor: [
      "Internal admin consoles",
      "Analytics and reporting tools",
      "Operations dashboards",
      "A static, fast back office",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Forge — Admin Dashboard Template | Hanzo",
    seoDescription:
      "Fork Forge, an HTML/Gulp admin dashboard with analytics and 30+ components. Wire your data and deploy an internal tool on Hanzo.",
  },
  {
    slug: "cipher-html",
    name: "Cipher Crypto Dashboard (HTML)",
    tagline: "The Cipher trading console on a static HTML build.",
    description:
      "Cipher (HTML) is the crypto exchange and trading dashboard delivered through an HTML/Gulp build — the same charts, tables and portfolio views without a JavaScript framework. It suits fintech teams who want a dense trading console on a static, dependable toolchain. Rich, responsive and ready for your data.",
    category: "Internal Tools",
    tags: ["Apps", "Dashboard"],
    keyHighlights: [
      { title: "Trading charts", body: "Chart-forward layouts for visualizing markets and price action." },
      { title: "Dashboard surface", body: "A dense, organized console that reads as a real exchange back office." },
      { title: "40+ components", body: "One of the richest component sets in the gallery for data-heavy UIs." },
      { title: "HTML/Gulp build", body: "A static workflow — no framework needed to host it." },
    ],
    about:
      "Cipher (HTML) is the static edition of the crypto trading dashboard. Fork it when you want a credible exchange console without adopting a framework.",
    perfectFor: [
      "Crypto exchanges and wallets",
      "Trading dashboards on a static stack",
      "Fintech back-office tools",
      "Data-dense operator consoles",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Cipher (HTML) — Crypto Trading Dashboard | Hanzo",
    seoDescription:
      "Fork Cipher (HTML), a static crypto trading dashboard with charts and 40+ components. Wire your data and deploy on Hanzo.",
  },
  {
    slug: "beta",
    name: "Beta CRM Dashboard",
    tagline: "A business CRM dashboard for managing customers and pipeline.",
    description:
      "Beta is a CRM dashboard — contact records, pipeline views and the business layouts a customer-management tool needs, arranged into one clean console. It is a fast start for internal CRM and back-office tools that would otherwise take weeks to lay out. Built with an HTML/Gulp workflow for a static, dependable admin.",
    category: "Internal Tools",
    tags: ["SaaS", "CRM"],
    keyHighlights: [
      { title: "CRM views", body: "Contact and pipeline layouts so customer management ships with the dashboard." },
      { title: "Business surface", body: "The cards, tables and summaries a back-office tool relies on." },
      { title: "25+ components", body: "A capable component set covering the common CRM screens." },
      { title: "HTML/Gulp build", body: "A static workflow that is fast to host and easy to maintain." },
    ],
    about:
      "Beta is a CRM-shaped admin dashboard for internal business tools. Fork it to manage customers and pipeline without building the console from zero.",
    perfectFor: [
      "Internal CRM tools",
      "Sales and pipeline dashboards",
      "Business back-office admins",
      "Customer management surfaces",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Beta — CRM Dashboard Template | Hanzo",
    seoDescription:
      "Fork Beta, an HTML/Gulp CRM dashboard with pipeline views and 25+ components. Wire your data and deploy an internal tool on Hanzo.",
  },
  {
    slug: "beta-variant",
    name: "Beta CRM Dashboard — Variant",
    tagline: "An alternate styling of the Beta CRM dashboard.",
    description:
      "Beta (Variant) is a second treatment of the Beta CRM dashboard — the same contact and pipeline capability with a different visual arrangement, so you can pick the look that fits. It suits internal business tools that want a distinct feel from the base. Built with an HTML/Gulp workflow for a static admin.",
    category: "Internal Tools",
    tags: ["SaaS", "CRM"],
    keyHighlights: [
      { title: "Alternate styling", body: "A different visual take on the same CRM structure and screens." },
      { title: "CRM views", body: "Contact and pipeline layouts for customer management." },
      { title: "25+ components", body: "The full component set from Beta in a new arrangement." },
      { title: "HTML/Gulp build", body: "A static workflow, fast to host and simple to edit." },
    ],
    about:
      "Beta (Variant) gives the Beta CRM a second face. Fork it when you like the CRM capability but want a different look for your internal tool.",
    perfectFor: [
      "Internal CRM tools",
      "Teams wanting an alternate look",
      "Sales and pipeline dashboards",
      "Business back-office admins",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Beta (Variant) — CRM Dashboard Template | Hanzo",
    seoDescription:
      "Fork Beta (Variant), an alternate HTML/Gulp CRM dashboard with pipeline views and 25+ components. Deploy an internal tool on Hanzo.",
  },
  {
    slug: "hygge-html",
    name: "Hygge Ecommerce Store",
    tagline: "A clean online shop with product pages and cart, ready to sell.",
    description:
      "Hygge (HTML) is a clean ecommerce storefront — product listings, detail pages and a cart, laid out with a calm, uncluttered aesthetic that keeps focus on the goods. It gives a shop its whole customer-facing surface so you can wire up checkout and start selling. Built with an HTML/Gulp workflow for a fast static store.",
    category: "Ecommerce",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Product pages", body: "Listing and detail layouts that present goods cleanly and drive add-to-cart." },
      { title: "Cart flow", body: "A shopping cart so the path to checkout is already in place." },
      { title: "Clean aesthetic", body: "A calm, minimal look that keeps attention on the products." },
      { title: "30+ components", body: "A capable component set covering the storefront, responsive throughout." },
    ],
    about:
      "Hygge (HTML) is a minimalist ecommerce storefront for brands that sell on simplicity. Fork it, connect your catalog and checkout, and start taking orders.",
    perfectFor: [
      "Boutique online shops",
      "Product and lifestyle brands",
      "Minimalist storefronts",
      "Any catalog-plus-cart store",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Hygge — Ecommerce Store Template | Hanzo",
    seoDescription:
      "Fork Hygge, a clean HTML/Gulp ecommerce storefront with product pages and cart. Remix with AI and launch your shop on Hanzo.",
  },
  {
    slug: "hygge-bootstrap",
    name: "Hygge Store — Bootstrap 5",
    tagline: "The Hygge shop built on Bootstrap 5 for familiar customization.",
    description:
      "Hygge (Bootstrap) is the clean ecommerce storefront built on Bootstrap 5 — the same minimal shopping design on the framework millions of developers already know. It suits teams who want a familiar, well-documented base for customizing a store. Product pages, cart and a responsive grid come ready.",
    category: "Ecommerce",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Bootstrap 5", body: "Built on Bootstrap so customization uses patterns your team already knows." },
      { title: "Product pages", body: "Listing and detail layouts ready for your catalog." },
      { title: "Cart flow", body: "A shopping cart wired into the storefront from the start." },
      { title: "30+ components", body: "A full storefront component set, responsive out of the box." },
    ],
    about:
      "Hygge (Bootstrap) is the Bootstrap 5 edition of the Hygge shop. Fork it when you want the clean store design on a familiar, well-supported framework.",
    perfectFor: [
      "Teams standardized on Bootstrap",
      "Boutique online shops",
      "Product and lifestyle brands",
      "Fast, familiar store customization",
    ],
    framework: "HTML/Gulp + Bootstrap 5",
    seoTitle: "Hygge (Bootstrap) — Ecommerce Store Template | Hanzo",
    seoDescription:
      "Fork Hygge (Bootstrap 5), a clean ecommerce storefront with product pages and cart. Remix with AI and launch your shop on Hanzo.",
  },
  {
    slug: "soar-html",
    name: "Soar Fitness (HTML Build)",
    tagline: "The Soar fitness and booking site on a static HTML build.",
    description:
      "Soar (HTML) is the fitness and wellness site delivered through an HTML/Gulp build — class schedules and a booking flow without a JavaScript framework. It suits studios and instructors who want a static, dependable site that can still take reservations. Fast, responsive and easy to host.",
    category: "Services",
    tags: ["Apps", "Websites"],
    keyHighlights: [
      { title: "Class schedules", body: "Layouts for listing classes and sessions clients can browse at a glance." },
      { title: "Booking flow", body: "A reservation path so interest turns into a booked spot." },
      { title: "HTML/Gulp build", body: "A static workflow — no framework needed to host the site." },
      { title: "30+ components", body: "A solid component set covering the studio surface, responsive." },
    ],
    about:
      "Soar (HTML) is the static edition of the Soar fitness site. Fork it when you want classes and booking on a traditional static toolchain.",
    perfectFor: [
      "Gyms and studios on a static stack",
      "Fitness and wellness instructors",
      "Class-based service businesses",
      "Booking-driven local brands",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Soar (HTML) — Fitness & Booking Template | Hanzo",
    seoDescription:
      "Fork Soar (HTML), a static fitness site with class schedules and booking. Remix with AI and launch your studio site on Hanzo.",
  },
  {
    slug: "loop-html",
    name: "Loop Bento Layout (HTML)",
    tagline: "The v3 Loop bento grid as a static HTML kit.",
    description:
      "Loop (HTML) is the v3 bento-card layout system delivered as static HTML/Gulp — the newest modular grid without a JavaScript framework. It brings the current tiled look to static sites and pages that don't run React. Thirty layouts keep page assembly flexible.",
    category: "Developer Tools",
    tags: ["Landing Page"],
    keyHighlights: [
      { title: "v3 bento", body: "The newer generation of card arrangements for an expressive grid." },
      { title: "HTML/Gulp build", body: "Static output that drops into any site without a framework." },
      { title: "30 layouts", body: "A broad set of tiles for features, stats and heroes." },
      { title: "Responsive", body: "Layouts reflow cleanly at every breakpoint." },
    ],
    about:
      "Loop (HTML) is the static edition of the v3 bento kit. Fork it to bring the modern tiled look to plain HTML sites.",
    perfectFor: [
      "Static modern landing pages",
      "Non-React projects",
      "Expressive feature grids",
      "A framework-free bento base",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Loop (HTML) — Bento Layout Kit v3 | Hanzo",
    seoDescription:
      "Fork Loop (HTML), a static v3 bento-card layout kit with 30 layouts. Build modern pages without a framework and ship on Hanzo.",
  },
  {
    slug: "cipher-cards-html",
    name: "Cipher Cards Bento (HTML)",
    tagline: "A crypto-themed bento layout kit in static HTML.",
    description:
      "Cipher Cards (HTML) is a bento-card layout system with a crypto and fintech aesthetic, delivered as static HTML. It is the fast way to build a modern, tiled crypto or web3 landing page without a framework. Thirty layouts give you range to present tokens, features and stats.",
    category: "Developer Tools",
    tags: ["Landing Page", "Crypto"],
    keyHighlights: [
      { title: "Crypto bento", body: "Tiled card layouts styled for crypto, web3 and fintech products." },
      { title: "HTML build", body: "Static output that drops into any site without a framework." },
      { title: "30 layouts", body: "A wide arrangement set for tokens, features and metrics." },
      { title: "Responsive", body: "Every tile holds up across screen sizes." },
    ],
    about:
      "Cipher Cards (HTML) brings the modern bento grid to crypto in a framework-free build. Fork it for a tiled web3 landing page that ships as static HTML.",
    perfectFor: [
      "Crypto and web3 landing pages",
      "Token and protocol sites",
      "Static modern grids",
      "Framework-free fintech pages",
    ],
    framework: "HTML/CSS",
    seoTitle: "Cipher Cards (HTML) — Crypto Bento Layout | Hanzo",
    seoDescription:
      "Fork Cipher Cards (HTML), a crypto-themed static bento layout kit with 30 layouts. Build a web3 landing page and ship on Hanzo.",
  },
  {
    slug: "cipher-cards-react",
    name: "Cipher Cards Bento (React)",
    tagline: "The crypto bento layout kit on a React stack.",
    description:
      "Cipher Cards (React) is the crypto-themed bento-card layout system as React 18 — the same tiled web3 aesthetic ready to drop into a React app. It suits fintech and crypto teams building a modern landing page in React. Thirty layouts cover tokens, features and stats.",
    category: "Developer Tools",
    tags: ["Landing Page", "Crypto"],
    keyHighlights: [
      { title: "Crypto bento", body: "Tiled card layouts styled for crypto, web3 and fintech products." },
      { title: "React 18", body: "Plain React so it fits an existing crypto or fintech app." },
      { title: "30 layouts", body: "A wide arrangement set for tokens, features and metrics." },
      { title: "Responsive", body: "Every tile holds up across breakpoints." },
    ],
    about:
      "Cipher Cards (React) is the React edition of the crypto bento kit. Fork it to build a modern, tiled web3 landing page in React.",
    perfectFor: [
      "Crypto and web3 landing pages",
      "React fintech projects",
      "Token and protocol sites",
      "Modern tiled feature grids",
    ],
    framework: "React 18",
    seoTitle: "Cipher Cards (React) — Crypto Bento Layout | Hanzo",
    seoDescription:
      "Fork Cipher Cards (React), a crypto-themed React 18 bento layout kit with 30 layouts. Build a web3 landing page and ship on Hanzo.",
  },
  {
    slug: "folio-main",
    name: "Folio — Multi-Layout Portfolio",
    tagline: "The flagship Folio portfolio with multiple layouts in one system.",
    description:
      "Folio Main is the flagship of the Folio portfolio system — a creative, multi-layout template that gives you several ways to present your work in one coherent design language. It is the strong default when you want a complete, professional portfolio with room to arrange projects your way. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Multi-layout", body: "Several project presentations in one system, so you can pick the arrangement that fits." },
      { title: "Creative design", body: "A polished, modern aesthetic suited to any creative discipline." },
      { title: "HTML/Gulp build", body: "A static workflow that produces a fast, easy-to-host portfolio." },
      { title: "Responsive", body: "Every layout holds together from mobile to desktop." },
    ],
    about:
      "Folio Main anchors the Folio family: one design language with multiple layouts for showing off work. Fork it as a complete, flexible portfolio you can shape to your discipline.",
    perfectFor: [
      "Designers and creatives",
      "Multi-discipline portfolios",
      "Anyone wanting layout choices",
      "A complete, professional presence",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Multi-Layout Portfolio Template | Hanzo",
    seoDescription:
      "Fork Folio Main, a flexible HTML/Gulp portfolio with multiple layouts. Remix with AI and publish a professional portfolio on Hanzo.",
  },
  {
    slug: "folio-full",
    name: "Folio — Full-Width Portfolio",
    tagline: "An edge-to-edge Folio layout for immersive, large-format work.",
    description:
      "Folio Full is the full-width member of the Folio system — an edge-to-edge layout that lets large imagery and immersive projects fill the screen. It suits creatives whose work rewards scale, from photography to bold visual design. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Full-width layout", body: "Edge-to-edge presentation that gives large-format work room to breathe." },
      { title: "Immersive feel", body: "A layout tuned for imagery-heavy, high-impact portfolios." },
      { title: "HTML/Gulp build", body: "A static workflow producing a fast, easy-to-host site." },
      { title: "Responsive", body: "Scales its impact from desktop down to mobile." },
    ],
    about:
      "Folio Full is for creatives whose work looks best big. Fork it for an immersive, full-width portfolio within the polished Folio family.",
    perfectFor: [
      "Photographers and visual artists",
      "Bold, imagery-led portfolios",
      "Large-format project showcases",
      "Immersive creative sites",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Full-Width Portfolio Template | Hanzo",
    seoDescription:
      "Fork Folio Full, an edge-to-edge HTML/Gulp portfolio for large-format work. Remix with AI and publish an immersive site on Hanzo.",
  },
  {
    slug: "folio-index",
    name: "Folio — Portfolio Hub",
    tagline: "The index page that ties a Folio portfolio together.",
    description:
      "Folio Index is the hub of the Folio system — a landing and index layout that routes visitors into your work, about and contact from one strong entry point. It is the piece that turns a set of pages into a coherent site. Built with an HTML/Gulp workflow for a fast static build.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Hub layout", body: "An index page that welcomes visitors and directs them into the portfolio." },
      { title: "Cohesive entry", body: "Ties work, about and contact into one clear starting point." },
      { title: "HTML/Gulp build", body: "A static workflow that is fast and simple to host." },
      { title: "Responsive", body: "Presents cleanly on every device." },
    ],
    about:
      "Folio Index is the front door of the Folio system. Fork it as the landing and index that pulls your portfolio's pages into a single, coherent site.",
    perfectFor: [
      "Portfolio home and index pages",
      "Creatives assembling a full site",
      "A strong entry point for work",
      "Tying multiple pages together",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Portfolio Hub Template | Hanzo",
    seoDescription:
      "Fork Folio Index, an HTML/Gulp portfolio hub and index page. Remix with AI and publish a cohesive portfolio site on Hanzo.",
  },
  {
    slug: "folio-about",
    name: "Folio — About & Bio Page",
    tagline: "A polished about page to introduce you and your story.",
    description:
      "Folio About is a dedicated about and bio page from the Folio system — a clean, personal layout for your story, background and profile. It is the piece that turns a portfolio into a person, and it works just as well as a standalone bio or resume page. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Resume",
    tags: ["Portfolio"],
    keyHighlights: [
      { title: "Bio layout", body: "A structured space for your story, background and profile, presented cleanly." },
      { title: "Personal feel", body: "A warm, focused design that introduces you rather than just your work." },
      { title: "HTML/Gulp build", body: "A static workflow producing a fast, easy-to-host page." },
      { title: "Responsive", body: "Reads well on every device." },
    ],
    about:
      "Folio About is the about page done right — polished, personal and easy to adapt into a standalone bio or resume. Fork it to introduce yourself with the same craft as your work.",
    perfectFor: [
      "Personal about and bio pages",
      "Standalone resume pages",
      "Creatives and freelancers",
      "Introducing yourself well",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — About & Bio Page Template | Hanzo",
    seoDescription:
      "Fork Folio About, a polished HTML/Gulp about and bio page. Remix with AI and publish a personal resume or profile on Hanzo.",
  },
  {
    slug: "folio-contact",
    name: "Folio — Contact Page",
    tagline: "A clean contact page with a form, ready to receive messages.",
    description:
      "Folio Contact is a dedicated contact page from the Folio system — a clean layout with a form and the details visitors need to reach you. It is the conversion step of a portfolio, designed to make getting in touch effortless. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Contact form", body: "A ready form so visitors can reach you without friction." },
      { title: "Clear details", body: "Space for your channels and information alongside the form." },
      { title: "HTML/Gulp build", body: "A static workflow that is fast and simple to host." },
      { title: "Responsive", body: "Works cleanly on phones and desktops alike." },
    ],
    about:
      "Folio Contact is the get-in-touch page of the Folio system. Fork it to give your portfolio a polished, functional contact step that turns interest into conversation.",
    perfectFor: [
      "Portfolio contact pages",
      "Freelancers taking inquiries",
      "A clean way to receive messages",
      "Completing a portfolio site",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Contact Page Template | Hanzo",
    seoDescription:
      "Fork Folio Contact, a clean HTML/Gulp contact page with a form. Remix with AI and publish a get-in-touch page on Hanzo.",
  },
  {
    slug: "folio-creative-agency-1",
    name: "Folio — Creative Agency",
    tagline: "A Folio layout tuned for creative agencies and their work.",
    description:
      "Folio Creative Agency 1 is an agency-focused layout within the Folio system — built to present a studio's services, projects and personality with modern polish. It is a strong home for a creative agency that wants a portfolio-grade site. Built with an HTML/Gulp workflow for a fast static build.",
    category: "Portfolio",
    tags: ["Services", "Websites"],
    keyHighlights: [
      { title: "Agency layout", body: "Sections for services and case work arranged to pitch a studio." },
      { title: "Creative polish", body: "A modern, expressive aesthetic that signals craft." },
      { title: "HTML/Gulp build", body: "A static workflow producing a fast, easy-to-host site." },
      { title: "Responsive", body: "Holds up across every screen size." },
    ],
    about:
      "Folio Creative Agency 1 brings the Folio family to agencies. Fork it to present your studio and its work with a portfolio-grade, creative feel.",
    perfectFor: [
      "Creative and design agencies",
      "Studios presenting case work",
      "Service-led creative teams",
      "A portfolio-grade agency site",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Creative Agency Template | Hanzo",
    seoDescription:
      "Fork Folio Creative Agency, an HTML/Gulp agency portfolio. Remix with AI and publish a studio site with case work on Hanzo.",
  },
  {
    slug: "folio-creative-agency-2",
    name: "Folio — Creative Agency (Variant)",
    tagline: "A second creative-agency layout for a different studio feel.",
    description:
      "Folio Creative Agency 2 is an alternate agency layout in the Folio system — the same studio-presenting purpose with a distinct arrangement and mood. It gives creative agencies a second look to choose from within one polished family. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Services", "Websites"],
    keyHighlights: [
      { title: "Alternate layout", body: "A different arrangement of the agency presentation for a distinct feel." },
      { title: "Creative polish", body: "A modern, expressive aesthetic that reads as crafted." },
      { title: "HTML/Gulp build", body: "A static workflow, fast to host and easy to edit." },
      { title: "Responsive", body: "Composed across devices out of the box." },
    ],
    about:
      "Folio Creative Agency 2 is the alternate agency face in the Folio family. Fork it when you want the studio-site purpose with a different look.",
    perfectFor: [
      "Creative and design agencies",
      "Studios wanting an alternate look",
      "Service-led creative teams",
      "A distinct agency portfolio",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Creative Agency Variant Template | Hanzo",
    seoDescription:
      "Fork Folio Creative Agency 2, an alternate HTML/Gulp agency portfolio. Remix with AI and publish a studio site on Hanzo.",
  },
  {
    slug: "folio-creative-designer-1",
    name: "Folio — Designer Portfolio",
    tagline: "A Folio layout built to showcase a designer's craft.",
    description:
      "Folio Creative Designer 1 is a designer-focused layout in the Folio system — arranged to foreground visual work and personal craft. It is a strong home for a designer who wants their portfolio to feel as considered as their projects. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Designer layout", body: "A structure that foregrounds visual work and a personal point of view." },
      { title: "Creative polish", body: "A refined aesthetic that reflects design sensibility." },
      { title: "HTML/Gulp build", body: "A static workflow producing a fast, easy-to-host portfolio." },
      { title: "Responsive", body: "Holds its composure across breakpoints." },
    ],
    about:
      "Folio Creative Designer 1 is a portfolio for designers who sweat the details. Fork it to present your craft in a layout that matches it.",
    perfectFor: [
      "Product and visual designers",
      "Brand and graphic designers",
      "Craft-led portfolios",
      "Freelance designers",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Designer Portfolio Template | Hanzo",
    seoDescription:
      "Fork Folio Designer, an HTML/Gulp designer portfolio. Remix with AI and publish a craft-led showcase of your work on Hanzo.",
  },
  {
    slug: "folio-creative-designer-2",
    name: "Folio — Designer Portfolio (Variant)",
    tagline: "A second designer layout for a different presentation.",
    description:
      "Folio Creative Designer 2 is an alternate designer layout in the Folio system — the same craft-forward purpose arranged differently, so you can pick the presentation that fits your work. Part of one polished family with a consistent design language. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Alternate layout", body: "A different arrangement of the designer showcase for a distinct feel." },
      { title: "Creative polish", body: "A refined aesthetic tuned to design work." },
      { title: "HTML/Gulp build", body: "A static workflow, fast to host and simple to edit." },
      { title: "Responsive", body: "Composed across every device." },
    ],
    about:
      "Folio Creative Designer 2 is the alternate designer face in the Folio family. Fork it when you want the craft-forward portfolio with a different look.",
    perfectFor: [
      "Product and visual designers",
      "Designers wanting an alternate look",
      "Craft-led portfolios",
      "Freelance designers",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Designer Portfolio Variant Template | Hanzo",
    seoDescription:
      "Fork Folio Designer 2, an alternate HTML/Gulp designer portfolio. Remix with AI and publish a craft-led showcase on Hanzo.",
  },
  {
    slug: "folio-creative-developer-1",
    name: "Folio — Developer Portfolio",
    tagline: "A Folio layout for developers to show projects and skills.",
    description:
      "Folio Creative Developer 1 is a developer-focused layout in the Folio system — structured to present projects, skills and a technical point of view with a clean, modern feel. It is a strong home for engineers who want a portfolio that reads as sharp as their code. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Developer Tools", "Resume"],
    keyHighlights: [
      { title: "Developer layout", body: "Sections for projects, skills and background tuned to a technical audience." },
      { title: "Clean & modern", body: "A crisp aesthetic that signals engineering rigor." },
      { title: "HTML/Gulp build", body: "A static workflow producing a fast, easy-to-host portfolio." },
      { title: "Responsive", body: "Reads well on every device, including the recruiter's phone." },
    ],
    about:
      "Folio Creative Developer 1 is a portfolio for engineers. Fork it to present your projects and skills in a clean, modern site that stands up to technical scrutiny.",
    perfectFor: [
      "Software engineers and developers",
      "Project and skills showcases",
      "Job-seeking technical portfolios",
      "A sharp, professional presence",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Developer Portfolio Template | Hanzo",
    seoDescription:
      "Fork Folio Developer, an HTML/Gulp developer portfolio for projects and skills. Remix with AI and publish your dev site on Hanzo.",
  },
  {
    slug: "folio-creative-developer-2",
    name: "Folio — Developer Portfolio (Variant)",
    tagline: "A second developer layout for a different technical showcase.",
    description:
      "Folio Creative Developer 2 is an alternate developer layout in the Folio system — the same projects-and-skills purpose arranged differently, so you can choose the presentation that fits. Part of one consistent, polished family. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Developer Tools", "Resume"],
    keyHighlights: [
      { title: "Alternate layout", body: "A different arrangement of the developer showcase for a distinct feel." },
      { title: "Clean & modern", body: "A crisp aesthetic that reads as technically sharp." },
      { title: "HTML/Gulp build", body: "A static workflow, fast to host and easy to edit." },
      { title: "Responsive", body: "Composed across devices out of the box." },
    ],
    about:
      "Folio Creative Developer 2 is the alternate developer face in the Folio family. Fork it when you want the technical portfolio with a different look.",
    perfectFor: [
      "Software engineers and developers",
      "Developers wanting an alternate look",
      "Project and skills showcases",
      "Job-seeking technical portfolios",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Developer Portfolio Variant Template | Hanzo",
    seoDescription:
      "Fork Folio Developer 2, an alternate HTML/Gulp developer portfolio. Remix with AI and publish your dev site on Hanzo.",
  },
  {
    slug: "folio-photography-1",
    name: "Folio — Photography Portfolio",
    tagline: "An image-first Folio layout built for photographers.",
    description:
      "Folio Photography 1 is a photography layout in the Folio system — an image-first, gallery-minded design that lets pictures carry the page. It is built for photographers who need their work shown large, sharp and uncluttered. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Image-first", body: "A gallery-led layout that gives photographs the space to dominate." },
      { title: "Clean framing", body: "Minimal chrome so nothing competes with the imagery." },
      { title: "HTML/Gulp build", body: "A static workflow producing a fast, easy-to-host gallery." },
      { title: "Responsive", body: "Photographs read well from desktop to phone." },
    ],
    about:
      "Folio Photography 1 is a portfolio built around images. Fork it to present a photography body of work large, sharp and free of distraction.",
    perfectFor: [
      "Photographers of any genre",
      "Image-led portfolios",
      "Gallery and series showcases",
      "Visual artists",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Photography Portfolio Template | Hanzo",
    seoDescription:
      "Fork Folio Photography, an image-first HTML/Gulp photography portfolio. Remix with AI and publish a gallery site on Hanzo.",
  },
  {
    slug: "folio-photography-2",
    name: "Folio — Photography Portfolio (Variant)",
    tagline: "A second photography layout for a different gallery feel.",
    description:
      "Folio Photography 2 is an alternate photography layout in the Folio system — the same image-first purpose with a distinct gallery arrangement, so your work is framed the way you want. Part of one polished, consistent family. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Alternate gallery", body: "A different image-led arrangement for a distinct presentation." },
      { title: "Clean framing", body: "Minimal chrome so the photographs stay the focus." },
      { title: "HTML/Gulp build", body: "A static workflow, fast to host and easy to edit." },
      { title: "Responsive", body: "Images hold up across every screen size." },
    ],
    about:
      "Folio Photography 2 is the alternate gallery face in the Folio family. Fork it when you want the image-first portfolio with a different frame.",
    perfectFor: [
      "Photographers of any genre",
      "Photographers wanting an alternate look",
      "Image-led portfolios",
      "Gallery and series showcases",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Photography Portfolio Variant Template | Hanzo",
    seoDescription:
      "Fork Folio Photography 2, an alternate image-first photography portfolio. Remix with AI and publish a gallery site on Hanzo.",
  },
  {
    slug: "folio-grid-2-columns",
    name: "Folio — Two-Column Grid Portfolio",
    tagline: "A calm two-column grid for showing work in pairs.",
    description:
      "Folio Grid 2 Columns is a two-column grid layout in the Folio system — a calm, balanced arrangement that presents projects two across for easy scanning. It suits portfolios with larger project thumbnails that deserve room. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Two-column grid", body: "A balanced pair-per-row layout that gives each project space." },
      { title: "Calm rhythm", body: "Generous sizing that suits larger, detailed thumbnails." },
      { title: "HTML/Gulp build", body: "A static workflow producing a fast, easy-to-host grid." },
      { title: "Responsive", body: "Collapses cleanly to a single column on mobile." },
    ],
    about:
      "Folio Grid 2 Columns is the roomy grid in the Folio family. Fork it when your work benefits from larger thumbnails and a calm two-across rhythm.",
    perfectFor: [
      "Portfolios with fewer, larger projects",
      "Designers and photographers",
      "A calm, balanced grid",
      "Detail-rich project thumbnails",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Two-Column Grid Portfolio Template | Hanzo",
    seoDescription:
      "Fork Folio Grid 2 Columns, an HTML/Gulp two-column portfolio grid. Remix with AI and publish a balanced work grid on Hanzo.",
  },
  {
    slug: "folio-grid-3-columns",
    name: "Folio — Three-Column Grid Portfolio",
    tagline: "A versatile three-column grid — the portfolio workhorse.",
    description:
      "Folio Grid 3 Columns is the versatile three-across grid in the Folio system — the balanced default that fits most portfolios, showing enough work per screen without crowding. It is the reliable choice for a healthy body of projects. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Three-column grid", body: "The go-to arrangement that balances density and breathing room." },
      { title: "Versatile", body: "Suits most portfolio sizes and disciplines." },
      { title: "HTML/Gulp build", body: "A static workflow producing a fast, easy-to-host grid." },
      { title: "Responsive", body: "Reflows gracefully to fewer columns on smaller screens." },
    ],
    about:
      "Folio Grid 3 Columns is the workhorse grid of the Folio family. Fork it as the dependable default for showing a solid body of work.",
    perfectFor: [
      "Most creative portfolios",
      "A healthy set of projects",
      "Designers and photographers",
      "A balanced, reliable grid",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Three-Column Grid Portfolio Template | Hanzo",
    seoDescription:
      "Fork Folio Grid 3 Columns, a versatile HTML/Gulp portfolio grid. Remix with AI and publish a balanced work grid on Hanzo.",
  },
  {
    slug: "folio-grid-3-fluid",
    name: "Folio — Fluid Three-Column Grid",
    tagline: "A full-width three-column grid that fills the screen.",
    description:
      "Folio Grid 3 Fluid is a full-width, three-column grid in the Folio system — the same three-across arrangement stretched edge to edge for a more immersive, contemporary feel. It suits work that benefits from filling the viewport. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Fluid full-width", body: "An edge-to-edge grid that fills the screen for a bolder presentation." },
      { title: "Three columns", body: "Balanced density with a more immersive, contemporary feel." },
      { title: "HTML/Gulp build", body: "A static workflow producing a fast, easy-to-host grid." },
      { title: "Responsive", body: "Reflows cleanly to fewer columns on smaller screens." },
    ],
    about:
      "Folio Grid 3 Fluid is the full-width take on the three-column grid. Fork it when you want the reliable layout with a more immersive, edge-to-edge feel.",
    perfectFor: [
      "Immersive, full-width portfolios",
      "Imagery-led work",
      "A modern, spacious grid",
      "Designers and photographers",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Fluid Three-Column Grid Template | Hanzo",
    seoDescription:
      "Fork Folio Grid 3 Fluid, a full-width HTML/Gulp portfolio grid. Remix with AI and publish an immersive work grid on Hanzo.",
  },
  {
    slug: "folio-grid-4-columns",
    name: "Folio — Four-Column Grid Portfolio",
    tagline: "A dense four-column grid for large bodies of work.",
    description:
      "Folio Grid 4 Columns is a dense four-across grid in the Folio system — built to show a lot of projects per screen for prolific creatives. It suits large catalogs where breadth is part of the story. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Four-column grid", body: "A dense arrangement that surfaces many projects at once." },
      { title: "Built for breadth", body: "Ideal when a large catalog and range are the point." },
      { title: "HTML/Gulp build", body: "A static workflow producing a fast, easy-to-host grid." },
      { title: "Responsive", body: "Steps down to fewer columns gracefully on small screens." },
    ],
    about:
      "Folio Grid 4 Columns is the high-density grid in the Folio family. Fork it when you have a large body of work and want to show its breadth at a glance.",
    perfectFor: [
      "Prolific creatives",
      "Large project catalogs",
      "Photographers with big galleries",
      "A dense, breadth-first grid",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Four-Column Grid Portfolio Template | Hanzo",
    seoDescription:
      "Fork Folio Grid 4 Columns, a dense HTML/Gulp portfolio grid. Remix with AI and publish a large work catalog on Hanzo.",
  },
  {
    slug: "folio-grid-4-fluid",
    name: "Folio — Fluid Four-Column Grid",
    tagline: "A full-width four-column grid for maximum, immersive density.",
    description:
      "Folio Grid 4 Fluid is a full-width, four-column grid in the Folio system — dense and edge to edge for a bold, catalog-filling presentation. It suits prolific creatives who want breadth and immersion at once. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Fluid four-column", body: "An edge-to-edge, high-density grid that fills the screen with work." },
      { title: "Immersive breadth", body: "Shows a large catalog boldly, using the whole viewport." },
      { title: "HTML/Gulp build", body: "A static workflow producing a fast, easy-to-host grid." },
      { title: "Responsive", body: "Reflows to fewer columns cleanly on smaller screens." },
    ],
    about:
      "Folio Grid 4 Fluid is the boldest grid in the Folio family — full-width and dense. Fork it to present a large body of work immersively and at scale.",
    perfectFor: [
      "Prolific creatives",
      "Immersive, full-width catalogs",
      "Photographers with big galleries",
      "Maximum-density showcases",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Fluid Four-Column Grid Template | Hanzo",
    seoDescription:
      "Fork Folio Grid 4 Fluid, a full-width dense HTML/Gulp portfolio grid. Remix with AI and publish a large immersive catalog on Hanzo.",
  },
  {
    slug: "folio-masonry-2-columns",
    name: "Folio — Two-Column Masonry Portfolio",
    tagline: "A two-column masonry layout for mixed-height work.",
    description:
      "Folio Masonry 2 Columns is a two-column masonry layout in the Folio system — a Pinterest-style flow that fits projects of different heights together naturally. It suits mixed-format work where a rigid grid would crop or waste space. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Two-column masonry", body: "A flowing layout that packs mixed-height items without awkward gaps." },
      { title: "Mixed formats", body: "Handles portrait, landscape and square work together gracefully." },
      { title: "HTML/Gulp build", body: "A static workflow producing a fast, easy-to-host layout." },
      { title: "Responsive", body: "Collapses cleanly toward a single column on mobile." },
    ],
    about:
      "Folio Masonry 2 Columns is the roomy masonry option in the Folio family. Fork it for mixed-format work that deserves a natural, gap-free flow.",
    perfectFor: [
      "Mixed-format portfolios",
      "Photographers and illustrators",
      "Work of varying aspect ratios",
      "A natural, flowing gallery",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Two-Column Masonry Portfolio Template | Hanzo",
    seoDescription:
      "Fork Folio Masonry 2 Columns, an HTML/Gulp masonry portfolio. Remix with AI and publish a flowing mixed-format gallery on Hanzo.",
  },
  {
    slug: "folio-masonry-3-columns",
    name: "Folio — Three-Column Masonry Portfolio",
    tagline: "A three-column masonry — the flexible mixed-media favorite.",
    description:
      "Folio Masonry 3 Columns is a three-column masonry layout in the Folio system — the flexible, popular choice that flows mixed-height projects across three tracks. It is the go-to when a body of work spans many formats. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Three-column masonry", body: "A flowing three-track layout that fits varied heights naturally." },
      { title: "Mixed media", body: "Ideal for portfolios spanning many aspect ratios and formats." },
      { title: "HTML/Gulp build", body: "A static workflow producing a fast, easy-to-host layout." },
      { title: "Responsive", body: "Reflows to fewer tracks gracefully on smaller screens." },
    ],
    about:
      "Folio Masonry 3 Columns is the versatile masonry favorite in the Folio family. Fork it for a mixed-media body of work that needs a natural flow.",
    perfectFor: [
      "Mixed-media portfolios",
      "Photographers and illustrators",
      "Varied aspect-ratio work",
      "A flexible, flowing gallery",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Three-Column Masonry Portfolio Template | Hanzo",
    seoDescription:
      "Fork Folio Masonry 3 Columns, an HTML/Gulp masonry portfolio. Remix with AI and publish a flowing mixed-media gallery on Hanzo.",
  },
  {
    slug: "folio-masonry-3-fluid",
    name: "Folio — Fluid Three-Column Masonry",
    tagline: "A full-width three-column masonry for immersive galleries.",
    description:
      "Folio Masonry 3 Fluid is a full-width, three-column masonry layout in the Folio system — the flowing mixed-height look stretched edge to edge for an immersive gallery. It suits image-rich work that benefits from filling the screen. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Fluid masonry", body: "An edge-to-edge, three-track flow that fills the viewport with work." },
      { title: "Mixed heights", body: "Fits varied formats together for a natural, immersive gallery." },
      { title: "HTML/Gulp build", body: "A static workflow producing a fast, easy-to-host layout." },
      { title: "Responsive", body: "Reflows to fewer tracks cleanly on smaller screens." },
    ],
    about:
      "Folio Masonry 3 Fluid is the immersive masonry option in the Folio family. Fork it when mixed-format work deserves a full-width, flowing stage.",
    perfectFor: [
      "Image-rich portfolios",
      "Immersive, full-width galleries",
      "Mixed-format work",
      "Photographers and illustrators",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Fluid Three-Column Masonry Template | Hanzo",
    seoDescription:
      "Fork Folio Masonry 3 Fluid, a full-width HTML/Gulp masonry portfolio. Remix with AI and publish an immersive gallery on Hanzo.",
  },
  {
    slug: "folio-masonry-4-columns",
    name: "Folio — Four-Column Masonry Portfolio",
    tagline: "A dense four-column masonry for large mixed-media catalogs.",
    description:
      "Folio Masonry 4 Columns is a dense, four-column masonry layout in the Folio system — flowing many mixed-height projects across four tracks for prolific creatives. It suits large, varied catalogs where breadth and format diversity are the story. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Four-column masonry", body: "A dense, flowing layout that surfaces many mixed-height items at once." },
      { title: "Large catalogs", body: "Built for prolific creatives with varied, extensive work." },
      { title: "HTML/Gulp build", body: "A static workflow producing a fast, easy-to-host layout." },
      { title: "Responsive", body: "Steps down to fewer tracks gracefully on small screens." },
    ],
    about:
      "Folio Masonry 4 Columns is the high-density masonry in the Folio family. Fork it for a large, mixed-media catalog that should show its breadth at a glance.",
    perfectFor: [
      "Prolific mixed-media creatives",
      "Large, varied catalogs",
      "Photographers and illustrators",
      "A dense, flowing gallery",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Four-Column Masonry Portfolio Template | Hanzo",
    seoDescription:
      "Fork Folio Masonry 4 Columns, a dense HTML/Gulp masonry portfolio. Remix with AI and publish a large mixed-media gallery on Hanzo.",
  },
  {
    slug: "folio-masonry-4-fluid",
    name: "Folio — Fluid Four-Column Masonry",
    tagline: "A full-width four-column masonry for maximum immersive breadth.",
    description:
      "Folio Masonry 4 Fluid is a full-width, four-column masonry layout in the Folio system — the densest, most immersive flow, edge to edge, for large mixed-media bodies of work. It suits prolific creatives who want breadth and immersion together. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Websites"],
    keyHighlights: [
      { title: "Fluid four-column", body: "An edge-to-edge, high-density masonry that fills the screen with work." },
      { title: "Immersive breadth", body: "Shows a large, varied catalog boldly across the whole viewport." },
      { title: "HTML/Gulp build", body: "A static workflow producing a fast, easy-to-host layout." },
      { title: "Responsive", body: "Reflows to fewer tracks cleanly on smaller screens." },
    ],
    about:
      "Folio Masonry 4 Fluid is the boldest masonry in the Folio family — full-width and dense. Fork it to present a large mixed-media catalog immersively and at scale.",
    perfectFor: [
      "Prolific mixed-media creatives",
      "Immersive, full-width galleries",
      "Large, varied catalogs",
      "Maximum-density showcases",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Fluid Four-Column Masonry Template | Hanzo",
    seoDescription:
      "Fork Folio Masonry 4 Fluid, a full-width dense HTML/Gulp masonry portfolio. Remix with AI and publish an immersive gallery on Hanzo.",
  },
  {
    slug: "folio-details-1",
    name: "Folio — Project Case Study",
    tagline: "A project detail page to tell the story behind the work.",
    description:
      "Folio Details 1 is a project detail and case-study page from the Folio system — a focused layout for walking through a single project's story, process and outcome. It is the page that turns a thumbnail into a narrative and shows how you think. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Editorial"],
    keyHighlights: [
      { title: "Case-study layout", body: "A structured space to present one project's story, process and result." },
      { title: "Narrative flow", body: "Sections that guide readers from problem to outcome, showing your thinking." },
      { title: "HTML/Gulp build", body: "A static workflow producing a fast, easy-to-host page." },
      { title: "Responsive", body: "Reads cleanly on every device." },
    ],
    about:
      "Folio Details 1 is the case-study page of the Folio system. Fork it to give each project a proper story — the detail that separates a portfolio from a gallery.",
    perfectFor: [
      "Project case studies",
      "Designers showing process",
      "Detailed project write-ups",
      "Turning work into narrative",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Project Case Study Template | Hanzo",
    seoDescription:
      "Fork Folio Details, an HTML/Gulp project case-study page. Remix with AI and publish a detailed project story on Hanzo.",
  },
  {
    slug: "folio-details-2",
    name: "Folio — Project Case Study (Variant)",
    tagline: "A second case-study layout for a different project story.",
    description:
      "Folio Details 2 is an alternate project detail page in the Folio system — the same case-study purpose arranged differently, so each write-up can suit its content. Part of one consistent, polished family. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Editorial"],
    keyHighlights: [
      { title: "Alternate case study", body: "A different arrangement of the project detail page for varied content." },
      { title: "Narrative flow", body: "Sections that carry a reader through process and outcome." },
      { title: "HTML/Gulp build", body: "A static workflow, fast to host and easy to edit." },
      { title: "Responsive", body: "Reads cleanly across devices." },
    ],
    about:
      "Folio Details 2 is the alternate case-study page in the Folio family. Fork it when a project's story fits a different layout than the base detail page.",
    perfectFor: [
      "Project case studies",
      "Varied write-up formats",
      "Designers showing process",
      "Detailed project stories",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Project Case Study Variant Template | Hanzo",
    seoDescription:
      "Fork Folio Details 2, an alternate HTML/Gulp case-study page. Remix with AI and publish a detailed project story on Hanzo.",
  },
  {
    slug: "folio-details-3",
    name: "Folio — Project Case Study (Alt)",
    tagline: "A third case-study layout for even more presentation range.",
    description:
      "Folio Details 3 is a third project detail layout in the Folio system — another case-study arrangement so a portfolio can vary how it tells each project's story. It rounds out the Folio detail options within one consistent design language. Built with an HTML/Gulp workflow for a fast static site.",
    category: "Portfolio",
    tags: ["Editorial"],
    keyHighlights: [
      { title: "Third case study", body: "A further arrangement of the project detail page for more range." },
      { title: "Narrative flow", body: "Sections that lead readers through process and result." },
      { title: "HTML/Gulp build", body: "A static workflow producing a fast, easy-to-host page." },
      { title: "Responsive", body: "Reads cleanly on every device." },
    ],
    about:
      "Folio Details 3 completes the case-study set in the Folio family. Fork it for a third way to present a project's story while keeping the site coherent.",
    perfectFor: [
      "Project case studies",
      "Varied write-up formats",
      "Designers showing process",
      "Detailed project stories",
    ],
    framework: "HTML/Gulp",
    seoTitle: "Folio — Project Case Study Alt Template | Hanzo",
    seoDescription:
      "Fork Folio Details 3, a third HTML/Gulp case-study layout. Remix with AI and publish a detailed project story on Hanzo.",
  },
  {
    slug: "jobfinder",
    name: "Job Finder Mobile App",
    tagline: "A React Native job-search app with listings and search built in.",
    description:
      "Job Finder is a React Native mobile app for job search — listings, search and the flows a hiring marketplace needs, on a real cross-platform native stack. It is a strong start for anyone building a jobs or gig app for iOS and Android from one codebase. Twenty-plus components keep the app screens consistent.",
    category: "Apps",
    tags: ["Services"],
    keyHighlights: [
      { title: "Job listings", body: "Screens for browsing roles that make the core of a jobs app work from the start." },
      { title: "Search", body: "A search flow so users can find relevant roles quickly." },
      { title: "React Native", body: "One codebase targeting both iOS and Android natively." },
      { title: "20+ components", body: "A mobile component set that keeps screens consistent as you build." },
    ],
    about:
      "Job Finder is a native mobile starting point for a jobs or gig marketplace. Fork it to launch a cross-platform app with listings and search already in place.",
    perfectFor: [
      "Job and gig marketplaces",
      "Cross-platform mobile apps",
      "Hiring and recruiting products",
      "React Native starters",
    ],
    framework: "React Native",
    seoTitle: "Job Finder — Mobile Job Search App Template | Hanzo",
    seoDescription:
      "Fork Job Finder, a React Native job-search app with listings and search for iOS and Android. Remix with AI and ship on Hanzo.",
  },
  {
    slug: "pixel",
    name: "Pixel Creative Studio",
    tagline: "A modern site for a creative studio and its work.",
    description:
      "Pixel is a creative studio website — a modern, expressive layout for presenting a studio, its projects and its personality. It suits small studios and multidisciplinary creatives who want a site with character. Built in plain HTML/CSS/JS for a fast, dependable presence.",
    category: "Portfolio",
    tags: ["Services", "Websites"],
    keyHighlights: [
      { title: "Studio layout", body: "Sections for work, services and story arranged to present a creative studio." },
      { title: "Modern & expressive", body: "A characterful aesthetic that stands out from generic portfolios." },
      { title: "Plain stack", body: "HTML/CSS/JS keeps the site fast and simple to host and update." },
      { title: "Responsive", body: "Reads cleanly across devices." },
    ],
    about:
      "Pixel is a portfolio-grade site for creative studios with personality. Fork it to present your studio and work in a modern layout that has some character.",
    perfectFor: [
      "Creative and design studios",
      "Multidisciplinary creatives",
      "Studios wanting personality",
      "A modern portfolio-grade site",
    ],
    framework: "HTML/CSS/JS",
    seoTitle: "Pixel — Creative Studio Template | Hanzo",
    seoDescription:
      "Fork Pixel, a modern HTML/CSS creative studio site. Remix with AI and publish a studio-and-work portfolio on Hanzo.",
  },
  {
    slug: "saas-landing",
    name: "SaaS Landing — Pricing & Features",
    tagline: "A complete SaaS marketing page with pricing and feature sections.",
    description:
      "SaaS Landing is a complete product marketing page — a hero, feature sections and a pricing table arranged for conversion, so a SaaS has everything it needs to sell in one template. It is the well-rounded default when you want more than a bare landing page. Built in Next.js 14 and fully responsive.",
    category: "SaaS",
    tags: ["Landing Page"],
    keyHighlights: [
      { title: "Pricing table", body: "A conversion-ready pricing section to present plans and drive upgrades." },
      { title: "Feature sections", body: "Structured blocks to explain what the product does and why it matters." },
      { title: "Next.js 14", body: "A modern framework base that stays fast and easy to extend." },
      { title: "Responsive", body: "Composed across every screen size." },
    ],
    about:
      "SaaS Landing is the well-rounded product marketing page: hero, features and pricing in one place. Fork it when you want a complete SaaS site rather than just a landing hero.",
    perfectFor: [
      "SaaS product marketing",
      "Pages that need pricing built in",
      "Feature-led launches",
      "A complete product site",
    ],
    framework: "Next.js 14.2",
    seoTitle: "SaaS Landing — Pricing & Features Template | Hanzo",
    seoDescription:
      "Fork SaaS Landing, a complete Next.js 14 product page with pricing and feature sections. Remix with AI and launch on Hanzo.",
  },
  {
    slug: "serif",
    name: "Serif Portfolio & Agency",
    tagline: "A typographic portfolio and agency template with a Sass build.",
    description:
      "Serif is a portfolio and agency template with a refined, typography-led aesthetic and a clean Sass build system. It suits creatives and small agencies who want an editorial feel and a maintainable styling workflow. Built in HTML with Sass for organized, scalable styles.",
    category: "Portfolio",
    tags: ["Editorial", "Services"],
    keyHighlights: [
      { title: "Typographic feel", body: "A refined, editorial aesthetic that leads with type and whitespace." },
      { title: "Portfolio & agency", body: "Layouts for presenting work and services in one cohesive site." },
      { title: "Sass build", body: "Organized, scalable styles via a Sass workflow that is easy to maintain." },
      { title: "Responsive", body: "Reads cleanly across every device." },
    ],
    about:
      "Serif is a typography-led portfolio and agency template for creatives who care about editorial polish. Fork it for a refined site with a clean, maintainable Sass styling workflow.",
    perfectFor: [
      "Creatives and small agencies",
      "Editorial, type-led sites",
      "Portfolio-and-services pages",
      "Teams who like a Sass workflow",
    ],
    framework: "HTML/Sass",
    seoTitle: "Serif — Portfolio & Agency Template | Hanzo",
    seoDescription:
      "Fork Serif, a typographic HTML/Sass portfolio and agency template. Remix with AI and publish a refined editorial site on Hanzo.",
  },

  // -------------------------------------------------------------------------
  // Real Hanzo-stack starters (kind:"repo") — buildable hanzo-apps repos the
  // builder CLONES-AND-RUNS via /dev?repo=<clone-url>. Featured default
  // starters; they fill the Blog / Editorial / Music / Product Management /
  // Events categories. React 19 + @hanzo/gui + Hanzo IAM (PKCE) + Hanzo Base.
  // -------------------------------------------------------------------------
  {
    slug: "changelog-ship",
    name: "Shipwright — Product Changelog & Blog",
    tagline: "Ship it, then tell everyone.",
    description:
      "Shipwright is a public product changelog paired with a longer-form blog, built on the Hanzo stack. Team members post dated release entries tagged feature, fix, or breaking alongside narrative posts; visitors browse a reverse-chronological timeline and filter by type or tag. Its monospace terminal aesthetic — a connector-line timeline, JetBrains-style version chips, and a single lime highlight for the newest release — is dense and engineer-facing.",
    category: "Blog",
    tags: ["Developer Tools"],
    keyHighlights: [
      { title: "Reverse-chron changelog timeline", body: "Dated entries render newest-first down a connector line in the left gutter, with the latest published release highlighted in lime." },
      { title: "Typed release entries", body: "Every entry is tagged feature, fix, breaking, or post — shown as color-coded pills and usable as a one-click filter." },
      { title: "Changelog + blog in one feed", body: "Short release notes and longer-form posts share the same timeline; the detail view renders the full body plus related entries that share a tag or type." },
      { title: "Compose, publish or draft", body: "A signed-in editor sets title, version, type, comma-separated tags, and body, then publishes with a datestamp or saves as a draft." },
      { title: "Org-scoped Hanzo Base data", body: "entries, tags, and entry_tags are real Base collections provisioned from schema.sql, scoped per-org via the @request.auth.org_id = org rule." },
      { title: "PKCE auth, zero passwords", body: "Sign-in is OAuth2 PKCE against hanzo.id via @hanzo/iam; the IAM token is carried to Base on every read and write." },
    ],
    about:
      "Shipwright is a real, buildable Hanzo app forked from hanzo-starter. Its UI is 100% @hanzo/gui primitives (no Tailwind, no second kit) in a muted-graphite terminal aesthetic with a monospace type system and a single lime accent reserved for the newest release. The provider stack, Vite config, PKCE auth, and Hanzo Cloud deploy contract are inherited unchanged from the starter; the changelog feed, post detail, and compose views plus the entries/tags/entry_tags schema are the app. Sign-in is OAuth2 PKCE against hanzo.id, and every entry is stored per-org in Hanzo Base.",
    perfectFor: [
      "Product & engineering teams publishing a public changelog",
      "Open-source projects announcing releases by type and version",
      "Developer tools that want release notes and a blog in one feed",
      "Startups keeping customers current without a heavy CMS",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/changelog-ship.git",
    seoTitle: "Shipwright — Product Changelog & Blog Template | Hanzo",
    seoDescription:
      "Fork Shipwright, a React + Hanzo changelog and blog with typed release entries, a timeline feed and PKCE sign-in on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "longform-essays",
    name: "Longform — A Home for Your Writing",
    tagline: "Words first. Everything else second.",
    description:
      "Longform is a minimalist personal essay blog built on the Hanzo stack: write long reads in a markdown editor and publish them to a distraction-free reading column set in a book serif, with a drop-cap opening and an honest reading-time estimate. The table of contents indexes every essay by year, keeping drafts private until you choose to publish. Auth is PKCE via Hanzo IAM and each essay is an org-scoped row in Hanzo Base, provisioned from schema.sql on deploy.",
    category: "Blog",
    tags: ["Editorial"],
    keyHighlights: [
      { title: "Distraction-free reading column", body: "Each essay opens in a single narrow measure (~66ch) set in a book serif with generous leading and a drop-cap on the opening paragraph — the body renders from markdown blocks (paragraphs, section headings, pull quotes) with nothing else on the page." },
      { title: "Index by year", body: "The table of contents groups published essays under year markers, newest first, while drafts gather at the top while you write them. Every row shows the title, an optional subtitle, and a footnote-gray date and reading time." },
      { title: "Markdown editor with a live reading estimate", body: "Write a title, subtitle, and a markdown body (## for section headings, > for pull quotes); word count and reading minutes update as you type and the estimate is stamped onto the essay when you save." },
      { title: "Draft-to-Published toggle", body: "A two-state control keeps an essay private until it's ready — publishing stamps the date and moves it into the public year index; toggling back to draft removes it from the reader's view." },
      { title: "Org-scoped data in Hanzo Base", body: "Essays are real Base rows; schema.sql provisions the essays / collections / essay_collections tables on deploy and scopes every row to your org (@request.auth.org_id = org), private to your org until published." },
      { title: "PKCE sign-in with Hanzo IAM", body: "No local passwords — login() runs an OAuth2 PKCE S256 redirect to hanzo.id and the returned JWT authorizes every read and write against Base." },
    ],
    about:
      "Longform is a real, buildable Hanzo app — a personal essay blog for writers who want the page to get out of the way. It ships three views (a year-grouped index, a distraction-free reading column, and a markdown editor with a publish toggle) composed entirely from @hanzo/gui primitives in a warm-paper editorial style: cream sheet, Georgia-style serif, footnote-gray metadata, hairline rules, and a true book-page drop-cap — no cards, no grids, no feed. Identity is Hanzo IAM (OAuth2 PKCE against hanzo.id) and data is Hanzo Base, so essays are org-scoped rows the deploy provisions from schema.sql and every read/write carries your IAM token. Fork it on hanzo.app and it deploys as a static SPA on Hanzo Cloud.",
    perfectFor: [
      "Writers who want a quiet, single-column home for long essays",
      "Personal blogs and newsletters that value reading over engagement metrics",
      "A clean starting point for any Hanzo IAM + Base content app",
      "Readers who prefer a book-like page to cards and feeds",
      "Teams wanting an org-scoped, publish-gated writing surface",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/longform-essays.git",
    seoTitle: "Longform — Personal Essay Blog Template | Hanzo",
    seoDescription:
      "Fork Longform, a distraction-free React + Hanzo essay blog with a book-serif reading column, markdown editor and org-scoped Base storage. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "engineering-devlog",
    name: "Devlog — Team Engineering Blog",
    tagline: "How we build, in the open.",
    description:
      "Devlog is a multi-author engineering blog for teams who ship in the open. Members publish technical posts with author attribution, topic tags, and monospace code blocks; readers browse a GitHub-dark card grid, filter by topic, and open per-author pages. Built on the Hanzo stack — React 19 + @hanzo/gui, PKCE sign-in via hanzo.id, and org-scoped Hanzo Base collections provisioned from schema.sql.",
    category: "Blog",
    tags: ["Developer Tools"],
    keyHighlights: [
      { title: "Multi-author posts", body: "Every post carries author attribution and a compact monospace avatar; open an author page to read everything one teammate has shipped." },
      { title: "Topic tags & filtering", body: "A topics catalog colors each electric-cyan tag; the grid filters by topic, and a post can carry several tags through a real many-to-many join (post_topics)." },
      { title: "Code-first formatting", body: "Post bodies render prose as paragraphs and fenced spans as labelled, near-black monospace code blocks — written for people who read diffs." },
      { title: "Featured posts stand out", body: "Flagged posts sort to the top of the grid and wear a syntax-highlight accent bar, keeping the important write-ups visible." },
      { title: "Org-scoped by default", body: "posts, topics, and post_topics live in Hanzo Base, provisioned from schema.sql and readable only within your org via the signed-in IAM token (@request.auth.org_id = org)." },
      { title: "100% @hanzo/gui", body: "The entire GitHub-dark UI — card grid, tags, code blocks, compose panel, author pages — is built from @hanzo/gui primitives with Tamagui longhand props; no Tailwind, no second kit." },
    ],
    about:
      "Devlog is a team engineering blog — a place to publish architecture decisions, war stories, and the code behind them. It ships as a real, buildable app on the canonical Hanzo stack: Vite + React 19 with @hanzo/gui for a 100%-primitive UI, @hanzo/iam for OAuth2 PKCE sign-in against hanzo.id, and @hanzo/base for org-scoped data. Signed in, the app reads and writes three Base collections (posts, topics, post_topics) provisioned from schema.sql; the public landing is a dark-mode hero that hands every credential interaction to Hanzo IAM. Forked from hanzo-apps/hanzo-starter, so the provider stack, vite.config, auth, and deploy contract stay identical to the proven reference.",
    perfectFor: [
      "Engineering teams publishing a public or internal devlog",
      "Documenting architecture decisions and postmortems",
      "Developer relations and technical content",
      "Open-source projects sharing build notes",
      "Startups building in public",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/engineering-devlog.git",
    seoTitle: "Devlog — Team Engineering Blog Template | Hanzo",
    seoDescription:
      "Fork Devlog, a multi-author React + Hanzo engineering blog with topic tags, code blocks and author pages on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "issue-press",
    name: "Press — Digital Magazine Issues",
    tagline: "A magazine that ships in issues.",
    description:
      "Press is an issue-based digital magazine template on the Hanzo stack — React 19, @hanzo/gui, IAM sign-in, and Base. Editors curate numbered issues with a cover story and department sections; readers open an issue and move between its pieces. Bold, print-derived design: a masthead bar, oversized display type, and a two-column feature layout with hanging pull-quotes.",
    category: "Editorial",
    tags: ["Blog"],
    keyHighlights: [
      { title: "Curated in numbered issues", body: "Editors compose numbered issues with a title and cover line, then place them on the newsstand as live or draft — real create/update/delete against Base." },
      { title: "Cover story + departments", body: "Each issue leads with a cover story and files the rest into department sections: Features, Dispatch, Interview, Essay, Review, The Back Page." },
      { title: "Editorial feature read", body: "The article view sets copy in two columns with an oversized headline, an italic standfirst, and a hanging pull-quote pulled deterministically from the piece." },
      { title: "Magazine design language", body: "A print-derived black / white / one-hot-red palette, a masthead bar and condensed display type — 100% @hanzo/gui primitives with Tamagui longhand props, no Tailwind or second kit." },
      { title: "Org-scoped data in Base", body: "issues and articles are Hanzo Base collections provisioned from schema.sql; every row is stamped owner+org and scoped to your org via @request.auth.org_id = org." },
      { title: "Ambient IAM sign-in", body: "OAuth2 PKCE against hanzo.id via @hanzo/iam — no local passwords — with the IAM token carried to Base. Client id reads VITE_IAM_CLIENT_ID (fallback hanzo-app)." },
    ],
    about:
      "Press turns the canonical Hanzo starter into a working editorial tool without changing its proven spine. The signed-out landing is a real magazine cover; sign in and you arrive at the newsstand, where every issue appears as a bold black-and-red cover, newest first. Open one to read its cover story and department sections, then open any piece for a two-column feature layout with a pulled quote. Editors compose issues and file pieces inline, so it is genuine org-scoped CRUD against Base collections rather than a static mock. The whole app is built from @hanzo/gui primitives, ships as a static SPA, and deploys to <slug>.hanzo.app via Hanzo Cloud from schema.sql.",
    perfectFor: [
      "Digital magazines and periodicals that publish in discrete, numbered issues",
      "Editorial teams curating a cover story plus department sections",
      "Zines and newsletters that want a print-inspired reading experience",
      "Content studios needing org-scoped, IAM-native publishing on Hanzo",
      "Founders who want a bold, non-generic Hanzo app to fork and extend",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/issue-press.git",
    seoTitle: "Press — Digital Magazine Template | Hanzo",
    seoDescription:
      "Fork Press, an issue-based React + Hanzo magazine with a cover story, department sections and a print-inspired reader on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "dispatch-newsletter",
    name: "Dispatch — Newsletter Archive & Signup",
    tagline: "Every issue, kept forever.",
    description:
      "Dispatch is a newsletter archive and signup built entirely on the Hanzo stack. Visitors land on a public newsprint masthead and join the list, while the author drafts, publishes, and reads subscribers from a signed-in Studio. Editorial minimalism in @hanzo/gui, PKCE auth via hanzo.id, and org-scoped issues + subscribers persisted in Hanzo Base.",
    category: "Editorial",
    tags: ["Blog"],
    keyHighlights: [
      { title: "Public masthead, honest by design", body: "A newsprint landing — wordmark, thin rule, tagline, and a boxed subscribe field — that every visitor sees before auth. Subscribing stashes the email, starts a Hanzo sign-in, and records the subscriber row on return." },
      { title: "Chronological archive to single-column read", body: "Every published issue, newest first, opens into a quiet single-column reader with a dateline, standfirst, and the body split into paragraphs — no refetch, the archive hands the record straight in." },
      { title: "Studio composer + subscriber list", body: "Draft or publish an issue (subject, preview, body, publish toggle) and read the full mailing list from one signed-in desk; drafts stay out of the reader archive until published." },
      { title: "Org-scoped data in Hanzo Base", body: "issues and subscribers are real Base collections provisioned from schema.sql; every row is stamped with the caller's verified IAM owner and org and isolated per organization (rule effectively @request.auth.org_id = org)." },
      { title: "PKCE auth via hanzo.id", body: "OAuth2 PKCE S256 against Hanzo IAM — no local passwords and no server token; the static SPA authenticates in the browser and carries the IAM JWT straight to Base." },
      { title: "One design system, one palette", body: "100% @hanzo/gui primitives with the newsprint palette in a single theme.ts, mounted through the canonical GuiProvider to IamProvider to BaseProvider stack the whole Hanzo line ships." },
    ],
    about:
      "Dispatch is a complete, buildable Hanzo starter for running a newsletter: a public archive with a subscribe capture and a signed-in Studio where the author writes, publishes, and watches the list. It forks the canonical hanzo-starter — keeping the proven provider stack (GuiProvider to IamProvider to BaseProvider), vite.config, PKCE auth, and static-SPA deploy contract intact — and varies it into a restrained, newsprint-minimal design: off-white paper, a single hairline ink rule under the wordmark, one narrow reading column, and a boxed subscribe field with a solid black button. UI is 100% @hanzo/gui primitives (Tamagui longhand props, no Tailwind, no second kit); identity is OAuth2 PKCE against hanzo.id; data is org-scoped Hanzo Base collections provisioned from schema.sql. Because Base is IAM-native, reading the archive and joining the list both run on a Hanzo identity, so the public masthead is the honest pre-auth surface.",
    perfectFor: [
      "Writers and creators publishing a newsletter with a permanent, browsable public archive",
      "Teams that want subscriber capture tied to real Hanzo identities instead of anonymous emails",
      "Editorial and publication sites that want a restrained, typographic newsprint aesthetic",
      "Developers learning the Hanzo @hanzo/gui + IAM + Base stack from a real, deployable app",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/dispatch-newsletter.git",
    seoTitle: "Dispatch — Newsletter Archive Template | Hanzo",
    seoDescription:
      "Fork Dispatch, a React + Hanzo newsletter archive with subscriber capture and a signed-in composer on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "photo-essay",
    name: "Frame Story — Visual Photo Essays",
    tagline: "Scroll it like a story.",
    description:
      "Frame Story is a long-scroll photo essay builder: sequence full-bleed images and quiet text passages into a cinematic vertical scroll, then publish. Readers fall through published essays as immersive, edge-to-edge visual narratives with thin white type and near-zero chrome. Built on React 19 with @hanzo/gui, PKCE sign-in via @hanzo/iam, and org-scoped @hanzo/base collections.",
    category: "Editorial",
    tags: ["Portfolio"],
    keyHighlights: [
      { title: "Cinematic full-bleed reader", body: "Published essays play as a slow vertical scroll of edge-to-edge images and centered text passages, with darkened frames, thin white type, and captions in small tracked capitals — near-zero chrome." },
      { title: "Beat-sequencing builder", body: "Compose an essay by adding image and text beats, reordering them up or down, editing cover and byline against a live preview, and flipping publish to push it onto the public index." },
      { title: "Org-scoped data on Hanzo Base", body: "stories and blocks are Hanzo Base collections; every read and write carries the signed-in user's IAM token, so essays are visible only within your org (rule @request.auth.org_id = org)." },
      { title: "PKCE sign-in, no passwords", body: "Auth is OAuth2 PKCE (S256) against hanzo.id via @hanzo/iam; the app never handles a credential and keeps tokens in localStorage for a durable, refresh-aware session." },
      { title: "100% @hanzo/gui, renders offline", body: "The UI is built only from @hanzo/gui primitives using Tamagui longhand props, and the cinematic cover frames are self-contained SVG — nothing depends on the network to render." },
      { title: "One-click sample essay", body: "Seed a complete, publishable piece from the bundled frames to see the reader immediately, then edit or replace its beats with your own photos." },
    ],
    about:
      "Frame Story turns a set of photographs into a cinematic vertical story. Editors compose an essay as an ordered sequence of beats — full-bleed image blocks interleaved with short text passages — set a cover and byline, then publish. Published essays land on a poster-tile index; opening one drops the reader into a slow, immersive scroll where each image fills the frame under a soft dark wash and captions sit in small tracked capitals. The whole experience is composed entirely from @hanzo/gui primitives (no Tailwind, no second kit), authenticated with OAuth2 PKCE against hanzo.id, and backed by two org-scoped Hanzo Base collections (stories and blocks) so a team's essays stay private to their org. It ships as a real, buildable static SPA on the canonical Hanzo stack — fork it, run npm run build, and deploy on Hanzo Cloud.",
    perfectFor: [
      "Photographers publishing a series or portfolio story",
      "Editorial, documentary, and reportage storytelling",
      "Brand lookbooks and visual case studies",
      "Travel and photojournalism narratives",
      "Turning any photo set into a scrollable, cinematic story",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/photo-essay.git",
    seoTitle: "Frame Story — Visual Photo Essay Template | Hanzo",
    seoDescription:
      "Fork Frame Story, a React + Hanzo long-scroll photo essay builder with full-bleed image beats and org-scoped Base storage. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "artist-epk",
    name: "Pressroom — Artist EPK & Releases",
    tagline: "Your press kit, one link.",
    description:
      "Pressroom is an electronic press kit and release hub for musicians, built on the Hanzo stack. Fans and press get a dark, neon landing with the artist's latest release, biography, streaming presence and tour dates; signed in, the artist manages releases, shows and downloadable press assets. React 19 + @hanzo/gui, PKCE identity via hanzo.id, and org-scoped data in Hanzo Base — deployed as a static SPA to hanzo.app.",
    category: "Music",
    tags: ["Portfolio"],
    keyHighlights: [
      { title: "One link for press", body: "A single dark, neon pressroom collects the hero, latest release, biography, streaming presence and tour dates — the one link an artist sends to press and fans." },
      { title: "Discography as a rhythmic grid", body: "Releases render as a wrapping grid of cover art, each single, EP or album carrying its own streaming link." },
      { title: "Tour dates that self-prune", body: "The Tour view lists only upcoming shows with a date ticker and ticket link; past dates fall off automatically." },
      { title: "Artist-managed catalogue", body: "Signed in, the artist adds or removes releases, shows and downloadable press assets from the Admin tab — no redeploy." },
      { title: "PKCE auth, no passwords", body: "Sign-in is OAuth2 PKCE against hanzo.id via @hanzo/iam; the app never handles a credential and carries the IAM token to data." },
      { title: "Org-scoped Hanzo Base", body: "releases, shows and press_assets are provisioned from schema.sql into Hanzo Base, each row stamped owner+org and scoped by the rule @request.auth.org_id = org." },
    ],
    about:
      "Pressroom is a real, buildable Hanzo app — a musician's electronic press kit and release hub. The public landing is a spotlight-contrast, violet-to-magenta stage with the artist name oversized and cover art as the hero element; behind Hanzo sign-in, the artist runs the catalogue. It is 100% @hanzo/gui primitives (no Tailwind, no second kit) on Vite + React 19, with OAuth2 PKCE identity via hanzo.id and org-scoped storage in Hanzo Base provisioned from schema.sql.",
    perfectFor: [
      "Independent musicians and bands",
      "Electronic / DJ artists and labels",
      "Booking and press outreach",
      "Release and tour announcements",
      "Artist managers maintaining an EPK",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/artist-epk.git",
    seoTitle: "Pressroom — Artist EPK Template | Hanzo",
    seoDescription:
      "Fork Pressroom, a React + Hanzo electronic press kit with releases, tour dates and press assets on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "release-smartlink",
    name: "Dropmark — Release Smart Link",
    tagline: "One page, every platform.",
    description:
      "Dropmark is a single-release smart link for musicians: one clean, mobile-first page with a bold cover and a button to every streaming service. Artists sign in with Hanzo to edit the release and its platform links and watch real per-link click counts. Built on React 19 and @hanzo/gui with PKCE identity and an org-scoped Hanzo Base backend, it deploys as a static page at your-slug.hanzo.app.",
    category: "Music",
    tags: ["Landing Page"],
    keyHighlights: [
      { title: "Vinyl-centric hero", body: "A large centered square cover over a color-bled backdrop — real artwork when you add a cover URL, or a generated vinyl gradient with concentric grooves derived from the title so the page always looks designed." },
      { title: "Every platform, one tap", body: "Full-width streaming buttons with per-service brand chips — Spotify, Apple Music, YouTube Music, Amazon Music, SoundCloud, Tidal and more — stacked in a single mobile-first fold; any other service you paste gets a neutral chip." },
      { title: "Artist admin", body: "Sign in to edit the release (title, artist, cover, date) and add, edit, or remove platform links, with a live preview of the fan page rendered right beside the editor." },
      { title: "Real click counts", body: "Each button tap increments that link's counter in Hanzo Base, so the admin shows genuine per-platform clicks — no fabricated numbers anywhere in the app." },
      { title: "Hanzo-native auth and data", body: "OAuth2 PKCE sign-in via @hanzo/iam against hanzo.id; the release and links live in org-scoped @hanzo/base collections (rule @request.auth.org_id = org) provisioned from schema.sql on deploy." },
      { title: "A real static SPA", body: "Vite + React 19 + @hanzo/gui with 100% longhand Tamagui props; tsc and vite build run green in CI and the app ships to your-slug.hanzo.app with no server process." },
    ],
    about:
      "Dropmark turns a new single or album into a shareable landing page — the pre-save/stream link fans expect, but cleaner. The public page is a designed, mobile-first fold: a vinyl-centric cover over a color-bled backdrop, the title and release date, and a full-width button to each streaming service. Behind sign-in, the artist manages the release and its links and sees how many fans tapped through to each platform. It is a complete, buildable Hanzo app — @hanzo/gui for the UI, Hanzo IAM for identity (PKCE against hanzo.id), and Hanzo Base for org-scoped data provisioned from schema.sql.",
    perfectFor: [
      "Musicians launching a new single or album",
      "Labels and managers collecting every streaming link in one place",
      "Pre-save / smart-link pages shared from a bio link",
      "Seeing which platforms fans actually click through to",
      "Any artist who wants a clean release page without a website",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/release-smartlink.git",
    seoTitle: "Dropmark — Release Smart Link Template | Hanzo",
    seoDescription:
      "Fork Dropmark, a mobile-first React + Hanzo release smart link with every streaming button and real per-link clicks on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "band-setlist",
    name: "Setlist — Show & Setlist Tracker",
    tagline: "Every gig. Every song.",
    description:
      "Setlist is a band's public gig log with per-show setlists, built on the Hanzo stack. Fans browse upcoming and past shows and open any gig to read the exact set played — encore and all — while band members sign in to log shows and build ordered sets. React 19 + @hanzo/gui for the UI, Hanzo IAM (PKCE) for auth, and org-scoped Hanzo Base for data provisioned straight from schema.sql.",
    category: "Music",
    tags: ["Events"],
    keyHighlights: [
      { title: "Public gig board", body: "Every show is a torn-ticket-stub card, split into Upcoming and Played and sorted by date. Tap a card to open that show's set." },
      { title: "Ordered stage sheet", body: "A show's setlist is numbered like a real stage sheet, with the encore torn off below a perforated ticket divider and a running total runtime summed from each song." },
      { title: "Build a set by tap", body: "Log a show, keep a song book, then tap songs to add them to the set — move rows up or down to order them and flag the encore. No fake drag surface; the interaction is exactly what it says." },
      { title: "Gig-poster brutalism", body: "High-contrast black-on-acid, oversized all-caps venue names, chunky monospaced dates, and faux ticket barcodes — 100% @hanzo/gui primitives, no Tailwind and no second kit." },
      { title: "Hanzo IAM sign-in", body: "OAuth2 PKCE against hanzo.id with no local passwords; the signed-in band's IAM token flows straight into Base as the bearer." },
      { title: "Org-scoped Base data", body: "shows, songs, and setlist collections are provisioned from schema.sql and scoped to your org, so each band reads and writes only its own log." },
    ],
    about:
      "Setlist turns a band's show history into a living, public artifact. Every gig is logged with its venue, city, and date; every set is captured song by song, encore included, so fans can relive exactly what was played and where. Behind sign-in, band members log new shows, maintain a song book, and assemble ordered setlists that read like a stage sheet. It is a small but complete real app on the Hanzo stack — React 19 and @hanzo/gui for the interface, Hanzo IAM for identity, and Hanzo Base for org-scoped data provisioned directly from schema.sql. Forked from the canonical hanzo-starter, it keeps the exact provider stack, vite.config, PKCE auth, and deploy contract, and varies only the domain, data model, and design.",
    perfectFor: [
      "Touring and gigging bands keeping a public show history",
      "Fans who want the exact setlist from a show they attended or missed",
      "Band members logging gigs and building the set before a show",
      "Venues or promoters archiving what played on their stage",
      "Anyone wanting a stylish, deployable Hanzo-stack starter for an events or log app",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/band-setlist.git",
    seoTitle: "Setlist — Show & Setlist Tracker Template | Hanzo",
    seoDescription:
      "Fork Setlist, a React + Hanzo band gig log with per-show setlists and a stage-sheet reader on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "feature-upvote",
    name: "Upvote — Feature Request Board",
    tagline: "Let users vote on what's next.",
    description:
      "Upvote is a feature-request voting board where your users submit ideas and upvote the ones they want most. Requests flow through Open, Planned, and Shipped columns sorted by demand, each with threaded comments and one-vote-per-person tallying. Built on React 19 and the Hanzo GUI, with Hanzo IAM sign-in and org-scoped Hanzo Base storage.",
    category: "Product Management",
    tags: ["SaaS"],
    keyHighlights: [
      { title: "Vote-sorted board", body: "Three status columns — Open, Planned, Shipped — with muted color-dot headers. Within each column, requests sort by upvotes so the most-wanted rise to the top." },
      { title: "One-tap upvote pill", body: "A caret-and-count pill on every card toggles your vote. A per-person votes record enforces one vote each and keeps the denormalized counter in lockstep." },
      { title: "Roadmap in one move", body: "Open a request to read its description, move it between Open/Planned/Shipped with the status control, and discuss it in threaded comments." },
      { title: "Submit in seconds", body: "A focused form files a new request with a title and details, stamped to the signed-in author and instantly visible to the team." },
      { title: "Org-scoped by IAM", body: "Every request, vote, and comment is stamped with the verified IAM owner and org and shared only within it — schema.sql provisions the Base collections on deploy (rule @request.auth.org_id = org)." },
      { title: "Real Hanzo stack", body: "100% @hanzo/gui primitives (no Tailwind, no second kit) with a calm indigo accent. PKCE sign-in via hanzo.id. Compiles green (tsc) and builds with Vite as a static SPA." },
    ],
    about:
      "A feature-request voting board built on the canonical Hanzo stack. Upvote gives product teams a shared place to collect ideas, let people rank them by demand, and move each request from open to planned to shipped — all backed by org-scoped Hanzo Base collections and Hanzo IAM sign-in. It ships as a real, buildable static SPA (Vite + React 19 + @hanzo/gui + @hanzo/iam + @hanzo/base), not a mockup.",
    perfectFor: [
      "SaaS teams collecting and prioritizing customer feature requests",
      "Product managers building a public or internal roadmap",
      "Communities voting on what to build next",
      "Internal tools teams triaging requests across a company",
      "Founders validating demand before they build",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/feature-upvote.git",
    seoTitle: "Upvote — Feature Request Board Template | Hanzo",
    seoDescription:
      "Fork Upvote, a React + Hanzo feature-request board with vote-sorted columns, comments and org-scoped Base storage. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "product-trailmap",
    name: "Trailmap — Public Product Roadmap",
    tagline: "Show where you're headed.",
    description:
      "Trailmap is a public product roadmap organised as Now, Next, and Later — the team places initiatives into horizon lanes with a theme and a status, and anyone can follow what's in progress and what's coming. Built on the Hanzo stack (Vite + React 19, @hanzo/gui, Hanzo IAM PKCE, and Hanzo Base), every initiative is an org-scoped row provisioned from schema.sql. Fork it on hanzo.app and ship your own roadmap.",
    category: "Product Management",
    tags: ["SaaS"],
    keyHighlights: [
      { title: "Now / Next / Later lanes", body: "Three pastel horizon lanes (mint, sky, lilac) hold initiative cards, so visitors read at a glance what's shipping this cycle and what's on the horizon." },
      { title: "Themed, status-aware cards", body: "Each card carries a theme colour-bar and a progress dot that climbs the Planned to Building to Shipped ladder, drawn from the themes collection." },
      { title: "Create and move initiatives", body: "One editor both creates an initiative and moves it between horizons — pick a horizon, a status, and a theme, and the board refetches from Base." },
      { title: "Public by design", body: "The signed-out landing shows a sample roadmap so anyone can follow along; the live board loads once you sign in with Hanzo." },
      { title: "Org-scoped Hanzo Base data", body: "initiatives and themes are provisioned from schema.sql; Base stamps owner and org on every row and enforces org isolation (@request.auth.org_id = org)." },
      { title: "Real Hanzo stack, green in CI", body: "Vite + React 19, @hanzo/gui only, Hanzo IAM PKCE, Hanzo Base — typechecks (tsc) and builds (vite) clean, verified by the repo's CI workflow." },
    ],
    about:
      "A public product roadmap you can host on Hanzo. Initiatives live in three horizon lanes — Now, Next, Later — each tagged with a colour theme and a status that climbs from Planned to Building to Shipped. The signed-out landing is a public preview so anyone can follow along; sign in with Hanzo IAM (PKCE against hanzo.id) and the real board loads from org-scoped Hanzo Base collections. The UI is 100% @hanzo/gui primitives in an airy pastel swimlane design — no Tailwind, no second kit.",
    perfectFor: [
      "Startups sharing a public roadmap with customers",
      "Product teams communicating Now / Next / Later priorities",
      "Open-source projects publishing what's coming next",
      "Internal teams aligning on horizons and themes",
      "Founders turning a roadmap into a public promise",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/product-trailmap.git",
    seoTitle: "Trailmap — Public Product Roadmap Template | Hanzo",
    seoDescription:
      "Fork Trailmap, a React + Hanzo public roadmap with Now/Next/Later lanes, themed cards and org-scoped Base storage. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "feedback-signal",
    name: "Signal — Product Feedback Inbox",
    tagline: "Turn raw feedback into signal.",
    description:
      "Signal is a two-pane product-feedback triage inbox built on the Hanzo stack. Incoming feedback lands as items you read, tag by theme and sentiment, and mark triaged or archived — a fast, keyboard-inbox workflow for turning raw user input into signal. Sign-in is PKCE via Hanzo IAM and every item is stored org-scoped in Hanzo Base.",
    category: "Product Management",
    tags: ["Internal Tools"],
    keyHighlights: [
      { title: "Two-pane triage console", body: "A narrow, dense list of feedback rows on the left; the selected item's full detail on the right — a focused, keyboard-inbox layout with Superhuman-like density." },
      { title: "Sentiment and theme tagging", body: "Tag each item positive, neutral, or negative and group it under a color-coded theme you create inline as you read, right from the detail pane." },
      { title: "New / triaged / archived lifecycle", body: "Unread (new) items carry visual weight in the list; triaging or archiving clears that weight, so the queue always shows what still needs attention." },
      { title: "Capture from any source", body: "Log a new piece of feedback with its source, body, sentiment, and theme; it lands in the inbox as new, ready to triage." },
      { title: "Org-scoped Hanzo Base data", body: "feedback and themes are real Base collections provisioned from schema.sql, with owner and org stamped from the verified IAM principal and isolated per org." },
      { title: "PKCE sign-in, no passwords", body: "Auth is OAuth2 PKCE S256 against hanzo.id; the SPA carries the IAM token to Base and never handles a credential itself." },
    ],
    about:
      "Signal is a product-feedback triage inbox for product managers. It turns a stream of raw user input — from email, Intercom, sales calls, app-store reviews, and more — into an organized queue where each item is read, tagged by theme and sentiment, and marked triaged or archived. Built entirely on @hanzo/gui primitives with a neutral-slate, Superhuman-density aesthetic, it uses Hanzo IAM for PKCE auth and Hanzo Base for org-scoped storage of the feedback and themes collections.",
    perfectFor: [
      "Product managers triaging incoming user feedback",
      "Founders making sense of early customer input",
      "Support teams routing feedback by theme and sentiment",
      "Teams consolidating multi-channel feedback into one inbox",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/feedback-signal.git",
    seoTitle: "Signal — Product Feedback Inbox Template | Hanzo",
    seoDescription:
      "Fork Signal, a React + Hanzo two-pane feedback triage inbox with sentiment and theme tagging on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "event-rally",
    name: "Rally — Event RSVP Page",
    tagline: "One event. One page. One tap to RSVP.",
    description:
      "Rally is a single-event RSVP page on the Hanzo stack — a color-flooded invite hero with a ticket-stub RSVP card. Guests reply going or can't-make-it with a guest headcount, while the host edits the event and watches the guest list fill in with live counts. Auth is PKCE through Hanzo IAM and every event and RSVP is an org-scoped row in Hanzo Base, provisioned from schema.sql at deploy.",
    category: "Events",
    tags: ["Landing Page"],
    keyHighlights: [
      { title: "Ticket-stub RSVP", body: "A cream ticket card with a perforated edge and punched notches floats over the flooded hero — one tap to reply going or can't-make-it, plus a guest headcount and a note to the host." },
      { title: "Public invite, private management", body: "The event page is the public landing; signing in with Hanzo unlocks the live RSVP form and the host tools, so there is no separate marketing page to maintain." },
      { title: "Live guest list", body: "The host's Attendees view tallies heads coming, replies received, and spots left in real time as RSVPs land, each shown with status, party size, and note." },
      { title: "Edit once, publish live", body: "The host edits title, date and time, location, and capacity on one form; the first save creates the event row and every change updates it in Hanzo Base." },
      { title: "Org-scoped by default", body: "schema.sql provisions the event and rsvps collections; Base stamps owner and org from the verified IAM principal and isolates every row to your org via the rule @request.auth.org_id = org." },
      { title: "One design system", body: "Built entirely from @hanzo/gui primitives — no Tailwind, no second kit — with a single striking accent and a mobile-first, Partiful-style layout." },
    ],
    about:
      "Rally turns a single event into one shareable page. The invite leads with a bold, color-flooded hero — date, title, and place — over which a cream ticket-stub card captures RSVPs in a tap. Guests reply yes or no with a party headcount and an optional note; the host manages the details and watches the guest list fill in with live counts. It is small but complete and real: identity is PKCE via Hanzo IAM against hanzo.id, the UI is 100% @hanzo/gui primitives, and the event plus every RSVP persist as org-scoped rows in Hanzo Base. The event page is public by design — the invite is the landing, and signing in is what unlocks RSVP and host management.",
    perfectFor: [
      "Parties and celebrations",
      "Meetups and community nights",
      "Launch parties and gallery openings",
      "Workshops and classes with limited seats",
      "Any one-off event that needs a headcount",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/event-rally.git",
    seoTitle: "Rally — Event RSVP Page Template | Hanzo",
    seoDescription:
      "Fork Rally, a mobile-first React + Hanzo single-event RSVP page with a live guest list on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "agenda-grid",
    name: "Sched — Conference Agenda",
    tagline: "Your whole conference at a glance.",
    description:
      "Sched is a multi-track conference agenda built on the Hanzo stack. Attendees browse every session in a color-coded timetable — hours down a sticky time gutter, tracks across the top, each block sized by its real duration — then open a session for its abstract and speakers. Organizers add tracks, sessions and speakers straight into org-scoped Hanzo Base collections, and the grid updates as they go.",
    category: "Events",
    tags: ["Apps"],
    keyHighlights: [
      { title: "Timetable at a glance", body: "A scrollable time-axis matrix — hours down a sticky gutter, color-coded track columns across, and every session an absolutely-positioned block sized by its real start-to-end duration." },
      { title: "Color-coded tracks", body: "Each track gets its own hue so parallel programming is easy to scan; organizers pick the color when they create the track, and the grid, chips and detail view all follow it." },
      { title: "Session detail with speakers", body: "Open any session for its abstract, room and time plus the speakers linked to it by session id — rendered from the speakers collection, not hard-coded." },
      { title: "Organizer tools built in", body: "The Manage view adds tracks, sessions and speakers; each write lands as an org-scoped row in Hanzo Base via useMutation and the agenda refetches immediately." },
      { title: "Ambient Hanzo auth", body: "OAuth2 PKCE sign-in against hanzo.id with no local passwords; the IAM token is carried into Base so every read and write is scoped to your organization." },
      { title: "Real stack, ships as a repo", body: "React 19 + @hanzo/gui + @hanzo/iam + @hanzo/base under Vite, using Tamagui longhand props so it compiles green under tsc and vite in CI." },
    ],
    about:
      "Sched turns a conference program into a single, dense, color-coded timetable. It is a complete example of the Hanzo app pattern — @hanzo/gui for the UI (Tamagui primitives, no Tailwind), Hanzo IAM for identity, and Hanzo Base for org-scoped data — with three collections (tracks, sessions, speakers) provisioned automatically from schema.sql on deploy. Three views cover the whole loop: the agenda grid, a session detail with speaker bios, and a Manage view for organizers. It ships as a real, buildable repo (tsc + vite green in CI), not a mockup.",
    perfectFor: [
      "Multi-track conferences and summits",
      "Meetups and community events with parallel sessions",
      "Internal all-hands, onboarding or training days",
      "Workshop tracks and hackathon schedules",
      "Any event that needs a shared, color-coded agenda",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/agenda-grid.git",
    seoTitle: "Sched — Conference Agenda Template | Hanzo",
    seoDescription:
      "Fork Sched, a React + Hanzo multi-track conference agenda with a color-coded timetable and org-scoped Base storage. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "meetup-gather",
    name: "Meetup Gather",
    tagline: "Community meetup pages with RSVPs",
    description:
      "Meetup Gather is a warm, community-first starter for creating meetup pages your circle can RSVP to. Members see who's coming as a live wall of attendee avatars, hosts publish events and track turnout, and every event and RSVP is stored per-org in Hanzo Base. Built with React 19 and @hanzo/gui, secured by Hanzo IAM PKCE sign-in, and deployed as a static SPA on Hanzo Cloud.",
    category: "Events",
    tags: ["Apps"],
    keyHighlights: [
      { title: "Live 'who's coming' wall", body: "Each meetup page renders attendees as a grid of colored initial avatars with going and maybe counts, so members can see the crowd forming before they commit." },
      { title: "One-tap RSVP that never duplicates", body: "The Discover view writes a single RSVP row per person per event — updating your going/maybe/can't answer in place rather than piling up rows — against org-scoped @hanzo/base with useQuery/useMutation." },
      { title: "Host dashboard with turnout rollups", body: "Publish a meetup with a title, time, and place; you become the host, your org sees it instantly, and its RSVPs roll up by status with an attendee stack and per-event counts." },
      { title: "Sign in with Hanzo, no passwords", body: "Auth is OAuth2 PKCE (S256) against hanzo.id via @hanzo/iam; the returned IAM token is carried into Base so every read and write is automatically scoped to the signed-in user's org." },
      { title: "100% @hanzo/gui, warm by design", body: "Cream paper, terracotta accents, rounded cards, and avatar grids — all built from @hanzo/gui (Tamagui) primitives with longhand style props. No Tailwind, no second kit; one TextButton primitive keeps button styling DRY." },
      { title: "Ships as a provable static SPA", body: "schema.sql provisions the events + rsvps collections on publish and Vite builds to dist/ served at <slug>.hanzo.app. tsc --noEmit and vite build both pass, and CI is green." },
    ],
    about:
      "Meetup Gather is a warm, rounded template for spinning up meetup pages your community can RSVP to. It ships three real views — a public event landing that markets the meetup and shows a live \"who's coming\" avatar wall, a Discover feed where signed-in members set going/maybe/can't and see attendees, and a host dashboard for publishing events and rolling up turnout by status. Both collections (events and rsvps) are org-scoped Hanzo Base tables provisioned from schema.sql on publish; identity is Hanzo IAM (OAuth2 PKCE against hanzo.id), and the UI is built entirely from @hanzo/gui primitives, so the whole thing deploys as a static SPA on Hanzo Cloud with no server code.",
    perfectFor: [
      "Neighborhood and community meetups",
      "Run clubs, book clubs, and hobby groups",
      "Internal team socials, offsites, and lunch-and-learns",
      "Recurring gatherings that just need simple RSVPs",
      "Anyone who wants a shareable event page without a heavy events platform",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/meetup-gather.git",
    seoTitle: "Meetup Gather — Community RSVP Page Template | Hanzo",
    seoDescription:
      "Fork Meetup Gather, a React + Hanzo meetup page with live RSVPs and a who's-coming wall on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "daily-standup",
    name: "Daily Standup",
    tagline: "Async standup tracker for small teams",
    description:
      "Daily Standup is an async standup tracker for small teams. Each teammate posts what they finished yesterday, what they're focused on today, and any blockers; the whole team reads one tight rollup instead of sitting through a meeting. Built on the Hanzo app stack — React 19, @hanzo/gui, PKCE sign-in via hanzo.id, and org-scoped Base storage — and deployable to hanzo.app in one fork.",
    category: "Project Management",
    tags: ["Internal Tools"],
    keyHighlights: [
      { title: "Async by design", body: "Everyone checks in on their own time and the Today view rolls the team into one screen — replacing the live standup meeting with a written, timezone-friendly record." },
      { title: "Status at a glance", body: "Green/amber status dots plus a live \"N posted · M blocked\" tally surface who is stuck before you open a single card, and blocked entries flag themselves in amber." },
      { title: "One check-in per person per day", body: "The Post view finds your entry for today and edits it in place instead of appending duplicates, so the daily log stays clean and canonical." },
      { title: "Org-scoped by default", body: "Each update is a Hanzo Base row stamped with the verified IAM owner+org (@request.auth.org_id = org); your team reads the standup and other orgs never can." },
      { title: "Real Hanzo auth, no passwords", body: "Sign-in is OAuth2 PKCE (S256) against hanzo.id — the SPA carries the resulting IAM token straight to Base, with no server and no local credentials." },
      { title: "100% @hanzo/gui", body: "A tight utilitarian interface with mono accents and status dots, built entirely from Hanzo GUI primitives (Tamagui longhand props) over Vite + React 19 — no Tailwind, no second kit." },
    ],
    about:
      "A complete, buildable Hanzo starter that turns the daily standup ritual into an async, written check-in. Members open \"Post,\" fill in yesterday / today / blockers, and hit save; the \"Today\" view aggregates the team into one scannable feed with status dots and a posted/blocked tally, and \"History\" keeps a dense, day-grouped log you can scan across weeks. Every update is a real Hanzo Base row stamped with the verified IAM owner and org, so a team sees its own standup and no other org ever can. The UI is 100% @hanzo/gui primitives in a tight, utilitarian, monospace-accented style — no Tailwind, no second kit — and the whole thing is a static SPA: identity and data happen in the browser, and Hanzo Cloud provisions the Base collection from schema.sql on publish.",
    perfectFor: [
      "Distributed teams across time zones that can't sync a live standup",
      "Engineering squads that want a written, searchable blocker trail",
      "Small startups replacing the daily standup meeting with a check-in",
      "Any team building a lightweight daily accountability habit",
      "Founders forking a real Hanzo app to customize on hanzo.app",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/daily-standup.git",
    seoTitle: "Daily Standup — Async Standup Tracker Template | Hanzo",
    seoDescription:
      "Fork Daily Standup, a React + Hanzo async standup tracker with status rollups on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "sprint-retro",
    name: "Sprint Retro",
    tagline: "Run team retrospectives that stick",
    description:
      "Sprint Retro is a complete, buildable team-retrospective app on the Hanzo stack. Collect what went well, what to improve, and action items on a calm three-column board of sticky notes, vote to surface what matters, then turn the top ideas into owned actions you track to done — all per named sprint. UI is 100% @hanzo/gui primitives, identity is OAuth2 PKCE against hanzo.id, and every retro, card, and action persists in an org-scoped Hanzo Base collection provisioned from schema.sql.",
    category: "Project Management",
    tags: ["Internal Tools"],
    keyHighlights: [
      { title: "Three-column sticky board", body: "Went Well, To Improve, and Action Items as calm pastel columns of sticky-note cards. Add a card inline in any column and upvote it — cards automatically sort most-voted first so the conversation focuses on what matters." },
      { title: "Board to tracked actions", body: "Promote any Action Item card straight into the tracker with Track, then assign a free-text owner and check it done. A live progress bar shows how much of the sprint's commitments actually landed." },
      { title: "Per-sprint retrospectives", body: "Every retro is a named sprint. Switch between past sprints from the header rail or start a fresh one inline; cards and actions scope to the current sprint via a retro id." },
      { title: "One design system, light pastel", body: "100% @hanzo/gui (Tamagui) primitives with longhand props on a warm-paper light theme. The column palette, ink scale, and all card/action helpers live in one place (src/lib/retro.ts)." },
      { title: "Canonical Hanzo provider stack", body: "GuiProvider then IamProvider then BaseProvider, forked unchanged from hanzo-starter. Auth is OAuth2 PKCE against hanzo.id (localStorage, refresh-aware); the BaseClient carries the IAM token so every query is org-scoped." },
      { title: "Real static-SPA deploy", body: "tsc --noEmit and vite build pass green in CI. Deploys to a slug.hanzo.app static site with retros, cards, and actions provisioned from schema.sql via provisionBaseFromDDL — no server process." },
    ],
    about:
      "Sprint Retro forks the canonical hanzo-starter — keeping the proven provider stack (GuiProvider then IamProvider then BaseProvider), vite.config, PKCE auth, and static-SPA deploy contract intact — and varies it into a calm, light pastel retrospective tool. The board is three columns of sticky-note cards (sage, apricot, periwinkle) with an inline composer and voting; the action tracker is the follow-through, with free-text owners, a round done-toggle, and a progress bar. Data is three org-scoped Hanzo Base collections (retros, cards, actions) provisioned from schema.sql, and identity is OAuth2 PKCE against hanzo.id. UI is 100% @hanzo/gui (Tamagui) primitives with longhand props — no Tailwind, no second kit — running in the design system's light theme so the pastel board reads honestly.",
    perfectFor: [
      "Engineering and product teams running sprint or iteration retrospectives",
      "Agile coaches and scrum masters who want retros that produce tracked, owned actions",
      "Remote teams needing a shared, org-scoped board for went-well / to-improve / actions",
      "Developers forking a real, buildable Hanzo app to learn the @hanzo/gui + IAM + Base stack",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/sprint-retro.git",
    seoTitle: "Sprint Retro — Team Retrospective Template | Hanzo",
    seoDescription:
      "Fork Sprint Retro, a React + Hanzo retrospective board with voting and tracked actions on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "kanban-lane",
    name: "Kanban Lane",
    tagline: "A focused drag-free kanban board",
    description:
      "Kanban Lane is a focused, drag-free kanban board for small teams: track every task across To Do, Doing, and Done and advance work with a click instead of a drag. It ships as a real, buildable app on the Hanzo stack — Vite + React 19, @hanzo/gui, PKCE sign-in via @hanzo/iam, and an org-scoped @hanzo/base collection — that you fork on hanzo.app and deploy live on Hanzo Cloud. Crisp monochrome lanes with a single accent keep priority and owner in view without the clutter.",
    category: "Project Management",
    tags: ["Apps"],
    keyHighlights: [
      { title: "Drag-free lane moves", body: "Every card carries ‹ › controls that advance it one lane (To Do → Doing → Done) with a single Base update, then refetch — no drag-and-drop to fight on a trackpad or touch screen." },
      { title: "Three views, one collection", body: "A visual board, a single-task detail editor, and a dense priority-ordered backlog all share one org-scoped `tasks` query from the signed-in shell; every write refetches it, so there is no second store to keep in sync." },
      { title: "Crisp monochrome, one accent", body: "Graphite lanes with a single lime accent reserved for the Doing lane, the active nav tab, and the primary action; priority reads as monochrome signal bars, so the board stays calm, dense, and legible." },
      { title: "Hanzo IAM sign-in (PKCE)", body: "OAuth2 PKCE S256 against hanzo.id with no local passwords; the IAM token is carried to Base so every task is stamped owner+org and isolated to your team, refresh-aware via offline_access." },
      { title: "Org-scoped Base data from schema.sql", body: "schema.sql declares tasks(title, status, assignee, priority); on publish Hanzo Cloud provisions the collection with the rule @request.auth.org_id = org, so a teammate in your org sees the board and other orgs cannot." },
      { title: "100% @hanzo/gui, tsc-green", body: "Built entirely on Tamagui longhand primitives (no Tailwind, no second kit) under Vite + React 19 and TypeScript 5.9; typecheck and Vite build pass locally and CI is green." },
    ],
    about:
      "Kanban Lane is a starter you fork on hanzo.app and deploy live on Hanzo Cloud. It is a complete, buildable project-management app — not a mockup — that demonstrates the canonical Hanzo stack end to end: @hanzo/gui for a monochrome, single-accent design system, @hanzo/iam for ambient PKCE identity against hanzo.id, and @hanzo/base for an IAM-native, org-scoped data plane. The board, task detail, and backlog views all read and write one `tasks` collection, and the deliberately drag-free interaction model keeps every task move to a single click.",
    perfectFor: [
      "Small teams tracking work across To Do / Doing / Done",
      "Sprint and project boards where a click beats drag-and-drop",
      "Any status-column workflow — review queues, pipelines, applicant tracking",
      "Learning the Hanzo stack (GUI + IAM + Base) from one real, buildable app",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/kanban-lane.git",
    seoTitle: "Kanban Lane — Kanban Board Template | Hanzo",
    seoDescription:
      "Fork Kanban Lane, a React + Hanzo drag-free kanban board with org-scoped tasks on Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "habit-streak",
    name: "Habit Streak",
    tagline: "Build habits with streaks and heatmaps",
    description:
      "Habit Streak is a calm, distraction-free habit tracker built on the Hanzo stack. Check in on daily habits with one big tap, keep your streak alive, and watch an 18-week green heatmap fill in as your consistency grows. Every habit and check-in lives in an org-scoped Hanzo Base collection, with sign-in handled by Hanzo IAM.",
    category: "Apps",
    tags: ["Services"],
    keyHighlights: [
      { title: "One-tap daily check-ins", body: "Each habit gets a big circular check button on the Today view — tap to log the day, tap again to undo — with a seven-day strip showing the last week at a glance." },
      { title: "Green consistency heatmap", body: "Every habit's detail view renders an 18-week calendar heatmap where deeper green marks longer runs, GitHub-contribution-style, for your own habits." },
      { title: "Honest streak math", body: "Current, longest, and total streaks are derived in the browser from real check-in rows using timezone-safe day arithmetic — verified by 18 passing assertions, no faked numbers." },
      { title: "Org-scoped data on Hanzo Base", body: "Habits and check-ins are real Base collections, provisioned from schema.sql on deploy and scoped to your org via the rule @request.auth.org_id = org." },
      { title: "PKCE sign-in with Hanzo IAM", body: "Authentication is OAuth2 PKCE against hanzo.id — no local passwords, refresh-aware sessions, and the IAM JWT carried straight to Base." },
      { title: "100% @hanzo/gui, no Tailwind", body: "A single design system: Hanzo GUI primitives with longhand Tamagui props, deduped react/react-dom/react-native-web under Vite, tsc-clean." },
    ],
    about:
      "Habit Streak is a real, buildable starter for the Hanzo platform: Vite + React 19 with @hanzo/gui for UI, @hanzo/iam for authentication, and @hanzo/base for data. It ships three focused views — today's habits, a habit detail with a calendar heatmap, and an add-habit form — over two org-scoped Base collections (habits and checkins). The whole interface is Hanzo GUI (Tamagui) primitives with longhand style props, aliased to react-native-web under Vite. Fork it on hanzo.app and deploy it live on Hanzo Cloud as a static SPA.",
    perfectFor: [
      "Personal habit and routine tracking",
      "A calm daily check-in companion app",
      "Learning the Hanzo GUI + IAM + Base stack from a real example",
      "A starting point for any streak- or heatmap-driven app",
      "Teams standardizing on org-scoped Hanzo Base data",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/habit-streak.git",
    seoTitle: "Habit Streak — Habit Tracker Template | Hanzo",
    seoDescription:
      "Fork Habit Streak, a React + Hanzo habit tracker with streaks and a green heatmap on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "expense-spend",
    name: "Expense Spend",
    tagline: "Log expenses and see where money goes",
    description:
      "Expense Spend is a clean fintech expense tracker: log what you spend in seconds, tag it to a category, and watch clean totals build up by category and by month. Built on the Hanzo stack — Vite + React 19, @hanzo/gui, Hanzo IAM PKCE sign-in, and org-scoped Hanzo Base — every expense is a real row provisioned from schema.sql. Fork it on hanzo.app, remix with AI, and deploy live as a static SPA.",
    category: "Apps",
    tags: ["SaaS"],
    keyHighlights: [
      { title: "Tabular expense log", body: "A dense, fintech-style ledger: every row carries the date, a colour-coded category chip, the note, and the amount right-aligned. Add an expense from the compose panel — amount, category, note, date — and it appears instantly." },
      { title: "Colour-coded category chips", body: "Eight fixed categories, each with its own accent and dot. Pick one when logging; the same chip colour threads through the log rows, the by-category bars, and the summary charts so spend is legible at a glance." },
      { title: "Spend summary with charts", body: "A Summary tab with KPI tiles (this month, top category, average per entry, entries), a by-category breakdown with proportion bars, and a by-month vertical bar chart — all aggregated client-side over your rows, no extra query." },
      { title: "One source of truth", body: "The shell owns a single org-scoped expenses query and hands its rows to the log, the summary, and the hero total, so every surface reads the same money. Creates and deletes refetch in place — one simple path, no realtime." },
      { title: "Org-scoped by IAM", body: "Every expense is stamped with the verified IAM owner and org and shared only within it. schema.sql provisions the expenses Base collection on deploy (rule @request.auth.org_id = org) — a teammate in your org sees it, other orgs cannot." },
      { title: "Real Hanzo stack", body: "100% @hanzo/gui primitives (no Tailwind, no second kit) with a mint fintech accent and Tamagui longhand props. PKCE sign-in via hanzo.id. Compiles green with tsc and builds with Vite as a static SPA; CI verifies both." },
    ],
    about:
      "A personal-finance expense tracker built on the canonical Hanzo stack. Expense Spend lets you log every purchase in seconds, tag it to one of eight colour-coded categories, and see exactly where your money goes — a tabular ledger, totals by category with proportion bars, and a month-over-month bar chart — all backed by an org-scoped Hanzo Base collection and Hanzo IAM sign-in. It ships as a real, buildable static SPA (Vite + React 19 + @hanzo/gui + @hanzo/iam + @hanzo/base), not a mockup.",
    perfectFor: [
      "Anyone tracking personal or household spending by category",
      "Freelancers and contractors logging business expenses",
      "Small teams keeping a shared, org-scoped expense ledger",
      "Founders who want a fintech-styled Hanzo app to fork and extend",
      "Budgeters who want month-over-month spend at a glance",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/expense-spend.git",
    seoTitle: "Expense Spend — Expense Tracker Template | Hanzo",
    seoDescription:
      "Fork Expense Spend, a React + Hanzo expense tracker with category and monthly spend charts on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "reading-shelf",
    name: "Reading Shelf",
    tagline: "Track your books and reading progress",
    description:
      "Reading Shelf is a cozy book tracker on the Hanzo stack: keep the books you're reading, want to read, and have finished on a warm library shelf of hardcover spine cards. Open any book to nudge its progress, move it between shelves, and keep notes — all stored in an org-scoped Hanzo Base collection behind Hanzo IAM sign-in. It ships as a real, buildable static SPA (Vite + React 19 + @hanzo/gui + @hanzo/iam + @hanzo/base), not a mockup.",
    category: "Apps",
    tags: ["Services"],
    keyHighlights: [
      { title: "Book-spine shelves", body: "Every book stands on a wooden ledge as a hardcover spine in its own cloth colour, with the title running down the spine in warm serif and gilt foil bands. Books group into Currently Reading, Want to Read, and Finished shelves and filter by status." },
      { title: "Progress you actually track", body: "Open a book to nudge progress with steppers and quick-set chips (0/25/50/75/100%), or hit Mark finished to jump to 100%. A reading rail shows how far along you are right on the spine." },
      { title: "A shelf move in one tap", body: "Change a book's shelf between Reading, Want to Read, and Finished from the detail view; the grid re-sorts it onto the right ledge. Add new titles with author, starting shelf, and notes." },
      { title: "Notes per book", body: "Each book carries freeform notes — favourite lines, where you left off, what to read next — saved alongside its status and progress." },
      { title: "Hanzo IAM sign-in", body: "OAuth2 PKCE against hanzo.id with no local passwords; the signed-in reader's IAM token flows straight into Base as the bearer." },
      { title: "Org-scoped Hanzo Base data", body: "The books collection is provisioned from schema.sql and scoped to your org (rule @request.auth.org_id = org), so your library stays yours. 100% @hanzo/gui primitives, typechecks (tsc) and builds (vite) green in CI." },
    ],
    about:
      "Reading Shelf turns your reading life into a warm, private library you host on Hanzo. Every book stands on a wooden ledge as a hardcover spine in its own cloth colour, its title running down the spine in serif; books are grouped into Currently Reading, Want to Read, and Finished shelves and filter by status. Open a book to update progress, change its shelf, jot notes, or mark it finished — each change is saved to an org-scoped Hanzo Base collection provisioned straight from schema.sql, behind Hanzo IAM (PKCE) sign-in with no local passwords. The interface is 100% @hanzo/gui primitives in a cozy parchment-and-serif design — no Tailwind, no second kit. Forked from the canonical hanzo-starter, it keeps the exact provider stack, vite.config, PKCE auth, and deploy contract, and varies only the domain, data model, and design.",
    perfectFor: [
      "Readers tracking what they're reading, want to read, and have finished",
      "Anyone who wants reading progress and per-book notes in one cozy place",
      "Book clubs or households keeping a shared shelf scoped to their org",
      "Developers who want a stylish, deployable Hanzo-stack starter for a collection app",
      "Turning a reading habit into a warm, private library",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/reading-shelf.git",
    seoTitle: "Reading Shelf — Book Tracker Template | Hanzo",
    seoDescription:
      "Fork Reading Shelf, a React + Hanzo book tracker with a warm shelf of spine cards on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "link-onepage",
    name: "Link Onepage",
    tagline: "A link-in-bio page you own",
    description:
      "Link Onepage is a link-in-bio starter you actually own — one centered, mobile-first page of your profile and links, styled in clean gradient-free monochrome with big tappable buttons. Sign in with Hanzo IAM, edit your name, bio, and links in place, then watch real per-link tap counts in a lightweight analytics view. Built on Vite, React 19, and @hanzo/gui with org-scoped Hanzo Base storage, it forks and deploys live on Hanzo in minutes.",
    category: "Landing Page",
    tags: ["Portfolio"],
    keyHighlights: [
      { title: "One page, three views", body: "A public link page, an in-place editor for your profile and links, and analytics-lite — all in a single static SPA with no router dependency." },
      { title: "Monochrome by design", body: "Centered, mobile-first layout with big tappable link buttons and zero gradients — high-contrast @hanzo/gui primitives only, no Tailwind or second kit." },
      { title: "Real tap analytics", body: "Every link carries a live clicks counter the page bumps on tap; the analytics view ranks links by actual taps, so there are no estimated or fabricated numbers." },
      { title: "Own your data", body: "Your profile and links are org-scoped Hanzo Base rows provisioned from schema.sql, stamped with your verified IAM owner and org so only your org can read them." },
      { title: "Passwordless sign-in", body: "OAuth2 PKCE against hanzo.id — no local passwords. The IAM token flows straight into Base, so the page you edit is the page you own." },
      { title: "Fork and ship", body: "tsc + Vite build verified green in CI; deploys as a static site to <slug>.hanzo.app with Base collections auto-provisioned on publish." },
    ],
    about:
      "Link Onepage is a self-owned alternative to hosted link-in-bio pages. It gives you a single, beautifully spare page — a monogram or avatar, your name, a short bio, and a stack of big tappable link buttons — that you edit yourself and host on your own Hanzo deployment. Under the hood it is the canonical Hanzo app stack: @hanzo/gui primitives for a monochrome design system (no Tailwind, no second kit), Hanzo IAM for passwordless PKCE sign-in against hanzo.id, and Hanzo Base for org-scoped storage of your profile and links. The signed-out landing renders the page live from demo content so you see exactly what you get before you sign in, and a lightweight analytics view ranks your links by real taps.",
    perfectFor: [
      "Creators and freelancers who want a link-in-bio page they fully own",
      "Replacing a hosted Linktree-style page with something self-deployed",
      "A minimal, monochrome personal landing page",
      "Developers learning the Hanzo stack (IAM + Base) from a small, complete app",
      "Anyone wanting real link-tap analytics without third-party trackers",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/link-onepage.git",
    seoTitle: "Link Onepage — Link-in-Bio Template | Hanzo",
    seoDescription:
      "Fork Link Onepage, a React + Hanzo link-in-bio page with real tap analytics on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "helpdesk-deskline",
    name: "Deskline Helpdesk",
    tagline: "A simple support ticket queue",
    description:
      "Deskline is a support ticket queue for internal teams, built on the Hanzo stack. Submit, triage, and resolve requests in a split list-and-detail workspace with color-coded severity and status badges, threaded replies, and one-tap status changes. Tickets and replies persist per-organization in Hanzo Base, with sign-in handled by Hanzo IAM over OAuth2 PKCE.",
    category: "Internal Tools",
    tags: ["SaaS"],
    keyHighlights: [
      { title: "Split queue and detail", body: "A severity-sorted ticket queue sits on the left; the selected request opens on the right with its full reply thread — the businesslike layout support teams actually work in, responsive down to a stacked single column." },
      { title: "One-tap triage", body: "Change a ticket's status (Open, Pending, Resolved, Closed) and severity (Urgent, High, Normal, Low) from segmented controls in the detail pane; the first agent reply on an Open ticket auto-moves it to Pending." },
      { title: "Severity and status badges", body: "Color-coded pills read at a glance, and the queue orders live tickets first, then by severity rank, then newest — so the most urgent work is always at the top." },
      { title: "Org-scoped data from schema.sql", body: "tickets and replies are Hanzo Base collections provisioned from schema.sql on deploy; every row is stamped owner+org and scoped by the rule @request.auth.org_id = org, so a teammate sees the ticket and other orgs cannot." },
      { title: "Sign in with Hanzo, no passwords", body: "Auth is OAuth2 PKCE against hanzo.id via @hanzo/iam — there is no server and no local credential store; the static SPA carries the IAM token to Base for every read and write." },
      { title: "Pure @hanzo/gui, verified green", body: "Every surface is built from @hanzo/gui (Tamagui) primitives with longhand style props and one reused badge shape — no Tailwind, no second kit — and the whole app passes tsc plus vite build in CI." },
    ],
    about:
      "Deskline is a lightweight helpdesk for internal teams — the kind of tool you stand up when support requests start arriving faster than a shared inbox can handle. It gives you one triage queue: log a ticket with a subject, description, severity, and requester; filter the backlog by status; and open any ticket into a detail pane to read it, reply in a thread, and move it through an Open to Pending to Resolved to Closed workflow. The queue orders live tickets first, then by severity, then newest, so urgent work floats to the top. It is a real, buildable Hanzo app forked from the canonical hanzo-starter, so the provider stack, PKCE auth, and Base data contract are production-shaped rather than mocked — it compiles green through tsc and vite and provisions its own org-scoped collections on deploy.",
    perfectFor: [
      "Internal IT or ops support desks",
      "Small teams outgrowing a shared support inbox",
      "Customer support queues for an early-stage product",
      "Bug and request intake for a project or squad",
      "A starting point for any status/priority workflow tool",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/helpdesk-deskline.git",
    seoTitle: "Deskline Helpdesk — Support Ticket Queue Template | Hanzo",
    seoDescription:
      "Fork Deskline, a React + Hanzo support ticket queue with triage and threaded replies on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "inventory-stockroom",
    name: "Stockroom Inventory",
    tagline: "Track stock and get low-stock alerts before you run out.",
    description:
      "Stockroom is a dense inventory tracker built on Hanzo — a sortable, searchable stock table, an item detail with live stock adjustments, and a low-stock alerts view that flags items in amber before they run out. Every SKU lives in an org-scoped Hanzo Base collection behind Hanzo IAM sign-in, with quantities, reorder points and locations you can edit in place. Fork it, wire it to your own stock and deploy it live on Hanzo.",
    category: "Internal Tools",
    tags: ["Apps"],
    keyHighlights: [
      { title: "Dense, sortable stock table", body: "A searchable data-table of every SKU — SKU, item, location, on-hand and reorder point — sortable on any column, with the whole stockroom visible at a glance." },
      { title: "Amber low-stock signals", body: "On-hand at or below an item's reorder point turns the row amber, and a zero count turns it red, so exposure shows itself instead of hiding in a report." },
      { title: "Low-stock alerts with reorder sizes", body: "A dedicated alerts view lists everything under its reorder point — out-of-stock first, then the deepest shortfall — each with a suggested order quantity." },
      { title: "Live stock movements", body: "Receive or pick units and change the reorder point right on the item detail; every adjustment writes back to Hanzo Base and re-flags the item instantly." },
      { title: "Org-scoped Hanzo Base data", body: "The items collection is provisioned from schema.sql on deploy and scoped to your org via IAM — teammates share it, other orgs can't see it." },
      { title: "Sign in with Hanzo, no passwords", body: "OAuth2 PKCE against hanzo.id; the SPA carries the IAM token straight to Base with no server process to run or secure." },
    ],
    about:
      "Stockroom is a real, buildable Hanzo app — Vite + React 19 on 100% @hanzo/gui primitives, with Hanzo IAM for sign-in and Hanzo Base for storage. It is deliberately focused: one items collection behind four surfaces (inventory table, item detail, low-stock alerts, add-item), so it reads as a working internal tool rather than a demo. Fork it as the starting point for a warehouse or supply-closet tracker and extend it with your own fields, locations and reorder logic.",
    perfectFor: [
      "Warehouse and stockroom inventory",
      "Supply-closet and equipment tracking",
      "Reorder-point management for small teams",
      "Any org-scoped internal tracking tool",
      "A Hanzo Base + IAM starting point for data apps",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/inventory-stockroom.git",
    seoTitle: "Stockroom Inventory — Stock Tracker Template | Hanzo",
    seoDescription:
      "Fork Stockroom, a React + Hanzo inventory tracker with low-stock alerts on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "gear-locker",
    name: "Gear Locker",
    tagline: "Assign and track company equipment",
    description:
      "Gear Locker is an internal tool for tracking company equipment — assign laptops, monitors, and phones to people, log returns, and read each asset's full hand-off history. Built on React 19 and the Hanzo stack (@hanzo/gui for UI, @hanzo/iam PKCE sign-in, and org-scoped @hanzo/base for data), it deploys as a static SPA on Hanzo Cloud. A real, buildable starter you can fork and ship, not a mockup.",
    category: "Internal Tools",
    tags: ["Apps"],
    keyHighlights: [
      { title: "History, not just a list", body: "Every asset carries its full hand-off history. The detail pane shows who held it and since when, and a single global timeline flags the current holder of each piece of gear." },
      { title: "Org-scoped data in Hanzo Base", body: "assets and assignments are real Base collections provisioned from schema.sql. Each row is stamped with the verified IAM owner and org, so teammates share your locker and other orgs cannot see it (rule @request.auth.org_id = org)." },
      { title: "PKCE sign-in — no passwords", body: "Auth is OAuth2 PKCE S256 against Hanzo IAM (hanzo.id). The app never handles a credential; the IAM token it receives scopes every read and write to the signed-in user's org." },
      { title: "One @hanzo/gui design system", body: "100% Hanzo GUI primitives with Tamagui longhand props — monospace inventory tag chips, color-coded status badges (available / assigned / in repair / retired), and a hand-tuned dark IT-console palette." },
      { title: "Static SPA, Cloud-native deploy", body: "Vite builds to dist/ and Hanzo Cloud serves it at <slug>.hanzo.app with no server process. Publishing provisions the Base schema automatically via provisionBaseFromDDL." },
      { title: "Typed and green in CI", body: "Strict TypeScript end to end; tsc --noEmit and vite build both pass, verified green on GitHub Actions on every push to main." },
    ],
    about:
      "Gear Locker is a real, buildable internal tool for tracking company equipment — laptops, monitors, phones, and the rest. Add an asset with a monospace inventory tag, assign it to a person, log the return, and read the complete assignment history from either the asset's detail pane or one global timeline that flags who currently holds each piece of gear. It is built on the canonical Hanzo app stack — React 19 + @hanzo/gui for a single design system (no Tailwind, no second kit), @hanzo/iam for PKCE auth against hanzo.id, and @hanzo/base for org-scoped data — and deploys as a static SPA on Hanzo Cloud, provisioning its Base collections from schema.sql on publish.",
    perfectFor: [
      "IT and ops teams tracking company hardware",
      "Managing onboarding and offboarding equipment hand-offs",
      "Small companies replacing an asset-tracking spreadsheet",
      "Any team needing a per-org inventory with full history",
      "A starting point for a custom internal asset tool on Hanzo",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/gear-locker.git",
    seoTitle: "Gear Locker — Equipment Tracking Template | Hanzo",
    seoDescription:
      "Fork Gear Locker, a React + Hanzo equipment tracker with full hand-off history on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "team-roster",
    name: "Team Roster",
    tagline: "A searchable team directory",
    description:
      "Team Roster is a searchable employee directory built on the Hanzo stack — React 19, @hanzo/gui, Hanzo IAM, and Hanzo Base. Browse teammates as friendly avatar cards, filter by team, search across every field, and open anyone for their role, contact, and bio. Each person is an org-scoped row in Hanzo Base, so the directory stays private to your organization.",
    category: "Services",
    tags: ["Internal Tools"],
    keyHighlights: [
      { title: "Searchable avatar-card grid", body: "A fluid grid of avatar cards with a quick search bar spanning name, role, team, email, and bio, plus one-tap team filter pills. Team names and their colors are derived from the data — no separate table to maintain." },
      { title: "Profile, edit, and delete in one flow", body: "Open any card for a full profile with a color-accented header, email, and bio, then add, edit, or remove people inline. A single Route value drives all three views — list, profile, edit — with no router dependency." },
      { title: "Org-scoped by Hanzo Base", body: "The people collection is provisioned from schema.sql on publish; Base stamps owner+org from the verified IAM principal and applies the rule @request.auth.org_id = org, so teammates see the row and other orgs cannot." },
      { title: "PKCE sign-in with hanzo.id", body: "OAuth2 PKCE S256 against Hanzo IAM — no local passwords. The IAM access token is carried into every Base useQuery/useMutation, keeping reads and writes scoped to the signed-in user's org." },
      { title: "100% @hanzo/gui, one light surface", body: "Built entirely from Hanzo GUI (Tamagui) primitives with longhand props — no Tailwind, no second kit. Colored initials avatars render offline, and the whole app renders under a friendly light theme." },
      { title: "Real, buildable, CI-verified", body: "tsc --noEmit and vite build both pass, and GitHub Actions builds it green on every push. Fork it on hanzo.app and deploy as a static SPA to <slug>.hanzo.app." },
    ],
    about:
      "Team Roster is a friendly company directory — the kind of internal tool every team needs, shipped as a real, forkable Hanzo app. Vite + React 19 form the shell, @hanzo/gui provides a clean light UI built entirely from design-system primitives, Hanzo IAM handles PKCE sign-in against hanzo.id, and Hanzo Base stores the data org-scoped. A single people collection (name, role, team, email, avatar, bio) powers a searchable avatar-card grid, per-person profiles, and an inline add/edit/delete form — with teams and their colors derived automatically from your data, and no router or second UI kit anywhere.",
    perfectFor: [
      "Company and department directories",
      "Small-team who's-who pages",
      "Onboarding and org-chart references",
      "Community or member rosters",
      "Any internal people-search tool",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/team-roster.git",
    seoTitle: "Team Roster — Team Directory Template | Hanzo",
    seoDescription:
      "Fork Team Roster, a React + Hanzo searchable employee directory on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "booking-timeslot",
    name: "Cadence — Timeslot Booking",
    tagline: "Let clients book your time",
    description:
      "Cadence is a calm timeslot-booking scheduler on the Hanzo stack: publish the windows you're free as a calendar-style slot grid, let clients claim one with their name and email, and manage every reservation from an org-scoped dashboard. Booked slots are derived from the bookings themselves, so a taken window can never be double-booked. React 19 + @hanzo/gui for the UI, PKCE auth via hanzo.id, and Hanzo Base for storage — shipped as a real, buildable repo you fork and deploy.",
    category: "Services",
    tags: ["SaaS"],
    keyHighlights: [
      { title: "Calendar-ish slot grid", body: "Open windows are laid out as a calm agenda, one day per row with time pills across; pick a slot, add name, email and an optional note, and confirm — that writes one booking row." },
      { title: "Booked is derived, writes stay single", body: "A slot shows as taken only when a booking points at its id, so booking, cancelling and opening/closing are each one write and the slots and bookings collections can never disagree." },
      { title: "Availability editor built in", body: "Publish a slot from a date + start/end, toggle it open or closed, and remove it; a slot a client has already claimed is protected from deletion until you cancel its booking." },
      { title: "Org-scoped Hanzo Base storage", body: "slots and bookings are provisioned from schema.sql on deploy, stamped with the verified IAM owner and org, and scoped by the rule @request.auth.org_id = org so your org sees them and others can't." },
      { title: "Ambient Hanzo auth", body: "OAuth2 PKCE sign-in against hanzo.id with no local passwords; the IAM token is carried into Base so every read and write is scoped to your organization." },
      { title: "Real stack, ships as a repo", body: "React 19 + @hanzo/gui + @hanzo/iam + @hanzo/base under Vite, using Tamagui longhand props and Text-child button labels so it compiles green under tsc and vite in CI." },
    ],
    about:
      "Cadence turns your open time into a calm booking page. It is a complete example of the Hanzo app pattern — @hanzo/gui for the UI (Tamagui primitives, a single teal accent, no Tailwind), Hanzo IAM for identity, and Hanzo Base for org-scoped data — with two collections (slots, bookings) provisioned automatically from schema.sql on deploy. Three views cover the whole loop: a booking page that lays open slots out as a day-by-day agenda, a bookings list with cancel, and an availability editor to publish, open/close and remove windows. \"Booked\" is never stored twice — it is derived from whether a booking points at a slot — so every action is a single write and the two collections can't drift. It ships as a real repo (tsc + vite green in CI), not a mockup.",
    perfectFor: [
      "Consultants and coaches taking client calls",
      "Office hours, mentor slots and intro calls",
      "Demos and sales meetings booked from a shared calendar",
      "Studios and services offering appointment windows",
      "Any team that needs one calm, bookable schedule",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/booking-timeslot.git",
    seoTitle: "Cadence — Timeslot Booking Template | Hanzo",
    seoDescription:
      "Fork Cadence, a React + Hanzo timeslot-booking scheduler with a slot grid on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "proposal-quotewright",
    name: "Quotewright Proposals",
    tagline: "Build and share branded proposals",
    description:
      "Quotewright is a proposal and quoting tool for agencies and freelancers: draft line-item quotes, watch a totals sidebar tally subtotal, tax, and grand total in real time, then send clients a clean, invoice-style read-only link. Built on the Hanzo stack — React 19 with the @hanzo/gui design system, PKCE sign-in through Hanzo IAM, and org-scoped proposals and line items in Hanzo Base. Fork it, deploy on Hanzo Cloud, and start pricing work in minutes.",
    category: "SaaS",
    tags: ["Services"],
    keyHighlights: [
      { title: "Live totals sidebar", body: "Edit any line item's description, quantity, or price and the subtotal, 8% tax, and grand total recompute instantly in a sticky summary panel — no save round-trip, all derived from one money module." },
      { title: "Invoice-like shareable preview", body: "The read-only proposal renders as a light 'paper' document (a nested Tamagui light Theme inside the dark app chrome). Copy a real /p/<id> link that teammates in your org open read-only; other orgs can't see it." },
      { title: "100% @hanzo/gui, no Tailwind", body: "Every surface is built from Tamagui primitives (YStack, XStack, Button, Input, Theme, H1) using longhand style props, so it typechecks clean and renders under plain Vite with react-native-web — no second UI kit." },
      { title: "PKCE auth via Hanzo IAM", body: "OAuth2 PKCE S256 against hanzo.id — no local passwords. Tokens live in localStorage with silent refresh, and the IAM bearer flows straight into Hanzo Base for every read and write." },
      { title: "Org-scoped data from schema.sql", body: "Two Base collections (proposals + lineitems) are provisioned from schema.sql on deploy; every row is stamped owner+org and isolated by the rule @request.auth.org_id = org." },
      { title: "Ships green and reproducible", body: "tsc --noEmit and vite build both pass, in CI (GitHub Actions, ~31s) and on a clean reinstall with an identical output hash. The landing renders headless at 1280x800 with zero console errors." },
    ],
    about:
      "Quotewright is a lightweight proposal and quoting app for studios, agencies, consultants, and freelancers who need to price a scope of work and get it in front of a client fast. Create a proposal, add priced line items, set its status (draft, sent, accepted, declined), and share a polished read-only document instead of a spreadsheet. It is a real, forkable Hanzo-stack application — not a mockup — that deploys as a static SPA on Hanzo Cloud with its data plane provisioned automatically from schema.sql. The provider stack, vite.config, PKCE auth, and deploy contract are byte-identical to the canonical hanzo-starter, so what you fork is the proven integration seam with a genuinely different product on top.",
    perfectFor: [
      "Agencies and studios sending client proposals",
      "Freelancers and consultants quoting project scopes",
      "Teams replacing spreadsheet estimates with a real app",
      "Developers bootstrapping a quoting or billing SaaS on Hanzo",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/proposal-quotewright.git",
    seoTitle: "Quotewright — Proposal & Quoting Template | Hanzo",
    seoDescription:
      "Fork Quotewright, a React + Hanzo proposal and quoting tool with live totals on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "shop-storefront",
    name: "Shop Storefront",
    tagline: "A minimal product storefront",
    description:
      "A minimal, editorial product storefront on the Hanzo stack — a monochrome storefront grid, product detail, and cart backed by org-scoped Hanzo Base collections. Built entirely from @hanzo/gui primitives with PKCE sign-in via hanzo.id, it forks and deploys to hanzo.app as a static SPA. A clean starting point for a small catalogue, with a checkout stub ready to wire to Hanzo Commerce.",
    category: "Ecommerce",
    tags: ["Apps"],
    keyHighlights: [
      { title: "Three real shopping views", body: "Storefront grid, product detail, and cart — each a genuine @hanzo/gui surface with longhand Tamagui styling, not a static mockup. A stock-bounded quantity stepper and add-to-cart write straight to Base." },
      { title: "Org-scoped Base data", body: "products and cart_items are real Hanzo Base collections; every row is stamped owner+org and isolated to the signed-in user's organization via the @request.auth.org_id = org rule." },
      { title: "Ambient PKCE sign-in", body: "OAuth2 PKCE against hanzo.id with no local passwords; the IAM access token carries straight through to Base for every read and write." },
      { title: "Imagery from the design system", body: "Product art is generated — a paper ground, one ink mark, and an editorial index derived from the product name — so the catalogue looks art-directed with zero image assets. A real photo URL wins when present." },
      { title: "Seed-on-publish schema", body: "schema.sql provisions the two collections on deploy; an empty shop seeds a nine-object demo collection into Base with a single press." },
      { title: "Checkout stub, ready to wire", body: "Checkout clears the cart and is a clearly-marked stub — the one place to connect Hanzo Commerce for real orders." },
    ],
    about:
      "Shop Storefront (MONO) is a small editorial retail template: a monochrome catalogue of design objects with a storefront grid, product detail, and cart. It is built on the canonical Hanzo stack — Vite + React 19, @hanzo/gui for every pixel, PKCE auth via hanzo.id, and org-scoped Hanzo Base collections — and ships as a real, buildable repo you fork and deploy to your-slug.hanzo.app. It keeps the hanzo-starter provider stack, vite config, auth, and deploy contract identical, and adds a genuine three-view shopping flow on top.",
    perfectFor: [
      "A small brand or maker shipping a lookbook-style storefront",
      "Prototyping an org-scoped catalogue and cart on Hanzo Base",
      "A starting point before wiring Hanzo Commerce checkout",
      "Learning the @hanzo/gui + IAM + Base stack from a real ecommerce app",
      "Editorial, design-led product galleries",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/shop-storefront.git",
    seoTitle: "Shop Storefront — Product Storefront Template | Hanzo",
    seoDescription:
      "Fork Shop Storefront, a React + Hanzo monochrome storefront with grid, product and cart on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "digital-dropstore",
    name: "Digital Dropstore",
    tagline: "Sell digital downloads and drops",
    description:
      "Digital Dropstore is a real, buildable Hanzo-stack starter for selling digital downloads and drops — list products as bold poster cards, open a drop's detail page, and claim it to a personal library. It runs on Vite + React 19 with a hype, dark-first UI built entirely from @hanzo/gui, PKCE auth via @hanzo/iam against hanzo.id, and org-scoped @hanzo/base collections provisioned from schema.sql. Fork it on hanzo.app and deploy live on Hanzo Cloud with no server to run.",
    category: "Ecommerce",
    tags: ["Apps"],
    keyHighlights: [
      { title: "Hype drop aesthetic", body: "Dark-first cards, acid-lime accents, and bold typographic posters generated from each drop's name — no image assets, so the whole store renders offline and stays on-brand." },
      { title: "Three real views", body: "A storefront landing, a per-drop detail page with a claim/purchase stub, and a personal library that joins your claims against the catalog." },
      { title: "PKCE auth via hanzo.id", body: "Sign in with Hanzo IAM (OAuth2 PKCE S256) — no local passwords. The IAM access token flows straight into every Base query." },
      { title: "Org-scoped Base data", body: "drops and claims are Hanzo Base collections provisioned from schema.sql; every row is stamped owner+org and scoped to your org (rule @request.auth.org_id = org)." },
      { title: "100% @hanzo/gui", body: "Every surface is built from @hanzo/gui (Tamagui) primitives with longhand props through one Btn atom — one design system, no Tailwind, no second kit." },
      { title: "Static SPA, zero backend", body: "npm run build to dist/, served at <slug>.hanzo.app. Identity and data happen in the browser; there is no server process to run or scale." },
    ],
    about:
      "Digital Dropstore turns the canonical hanzo-starter into a streetwear-style storefront for digital goods. Sellers list drops — sound packs, presets, LUTs, UI kits, files — with a price and delivered file; buyers browse the org's lineup, open a drop, and claim it in a stubbed purchase that lands the item in their library. It keeps the starter's exact provider stack, vite.config, PKCE auth, and Base deploy contract, so it builds green and deploys on Hanzo Cloud unchanged, while the UI is a genuinely distinct hype-drop aesthetic: near-black canvas, acid-lime accents, and typographic posters generated from each drop's name (no image assets).",
    perfectFor: [
      "Selling digital downloads, presets, or templates",
      "Community drop stores and limited releases",
      "Creator and marketplace MVPs on the Hanzo stack",
      "Learning @hanzo/gui + IAM + Base end to end",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/digital-dropstore.git",
    seoTitle: "Digital Dropstore — Digital Downloads Template | Hanzo",
    seoDescription:
      "Fork Digital Dropstore, a React + Hanzo storefront for digital drops with a personal library on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "waitlist-launchpad",
    name: "Launchpad Waitlist",
    tagline: "Collect signups with a countdown",
    description:
      "Launchpad Waitlist is a dark, motion-rich launch landing page for collecting early-access signups. A live countdown, an animated signup counter, and a single email call to action sit over Hanzo IAM sign-in and an org-scoped Hanzo Base collection, with a signed-in admin dashboard to manage every signup. Fork it, set your launch date, and ship it live on Hanzo.",
    category: "Landing Page",
    tags: ["SaaS"],
    keyHighlights: [
      { title: "Live countdown to launch", body: "A real ticking countdown (days / hours / minutes / seconds) drives to your launch date. Set VITE_LAUNCH_AT to an ISO instant, or let it roll a 30-day window so a fresh fork is always live." },
      { title: "Animated signup counter", body: "The signup total eases up with a requestAnimationFrame count-up, reading the real count from Base — no fabricated numbers. A fresh list honestly reads \"Be the first in line.\"" },
      { title: "One focused call to action", body: "A single email field claims a spot, then rides Hanzo PKCE sign-in so every signup is written under a verified identity — no scattered buttons competing for the click." },
      { title: "Admin dashboard, private to your org", body: "The second view is the running total, the countdown, and every signup (email + join date) with add, filter, and remove — org-scoped in Hanzo Base by the @request.auth.org_id = org rule." },
      { title: "Real motion, no animation library", body: "The drifting aurora, hero entrance, and CTA glow are CSS keyframes applied through @hanzo/gui's className hatch and honor prefers-reduced-motion; the countdown and counter are plain interval + rAF." },
      { title: "100% @hanzo/gui, static-SPA deploy", body: "Every surface is Hanzo GUI primitives (no Tailwind, no second kit). npm run build → dist/ served at <slug>.hanzo.app; schema.sql provisions the signups collection on publish." },
    ],
    about:
      "Launchpad Waitlist is a pre-launch landing page built on the canonical Hanzo app stack — Vite + React 19, @hanzo/gui for UI, @hanzo/iam for PKCE auth against hanzo.id, and @hanzo/base for org-scoped data. The public landing captures emails behind a live countdown and an easing signup counter; the signed-in admin view manages the resulting signups collection with add, filter, and remove. It ships as a real, buildable repo you fork on hanzo.app and deploy live on Hanzo Cloud as a static SPA.",
    perfectFor: [
      "Pre-launch email capture for a new product or app",
      "Coming-soon pages with a hard launch date",
      "Invite-only or early-access waitlists",
      "Indie makers validating demand before building",
      "Founders who want signups private to their org",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/waitlist-launchpad.git",
    seoTitle: "Launchpad Waitlist — Signup Countdown Template | Hanzo",
    seoDescription:
      "Fork Launchpad, a React + Hanzo waitlist landing with a live countdown and admin dashboard on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "resume-curriculum",
    name: "Curriculum Resume",
    tagline: "A polished online resume",
    description:
      "Curriculum is a polished, print-friendly online resume built on the Hanzo stack. Sign in with Hanzo, structure your experience, projects and skills in the editor, and render one clean, typographic page you can share or print. Your resume lives in Hanzo Base, scoped to your org, and deploys as a static site on Hanzo Cloud.",
    category: "Resume",
    tags: ["Portfolio"],
    keyHighlights: [
      { title: "Two views, one system", body: "A typographic Resume (read + print) and an Editor, both built entirely from @hanzo/gui primitives — no Tailwind, no second UI kit. A pill toggle switches between them." },
      { title: "Print-ready by design", body: "A light paper theme, generous whitespace and an ATS-clean single column. Hit Print and the app hides its toolbar on beforeprint so one clean page prints alone, with a comfortable page margin." },
      { title: "Org-scoped data on Hanzo Base", body: "profile(name, title, summary) and entries(section, title, detail, when) are provisioned from schema.sql; every row is stamped owner+org and scoped by @request.auth.org_id = org, read and written through @hanzo/base/react." },
      { title: "Sign in with Hanzo (PKCE)", body: "OAuth2 PKCE S256 against hanzo.id via @hanzo/iam — no local passwords. The IAM access token is bridged into the Base client so all reads and writes are the signed-in user's." },
      { title: "Structured sections, auto-ordered", body: "Entries group under Experience, Projects, Skills and Education and render in a canonical reading order, with the header (name, role line, summary) on top." },
      { title: "Real, pinned stack — green in CI", body: "React 19.2.4, @hanzo/gui 7.3.0, @hanzo/iam 0.13.1, @hanzo/base 0.2.1, Vite 6, TypeScript 5.9.3. tsc --noEmit and vite build both pass, verified by GitHub Actions." },
    ],
    about:
      "A real, buildable resume app — not a static page. Two views over two Base collections: a typographic Resume that reads and prints like paper, and an Editor that upserts your header and adds line items under Experience, Projects, Skills and Education. Auth is OAuth2 PKCE against hanzo.id; data is org-scoped Hanzo Base provisioned from schema.sql. It is a faithful fork of the canonical hanzo-starter, so the provider stack, vite config, auth and deploy contract are identical to every other Hanzo app.",
    perfectFor: [
      "Job seekers who want an ATS-clean, print-ready resume",
      "Developers and designers publishing a personal CV they can update anytime",
      "Freelancers who need one shareable resume link per client org",
      "Anyone who wants a structured resume backed by real data, not a static file",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/resume-curriculum.git",
    seoTitle: "Curriculum Resume — Online Resume Template | Hanzo",
    seoDescription:
      "Fork Curriculum, a React + Hanzo print-ready online resume on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
  {
    slug: "bistro-site",
    name: "Bistro Site",
    tagline: "A warm restaurant website with menu",
    description:
      "Ember is a warm, wood-fired restaurant website built on the Hanzo stack: an editorial ember-and-cream landing with serif headings, a printed-carte menu, and a reservation-request form. The menu and reservations are real Hanzo Base collections, org-scoped through a Hanzo IAM sign-in, so a restaurant can publish its live carte and collect table requests. It ships as a static React 19 SPA that deploys to a hanzo.app subdomain with the schema auto-provisioned on publish.",
    category: "Websites",
    tags: ["Services"],
    keyHighlights: [
      { title: "Editorial dining design", body: "Warm ember-and-cream palette, serif display headings, a hero on a charred-ember gradient, and an inline wood-fire mark — built entirely from @hanzo/gui primitives with no Tailwind and no second UI kit." },
      { title: "Menu backed by Hanzo Base", body: "The dining carte reads from a menu_items collection grouped by section; a signed-in owner publishes dishes live, and a house menu stands in as the empty state until the kitchen goes live." },
      { title: "Reservation requests", body: "A name / party-size / when form writes to an org-scoped reservations collection — sending requires a Hanzo PKCE sign-in and each row is stamped owner+org, with a per-org list of your requests." },
      { title: "Ambient Hanzo IAM auth", body: "OAuth2 PKCE S256 against hanzo.id reading the client id from import.meta.env.VITE_HANZO_CLIENT_ID (fallback hanzo-app); tokens persist in localStorage and carry through to Base as the bearer." },
      { title: "One static SPA, one deploy contract", body: "Vite + React 19 builds to dist/ and serves at <slug>.hanzo.app with no server process; schema.sql is the databaseSchema that provisionBaseFromDDL turns into org-scoped collections on publish." },
      { title: "Green by CI", body: "tsc --noEmit and vite build both pass locally and in GitHub Actions (npm ci + typecheck + build on every push) — verified green on the first run." },
    ],
    about:
      "Bistro Site (\"Ember\") is a restaurant website template for the Hanzo app platform. It pairs a public, editorial storefront with two genuine data surfaces — a Base-backed dining menu and reservation requests — so a small venue gets a marketing site and a live back-of-house from a single fork. It is a real, buildable app (not a mockup): the same provider stack, vite.config, PKCE auth, and deploy contract as the canonical hanzo-starter, varied only in views, schema, and palette.",
    perfectFor: [
      "Restaurants, cafes, and bars that need a menu plus reservation requests",
      "Pop-ups, supper clubs, and residencies",
      "Any small venue wanting a public site with a live, editable menu",
      "Founders looking for a real Hanzo IAM + Base starter with warm, content-rich UI",
    ],
    framework: "React + Hanzo GUI",
    kind: "repo",
    featured: true,
    repo: "https://github.com/hanzo-apps/bistro-site.git",
    seoTitle: "Bistro Site — Restaurant Website Template | Hanzo",
    seoDescription:
      "Fork Ember, a React + Hanzo restaurant site with a live menu and reservation requests on org-scoped Base. Remix with AI and deploy on Hanzo.",
  },
];

/** The catalog — every real template, enriched and categorized. */
export const TEMPLATES: readonly TemplateEntry[] = RAW.map(entry);

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

const BY_SLUG = new Map<string, TemplateEntry>(TEMPLATES.map((t) => [t.slug, t]));

/** A single template by its slug, or undefined. */
export function getTemplate(slug: string): TemplateEntry | undefined {
  return BY_SLUG.get(slug);
}

/**
 * Templates in one category, in catalog order. Accepts either the taxonomy
 * label ("Developer Tools") or its slug ("developer-tools").
 */
export function templatesByCategory(cat: string): TemplateEntry[] {
  const c = cat.trim().toLowerCase();
  return TEMPLATES.filter(
    (t) => t.category.toLowerCase() === c || categorySlug(t.category) === c,
  );
}

/**
 * Related templates for a detail page: same primary category, excluding the
 * template itself, preferring ones that have a real preview shot. Catalog order
 * is preserved within each shot/no-shot group (stable sort). Returns up to `n`.
 */
export function relatedTemplates(slug: string, n = 4): TemplateEntry[] {
  const self = BY_SLUG.get(slug);
  if (!self) return [];
  const peers = TEMPLATES.filter(
    (t) => t.slug !== slug && t.category === self.category,
  );
  const ranked = [...peers].sort((a, b) => Number(b.hasShot) - Number(a.hasShot));
  return ranked.slice(0, n);
}

/** Count of templates that have a real self-hosted preview shot. */
export function templatesWithShots(): number {
  return TEMPLATES.reduce((n, t) => n + (t.hasShot ? 1 : 0), 0);
}
