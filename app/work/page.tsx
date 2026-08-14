import type { Metadata } from 'next';

import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'Work',
  description: 'Tasks, inbox and handoffs, in the same window as chat and dev. Not built yet.',
};

/**
 * /work — the third mode of the one webapp (chat | dev | work).
 *
 * An honest shell: work mode (team tasks, inbox, projects-as-work) has not
 * shipped, and this page says so instead of faking a surface. It exists so the
 * mode switcher routes somewhere true.
 *
 * A server component (it exports `metadata`), so it cannot render on @hanzo/gui —
 * gui declares no client boundary and builds its contexts at module scope. Two
 * centred sentences do not need one: the app's own CSS variables say it.
 */
export default function WorkPage() {
  return (
    <AppShell currentView="work">
      <main style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 500, color: 'var(--foreground)' }}>
            Work mode is not built yet
          </h1>
          <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', lineHeight: '1.25rem', color: 'var(--muted-foreground)' }}>
            It will hold the tasks, the inbox and the handoffs between people, in the
            same window as chat and dev. Those two work today; this one does nothing
            yet.
          </p>
        </div>
      </main>
    </AppShell>
  );
}
