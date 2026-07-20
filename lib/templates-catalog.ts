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
  /** Fork source repo (github.com/hanzo-apps/<slug>). */
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

/** Authoring shape — mechanical fields (repo/preview/fork/hasShot) are derived. */
type RawEntry = Omit<TemplateEntry, "repo" | "previewUrl" | "fork" | "hasShot">;

function entry(raw: RawEntry): TemplateEntry {
  return {
    ...raw,
    repo: `https://github.com/hanzo-apps/${raw.slug}`,
    previewUrl: `https://gallery.hanzo.ai/templates/${raw.slug}`,
    fork: `/dev?template=hanzo-apps/${raw.slug}&action=edit`,
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
