// The live coding-session roster: what the org's machines are working on right
// now, and a terminal for each one.
//
// The data comes from api.hanzo.ai/v1/agents/sessions, read AS the signed-in
// user — the same registry `hanzo code` registers into. There is deliberately no
// route of our own in between: the registry and its org scoping live in the
// control plane, and a local endpoint would be a second place for them to
// disagree.

import { headers } from 'next/headers';
import { session } from '@/lib/iam';
import { listSessions } from '@/lib/sessions';
import { listMachines } from '@/lib/machines';
import { SessionBoard } from '@/components/sessions/board';
import { AppShell } from '@/components/app-shell';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sessions',
  description: 'Coding sessions running right now',
};

export default async function SessionsPage() {
  const me = await session({ headers: await headers() });

  if (!me) {
    return (
      <AppShell currentView="sessions">
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in to see the coding sessions running on your machines.
        </p>
      </main>
      </AppShell>
    );
  }

  let roster;
  let machines;
  let error: string | null = null;
  try {
    // Both planes, together: machines are the layout and sessions are what is on
    // them, so one failing makes the board wrong rather than partial.
    [roster, machines] = await Promise.all([
      listSessions(me.token),
      listMachines(me.token),
    ]);
  } catch (e) {
    // A roster that cannot be read is reported as such. Rendering an empty list
    // would say "nothing is running", which is a different and wrong claim.
    error = e instanceof Error ? e.message : 'could not reach the session registry';
  }

  return (
    <AppShell currentView="sessions">
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything running on {me.orgDisplay || me.org}&rsquo;s machines, by machine.
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
          <p className="font-medium">The session registry is unavailable.</p>
          <p className="mt-1 text-muted-foreground">{error}</p>
        </div>
      ) : (
        <SessionBoard sessions={roster!.sessions} machines={machines!.targets} />
      )}
    </main>
    </AppShell>
  );
}
