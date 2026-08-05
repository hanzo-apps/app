/**
 * Per-app version-history persistence in Hanzo Base — the durable backbone under
 * the History panel's bookmarks + revision timeline.
 *
 * Two collections, both IAM-native and scoped per (user, app) for isolation,
 * mirroring `lib/db/projects.ts` exactly (act as the signed-in user via
 * `baseAs`, filter by `user_id` = their IAM sub):
 *   - `app_bookmarks`  one row per pinned revision key.
 *   - `app_revisions`  one row per revision (edit / checkpoint / commit) carrying
 *                      rich metadata (prompt, model, timestamp, files-changed,
 *                      the AI-clean message …) as a JSON blob.
 *
 * Both are named in `lib/base/collections` and PROVISIONED AS DECLARED STATE
 * (a Base migration in the deployment) — the app cannot create a collection,
 * so it does not pretend to. If Base is unconfigured OR the CRUD fails, the
 * caller (the BFF) reports `durable:false` and the client falls back to
 * localStorage — Base is primary, localStorage is the fallback, never both.
 */

import { baseAs, isBaseConfigured } from '@/lib/base';
import { BOOKMARKS, REVISIONS } from '@/lib/base/collections';

/** A persisted revision row's payload (the panel's rich metadata). */
export interface RevisionRecordInput {
  revKey: string;
  kind: 'commit' | 'edit' | 'checkpoint';
  title: string;
  at: number;
  sha?: string;
  author?: string;
  url?: string;
  model?: string;
  filesChanged?: number;
  message?: string;
  meta?: Record<string, unknown>;
}

// `type` (not `interface`) so these satisfy the BaseClient generic's `BaseRecord`
// constraint — only type-alias object literals get the implicit string index
// signature that `BaseRecord`'s `[key: string]: unknown` requires.
type BookmarkRow = {
  id: string;
  app: string;
  user_id: string;
  rev_key: string;
};

type RevisionRow = {
  id: string;
  app: string;
  user_id: string;
  rev_key: string;
  data: RevisionRecordInput;
};

/** Escape single quotes for a Base filter literal (mirrors lib/db/projects). */
const lit = (s: string) => (s || '').replace(/'/g, "\\'");

/** Whether the durable store can be used at all (Base configured). */
export function historyDurable(): boolean {
  return isBaseConfigured();
}

// ── Bookmarks ────────────────────────────────────────────────────────────────

export async function listBookmarks(token: string, userId: string, app: string): Promise<string[]> {
  const client = baseAs(token);
  const res = await client.collection(BOOKMARKS).getList<BookmarkRow>(1, 500, {
    filter: `user_id='${lit(userId)}' && app='${lit(app)}'`,
  });
  return res.items.map((r) => r.rev_key);
}

/** Toggle one bookmark; returns the full new key set (durable read-back). */
export async function toggleBookmarkDurable(
  token: string,
  userId: string,
  app: string,
  revKey: string,
): Promise<string[]> {
  const client = baseAs(token);
  const col = client.collection(BOOKMARKS);
  const filter = `user_id='${lit(userId)}' && app='${lit(app)}' && rev_key='${lit(revKey)}'`;
  let existingId: string | null = null;
  try {
    const found = await col.getFirstListItem<BookmarkRow>(filter);
    existingId = found.id;
  } catch {
    existingId = null; // not found
  }
  if (existingId) {
    await col.delete(existingId);
  } else {
    await col.create<BookmarkRow>({ app, user_id: userId, rev_key: revKey });
  }
  return listBookmarks(token, userId, app);
}

// ── Revisions ────────────────────────────────────────────────────────────────

export async function listRevisions(
  token: string,
  userId: string,
  app: string,
): Promise<RevisionRecordInput[]> {
  const client = baseAs(token);
  const res = await client.collection(REVISIONS).getList<RevisionRow>(1, 500, {
    filter: `user_id='${lit(userId)}' && app='${lit(app)}'`,
  });
  return res.items.map((r) => r.data).filter(Boolean);
}

/** Upsert a revision by (user, app, revKey). Idempotent. */
export async function upsertRevision(
  token: string,
  userId: string,
  app: string,
  input: RevisionRecordInput,
): Promise<void> {
  const client = baseAs(token);
  const col = client.collection(REVISIONS);
  const filter = `user_id='${lit(userId)}' && app='${lit(app)}' && rev_key='${lit(input.revKey)}'`;
  try {
    const found = await col.getFirstListItem<RevisionRow>(filter);
    await col.update(found.id, { data: input });
  } catch {
    await col.create<RevisionRow>({ app, user_id: userId, rev_key: input.revKey, data: input });
  }
}
