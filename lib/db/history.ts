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
 * Collections are ensured idempotently on first use (additive, like
 * `lib/base/provision.ts`). If Base is unconfigured OR the ensure/CRUD fails, the
 * caller (the BFF) reports `durable:false` and the client falls back to
 * localStorage — Base is primary, localStorage is the fallback, never both.
 */

import type { BaseClient } from '@hanzo/base';

import { baseAs, isBaseConfigured } from '@/lib/base';

export const BOOKMARKS_COLLECTION = 'app_bookmarks';
export const REVISIONS_COLLECTION = 'app_revisions';

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

interface BookmarkRow {
  id: string;
  app: string;
  user_id: string;
  rev_key: string;
}

interface RevisionRow {
  id: string;
  app: string;
  user_id: string;
  rev_key: string;
  data: RevisionRecordInput;
}

/** Escape single quotes for a Base filter literal (mirrors lib/db/projects). */
const lit = (s: string) => (s || '').replace(/'/g, "\\'");

const authed = "@request.auth.id != ''";

// Per-process guard so we attempt collection creation at most once per boot.
let ensured: Promise<boolean> | null = null;

async function ensureCollections(client: BaseClient): Promise<boolean> {
  if (ensured) return ensured;
  ensured = (async () => {
    try {
      const existing = new Set<string>();
      try {
        const list = await client.send<{ items: Array<{ name: string }> }>('/v1/collections', {
          method: 'GET',
          query: { perPage: '200' },
        });
        for (const c of list.items ?? []) existing.add(c.name);
      } catch {
        /* listing may be restricted; attempt creates and tolerate duplicates */
      }

      const specs = [
        {
          name: BOOKMARKS_COLLECTION,
          fields: [
            { name: 'app', type: 'text', required: true },
            { name: 'user_id', type: 'text', required: true },
            { name: 'rev_key', type: 'text', required: true },
          ],
        },
        {
          name: REVISIONS_COLLECTION,
          fields: [
            { name: 'app', type: 'text', required: true },
            { name: 'user_id', type: 'text', required: true },
            { name: 'rev_key', type: 'text', required: true },
            { name: 'data', type: 'json' },
          ],
        },
      ];

      for (const spec of specs) {
        if (existing.has(spec.name)) continue;
        try {
          await client.send('/v1/collections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: spec.name,
              type: 'base',
              fields: spec.fields,
              listRule: authed,
              viewRule: authed,
              createRule: authed,
              updateRule: authed,
              deleteRule: authed,
            }),
          });
        } catch {
          /* a concurrent create / duplicate name is fine — verified by use below */
        }
      }
      return true;
    } catch {
      return false;
    }
  })();
  return ensured;
}

/** Whether the durable store can be used at all (Base configured). */
export function historyDurable(): boolean {
  return isBaseConfigured();
}

// ── Bookmarks ────────────────────────────────────────────────────────────────

export async function listBookmarks(token: string, userId: string, app: string): Promise<string[]> {
  const client = baseAs(token);
  await ensureCollections(client);
  const res = await client.collection(BOOKMARKS_COLLECTION).getList<BookmarkRow>(1, 500, {
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
  await ensureCollections(client);
  const col = client.collection(BOOKMARKS_COLLECTION);
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
  await ensureCollections(client);
  const res = await client.collection(REVISIONS_COLLECTION).getList<RevisionRow>(1, 500, {
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
  await ensureCollections(client);
  const col = client.collection(REVISIONS_COLLECTION);
  const filter = `user_id='${lit(userId)}' && app='${lit(app)}' && rev_key='${lit(input.revKey)}'`;
  try {
    const found = await col.getFirstListItem<RevisionRow>(filter);
    await col.update(found.id, { data: input });
  } catch {
    await col.create<RevisionRow>({ app, user_id: userId, rev_key: input.revKey, data: input });
  }
}
