/**
 * /v1/git/commits/summarize — AI-clean commit messages, cheap and cached.
 *
 * Two shapes on ONE route (discriminated by the body), both authored via the SAME
 * gateway path the builder uses (`enso-flash`, non-streaming — see
 * `lib/git/summarize.ts`):
 *   - CLEAN   `POST { commits:[{sha,message}] }` → `{ summaries:{sha:line} }`.
 *     Reformats EXISTING messages for the History timeline. CACHED by sha in a
 *     process-local Map — a commit's message never changes, so re-opening History
 *     never re-summarizes and only NEW shas hit the model.
 *   - COMPOSE `POST { prompts:[string] }` → `{ message:line }`. Synthesizes ONE
 *     subject from the session's edit prompts, authored BEFORE a push so new
 *     commits are born clean. Not cached (session-specific).
 *
 * Cookie-authenticated (the user's IAM bearer mirrored to `hanzo_token`) and
 * same-origin (CSRF) like `/v1/generate` — it spends the user's AI credit. No
 * signed-in user ⇒ 401. On any gateway failure the pure layer falls back to the
 * raw first line, so a `summaries`/`message` value is NEVER blank.
 */
import { type NextRequest, NextResponse } from 'next/server';

import MY_TOKEN_KEY from '@/lib/get-cookie-name';
import { requireSameOrigin } from '@/lib/org/csrf';
import {
  cleanCommitMessages,
  composeCommitMessage,
  type RawCommit,
} from '@/lib/git/summarize';

export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

// How many raw messages / prompts a single request may carry.
const MAX_ITEMS = 100;

/**
 * Process-local sha → clean-line cache. A commit's message is immutable, so this
 * is safe to keep for the process lifetime; bounded so a long-lived pod can't
 * grow it without limit (oldest-inserted evicted first — Map preserves order).
 */
const summaryCache = new Map<string, string>();
const CACHE_CAP = 5000;

function cachePut(sha: string, line: string): void {
  if (summaryCache.has(sha)) summaryCache.delete(sha);
  summaryCache.set(sha, line);
  if (summaryCache.size > CACHE_CAP) {
    const oldest = summaryCache.keys().next().value;
    if (oldest !== undefined) summaryCache.delete(oldest);
  }
}

export async function POST(req: NextRequest) {
  // Spends AI credit for the org — refuse a cross-origin POST before any work.
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const token = req.cookies.get(MY_TOKEN_KEY())?.value;
  if (!token) {
    return NextResponse.json(
      { ok: false, openLogin: true, message: 'Sign in first' },
      { status: 401, headers: NO_STORE },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    commits?: { sha?: unknown; message?: unknown }[];
    prompts?: unknown[];
  };

  // COMPOSE mode — one subject line from the session prompts.
  if (Array.isArray(body.prompts)) {
    const prompts = body.prompts
      .filter((p): p is string => typeof p === 'string')
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, MAX_ITEMS);
    const message = await composeCommitMessage(token, prompts);
    return NextResponse.json({ ok: true, message }, { headers: NO_STORE });
  }

  // CLEAN mode — batch reformat existing commit messages, sha-cached.
  if (Array.isArray(body.commits)) {
    const commits: RawCommit[] = body.commits
      .map((c) => ({
        sha: typeof c?.sha === 'string' ? c.sha : '',
        message: typeof c?.message === 'string' ? c.message : '',
      }))
      .filter((c) => c.sha)
      .slice(0, MAX_ITEMS);

    const summaries: Record<string, string> = {};
    const misses: RawCommit[] = [];
    for (const c of commits) {
      const hit = summaryCache.get(c.sha);
      if (hit !== undefined) summaries[c.sha] = hit;
      else misses.push(c);
    }

    if (misses.length > 0) {
      const fresh = await cleanCommitMessages(token, misses);
      for (const [sha, line] of Object.entries(fresh)) {
        summaries[sha] = line;
        cachePut(sha, line);
      }
    }

    return NextResponse.json({ ok: true, summaries }, { headers: NO_STORE });
  }

  return NextResponse.json(
    { ok: false, message: 'Provide `commits` (to clean) or `prompts` (to compose).' },
    { status: 400, headers: NO_STORE },
  );
}
