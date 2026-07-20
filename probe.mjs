import { chromium } from 'playwright';
const OUT = process.env.OUT;
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const r = await p.goto('https://hanzo.app', { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForTimeout(1500);
await p.screenshot({ path: OUT + '/hanzo-app.png' });
console.log('STATUS', r.status(), '| TITLE', await p.title(), '| URL', p.url());
await b.close();
