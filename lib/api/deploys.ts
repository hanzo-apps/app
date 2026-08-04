/**
 * Deploys domain — presentation + ordering over the ONE deploy-history endpoint.
 *
 * Transport stays in lib/api/projects.ts (`listDeployments` → same-origin
 * `/v1/projects/:slug/deployments` BFF, forwarded with the caller's IAM bearer).
 * This module owns what a deploy ROW means: newest-first order, state
 * classification (semantic green/red only — in-flight is neutral, a spinner is
 * its signal), the servable URL for a row, and the short sha. Pure functions so
 * the mapping is unit-testable; no fabricated fields.
 */
import { listDeployments, type Deployment } from './projects';
import { STATUS_CONFIG } from '@/lib/project-status';

export type { Deployment };

/** Deploy history, newest first (createdAt desc, version desc tiebreak). */
export async function fetchDeploys(slug: string): Promise<Deployment[]> {
  const ds = await listDeployments(slug);
  return [...ds].sort((a, b) => b.createdAt - a.createdAt || b.version - a.version);
}

export interface DeployState {
  kind: 'live' | 'failed' | 'inflight' | 'unknown';
  label: string;
  /** Dot/label color. null = neutral — only live (green) and error (red) get a
   *  semantic color, read from the ONE status map (lib/project-status). */
  color: string | null;
}

export function stateOf(status: Deployment['status'] | string): DeployState {
  switch (status) {
    case 'live':
      return { kind: 'live', label: 'Live', color: STATUS_CONFIG.live.text };
    case 'error':
      return { kind: 'failed', label: 'Failed', color: STATUS_CONFIG.error.text };
    case 'queued':
    case 'building':
    case 'uploading':
      return {
        kind: 'inflight',
        label: status.charAt(0).toUpperCase() + status.slice(1),
        color: null,
      };
    default:
      return {
        kind: 'unknown',
        label: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown',
        color: null,
      };
  }
}

/** A deploy that has not settled — the section polls while one is in flight. */
export function inflight(d: Deployment): boolean {
  return stateOf(d.status).kind === 'inflight';
}

/**
 * The servable URL for one deploy row. Mirrors liveUrlOf (lib/api/projects): a
 * live row serves at the bare `<slug>.hanzo.app` (legacy two-label liveUrls
 * never resolve, so they are normalized away); a bound custom (non-hanzo.app)
 * domain is honored as-is. Anything not live has no public URL.
 */
export function urlOf(d: Deployment, slug: string): string | null {
  if (d.liveUrl && !d.liveUrl.includes('.hanzo.app')) return d.liveUrl;
  if (d.status === 'live') return `https://${slug}.hanzo.app`;
  return null;
}

/** Short (7-char) commit sha, or null when the deploy carries none. */
export function sha(commit?: string): string | null {
  const c = (commit ?? '').trim();
  return c ? c.slice(0, 7) : null;
}
