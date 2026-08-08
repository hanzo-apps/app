/**
 * @jest-environment node
 */
/**
 * The pod as a working copy of git.hanzo.ai — the two verbs that bracket a turn.
 *
 * THE BUG THESE PIN. `openSandbox` handed back a pod and nothing else, so `dev`
 * coded in an EMPTY directory on the first run of every project; `runHarness`
 * ended without committing anything, so the work sat on a volume that outlived
 * the pod and reached the forge never. What the product drew as "version history"
 * was the browser guessing from a file list.
 *
 * So the assertions are chosen for two properties. They fail if a turn stops
 * becoming a commit — and they fail if the forge credential ever appears in a
 * COMMAND, which is the one place it must not be: `sh -c` puts a command in the
 * pod's process table, git repeats a remote URL in every error it prints, and a
 * clone URL carrying a token is written into `.git/config` for good.
 *
 * The sandbox is a recording fake rather than a pod, because what is under test
 * is the script this module writes and where it puts the secret — a live pod
 * would prove git works, which nobody doubts.
 */
import { http, HttpResponse } from 'msw';

import { server } from '../../jest.setup';
import type { ExecResult } from '@/lib/agent/fs';

const FORGE = 'https://git.hanzo.ai';
const TOKEN = 'forge-token-abc123';

beforeAll(() => {
  process.env.GIT_FORGE_URL = FORGE;
  process.env.GIT_FORGE_TOKEN = TOKEN;
});

/** A sandbox that records what it was asked to run, and answers as told. */
function pod(answer: Partial<ExecResult> = {}) {
  const ran: { command: string; stdin?: string }[] = [];
  return {
    ran,
    exec: async (command: string, _timeoutSec?: number, stdin?: string): Promise<ExecResult> => {
      ran.push({ command, stdin });
      return { exitCode: 0, stdout: '', stderr: '', ...answer };
    },
  };
}

/** The forge, answering as it does for a repo that is already there. */
function repoExists() {
  server.use(
    http.get(`${FORGE}/v1/repos/:owner/:name`, () =>
      HttpResponse.json({
        full_name: 'antje/luxquest',
        html_url: `${FORGE}/antje/luxquest`,
        default_branch: 'main',
      }),
    ),
  );
}

const REPO = { owner: 'antje', name: 'luxquest' };

describe('checkout — the pod holds the project', () => {
  it('clones the project repo, and only when there is not one already', async () => {
    repoExists();
    const box = pod();
    const { checkout } = await import('@/lib/agent/checkout');

    expect(await checkout(box, REPO)).toBe('');

    const { command } = box.ran[0];
    // The guard IS the resume story: the project volume re-attaches on the next
    // create, and a second clone would throw away the tree — and node_modules,
    // which is most of what makes a warm sandbox worth having.
    expect(command).toContain('[ -d .git ] || git clone');
    expect(command).toContain(`${FORGE}/antje/luxquest.git`);
  });

  it('keeps dependencies out of the history, without writing into the repo', async () => {
    repoExists();
    const box = pod();
    const { checkout } = await import('@/lib/agent/checkout');
    await checkout(box, REPO);

    const { command } = box.ran[0];
    // `git add -A` takes everything, and the projects the browser built have no
    // .gitignore at all — their pages went through the forge API, never through
    // a git client. One `pnpm install` would otherwise put a few hundred
    // megabytes in the history on every turn.
    expect(command).toContain('.git/info/exclude');
    expect(command).toContain("'node_modules'");
    // info/exclude belongs to the CLONE, so nothing appears in the repo that its
    // author did not write.
    expect(command).not.toContain('> .gitignore');
  });

  it('never puts the credential in a command — it goes in on stdin', async () => {
    repoExists();
    const box = pod();
    const { checkout } = await import('@/lib/agent/checkout');
    await checkout(box, REPO);

    const { command, stdin } = box.ran[0];
    // The whole point. A token in the clone URL lands in `ps`, in `.git/config`,
    // and in the text of every error git prints about the remote.
    expect(command).not.toContain(TOKEN);
    expect(stdin).toContain(TOKEN);
    expect(stdin).toContain('x-access-token');
    // Where git's own `store` helper looks, and 0600 because it is a secret.
    expect(command).toContain('$HOME/.git-credentials');
    expect(command).toContain('umask 077');
    expect(command).toContain('credential.helper store');
  });

  it('says WHY when the pod could not be made a working copy', async () => {
    repoExists();
    const box = pod({ exitCode: 128, stderr: "fatal: destination path '.' already exists" });
    const { checkout } = await import('@/lib/agent/checkout');

    const stranded = await checkout(box, REPO);
    // Not a boolean: the run continues on a real disk, and the person is owed the
    // difference between "the forge is down" and "this volume already holds
    // something that is not a checkout".
    expect(stranded).toContain('antje/luxquest');
    expect(stranded).toContain('already exists');
  });

  it('refuses to pretend when the forge credential is not configured', async () => {
    jest.resetModules();
    const had = process.env.GIT_FORGE_TOKEN;
    delete process.env.GIT_FORGE_TOKEN;
    try {
      const box = pod();
      const { checkout } = await import('@/lib/agent/checkout');
      const stranded = await checkout(box, REPO);
      expect(stranded).toMatch(/GIT_FORGE_TOKEN/);
      // And it does not run anything: there is nothing it could usefully do.
      expect(box.ran).toHaveLength(0);
    } finally {
      process.env.GIT_FORGE_TOKEN = had;
      jest.resetModules();
    }
  });
});

