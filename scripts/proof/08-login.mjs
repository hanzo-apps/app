// /login, both widths. The page starts the IAM redirect on mount, so a plain
// goto lands on hanzo.id and there is nothing to look at: answering the
// authorize navigation 204 keeps the browser exactly where it is (a 204 does
// not commit), which is the login page in the state a visitor sees while the
// redirect is in flight.
import { browser, shot, shotFull, watch, settle, log } from './drive.mjs';

const BASE = process.env.PROOF_BASE || 'http://localhost:3210';
const SIZES = {
  desktop: { width: 1440, height: 900 },
  phone: { width: 390, height: 844 },
};

const b = await browser();
for (const [name, viewport] of Object.entries(SIZES)) {
  const c = await b.newContext({ viewport, deviceScaleFactor: 2, colorScheme: 'dark' });
  const page = await c.newPage();
  const errs = watch(page);
  await page.route('https://hanzo.id/**', (r) => r.fulfill({ status: 204, body: '' }));

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await settle(page, 6000);

  log(name, 'url:', page.url());
  log(name, 'shot:', await shot(page, `08-login-${name}`));

  // The whole page, so the sections below the fold are seen rather than assumed:
  // they mount on approach, so scroll first and let them settle.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await settle(page, 2500);
  log(name, 'full:', await shotFull(page, `08-login-${name}-full`));
  await page.evaluate(() => window.scrollTo(0, 0));

  // Does anything paint past the right edge? A phone is where this shows.
  const over = await page.evaluate((w) => {
    const bad = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width && r.height && (r.right > w + 1 || r.left < -1)) {
        bad.push(`${el.tagName}.${(el.className || '').toString().slice(0, 40)} ${Math.round(r.left)}..${Math.round(r.right)}`);
      }
    }
    return { scrollW: document.documentElement.scrollWidth, bad: bad.slice(0, 6) };
  }, viewport.width);
  log(name, 'scrollWidth:', over.scrollW, 'vs viewport', viewport.width);
  log(name, 'painted outside:', over.bad.length ? over.bad : 'none');

  // The sign-in control, measured: it must be there, be a button, and be the
  // first thing in the reading order that does anything.
  const cta = page.getByRole('button', { name: 'Continue to Hanzo ID' });
  const box = await cta.boundingBox().catch(() => null);
  log(name, 'sign-in control:', box ? `${Math.round(box.width)}x${Math.round(box.height)} at y=${Math.round(box.y)}` : 'MISSING');

  log(name, 'errors:', errs.length ? errs.slice(0, 6) : 'none');
  await c.close();
}
await b.close();
