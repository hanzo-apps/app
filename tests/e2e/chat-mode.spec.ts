import { test, expect, type Page } from '@playwright/test';
import {
  DATA_COLLECTION_HEADER,
  FREE_CONSENT_KEY,
  FREE_CONSENT_VERSION,
  FREE_MODEL,
  FREE_MODEL_LABEL,
  freeCopy,
} from '@hanzo/ai';

/**
 * Chat mode — the ported hanzo.chat product at /chat.
 *
 * Proves the real client path end-to-end: composer → POST /v1/chat/completions
 * → SSE deltas → incremental markdown render → stop/regenerate — plus the
 * conversation BFF calls and the zen-only picker. The completions endpoint is
 * mocked as a genuinely TIMED SSE stream (a ReadableStream emitting frames over
 * time), so the assertion "partial text renders before the stream ends" is a
 * true streaming-render proof, not a buffered repaint. (No hk- key exists in
 * this environment; the task's mocked-SSE mode.)
 */

const SSE_CHUNKS = [
  'Hello',
  ' from',
  ' **Zen 5**.',
  '\n\nStreaming',
  ' works.',
];

/** A reply long enough to overflow a short viewport while it is still arriving. */
const LONG_ANSWER = Array.from(
  { length: 40 },
  (_, i) => `Paragraph ${i}: a long streamed answer that keeps going.\n\n`,
);

/**
 * How near the end still reads as "at the end", in px.
 *
 * This is the ASSERTION's tolerance, not a second copy of the shell's policy:
 * `SLACK` in `@hanzo/ui/chat` is the rule, and it cannot be imported here —
 * the package exports its pure decisions only through the barrel, which pulls
 * the whole component tree and does not load under the node runner this spec
 * runs in. So the number is stated as a bound the rule must sit inside, and it
 * is deliberately looser than the shell's, which keeps it correct if the shell
 * retunes.
 */
const AT_END = 64;

/**
 * The shell's own handles, not ours.
 *
 * The composer, the thread and the turns are `@hanzo/ui/chat` components now,
 * and they publish `data-slot` — the marker the package states its call sites
 * and tests select on. A `data-testid` this page used to write cannot reach
 * inside one: their props are closed, so nothing extra is forwarded to the DOM.
 * That is the right trade — the handle belongs to whoever renders the element —
 * and naming them once here is what keeps the swap from spreading through
 * every assertion below.
 *
 * The send control is ONE button in two states, so it is found by the name it
 * is announcing at the time. Two ids for two buttons was the arrangement the
 * shell removed.
 */
const composer = (page: Page) => page.locator('[data-slot="composer-field"]');
const sendBtn = (page: Page) => page.getByRole('button', { name: 'Send', exact: true });
const stopBtn = (page: Page) => page.getByRole('button', { name: 'Stop', exact: true });
const turns = (page: Page, role: 'user' | 'assistant') =>
  page.locator(`[data-slot="message"][data-role="${role}"]`);
const thread = (page: Page) => page.locator('[data-slot="thread"]');

/**
 * Open /chat and wait for the page to be able to answer, not merely to exist.
 *
 * A draft typed before React has hydrated writes the DOM and reaches no state:
 * the field shows the text, `ready()` still sees an empty value, and the send
 * control stays refused — so the test times out on a button that looks fine and
 * is telling the truth. Measured against this page in dev, that window is over
 * a second. `fill` then a check that send AGREES is the only honest signal that
 * the draft landed, so it is retried until it does.
 *
 * The dev overlay is hidden for a related reason: it is a fixed portal over the
 * bottom-right corner, which is exactly where the send control is, and it
 * swallows the click. It does not exist in the build this spec normally runs
 * against, so hiding it removes a difference rather than papering over one.
 */
async function open(page: Page) {
  await page.goto('/chat');
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  await expect(composer(page)).toBeVisible();
}

async function ask(page: Page, text: string) {
  await expect(async () => {
    await composer(page).fill(text);
    await expect(sendBtn(page)).toBeEnabled({ timeout: 1000 });
  }).toPass({ timeout: 30_000 });
}

/** The models the page actually asked for, in order — recorded by the stub. */
type Asked = { asked?: string[] };

/**
 * Mock the network: timed SSE for completions, JSON for the conversation BFF.
 *
 * A paid outage reaches a client in two shapes, and both are here: `refusePaid`
 * answers a paid model 402 (the family has no free route), `serveFree` answers
 * it 200 on the free route instead (a fallback the gateway made). A stream is
 * always tagged with the model that served it, and a free serving carries the
 * data-collection header, exactly as the gateway sends them.
 */
