import { test, expect, type Page } from '@playwright/test';

/**
 * Choosing the sandbox runtime, in the browser.
 *
 * A long editing session pays its isolation boundary twice: once at lease time
 * (gVisor hands back a machine in ~2.8s, a microVM in 4–8s) and then on every
 * file it touches (git status inside gVisor takes 156–195ms, inside the microVM
 * 21–53ms). Which trade wins is not a thing to take on anybody's word, so the
 * picker exists — and this file proves the picker is honest.
 *
 * Three claims, and the third is the one that matters:
 *
 *   1. THE CHOICE IS ON THE WIRE. Read off the composer's own POST, not from a
 *      screenshot. If a refactor drops the field the run silently reverts to the
 *      fleet runtime and every later measurement is mislabelled.
 *   2. THE CHOICE SURVIVES A RELOAD, per project. An experiment that resets when
 *      you refresh is not an experiment.
 *   3. A REFUSAL SAYS WHY, and a grant says WHAT IT GOT. These are the same
 *      failure seen from two sides: if the UI echoes the selection back as
 *      though it were the outcome, somebody times gVisor while reading
 *      "microVM" — the exact mistake the picker was built to prevent.
 *
 * The run endpoint is intercepted. Not to avoid the truth — cloud's half is
 * proved in Go, at the door, with a crafted body it refuses (apps/sandbox,
 * TestTheDoorRefusesARuntimeAClientCraftedForItself) — but because what is
 * under test HERE is the browser: what it sends, and what it does with the
 * answer. The refusal sentence below is cloud's own, copied verbatim from that
 * refusal, so the UI is rendering the string it will really be handed.
 *
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm exec playwright test \
 *     --project=public tests/e2e/sandbox-runtime.spec.ts
 */

/** The sentence cloud answers a volume-bearing sandbox asked for a microVM. */
const REFUSAL =
  'runtime "kata-fc" has no shared filesystem, so it cannot mount project volume ' +
  '"m-e2e-runtime-9f2" — the write would succeed into a tmpfs and be lost when the ' +
  'sandbox ends; ask for gvisor, or drop the project for a sandbox that keeps nothing';

/** One SSE frame the run client will parse. */
const frame = (event: object) => `data: ${JSON.stringify(event)}\n\n`;

const PROJECT = 'e2e-runtime';

/** The console dock — the terminal a person reads while a run works. */
const dock = (page: Page) => page.locator('[data-console]').first();

/**
 * A decodable (unsigned) session plus Code mode.
 *
 * The edge gates /dev on cookie PRESENCE and IamCookieBridge keeps that cookie
 * from the SDK's localStorage token, so both have to exist with a future exp or
 * the next navigation bounces to login. Server verification still fails closed;
 * the one server call this test needs is intercepted.
 */
async function openComposer(page: Page): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const b64u = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const token = `${b64u({ alg: 'RS256', typ: 'JWT' })}.${b64u({
    sub: 'e2e',
    name: 'E2E',
    email: 'e2e@example.com',
    orgs: [{ org: 'e2e' }],
    aud: 'hanzo-app',
    iat: exp - 3600,
    exp,
  })}.e2e-signature`;
  await page.context().addCookies([
    {
      name: 'hanzo_iam_access_token',
      value: token,
      url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    },
  ]);
  await page.addInitScript(
    ({ token: t, expMs }) => {
      localStorage.setItem('hanzo_iam_access_token', t);
      localStorage.setItem('hanzo_iam_expires_at', String(expMs));
      localStorage.setItem('composer-mode', 'code');
    },
    { token, expMs: exp * 1000 },
  );
  // A bare /dev is the onboarding page; naming a project opens the BUILDER,
  // which is where the composer — and so the picker — lives.
  await page.goto(`/dev?project=${PROJECT}`, { waitUntil: 'domcontentloaded' });
  await codeMode(page);
}

