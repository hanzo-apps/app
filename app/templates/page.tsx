'use client';

import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { TemplatesView } from '@/components/views/templates-view';
import { builderLink } from '@/lib/api/projects';

/**
 * /templates — the deep-linkable Templates gallery. Mirrors the in-app sidebar
 * view (content-area → TemplatesView) so the same gallery is reachable BOTH by the
 * sidebar (client-side view switch) AND a direct URL. Previously `app/templates/`
 * held only per-template subroutes with no index page, so `/templates` 404'd.
 * Gallery cards fork into the builder via `/dev?template=…` internally; a selected
 * custom template opens in the builder at `/dev`.
 */
export default function TemplatesPage() {
  const router = useRouter();
  return (
    <AppShell currentView="templates">
      <TemplatesView
        onProjectSelect={(project) => router.push(builderLink(project.id))}
        onNavigate={(view) => router.push(view.startsWith('/') ? view : `/${view}`)}
      />
    </AppShell>
  );
}