describe('land — the turn becomes a commit on git.hanzo.ai', () => {
  it('adds, commits and pushes, with the message on stdin', async () => {
    const box = pod();
    const { land } = await import('@/lib/agent/checkout');

    expect(await land(box, REPO, '.', 'add a footer')).toBe('');

    const { command, stdin } = box.ran[0];
    expect(command).toContain('git add -A');
    // `-F -` because the message is a person's prose, and prose spliced into a
    // shell word is an injection waiting for the first backtick.
    expect(command).toContain('git commit --quiet --allow-empty -F -');
    expect(command).toContain(`git push --quiet '${FORGE}/antje/luxquest.git' HEAD:main`);
    expect(stdin).toContain('add a footer');
    // One commit-message shape across every writer, forge API and pod alike.
    expect(stdin).toContain('Co-authored-by: Hanzo Dev <dev@hanzo.ai>');
  });

  it('commits as the project owner, for the replay as well as the commit', async () => {
    const box = pod();
    const { land } = await import('@/lib/agent/checkout');
    await land(box, REPO, '.', 'x');

    const { command } = box.ran[0];
    expect(command).toContain("GIT_AUTHOR_NAME='antje'");
    expect(command).toContain("GIT_AUTHOR_EMAIL='antje@git.hanzo.ai'");
    // The rebase rewrites the commit, so it needs a committer too. Naming the
    // identity once is what stops the commit and its replay being attributed to
    // two different people.
    expect(command).toContain('GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME"');
  });

  it('catches up on the branch before pushing, and aborts a replay it cannot do', async () => {
    const box = pod();
    const { land } = await import('@/lib/agent/checkout');
    await land(box, REPO, '.', 'x');

    const { command } = box.ran[0];
    // `/v1/git/native` commits the browser's pages to this SAME repo, so a
    // project used in both modes has a branch that moved under the pod's clone
    // and a straight push is rejected as a non-fast-forward.
    expect(command).toContain(`git fetch --quiet '${FORGE}/antje/luxquest.git' main`);
    expect(command).toContain('git rebase --quiet FETCH_HEAD');
    expect(command).toContain('git rebase --abort');
  });

  it('carries no credential at all — the checkout already stored it', async () => {
    const box = pod();
    const { land } = await import('@/lib/agent/checkout');
    await land(box, REPO, '.', 'x');
    expect(box.ran[0].command).not.toContain(TOKEN);
    expect(box.ran[0].stdin).not.toContain(TOKEN);
  });

  it('says the turn is on the disk and not on the forge when the push fails', async () => {
    const box = pod({ exitCode: 1, stderr: 'error: failed to push some refs' });
    const { land } = await import('@/lib/agent/checkout');

    const why = await land(box, REPO, '.', 'x');
    // The work is real either way; what is missing is the revision, and that is
    // the exact silence this whole path exists to end.
    expect(why).toContain('not on git.hanzo.ai');
    expect(why).toContain('failed to push');
  });
});

/**
 * And the door does it. `openSandbox` is where every surface gets a project's
 * pod, and it used to hand back a pod that had never heard of the project.
 */
