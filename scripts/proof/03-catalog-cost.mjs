import { browser, ctx, settle, BASE, log } from './drive.mjs';

const b = await browser();
const c = await ctx(b, { size: 'desktop' });
const page = await c.newPage();
const seen = [];
page.on('response', async (r) => {
  const u = new URL(r.url());
  if (u.pathname.startsWith('/v1/')) {
    let n = 0;
    try {
      n = (await r.body()).length;
    } catch {}
    seen.push({ path: u.pathname, status: r.status(), bytes: n });
  }
});
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await settle(page, 6000);
log('ANON landing /v1 calls (no interaction):');
for (const s of seen) log(` ${s.status}  ${String(s.bytes).padStart(9)} B  ${s.path}`);
log('total /v1 bytes:', seen.reduce((a, s) => a + s.bytes, 0));
await b.close();
