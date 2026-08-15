// The hero frame, measured: the caption is gone, the demo says so inside the
// picture, the storylines cycle, the recreate link fills the real composer, and
// nothing runs off the side of a phone.
//
// PROOF_BASE picks the target — localhost for the pre-flight, https://hanzo.app
// for the live check. One script, both.
import { browser, ctx, shot, watch, settle, BASE, log } from './drive.mjs';

const name = (page) =>
  page.evaluate(() => {
    const tag = [...document.querySelectorAll('*')].find(
      (e) => e.children.length === 0 && e.textContent.trim() === 'Demo',
    );
    const strip = tag?.parentElement;
    return strip ? [...strip.children].map((c) => c.textContent.trim()).filter(Boolean)[0] : null;
  });

const b = await browser();
let bad = 0;

for (const size of ['phone', 'desktop']) {
  const c = await ctx(b, { size });
  const page = await c.newPage();
  const errs = watch(page);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await settle(page, 3000);

  // The frame animates on being SEEN, so put it on screen first.
  await page.getByRole('button', { name: /^Build .+ →$/ }).scrollIntoViewIfNeeded();
  await settle(page, 1500);

  const say = (ok, what) => {
    log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`);
    if (!ok) bad++;
  };

  log(`\n=== ${size} :: ${page.url()}`);

  // (a) the caption is gone
  const body = await page.evaluate(() => document.body.innerText);
  say(!body.includes('watch the builder build'), 'the dead caption is gone');

  // (b) the demo label rides the frame chrome
  const demo = page.getByText('Demo', { exact: true });
  say((await demo.count()) > 0 && (await demo.first().isVisible()), 'the frame says "Demo"');

  // (c) it cycles to another storyline
  const first = await name(page);
  let second = first;
  for (let i = 0; i < 40 && second === first; i++) {
    await settle(page, 1000);
    second = await name(page);
  }
  say(!!first && !!second && first !== second, `cycles: ${first} → ${second}`);
  log('  shot:', await shot(page, `07-hero-${size}`));

  // (d) the recreate link fills the REAL composer
  const link = page.getByRole('button', { name: /^Build .+ →$/ }).first();
  const label = (await link.innerText()).trim();
  await link.click();
  await settle(page, 600);
  const draft = await page.getByLabel('Ask Hanzo to build').inputValue();
  say(draft.length > 20, `"${label}" fills the composer: "${draft.slice(0, 64)}…"`);
  log('  shot:', await shot(page, `07-hero-${size}-filled`));

  // (e) nothing runs off the side
  const over = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    view: window.innerWidth,
  }));
  say(over.scroll <= over.view + 1, `no sideways scroll (${over.scroll} <= ${over.view})`);

  // (f) the composer is on screen at EVERY depth, footer included.
  for (const at of [0.25, 0.5, 0.75, 1]) {
    const box = await page.evaluate(async (frac) => {
      const doc = document.documentElement;
      window.scrollTo(0, (doc.scrollHeight - window.innerHeight) * frac);
      await new Promise((r) => setTimeout(r, 700));
      const field = document.querySelector('[aria-label="Ask Hanzo to build"]');
      const r = field?.getBoundingClientRect();
      return r ? { top: r.top, bottom: r.bottom, h: window.innerHeight } : null;
    }, at);
    say(
      !!box && box.bottom > 0 && box.top < box.h,
      `composer on screen at ${at * 100}% (top ${Math.round(box?.top ?? -1)} of ${box?.h})`,
    );
  }
  // The footer mounts on scroll, so the page grows under the first "bottom".
  // Ride it down until the height settles, then measure the REAL bottom.
  const foot = await page.evaluate(async () => {
    const doc = document.documentElement;
    let h = 0;
    for (let i = 0; i < 20 && h !== doc.scrollHeight; i++) {
      h = doc.scrollHeight;
      window.scrollTo(0, h);
      await new Promise((r) => setTimeout(r, 400));
    }
    const bar = document.querySelector('.hz-dock');
    const dock = bar?.getBoundingClientRect();
    // The lowest painted TEXT that is not the composer must clear the bar.
    // Leaves only — a wrapper spans the whole page and would always "reach"
    // the bottom, which measures the layout rather than the words.
    const last = [...document.querySelectorAll('*')]
      .filter((e) => !e.children.length && e.textContent.trim() && !bar?.contains(e))
      .map((e) => e.getBoundingClientRect())
      .filter((r) => r.height > 0 && r.width > 0)
      .reduce((m, r) => Math.max(m, r.bottom), 0);
    return { dock: dock?.top ?? null, dockBottom: dock?.bottom ?? null, last, h: window.innerHeight };
  });
  say(
    foot.dock !== null && foot.last <= foot.dock + 1,
    `last content clears the bar (content ends ${Math.round(foot.last)}, bar starts ${Math.round(foot.dock ?? -1)})`,
  );
  say(
    foot.dockBottom !== null && Math.abs(foot.dockBottom - foot.h) < 40,
    `the bar rests at the page's true bottom (${Math.round(foot.dockBottom ?? -1)} of ${foot.h})`,
  );
  // (g) the Enso launcher (public/edit.js, a fixed 44px corner mark at
  // z-index 2147483000, in its own shadow root) must not land on the
  // composer's send button now that the bar is there the whole way down.
  const fab = await page.evaluate(() => {
    const box = (e) => {
      const r = e?.getBoundingClientRect();
      return r && r.width ? { x: r.x, y: r.y, w: r.width, h: r.height } : null;
    };
    const host = document.querySelector('[data-hanzo-edit]');
    return {
      mark: box(host?.shadowRoot?.querySelector('.fab')),
      send: box(document.querySelector('[aria-label="Start building"], [aria-label^="Build a"]')),
    };
  });
  const clash =
    fab.mark &&
    fab.send &&
    fab.mark.x < fab.send.x + fab.send.w &&
    fab.mark.x + fab.mark.w > fab.send.x &&
    fab.mark.y < fab.send.y + fab.send.h &&
    fab.mark.y + fab.mark.h > fab.send.y;
  say(!clash, `the Enso mark clears send (${fab.mark ? 'mark shown' : 'mark hidden here'})`);

  log('  shot:', await shot(page, `07-hero-${size}-bottom`));
  await page.evaluate(() => window.scrollTo(0, 0));

  const real = errs.filter((e) => !/favicon|analytics|\/v1\/event/.test(e));
  if (real.length) log('  page errors:', real.slice(0, 6));
  await c.close();
}

// Reduced motion gets the settled frame: no animation, and NO cycling.
{
  const c = await b.newContext({
    viewport: { width: 1280, height: 800 },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  });
  const page = await c.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await settle(page, 3000);
  await page.getByRole('button', { name: /^Build .+ →$/ }).scrollIntoViewIfNeeded();
  const before = await name(page);
  await settle(page, 20000);
  const after = await name(page);
  const ok = !!before && before === after;
  log(`\n=== reduced motion :: ${page.url()}`);
  log(`  ${ok ? 'ok  ' : 'FAIL'} settled and still (${before} → ${after})`);
  if (!ok) bad++;
  log('  shot:', await shot(page, '07-hero-reduced'));
  await c.close();
}

await b.close();
log(bad ? `\n${bad} FAILED` : '\nall green');
process.exit(bad ? 1 : 0);
