import { test, expect, type Page } from '@playwright/test';

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

/** Mock the network: timed SSE for completions, JSON for the conversation BFF. */
async function mockChatBackend(page: Page) {
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
    ({ chunks }) => {
      const original = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        if (!url.includes('/v1/chat/completions')) return original(input, init);
        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            for (const delta of chunks) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ choices: [{ delta: { content: delta } }] })}\n\n`,
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
          headers: { 'Content-Type': 'text/event-stream' },
        });
      };
    },
    { chunks: SSE_CHUNKS },
  );
}

test.describe('chat mode', () => {
  test('streams a message end-to-end at desktop (1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockChatBackend(page);

    await page.goto('/chat');
    const composer = page.getByTestId('composer');
    await expect(composer).toBeVisible();
    // Armed only once the page is interactive — the wait's clock starts here,
    // not during the dev server's first compile of the route.
    const createConversation = page.waitForRequest(
      (r) => r.url().includes('/v1/chat/conversations') && r.method() === 'POST',
      { timeout: 15000 },
    );
    await composer.fill('Say hello');
    await page.getByTestId('send').click();

    // The user turn renders and the conversation is persisted via the BFF.
    await expect(page.getByTestId('message-user')).toContainText('Say hello');
    await createConversation;

    // STREAMING proof: the cursor is up and a PARTIAL of the reply is on
    // screen while later chunks have not arrived yet.
    const assistant = page.getByTestId('message-assistant');
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
    await page.goto('/chat');

    await page.getByTestId('composer').fill('long answer please');
    await page.getByTestId('send').click();

    const stop = page.getByTestId('stop');
    await expect(stop).toBeVisible();
    await expect(page.getByTestId('message-assistant')).toContainText('Hello');
    await stop.click();

    // The partial stays, the stream ends, the composer is sendable again.
    await expect(page.getByTestId('streaming-cursor')).toHaveCount(0);
    await expect(page.getByTestId('message-assistant')).toContainText('Hello');
    await expect(page.getByTestId('send')).toBeVisible();
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
    await page.goto('/chat');

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

  test('streams at mobile width (390px)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockChatBackend(page);
    await page.goto('/chat');

    const composer = page.getByTestId('composer');
    await expect(composer).toBeVisible();
    await composer.fill('hi');
    await page.getByTestId('send').click();

    await expect(page.getByTestId('message-assistant')).toContainText('Streaming works.');
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
      page.getByRole('heading', { name: 'Work mode is coming soon' }),
    ).toBeVisible();

    await page.goto('/chat');
    await expect(page).toHaveURL(/\/chat$/);
    await expect(page.getByTestId('composer')).toBeVisible();
  });
});
