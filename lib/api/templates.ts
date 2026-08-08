/**
 * Cloud templates client — the ONE client for the read-only Hanzo starter-kit
 * gallery (the real hanzoai/gallery catalog). ONE entry per template: the
 * format/page/theme shapes it ships in are `variants` inside the entry, not
 * sibling cards.
 *
 * Talks to the SAME-ORIGIN `/v1/templates` BFF (app/v1/templates/[[...path]]),
 * which forwards to the cloud `/v1/templates` catalog. This surface is PUBLIC
 * reference content: no bearer, no org, no per-user data. Selecting a card seeds
 * the builder through the existing `/dev?template=<source>` wire.
 *
 * Shape mirrors cloud clients/templates.Template exactly. We normalize defensively
 * (drop any card with no slug/title/source so a browse row is never dead) and,
 * when the gallery is unreachable or empty, fall back to a small HONEST set of
 * built-in starters (clearly flagged `live:false` so the UI can say so) rather
 * than fabricate cards or crash.
 */

import type { Page } from '@/types';

// --- Type (cloud clients/templates.Template) ---

export interface GalleryTemplate {
  slug: string;
  title: string;
  category: string;
  description: string;
  framework: string;
  features: string[];
  useCase: string;
  /** The value handed to `/dev?template=<source>` (fork/deploy provenance). */
  source: string;
  /** Screenshot URL (gallery.hanzo.ai), may be empty. */
  preview: string;
  rating?: number;
  tier?: number;
  /** Live demo (<slug>.hanzo.app), when one is deployed. */
  demo?: string;
  /** The shapes this template ships in — format/page/theme, picked at fork time. */
  variants?: GalleryVariant[];
}

/** One shape of a template (cloud clients/templates.Variant). */
export interface GalleryVariant {
  id: string;
  label: string;
  /** The axis it varies: format | page | theme. */
  kind: string;
  framework?: string;
  source: string;
}

export interface GalleryResult {
  templates: GalleryTemplate[];
  /** True when served from the live cloud gallery; false for the local fallback. */
  live: boolean;
}

/**
 * Honest fallback — a few real built-in starters shipped in the app itself
 * (app/templates/*). Shown ONLY when the live gallery is unreachable/empty, with
 * a banner saying so. NOT fabricated marketing — these are actual starters, and
 * their `source` uses the same gallery pattern the live catalog does.
 */
export const LOCAL_FALLBACK: GalleryTemplate[] = [
  {
    slug: 'saas-landing',
    title: 'SaaS Landing',
    category: 'Marketing',
    description: 'Modern SaaS landing page with pricing tiers and a hero CTA.',
    framework: 'Next.js + TS',
    features: ['Hero', 'Pricing', 'Responsive'],
    useCase: 'Product launch sites',
    source: 'https://gallery.hanzo.ai/templates/saas-landing',
    preview: '',
  },
  {
    slug: 'ai-chat-interface',
    title: 'AI Chat Interface',
    category: 'AI',
    description: 'Streaming chat UI with conversation history, ready to wire to a model.',
    framework: 'Next.js + TS',
    features: ['Chat', 'Streaming', 'History'],
    useCase: 'AI assistants',
    source: 'https://gallery.hanzo.ai/templates/ai-chat-interface',
    preview: '',
  },
  {
    slug: 'analytics-dashboard',
    title: 'Analytics Dashboard',
    category: 'Dashboard',
    description: 'Data-viz dashboard with charts, KPI tiles, and a responsive grid.',
    framework: 'Next.js + TS',
    features: ['Charts', 'KPIs', 'Responsive'],
    useCase: 'Internal tools',
    source: 'https://gallery.hanzo.ai/templates/analytics-dashboard',
    preview: '',
  },
  {
    slug: 'ecommerce-storefront',
    title: 'E-commerce Storefront',
    category: 'Commerce',
    description: 'Storefront with product grid, cart, and checkout scaffolding.',
    framework: 'Next.js + TS',
    features: ['Catalog', 'Cart', 'Checkout'],
    useCase: 'Online stores',
    source: 'https://gallery.hanzo.ai/templates/ecommerce-storefront',
    preview: '',
  },
  {
    slug: 'blog-platform',
    title: 'Blog Platform',
    category: 'Content',
    description: 'Content-driven blog with post list, detail pages, and markdown.',
    framework: 'Next.js + TS',
    features: ['Markdown', 'Posts', 'SEO'],
    useCase: 'Publishing',
    source: 'https://gallery.hanzo.ai/templates/blog-platform',
    preview: '',
  },
  {
    slug: 'kanban-board',
    title: 'Kanban Board',
    category: 'Productivity',
    description: 'Drag-and-drop task board with columns and cards.',
    framework: 'Next.js + TS',
    features: ['Drag & Drop', 'Columns', 'Tasks'],
    useCase: 'Project management',
    source: 'https://gallery.hanzo.ai/templates/kanban-board',
    preview: '',
  },
];

