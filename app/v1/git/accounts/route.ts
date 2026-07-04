/**
 * /v1/git/accounts — the signed-in user's connected Git accounts, across
 * providers, plus each provider's connectability.
 *
 * GET → `{ connected, accounts: GitAccount[], providers: GitProviderStatus[] }`.
 *   - `accounts` is the aggregate of every linked provider (GitHub user + orgs,
 *     GitLab user). Empty ⇒ nothing linked (drives the honest "Connect" CTA —
 *     NEVER fabricated rows).
 *   - `providers` reports which providers can be connected right now. GitHub is
 *     always live; GitLab is `connectable: false, reason: 'needs-setup'` until
 *     its OAuth app + IAM provider are configured (operator flips
 *     `GITLAB_CONNECT_ENABLED`). No dead clicks.
 *
 * Provider tokens are resolved from IAM server-side (the user's own bearer) and
 * used only here — never returned to the browser. Per-user data ⇒ no-store.
 */
import { type NextRequest, NextResponse } from 'next/server';

import type { GitAccount, GitProviderStatus } from '@/lib/api/git';
import { resolveAllConnections, listAccounts, gitlabConnectable } from '@/lib/git/server';

export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

function providerStatuses(): GitProviderStatus[] {
  return [
    { provider: 'github', connectable: true },
    gitlabConnectable()
      ? { provider: 'gitlab', connectable: true }
      : { provider: 'gitlab', connectable: false, reason: 'needs-setup' },
  ];
}

export async function GET(req: NextRequest) {
  const providers = providerStatuses();
  const conns = await resolveAllConnections(req);
  if (conns.length === 0) {
    return NextResponse.json({ connected: false, accounts: [], providers }, { headers: NO_STORE });
  }

  const accounts: GitAccount[] = [];
  for (const conn of conns) {
    try {
      const list = await listAccounts(conn);
      // A 401 (revoked token) yields null — skip that provider, keep the rest.
      if (list) accounts.push(...list);
    } catch {
      // One provider being unreachable must not sink the others.
    }
  }

  return NextResponse.json(
    { connected: accounts.length > 0, accounts, providers },
    { headers: NO_STORE },
  );
}