/**
 * Put the composer in Code mode.
 *
 * Stated after every navigation, INCLUDING a reload, and not once at the start:
 * Build and Code are different code paths, and a prompt sent in Build never
 * touches /v1/agents/runs at all. A test that assumed the mode survived a
 * refresh sat waiting sixty seconds for a request the page was never going to
 * make, which reads exactly like a broken pass-through.
 */
async function codeMode(page: Page): Promise<void> {
  const code = page.getByRole('button', { name: 'code', exact: true }).first();
  await code.waitFor({ state: 'visible', timeout: 60_000 });
  if ((await code.getAttribute('aria-pressed')) !== 'true') await code.click();
  await expect(code).toHaveAttribute('aria-pressed', 'true');
}

/** Open the composer's settings and give back the runtime list inside it. */
async function openSettings(page: Page) {
  await page.getByRole('button', { name: 'Settings' }).first().click();
  const picker = page.getByTestId('runtime-picker');
  await expect(picker).toBeVisible();
  return picker;
}

/**
 * Answer the next run with one `sandbox` frame and end the stream.
 *
 * Gives back the body the composer posted, so the choice can be read off the
 * wire rather than inferred from what the page looks like afterwards.
 */
async function run(page: Page, prompt: string, sandbox: object): Promise<Record<string, unknown>> {
  let body: Record<string, unknown> | undefined;
  await page.route('**/v1/agents/runs', async (route) => {
    body = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-store' },
      body:
        frame({ type: 'sandbox', ...sandbox }) +
        frame({ type: 'done', changed: [], files: [], finishReason: 'stop' }),
    });
  });
  const box = page.locator('textarea').first();
  await box.waitFor({ state: 'visible', timeout: 30_000 });
  await box.fill(prompt);
  await box.press('Enter');
  await expect.poll(() => body, { timeout: 60_000 }).toBeDefined();
  await page.unroute('**/v1/agents/runs');
  return body as Record<string, unknown>;
}

