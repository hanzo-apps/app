/**
 * Gallery templates client — the ONE client for the real starter-kit catalog.
 *
 * Fetches the SAME-ORIGIN `/v1/templates` BFF (app/v1/templates/[[...path]]),
 * which forwards to the cloud `clients/templates` surface: the 69-strong
 * hanzoai/gallery catalog that console.hanzo.ai also consumes. These are the REAL
 * starter kits — never fabricated. When the endpoint is unreachable we degrade to
 * a small honest LOCAL_FALLBACK set (the built-in scaffolds) so the picker still
 * renders something real instead of crashing.
 *
 * Shape mirrors the cloud `templates.Template` struct exactly.
 */

/** One starter kit, exactly as cloud `/v1/templates` serves it. */
export interface GalleryTemplate {
  slug: string;
  title: string;
  category: string;
  description: string;
  framework: string;
  features: string[];
  useCase: string;
  tier?: number;
  rating?: number;
  source: string;
  preview: string;
  /** True when this entry is the offline fallback, not the live gallery. */
  fallback?: boolean;
}

/** The cloud list envelope: {data:[Template]}. */
interface TemplatesEnvelope {
  data?: unknown;
}

/**
 * A tiny, honest fallback drawn from the built-in scaffolds. Shown ONLY when the
 * live gallery is unreachable — real, deployable starters, not placeholder cards.
 */
export const LOCAL_FALLBACK: GalleryTemplate[] = [
  {
    slug: 'nextjs-hanzo-ui',
    title: 'Next.js App Router + @hanzo/ui',
    category: 'App',
    description:
      'Modern Next.js app with App Router, TypeScript, Tailwind CSS, and @hanzo/ui components.',
    framework: 'Next.js',
    features: ['App Router', 'TypeScript', 'Tailwind', '@hanzo/ui'],
    useCase: 'Full-stack apps',
    source: '',
    preview: '',
    fallback: true,
  },
  {
    slug: 'vite-react-hanzo-ui',
    title: 'Vite + React + @hanzo/ui',
    category: 'App',
    description: 'Fast Vite SPA with React, TypeScript, Tailwind CSS, and @hanzo/ui components.',
    framework: 'Vite',
    features: ['Vite', 'React', 'TypeScript', '@hanzo/ui'],
    useCase: 'Single-page apps',
    source: '',
    preview: '',
    fallback: true,
  },
  {
    slug: 'static-landing',
    title: 'Static Landing Page',
    category: 'Marketing',
    description: 'A zero-build static HTML + Tailwind landing page you can edit and ship instantly.',
    framework: 'Static',
    features: ['No build', 'Tailwind', 'Responsive'],
    useCase: 'Landing pages',
    source: '',
    preview: '',
    fallback: true,
  },
];

const isString = (v: unknown): v is string => typeof v === 'string';

/** Defensive normalizer: drop any row without a slug/title so no card is dead. */
function normalize(raw: unknown): GalleryTemplate | null {
  if (!raw || typeof raw !== 'object') return null;
  const t = raw as Record<string, unknown>;
  const slug = isString(t.slug) ? t.slug : '';
  const title = isString(t.title) ? t.title : '';
  if (!slug || !title) return null;
  return {
    slug,
    title,
    category: isString(t.category) ? t.category : '',
    description: isString(t.description) ? t.description : '',
    framework: isString(t.framework) ? t.framework : '',
    features: Array.isArray(t.features) ? t.features.filter(isString) : [],
    useCase: isString(t.useCase) ? t.useCase : '',
    tier: typeof t.tier === 'number' ? t.tier : undefined,
    rating: typeof t.rating === 'number' ? t.rating : undefined,
    source: isString(t.source) ? t.source : '',
    preview: isString(t.preview) ? t.preview : '',
  };
}

/**
 * Fetch the live gallery catalog from `/v1/templates`. Returns
 * `{ templates, live }`: `live: false` means we fell back to LOCAL_FALLBACK
 * (endpoint unreachable / empty / malformed) — the caller surfaces that honestly.
 */
export async function fetchGalleryTemplates(
  signal?: AbortSignal,
): Promise<{ templates: GalleryTemplate[]; live: boolean }> {
  try {
    const res = await fetch('/v1/templates', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal,
    });
    if (!res.ok) return { templates: LOCAL_FALLBACK, live: false };
    const body = (await res.json()) as TemplatesEnvelope;
    const list = Array.isArray(body?.data) ? body.data : [];
    const templates = list.map(normalize).filter((t): t is GalleryTemplate => t !== null);
    if (templates.length === 0) return { templates: LOCAL_FALLBACK, live: false };
    return { templates, live: true };
  } catch {
    return { templates: LOCAL_FALLBACK, live: false };
  }
}

/**
 * The stable deep-link that opens a gallery template in the builder — blue's
 * existing `/dev?template=` wire (the builder reads `?template=` + `?action`).
 * A live template carries its gallery `source`; a fallback carries only its slug.
 */
export function templateBuilderLink(t: GalleryTemplate): string {
  const ref = t.source || t.slug;
  return `/dev?template=${encodeURIComponent(ref)}&action=deploy`;
}
