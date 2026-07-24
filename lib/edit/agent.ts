/**
 * The agentic single-file edit — Hanzo's own model stack computes the rewrite.
 *
 * Same OpenAI-compatible gateway the builder uses for `/v1/generate` and commit
 * shaping (`${HANZO_AI_BASE_URL}/chat/completions`), NON-streaming. The signed-in
 * user's IAM bearer is forwarded as `Authorization: Bearer <token>` — so the
 * gateway DEBITS THIS RUN against the caller's per-org credits (the same money
 * path as a builder generation). There is no separate billing call: running the
 * completion as the user IS the charge. An admin's run debits the admin org
 * (effectively free per the /v1/edit gate).
 *
 * Single file for increment 1: {current contents, instruction, page context} in,
 * the COMPLETE rewritten file out. PURE (bearer injected, global `fetch`) so it
 * is unit-testable by mocking `fetch`. Throws a typed error on failure.
 */
import { DEFAULT_MODEL, resolveModelId } from '@/lib/providers';
import { GitSyncError } from '@/lib/git/sync';

const HANZO_AI_BASE_URL = process.env.HANZO_AI_BASE_URL || 'https://api.hanzo.ai/v1';

// Output ceiling — must cover a full rewritten file. Matches /v1/generate's cap
// (safe across the Zen ladder + Enso).
const MAX_TOKENS = 128_000;

// Input guard: a single-shot rewrite must fit the model context. Above this we
// refuse honestly rather than truncate (chunked edits are a later increment).
export const MAX_FILE_BYTES = 256 * 1024;

const SYSTEM_PROMPT =
  'You are Hanzo Edit, a precise code and content editor. You are given the FULL ' +
  'contents of ONE file and an instruction describing a change to it. Apply the ' +
  'change faithfully and minimally, preserving the file’s existing style, ' +
  'indentation, and structure. Output the COMPLETE new contents of the file and ' +
  'NOTHING else — no explanation, no commentary, and no Markdown code fences. If ' +
  'the instruction cannot be applied to this file, return the file unchanged.';

export interface RewriteInput {
  /** The user's IAM bearer — forwarded so the gateway debits THIS run. */
  token: string;
  /** Repo-relative path of the file being edited (for the model's context). */
  path: string;
  /** Current file contents ('' when creating a new file). */
  current: string;
  /** The natural-language change to apply. */
  instruction: string;
  /** Optional page context (URL + selected text) that motivated the edit. */
  context?: string;
  /** Optional model override; defaults to the builder default (resolveModelId). */
  model?: string;
}

/** Strip an accidental leading/trailing ```lang fence the model may add. */
function stripFences(s: string): string {
  const t = s.trim();
  const fence = /^```[^\n]*\n([\s\S]*?)\n```$/;
  const m = t.match(fence);
  return m ? m[1] : s;
}

/**
 * Compute the rewritten file. Returns the full new contents. Throws
 * `GitSyncError` (401/403 → the caller maps to a sign-in/credits prompt; 402 for
 * an out-of-credit gateway; 502 otherwise). Never returns an empty rewrite for a
 * non-empty input (guards against a truncated/blank completion clobbering a file).
 */
export async function rewriteFile(input: RewriteInput): Promise<string> {
  if (Buffer.byteLength(input.current, 'utf8') > MAX_FILE_BYTES) {
    throw new GitSyncError('File is too large for a single-shot edit.', 413, 'too_large');
  }

  const userContent = [
    `File: ${input.path}`,
    input.context ? `Page context: ${input.context}` : '',
    '',
    'Instruction:',
    input.instruction,
    '',
    'Current file contents:',
    input.current,
  ]
    .filter((l) => l !== undefined)
    .join('\n');

  let res: Response;
  try {
    res = await fetch(`${HANZO_AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${input.token}` },
      body: JSON.stringify({
        model: resolveModelId(input.model) || DEFAULT_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        max_tokens: MAX_TOKENS,
        stream: false,
        temperature: 0.1,
      }),
      cache: 'no-store',
    });
  } catch {
    throw new GitSyncError('AI gateway unreachable.', 502, 'gateway');
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    // 401/403 → sign-in; 402 → out of credits (surface verbatim so the widget
    // can prompt a top-up); everything else → 502.
    const status = res.status === 401 || res.status === 403 || res.status === 402 ? res.status : 502;
    throw new GitSyncError(
      detail?.slice(0, 300) || `AI gateway error (${res.status}).`,
      status,
      status === 402 ? 'needs_credits' : 'gateway',
    );
  }

  const data = (await res.json().catch(() => null)) as
    | { choices?: { message?: { content?: string } }[] }
    | null;
  const raw = data?.choices?.[0]?.message?.content;
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new GitSyncError('The model returned no content.', 502, 'empty');
  }

  const next = stripFences(raw);
  // Guard: never let a blank completion erase a non-empty file.
  if (input.current.trim() && !next.trim()) {
    throw new GitSyncError('The model returned an empty file — refusing to overwrite.', 502, 'empty');
  }
  return next;
}