// --- Normalizer ---

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

/** Coerce one raw catalog entry; return null to drop a dead/incomplete card. */
export function normalizeTemplate(raw: unknown): GalleryTemplate | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const slug = str(r.slug).trim();
  const title = str(r.title).trim();
  const source = str(r.source).trim();
  // A card must be selectable: no slug/title/source ⇒ it can't seed the builder.
  if (!slug || !title || !source) return null;
  return {
    slug,
    title,
    category: str(r.category) || 'Template',
    description: str(r.description),
    framework: str(r.framework),
    features: strArray(r.features),
    useCase: str(r.useCase),
    source,
    preview: str(r.preview),
    rating: num(r.rating),
    tier: num(r.tier),
    demo: str(r.demo),
    variants: normalizeVariants(r.variants),
  };
}

/** Coerce a template's variants; drop any that could not be selected. */
function normalizeVariants(v: unknown): GalleryVariant[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((raw) => {
    const x = (raw ?? {}) as Record<string, unknown>;
    const id = str(x.id).trim();
    const source = str(x.source).trim();
    return id && source
      ? [{ id, label: str(x.label) || id, kind: str(x.kind), framework: str(x.framework), source }]
      : [];
  });
}

// --- API ---

/**
 * Fetch the live gallery via the same-origin BFF. Always resolves (never throws):
 * on any failure — network, non-2xx, malformed JSON, or an empty catalog — it
 * returns the honest local fallback with `live:false` so the picker still works
 * and can show a "gallery unreachable" banner.
 */
