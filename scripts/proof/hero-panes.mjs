// The hero mock's two panes, measured: equal height, flush against one
// separator, one gutter — and every control in its chrome answers a pointer.
import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const BASE = process.env.PROOF_BASE || 'http://localhost:3210';
const OUT = process.env.PROOF_SHOTS || path.resolve(process.cwd(), 'test-results/proof');
const LABEL = process.argv[2] || 'after';
fs.mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ channel: 'chrome', headless: true });
const c = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: 'dark' });
const page = await c.newPage();
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);

let bad = 0;
const ok = (pass, msg) => { if (!pass) bad++; console.log(`${pass ? 'ok  ' : 'FAIL'}  ${msg}`); };

/* ── geometry ─────────────────────────────────────────────────────────────*/
const geo = await page.evaluate(() => {
  const label = [...document.querySelectorAll('*')].find((n) => n.children.length === 0 && n.textContent.trim() === 'Agent chat');
  const rail = label.parentElement.parentElement;
  const row = rail.parentElement;
  const sep = rail.nextElementSibling;
  const previews = sep.nextElementSibling;
  const box = (e) => { const r = e.getBoundingClientRect(); return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), right: +r.right.toFixed(1), bottom: +r.bottom.toFixed(1) }; };
  return {
    row: box(row), rowPad: getComputedStyle(row).padding,
    rail: box(rail), railBorderRight: getComputedStyle(rail).borderRightWidth,
    railHead: box(label.parentElement), railFoot: box(rail.lastElementChild),
    sep: box(sep), sepRole: sep.getAttribute('role'), sepCursor: getComputedStyle(sep).cursor,
    frame: box(previews.firstElementChild), previewsPad: getComputedStyle(previews).padding,
  };
});
console.log(JSON.stringify(geo, null, 1));

ok(geo.rail.h === geo.frame.h, `panes are the same height (rail ${geo.rail.h} · preview ${geo.frame.h})`);
ok(geo.rail.y === geo.frame.y, `panes start on one line (y ${geo.rail.y} / ${geo.frame.y})`);
ok(geo.rail.bottom === geo.frame.bottom, `panes end on one line (y ${geo.rail.bottom} / ${geo.frame.bottom})`);
ok(geo.railHead.y === geo.frame.y && geo.railFoot.bottom === geo.frame.bottom, 'rail CONTENT spans exactly the preview card');
ok(geo.frame.x - geo.rail.right === 10, `the only thing between the panes is the 10px handle (${geo.frame.x - geo.rail.right}px)`);
ok(geo.sep.x === geo.rail.right && geo.sep.right === geo.frame.x, 'the handle fills that gap edge to edge');
ok(geo.railBorderRight === '0px', 'the hard border seam is gone');
ok(geo.previewsPad === '0px' && geo.rowPad === '12px', `ONE gutter, declared on the row (${geo.rowPad})`);
const g = { l: geo.rail.x - geo.row.x, t: geo.rail.y - geo.row.y, r: geo.row.right - geo.frame.right, b: geo.row.bottom - geo.frame.bottom };
ok(g.l === 12 && g.t === 12 && g.r === 12 && g.b === 12, `the gutter is even on all four sides ${JSON.stringify(g)}`);
ok(geo.sepRole === 'separator' && geo.sepCursor === 'col-resize', `the handle reads as one (role=${geo.sepRole}, cursor=${geo.sepCursor})`);

/* ── hover ────────────────────────────────────────────────────────────────*/
const paint = (el) => { const s = getComputedStyle(el); return s.backgroundColor + ' / ' + s.color; };

// The demo re-renders on a timer, so a single sample can read a node React
// replaced between the hover and the read — the mouse has not moved, so the
// fresh node is not :hover yet. Nudge and re-read until it settles.
async function hovers(name, locator, target) {
  const el = target ?? locator;
  await page.mouse.move(0, 0);
  await page.waitForTimeout(120);
  const rest = await el.evaluate(paint);
  let over = rest;
  for (let i = 0; i < 12 && over === rest; i++) {
    const b = await locator.boundingBox();
    await page.mouse.move(b.x + b.width / 2 + (i % 2 ? 0.5 : -0.5), b.y + b.height / 2);
    await page.waitForTimeout(140);
    over = await el.evaluate(paint);
  }
  ok(rest !== over, `${name.padEnd(22)} ${rest}  →  ${over}`);
}

console.log('\n— hover —');
const frame = page.locator('.idm');
await frame.scrollIntoViewIfNeeded();
await page.waitForTimeout(1200);

const sep = frame.locator('[role="separator"]');
const tabs = frame.getByText('Preview', { exact: true }).locator('../..');
await hovers('resize handle', sep, sep.locator('> *').first());
await hovers('Preview tab (active)', tabs.locator('> *').nth(0));
await hovers('Files tab (bare)', tabs.locator('> *').nth(1));
await hovers('Code tab (bare)', tabs.locator('> *').nth(2));
await hovers('replay', frame.getByRole('button', { name: 'Replay the demo build' }));
await hovers('history', frame.locator('[class*="_cur-pointer"]').filter({ hasNot: page.locator('svg + *') }).nth(1));
await hovers('Share', frame.getByText('Share', { exact: true }).locator('..'));
await hovers('Publish', frame.getByText(/^(Publish|Publishing|Published)$/).locator('..'));
await hovers('Build … →', page.getByRole('button', { name: /^Build .+ →$/ }));

/* ── the device toggle is desktop chrome BELOW $lg (1024) ─────────────────*/
await page.setViewportSize({ width: 900, height: 900 });
await page.waitForTimeout(1000);
await hovers('device: desktop', frame.getByRole('button', { name: 'Desktop preview' }));
await hovers('device: mobile', frame.getByRole('button', { name: 'Mobile preview' }));
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(1000);

/* ── pictures ─────────────────────────────────────────────────────────────*/
await page.mouse.move(0, 0);
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(OUT, `hero-panes-${LABEL}-page.png`) });
await frame.screenshot({ path: path.join(OUT, `hero-panes-${LABEL}-mock.png`) });
await sep.hover();
await page.waitForTimeout(300);
await frame.screenshot({ path: path.join(OUT, `hero-panes-${LABEL}-handle-hover.png`) });

console.log(`\n${bad ? `${bad} FAILED` : 'all checks passed'} — shots in ${OUT}`);
await b.close();
process.exit(bad ? 1 : 0);
