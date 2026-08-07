/**
 * /v1/re-design — read a site the user names, so the builder can rebuild it.
 *
 * `components/editor/ask-ai/re-imagine` has offered this since the fork and
 * called a route that was never written, so the control spun forever: the
 * client throws on a non-2xx and the handler had no catch, which left the
 * button loading with nothing on the way. This is the other half.
 *
 * The markdown returned here is what `/v1/generate` already accepts as
 * `redesignMarkdown` — one contract, and this route only supplies it.
 *
 * PUT → { ok, markdown } · 400 with the reason the address was refused
 *       · 502 when the site itself did not answer.
 */
import { type NextRequest, NextResponse } from 'next/server';

import { session } from '@/lib/iam';
import { requireSameOrigin } from '@/lib/org/csrf';
import { Unreachable, address, readable } from '@/lib/redesign';

export const runtime = 'nodejs';

const LIMIT = 4_000_000; // a page worth reading; past this it is a download

export async function PUT(request: NextRequest) {
  const denied = requireSameOrigin(request);
  if (denied) return denied;

  const user = await session(request);
  if (!user) {
    return NextResponse.json(
      { ok: false, openLogin: true, message: 'Sign in to redesign a site' },
      { status: 401 },
    );
  }

  const { url } = await request.json().catch(() => ({ url: '' }));
  if (typeof url !== 'string' || !url.trim()) {
    return NextResponse.json({ ok: false, error: 'Enter the address of the site to redesign.' }, { status: 400 });
  }

  let target: URL;
  try {
    target = await address(url);
  } catch (e) {
    if (e instanceof Unreachable) return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    throw e;
  }

  let html: string;
  try {
    const res = await fetch(target, {
      redirect: 'error', // a redirect can land inward; make the caller name the real address
      signal: AbortSignal.timeout(15_000),
      headers: { accept: 'text/html', 'user-agent': 'hanzo.app' },
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `${target.host} answered ${res.status}.` }, { status: 502 });
    }
    const type = res.headers.get('content-type') || '';
    if (!type.includes('html')) {
      return NextResponse.json({ ok: false, error: `${target.host} did not serve a web page.` }, { status: 502 });
    }
    html = (await res.text()).slice(0, LIMIT);
  } catch {
    return NextResponse.json({ ok: false, error: `Could not reach ${target.host}.` }, { status: 502 });
  }

  const markdown = readable(html);
  if (!markdown) {
    return NextResponse.json({ ok: false, error: `${target.host} had nothing readable on it.` }, { status: 502 });
  }
  return NextResponse.json({ ok: true, markdown });
}
