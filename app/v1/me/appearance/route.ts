/**
 * /v1/me/appearance — read and write the SIGNED-IN user's appearance preference.
 *
 * `me` is not a parameter. The target row is composed here from the verified
 * session (`<org>/<name>`, exactly as /v1/me/profile binds it), so no value from
 * the browser can name a different account. That is the whole authorization
 * story: lib/appearance writes with the app's confidential IAM client, which can
 * address any row, and this route is the thing that decides which one.
 *
 * GET  → { ok, appearance }
 * POST → { ok, appearance } — the stored preference echoed back (validated, so a
 *        crafted body never becomes a stylesheet); 501 when the confidential
 *        client is unwired (honest, never a fabricated success). A guest gets a
 *        401 the client treats as "stay on localStorage", not an error.
 */
import { type NextRequest, NextResponse } from 'next/server';

import { session } from '@/lib/iam';
import { requireSameOrigin } from '@/lib/org/csrf';
import { appearanceConfigured, readAppearance, writeAppearance } from '@/lib/appearance';

export const runtime = 'nodejs';

const unauthorized = () =>
  NextResponse.json({ ok: false, openLogin: true, message: 'Sign in to save your appearance' }, { status: 401 });

const unconfigured = () =>
  NextResponse.json(
    { ok: false, message: 'Appearance sync is not configured on this deployment.' },
    { status: 501 },
  );

/** The IAM row id for a session. A user with no org has no addressable row. */
function rowId(user: { org: string; name: string }): string | null {
  if (!user.name) return null;
  return user.org ? `${user.org}/${user.name}` : user.name;
}

export async function GET(request: NextRequest) {
  const user = await session(request);
  if (!user) return unauthorized();
  if (!appearanceConfigured()) return unconfigured();
  const id = rowId(user);
  if (!id) return unauthorized();

  try {
    const appearance = await readAppearance(id);
    return NextResponse.json({ ok: true, appearance });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : 'Could not read your appearance.' },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  // Cookie-authenticated and it MUTATES the account — refuse a cross-origin POST
  // before doing any work.
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  const user = await session(request);
  if (!user) return unauthorized();
  if (!appearanceConfigured()) return unconfigured();
  const id = rowId(user);
  if (!id) return unauthorized();

  const body = (await request.json().catch(() => null)) as unknown;
  if (body === null || typeof body !== 'object') {
    return NextResponse.json({ ok: false, message: 'Expected a JSON appearance preference.' }, { status: 400 });
  }

  try {
    const appearance = await writeAppearance(id, body);
    return NextResponse.json({ ok: true, appearance });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : 'Could not save your appearance.' },
      { status: 502 },
    );
  }
}
