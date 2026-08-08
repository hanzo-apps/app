/**
 * The `GitProvider` abstraction for Hanzo Edit — ONE interface every forge
 * (GitHub, GitLab, git.hanzo.ai/Gitea) implements, so the fork→edit→PR flow
 * (`lib/edit/flow.ts`) is written ONCE against this shape and each forge is a
 * drop-in. A page declares its forge via `<meta name="hanzo:provider">` (default
 * `github`); `providerFor(name, token)` binds the acting identity's token to a
 * concrete driver.
 *
 * PURE with respect to the runtime: the resolved provider token is passed to the
 * constructor (the route resolves it SERVER-SIDE via IAM — see `lib/edit/token.ts`
 * — so it never reaches the browser), and the global `fetch` is used, so every
 * driver is unit-testable by mocking `fetch`. Errors are the shared, typed
 * `GitSyncError` (carries the HTTP status the route maps through). Fail-closed.
 */
import { GitSyncError } from '@/lib/git/sync';

import { GitHubProvider } from './github';

/**
 * The forges Hanzo Edit can open a PR against.
 *
 * `hanzo` is git.hanzo.ai — OUR git, and it is named for us rather than for the
 * project it forked. That is not cosmetic: the rest of the app already calls it
 * `hanzo` (lib/api/git.ts, lib/git/sync.ts), and while this module called the
 * same forge `gitea` a translator had to sit between them. One name, no
 * translator.
 */
export type ProviderName = 'github' | 'gitlab' | 'hanzo';

/** An owner/repo pair (the unit every provider method addresses). */
export interface RepoRef {
  owner: string;
  repo: string;
}

/** A file read from the forge: decoded UTF-8 content + its blob sha (for update). */
export interface FileContent {
  /** Decoded UTF-8 file contents ('' when the file does not yet exist). */
  content: string;
  /** The forge blob sha, needed to UPDATE the file; null when it does not exist. */
  sha: string | null;
  /** False when the path does not exist on `ref` (⇒ the edit CREATES it). */
  exists: boolean;
}

/** The opened pull/merge request. */
export interface PrResult {
  prUrl: string;
  number: number;
}

/** The opened lightweight issue (the anonymous "suggest" path). */
export interface IssueResult {
  issueUrl: string;
  number: number;
}

/**
 * One forge, bound to an acting identity's token. The fork→edit→PR flow calls
 * these in order; a driver never decides policy (who may edit) — that is the
 * route's gate. Every method throws `GitSyncError` (with an HTTP status) on
 * failure.
 */
export interface GitProvider {
  readonly name: ProviderName;

  /** The authenticated identity's login (the head-ref owner when forking). */
  whoami(): Promise<string>;

  /** Read a file at `ref`. A missing file resolves to `{exists:false}` (create). */
  getFile(repo: RepoRef, path: string, ref: string): Promise<FileContent>;

  /** Can the acting identity push to `repo`? Decides direct-branch vs fork. */
  hasWriteAccess(repo: RepoRef): Promise<boolean>;

  /** Fork `repo` to the acting identity's account; returns the fork's ref. */
  fork(repo: RepoRef): Promise<RepoRef>;

  /**
   * Best-effort: fast-forward a FORK's `branch` to its upstream parent, so a
   * pre-existing (stale) fork branches from the same tip the file was read at.
   * Optional — a forge without a native sync omits it (the flow tolerates that).
   */
  syncBase?(repo: RepoRef, branch: string): Promise<void>;

  /** Create `newBranch` on `repo` pointing at the tip of `fromRef`. */
  createBranch(repo: RepoRef, fromRef: string, newBranch: string): Promise<void>;

  /** Commit ONE file to `branch` on `repo` (`sha` = current blob sha, or null to create). */
  commitFile(
    repo: RepoRef,
    branch: string,
    path: string,
    content: string,
    message: string,
    sha: string | null,
  ): Promise<{ commitSha: string }>;

  /** Open a PR on `repo` (the UPSTREAM) from `head` (`owner:branch` when forked) into `base`. */
  openPR(repo: RepoRef, base: string, head: string, title: string, body: string): Promise<PrResult>;

  /** Open a lightweight issue on `repo` (the anonymous suggest path). */
  openIssue(repo: RepoRef, title: string, body: string): Promise<IssueResult>;

  /** The forge web URL for a commit sha (pure). Used to link a direct commit. */
  commitUrl?(repo: RepoRef, sha: string): string;
}

/**
 * A provider that is declared but not yet implemented. Every method fails closed
 * with an honest 501 so the widget can say "PRs for <forge> are coming" rather
 * than a dead click. THE SLOT-IN SEAM: to add GitLab or Gitea, write
 * `lib/edit/gitlab.ts` / `lib/edit/hanzo.ts` implementing `GitProvider` (mirror
 * `lib/edit/github.ts`) and return it from `providerFor` in place of this stub.
 */
function unimplementedProvider(name: ProviderName): GitProvider {
  const nope = (): never => {
    throw new GitSyncError(`${name} PRs are not available yet.`, 501, 'not_implemented');
  };
  return {
    name,
    whoami: nope,
    getFile: nope,
    hasWriteAccess: nope,
    fork: nope,
    createBranch: nope,
    commitFile: nope,
    openPR: nope,
    openIssue: nope,
  };
}

/** Bind a forge driver to an acting identity's token. GitHub is live (increment 1). */
export function providerFor(name: ProviderName, token: string): GitProvider {
  switch (name) {
    case 'github':
      // github.ts imports only the (erased) types from here, so this static edge
      // is the ONLY runtime dependency — no cycle.
      return new GitHubProvider(token);
    case 'gitlab':
    case 'hanzo':
      // TODO(increment 2): real drivers — see unimplementedProvider's note.
      return unimplementedProvider(name);
  }
}

/**
 * Coerce an arbitrary string to a known ProviderName (default github).
 *
 * This reads a `<meta name="hanzo:provider">` off a page we do not control, so
 * it is tolerant at the BOUNDARY and strict everywhere inside: `gitea` is
 * accepted as a spelling of `hanzo` because pages already carry it, and letting
 * it fall through to the `github` default would silently aim a Hanzo Git page at
 * GitHub. Tolerance belongs in the parser, not in a translator downstream.
 */
export function providerName(v: unknown): ProviderName {
  if (v === 'gitlab' || v === 'hanzo') return v;
  return v === 'gitea' ? 'hanzo' : 'github';
}
