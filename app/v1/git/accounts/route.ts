/**
 * /v1/git/accounts — the signed-in user's connected Git accounts, across
 * providers, plus each provider's connectability.
 *
 * GET → `{ connected, accounts: GitAccount[], providers: GitProviderStatus[] }`.
 *   - `accounts` is the aggregate of every linked provider (GitHub user + orgs,
 *     GitLab user). Empty ⇒ nothing linked (drives the honest "Connect" CTA —
 *     NEVER fabricated rows).
 *   - `providers` reports which providers can be connected right now, asked of
 *     IAM — the one thing that knows which it can drive. A provider IAM does not
 *     offer reports `connectable: false, reason: 'needs-setup'`, so the UI says
 *     so instead of opening a chooser the provider is missing from.
 *
 * No provider credential exists in this process: git.hanzo.ai is read with the
 * forge credential and GitHub/GitLab through the org's connectors, where cloud
 * holds the sealed token. Per-user data ⇒ no-store.
 */
import { type NextRequest, NextResponse } from 'next/server';

import type { GitAccount, GitProviderStatus } from '@/lib/api/git';
import { resolveSources, listAccounts, connectableProviders } from '@/lib/git/server';

export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/**
 * Which providers a Connect button can actually complete on. Our own git needs
 * no OAuth link, so it is always connectable for a signed-in user; GitHub and
 * GitLab are whatever the connector plane says this deployment can connect —
 * one answer, one place, no per-provider special case and no flag to keep in step.
 */
async function providerStatuses(req: NextRequest): Promise<GitProviderStatus[]> {
  const live = await connectableProviders(req);
  return [
    { provider: 'hanzo', connectable: true },
    ...(['github', 'gitlab'] as const).map(
      (provider): GitProviderStatus =>
        live.has(provider)
          ? { provider, connectable: true }
          : { provider, connectable: false, reason: 'needs-setup' },
    ),
  ];
}

export async function GET(req: NextRequest) {
  const providers = await providerStatuses(req);
  const sources = await resolveSources(req);
  if (sources.length === 0) {
    return NextResponse.json({ connected: false, accounts: [], providers }, { headers: NO_STORE });
  }

  const accounts: GitAccount[] = [];
  for (const src of sources) {
    try {
      const list = await listAccounts(src);
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
