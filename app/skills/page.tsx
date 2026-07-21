'use client';

import { AppShell } from '@/components/app-shell';
import { SkillsView } from '@/components/views/skills-view';

/**
 * /skills — the deep-linkable Skills manager. Mirrors the in-app sidebar view
 * (content-area → SkillsView → SkillsManager) so the same manager is reachable
 * BOTH from the sidebar and a direct URL — exactly like `/templates` reuses
 * `TemplatesView`.
 *
 * Previously the sidebar's "Skills" item had a relative `path` with no top-level
 * `app/skills/page.tsx`; in browser mode the sidebar routed relative paths to `/`
 * (the marketing landing), so "Skills" dead-ended. This is the real, styled page
 * it now resolves to.
 */
export default function SkillsPage() {
  return (
    <AppShell currentView="skills">
      <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
        <SkillsView />
      </div>
    </AppShell>
  );
}
