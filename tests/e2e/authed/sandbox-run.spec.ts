import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

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

/** The cloud API the app itself calls. One base, no second convention. */
const API = (process.env.HANZO_API_BASE_URL || 'https://api.hanzo.ai/v1').replace(/\/+$/, '');

/** Where the @hanzo/iam browser SDK keeps the access token. Same key the app reads. */
const TOKEN_KEY = 'hanzo_iam_access_token';

/** A sandbox is a pod; a cold pull is ~27s, a warm start ~3.3s. */
const READY_TIMEOUT_MS = 120_000;

/** Unique per run, so two of these never collide and nothing here is reused state. */
const uniq = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/**
 * The signed-in user's own bearer, taken from the browser that is signed in.
 *
 * Not a service key and not a fixture: the whole point is that the verification
 * runs as the SAME principal whose run we are checking, so a sandbox visible
 * here is a sandbox that run could have written.
 */
async function bearer(page: Page): Promise<string> {
  const token = await page.evaluate((k) => localStorage.getItem(k), TOKEN_KEY);
  expect(
    token,
    `No IAM access token in localStorage[${TOKEN_KEY}]. auth.setup.ts did not leave a real session — ` +
      'check E2E_EMAIL/E2E_PASSWORD (sourced from KMS).',
  ).toBeTruthy();
  return token as string;
}

interface Sandbox {
  id: string;
  org?: string;
  project?: string;
  class?: string;
  status?: 'pending' | 'running' | 'suspended' | 'error';
  image?: string;
  volume?: string;
}

interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut?: boolean;
}

/**
 * Assert the sandbox service is actually serving, and say precisely what is
 * wrong when it is not.
 *
 * The three failures are different facts and are reported as different facts:
 * 404 means the route is not in the running binary (not deployed); 503 means it
 * is mounted but its backend — the cluster it execs into — is unreachable; 401/403
 * means it is there and we are not who we thought. Collapsing those into "sandbox
 * unavailable" would send someone to debug the wrong system.
 */
async function sandboxService(request: APIRequestContext, token: string): Promise<void> {
  const res = await request.get(`${API}/sandboxes`, {
    headers: { Authorization: `Bearer ${token}` },
    failOnStatusCode: false,
  });
  const image = res.headers()['x-api-version'] ?? 'unknown';
  const body = (await res.text()).slice(0, 300);

  if (res.status() === 404) {
    throw new Error(
      `/v1/sandboxes is NOT DEPLOYED. GET ${API}/sandboxes -> 404 from image ${image}.\n` +
        `The route is absent from the running binary, so no agent run can reach a sandbox and\n` +
        `every run silently edits an in-memory map instead. This test is red because production\n` +
        `is, not because the test is wrong. Body: ${body}`,
    );
  }
  if (res.status() === 503) {
    throw new Error(
      `/v1/sandboxes is MOUNTED BUT NOT SERVING. GET ${API}/sandboxes -> 503 from image ${image}.\n` +
        `The route exists; its backend (the cluster it execs into) does not answer. Body: ${body}`,
    );
  }
  expect(
    res.status(),
    `GET ${API}/sandboxes -> ${res.status()} from image ${image}. Expected 200. Body: ${body}`,
  ).toBe(200);
}

/** Create a sandbox and wait for a pod that can actually take a command. */
async function createSandbox(
  request: APIRequestContext,
  token: string,
  body: { class: 'exec' | 'dev'; project?: string; ttlSec?: number },
): Promise<Sandbox> {
  const res = await request.post(`${API}/sandboxes`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { ttlSec: 900, ...body },
    failOnStatusCode: false,
  });
  const text = await res.text();
  expect(res.status(), `POST ${API}/sandboxes -> ${res.status()}: ${text.slice(0, 300)}`).toBe(200);
  const sandbox = JSON.parse(text) as Sandbox;
  expect(sandbox.id, 'sandbox create returned no id').toBeTruthy();
  return sandbox;
}

/**
 * Wait for `status: running`.
 *
 * `pending` is a real state, not a transient to paper over: cloud counts a
 * pending sandbox as live because it holds the volume, but its exec refuses
 * until the pod is up. Handing one to the agent produces a filesystem whose
 * every call throws, which the loop would then report as failed tool calls —
 * a sandbox bug wearing a model bug's clothes.
 */
