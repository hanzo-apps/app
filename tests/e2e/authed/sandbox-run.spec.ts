/**
 * The agent edits a REAL sandbox — proven in a real browser, against production.
 *
 * WHY THIS FILE EXISTS. `lib/agent/loop.ts` falls back to `InMemoryProjectFs`
 * when `runAgent` is handed no `fs`, and that fallback is SILENT: the run
 * streams tool calls, reports `done` with a changed-file list, and the UI shows
 * a happy result, having touched no sandbox at all. Every observable the caller
 * has looks identical either way. So a test that watches the UI and concludes
 * "it worked" is worthless here — it cannot fail when the sandbox is bypassed.
 *
 * The assertions below are chosen for exactly one property: THEY GO RED WHEN THE
 * SANDBOX IS BYPASSED. Three of them, each of which an in-memory map is
 * physically incapable of satisfying:
 *
 *   1. The file is readable through `GET /v1/sandboxes/:id/fs?path=` on an
 *      INDEPENDENT channel — not the stream that would be lying to us.
 *   2. It survives into a FRESH POD. The run's sandbox is released when the run
 *      ends (the pod goes, the project volume stays); asking for the project's
 *      sandbox again gets a new pod on the same disk, and the edit is still
 *      there. A map in a Node process that has since exited cannot do this.
 *   3. A PROCESS INSIDE THE POD reads the bytes back — `POST /:id/exec`, `cat`,
 *      real kernel, real disk. Nothing in memory answers a `cat`.
 *
 * Plus an in-band tell, free: `agentToolDefs` only offers `run_command` when the
 * filesystem can exec. A `tool_call` named `run_command` in the stream is the
 * loop itself saying it was given a sandbox-backed fs.
 *
 * AND A NEGATIVE CONTROL (the last test), which is what makes the rest mean
 * anything: a run naming NEITHER `project` nor `id` reports complete success and
 * creates no sandbox. That is the trap, executable. If that test ever fails
 * because the run now errors instead, the fallback stopped being silent and this
 * file's premise changed.
 *
 * HOW IT TALKS TO THINGS, and why the split is deliberate:
 *   - THE RUN goes through the real browser page — same-origin `fetch` from
 *     hanzo.app, carrying the real IAM session cookie and the browser-set
 *     `Origin`/`Sec-Fetch-Site` that `requireSameOrigin` demands. It is the
 *     request a UI click would make, made where a click would make it.
 *   - THE VERIFICATION does NOT. It goes direct to `api.hanzo.ai` from the test
 *     process with the user's own bearer, because a witness that shares a
 *     process with the accused is not a witness. The page could be mocked, the
 *     BFF could be caching; the sandbox service answering a second, unrelated
 *     caller cannot be either.
 *
 * IT FAILS, IT DOES NOT SKIP. `/v1/sandboxes` may not be deployed yet. A
 * `test.skip()` there would turn "the feature does not exist in production" into
 * a green run, which is the same lie in a different costume. `sandboxService()`
 * throws with the observed status and the running image's `x-api-version`, so
 * the failure names the deploy instead of blaming the test.
 *
 * RUN IT:
 *   E2E_EMAIL=… E2E_PASSWORD=…  pnpm exec playwright test --project=authenticated \
 *     tests/e2e/authed/sandbox-run.spec.ts
 *   (add `--headed` to watch it; `PLAYWRIGHT_BASE_URL=http://localhost:3000` for local)
 */

import { test, expect, type Page } from '@playwright/test';

import { API, CALL_TIMEOUT_MS, bearer, createSandbox, deleteProject, destroy, exec, proofImage, readFile, running, sandboxService, type Sandbox, uniq } from './sandbox-api';

type AgentEvent = {
  type: string;
  name?: string;
  arguments?: string;
  result?: string;
  isError?: boolean;
  message?: string;
  text?: string;
  changed?: string[];
  finishReason?: string;
};

/**
 * Start an agent run FROM THE PAGE and drain its SSE stream.
 *
 * In the page, not from the test process, and that is the whole browser half of
 * this test: `/v1/agents/runs` is cookie-authenticated and guarded by
 * `requireSameOrigin`, which reads `Origin` and `Sec-Fetch-Site` — headers only a
 * browser sets and no script can forge. A `request.post` from Node would either
 * be refused or would prove nothing about the path a user takes. This is the
 * exact request the UI makes, issued from the origin the UI runs on, with the
 * session a real sign-in left behind.
 */
