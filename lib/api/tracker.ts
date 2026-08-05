/**
 * The work-item client — hanzo.app's binding to the cloud tracker.
 *
 * A work item is a unit of engineering work someone moves across a board, and
 * Hanzo has exactly ONE primitive for it: the cloud tracker Issue. This module
 * holds no state and mirrors no rows; every function here is one call to the
 * same-origin `/v1/tracker` BFF, which forwards to the cloud as the signed-in
 * user. There is no second issues table anywhere in this app.
 *
 * The vocabulary below (status/priority/kind/source) is the cloud's CLOSED set,
 * restated here only so the UI can render pickers. Cloud refuses a value outside
 * it with 400 — this copy is for labels, never for validation.
 */

import { currentOrg } from '@/lib/org-scope';

/** Board column. Cloud defaults an empty status to `backlog`. */
export type Status = 'backlog' | 'todo' | 'in_progress' | 'done' | 'canceled';

/** Cloud's closed priority set. Empty defaults to `none`. */
export type Priority = 'none' | 'urgent' | 'high' | 'medium' | 'low';

/** What a work item IS. Deliberately small; empty defaults to `issue`. */
export type Kind = 'issue' | 'pr' | 'epic';

/** Which surface OPENED the item — orthogonal to kind. Empty defaults to `team`. */
export type Source = 'team' | 'git' | 'crm' | 'helpdesk' | 'cms' | 'agent';

export const STATUSES: Status[] = ['backlog', 'todo', 'in_progress', 'done', 'canceled'];

/** Display labels. `in_progress` is the only one whose wire form is unreadable. */
export const STATUS_LABEL: Record<Status, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In progress',
  done: 'Done',
  canceled: 'Canceled',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  none: 'None',
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

/** A board: the KEY that prefixes every identifier, and the issues under it. */
export interface Board {
  id: string;
  org: string;
  key: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

/** One work item, exactly as `/v1/tracker` reports it. */
export interface Issue {
  id: string;
  /** `KEY-<number>` — the human handle. */
  identifier: string;
  projectKey: string;
  number: number;
  kind: Kind;
  source: Source;
  /** Git binding, for items that came from a repository. */
  repo?: string;
  /** External anchor — a PR branch, or a link INTO another plane. See `sessionRef`. */
  extRef?: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  assignee?: string;
  labels: string[];
  createdAt: number;
  updatedAt: number;
}

export interface IssueFilter {
  status?: Status;
  kind?: Kind;
  source?: Source;
  repo?: string;
}

export interface NewIssue {
  title: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  assignee?: string;
  labels?: string[];
  kind?: Kind;
  source?: Source;
  repo?: string;
  extRef?: string;
}

/** Every field of an issue a board can move. */
export type IssuePatch = Partial<NewIssue>;

// --- The agent link -------------------------------------------------------
//
// An agent run is a SESSION (cloud `/v1/agents/sessions`, status
// running|paused|done|error) — "mission" is not a modeled concept anywhere in
// the fleet, only an informal name for the console view over sessions. So a work
// item points at a session, and it does so through `extRef`, which the tracker
// contract already defines as "a link INTO another plane". No new column, no
// metadata bag: the anchor is a self-describing value.

const SESSION_PREFIX = 'session:';

/** The `extRef` anchor for an agent session. */
export function sessionRef(id: string): string {
  return `${SESSION_PREFIX}${id}`;
}

/** The session id an `extRef` anchors to, or null when it anchors elsewhere. */
export function refSession(extRef: string | undefined): string | null {
  if (!extRef || !extRef.startsWith(SESSION_PREFIX)) return null;
  return extRef.slice(SESSION_PREFIX.length) || null;
}

// --- Board handles --------------------------------------------------------

/**
 * The board a project handle names: its KEY, or its NAME.
 *
 * A project's slug and a board's key are different alphabets — a slug is
 * `my-site`, a key is `^[A-Z][A-Z0-9]{1,7}$` — and there is no total function
 * between them (four leading characters collide constantly). So the app does not
 * INVENT the mapping: it matches what exists, by key first and then by name,
 * which makes both `/dev/acme/MYSITE/issues` and `/dev/acme/my-site/issues`
 * resolve to the same board without either being a guess.
 */
export function boardFor(boards: Board[], handle: string): Board | null {
  const h = handle.trim();
  if (!h) return null;
  const upper = h.toUpperCase();
  return (
    boards.find((b) => b.key.toUpperCase() === upper) ||
    boards.find((b) => b.name === h) ||
    boards.find((b) => b.name.toLowerCase() === h.toLowerCase()) ||
    null
  );
}

/**
 * A board key proposed from a display name — the SAME rule cloud applies when a
 * caller omits one (`deriveKey`, apps/tracker/tracker.go): leading alphanumerics,
 * uppercased, capped at four. Restated here so the create form can PREFILL the
 * key it is about to send; the field stays editable because this rule collides by
 * design and only the user knows which board they meant.
 *
 * Cloud validates with `^[A-Z][A-Z0-9]{1,7}$`, so a one-character result is
 * widened rather than sent to a certain 400.
 */
export function proposeKey(name: string): string {
  let k = '';
  for (const ch of name.toUpperCase()) {
    if ((ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9')) k += ch;
    if (k.length >= 4) break;
  }
  if (!k || (k[0] >= '0' && k[0] <= '9')) return 'PRJ';
  return k.length < 2 ? `${k}PRJ`.slice(0, 4) : k;
}

// --- Transport (same-origin BFF; the session cookie carries auth) ----------

const BASE = '/v1/tracker';

/** Stamp the selected org. Honored server-side ONLY for a global admin acting
 *  cross-org; ignored for everyone else, whose org is pinned to their token. */
function orgHeader(): Record<string, string> {
  const org = currentOrg();
  return org ? { 'X-Org-Id': org } : {};
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { Accept: 'application/json', ...orgHeader(), ...(init?.headers || {}) },
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      msg = body?.error || body?.msg || body?.message || msg;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export async function listBoards(): Promise<Board[]> {
  return req<Board[]>('/projects');
}

export async function createBoard(input: {
  key?: string;
  name: string;
  description?: string;
}): Promise<Board> {
  return req<Board>('/projects', json('POST', input));
}

export async function listIssues(key: string, filter: IssueFilter = {}): Promise<Issue[]> {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) if (v) q.set(k, String(v));
  const qs = q.size ? `?${q}` : '';
  return req<Issue[]>(`/projects/${encodeURIComponent(key)}/issues${qs}`);
}

export async function createIssue(key: string, input: NewIssue): Promise<Issue> {
  return req<Issue>(`/projects/${encodeURIComponent(key)}/issues`, json('POST', input));
}

export async function updateIssue(
  key: string,
  num: number,
  patch: IssuePatch,
): Promise<Issue> {
  return req<Issue>(
    `/projects/${encodeURIComponent(key)}/issues/${num}`,
    json('PATCH', patch),
  );
}
