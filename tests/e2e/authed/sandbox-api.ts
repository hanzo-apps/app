/**
 * The sandbox service, as a test speaks to it — ONE copy.
 *
 * These are the calls a spec makes to check on a sandbox from OUTSIDE the app:
 * open one, read a file out of it, run a command in it, hang it up. They live
 * here rather than in a spec because TWO specs now ask the same questions — the
 * agent-run proof and the UI proof — and a second copy of `createSandbox` is a
 * second opinion about what a 409 means. It is not a `.spec.ts`, so Playwright
 * collects no tests from it.
 *
 * THE VERIFICATION DELIBERATELY DOES NOT GO THROUGH THE APP. It goes direct to
 * `api.hanzo.ai` from the test process with the signed-in user's own bearer: a
 * witness that shares a process with the accused is not a witness. The page can
 * be mocked and the BFF can be caching; the sandbox service answering a second,
 * unrelated caller can be neither.
 */
import { expect, type APIRequestContext, type Page } from '@playwright/test';

/** The cloud API the app itself calls. One base, no second convention. */
export const API = (process.env.HANZO_API_BASE_URL || 'https://api.hanzo.ai/v1').replace(/\/+$/, '');

/** Where the @hanzo/iam browser SDK keeps the access token. Same key the app reads. */
export const TOKEN_KEY = 'hanzo_iam_access_token';

/** A sandbox is a pod; a cold pull is ~27s, a warm start ~3.3s. */
export const READY_TIMEOUT_MS = 120_000;

/**
 * Every sandbox call passes this explicitly, and none of them may inherit
 * playwright.config's `actionTimeout: 15_000`.
 *
 * That default is right for clicking a button and catastrophically wrong here:
 * `POST /v1/sandboxes` BLOCKS until the pod is running, which is ~31s measured on
 * a cold pull and a full 2 minutes when the pod never comes up at all — cloud
 * waits that long before answering 503. At 15s Playwright aborts the request
 * mid-flight and reports `apiRequestContext.post: Timeout 15000ms exceeded`,
 * which names the test harness as the culprit for a failure that belongs to the
 * cluster. It turned a precise "this image cannot be pulled" into a generic
 * timeout in two of these tests. Longer than cloud's own deadline, so the answer
 * we report is always the SERVICE's answer.
 */
export const CALL_TIMEOUT_MS = 150_000;

/**
 * An image to prove the MECHANISM with, while the product image is still missing.
 *
 *   E2E_SANDBOX_IMAGE=node:22 pnpm exec playwright test …
 *
 * Unset — the default, and what CI runs — every test asks for exactly what the
 * app asks for and the suite measures production as it is.
 *
 * Set, it names the image for the tests whose subject is the AGENT LOOP (does a
 * run reach a pod, does the edit land on a disk, does a second pod see it). Those
 * questions are independent of which bytes the pod boots, and answering them today
 * with a stock `node:22` is exactly what apps/sandbox/live_test.go does via
 * SANDBOX_LIVE_IMAGE — "proving the mechanism does not require our own image to
 * exist yet".
 *
 * IT CANNOT LAUNDER THE BLOCKER. The one test whose subject IS the image —
 * 'the default image … can actually be pulled' — never reads this and never
 * passes an image, so it stays red until the real bytes ship and the suite fails
 * with it. This makes the full path demonstrable without making it look done.
 */
export const PROOF_IMAGE = (process.env.E2E_SANDBOX_IMAGE ?? '').trim();

/** `{image}` when proving the mechanism, `{}` when measuring production. */
export const proofImage = (): { image?: string } => (PROOF_IMAGE ? { image: PROOF_IMAGE } : {});

/** Unique per run, so two of these never collide and nothing here is reused state. */
export const uniq = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/**
 * The signed-in user's own bearer, taken from the browser that is signed in.
 *
 * Not a service key and not a fixture: the whole point is that the verification
 * runs as the SAME principal whose run we are checking, so a sandbox visible
 * here is a sandbox that run could have written.
 */
export async function bearer(page: Page): Promise<string> {
  const token = await page.evaluate((k) => localStorage.getItem(k), TOKEN_KEY);
  expect(
    token,
    `No IAM access token in localStorage[${TOKEN_KEY}]. auth.setup.ts did not leave a real session — ` +
      'check E2E_EMAIL/E2E_PASSWORD (sourced from KMS).',
  ).toBeTruthy();
  return token as string;
}

