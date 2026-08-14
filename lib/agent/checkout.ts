import 'server-only';

/**
 * The pod as a WORKING COPY of git.hanzo.ai — the half that was missing.
 *
 * A sandbox held a disk and a toolchain and nothing else. `dev` opened it, found
 * an empty directory on the first run of every project, wrote the work into it,
 * and the run ended: the pod was released, the volume kept the files, and NOTHING
 * ever reached the forge. What the browser then drew as "version history" was
 * reconstructed from the `done` event's file list and committed by the tab that
 * happened to be open — a second, weaker copy of a history the pod was in a
 * position to write correctly and never did.
 *
 * So there are two verbs here and they bracket a turn:
 *
 *   checkout   before anything runs — the pod holds the project's repo
 *   land       after the turn        — the turn is a commit on git.hanzo.ai
 *
 * WHERE THE SECRET IS, AND WHERE IT IS NOT. The forge credential is the server's
 * (`GIT_FORGE_TOKEN`, the same one `lib/git/forge.ts` writes commits with); the
 * browser never holds it and neither does any command line. It arrives on the
 * command's STDIN — the one input `sh -c` does not put in the process table — and
 * is written to a 0600 `~/.git-credentials`, which is where git's own `store`
 * helper looks. Every URL that then appears in `.git/config`, in `ps`, and in
 * git's error text is clean. Writing it ONCE at checkout is also why `land` needs
 * no secret at all.
 *
 * Both verbs answer with a SENTENCE, empty when nothing is wrong. Not a boolean:
 * "the forge is not wired", "the volume already holds files that are not a
 * checkout" and "the repo moved on under us" each need a different thing done
 * about them, and a caller holding `false` can only say that something did not
 * work. Neither throws — a turn's work is real whether or not it became history,
 * and losing the turn to report a failed push would be the larger loss.
 */

import { ensureRepo, forgeConfigured, forgeRemote } from '@/lib/git/forge';
import { commitMessage } from '@/lib/git/coauthor';
import { quote } from '@/lib/shell';
import type { ProjectExec } from './fs';

/**
 * A project's repo on git.hanzo.ai.
 *
 * The SAME pair `/v1/git/native` commits to: the owner is the caller's IAM
 * username (which the forge auto-registered as an account), the name is the
 * project slug. There is deliberately no second derivation of either — a sandbox
 * that cloned a differently-named repo than the one the rest of the app commits
 * to would be the original bug with an extra step.
 */
export interface Repo {
  owner: string;
  name: string;
}

/** A cold clone of a real project over the pod's network. */
const CLONE_TIMEOUT_SEC = 240;

/** Commit, catch up on the branch, push. */
const LAND_TIMEOUT_SEC = 180;

/**
 * What a turn must never commit, written into `.git/info/exclude`.
 *
 * `git add -A` takes everything, and the first `pnpm install` in a project whose
 * repo has no `.gitignore` — which is every project the browser built, since its
 * pages were committed through the forge API and never through a git client —
 * would otherwise put a few hundred megabytes of dependencies in the history, on
 * every turn, forever.
 *
 * `info/exclude` and not a `.gitignore`: it is git's own mechanism for ignores
 * that belong to a CLONE rather than to the project, so nothing appears in the
 * repo that its author did not write. A project that ships its own `.gitignore`
 * keeps it — these are additional, not a replacement.
 */
const NEVER_COMMIT = ['node_modules', '.next', 'dist', '.venv', '__pycache__', '.DS_Store'];

/** What the sandbox said, trimmed to a sentence a person will actually read. */
function said(r: { stdout: string; stderr: string }): string {
  return (r.stderr.trim() || r.stdout.trim()).slice(0, 400);
}

/**
 * Make the pod a working copy of `repo`. Answers '' when it is one.
 *
 * `[ -d .git ] ||` is the whole resume story: the project volume is named from
 * org and project and re-attaches on the next create, so a second turn opens onto
 * the tree the first one left. Re-cloning would throw that away — including
 * `node_modules`, which is most of what makes a warm sandbox worth having.
 *
 * The credential is rewritten every time, and must be: `$HOME` is the container's
 * filesystem, not the volume, so it goes away with the pod while the checkout
 * stays. A resumed sandbox has the repo and no way to talk to it.
 *
 * `safe.directory` because the project volume is `root:sandbox` setgid and the
 * container runs as uid 1000: git refuses a repo whose directory it thinks
 * belongs to someone else, and it refuses it with a message about ownership that
 * reads like a permissions bug in the mount.
 */