async function running(request: APIRequestContext, token: string, id: string): Promise<Sandbox> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let last = '';
  while (Date.now() < deadline) {
    const res = await request.get(`${API}/sandboxes/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    });
    if (res.ok()) {
      const sandbox = (await res.json()) as Sandbox;
      last = sandbox.status ?? '';
      if (sandbox.status === 'running') return sandbox;
      if (sandbox.status === 'error') {
        throw new Error(`sandbox ${id} went to status=error: ${JSON.stringify(sandbox)}`);
      }
    } else {
      last = `HTTP ${res.status()}`;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(
    `sandbox ${id} never reached status=running within ${READY_TIMEOUT_MS}ms (last: ${last || 'unknown'}).`,
  );
}

/** Read one path out of a sandbox. `null` means the sandbox said 404 — genuinely absent. */
async function readFile(
  request: APIRequestContext,
  token: string,
  id: string,
  path: string,
): Promise<string | null> {
  const res = await request.get(`${API}/sandboxes/${encodeURIComponent(id)}/fs`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { path },
    failOnStatusCode: false,
  });
  if (res.status() === 404) return null;
  const text = await res.text();
  expect(
    res.status(),
    `GET /v1/sandboxes/${id}/fs?path=${path} -> ${res.status()}: ${text.slice(0, 300)}`,
  ).toBe(200);
  return text;
}

/** Run a command inside the pod. A non-zero exit is DATA, not a failure. */
async function exec(
  request: APIRequestContext,
  token: string,
  id: string,
  command: string,
): Promise<ExecResult> {
  const res = await request.post(`${API}/sandboxes/${encodeURIComponent(id)}/exec`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { command, timeoutSec: 60 },
    failOnStatusCode: false,
  });
  const text = await res.text();
  expect(
    res.status(),
    `POST /v1/sandboxes/${id}/exec -> ${res.status()}: ${text.slice(0, 300)}`,
  ).toBe(200);
  return JSON.parse(text) as ExecResult;
}

/** Hang the sandbox up and drop its disk. Test litter costs a pod and a PVC. */
async function destroy(request: APIRequestContext, token: string, id: string): Promise<void> {
  await request
    .delete(`${API}/sandboxes/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { purge: '1' },
      failOnStatusCode: false,
    })
    .catch(() => {});
}

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

  test('hanzo.app path convention is one cloud accepts (the /work confinement contract)', async ({
    page,
    request,
  }) => {
    test.setTimeout(200_000);
    await page.goto('/dashboard');
    const token = await bearer(page);
    await sandboxService(request, token);

    const sandbox = await createSandbox(request, token, { class: 'exec' });
    try {
      await running(request, token, sandbox.id);

      // EXACTLY what lib/agent/sandbox.ts puts on the wire. `normalizePath` in
      // lib/agent/patch.ts prefixes every path with '/', so a model writing
      // `proof.txt` produces `POST /fs?path=/proof.txt`. Cloud's `confine`
      // treats a leading slash as ABSOLUTE and refuses anything outside /work.
      // If those two disagree the agent's every read and write is a 400 that
      // `Sandbox.call` raises as a SandboxError — the run reports failed tool
      // calls and the sandbox stays empty. tests/integration/sandbox.test.ts
      // cannot see this: its fake server keys a map on whatever string arrives,
      // so both conventions "work" there.
      const marker = `path-contract-${uniq()}`;
      const res = await request.post(`${API}/sandboxes/${encodeURIComponent(sandbox.id)}/fs`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
        params: { path: `/${marker}.txt` },
        data: marker,
        failOnStatusCode: false,
      });
      const text = await res.text();
      expect(
        res.status(),
        `The app writes leading-slash paths ('/${marker}.txt', from normalizePath) and cloud ` +
          `answered ${res.status()}: ${text.slice(0, 200)}\n` +
          `hanzo.app and cloud disagree about what a project-relative path is, so every agent ` +
          `read and write against a real sandbox fails.`,
      ).toBe(200);

      // And it landed where a command can see it — the write is not merely accepted.
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
      const fresh = await createSandbox(request, token, { class: 'dev', project });
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
      });
      if (list.ok()) {
        const body = (await list.json()) as { sandboxes?: Sandbox[] };
        for (const b of body.sandboxes ?? []) await destroy(request, token, b.id);
      }
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

    const sandbox = await createSandbox(request, token, { class: 'dev', project });
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
    });
    if (list.ok()) {
      const body = (await list.json()) as { sandboxes?: Sandbox[] };
      const leaked = (body.sandboxes ?? []).filter((b) => (b.project ?? '').includes(marker.toLowerCase()));
      expect(leaked, 'a run with no project somehow opened a sandbox').toEqual([]);
    }
  });
});