export interface Sandbox {
  id: string;
  org?: string;
  project?: string;
  class?: string;
  status?: 'pending' | 'running' | 'suspended' | 'error';
  image?: string;
  volume?: string;
  /** Why the lease is in `error` — cloud writes the pod's own failure here. */
  error?: string;
}

export interface ExecResult {
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
export async function sandboxService(request: APIRequestContext, token: string): Promise<void> {
  const res = await request.get(`${API}/sandboxes`, {
    headers: { Authorization: `Bearer ${token}` },
    failOnStatusCode: false,
    timeout: CALL_TIMEOUT_MS,
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
export async function createSandbox(
  request: APIRequestContext,
  token: string,
  body: { class: 'exec' | 'dev'; project?: string; ttlSec?: number; image?: string },
): Promise<Sandbox> {
  const res = await request.post(`${API}/sandboxes`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { ttlSec: 900, ...body },
    failOnStatusCode: false,
    timeout: CALL_TIMEOUT_MS,
  });
  const text = await res.text();

  // A pod that never becomes ready comes back as 503 from `start sandbox`, and
  // the message names the pod but not the REASON — "containers with unready
  // status: [sandbox]" is true of an image that cannot be pulled, a node under
  // pressure and a crashlooping entrypoint alike. Ask the service what it thinks
  // the sandbox's image and error are and put both in the failure, because the
  // one blocker this suite keeps hitting (an unpullable default image) is
  // otherwise indistinguishable from a slow cold start.
  if (res.status() === 503) {
    throw new Error(
      `POST ${API}/sandboxes -> 503: ${text.slice(0, 200)}\n` +
        `The sandbox service is LIVE and accepted the request — the POD did not come up.\n` +
        (await whyNoPod(request, token, body.project)),
    );
  }

  // ONE LIVE SANDBOX PER PROJECT, and cloud says so with a 409 rather than
  // quietly minting a second pod on a disk that only one of them can mount.
  // Adopting the named sandbox is not leniency, it is THE CONTRACT: the app's own
  // `openSandbox` does exactly this (409 → `live()`), so a test that treated 409
  // as a failure would be asserting a rule the product does not follow.
  //
  // It shows up here because a run that opened a sandbox for `project` and then
  // could not use it leaves the lease behind — `route.ts` only releases what it
  // successfully `opened` — so the next create for that project meets its own
  // predecessor.
  if (res.status() === 409) {
    const existing = await liveFor(request, token, body.project);
    expect(
      existing,
      `POST ${API}/sandboxes -> 409 (${text.slice(0, 160)}) but no live sandbox for ` +
        `project=${body.project} is listed. The conflict names a sandbox the collection does not.`,
    ).toBeTruthy();
    return existing as Sandbox;
  }

  // 201 Created. Cloud returns http.StatusCreated for a lease it minted; a
  // resumed lease answers 200. Both are success and neither is "the other one is
  // a bug" — asserting 200 alone failed every green run against production.
  expect(
    [200, 201],
    `POST ${API}/sandboxes -> ${res.status()}: ${text.slice(0, 300)}`,
  ).toContain(res.status());
  const sandbox = JSON.parse(text) as Sandbox;
  expect(sandbox.id, 'sandbox create returned no id').toBeTruthy();
  return sandbox;
}

/** The project's existing live sandbox — the one a 409 is telling us about. */
export async function liveFor(
  request: APIRequestContext,
  token: string,
  project?: string,
): Promise<Sandbox | undefined> {
  const res = await request.get(`${API}/sandboxes`, {
    headers: { Authorization: `Bearer ${token}` },
    ...(project ? { params: { project } } : {}),
    failOnStatusCode: false,
    timeout: CALL_TIMEOUT_MS,
  });
  if (!res.ok()) return undefined;
  const { sandboxes = [] } = (await res.json()) as { sandboxes?: Sandbox[] };
  return sandboxes.find((s) => !project || s.project === project);
}

/**
 * What the service knows about the sandbox that would not start.
 *
 * The record outlives the failed create (the lease is minted before the pod is
 * waited on), so its `image` and `error` are readable afterwards and they are
 * the two facts that separate "our image is not published" from "the cluster is
 * unwell". Best-effort: this runs inside a failure path and must never throw a
 * second, less informative error over the first.
 */
export async function whyNoPod(
  request: APIRequestContext,
  token: string,
  project?: string,
): Promise<string> {
  try {
    const res = await request.get(`${API}/sandboxes`, {
      headers: { Authorization: `Bearer ${token}` },
      ...(project ? { params: { project } } : {}),
      failOnStatusCode: false,
    timeout: CALL_TIMEOUT_MS,
    });
    if (!res.ok()) return `(could not list sandboxes to diagnose: HTTP ${res.status()})`;
    const { sandboxes = [] } = (await res.json()) as { sandboxes?: Sandbox[] };
    const mine = project ? sandboxes.filter((s) => s.project === project) : sandboxes;
    if (!mine.length) return '(the service lists no sandbox for this project)';
    return (
      mine
        .map(
          (s) =>
            `  sandbox ${s.id} status=${s.status} image=${s.image ?? '?'}` +
            (s.error ? `\n    error: ${s.error}` : ''),
        )
        .join('\n') +
      '\n\nA lease stuck at status=pending means the POD never became ready, and the first thing\n' +
      'to check is whether the image above can be pulled AT ALL:\n' +
      "  kubectl get events -n hanzo-sandboxes --sort-by=.lastTimestamp | grep -i 'pull\\|fail'\n" +
      'ErrImagePull/ImagePullBackOff there is the answer, and it has two separate causes worth\n' +
      'telling apart: the bytes are not published (the registry answers NAME_UNKNOWN for the\n' +
      'repository), or they are published and the pod carries no credential that covers THAT\n' +
      "registry — an imagePullSecret for a different host is not a credential, it is a no-op."
    );
  } catch (e) {
    return `(diagnosis failed: ${String(e)})`;
  }
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
export async function running(request: APIRequestContext, token: string, id: string): Promise<Sandbox> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let last = '';
  while (Date.now() < deadline) {
    const res = await request.get(`${API}/sandboxes/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    timeout: CALL_TIMEOUT_MS,
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
export async function readFile(
  request: APIRequestContext,
  token: string,
  id: string,
  path: string,
): Promise<string | null> {
  const res = await request.get(`${API}/sandboxes/${encodeURIComponent(id)}/fs`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { path },
    failOnStatusCode: false,
    timeout: CALL_TIMEOUT_MS,
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
export async function exec(
  request: APIRequestContext,
  token: string,
  id: string,
  command: string,
): Promise<ExecResult> {
  const res = await request.post(`${API}/sandboxes/${encodeURIComponent(id)}/exec`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { command, timeoutSec: 60 },
    failOnStatusCode: false,
    timeout: CALL_TIMEOUT_MS,
  });
  const text = await res.text();
  expect(
    res.status(),
    `POST /v1/sandboxes/${id}/exec -> ${res.status()}: ${text.slice(0, 300)}`,
  ).toBe(200);
  return JSON.parse(text) as ExecResult;
}

/** Hang the sandbox up and drop its disk. Test litter costs a pod and a PVC. */
/** Delete the git project a run created, so a test does not leave one behind.
 *
 * Every run names its project `e2e-<kind>-<uniq()>` so concurrent runs cannot
 * collide — and nothing removed them, so each run leaked one permanently into the
 * real system. 45 had accumulated, one per run, indistinguishable from a person's
 * work in any repository listing.
 *
 * Best-effort on purpose: a project that will not delete is not a failed test, and
 * raising here would turn a leaked 2 MB repository into a red suite. It is the same
 * shape as destroy() above, for the same reason.
 */
export async function deleteProject(request: APIRequestContext, token: string, project: string): Promise<void> {
  await request
    .delete(`${API}/git/repos/${encodeURIComponent(project)}`, {
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
      timeout: CALL_TIMEOUT_MS,
    })
    .catch(() => {});
}

export async function destroy(request: APIRequestContext, token: string, id: string): Promise<void> {
  await request
    .delete(`${API}/sandboxes/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { purge: '1' },
      failOnStatusCode: false,
    timeout: CALL_TIMEOUT_MS,
    })
    .catch(() => {});
}
