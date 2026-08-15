import { browser, ctx, shot, watch, settle, BASE, log } from './drive.mjs';

const size = process.env.SIZE || 'desktop';
const PROMPT =
  process.env.PROMPT || 'Build a habit tracker: add a habit, tick it off each day, show a streak count.';

const b = await browser();
const c = await ctx(b, { size, authed: true });
const page = await c.newPage();
const errs = watch(page);
const gen = [];
page.on('response', async (r) => {
  const u = new URL(r.url());
  if (u.pathname === '/v1/generate') gen.push(`${r.request().method()} ${r.status()}`);
});

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await settle(page, 3500);
const box = page.locator('textarea').first();
await box.click();
await box.fill(PROMPT);
await box.press('Enter');
await page.waitForURL(/\/dev/, { timeout: 30_000 });
await settle(page, 3000);

const srcdoc = () =>
  page.evaluate(() => document.querySelector('iframe')?.getAttribute('srcdoc')?.length ?? 0);
const busy = () =>
  page.evaluate(() => /Generating|Applying edits|Thinking|Building/i.test(document.body.innerText));

const seedLen = await srcdoc();
log('seeded srcdoc bytes:', seedLen, '| busy:', await busy());
log('seeded shot:', await shot(page, `06-build-${size}-1-seeded`));

// Poll for the turn to finish — the preview changing is the real signal.
const t0 = Date.now();
let len = seedLen;
let done = false;
while (Date.now() - t0 < 300_000) {
  await settle(page, 5000);
  len = await srcdoc();
  const b2 = await busy();
  log(` t+${Math.round((Date.now() - t0) / 1000)}s  srcdoc=${len}  busy=${b2}`);
  if (!b2 && len !== seedLen) {
    done = true;
    break;
  }
}
log('\nBUILD FINISHED:', done, '| srcdoc', seedLen, '->', len);
log('final shot:', await shot(page, `06-build-${size}-2-final`));

const body = await page.evaluate(() => {
  const f = document.querySelector('iframe');
  const s = f?.getAttribute('srcdoc') || '';
  return { title: (s.match(/<title>([^<]*)</) || [])[1] || '(none)', head: s.slice(0, 240) };
});
log('generated doc:', JSON.stringify(body, null, 1));
log('/v1/generate responses:', gen.join(', '));
log('page url:', page.url());
if (errs.length) log('ERRORS(non-iframe):', errs.filter((e) => !/origin 'null'/.test(e)).slice(0, 10));
await b.close();
