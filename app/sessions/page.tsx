// The live coding-session roster: what the org's machines are working on right
// now, and a terminal for each one.
//
// The data comes from api.hanzo.ai/v1/agents/sessions, read AS the signed-in
// user — the same registry `hanzo code` registers into. There is deliberately no
// route of our own in between: the registry and its org scoping live in the
// control plane, and a local endpoint would be a second place for them to
// disagree.
//
// This file is a SERVER component — it reads the request's IAM session — so it
// cannot render on @hanzo/gui: gui declares no client boundary and builds its
// contexts at module scope, and importing it here would evaluate that in RSC.
// The chrome it owns is a page frame and two paragraphs, so it says that in the
// one language a server component can speak: the app's own CSS variables. Every
// interactive surface below is in `components/sessions/*`, which IS a client
// component and IS written in gui props.

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
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

  // Signed out goes to sign-in, the same way every other authenticated page here
  // answers it. Rendering the shell instead put a whole navigation — Dashboard,
  // Projects, Connectors, Settings — in front of someone who cannot open any of
  // it, around a page with nothing on it. An invitation to sign in is not a
  // reason to draw the signed-in app.
  if (!me) redirect('/login');

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
    <main style={{ margin: '0 auto', width: '100%', maxWidth: '72rem', padding: '2.5rem 1.5rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 600, letterSpacing: '-0.025em' }}>
          Sessions
        </h1>
        <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', lineHeight: '1.25rem', color: 'var(--muted-foreground)' }}>
          Everything running on {me.orgDisplay || me.org}&rsquo;s machines, by machine.
        </p>
      </header>

      {error ? (
        <div
          style={{
            borderRadius: 'var(--radius)',
            border: '1px solid color-mix(in srgb, var(--destructive) 40%, transparent)',
            background: 'color-mix(in srgb, var(--destructive) 5%, transparent)',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
          }}
        >
          <p style={{ fontWeight: 500 }}>The session registry is unavailable.</p>
          <p style={{ marginTop: '0.25rem', color: 'var(--muted-foreground)' }}>{error}</p>
        </div>
      ) : (
        <SessionBoard sessions={roster!.sessions} machines={machines!.targets} />
      )}
    </main>
    </AppShell>
  );
}
