/**
 * /v1/git/repos — repositories for one connected Git account.
 *
 * GET ?account=<login>&provider=<github|gitlab>&q=<search> → `{ repos: GitRepo[] }`,
 * newest-activity first, server-side filtered by `q`. `account` defaults to the
 * authenticated user; `provider` defaults to `github`.
 *
 * Proxies the provider with the user's IAM-linked token (resolved server-side);
 * the token never reaches the browser. No linked token ⇒ 401 (the client falls
 * back to the "Connect" CTA) — never a service-token leak. Per-user ⇒ no-store.
 */
import { type NextRequest, NextResponse } from 'next/server';

import type { GitProvider } from '@/lib/api/git';
import { resolveConnection, listRepos } from '@/lib/git/server';

export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

function parseProvider(v: string | null): GitProvider {
  return v === 'gitlab' ? 'gitlab' : 'github';
}

export async function GET(req: NextRequest) {
  const provider = parseProvider(req.nextUrl.searchParams.get('provider'));
  const conn = await resolveConnection(req, provider);
  if (!conn) {
    return NextResponse.json(
      { repos: [], connected: false },
      { status: 401, headers: NO_STORE },
    );
  }

  const account = req.nextUrl.searchParams.get('account')?.trim() || '';
  const q = req.nextUrl.searchParams.get('q')?.trim() || '';

  let repos;
  try {
    repos = await listRepos(conn, account, q);
  } catch {
    return NextResponse.json(
      { repos: [], error: `${provider} unreachable` },
      { status: 502, headers: NO_STORE },
    );
  }
  if (repos === null) {
    return NextResponse.json(
      { repos: [], connected: false },
      { status: 401, headers: NO_STORE },
    );
  }

  return NextResponse.json({ repos, connected: true }, { headers: NO_STORE });
}
