/**
 * AI commit-message shaping — the ONE place a raw/rough message becomes a clean,
 * human, imperative line. Two operations, one gateway path, both fail-safe:
 *
 *   - `cleanCommitMessages` reformats EXISTING commit subjects for DISPLAY in the
 *     History timeline (one clean line per sha, ≤72 chars). BATCHED: a single
 *     completion returns a `sha → line` JSON map — never one call per commit.
 *   - `composeCommitMessage` synthesizes ONE commit subject from the session's
 *     edit prompts, authored BEFORE a push so new commits are born clean.
 *
 * Both call the SAME OpenAI-compatible gateway the builder uses for `/v1/generate`
 * (`${HANZO_AI_BASE_URL}/chat/completions`, model `enso-flash` — cheap + fast),
 * non-streaming. PURE with respect to the runtime: the resolved bearer is passed
 * in, the global `fetch` is used, so this is unit-testable by mocking `fetch`. On
 * ANY failure they fall back to the raw first line — NEVER a blank message.
 */

const HANZO_AI_BASE_URL = process.env.HANZO_AI_BASE_URL || 'https://api.hanzo.ai/v1';

/** The cheap/fast model for message shaping (NOT the build model). */
export const SUMMARY_MODEL = 'enso-flash';

/** A raw commit to clean (sha + its original message). */
export interface RawCommit {
  sha: string;
  message: string;
}

/** First non-empty line of a message, trimmed. */
export function firstLine(message: string): string {
  const lines = (message || '').split('\n');
  for (const l of lines) {
    const t = l.trim();
    if (t) return t;
  }
  return '';
}

/**
 * Tidy a model-produced (or raw) line into a clean subject: strip surrounding
 * quotes/backticks, a leading `- `, a trailing period, collapse whitespace, and
 * clamp to ≤72 chars on a word boundary. Pure + defensive — the model can be
 * chatty and we still land a tight line.
 */
export function cleanLine(input: string, max = 72): string {
  let s = (input || '').replace(/\s+/g, ' ').trim();
  s = s.replace(/^["'`]+|["'`]+$/g, '').trim();
  s = s.replace(/^[-*]\s+/, '').trim();
  s = s.replace(/\.+$/, '').trim();
  if (s.length <= max) return s;
  const clipped = s.slice(0, max);
  const sp = clipped.lastIndexOf(' ');
  return (sp > max * 0.6 ? clipped.slice(0, sp) : clipped).trim();
}

/** The fallback line for a raw commit when the AI path is unavailable. */
function fallbackFor(message: string): string {
  return cleanLine(firstLine(message)) || '(no message)';
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * One non-streaming gateway completion. Returns the assistant text, or null on
 * any non-2xx / malformed response (the callers then fall back). Never throws.
 */
async function complete(
  token: string,
  messages: ChatMessage[],
  maxTokens: number,
): Promise<string | null> {
  let res: Response;
  try {
    res = await fetch(`${HANZO_AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        model: SUMMARY_MODEL,
        messages,
        max_tokens: maxTokens,
        stream: false,
        temperature: 0.2,
      }),
      cache: 'no-store',
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as
    | { choices?: { message?: { content?: string } }[] }
    | null;
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === 'string' ? content : null;
}

/** Extract the first balanced JSON object from a possibly-chatty completion. */
function extractJsonObject(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

const CLEAN_SYSTEM =
  'You reformat raw git commit messages into clean, human, imperative one-line ' +
  'summaries for a version-history UI. For each input, write ONE line: imperative ' +
  'mood (e.g. "add dark navy header + sticky nav"), lowercase start, no trailing ' +
  'period, at most 72 characters, describing what the commit changed. Keep it ' +
  'concrete and specific to the message; never invent details. Respond with ONLY a ' +
  'JSON object mapping each input sha to its cleaned line. No prose, no code fences.';

/**
 * Reformat a batch of raw commit messages into clean display lines, keyed by sha.
 * ONE gateway call for the whole batch. Any sha the model omits (or the whole
 * call failing) falls back to the raw first line — the result ALWAYS has an entry
 * for every input sha, never blank.
 */
export async function cleanCommitMessages(
  token: string,
  commits: RawCommit[],
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const c of commits) out[c.sha] = fallbackFor(c.message);
  if (commits.length === 0) return out;

  const payload = commits.map((c) => ({ sha: c.sha, message: firstLine(c.message) }));
  const text = await complete(
    token,
    [
      { role: 'system', content: CLEAN_SYSTEM },
      { role: 'user', content: JSON.stringify(payload) },
    ],
    Math.min(2048, 64 + commits.length * 40),
  );
  if (!text) return out;

  const parsed = extractJsonObject(text) as Record<string, unknown> | null;
  if (!parsed || typeof parsed !== 'object') return out;
  for (const c of commits) {
    const v = parsed[c.sha];
    if (typeof v === 'string' && v.trim()) out[c.sha] = cleanLine(v);
  }
  return out;
}

const COMPOSE_SYSTEM =
  'You write ONE git commit subject line summarizing a set of website-builder edit ' +
  'prompts made since the last push. Output a single line: imperative mood, ' +
  'lowercase start, no trailing period, at most 72 characters, describing the net ' +
  'change (e.g. "add pricing section and fix mobile nav overflow"). Be concrete and ' +
  'faithful to the prompts; never invent work. Respond with ONLY the line — no ' +
  'quotes, no prose, no code fences.';

/** A last-resort subject built from the prompts with no AI (newest prompt wins). */
function composeFallback(prompts: string[]): string {
  const last = [...prompts].reverse().find((p) => p && p.trim());
  return cleanLine(last || '') || 'update site';
}

/**
 * Synthesize ONE clean commit subject from the session's edit prompts. ONE
 * gateway call. On any failure returns a faithful non-AI fallback (the most
 * recent prompt, cleaned) — never blank.
 */
export async function composeCommitMessage(token: string, prompts: string[]): Promise<string> {
  const clean = (prompts || []).map((p) => (p || '').trim()).filter(Boolean);
  if (clean.length === 0) return 'update site';

  const text = await complete(
    token,
    [
      { role: 'system', content: COMPOSE_SYSTEM },
      { role: 'user', content: clean.map((p) => `- ${p}`).join('\n') },
    ],
    120,
  );
  if (!text) return composeFallback(clean);
  const line = cleanLine(firstLine(text));
  return line || composeFallback(clean);
}
