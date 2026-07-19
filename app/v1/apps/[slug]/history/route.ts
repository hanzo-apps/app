/**
 * /v1/apps/:slug/history — the per-app version-history store (durable backbone).
 *
 * The History panel's bookmarks + revision timeline persist here, per (user, app),
 * in Hanzo Base (SQLite, IAM-native) — see `lib/db/history.ts`. This is the
 * durable primary; the client falls back to localStorage ONLY when this reports
 * `durable:false` (Base unconfigured, or the store is unreachable).
 *
 *   GET    → { durable, bookmarks: string[], revisions: RevisionRecord[] }
 *   PUT    { bookmark: key }   → toggle → { durable, bookmarks }
 *   POST   { revision: {...} } → upsert one revision → { durable, ok }
 *
 * Cookie/bearer-authenticated per user (their IAM sub scopes every row); mutating
 * verbs are same-origin (CSRF) like the sibling BFFs. Fail-soft: any Base error
 * degrades to `durable:false` so the panel keeps working on localStorage.
 */
import { type NextRequest, NextResponse } from 'next/server';

import { resolveOrgIdentity } from '@/lib/org/server';
import { requireSameOrigin } from '@/lib/org/csrf';
import {
  historyDurable,
  listBookmarks,
  listRevisions,
  toggleBookmarkDurable,
  upsertRevision,
  type RevisionRecordInput,
} from '@/lib/db/history';

export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

interface Ctx {
  params: Promise<{ slug: string }>;
}

/** The app key we scope rows by (the project slug). */
async function appKey(ctx: Ctx): Promise<string> {
  const { slug } = await ctx.params;
  return (slug || '').trim();
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const id = await resolveOrgIdentity(req);
  if (!id) return NextResponse.json({ durable: false, bookmarks: [], revisions: [] }, { headers: NO_STORE });
  const app = await appKey(ctx);
  if (!app || !historyDurable()) {
    return NextResponse.json({ durable: false, bookmarks: [], revisions: [] }, { headers: NO_STORE });
  }
  try {
    const [bookmarks, revisions] = await Promise.all([
      listBookmarks(id.token, id.sub, app),
      listRevisions(id.token, id.sub, app),
    ]);
    return NextResponse.json({ durable: true, bookmarks, revisions }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ durable: false, bookmarks: [], revisions: [] }, { headers: NO_STORE });
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const id = await resolveOrgIdentity(req);
  if (!id) return NextResponse.json({ durable: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
  const app = await appKey(ctx);
  const body = (await req.json().catch(() => ({}))) as { bookmark?: unknown };
  const key = typeof body.bookmark === 'string' ? body.bookmark.trim() : '';
  if (!app || !key) {
    return NextResponse.json({ durable: false, error: 'bookmark key required' }, { status: 400, headers: NO_STORE });
  }
  if (!historyDurable()) {
    return NextResponse.json({ durable: false }, { headers: NO_STORE });
  }
  try {
    const bookmarks = await toggleBookmarkDurable(id.token, id.sub, app, key);
    return NextResponse.json({ durable: true, bookmarks }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ durable: false }, { headers: NO_STORE });
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const id = await resolveOrgIdentity(req);
  if (!id) return NextResponse.json({ durable: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
  const app = await appKey(ctx);
  const body = (await req.json().catch(() => ({}))) as { revision?: Partial<RevisionRecordInput> };
  const r = body.revision;
  if (!app || !r || typeof r.revKey !== 'string' || !r.revKey) {
    return NextResponse.json({ durable: false, error: 'revision.revKey required' }, { status: 400, headers: NO_STORE });
  }
  if (!historyDurable()) {
    return NextResponse.json({ durable: false }, { headers: NO_STORE });
  }
  const input: RevisionRecordInput = {
    revKey: r.revKey,
    kind: r.kind === 'commit' || r.kind === 'checkpoint' ? r.kind : 'edit',
    title: typeof r.title === 'string' ? r.title : '',
    at: typeof r.at === 'number' ? r.at : Date.now(),
    sha: typeof r.sha === 'string' ? r.sha : undefined,
    author: typeof r.author === 'string' ? r.author : undefined,
    url: typeof r.url === 'string' ? r.url : undefined,
    model: typeof r.model === 'string' ? r.model : undefined,
    filesChanged: typeof r.filesChanged === 'number' ? r.filesChanged : undefined,
    message: typeof r.message === 'string' ? r.message : undefined,
    meta: r.meta && typeof r.meta === 'object' ? (r.meta as Record<string, unknown>) : undefined,
  };
  try {
    await upsertRevision(id.token, id.sub, app, input);
    return NextResponse.json({ durable: true, ok: true }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ durable: false }, { headers: NO_STORE });
  }
}
