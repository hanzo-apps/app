import { test } from '@playwright/test';

/**
 * Diagnostic: which hop is dying — the hanzo.app pod, or the gateway behind it?
 * /v1/generate 502s (measured: one 38.7s hang → 502, one fast 502 with a
 * Cloudflare error body). This calls the GATEWAY directly from the signed-in
 * browser with the session's own bearer, same as the pod would.
 */
test('probe the gateway directly', async ({ page }) => {
  await page.goto('/dashboard');
  const out = await page.evaluate(async () => {
    const token =
      localStorage.getItem('hanzo.iam.access_token') ||
      localStorage.getItem('access_token') ||
      (() => {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)!;
          if (/token/i.test(k)) {
            const v = localStorage.getItem(k)!;
            if (v.split('.').length === 3) return v;
            try {
              const j = JSON.parse(v);
              if (typeof j?.accessToken === 'string') return j.accessToken;
              if (typeof j?.access_token === 'string') return j.access_token;
            } catch { /* not json */ }
          }
        }
        return null;
      })();
    if (!token) return { error: 'no token found in localStorage' };

    const results: Record<string, unknown> = {};
    // 1. models — control (expected fast 200)
    {
      const t0 = Date.now();
      const r = await fetch('https://api.hanzo.ai/v1/models', {
        headers: { Authorization: `Bearer ${token}` },
      });
      results.models = { status: r.status, ms: Date.now() - t0 };
    }
    // 2. a tiny completion — the hop generate depends on
    {
      const t0 = Date.now();
      try {
        const r = await fetch('https://api.hanzo.ai/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'enso-flash',
            messages: [{ role: 'user', content: 'say ok' }],
            max_tokens: 5,
            stream: false,
          }),
        });
        const text = await r.text();
        results.chat = { status: r.status, ms: Date.now() - t0, body: text.slice(0, 300) };
      } catch (e) {
        results.chat = { status: -1, ms: Date.now() - t0, body: String(e).slice(0, 200) };
      }
    }
    return results;
  });
  console.log('[gateway]', JSON.stringify(out, null, 1).slice(0, 900));
});
