/**
 * Cloud templates client — the ONE client for the read-only Hanzo starter-kit
 * gallery (the real hanzoai/gallery catalog, ~69 templates).
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
  };
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
function titleize(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
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
 * Build the builder seed prompt from resolved template metadata. ONE place, so
 * the TemplateLoader preview and the actual generation seed can never drift.
 * `meta` may be null (unknown slug) — we still emit an honest, specific prompt
 * from the human-readable title rather than a bare slug.
 */
export function buildTemplateSeedPrompt(
  meta: TemplateSeedMeta | null,
  slug: string,
  mode: 'fork' | 'edit' | 'deploy',
): string {
  const title = meta?.displayName || titleize(slug);
  const spec = meta
    ? [
        `Recreate the "${title}" template as a polished, production-quality ${meta.category || 'web'} app.`,
        meta.description ? `Purpose: ${meta.description}` : '',
        meta.features.length ? `Must include: ${meta.features.join(', ')}.` : '',
        meta.framework ? `Reference stack/style: ${meta.framework}.` : '',
        meta.useCase ? `Use case: ${meta.useCase}.` : '',
        meta.screenshotUrl
          ? `Match the visual design shown in this reference screenshot: ${meta.screenshotUrl}`
          : '',
        'Make it fully responsive with clean, modern styling.',
      ]
        .filter(Boolean)
        .join(' ')
    : `Build a polished, production-quality app based on the "${title}" template. Make it fully responsive with clean, modern styling.`;
  return mode === 'deploy'
    ? `${spec} Then prepare it for one-click deploy to a live hanzo.app URL.`
    : spec;
}