async function agentRun(
  page: Page,
  body: Record<string, unknown>,
  timeoutMs = 180_000,
): Promise<AgentEvent[]> {
  return page.evaluate(
    async ({ body, timeoutMs }) => {
      const res = await fetch('/v1/agents/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        return [
          { type: 'http_error', message: `POST /v1/agents/runs -> ${res.status}: ${text.slice(0, 300)}` },
        ];
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const events: Record<string, unknown>[] = [];
      const deadline = Date.now() + timeoutMs;
      let buf = '';
      for (;;) {
        if (Date.now() > deadline) {
          events.push({ type: 'http_error', message: `agent run exceeded ${timeoutMs}ms` });
          await reader.cancel().catch(() => {});
          break;
        }
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        // SSE frames are separated by a blank line; each carries one JSON event.
        const frames = buf.split('\n\n');
        buf = frames.pop() ?? '';
        for (const frame of frames) {
          for (const line of frame.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
              events.push(JSON.parse(line.slice(6)));
            } catch {
              /* a partial frame is not an event */
            }
          }
        }
      }
      return events;
    },
    { body, timeoutMs },
  ) as Promise<AgentEvent[]>;
}

/** What the stream said, compactly, for a failure message worth reading. */
function transcript(events: AgentEvent[]): string {
  return events
    .map((e) => {
      if (e.type === 'tool_call') return `tool_call ${e.name} ${(e.arguments ?? '').slice(0, 160)}`;
      if (e.type === 'tool_result')
        return `tool_result ${e.name} ${e.isError ? 'ERROR ' : ''}${(e.result ?? '').slice(0, 160)}`;
      if (e.type === 'done') return `done ${e.finishReason} changed=${JSON.stringify(e.changed ?? [])}`;
      if (e.type === 'error' || e.type === 'http_error') return `ERROR ${e.message}`;
      return '';
    })
    .filter(Boolean)
    .join('\n');
}

/** The run must have actually run. A stream that only errored proves nothing either way. */
function assertRan(events: AgentEvent[]): void {
  const failed = events.find((e) => e.type === 'error' || e.type === 'http_error');
  expect(failed, `the agent run itself failed:\n${transcript(events)}`).toBeUndefined();
  expect(
    events.some((e) => e.type === 'done'),
    `the agent run never reached 'done':\n${transcript(events)}`,
  ).toBe(true);
}

