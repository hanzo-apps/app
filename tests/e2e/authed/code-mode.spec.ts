import { test, expect, type Page } from '@playwright/test';

import { bearer, createSandbox, deleteProject, destroy, readFile, uniq } from './sandbox-api';

/**
 * THE UI edits a real sandbox — driven in a browser, verified in a pod.
 *
 * `sandbox-run.spec.ts` proves the ENDPOINT reaches a sandbox: it posts to
 * `/v1/agents/runs` from the page with a project named. That was never the
 * defect. The defect was that nothing in the product ever named one — every
 * occurrence of `project` outside `lib/agent` lived inside the route file
 * itself — so `runAgent` fell through to an in-memory map on every run a person
 * actually started, silently, and reported success. A green endpoint test and a
 * happy UI were both true the whole time the product edited nothing.
 *
 * So this file starts the run THE WAY A PERSON DOES: open a project, click the
 * composer's Code segment, type, press Enter. No `page.evaluate` posting a body
 * we wrote — the body under test is the one the composer built.
 *
 * The two assertions are the two halves of the bug:
 *
 *   1. THE REQUEST NAMES THE OPEN PROJECT. Read off the wire, from the
 *      composer's own POST. This is the line that was missing, and it goes red
 *      the moment a refactor drops it — which a screenshot never would.
 *   2. THE FILE IS IN A POD AFTERWARDS, read back through a SEPARATE sandbox
 *      this test process opens against `api.hanzo.ai`. The run releases its pod
 *      when it ends and the project volume stays, so that sandbox is a DIFFERENT
 *      POD ON THE SAME DISK. An in-memory map in a Node process that has since
 *      returned its response cannot survive that.
 *
 * The third test keeps the other two honest: when a run is not durable the UI
 * SAYS SO — in the console dock and in the thread. Silence there is the original
 * defect, so a run that saves nothing must never again look like one that saves.
 *
 *   E2E_EMAIL=… E2E_PASSWORD=…  pnpm exec playwright test --project=authenticated \
 *     tests/e2e/authed/code-mode.spec.ts
 */

/** The composer, in Code mode, with a project open. */
async function openCodeMode(page: Page, project?: string): Promise<void> {
  await page.addInitScript(() => localStorage.setItem('composer-mode', 'code'));
  await page.goto(project ? `/dev?project=${project}` : '/dev', { waitUntil: 'domcontentloaded' });

  const code = page.getByRole('button', { name: 'code', exact: true }).first();
  await code.waitFor({ state: 'visible', timeout: 60_000 });
  await code.click();
  await expect(code).toHaveAttribute('aria-pressed', 'true');
  if (project) {
    // The page publishes the open project; the composer reads the same value.
    await expect
      .poll(() => page.evaluate(() => (window as { __projectSlug?: string }).__projectSlug))
      .toBe(project);
  }
}

/** Send a prompt and give back the body the composer actually posted. */
async function send(page: Page, prompt: string): Promise<Record<string, unknown>> {
  let body: Record<string, unknown> | undefined;
  await page.route('**/v1/agents/runs', async (route) => {
    body = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>;
    await route.continue();
  });
  const box = page.locator('textarea').first();
  await box.waitFor({ state: 'visible', timeout: 30_000 });
  await box.fill(prompt);
  await box.press('Enter');
  await expect.poll(() => body, { timeout: 60_000 }).toBeDefined();
  return body as Record<string, unknown>;
}

/** The console dock — the terminal a person reads while a run works. */
const dock = (page: Page) => page.locator('[data-console]').first();

test.describe('the composer edits a real sandbox', () => {
  test.describe.configure({ mode: 'serial', timeout: 420_000 });

  const project = `e2e-code-${uniq()}`;
  const mark = `MARK-${uniq()}`;

  // The project this suite created is its own to clean up. Without this every run
  // left one behind in the REAL system — 45 had accumulated, one per run, sitting in
  // repository listings beside people's work. The token is captured from the run
  // rather than minted again, so teardown needs no credential of its own.
  let token = '';
  test.afterAll(async ({ playwright }) => {
    if (!token) return;
    const request = await playwright.request.newContext();
    try {
      await deleteProject(request, token, project);
    } finally {
      await request.dispose();
    }
  });

  test('the run names the OPEN PROJECT — the line nothing ever sent', async ({ page }) => {
    await openCodeMode(page, project);
    // Captured in the FIRST test, not the one that happens to need it: this suite is
    // serial, so a failure here skips the rest — and that is exactly the run whose
    // project would otherwise be left behind.
    token = await bearer(page);
    const body = await send(page, `Write a file proof.txt containing exactly ${mark}, then stop.`);

    // THE assertion. Not "a project" — THIS project, the one the page has open.
    expect(
      body.project ?? body.id,
      `The composer posted ${JSON.stringify(body).slice(0, 200)} — with neither a project ` +
        'nor a sandbox id the run falls through to an in-memory map and edits nothing durable.',
    ).toBeTruthy();
    expect(body.project).toBe(project);

    // Where the work is going, said before any of it is done.
    await expect(dock(page)).toContainText(/sandbox|not saved|memory only/i, { timeout: 180_000 });
  });

  test('the file it wrote is in a pod — read from a DIFFERENT one, on the same disk', async ({
    page,
    request,
  }) => {
    await page.goto('/dashboard');
    token ||= await bearer(page);
    const sandbox = await createSandbox(request, token, { class: 'dev', project });
    try {
      await expect
        .poll(async () => (await readFile(request, token, sandbox.id, 'proof.txt')) ?? '', {
          timeout: 120_000,
          message:
            `proof.txt is not on ${project}'s volume. The run reported success, so either it ` +
            'edited an in-memory map (nothing named a project) or the sandbox refused the write.',
        })
        .toContain(mark);
    } finally {
      await destroy(request, token, sandbox.id);
    }
  });

  test('a run that saves nothing SAYS SO, in the dock and in the thread', async ({ page }) => {
    // Naming no project is the honest scratch case, and the one whose silence hid
    // the bug: it has to announce itself like any other.
    await openCodeMode(page);
    await send(page, 'Write a file scratch.txt containing hello, then stop.');

    const loud = /not saved|memory only|not writable|no sandbox/i;
    await expect(dock(page)).toContainText(loud, { timeout: 180_000 });
    await expect(page.locator('body')).toContainText(loud, { timeout: 180_000 });
  });
});
