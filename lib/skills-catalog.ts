// The Hanzo agent-skills catalog — real data.
//
// Single source of truth is the master index the cloud publishes at
// `api.hanzo.ai/.well-known/agent-skills/index.json`: 528 skills across 161
// services, one SKILL.md body each. This module reads it SERVER-side, for the
// same reason /v1/catalog and /v1/gallery do — the gateway grants CORS to
// https://hanzo.app but to no other origin, so a browser fetch works in
// production and fails on localhost, which is the worst way for a thing to
// break.
//
// Consumers: /v1/skills/catalog (same-origin proxy) -> the Skills manager.
//
// DISTINCT from `/v1/skills`, which is the ORG-scoped registry (a caller's own
// skills plus activation flags, behind a validated principal). This catalog is
// public, unauthenticated and master-scoped: the menu, not the order.

const API_BASE = process.env.HANZO_API_BASE_URL || 'https://api.hanzo.ai';
const WELL_KNOWN = '/.well-known/agent-skills';

/** One entry of the master index. Every field is present on all 528 today. */
export interface CatalogSkill {
  name: string;
  description: string;
  /** Body location, relative to the well-known root: `admin_affiliates/SKILL.md`. */
  path: string;
  /** The capability family it belongs to: `admin`, `billing`, `iam`, … */
  service: string;
  version: string;
  sha256: string;
}

export interface SkillsCatalog {
  schema: string;
  scope: string;
  brand: string;
  count: number;
  skills: CatalogSkill[];
}

const EMPTY: SkillsCatalog = { schema: '', scope: '', brand: '', count: 0, skills: [] };

/**
 * A body path is used to build an upstream URL, so it is validated rather than
 * trusted: segments are plain names and the last one is the SKILL.md itself.
 * Without this, `..` in a segment would let a caller aim this proxy at any path
 * on the API host.
 */
export function isBodyPath(segments: string[]): boolean {
  return (
    segments.length > 0 &&
    segments.length <= 4 &&
    segments.every((s) => /^[A-Za-z0-9._-]+$/.test(s) && s !== '.' && s !== '..') &&
    segments[segments.length - 1]!.endsWith('.md')
  );
}

/**
 * Server-side: the live master index, normalised. Never throws — a catalog that
 * cannot be read is an empty one, and the manager still shows built-in and
 * custom skills.
 */
export async function getSkillsCatalog(): Promise<SkillsCatalog> {
  try {
    const res = await fetch(`${API_BASE}${WELL_KNOWN}/index.json`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return EMPTY;
    const raw = (await res.json()) as Partial<SkillsCatalog> & { skills?: CatalogSkill[] };
    const skills = Array.isArray(raw.skills) ? raw.skills : [];
    return {
      schema: String(raw.schema ?? ''),
      scope: String(raw.scope ?? ''),
      brand: String(raw.brand ?? ''),
      count: skills.length,
      skills,
    };
  } catch {
    return EMPTY;
  }
}

/** Server-side: one SKILL.md body, verbatim. Null when the upstream refuses it. */
export async function getSkillBody(segments: string[]): Promise<string | null> {
  if (!isBodyPath(segments)) return null;
  try {
    const res = await fetch(`${API_BASE}${WELL_KNOWN}/${segments.join('/')}`, {
      headers: { Accept: 'text/markdown, text/plain' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
