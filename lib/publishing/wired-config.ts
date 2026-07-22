/**
 * Wired-by-default config resolution.
 *
 * The org-scoped cloud projectsvc (GET /v1/projects/:slug) is the SINGLE source
 * of truth for a project's `analytics` flag (default true) and its Base data
 * `space` ("<org>/<slug>"). The static builder inherits both: the deployed site's
 * analytics beacon and Base submissions are driven by the project's fields — no
 * opt-in.
 *
 * Fail-open by design: when the cloud project can't be resolved (no bearer, no
 * slug link, backend unreachable), analytics stays wired ON — "wired by default"
 * — and the Base config is simply omitted (no space to bind).
 *
 * The server-only dependencies (cloud base URL, logger) are imported lazily
 * inside `resolveWiredConfig` so the pure mapper below carries no heavy import
 * graph and stays trivially unit-testable.
 */

import type { Deployment } from '@/lib/vfs/types';

export interface WiredConfig {
  /** Whether the analytics beacon is emitted (wired ON by default). */
  analyticsEnabled: boolean;
  /** The project's Base data space "<org>/<slug>", when known. */
  space?: string;
}

/**
 * The subset of the cloud projectView (cloud clients/projects toProjectView) the
 * builder reads: `analytics` (bool, default true) and `space` ("<org>/<slug>").
 */
export interface CloudProjectWired {
  analytics?: boolean;
  space?: string;
}

/**
 * Pure mapping from a cloud project to wired config. Analytics is ON unless the
 * project explicitly opted out (`analytics: false`); the space passes through
 * when present and non-empty.
 */
export function wiredConfigFromCloudProject(
  p: CloudProjectWired | null | undefined,
): WiredConfig {
  if (!p) return { analyticsEnabled: true };
  return {
    analyticsEnabled: p.analytics !== false,
    space: typeof p.space === 'string' && p.space.trim() ? p.space.trim() : undefined,
  };
}

/**
 * Resolve the wired config for a deployment from its cloud project. Needs the
 * project slug (deployment.slug) and the signed-in user's IAM bearer so the
 * org-scoped read authorizes; absent either, or on any error, returns the
 * wired-by-default fallback (analytics ON, no space).
 */
export async function resolveWiredConfig(
  deployment: Pick<Deployment, 'slug'>,
  opts: { bearer?: string } = {},
): Promise<WiredConfig> {
  const slug = deployment.slug?.trim();
  if (!slug || !opts.bearer) {
    return { analyticsEnabled: true };
  }
  const { cloudBase } = await import('@/lib/org/server');
  const { logger } = await import('@/lib/utils');
  try {
    const res = await fetch(`${cloudBase()}/v1/projects/${encodeURIComponent(slug)}`, {
      headers: { Authorization: `Bearer ${opts.bearer}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return { analyticsEnabled: true };
    const project = (await res.json()) as CloudProjectWired;
    return wiredConfigFromCloudProject(project);
  } catch (error) {
    logger.warn('[wired-config] cloud project resolve failed:', error);
    return { analyticsEnabled: true };
  }
}
