import { browser, ctx, shot, watch, settle, BASE, log } from './drive.mjs';

const b = await browser();
for (const size of ['desktop', 'phone']) {
  const c = await ctx(b, { size });
  const page = await c.newPage();
  const errs = watch(page);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await settle(page, 3500);
  log(`\n=== ${size} :: ${page.url()} — "${await page.title()}"`);
  log('shot:', await shot(page, `01-landing-${size}`));

  // What is actually on the page?
  const map = await page.evaluate(() => {
    const vis = (e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const txt = (e) => (e.innerText || e.value || e.placeholder || '').trim().slice(0, 70);
    return {
      h1: [...document.querySelectorAll('h1,h2')].filter(vis).map(txt).slice(0, 8),
      inputs: [...document.querySelectorAll('input,textarea')]
        .filter(vis)
        .map((e) => ({ tag: e.tagName, ph: e.placeholder, type: e.type, name: e.name })),
      buttons: [...document.querySelectorAll('button,a[role=button]')]
        .filter(vis)
        .map(txt)
        .filter(Boolean)
        .slice(0, 24),
      navLinks: [...document.querySelectorAll('header a, nav a')]
        .filter(vis)
        .map((a) => `${txt(a)} -> ${a.getAttribute('href')}`)
        .slice(0, 20),
      scrollH: document.documentElement.scrollHeight,
    };
  });
  log(JSON.stringify(map, null, 1));
  if (errs.length) log('ERRORS:', errs.slice(0, 12));
  await c.close();
}
await b.close();