test.describe('the sandbox runtime is a choice, and an honest one', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });
  // A window the height of a laptop's, not Playwright's 720. The popover opens
  // UPWARD from a trigger that sits at the bottom of the screen, so how much of
  // it a person can see at once is a fact about their window — and 720 is
  // shorter than anything this is used on.
  test.use({ viewport: { width: 1280, height: 1000 } });

  test('every runtime is offered, in terms a person can weigh', async ({ page }) => {
    await openComposer(page);
    const picker = await openSettings(page);

    // Four, and the first is "ask for nothing" — a real value, not a blank. It
    // is the only one that keeps following the fleet when the fleet moves.
    await expect(picker.getByRole('button')).toHaveCount(4);
    await expect(page.getByTestId('runtime-default')).toHaveAttribute('aria-pressed', 'true');

    // The tradeoff is stated where the choice is made. A slug on its own asks
    // somebody to already know what kata-fc costs.
    await expect(picker).toContainText('Starts 3.9s, 5.3s busy');
    await expect(picker).toContainText('git status 21–53ms');
    await expect(picker).toContainText('No project disk');

    // AND THE COST UNDER LOAD, on the row that has one.
    //
    // A microVM leases in 4–8s on a quiet cluster and its p90 in a burst of 50
    // is 175 SECONDS. Both are measured; a hint that printed only the first
    // reads as a recommendation, and the person most likely to act on it is the
    // one who already suspects the microVM is the better trade for a long
    // session. So this asserts the unflattering half is present — it is the
    // only thing stopping the copy drifting back to the happy number.
    await expect(page.getByTestId('runtime-kata-fc')).toContainText(
      'Slowest to start: 27s, 175s busy',
    );

    // ALL FOUR TOGETHER, WHOLE, because the copy above exists to be COMPARED and
    // a row you cannot see beside the others is one nobody weighs.
    //
    // Measured against the SCROLLER's box, not the viewport. toBeInViewport was
    // tried and passes on a row the popover has clipped in half — the element
    // keeps its geometry when an ancestor scrolls it out of sight, so the check
    // that reads like the right one is the check that sees nothing. This asks
    // the question a person's eye asks: is the whole row inside the box.
    await page.getByTestId('runtime-kata-fc').scrollIntoViewIfNeeded();
    const cut = await page.evaluate(() => {
      const body = document.querySelector('[data-testid="settings-body"]')!.getBoundingClientRect();
      return ['default', 'runc', 'gvisor', 'kata-fc'].filter((r) => {
        const b = document.querySelector(`[data-testid="runtime-${r}"]`)!.getBoundingClientRect();
        return b.top < body.top - 1 || b.bottom > body.bottom + 1;
      });
    });
    expect(cut, 'these runtime rows are clipped by the popover, so nobody compares them').toEqual([]);
    await page.screenshot({ path: 'tests/e2e/test-results/runtime-1-picker.png', clip: await picker.boundingBox() ?? undefined });
    await page.screenshot({ path: 'tests/e2e/test-results/runtime-1-page.png' });
  });

  test('picking one puts it on the wire, and a reload keeps it', async ({ page }) => {
    await openComposer(page);
    await openSettings(page);
    await page.getByTestId('runtime-kata-fc').click();
    await expect(page.getByTestId('runtime-kata-fc')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('runtime-default')).toHaveAttribute('aria-pressed', 'false');
    await page.screenshot({ path: 'tests/e2e/test-results/runtime-2-picked.png' });

    // THE RELOAD. An experiment that forgets itself on refresh is not one.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await codeMode(page);
    await openSettings(page);
    await expect(page.getByTestId('runtime-kata-fc')).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');

    // THE WIRE. This is the line a refactor silently drops, and dropping it
    // sends every run to the fleet runtime while the picker still reads microVM.
    const body = await run(page, 'run the tests', {
      durable: true,
      id: 'm_e2e',
      project: 'e2e-runtime',
      runtime: 'kata-fc',
    });
    expect(
      body.runtime,
      `The composer posted ${JSON.stringify(body).slice(0, 300)} — without a runtime the ` +
        'run takes the fleet default and the selection means nothing.',
    ).toBe('kata-fc');
  });

  test('a refusal says why, in cloud\'s own words', async ({ page }) => {
    await openComposer(page);
    await openSettings(page);
    await page.getByTestId('runtime-kata-fc').click();
    await page.keyboard.press('Escape');

    // What cloud really answers: a project sandbox mounts a volume, and a
    // microVM has no shared filesystem to mount it with.
    await run(page, 'run the tests', {
      durable: false,
      project: 'e2e-runtime',
      reason: `No sandbox for e2e-runtime. The sandbox service refused (400): ${REFUSAL} This run edits a scratch copy in memory and nothing it writes is saved.`,
    });

    // BESIDE THE CHOICE, because that is the thing the reader has to change.
    await openSettings(page);
    const refused = page.getByTestId('runtime-refused');
    await expect(refused).toBeVisible();
    await expect(refused).toContainText('has no shared filesystem');
    await expect(refused).toContainText('ask for gvisor');
    await page.screenshot({ path: 'tests/e2e/test-results/runtime-3-refused.png' });
  });

  test('it reports the runtime it GOT, not the one it asked for', async ({ page }) => {
    await openComposer(page);
    await openSettings(page);
    await page.getByTestId('runtime-kata-fc').click();
    await page.keyboard.press('Escape');

    // Asked for a microVM, given gVisor. Every other observable of this run is
    // identical either way — which is precisely why the answer has to be said
    // out loud rather than inferred from the picker.
    await run(page, 'run the tests', {
      durable: true,
      id: 'm_e2e',
      project: 'e2e-runtime',
      runtime: 'gvisor',
    });

    await openSettings(page);
    const granted = page.getByTestId('runtime-granted');
    await expect(granted).toHaveText('Running on gvisor — you asked for kata-fc');
    await granted.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'tests/e2e/test-results/runtime-4-granted.png' });

    // And the run's own log says it too, so the answer outlives the popover.
    await expect(dock(page)).toContainText('on gvisor');
  });
});
