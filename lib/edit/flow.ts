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
  /**
   * Commit STRAIGHT to the declared (default) branch — the "change all, goes
   * live" path — instead of fork→branch→PR. The route sets this ONLY for a
   * validated global admin; a non-admin can never reach it (server-enforced).
   *
   * Direct is ALWAYS two-phase (there is no un-reviewed live commit):
   *   - `direct` with no `reviewed` → PROPOSE: compute the rewrite and return it
   *     for the admin to review; NOTHING is committed.
   *   - `direct` with `reviewed` → CONFIRM: commit the exact admin-reviewed bytes
   *     (no regeneration → no drift), optimistic-locked to `baseSha`.
   */
  direct?: boolean;
  /** Confirm phase: the exact bytes the admin reviewed and approved to commit. */
  reviewed?: string;
  /** The blob sha the reviewed bytes were computed against (non-destructive lock). */
  baseSha?: string | null;
  /**
   * The VALIDATED IAM identity of the admin performing a direct "goes live"
   * commit. Recorded in the commit message (trailer) so the commit attributes to
   * the human admin — not the shared bot token every admin would otherwise
   * collapse to. Absent on the fork→PR path (that PR body already names the
   * actor). Values are single-lined via `cleanLine` before use (no trailer
   * injection from a crafted display name).
   */
  identity?: { sub: string; name: string };
}

export interface EditOutcome {
  /** Present on the PR flow (the default); absent on a direct commit. */
  prUrl?: string;
  number?: number;
  branch: string;
  /** True when the edit went to a fork (the acting identity lacked write access). */
  forked: boolean;
  /** The commit sha — absent on the propose (preview) phase, which commits nothing. */
  commitSha?: string;
  /** True when the edit committed directly to the default branch (admin direct mode). */
  direct?: boolean;
  /** The commit's web URL, when the forge exposes one. */
  commitUrl?: string;
  /**
   * Propose phase of the admin direct commit: the computed rewrite awaiting an
   * explicit admin confirmation. NOTHING has been committed yet.
   */
  preview?: boolean;
  /** The full proposed file contents (propose phase) — the admin confirms these exact bytes. */
  proposed?: string;
  /** A line-based diff for review (propose phase); omitted for very large files. */
  diff?: string;
  /** The blob sha the proposal was computed against — echoed back on confirm for the lock. */
  baseSha?: string | null;
}

/**
 * A compact line-based unified-ish diff (LCS) for admin review of a proposed
 * direct edit. Memory is O(before·after) lines, so we bound it: for very large
 * files the widget shows the proposed contents in full instead of a diff.
 */
const MAX_DIFF_LINES = 1200;
export function lineDiff(before: string, after: string): string | undefined {
  const a = before.split('\n');
  const b = after.split('\n');
  if (a.length > MAX_DIFF_LINES || b.length > MAX_DIFF_LINES) return undefined;
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: string[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push('  ' + a[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push('- ' + a[i]);
      i++;
    } else {
      out.push('+ ' + b[j]);
      j++;
    }
  }
  while (i < n) out.push('- ' + a[i++]);
  while (j < m) out.push('+ ' + b[j++]);
  return out.join('\n');
}

/**
 * Run the whole vertical for ONE file. Throws `GitSyncError` (with an HTTP
 * status) on any failure — including `422 no_change` when the model produced no
 * diff (we never open an empty PR / empty commit).
 */
export async function runEdit(provider: GitProvider, input: RunEditInput): Promise<EditOutcome> {
  const { repo, path, branch } = input.target;

  const title = `Hanzo Edit: ${cleanLine(input.instruction) || 'update ' + path}`;

  // CONFIRM phase of the admin direct commit: the admin has reviewed a proposal
  // and approved these exact bytes. Commit them verbatim (no regeneration → no
  // drift, no TOCTOU between review and commit), optimistic-locked to the sha the
  // proposal was computed against — a file that moved since review fails the
  // commit rather than clobbering the newer content. The route gates this on
  // isGlobalAdmin; `path`/`repo` are already validated + scoped.
  if (input.direct && input.reviewed !== undefined) {
    const { commitSha } = await provider.commitFile(
      repo,
      branch,
      path,
      input.reviewed,
      directCommitMessage(title, input.identity),
      input.baseSha ?? null,
    );
    return {
      branch,
      forked: false,
      commitSha,
      direct: true,
      commitUrl: provider.commitUrl ? provider.commitUrl(repo, commitSha) : undefined,
    };
  }

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

  // 2.5) PROPOSE phase of the admin "goes live" path: the direct commit is ALWAYS
  //      review-gated. Return the computed rewrite + a diff for the admin to see;
  //      commit NOTHING. The browser echoes the approved bytes + baseSha back to
  //      the CONFIRM phase above. This breaks the "auto-live-commit of raw model
  //      output" chain: no page-derived prompt injection can reach the default
  //      branch without an explicit human confirmation of the exact result.
  if (input.direct) {
    return {
      branch,
      forked: false,
      direct: true,
      preview: true,
      proposed: next,
      diff: lineDiff(file.content, next),
      baseSha: file.sha,
    };
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

/**
 * The direct "goes live" commit message: the edit title plus a trailer that
 * attributes the commit to the VALIDATED admin identity (not the shared bot
 * token every admin authors as). A stable, greppable attribution lives in git
 * history itself, so a direct commit is never anonymous. `cleanLine` single-lines
 * every field, so a crafted display name can't forge extra trailers or a body.
 */
function directCommitMessage(title: string, identity?: { sub: string; name: string }): string {
  const sub = cleanLine(identity?.sub || '');
  if (!sub) return title;
  const name = cleanLine(identity?.name || '') || sub;
  return [
    title,
    '',
    `Hanzo-Edit-Admin: ${sub}`,
    `Co-authored-by: ${name} <${sub}@users.hanzo.id>`,
  ].join('\n');
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
