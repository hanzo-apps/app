/**
 * GitHub driver for the `GitProvider` abstraction (`lib/edit/provider.ts`).
 *
 * Implements the fork→edit→PR primitives over the GitHub REST API (no local git
 * binary / clone), reusing the same auth + error shape as the builder's push
 * client (`lib/git/sync.ts`): `Authorization: Bearer <token>`, the versioned
 * `X-GitHub-Api-Version` header, and the typed `GitSyncError` (401/403 → the
 * status is preserved so the route can prompt "connect GitHub"; everything else
 * folds to 502). PURE: the token is injected, `fetch` is global — unit-testable
 * by mocking `fetch`.
 */
import { GitSyncError, GITHUB_API } from '@/lib/git/sync';

import type {
  FileContent,
  GitProvider,
  IssueResult,
  PrResult,
  ProviderName,
  RepoRef,
} from './provider';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const b64encode = (s: string) => Buffer.from(s, 'utf8').toString('base64');
const b64decode = (s: string) => Buffer.from(s, 'base64').toString('utf8');

const enc = encodeURIComponent;

export class GitHubProvider implements GitProvider {
  readonly name: ProviderName = 'github';
  private readonly token: string;

  constructor(token: string) {
    this.token = token;
  }

  private headers(json: boolean): Record<string, string> {
    const h: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'hanzo-edit',
    };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }

  private req(method: string, path: string, body?: unknown): Promise<Response> {
    return fetch(`${GITHUB_API}${path}`, {
      method,
      headers: this.headers(body !== undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  }

  private async fail(res: Response, what: string): Promise<never> {
    const text = await res.text().catch(() => '');
    const status = res.status === 401 || res.status === 403 ? res.status : 502;
    const code = res.status === 401 || res.status === 403 ? 'forbidden' : 'git_error';
    throw new GitSyncError(
      `github ${what} failed (${res.status})${text ? `: ${text.slice(0, 300)}` : ''}`,
      status,
      code,
    );
  }

  async whoami(): Promise<string> {
    const res = await this.req('GET', '/user');
    if (!res.ok) return this.fail(res, 'GET /user');
    return ((await res.json()) as { login: string }).login;
  }

  async getFile(repo: RepoRef, path: string, ref: string): Promise<FileContent> {
    const res = await this.req(
      'GET',
      `/repos/${enc(repo.owner)}/${enc(repo.repo)}/contents/${path.split('/').map(enc).join('/')}?ref=${enc(ref)}`,
    );
    if (res.status === 404) return { content: '', sha: null, exists: false };
    if (!res.ok) return this.fail(res, `read ${path}`);
    const json = (await res.json()) as { content?: string; encoding?: string; sha: string; type: string };
    if (json.type !== 'file') {
      throw new GitSyncError(`${path} is not a file`, 400, 'not_a_file');
    }
    // The contents API returns base64 (newline-wrapped). A very large file is
    // served without inline content — fall back to the blob API by sha.
    const content =
      json.encoding === 'base64' && typeof json.content === 'string'
        ? b64decode(json.content.replace(/\n/g, ''))
        : await this.blob(repo, json.sha);
    return { content, sha: json.sha, exists: true };
  }

  /** Fetch a blob by sha (large-file fallback for getFile). */
  private async blob(repo: RepoRef, sha: string): Promise<string> {
    const res = await this.req('GET', `/repos/${enc(repo.owner)}/${enc(repo.repo)}/git/blobs/${enc(sha)}`);
    if (!res.ok) return this.fail(res, 'read blob');
    const json = (await res.json()) as { content: string; encoding: string };
    return json.encoding === 'base64' ? b64decode(json.content.replace(/\n/g, '')) : json.content;
  }

  async hasWriteAccess(repo: RepoRef): Promise<boolean> {
    const res = await this.req('GET', `/repos/${enc(repo.owner)}/${enc(repo.repo)}`);
    if (res.status === 404) return false; // not visible to this token ⇒ no write
    if (!res.ok) return this.fail(res, 'repo lookup');
    const json = (await res.json()) as { permissions?: { push?: boolean; maintain?: boolean; admin?: boolean } };
    const p = json.permissions;
    return Boolean(p && (p.push || p.maintain || p.admin));
  }

  async fork(repo: RepoRef): Promise<RepoRef> {
    const res = await this.req('POST', `/repos/${enc(repo.owner)}/${enc(repo.repo)}/forks`, {});
    if (!res.ok && res.status !== 202) return this.fail(res, 'fork');
    const json = (await res.json()) as { owner: { login: string }; name: string };
    const forked: RepoRef = { owner: json.owner.login, repo: json.name };
    // Forking is async: poll until the fork's default ref is queryable (GitHub
    // recommends up to ~5 min; a fresh fork is usually ready within seconds).
    for (let i = 0; i < 10; i++) {
      const ok = await this.req('GET', `/repos/${enc(forked.owner)}/${enc(forked.repo)}`);
      if (ok.ok) return forked;
      await sleep(1500);
    }
    return forked; // best-effort: createBranch retries the ref read too
  }

  async syncBase(repo: RepoRef, branch: string): Promise<void> {
    // Fast-forward a fork's branch to its upstream parent. Best-effort: a fresh
    // fork is already even (no-op), and a diverged fork that can't fast-forward
    // (409) is left as-is — the commit still lands, only the diff may be noisier.
    try {
      await this.req('POST', `/repos/${enc(repo.owner)}/${enc(repo.repo)}/merge-upstream`, { branch });
    } catch {
      /* best-effort */
    }
  }

  async createBranch(repo: RepoRef, fromRef: string, newBranch: string): Promise<void> {
    // Read the tip of the base ref (retry to absorb fork propagation).
    let sha = '';
    for (let i = 0; i < 6 && !sha; i++) {
      const res = await this.req('GET', `/repos/${enc(repo.owner)}/${enc(repo.repo)}/git/ref/heads/${enc(fromRef)}`);
      if (res.ok) {
        sha = ((await res.json()) as { object: { sha: string } }).object.sha;
        break;
      }
      if (res.status !== 404 && res.status !== 409) return this.fail(res, 'read base ref');
      await sleep(1500);
    }
    if (!sha) throw new GitSyncError(`base branch "${fromRef}" not found`, 404, 'no_base');

    const res = await this.req('POST', `/repos/${enc(repo.owner)}/${enc(repo.repo)}/git/refs`, {
      ref: `refs/heads/${newBranch}`,
      sha,
    });
    if (res.status === 422) {
      // Ref already exists (a retried run) — acceptable, reuse it.
      return;
    }
    if (!res.ok) return this.fail(res, 'create branch');
  }

  async commitFile(
    repo: RepoRef,
    branch: string,
    path: string,
    content: string,
    message: string,
    sha: string | null,
  ): Promise<{ commitSha: string }> {
    const res = await this.req(
      'PUT',
      `/repos/${enc(repo.owner)}/${enc(repo.repo)}/contents/${path.split('/').map(enc).join('/')}`,
      {
        message,
        content: b64encode(content),
        branch,
        ...(sha ? { sha } : {}),
      },
    );
    if (!res.ok) return this.fail(res, 'commit file');
    const json = (await res.json()) as { commit: { sha: string } };
    return { commitSha: json.commit.sha };
  }

  async openPR(repo: RepoRef, base: string, head: string, title: string, body: string): Promise<PrResult> {
    const res = await this.req('POST', `/repos/${enc(repo.owner)}/${enc(repo.repo)}/pulls`, {
      title,
      head,
      base,
      body,
      maintainer_can_modify: true,
    });
    if (!res.ok) return this.fail(res, 'open PR');
    const json = (await res.json()) as { html_url: string; number: number };
    return { prUrl: json.html_url, number: json.number };
  }

  async openIssue(repo: RepoRef, title: string, body: string): Promise<IssueResult> {
    const res = await this.req('POST', `/repos/${enc(repo.owner)}/${enc(repo.repo)}/issues`, {
      title,
      body,
      labels: ['hanzo-edit', 'suggestion'],
    });
    if (!res.ok) return this.fail(res, 'open issue');
    const json = (await res.json()) as { html_url: string; number: number };
    return { issueUrl: json.html_url, number: json.number };
  }
}
