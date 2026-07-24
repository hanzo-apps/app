/**
 * The fork→edit→PR orchestration — written ONCE against `GitProvider`, so every
 * forge gets the same flow and the route stays a thin gate.
 *
 *   1. Read the target file at the declared branch.
 *   2. Compute the rewrite with Hanzo's model stack (debits the caller — agent.ts).
 *   3. If the acting identity can push to the repo → branch+commit+PR on it.
 *      Else → FORK the repo, branch+commit on the fork, and open the PR from the
 *      fork into the upstream base branch.
 *   4. Return the PR URL (+ whether a fork was needed).
 *
 * PURE: the provider (already bound to its token) and the IAM bearer are passed
 * in; the global `fetch` is used indirectly through them. Unit-testable by
 * mocking a `GitProvider` + `fetch`.
 */
import { randomUUID } from 'node:crypto';

import { GitSyncError, parseOwnerRepo } from '@/lib/git/sync';
import { cleanLine } from '@/lib/git/summarize';

import { rewriteFile } from './agent';
import type { GitProvider, ProviderName, RepoRef } from './provider';
import { providerName } from './provider';

/** A fully-resolved edit target: where the file lives + which forge. */
export interface EditTarget {
  repo: RepoRef;
  path: string;
  branch: string;
  provider: ProviderName;
}

/** Parse + validate the page-declared target. Returns an error string when unusable. */
export function parseTarget(input: {
  repo?: string;
  path?: string;
  branch?: string;
  provider?: unknown;
}): EditTarget | { error: string } {
  const parsed = parseOwnerRepo((input.repo || '').trim());
  if (!parsed) return { error: 'A valid "owner/repo" is required (hanzo:repo).' };
  const path = safePath(input.path || '');
  if (!path) return { error: 'A file path is required (hanzo:path).' };
  const branch = (input.branch || '').trim() || 'main';
  return {
    repo: { owner: parsed.owner, repo: parsed.repo },
    path,
    branch,
    provider: providerName(input.provider),
  };
}

/** A safe repo-relative file path (no traversal / absolute / backslash / control). */
export function safePath(p: string): string | null {
  const clean = (p || '').replace(/^\/+/, '').trim();
  if (!clean) return null;
  if (clean.includes('..') || clean.includes('\\')) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f]/.test(clean)) return null;
  return clean;
}

/** A short slug from free text (for the branch name). */
function slugify(s: string, max = 32): string {
  const out = (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '');
  return out || 'edit';
}

/** A unique-enough edit branch: `hanzo-edit/<slug>-<rand>`. */
export function editBranchName(instruction: string): string {
  return `hanzo-edit/${slugify(instruction)}-${randomUUID().slice(0, 8)}`;
}

export interface RunEditInput {
  target: EditTarget;
  instruction: string;
  /** Page context (URL + selected text) that motivated the edit. */
  context?: string;
  /** The IAM bearer — forwarded to the model gateway (debits this run). */
  agentToken: string;
  /** Optional model override. */
  model?: string;
  /** Who is submitting (for the PR body): an admin note or the provider login. */
  actorLabel: string;
  /** Optional publishable project key (pk_…) for PR-body provenance. */
  projectKey?: string;
}

export interface EditOutcome {
  prUrl: string;
  number: number;
  branch: string;
  /** True when the edit went to a fork (the acting identity lacked write access). */
  forked: boolean;
  commitSha: string;
}

/**
 * Run the whole vertical for ONE file. Throws `GitSyncError` (with an HTTP
 * status) on any failure — including `422 no_change` when the model produced no
 * diff (we never open an empty PR).
 */
export async function runEdit(provider: GitProvider, input: RunEditInput): Promise<EditOutcome> {
  const { repo, path, branch } = input.target;

  // 1) Read the current file at the declared branch.
  const file = await provider.getFile(repo, path, branch);

  // 2) Compute the rewrite (debits the caller via the gateway).
  const next = await rewriteFile({
    token: input.agentToken,
    path,
    current: file.content,
    instruction: input.instruction,
    context: input.context,
    model: input.model,
  });
  if (file.exists && next === file.content) {
    throw new GitSyncError('The edit produced no change to the file.', 422, 'no_change');
  }

  // 3) Direct branch (write access) vs fork (no write access).
  const canWrite = await provider.hasWriteAccess(repo);
  const editBranch = editBranchName(input.instruction);
  let workRepo: RepoRef = repo;
  let head = editBranch;
  let forked = false;
  if (!canWrite) {
    const fork = await provider.fork(repo);
    workRepo = fork;
    head = `${fork.owner}:${editBranch}`;
    forked = true;
    // Keep a pre-existing (possibly stale) fork's base even with upstream so the
    // branch — and the file sha we commit against — match what we read upstream.
    if (provider.syncBase) await provider.syncBase(workRepo, branch);
  }

  // 4) Branch from the base, commit the one file.
  await provider.createBranch(workRepo, branch, editBranch);
  const title = `Hanzo Edit: ${cleanLine(input.instruction) || 'update ' + path}`;
  const { commitSha } = await provider.commitFile(
    workRepo,
    editBranch,
    path,
    next,
    title,
    // A fork shares the upstream blob objects, so the upstream file sha is valid
    // on the fork branch too; a brand-new file has no sha (create).
    file.sha,
  );

  // 5) Open the PR on the UPSTREAM repo (base = declared branch).
  const body = prBody(input, path, forked);
  const pr = await provider.openPR(repo, branch, head, title, body);

  return { prUrl: pr.prUrl, number: pr.number, branch: editBranch, forked, commitSha };
}

/** The PR description — the instruction, page context, and honest provenance. */
function prBody(input: RunEditInput, path: string, forked: boolean): string {
  const lines = [
    `**Instruction**\n\n${input.instruction}`,
    '',
    `**File**: \`${path}\``,
  ];
  if (input.context) lines.push('', `**Page context**\n\n${input.context}`);
  lines.push(
    '',
    '---',
    `Submitted via **Hanzo Edit** by ${input.actorLabel}${forked ? ' (from a fork)' : ''}.`,
  );
  if (input.projectKey) lines.push(`Project: \`${input.projectKey}\``);
  return lines.join('\n');
}
