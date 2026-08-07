/**
 * A run is watched WHILE it runs, and it can be stopped — proven in a browser.
 *
 * WHAT THIS HAS TO SHOW, and why the unit tests cannot show it. The defect being
 * fixed is a TIMING one: a command's output used to reach the console only when
 * the command was over, so a twenty-five minute build was four lines and then a
 * wall of text. "The bytes decode" is not the claim — `tests/integration/
 * watch.test.ts` already proves that. The claim is that they are ON SCREEN while
 * the command is still running, which is a statement about a moment in time, and
 * the only honest way to check it is to look at the screen before the command
 * ends.
 *
 * So the run is HELD OPEN. The feed pushes lines one at a time, the assertions
 * read the dock between them, and the run's own stream does not deliver its
 * result until the test says so. A regression to the old behaviour leaves the
 * dock empty at every one of those reads.
 *
 * WHERE THE STUB SITS, and why there. `window.fetch` — the app's one door to the
 * network — is shimmed for exactly three URLs. Playwright's own route
 * interception cannot express this test: `route.fulfill` sends a body whole, so
 * a stream held open mid-flight is not something it can produce, and a stream
 * that arrives all at once is precisely the bug. Everything BELOW that door is
 * the shipping code: `startAgentRun`, `codeTurn`, `watchRuns`'s frame decoder,
 * the console store, the dock, and the Stop control's own request.
 *
 * THE THIRD TEST IS THE CONTROL. Without it, "the buffered result is not printed
 * twice" would also pass if the buffered result were never printed at all —
 * i.e. if the feature were dead. With no session on the run, the buffered result
 * MUST appear, because it is then the only copy of the output there is.
 *
 * RUN IT:
 *   PLAYWRIGHT_BASE_URL=http://localhost:3210 pnpm exec playwright test \
 *     --project=public tests/e2e/live-run.spec.ts
 */

import { test, expect, type Page } from '@playwright/test';

const SESSION = 'sess_live_1';
const SANDBOX = 'sbx_live_1';
/** What the run's own stream carries at the END — the buffered copy. */
const BUFFERED = 'BUFFERED-TAIL-SHOULD-NOT-APPEAR';

declare global {
  interface Window {
    /** The test's grip on the two streams, installed before any app code runs. */
    __run: {
      /** Push one frame onto the run's own stream. */
      run(frame: string): void;
      /** Push one frame onto the live feed. */
      feed(frame: string): void;
      /** End the run's stream, as a finished run does. */
      endRun(): void;
      /** What the Stop control sent, once it has sent it. */
      stopped: unknown;
    };
  }
}

/**
 * Install the shim. Runs before the app's own scripts, so no request escapes it.
 *
 * Each stubbed URL answers a `Response` over a `ReadableStream` the test feeds
 * by hand — which is what makes "the third line has arrived and the command has
 * not finished" an expressible state.
 */
