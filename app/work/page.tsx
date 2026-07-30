import type { Metadata } from 'next';

import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'Work — Hanzo',
  description: 'Work mode is coming to hanzo.app.',
};

/**
 * /work — the third mode of the one webapp (chat | dev | work).
 *
 * An honest shell: work mode (team tasks, inbox, projects-as-work) has not
 * shipped, and this page says so instead of faking a surface. It exists so the
 * mode switcher routes somewhere true.
 */
export default function WorkPage() {
  return (
    <AppShell currentView="work">
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-medium text-foreground">Work mode is coming soon</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Chat and dev are live today. Work — tasks, inbox and team flow in the same
            shell — is being built and will land here.
          </p>
        </div>
      </main>
    </AppShell>
  );
}
