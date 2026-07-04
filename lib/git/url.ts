/**
 * Git remote URL recognition + parsing — the ONE shared source of truth.
 *
 * Used by the /new composer, the import panel's paste box, and the /dev repo
 * loader so a repository URL is recognized and parsed IDENTICALLY everywhere
 * (DRY — never two divergent `isGitUrl` regexes again).
 *
 * We recognize ANY git remote, not just github/gitlab/bitbucket:
 *   - `https://<any-host>/<path>.git`           (explicit git suffix, any host)
 *   - `https://<git-host>/<owner>/<repo>`        (known/git-ish host, no suffix)
 *   - `git@<host>:<owner>/<repo>(.git)`          (scp-like ssh)
 *   - `ssh://[user@]<host>[:port]/<path>`        (ssh transport)
 *   - `git://<host>/<path>`                      (git transport)
 *   - `<owner>/<repo>`                           (github shorthand)
 *
 * The builder recreates a repository from its metadata over PUBLIC HTTPS; it has
 * no credentials to reach an SSH/private remote. So we separate two questions:
 *   - `isGitUrl`  — is this a git remote at all? (drives the Deploy affordance)
 *   - `gitUrlGateMessage` — can we HONESTLY import it, or must we tell the user
 *     "public HTTPS only for now"? (drives an honest submit, never a dead end)
 */

export type GitProtocol = 'https' | 'http' | 'ssh' | 'git' | 'scp';

export interface ParsedGitUrl {
  protocol: GitProtocol;
  host: string;
  /** First path segment (the user/org/group). */
  owner: string;
  /** Repository name, without a trailing `.git`. */
  name: string;
  /** Full repo path (`owner/.../repo`), `.git` stripped — supports nested groups. */
  path: string;
  /** Normalized https URL when derivable (used as the canonical clone/display URL). */
  httpsUrl: string;
  /** True only for the http/https transport — the one the builder can fetch. */
  isPublicHttps: boolean;
  /** Best-effort provider label from the host. */
  provider: 'github' | 'gitlab' | 'bitbucket' | 'other';
}

/**
 * Hosts we treat as git even without a `.git` suffix. Deliberately broad — a
 * host that starts with `git.` (git.sr.ht, git.example.com) or names a known
 * forge counts; a random `example.com` does not (it needs the `.git` suffix).
 */
const GIT_HOST =
  /(^git\.)|(\.git\.)|(^|\.)(github|gitlab|bitbucket|gitea|codeberg|gitee)\b|(^|\.)sr\.ht$/i;

function providerOf(host: string): ParsedGitUrl['provider'] {
  const h = host.toLowerCase();
  if (h.includes('github')) return 'github';
  if (h.includes('gitlab')) return 'gitlab';
  if (h.includes('bitbucket')) return 'bitbucket';
  return 'other';
}

function stripDotGit(p: string): string {
  return p.replace(/\.git$/i, '');
}

/** Split a cleaned `owner/.../repo` path into `{ owner, name, path }`. */
function splitPath(rawPath: string): { owner: string; name: string; path: string } | null {
  const clean = stripDotGit(rawPath.replace(/^\/+/, '').replace(/\/+$/, ''));
  if (!clean) return null;
  const segs = clean.split('/').filter(Boolean);
  if (segs.length < 2) return null;
  return { owner: segs[0], name: segs[segs.length - 1], path: clean };
}

/**
 * Parse a git remote URL into its parts, or `null` when it is not a git remote.
 * The single recognizer behind `isGitUrl` and the /dev loader.
 */
export function parseGitUrl(input: string): ParsedGitUrl | null {
  const s = (input || '').trim();
  if (!s) return null;

  // scp-like ssh: user@host:owner/repo(.git)  — no scheme, single ':' before path
  const scp = /^([\w.+-]+)@([\w.-]+):(?!\/\/)(.+)$/.exec(s);
  if (scp) {
    const parts = splitPath(scp[3]);
    if (!parts) return null;
    const host = scp[2];
    return {
      protocol: 'scp',
      host,
      ...parts,
      httpsUrl: `https://${host}/${parts.path}`,
      isPublicHttps: false,
      provider: providerOf(host),
    };
  }

  // Explicit schemes.
  const scheme = /^([a-z][a-z0-9+.-]*):\/\//i.exec(s);
  if (scheme) {
    const proto = scheme[1].toLowerCase();
    let url: URL;
    try {
      url = new URL(s);
    } catch {
      return null;
    }
    const parts = splitPath(url.pathname);
    if (!parts) return null;
    const host = url.host;

    if (proto === 'http' || proto === 'https') {
      const endsDotGit = /\.git\/?$/i.test(url.pathname);
      // Accept an arbitrary host only with a `.git` suffix; a git-ish host is
      // accepted bare. Anything else (a random web page) is not a git remote.
      if (!endsDotGit && !GIT_HOST.test(host)) return null;
      return {
        protocol: proto,
        host,
        ...parts,
        httpsUrl: `https://${host}/${parts.path}`,
        isPublicHttps: true,
        provider: providerOf(host),
      };
    }
    if (proto === 'ssh' || proto === 'git') {
      return {
        protocol: proto,
        host,
        ...parts,
        httpsUrl: `https://${host}/${parts.path}`,
        isPublicHttps: false,
        provider: providerOf(host),
      };
    }
    return null;
  }

  // Bare `github.com/owner/repo` (no scheme) — treat as https.
  if (/^[\w.-]+\.[\w.-]+\/[\w./~-]+$/.test(s)) {
    const host = s.split('/')[0];
    const parts = splitPath(s.slice(host.length));
    if (!parts) return null;
    if (!/\.git$/i.test(s) && !GIT_HOST.test(host)) return null;
    return {
      protocol: 'https',
      host,
      ...parts,
      httpsUrl: `https://${host}/${parts.path}`,
      isPublicHttps: true,
      provider: providerOf(host),
    };
  }

  // GitHub shorthand: `owner/repo`.
  if (/^[\w.-]+\/[\w.-]+$/.test(s)) {
    const parts = splitPath(s);
    if (!parts) return null;
    return {
      protocol: 'https',
      host: 'github.com',
      ...parts,
      httpsUrl: `https://github.com/${parts.path}`,
      isPublicHttps: true,
      provider: 'github',
    };
  }

  return null;
}

/** Is this any git remote URL? (Broad — drives the Deploy affordance.) */
export function isGitUrl(v: string): boolean {
  return parseGitUrl(v) !== null;
}

/**
 * Honest gate for a submit: `null` when the URL can be imported (public HTTPS),
 * otherwise a plain message explaining why it can't be yet. Non-git input also
 * returns `null` (it is handled as a natural-language brief, not a git error).
 */
export function gitUrlGateMessage(v: string): string | null {
  const parsed = parseGitUrl(v);
  if (!parsed) return null;
  if (!parsed.isPublicHttps) {
    return 'Public HTTPS repository URLs only for now — SSH and private remotes aren’t supported yet.';
  }
  return null;
}