async function stubStreams(page: Page) {
  await page.addInitScript(() => {
    const encode = (s: string) => new TextEncoder().encode(s);
    let runPush: ((chunk: string) => void) | null = null;
    let runClose: (() => void) | null = null;
    let feedPush: ((chunk: string) => void) | null = null;
    const pending: { run: string[]; feed: string[] } = { run: [], feed: [] };

    const sse = (adopt: (push: (c: string) => void, close: () => void) => void) =>
      new ReadableStream<Uint8Array>({
        start(controller) {
          adopt(
            (chunk) => controller.enqueue(encode(chunk)),
            () => {
              try {
                controller.close();
              } catch {
                /* already closed */
              }
            },
          );
        },
      });

    const stream = (body: ReadableStream<Uint8Array>) =>
      new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
      });

    window.__run = {
      run: (frame) => (runPush ? runPush(frame) : pending.run.push(frame)),
      feed: (frame) => (feedPush ? feedPush(frame) : pending.feed.push(frame)),
      endRun: () => runClose?.(),
      stopped: null,
    };

    const real = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      if (url.includes('/v1/agents/runs')) {
        return stream(
          sse((push, close) => {
            runPush = push;
            runClose = close;
            pending.run.splice(0).forEach(push);
          }),
        );
      }
      if (url.includes('/v1/agents/sessions/stream')) {
        return stream(
          sse((push) => {
            feedPush = push;
            pending.feed.splice(0).forEach(push);
          }),
        );
      }
      if (url.includes('/v1/sandboxes/stop')) {
        window.__run.stopped = JSON.parse(String(init?.body ?? '{}'));
        return new Response(JSON.stringify({ ok: true, stopped: 1 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // Build mode's generator answers empty so seeding the editor costs nothing.
      if (url.includes('/v1/generate')) {
        return new Response('', { status: 200, headers: { 'Content-Type': 'text/plain' } });
      }
      return real(input as RequestInfo, init);
    };
  });
}

/** One frame of the run's own stream — bare `data:`, the shape that route emits. */
const runFrame = (event: unknown) => `data: ${JSON.stringify(event)}\n\n`;

/** One frame of the live feed — `event:` + `data:`, the shape cloud emits. */
const feedFrame = (kind: string, payload: unknown) =>
  `event: event\ndata: ${JSON.stringify({ event: { sessionId: SESSION, kind, payload } })}\n\n`;

const output = (message: string) => feedFrame('log', { message });
const lifecycle = (step: string, message: string) => feedFrame('tool-call', { step, message });

/** The first frame of every run: where it edits, and where to watch it. */
const whereFrame = (session?: string) =>
  runFrame({
    type: 'sandbox',
    durable: true,
    id: SANDBOX,
    project: 'demo',
    ...(session ? { session } : {}),
  });

const commandFrame = runFrame({
  type: 'tool_call',
  id: 't1',
  name: 'run_command',
  arguments: JSON.stringify({ command: 'pnpm build' }),
});

const resultFrame = runFrame({
  type: 'tool_result',
  id: 't1',
  name: 'run_command',
  result: `Exit code 0\n\nstdout:\n${BUFFERED}`,
  isError: false,
});

const doneFrame = runFrame({ type: 'done', finishReason: 'stop', turns: 1, files: [], changed: [] });

/**
 * Start a code-mode run through the real composer, and open the dock.
 *
 * The editor is the surface that owns the dock, so the run starts where a person
 * starts one. The dock's bar is a click-to-expand separator, which is how a
 * person opens it too.
 */
async function startRun(page: Page) {
  await page.goto('/dev?prompt=seed', { waitUntil: 'domcontentloaded' });

  const composer = page.getByRole('textbox').first();
  await composer.waitFor({ state: 'visible', timeout: 60_000 });
  await composer.fill('build the project');
  await composer.press('Enter');

  await page.getByRole('separator').first().click();
}

test.describe('watching a run', () => {
  test.beforeEach(async ({ page, context, baseURL }) => {
    const url = new URL(baseURL ?? 'http://localhost:3210');
    // `middleware.ts` only checks that a session cookie EXISTS before /dev
    // mounts; the dev server authenticates a localhost caller itself.
    await context.addCookies([
      { name: 'hanzo_iam_access_token', value: 'e2e', domain: url.hostname, path: '/' },
    ]);
    // The composer remembers its mode (react-use's useLocalStorage, JSON). Code
    // mode is the one that runs commands in a sandbox — the whole subject here.
    await page.addInitScript(() => {
      window.localStorage.setItem('composer-mode', JSON.stringify('code'));
    });
    await stubStreams(page);
  });

  test('shows a command working, line by line, before it has finished', async ({ page }) => {
    await startRun(page);

    // The run says where it edits and where to watch. Nothing has run yet.
    await page.evaluate((f) => window.__run.run(f), whereFrame(SESSION));
    await page.evaluate((f) => window.__run.run(f), commandFrame);
    await expect(page.getByText(`connected to sandbox ${SANDBOX}`)).toBeVisible({ timeout: 20_000 });

    // Now the sandbox narrates, one line at a time, and each is read BEFORE the
    // next is sent — so each assertion is a moment when the command is running.
    await page.evaluate((f) => window.__run.feed(f), lifecycle('leased', `sandbox ${SANDBOX} (dev)`));
    await expect(page.getByText(`sandbox ${SANDBOX} (dev)`)).toBeVisible();

    await page.evaluate((f) => window.__run.feed(f), output('compiling 214 modules\n'));
    await expect(page.getByText('compiling 214 modules')).toBeVisible();

    await page.evaluate((f) => window.__run.feed(f), output('warning: unused import in src/app.ts\n'));
    await expect(page.getByText('warning: unused import in src/app.ts')).toBeVisible();

    // A non-zero ending reads as a failure without anyone parsing the number.
    await page.evaluate((f) => window.__run.feed(f), lifecycle('exit', 'exit 1'));
    await expect(page.getByText('exit 1')).toBeVisible();

    // AND THE RUN IS STILL GOING. This is what makes every line above "live".
    await expect(page.getByText(BUFFERED)).toHaveCount(0);

    await page.screenshot({ path: 'tests/e2e/test-results/live-run-streaming.png' });
  });

  test('offers Stop while the work is running, and says the box survives', async ({ page }) => {
    await startRun(page);
    await page.evaluate((f) => window.__run.run(f), whereFrame(SESSION));
    await page.evaluate((f) => window.__run.feed(f), output('installing…\n'));
    await expect(page.getByText('installing…')).toBeVisible({ timeout: 20_000 });

    const stop = page.getByRole('button', { name: /stop the running command/i });
    await expect(stop).toBeVisible();
    // The label is the promise: this ends the WORK, not the sandbox.
    await expect(stop).toHaveAttribute('title', /the sandbox, the checkout and the log stay/i);

    // IT DOES NOT PAINT OVER THE BAR'S OWN STATE. The right cluster is floated
    // over an inert row that reserves its width, so a control added to the
    // cluster overlaps the row's last word unless the reservation grows with it
    // — which is exactly what happened, and reads as corrupted text rather than
    // as a layout bug. Boxes, not screenshots, because only boxes fail loudly.
    const box = await stop.boundingBox();
    const status = await page.getByText(/^(Working|Ready)$/).first().boundingBox();
    expect(box, 'Stop has a painted box').not.toBeNull();
    expect(status, 'the bar still states the run state').not.toBeNull();
    expect(status!.x + status!.width, 'the status ends before Stop begins').toBeLessThanOrEqual(box!.x);
    await page.screenshot({ path: 'tests/e2e/test-results/live-run-stop-offered.png' });

    await stop.click();

    // It acted on the sandbox, which is the handle stop takes.
    await expect.poll(() => page.evaluate(() => window.__run.stopped)).toEqual({ id: SANDBOX });
    await expect(page.getByText(/the sandbox and everything in it are still here/i)).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/test-results/live-run-stopped.png' });

    // And when the run really ends, the control goes with it — a Stop offering
    // to interrupt a finished command is a button that lies.
    await page.evaluate(() => {
      window.__run.run(`data: ${JSON.stringify({ type: 'done', finishReason: 'stop', turns: 1, files: [], changed: [] })}\n\n`);
      window.__run.endRun();
    });
    await expect(stop).toHaveCount(0);
  });

  test('prints the command output ONCE when watched, and still prints it when not', async ({ page }) => {
    // Watched: the console already showed these bytes live, so the buffered copy
    // the run's own stream carries is dropped.
    await startRun(page);
    await page.evaluate((f) => window.__run.run(f), whereFrame(SESSION));
    await page.evaluate((f) => window.__run.run(f), commandFrame);
    await page.evaluate((f) => window.__run.feed(f), output('compiling 214 modules\n'));
    await expect(page.getByText('compiling 214 modules')).toBeVisible({ timeout: 20_000 });

    await page.evaluate((f) => window.__run.run(f), resultFrame);
    await page.evaluate((f) => window.__run.run(f), doneFrame);
    await page.evaluate(() => window.__run.endRun());
    await expect(page.getByText(BUFFERED)).toHaveCount(0);
    await expect(page.getByText('compiling 214 modules')).toHaveCount(1);
  });

  test('CONTROL: with nothing watching, the buffered result IS printed', async ({ page }) => {
    // The registry was unreachable, so the run carries no session. The buffered
    // result is then the only copy of the output there is, and dropping it would
    // trade a silent pause for silence. If this ever goes red, the drop above
    // stopped being conditional and started losing output.
    await startRun(page);
    await page.evaluate((f) => window.__run.run(f), whereFrame());
    await page.evaluate((f) => window.__run.run(f), commandFrame);
    await page.evaluate((f) => window.__run.run(f), resultFrame);
    await page.evaluate((f) => window.__run.run(f), doneFrame);
    await page.evaluate(() => window.__run.endRun());

    await expect(page.getByText(BUFFERED)).toBeVisible({ timeout: 20_000 });
  });
});
