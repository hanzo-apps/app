import { browser, ctx, shot, watch, settle, BASE, log } from './drive.mjs';

const b = await browser();

// --- desktop: the header Search control + ⌘K ---
{
  const c = await ctx(b, { size: 'desktop' });
  const page = await c.newPage();
  const errs = watch(page);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await settle(page, 3000);

  // Click the visible "Search" affordance in the header.
  const trigger = page.getByText(/^Search$/).first();
  log('search trigger visible:', await trigger.isVisible().catch(() => false));
  await trigger.click({ timeout: 8000 }).catch((e) => log('click failed:', e.message));
  await settle(page, 1200);
  log('after click shot:', await shot(page, '02-search-desktop-open'));

  const state = await page.evaluate(() => {
    const vis = (e) => {
      const r = e.getBoundingClientRect();
      return r.width > 4 && r.height > 4;
    };
    const dialog = [...document.querySelectorAll('[role=dialog],[data-slot*=dialog],[cmdk-root]')].filter(vis);
    return {
      dialogs: dialog.length,
      inputs: [...document.querySelectorAll('input')].filter(vis).map((i) => i.placeholder),
      focused: document.activeElement?.tagName + ':' + (document.activeElement?.placeholder || ''),
    };
  });
  log('open state:', JSON.stringify(state));

  // Type a query and see what comes back.
  await page.keyboard.type('pricing', { delay: 40 });
  await settle(page, 1500);
  log('typed shot:', await shot(page, '02-search-desktop-results'));
  const results = await page.evaluate(() => {
    const vis = (e) => {
      const r = e.getBoundingClientRect();
      return r.width > 4 && r.height > 4;
    };
    const d = [...document.querySelectorAll('[role=dialog],[cmdk-root]')].filter(vis)[0];
    if (!d) return 'NO DIALOG';
    return {
      items: [...d.querySelectorAll('[role=option],[cmdk-item],a,button')]
        .filter(vis)
        .map((e) => e.innerText.trim().replace(/\n/g, ' | ').slice(0, 60))
        .filter(Boolean)
        .slice(0, 14),
      text: d.innerText.slice(0, 260),
    };
  });
  log('results:', JSON.stringify(results, null, 1));
  if (errs.length) log('ERRORS:', errs.slice(0, 8));
  await c.close();
}

// --- phone: the hamburger menu ---
{
  const c = await ctx(b, { size: 'phone' });
  const page = await c.newPage();
  const errs = watch(page);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await settle(page, 3000);
  // The hamburger is top-right in the header.
  const hdr = await page.evaluate(() => {
    const h = document.querySelector('header');
    if (!h) return 'no header';
    return [...h.querySelectorAll('*')]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 10 && r.height > 10 && r.x > 250;
      })
      .map((e) => `${e.tagName}.${e.className?.toString().slice(0, 40)} @${Math.round(e.getBoundingClientRect().x)}`)
      .slice(-6);
  });
  log('phone header right-side elements:', JSON.stringify(hdr, null, 1));
  await page.mouse.click(352, 30);
  await settle(page, 1200);
  log('menu shot:', await shot(page, '02-menu-phone'));
  const menu = await page.evaluate(() => {
    const vis = (e) => {
      const r = e.getBoundingClientRect();
      return r.width > 4 && r.height > 4;
    };
    return [...document.querySelectorAll('a')]
      .filter(vis)
      .map((a) => `${a.innerText.trim().slice(0, 30)} -> ${a.getAttribute('href')}`)
      .filter((s) => s.length > 5)
      .slice(0, 20);
  });
  log('menu links:', JSON.stringify(menu, null, 1));
  if (errs.length) log('ERRORS:', errs.slice(0, 8));
  await c.close();
}
await b.close();
