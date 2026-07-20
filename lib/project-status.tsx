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
  /** Tailwind text color for the label. */
  text: string;
  /** Tailwind fill/bg color for the status dot. */
  dot: string;
  label: string;
}

export const STATUS_CONFIG: Record<ProjectStatus, StatusPresentation> = {
  draft: { text: 'text-white/40', dot: 'bg-neutral-500', label: 'Draft' },
  building: { text: 'text-amber-400', dot: 'bg-amber-500', label: 'Building' },
  live: { text: 'text-green-400', dot: 'bg-green-500', label: 'Live' },
  error: { text: 'text-red-400', dot: 'bg-red-500', label: 'Error' },
};

/** Presentation for any status string, falling back to draft. */
export function statusOf(status: string | undefined): StatusPresentation {
  return STATUS_CONFIG[(status as ProjectStatus)] ?? STATUS_CONFIG.draft;
}