async function mockChatBackend(
  page: Page,
  { refusePaid = false, serveFree = false, chunks = SSE_CHUNKS } = {},
) {
  // A decodable (unsigned) session: the edge middleware gates /chat on cookie
  // PRESENCE, and IamCookieBridge keeps/clears that cookie from the SDK's
  // localStorage token — so both must exist and carry a future exp, or the
  // bridge clears the cookie and the next navigation bounces to login. Server
  // verification still fails closed; every server call this test needs is mocked.
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const b64u = (o: object) =>
    Buffer.from(JSON.stringify(o)).toString('base64url');
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
    },
    { token, expMs: exp * 1000 },
  );
  // Conversation persistence BFF (cloud /v1/agents/sessions behind it).
  await page.route('**/v1/chat/conversations', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          conversation: { id: 'sess_e2e', title: 'Say hello', updatedAt: '', messageCount: 0 },
        }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, conversations: [] }),
    });
  });
  await page.route('**/v1/chat/conversations/sess_e2e/messages', (route) =>
    route.fulfill({ status: 201, contentType: 'application/json', body: '{"ok":true}' }),
  );

  // Timed SSE — emitted from inside the page so deltas arrive over real time.
  await page.addInitScript(
    ({ chunks, free, refuse, fallback, collection }) => {
      const original = window.fetch.bind(window);
      const w = window as Window & Asked;
      w.asked = [];
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        if (!url.includes('/v1/chat/completions')) return original(input, init);
        const model = String(JSON.parse(String(init?.body ?? '{}')).model ?? '');
        w.asked?.push(model);
        const paid = model !== free;
        if (refuse && paid) {
          return new Response(
            JSON.stringify({ ok: false, needCredits: true, message: "You're out of credits." }),
            { status: 402, headers: { 'Content-Type': 'application/json' } },
          );
        }
        const served = fallback && paid ? free : model;
        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            for (const delta of chunks) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ model: served, choices: [{ delta: { content: delta } }] })}\n\n`,
                ),
              );
              await new Promise((r) => setTimeout(r, 150));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          },
        });
        return new Response(stream, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            ...(served === free ? { [collection]: 'on' } : {}),
          },
        });
      };
    },
    {
      chunks,
      free: FREE_MODEL,
      refuse: refusePaid,
      fallback: serveFree,
      collection: DATA_COLLECTION_HEADER,
    },
  );
}

test.describe('chat mode', () => {
  test('streams a message end-to-end at desktop (1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockChatBackend(page);

    await open(page);
    // Armed only once the page is interactive — the wait's clock starts here,
    // not during the dev server's first compile of the route.
    const createConversation = page.waitForRequest(
      (r) => r.url().includes('/v1/chat/conversations') && r.method() === 'POST',
      { timeout: 15000 },
    );
    await ask(page, 'Say hello');
    await sendBtn(page).click();

    // The user turn renders and the conversation is persisted via the BFF.
    await expect(turns(page, 'user')).toContainText('Say hello');
    await createConversation;

    // STREAMING proof: the cursor is up and a PARTIAL of the reply is on
    // screen while later chunks have not arrived yet.
    const assistant = turns(page, 'assistant');
    await expect(page.getByTestId('streaming-cursor')).toBeVisible();
    await expect(assistant).toContainText('Hello');
    await expect(assistant).not.toContainText('Streaming works.');

    // Completion: full text, markdown bold actually rendered, cursor gone.
    await expect(assistant).toContainText('Streaming works.');
    // Markdown is RENDERED, not echoed. MarkdownRenderer maps the `strong` node
    // onto @hanzo/ui's SizableText, so bold arrives as a weighted run and there
    // is no <strong> tag to find — the weight and the absent asterisks are the
    // guarantee, and they are also what a reader actually sees.
    await expect(assistant.getByText('Zen 5', { exact: true })).toHaveCSS('font-weight', '600');
    await expect(assistant).not.toContainText('*');
    await expect(page.getByTestId('streaming-cursor')).toHaveCount(0);

    // Regenerate is offered on the finished turn.
    await assistant.hover();
    await expect(page.getByTestId('regenerate')).toBeVisible();
  });

  test('stop ends the stream and keeps the partial turn', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockChatBackend(page);
    await open(page);

    await ask(page, 'long answer please');
    await sendBtn(page).click();

    const stop = stopBtn(page);
    await expect(stop).toBeVisible();
    await expect(turns(page, 'assistant')).toContainText('Hello');
    await stop.click();

    // The partial stays, the stream ends, the composer is sendable again.
    await expect(page.getByTestId('streaming-cursor')).toHaveCount(0);
    await expect(turns(page, 'assistant')).toContainText('Hello');
    await expect(sendBtn(page)).toBeVisible();
  });

  // /chat is deliberately HOUSE-only: `houseOnly()` in app/chat/page.tsx keeps
  // `^(zen|enso)` and drops the resold families that the builder and settings
  // pickers do offer.
  //
  // This asserted `not.toMatch(/enso/i)` while the filter it describes ADMITS
  // enso, so it contradicted the code it was guarding — and since the offline
  // ladder is the one this test actually gets (mockChatBackend never stubs
  // /v1/models, and an unsigned token makes the BFF fall back), the labels it
  // saw were exactly the ones it forbade.
  test('model picker offers the house families only', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockChatBackend(page);
    await open(page);

    await page.getByTestId('model-picker').click();
    const options = page.getByRole('option');
    await expect(options.first()).toBeVisible();
    const labels = await options.allTextContents();
    expect(labels.length).toBeGreaterThan(0);
    for (const label of labels) {
      expect(label).toMatch(/zen|enso/i);
      expect(label).not.toMatch(/gpt|claude|kimi|glm|qwen|deepseek|llama/i);
    }
  });

  // A paid outage is not the end of the conversation: Enso Free can serve the
  // same turn. It is offered, never taken for the reader, because a free answer
  // is data-shared — @hanzo/ai owns the predicate, the words and the consent
  // record, and this proves the page renders and obeys all three.
  test('a paid outage offers Free and continues the turn once consented', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockChatBackend(page, { refusePaid: true });
    await open(page);

    await ask(page, 'Say hello');
    await sendBtn(page).click();

    // The refusal offers Free and keeps the turn. Nothing switched by itself.
    const offer = page.getByTestId('free-offer');
    await expect(offer).toContainText(freeCopy.paidTitle);
    await expect(offer).toContainText(freeCopy.paidBody);
    await expect(turns(page, 'user')).toContainText('Say hello');
    await expect(page.getByTestId('model-picker')).not.toContainText(FREE_MODEL_LABEL);

    // Free is data-shared, so the first switch asks — in the shared words.
    await offer.getByTestId('free-switch').click();
    const consent = page.getByTestId('free-consent');
    await expect(consent).toContainText(freeCopy.consentTitle);
    await expect(consent).toContainText(freeCopy.consentPoints[0]);
    await expect(consent).toContainText(freeCopy.termsText);
    await expect(consent.getByRole('link')).toHaveAttribute('href', 'https://hanzo.ai/terms');
    await consent.getByTestId('free-agree').click();

    // The same turn is answered on Free, and the picker names what served it.
    await expect(turns(page, 'assistant')).toContainText('Streaming works.');
    await expect(page.getByTestId('free-offer')).toHaveCount(0);
    await expect(page.getByTestId('model-picker')).toContainText(FREE_MODEL_LABEL);
    const asked = await page.evaluate(() => (window as Window & Asked).asked ?? []);
    expect(asked[0]).not.toBe(FREE_MODEL);
    expect(asked[1]).toBe(FREE_MODEL);

    // Free is remembered, so a reload keeps serving instead of failing again.
    await page.reload();
    await expect(page.getByTestId('model-picker')).toContainText(FREE_MODEL_LABEL);
  });

  // The other shape: the gateway answers the paid model on Free itself. The
  // reply is already here, so the offer is to KEEP Free, and nothing is resent.
  test('a reply served on Free says so and offers to stay there', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockChatBackend(page, { serveFree: true });
    await open(page);

    await ask(page, 'Say hello');
    await sendBtn(page).click();

    const assistant = turns(page, 'assistant');
    await expect(assistant).toContainText('Streaming works.');
    // The turn is signed with what answered it, not with what was asked for.
    await expect(assistant).toContainText(FREE_MODEL_LABEL);
    await expect(page.getByTestId('free-offer')).toContainText(freeCopy.fallbackBody);
    await expect(page.getByTestId('free-switch')).toContainText(freeCopy.keepCta);

    await page.getByTestId('free-switch').click();
    await page.getByTestId('free-agree').click();

    // Kept, not re-asked: one request went out and the picker now names Free.
    await expect(page.getByTestId('model-picker')).toContainText(FREE_MODEL_LABEL);
    await expect(page.getByTestId('free-offer')).toHaveCount(0);
    expect(await page.evaluate(() => (window as Window & Asked).asked ?? [])).toHaveLength(1);
  });

  test('consent already on record switches without asking again', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockChatBackend(page, { refusePaid: true });
    await page.addInitScript(
      ({ key, version }) =>
        localStorage.setItem(
          key,
          JSON.stringify({ granted: true, at: new Date().toISOString(), version }),
        ),
      { key: FREE_CONSENT_KEY, version: FREE_CONSENT_VERSION },
    );
    await open(page);

    await ask(page, 'Say hello');
    await sendBtn(page).click();
    await page.getByTestId('free-switch').click();

    await expect(page.getByTestId('free-consent')).toHaveCount(0);
    await expect(turns(page, 'assistant')).toContainText('Streaming works.');
  });

  /**
   * The thread follows the answer down, and STOPS following the moment the
   * reader scrolls up.
   *
   * This page used to scroll to the end on every change to its message array,
   * and a streaming turn rewrites that array on every delta — so scrolling up
   * to re-read something was undone by the next token, several times a second.
   * There is no error, no warning and no failing assertion for that: the only
   * way to see it is to scroll up mid-stream and watch the offset.
   *
   * `Thread` asks `pinned()` instead, so the rule is a distance from the end
   * rather than a reflex. Both directions are pinned here, because a component
   * that never follows would pass a test that only checks it does not yank.
   */
  test('a streaming answer does not drag the reader back down', async ({ page }) => {
    // Short enough that a handful of turns overflows it.
    await page.setViewportSize({ width: 1280, height: 520 });
    await mockChatBackend(page, { chunks: LONG_ANSWER });
    await open(page);

    await ask(page, 'go');
    // Enter, not the button. The page-wide "contribute" widget is fixed to the
    // bottom-right at the top of the stacking order, and between roughly 1024
    // and 1280 wide its bubble lands on the send control — measured with
    // `elementFromPoint` at the control's own centre. Enter is the composer's
    // other send path and the one this shell exists to get right, so the test
    // for scrolling does not also depend on that overlap.
    await composer(page).press('Enter');

    const box = thread(page);
    const read = () =>
      box.evaluate((t) => ({
        top: Math.round(t.scrollTop),
        gap: Math.round(t.scrollHeight - t.clientHeight - t.scrollTop),
        range: Math.round(t.scrollHeight - t.clientHeight),
      }));

    // Wait until there is genuinely something to scroll. One read, because two
    // reads of a growing thread are two different moments.
    await expect.poll(async () => (await read()).range).toBeGreaterThan(250);

    // Untouched, it is at the end: the answer arrives in view.
    expect((await read()).gap).toBeLessThanOrEqual(AT_END);

    // The reader goes back to the top, and the stream keeps arriving.
    await box.evaluate((t) => { t.scrollTop = 0; });
    const parked = await read();
    expect(parked.top).toBe(0);
    await expect.poll(async () => (await read()).gap).toBeGreaterThan(parked.gap + 100);
    expect((await read()).top).toBe(0);

    // Back at the end, it follows again — the rule is where you are, not a
    // one-way switch that a single scroll turns off for good.
    await box.evaluate((t) => { t.scrollTop = t.scrollHeight; });
    await expect.poll(async () => (await read()).gap).toBeLessThanOrEqual(AT_END);
  });

  test('streams at mobile width (390px)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockChatBackend(page);
    await open(page);
    await ask(page, 'hi');
    await sendBtn(page).click();

    await expect(turns(page, 'assistant')).toContainText('Streaming works.');
    // No horizontal overflow — the thread fits the phone viewport.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

// The chat | dev | work SWITCHER was deleted on purpose (b2bc3d9b —
// components/mode-switcher and both of its mounts): hanzo.app is the dev
// surface and hanzo.chat is the chat surface until the two behave alike, and a
// segmented control advertised a choice the product had not made. The modes are
// still three real routes of one gated app, which is what survives to prove —
// reached by URL, since that is now the way in.
test.describe('modes', () => {
  test('chat and work are real routes of the one app', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockChatBackend(page);

    await page.goto('/work');
    await expect(page).toHaveURL(/\/work$/);
    await expect(
      page.getByRole('heading', { name: 'Work mode is not built yet' }),
    ).toBeVisible();

    await open(page);
    await expect(page).toHaveURL(/\/chat$/);
    await expect(composer(page)).toBeVisible();
  });
});
