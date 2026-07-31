// The live coding-session roster: what the org's machines are working on right
// now, and a terminal for each one.
//
// The data comes from api.hanzo.ai/v1/sessions, read AS the signed-in user. There
// is deliberately no route of our own in between: the roster, its TTL, and its
// org scoping all live in the control plane, and a local endpoint here would be a
// second place for them to disagree.

import { headers } from 'next/headers';
import { session } from '@/lib/iam';
import { listSessions } from '@/lib/sessions';
import { SessionBoard } from '@/components/sessions/board';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sessions',
  description: 'Coding sessions running right now',
};

export default async function SessionsPage() {
  const me = await session({ headers: await headers() });

  if (!me) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in to see the coding sessions running on your machines.
        </p>
      </main>
    );
  }

  let roster;
  let error: string | null = null;
  try {
    roster = await listSessions(me.token);
  } catch (e) {
    // A roster that cannot be read is reported as such. Rendering an empty list
    // would say "nothing is running", which is a different and wrong claim.
    error = e instanceof Error ? e.message : 'could not reach the session roster';
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Coding sessions running on {me.orgDisplay || me.org}&rsquo;s machines right now.
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
          <p className="font-medium">The session roster is unavailable.</p>
          <p className="mt-1 text-muted-foreground">{error}</p>
        </div>
      ) : (
        <SessionBoard
          sessions={roster!.sessions}
          ttlSeconds={roster!.ttlSeconds}
        />
      )}
    </main>
  );
}
