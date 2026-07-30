/**
 * The ONE project-status presentation — a dot color + label per ProjectStatus.
 *
 * Reserved-color law: live=green, building=amber, error=red, draft=neutral.
 * `emerald` is reserved for git-push and is NOT used here; `slate` (a blue cast)
 * is not part of the palette. Dashboard, landing, and the project cards all read
 * this ONE map so a failed deploy never looks like an untouched draft.
 */
import type { ProjectStatus } from '@/lib/api/projects';

export interface StatusPresentation {
  /** Label color (CSS color value). */
  text: string;
  /** Status-dot fill (CSS color value). */
  dot: string;
  label: string;
}

export const STATUS_CONFIG: Record<ProjectStatus, StatusPresentation> = {
  draft: { text: 'rgba(255,255,255,0.4)', dot: '#737373', label: 'Draft' },
  building: { text: '#fbbf24', dot: '#f59e0b', label: 'Building' },
  live: { text: '#4ade80', dot: '#22c55e', label: 'Live' },
  error: { text: '#f87171', dot: '#ef4444', label: 'Error' },
};

/** Presentation for any status string, falling back to draft. */
export function statusOf(status: string | undefined): StatusPresentation {
  return STATUS_CONFIG[(status as ProjectStatus)] ?? STATUS_CONFIG.draft;
}