export async function checkout(box: ProjectExec, repo: Repo, cwd = '.'): Promise<string> {
  if (!forgeConfigured()) {
    return `This sandbox is not a working copy of ${repo.owner}/${repo.name}: git.hanzo.ai is not wired on this deployment (GIT_FORGE_TOKEN). The run still edits the project's disk, but nothing it does becomes history.`;
  }

  let remote: { url: string; credential: string };
  try {
    // Before the clone, because cloning a repo that does not exist yet is a 404
    // the pod reports as an authentication failure — which sends whoever reads it
    // looking for a broken token.
    await ensureRepo(repo.owner, repo.name);
    remote = forgeRemote(repo.owner, repo.name);
  } catch (e) {
    return `Could not open ${repo.owner}/${repo.name} on git.hanzo.ai: ${e instanceof Error ? e.message : String(e)}`;
  }

  const script = [
    `cd ${quote(cwd)} 2>/dev/null || cd .`,
    // A container image need not declare HOME, and `kubectl exec` adds nothing.
    // Without it `git config --global` refuses outright and `~` resolves to
    // nothing, so the credential would be written where git will never look —
    // and the only symptom would be a clone asking for a password.
    `export HOME="\${HOME:-/tmp}"`,
    `umask 077`,
    // Reads the whole of stdin, so nothing below it competes for the credential.
    `cat > "$HOME/.git-credentials" || exit 1`,
    `git config --global credential.helper store || exit 1`,
    `git config --global safe.directory "$PWD" || exit 1`,
    `[ -d .git ] || git clone --quiet ${quote(remote.url)} . || exit 1`,
    `printf '%s\\n' ${NEVER_COMMIT.map(quote).join(' ')} > .git/info/exclude`,
  ].join('\n');

  try {
    const r = await box.exec(script, CLONE_TIMEOUT_SEC, `${remote.credential}\n`);
    if (r.exitCode === 0) return '';
    return `This sandbox is not a working copy of ${repo.owner}/${repo.name}: ${said(r) || `git exited ${r.exitCode}`}`;
  } catch (e) {
    return `This sandbox could not be made a working copy of ${repo.owner}/${repo.name}: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/**
 * Commit what the turn did and push it. Answers '' when it is on the forge.
 *
 * `--allow-empty` because a turn that changed nothing still HAPPENED, and a
 * history with a gap where a conversation was is a history somebody has to
 * reconcile by hand. The message rides on stdin via `-F -`: it is a person's
 * prose, and prose spliced into a shell word is an injection waiting for the
 * first backtick.
 *
 * The fetch-and-rebase in the middle is not belt and braces. `/v1/git/native`
 * commits the browser's pages to this same repo whenever a Build turn changes
 * them, so a project used in both modes has a branch that moved under the pod's
 * clone, and a straight push is rejected as a non-fast-forward. Rebasing replays
 * this turn on top of what is there; a genuine conflict aborts and SAYS SO, with
 * the commit still sitting on the volume rather than half-applied.
 *
 * The identity is four variables rather than `-c user.*` because `rebase` needs
 * a committer too, and naming it twice is how the commit and the replay of the
 * commit end up attributed to two different people.
 */
export async function land(
  box: ProjectExec,
  repo: Repo,
  cwd: string,
  message: string,
): Promise<string> {
  const { url } = forgeRemote(repo.owner, repo.name);
  const who = repo.owner;
  const script = [
    `cd ${quote(cwd)} 2>/dev/null || cd .`,
    `export HOME="\${HOME:-/tmp}"`,
    `git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo 'the sandbox is not a working copy'; exit 1; }`,
    `export GIT_AUTHOR_NAME=${quote(who)} GIT_AUTHOR_EMAIL=${quote(`${who}@git.hanzo.ai`)}`,
    `export GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME" GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL"`,
    `git add -A || exit 1`,
    `git commit --quiet --allow-empty -F - || exit 1`,
    `git fetch --quiet ${quote(url)} main || exit 1`,
    `git rebase --quiet FETCH_HEAD || { git rebase --abort >/dev/null 2>&1; echo 'the branch moved on and this turn could not be replayed onto it'; exit 1; }`,
    `git push --quiet ${quote(url)} HEAD:main`,
  ].join('\n');

  try {
    const r = await box.exec(script, LAND_TIMEOUT_SEC, commitMessage(message.slice(0, 500)));
    if (r.exitCode === 0) return '';
    return `This turn is on the sandbox's disk but not on git.hanzo.ai: ${said(r) || `git exited ${r.exitCode}`}`;
  } catch (e) {
    return `This turn is on the sandbox's disk but not on git.hanzo.ai: ${e instanceof Error ? e.message : String(e)}`;
  }
}