describe('openSandbox hands back a pod that holds the project', () => {
  const CLOUD = 'https://api.hanzo.test/v1';

  it('clones the repo into the fresh pod, before anything runs in it', async () => {
    const commands: string[] = [];
    repoExists();
    server.use(
      http.post(`${CLOUD}/sandboxes`, () =>
        HttpResponse.json({ id: 'sbx-1', project: 'luxquest', status: 'running' }, { status: 201 }),
      ),
      http.post(`${CLOUD}/sandboxes/run`, async ({ request }) => {
        const { command } = (await request.json()) as { command: string };
        commands.push(command);
        return HttpResponse.json({ exitCode: 0, stdout: '', stderr: '' });
      }),
    );

    const { openSandbox } = await import('@/lib/agent/sandbox');
    const opened = await openSandbox({
      baseUrl: CLOUD,
      token: 'iam-bearer',
      project: 'luxquest',
      repo: REPO,
    });

    expect(opened).toEqual({ sandbox: expect.objectContaining({ id: 'sbx-1' }) });
    expect(commands).toHaveLength(1);
    expect(commands[0]).toContain('git clone');
  });

  it('hands the pod back anyway when it could not be made one, saying so', async () => {
    repoExists();
    server.use(
      http.post(`${CLOUD}/sandboxes`, () =>
        HttpResponse.json({ id: 'sbx-2', status: 'running' }, { status: 201 }),
      ),
      http.post(`${CLOUD}/sandboxes/run`, () =>
        HttpResponse.json({ exitCode: 128, stdout: '', stderr: 'fatal: could not read Username' }),
      ),
    );

    const { openSandbox } = await import('@/lib/agent/sandbox');
    const opened = await openSandbox({
      baseUrl: CLOUD,
      token: 'iam-bearer',
      project: 'luxquest',
      repo: REPO,
    });

    // It has a disk and a toolchain and the run can use both. What it has lost is
    // the ability to turn the turn into history — which is said, not discovered
    // later by somebody looking for their commits.
    expect('sandbox' in opened && opened.sandbox.id).toBe('sbx-2');
    expect('sandbox' in opened && opened.stranded).toContain('could not read Username');
  });
});

/**
 * And the harness actually calls it. The two verbs above can be perfect and the
 * turn still reach nobody if `runHarness` ends where it used to end.
 */
describe('runHarness ends the turn with a commit', () => {
  /** A pod that answers every command, and remembers the order it got them in. */
  function harnessPod() {
    const ran: string[] = [];
    return {
      ran,
      exec: async (command: string): Promise<ExecResult> => {
        ran.push(command);
        // No JSONL: what is under test is what happens AFTER dev returns.
        return { exitCode: 0, stdout: '', stderr: '' };
      },
    };
  }

  it('runs dev, reads what changed, THEN commits and pushes', async () => {
    const box = harnessPod();
    const { runHarness } = await import('@/lib/agent/harness');

    const result = await runHarness(box, { task: 'add a footer', token: 't', repo: REPO }, () => {});

    expect(box.ran).toHaveLength(3);
    expect(box.ran[0]).toContain('dev exec');
    // The enumeration has to come FIRST: after the commit the tree is clean and
    // the honest answer to "what changed" is nothing.
    expect(box.ran[1]).toContain('git status --porcelain -uall');
    expect(box.ran[2]).toContain('git push');
    expect(result.unpushed).toBeUndefined();
  });

  it('does not commit a turn whose harness fell over', async () => {
    const ran: string[] = [];
    const box = {
      exec: async (command: string): Promise<ExecResult> => {
        ran.push(command);
        return { exitCode: command.includes('dev exec') ? 1 : 0, stdout: '', stderr: '' };
      },
    };
    const { runHarness } = await import('@/lib/agent/harness');
    await runHarness(box, { task: 'x', token: 't', repo: REPO }, () => {});

    // A commit of a half-finished edit is a revision somebody has to work out how
    // to undo. The files stay on the volume for the next turn to finish.
    expect(ran.some((c) => c.includes('git push'))).toBe(false);
  });

  it('pushes nowhere when the run has no repo — that is the scratch case, not a failure', async () => {
    const box = harnessPod();
    const { runHarness } = await import('@/lib/agent/harness');

    const result = await runHarness(box, { task: 'x', token: 't' }, () => {});

    expect(box.ran.some((c) => c.includes('git push'))).toBe(false);
    expect(result.unpushed).toBeUndefined();
  });

  it('reports a turn that ran but did not reach the forge', async () => {
    const box = {
      exec: async (command: string): Promise<ExecResult> =>
        command.includes('git push') || command.includes('git commit')
          ? { exitCode: 1, stdout: '', stderr: 'the remote hung up' }
          : { exitCode: 0, stdout: '', stderr: '' },
    };
    const { runHarness } = await import('@/lib/agent/harness');
    const result = await runHarness(box, { task: 'x', token: 't', repo: REPO }, () => {});

    expect(result.unpushed).toContain('the remote hung up');
  });
});