test.describe('hanzo.app agent runs edit a REAL sandbox', () => {
  test('the sandbox service is deployed and answers this user', async ({ page, request }) => {
    await page.goto('/dashboard');
    await expect(page, 'signed-in session required — auth.setup.ts should have left one').not.toHaveURL(
      /hanzo\.id|\/login(\?|$)/,
    );
    // Painted, not merely routed. Screenshotting the moment the URL settles
    // catches "Loading your workspace…" and evidences nothing.
    await expect(page.getByText(/ready to build|your projects|dashboard/i).first()).toBeVisible({
      timeout: 20_000,
    });
    await test
      .info()
      .attach('signed-in-dashboard.png', { body: await page.screenshot({ fullPage: false }), contentType: 'image/png' });

    await sandboxService(request, await bearer(page));
  });

  /**
   * THE DEFAULT IMAGE IS PULLABLE — the one thing that separates "the service
   * answers" from "the product works".
   *
   * `openSandbox` in lib/agent/sandbox.ts posts `{project, class:'dev', ttlSec}`
   * and NAMES NO IMAGE, so every run the app opens gets cloud's default for that
   * class: `SANDBOX_IMAGE_REPO:dev`, which ships as
   * `registry.hanzo.ai/hanzoai/sandbox:dev`. If those bytes are not published, or
   * the pod has no credential to fetch them, the pod sits in ImagePullBackOff,
   * cloud waits 2 minutes and answers 503 — and `openSandbox` turns EVERY
   * non-2xx into `return null`, which `resolveFs` turns into `{}`, which
   * `runAgent` turns into an InMemoryProjectFs. That is the whole trap, reached
   * without a single line of the app misbehaving.
   *
   * It is its own test, before the ones that use a sandbox, because when it is
   * red every later failure in this file is a rumour of it. This asks for
   * EXACTLY what the app asks for — same class, same absent image — so it cannot
   * pass while the app's own calls fail.
   */
  test('the default image for the class the app opens (dev) can actually be pulled', async ({
    page,
    request,
  }) => {
    test.setTimeout(240_000);
    await page.goto('/dashboard');
    const token = await bearer(page);
    await sandboxService(request, token);

    const project = `e2e-image-${uniq()}`;
    let sandbox: Sandbox | undefined;
    try {
      // No `image` key, on purpose: naming one here would test a path the app
      // never takes and would go green over the exact break it exists to catch.
      sandbox = await createSandbox(request, token, { class: 'dev', project });
      const live = await running(request, token, sandbox.id);

      // It is a machine, and the toolchain a coding agent needs is in it.
      const probe = await exec(request, token, sandbox.id, 'node --version; git --version');
      expect(
        probe.exitCode,
        `the pod started from ${live.image ?? '?'} but has no usable toolchain: ${JSON.stringify(probe)}`,
      ).toBe(0);
      expect(probe.stdout, `node missing from ${live.image ?? '?'}`).toMatch(/v\d+\./);
      expect(probe.stdout, `git missing from ${live.image ?? '?'} — it cannot host a coding agent`).toMatch(
        /git version/,
      );
    } finally {
      if (sandbox) await destroy(request, token, sandbox.id);
    }
  });

  test('hanzo.app path convention is one cloud accepts (the /work confinement contract)', async ({
    page,
    request,
  }) => {
    test.setTimeout(200_000);
    await page.goto('/dashboard');
    const token = await bearer(page);
    await sandboxService(request, token);

    const sandbox = await createSandbox(request, token, { class: 'exec', ...proofImage() });
    try {
      await running(request, token, sandbox.id);

      // THE CONTRACT HAS TWO HALVES AND BOTH ARE ASSERTED HERE, because a
      // regression on either side breaks every agent read and write and neither
      // side can see the other's half on its own.
      //
      // Cloud's `confine` (apps/sandbox/sandbox.go): a path with a LEADING SLASH
      // is absolute and must already sit under the class root, or it is a 400
      // "path must be under <root>"; a RELATIVE path is joined to that root.
      // The root is per class — /mnt/data for `exec`, /work for `dev` — which is
      // exactly why the app must not name it.
      //
      // hanzo.app's half is `wire()` in lib/agent/sandbox.ts:
      //     const wire = (path) => normalizePath(path).slice(1)
      // `normalizePath` gives a file one identity inside the app (always leading
      // slash), and `.slice(1)` drops that slash on the way out so cloud resolves
      // it against the workdir. Send the identity form unchanged and every write
      // is a 400 the loop reports as a failed tool call — the run "completes"
      // with an empty sandbox.
      //
      // tests/integration/sandbox.test.ts cannot see any of this: its fake server
      // keys a map on whatever string arrives, so both conventions "work" there.
      const marker = `path-contract-${uniq()}`;
      const wire = (p: string) => p.replace(/^\/+/, ''); // what lib/agent/sandbox.ts sends

      const res = await request.post(`${API}/sandboxes/${encodeURIComponent(sandbox.id)}/fs`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
        params: { path: wire(`/${marker}.txt`) },
        data: marker,
        failOnStatusCode: false,
    timeout: CALL_TIMEOUT_MS,
      });
      const text = await res.text();
      expect(
        res.status(),
        `The app sends wire('/${marker}.txt') = '${wire(`/${marker}.txt`)}' and cloud answered ` +
          `${res.status()}: ${text.slice(0, 200)}\n` +
          `hanzo.app and cloud disagree about what a project-relative path is, so every agent ` +
          `read and write against a real sandbox fails.`,
      ).toBe(200);

      // The other half: the app's INTERNAL identity form must NOT be accepted, and
      // this is the assertion that keeps `wire()` honest. Delete the `.slice(1)`
      // and the test above still needs this one to notice — a cloud that quietly
      // accepted '/foo.txt' by rewriting it would put the file at the filesystem
      // root, not in the project, and the agent would read back nothing forever.
      const raw = await request.post(`${API}/sandboxes/${encodeURIComponent(sandbox.id)}/fs`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
        params: { path: `/${marker}-raw.txt` },
        data: marker,
        failOnStatusCode: false,
    timeout: CALL_TIMEOUT_MS,
      });
      expect(
        raw.status(),
        `Cloud accepted the app's un-wired identity path '/${marker}-raw.txt'. Either confine() ` +
          `stopped confining, or the class root moved to '/'. Both make lib/agent/sandbox.ts's ` +
          `wire() a no-op guarding nothing.`,
      ).toBe(400);

      // And the accepted write landed where a command can see it — not merely 200.
      const cat = await exec(request, token, sandbox.id, `cat ${marker}.txt`);
      expect(cat.exitCode, `cat in the pod: ${JSON.stringify(cat)}`).toBe(0);
      expect(cat.stdout).toContain(marker);
    } finally {
      await destroy(request, token, sandbox.id);
    }
  });

  test('a run naming a project edits a real sandbox, and the edit survives into a fresh pod', async ({
    page,
    request,
  }) => {
    test.setTimeout(420_000);
    await page.goto('/dashboard');
    const token = await bearer(page);
    await sandboxService(request, token);

    const marker = `SANDBOX-PROOF-${uniq()}`;
    const project = `e2e-sandbox-${uniq()}`;
    const file = 'sandbox-proof.txt';

    try {
      // The run. `project` is the branch of resolveFs that opens a real sandbox;
      // the request is issued from the page, so it carries the session cookie and
      // the browser-set headers requireSameOrigin checks.
      const events = await agentRun(page, {
        project,
        prompt:
          `Create a file named ${file} at the project root whose entire contents are exactly ` +
          `the single line ${marker}. Use the write_file tool. Do not create or modify any other file.`,
        maxTurns: 6,
      });
      assertRan(events);

      // IN-BAND TELL: run_command is only in the toolset when the filesystem can
      // exec (agentToolDefs filters it out otherwise), so a write_file against a
      // sandbox happens in a run whose tool list included it. Weak alone — which
      // is why it is not the assertion, only the first hint.
      const wrote = events.some((e) => e.type === 'tool_call' && e.name === 'write_file');
      expect(wrote, `the agent never called write_file:\n${transcript(events)}`).toBe(true);

      // THE ASSERTION. The run has ended, so route.ts released its sandbox: the
      // pod is gone and the project volume is not. Asking for the project's
      // sandbox again gets a NEW POD on that same disk. If the run had fallen
      // back to the in-memory map, this sandbox is empty — the map died with the
      // request. Nothing about the stream above changes if that happens, which
      // is the entire reason this check exists.
      const fresh = await createSandbox(request, token, { class: 'dev', project, ...proofImage() });
      try {
        await running(request, token, fresh.id);

        const content = await readFile(request, token, fresh.id, file);
        expect(
          content,
          `${file} is not on the project volume. The run reported success (see below) but wrote ` +
            `nothing to a sandbox — the silent InMemoryProjectFs fallback in lib/agent/loop.ts.\n` +
            transcript(events),
        ).not.toBeNull();
        expect(content).toContain(marker);

        // And a process in the pod reads the same bytes. `cat` is the part no
        // map can fake: a real binary, a real kernel, a real disk.
        const cat = await exec(request, token, fresh.id, `cat ${file}`);
        expect(cat.exitCode, `cat ${file} in the pod: ${JSON.stringify(cat)}`).toBe(0);
        expect(cat.stdout).toContain(marker);
      } finally {
        await destroy(request, token, fresh.id);
      }

      // THE UI SAYS SO TOO. The run registers an AgentSession titled with the
      // prompt, and /profile renders those from /v1/agents/sessions. Visible
      // evidence in the product, not only in a response body.
      await page.goto('/profile');
      await expect(page.getByText(/your builds/i).first()).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(new RegExp(file, 'i')).first()).toBeVisible({ timeout: 20_000 });
      await test.info().attach('builds-shows-the-run.png', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    } finally {
      // Whatever the run left behind for this project.
      const list = await request.get(`${API}/sandboxes`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { project },
        failOnStatusCode: false,
    timeout: CALL_TIMEOUT_MS,
      });
      if (list.ok()) {
        const body = (await list.json()) as { sandboxes?: Sandbox[] };
        for (const b of body.sandboxes ?? []) await destroy(request, token, b.id);
      }
      // And the PROJECT itself. Destroying the sandboxes left the git repository the
      // run created, so every run leaked one permanently into the real system — 45 had
      // accumulated, sitting in repository listings beside people's work. The sandbox
      // was already cleaned up here; the project it lived on was not.
      await deleteProject(request, token, project);
    }
  });

  test('a run in a caller-held sandbox writes to that pod, and runs a command in it', async ({
    page,
    request,
  }) => {
    test.setTimeout(420_000);
    await page.goto('/dashboard');
    const token = await bearer(page);
    await sandboxService(request, token);

    const marker = `SANDBOX-EXEC-${uniq()}`;
    const project = `e2e-held-${uniq()}`;
    const file = 'exec-proof.txt';

    const sandbox = await createSandbox(request, token, { class: 'dev', project, ...proofImage() });
    try {
      await running(request, token, sandbox.id);

      // `id`, not `project`: the sandbox belongs to the caller, so route.ts must
      // NOT release it at the end of the run — we read the same live pod after.
      const events = await agentRun(page, {
        id: sandbox.id,
        prompt:
          `Create a file named ${file} at the project root containing exactly the single line ` +
          `${marker}. Then use run_command to run "cat ${file}" and confirm the contents. ` +
          `Do not modify any other file.`,
        maxTurns: 8,
      });
      assertRan(events);

      // The loop was handed an exec-capable filesystem — an InMemoryProjectFs is
      // never offered run_command, so the model could not have called it.
      const ran = events.some((e) => e.type === 'tool_call' && e.name === 'run_command');
      expect(
        ran,
        `no run_command in the stream. agentToolDefs only offers it when the fs can exec, so its ` +
          `absence means the loop got the in-memory fallback rather than the sandbox we passed:\n` +
          transcript(events),
      ).toBe(true);

      // Same pod, still up: the bytes are on its disk.
      const content = await readFile(request, token, sandbox.id, file);
      expect(
        content,
        `${file} is not in sandbox ${sandbox.id} after a run that named it:\n${transcript(events)}`,
      ).not.toBeNull();
      expect(content).toContain(marker);

      const cat = await exec(request, token, sandbox.id, `cat ${file}`);
      expect(cat.exitCode, `cat ${file} in the pod: ${JSON.stringify(cat)}`).toBe(0);
      expect(cat.stdout).toContain(marker);

      // The pod is a real machine, not a file server: it has a toolchain, and
      // that is the whole reason to pay for one.
      const node = await exec(request, token, sandbox.id, 'node --version');
      expect(node.exitCode, `node --version: ${JSON.stringify(node)}`).toBe(0);
      expect(node.stdout).toMatch(/^v\d+\./);
    } finally {
      await destroy(request, token, sandbox.id);
    }
  });

  /**
   * THE CONTROL. This is what the three tests above are measured against.
   *
   * A run naming neither `project` nor `id` takes the in-memory path, and it
   * reports COMPLETE SUCCESS: tool calls, a `done` with a changed-file list, a
   * summary. Nothing in that stream differs from a run that edited a real
   * checkout. If this test ever goes red because the run started failing, the
   * fallback stopped being silent — good news, but it means the other tests are
   * now measuring something else and this file needs re-reading.
   *
   * It needs no sandbox service, so it stays honest before the deploy lands: it
   * passes while the others fail, which is exactly the shape of "the harness
   * works, the sandbox is not there".
   */
  test('CONTROL: a run naming neither project nor id reports success while touching no sandbox', async ({
    page,
    request,
  }) => {
    test.setTimeout(300_000);
    await page.goto('/dashboard');
    const token = await bearer(page);

    const marker = `IN-MEMORY-${uniq()}`;
    const events = await agentRun(page, {
      prompt: `Create a file named control.txt containing exactly the single line ${marker}. Use write_file.`,
      files: [{ path: '/index.html', content: '<!doctype html><title>control</title>' }],
      maxTurns: 6,
    });
    assertRan(events);

    // It looks like a win.
    const done = events.find((e) => e.type === 'done');
    expect(done?.changed ?? [], `the in-memory run changed nothing:\n${transcript(events)}`).toContain(
      '/control.txt',
    );

    // No sandbox was harmed in the making of that success. (Skipped when the
    // service is not deployed — its absence is already the loudest possible
    // evidence for this claim, and the other tests report it.)
    const list = await request.get(`${API}/sandboxes`, {
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    timeout: CALL_TIMEOUT_MS,
    });
    if (list.ok()) {
      const body = (await list.json()) as { sandboxes?: Sandbox[] };
      const leaked = (body.sandboxes ?? []).filter((b) => (b.project ?? '').includes(marker.toLowerCase()));
      expect(leaked, 'a run with no project somehow opened a sandbox').toEqual([]);
    }
  });
});
