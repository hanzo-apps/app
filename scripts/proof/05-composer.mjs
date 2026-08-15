import { browser, ctx, shot, watch, settle, BASE, log } from './drive.mjs';

const size = process.env.SIZE || 'desktop';
const PROMPT =
  process.env.PROMPT || 'Build a simple habit tracker: add a habit, tick it off each day, show a streak count.';

const b = await browser();
const c = await ctx(b, { size, authed: true });
const page = await c.newPage();
const errs = watch(page);
const calls = [];
page.on('request', (r) => {
  const u = new URL(r.url());
  if (u.pathname.startsWith('/v1/')) calls.push(`${r.method()} ${u.pathname}`);
});

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await settle(page, 3500);
log('signed in on landing:', page.url());

// The composer is the ONE textarea on the landing page.
const box = page.locator('textarea').first();
await box.waitFor({ state: 'visible', timeout: 15_000 });
await box.scrollIntoViewIfNeeded();
await box.click();
await box.fill(PROMPT);
await settle(page, 600);
log('typed shot:', await shot(page, `05-composer-${size}-1-typed`));
log('textarea carries the prompt:', (await box.inputValue()).slice(0, 60));

// Submit with Enter (the composer's own rule: Enter unless Shift).
await box.press('Enter');

await page.waitForURL(/\/dev/, { timeout: 30_000 }).catch(() => log('!! never navigated to /dev'));
log('after submit url:', page.url());
await settle(page, 4000);
log('landed shot:', await shot(page, `05-composer-${size}-2-landed`));

// Is there a RUNNING app? The starter seeds a workspace before navigation, so a
// preview iframe with real content must exist immediately — not after the model.
const seeded = await page.evaluate(() => {
  const f = document.querySelector('iframe');
  let inner = null;
  try {
    inner = f?.contentDocument?.body?.innerText?.trim().slice(0, 200) ?? null;
  } catch {
    inner = '(cross-origin)';
  }
  return {
    iframes: document.querySelectorAll('iframe').length,
    srcdocLen: f?.getAttribute('srcdoc')?.length ?? 0,
    innerText: inner,
    ws: (() => {
      try {
        const k = Object.keys(localStorage).filter((x) => /workspace|project|initialPrompt/i.test(x));
        return k.map((x) => `${x}=${(localStorage.getItem(x) || '').slice(0, 60)}`);
      } catch {
        return [];
      }
    })(),
  };
});
log('seeded state:', JSON.stringify(seeded, null, 1));

// Now let the agent actually work.
log('waiting for the build turn…');
await settle(page, 45_000);
log('after-build shot:', await shot(page, `05-composer-${size}-3-built`));

const after = await page.evaluate(() => {
  const f = document.querySelector('iframe');
  let inner = null;
  try {
    inner = f?.contentDocument?.body?.innerText?.trim().slice(0, 300) ?? null;
  } catch {
    inner = '(cross-origin)';
  }
  return { srcdocLen: f?.getAttribute('srcdoc')?.length ?? 0, innerText: inner };
});
log('after build:', JSON.stringify(after, null, 1));

log('\n/v1 calls:', [...new Set(calls)].join('\n  '));
if (errs.length) log('\nERRORS:', errs.slice(0, 20));
await b.close();
