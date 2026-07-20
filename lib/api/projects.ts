/**
 * Cloud projects client — the ONE client for the org-scoped shared store.
 *
 * Talks to the SAME-ORIGIN `/v1/projects` BFF (app/v1/projects/[[...path]]),
 * which forwards to the cloud projectsvc as the signed-in user. The org is
 * derived server-side from the bearer owner claim, so every record is org-scoped
 * and billed to the right org — and the httpOnly `hanzo_token` is NEVER read by
 * browser JS (the cookie rides the same-origin request; least privilege).
 *
 * Shape mirrors the projectsvc CONTRACT.md exactly (name + slug + framework +
 * status + liveUrl) so hanzo.app and console.hanzo.ai render the SAME records
 * from the SAME store. No fabricated fields (no cpu/memory/region mock).
 */

// --- Types (projectsvc CONTRACT.md) ---

export type ProjectStatus = 'draft' | 'building' | 'live' | 'error';

export type Framework =
  | 'static'
  | 'vite'
  | 'next'
  | 'react'
  | 'astro'
  | 'svelte'
  | 'vue'
  | 'remix'
  | 'nuxt';

export interface ProjectRepo {
  url?: string;
  branch?: string;
  provider?: string;
}

export interface Project {
  id: string;
  org: string;
  slug: string;
  name: string;
  description?: string;
  repo: ProjectRepo;
  framework: string;
  status: ProjectStatus;
  liveUrl?: string;
  bucket?: string;
  currentDeploymentId?: string;
  createdAt: number; // unix seconds
  updatedAt: number;
}

export interface Deployment {
  id: string;
  projectId: string;
  version: number;
  status: 'queued' | 'building' | 'uploading' | 'live' | 'error';
  source: 'upload' | 'git';
  commit?: string;
  liveUrl?: string;
  files: number;
  bytes: number;
  message?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateProjectPayload {
  name: string;
  slug?: string;
  description?: string;
  framework?: string;
  repo?: { url?: string; branch?: string };
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  framework?: string;
  repo?: { url?: string; branch?: string };
}

// --- Constants ---

export const FRAMEWORKS: { value: Framework; label: string }[] = [
  { value: 'static', label: 'Static (no build)' },
  { value: 'next', label: 'Next.js' },
  { value: 'react', label: 'React' },
  { value: 'vite', label: 'Vite' },
  { value: 'astro', label: 'Astro' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'vue', label: 'Vue' },
  { value: 'remix', label: 'Remix' },
  { value: 'nuxt', label: 'Nuxt' },
];

// --- Transport (same-origin BFF; cookie carries auth) ---

import { currentOrg } from '@/lib/org-scope';

const BASE = '/v1/projects';

/** Stamp the selected org as X-Org-Id (console2's baseHeaders pattern). Honored
 *  server-side only for a global admin; ignored for a normal user (owner-pinned). */
function orgHeader(): Record<string, string> {
  const org = currentOrg();
  return org ? { 'X-Org-Id': org } : {};
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { Accept: 'application/json', ...orgHeader(), ...(init?.headers || {}) },
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      msg = body?.error || body?.msg || msg;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// --- API ---

export async function fetchProjects(): Promise<Project[]> {
  return req<Project[]>('');
}

export async function fetchProject(slug: string): Promise<Project> {
  return req<Project>(`/${encodeURIComponent(slug)}`);
}

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  return req<Project>('', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function updateProject(
  slug: string,
  payload: UpdateProjectPayload,
): Promise<Project> {
  return req<Project>(`/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteProject(slug: string): Promise<void> {
  return req<void>(`/${encodeURIComponent(slug)}`, { method: 'DELETE' });
}

export async function listDeployments(slug: string): Promise<Deployment[]> {
  return req<Deployment[]>(`/${encodeURIComponent(slug)}/deployments`);
}

/**
 * The stable deep-link that opens a project in the builder (console can link
 * here). With the org known it is the canonical nice URL
 * (`/dev/<org>/<slug>`); without it, the legacy query form — which /dev
 * canonicalizes to the nice URL once the record resolves.
 */
export function builderLink(slug: string, org?: string | null): string {
  const o = (org || '').trim();
  if (o) return `/dev/${encodeURIComponent(o)}/${encodeURIComponent(slug)}`;
  return `/dev?project=${encodeURIComponent(slug)}`;
}

/**
 * The SERVABLE live-site URL for a project. A published site is served at the
 * bare `<slug>.hanzo.app` (the one host a wildcard Ingress + wildcard cert can
 * actually route/secure). Records published before the cloud fix carry a legacy
 * two-label `liveUrl` (`<slug>.<org>.hanzo.app`) that never resolves — so for a
 * live project we ALWAYS return the bare host, normalizing any legacy value.
 * A non-hanzo liveUrl (a bound custom domain) is honored as-is. Draft with no
 * liveUrl → null.
 */
export function liveUrlOf(p: Pick<Project, 'slug' | 'status' | 'liveUrl'>): string | null {
  if (p.status === 'live') return `https://${p.slug}.hanzo.app`;
  // Not live: only a bound CUSTOM (non-hanzo.app) domain is a real public URL.
  if (p.liveUrl && !p.liveUrl.includes('.hanzo.app')) return p.liveUrl;
  return null;
}

/**
 * The deployed site's editable pages, reconstructed server-side from the live
 * deployment (same-origin BFF /v1/apps/:slug/site). This is what lets an
 * existing project open IN the editor with its real content on any device.
 */
export async function fetchProjectSite(
  slug: string,
): Promise<{ liveUrl: string | null; pages: { path: string; html: string }[] }> {
  const res = await fetch(`/v1/apps/${encodeURIComponent(slug)}/site`, {
    credentials: 'include',
    headers: { Accept: 'application/json', ...orgHeader() },
    cache: 'no-store',
  });
  if (!res.ok) return { liveUrl: null, pages: [] };
  const data = await res.json().catch(() => null);
  return {
    liveUrl: typeof data?.liveUrl === 'string' ? data.liveUrl : null,
    pages: Array.isArray(data?.pages) ? data.pages : [],
  };
}