export async function fetchGalleryTemplates(): Promise<GalleryResult> {
  try {
    const res = await fetch('/v1/templates', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return { templates: LOCAL_FALLBACK, live: false };
    const body: unknown = await res.json();
    const rows = (body as { data?: unknown })?.data;
    if (!Array.isArray(rows)) return { templates: LOCAL_FALLBACK, live: false };
    const templates = rows
      .map(normalizeTemplate)
      .filter((t): t is GalleryTemplate => t !== null);
    if (templates.length === 0) return { templates: LOCAL_FALLBACK, live: false };
    return { templates, live: true };
  } catch {
    return { templates: LOCAL_FALLBACK, live: false };
  }
}

/** The builder deep-link a selected template seeds (existing /dev?template= wire). */
export function templateBuilderLink(source: string): string {
  return `/dev?template=${encodeURIComponent(source)}&action=deploy`;
}

/**
 * A template's REAL, editable pages from the same-origin BFF
 * (`/v1/templates/:slug/pages`). This is what lets `/dev?template=…&action=edit`
 * OPEN the template — its own markup in the preview, before and without any AI
 * call — so the first thing the user sees is the template they clicked.
 *
 * `null` means the template publishes no source. It never means "close enough":
 * the endpoint refuses to answer this question with a screenshot, so a null here
 * is the caller's cue to say out loud that it is recreating the template rather
 * than opening it.
 */
export async function fetchTemplatePages(slug: string): Promise<Page[] | null> {
  const clean = (slug || '').trim();
  if (!clean) return null;
  try {
    const res = await fetch(`/v1/templates/${encodeURIComponent(clean)}/pages`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { pages?: unknown };
    const rows = Array.isArray(body?.pages) ? body.pages : [];
    const pages = rows.filter(
      (p): p is Page =>
        !!p &&
        typeof p === 'object' &&
        typeof (p as Page).path === 'string' &&
        typeof (p as Page).html === 'string' &&
        (p as Page).html.trim().length > 0,
    );
    return pages.length ? pages : null;
  } catch {
    return null;
  }
}

/**
 * The slugs whose SOURCE the platform actually publishes.
 *
 * Two catalogs answer about templates and they do not agree. `/v1/gallery` is
 * the shop window — 72 rows, screenshots, descriptions — and `/v1/templates` is
 * the warehouse, 63 rows, the only ones whose `/pages` returns anything.
 * Measured 2026-08-08: 43 of the 72 on display are NOT in the warehouse, and 34
 * in the warehouse are not on display. `beta-variant`, `cipher-html` and
 * `folio-contact` are on the shelf; `GET /v1/templates/kalli/pages` is 404.
 *
 * The builder already handles the miss honestly — it says the template does not
 * publish its source and rebuilds from the description. But by then the person
 * has chosen a screenshot and committed to a remix, and what they get is an AI
 * recreation of the picture they picked. This moves that sentence EARLIER, to
 * the card, which is where the choice is actually made.
 *
 * FAILS OPEN, and that is the whole reason it returns a Set rather than a
 * predicate: an empty Set marks nothing. If the warehouse is unreachable the
 * gallery must not accuse all 72 of having no source — a wrong label on a good
 * template is worse than no label on a bad one.
 *
 * The real fix is cloud reconciling the two catalogs; until then this is the
 * app declining to promise what it cannot deliver.
 */
export async function fetchPublishedSlugs(): Promise<Set<string>> {
  // `fetchGalleryTemplates` already asks the warehouse and normalises its rows.
  // Asking it a second way here would be a second answer to maintain — and its
  // `live` flag is exactly the distinction this needs: false means the warehouse
  // did not speak, which must mark NOTHING.
  const { templates, live } = await fetchGalleryTemplates();
  return live ? new Set(templates.map((t) => t.slug)) : new Set();
}

// --- Seed resolution (the ONE way /dev turns a template slug into a real seed) ---

/** Normalized metadata used to seed the builder from a template, regardless of
 *  which gallery surface (/new or /gallery) linked into /dev. */
export interface TemplateSeedMeta {
  slug: string;
  displayName: string;
  description: string;
  category: string;
  framework: string;
  features: string[];
  useCase: string;
  /** Preview screenshot URL (may be empty). */
  screenshotUrl: string;
}

/** Human title from a slug when a catalog title is missing ("bento-cards-v1" → "Bento Cards V1"). */
export function titleize(slug: string): string {
  return slug.replace(/[-/]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Resolve a template slug to seed metadata from whichever catalog knows it.
 *
 * The builder is reached from TWO gallery surfaces with DIFFERENT slug schemes:
 *   • /new  → cards from the cloud `/v1/templates` catalog (e.g. `brainwave`)
 *   • /gallery / dev-onboarding → the `/v1/gallery` snapshot (e.g. `synapse`)
 * Both funnel through `/dev?template=…`, so a single-catalog lookup silently
 * failed for every slug that lives only in the other catalog (the builder then
 * fell back to a generic "based on the <slug> template" seed with no preview,
 * no features, no framework). We check BOTH — the cloud catalog first (what
 * /new uses), then the snapshot — so all templates seed from real fields.
 *
 * Never throws; returns null only when neither catalog knows the slug.
 */
export async function resolveTemplateSeedMeta(slug: string): Promise<TemplateSeedMeta | null> {
  const clean = slug.trim();
  if (!clean) return null;

  // Cloud catalog (the one /new renders) — single-template endpoint, 404 if absent.
  try {
    const res = await fetch(`/v1/templates/${encodeURIComponent(clean)}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const t = (await res.json()) as Record<string, unknown>;
      if (t && typeof t === 'object' && (str(t.slug) || str(t.title))) {
        return {
          slug: str(t.slug) || clean,
          displayName: str(t.title) || titleize(clean),
          description: str(t.description),
          category: str(t.category),
          framework: str(t.framework),
          features: strArray(t.features),
          useCase: str(t.useCase),
          screenshotUrl: str(t.preview),
        };
      }
    }
  } catch {
    // fall through to the snapshot catalog
  }

  // Snapshot catalog (the one /gallery + dev-onboarding render).
  try {
    const res = await fetch('/v1/gallery', { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const body = (await res.json()) as { templates?: unknown };
      const rows = Array.isArray(body?.templates) ? body.templates : [];
      const g = rows.find(
        (x): x is Record<string, unknown> =>
          !!x && typeof x === 'object' && str((x as Record<string, unknown>).slug) === clean,
      );
      if (g) {
        return {
          slug: str(g.slug) || clean,
          displayName: str(g.displayName) || titleize(clean),
          description: str(g.description),
          category: str(g.category),
          framework: str(g.framework),
          features: strArray(g.features),
          useCase: str(g.useCase),
          screenshotUrl: str(g.screenshotUrl),
        };
      }
    }
  } catch {
    // neither catalog reachable
  }

  return null;
}

/**
 * The design brief for a template that publishes NO source — the only situation
 * in which the builder writes a template instead of opening one.
 *
 * Its sibling `buildTemplateSeedPrompt` is for the opposite case, and the two must
 * not be confused: that one frames the first change on top of a template that is
 * already loaded ("it's already built and running in the live preview"), while
 * this one is a genuine recreation from a description. Handing the wrong one to
 * the model is how a template got silently reinvented; keeping them apart, named
 * for what they assume, is what makes the mistake visible.
 *
 * The caller is expected to TELL the user when it uses this one.
 */
export function templateBrief(meta: TemplateSeedMeta | null, slug: string): string {
  const title = meta?.displayName || titleize(slug);
  if (!meta) {
    return (
      `Build the primary, self-contained, responsive landing page for "${title}" — one polished view ` +
      `with real navigation, a hero/summary, content cards or sections, and a footer. Modern, production-quality, dark-mode friendly.`
    );
  }
  const cat = meta.category || 'modern';
  const desc = meta.description ? ` ${meta.description}` : '';
  const use = meta.useCase ? ` It is used for: ${meta.useCase}.` : '';
  const feats = meta.features?.length ? ` Include these areas: ${meta.features.join(', ')}.` : '';
  return (
    `Build the primary landing page for "${title}" — a ${cat} app.${desc}${use}${feats} ` +
    `Design ONE polished, self-contained, fully responsive page (the main ${cat.toLowerCase()} view): ` +
    `real navigation, a hero/summary, KPI or content cards, charts or sections, and a footer. ` +
    `Production-quality, modern, dark-mode friendly, realistic placeholder content (no lorem).`
  );
}

/**
 * Build the builder seed prompt from resolved template metadata. ONE place, so
 * the TemplateLoader preview and the actual generation seed can never drift.
 * `meta` may be null (unknown slug) — we still emit an honest, specific prompt
 * from the human-readable title rather than a bare slug.
 */
export function buildTemplateSeedPrompt(
  meta: TemplateSeedMeta | null,
  slug: string,
  mode: 'fork' | 'edit' | 'deploy',
  userMessage?: string,
): string {
  const title = meta?.displayName || titleize(slug);
  const ask = (userMessage || '').trim();
  // A template is a READY-TO-GO starting point, not a spec to "recreate". Its files
  // load and the preview renders immediately; this prompt only frames the FIRST
  // change the user wants built ON TOP. Never instruct a rebuild-from-scratch.
  const context = meta
    ? [
        `You're starting from the "${title}" template${meta.category ? ` (${meta.category})` : ''} — it's already built and running in the live preview.`,
        meta.description || '',
        meta.framework ? `Stack: ${meta.framework}.` : '',
      ]
        .filter(Boolean)
        .join(' ')
    : `You're starting from the "${title}" template — it's already built and running in the live preview.`;
  const instruction = ask
    ? `${context} Build on top of it — apply this change: ${ask}`
    : `${context} Keep its structure and styling; make changes only when I ask.`;
  return mode === 'deploy'
    ? `${instruction} When it's ready, prepare it for one-click deploy to a live hanzo.app URL.`
    : instruction;
}
