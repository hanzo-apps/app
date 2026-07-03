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

/** The stable deep-link that opens a project in the builder (console can link here). */
export function builderLink(slug: string): string {
  return `/dev?project=${encodeURIComponent(slug)}`;
}
