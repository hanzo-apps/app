import { test } from '@playwright/test';

/**
 * Diagnostic: what does /v1/generate ACTUALLY answer a signed-in session right
 * now? The builder shows the gateway's else-class message ("The AI service is
 * unavailable") for anything that is not 401/402/403 — this captures the real
 * status and the first bytes of the body, which is the only way to tell a 429
 * from a 500 from a timeout.
 */
test('probe /v1/generate', async ({ page }) => {
  await page.goto('/dashboard');
  const out = await page.evaluate(async () => {
    const t0 = Date.now();
    try {
      const r = await fetch('/v1/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'one word: ok',
          pages: [{ path: 'index.html', html: '<html><body>x</body></html>' }],
        }),
      });
      const text = await r.text();
      return { status: r.status, ms: Date.now() - t0, body: text.slice(0, 400) };
    } catch (e) {
      return { status: -1, ms: Date.now() - t0, body: String(e).slice(0, 200) };
    }
  });
  console.log(`[generate] ${out.status} in ${out.ms}ms\n${out.body}`);
});
