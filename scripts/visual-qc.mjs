/*
 * visual-qc — render every live first-party URL at four viewports with a real
 * browser and grade what actually painted.
 *
 * WHY THIS EXISTS
 * HTTP 200 is not evidence a page works. A directory index, a blank hydration
 * failure, a hero that overflows 300px at 390w, and a fully-working app all
 * return 200. The only honest check is to paint the page at the widths users
 * actually have and measure the result. This is that check, and it is the ONLY
 * one — it replaces the one-off `probe.mjs` / `capture-ui.mjs` screenshot
 * scratch scripts, which each hardcoded a single URL at a single size.
 *
 * SHAPE
 *   enumerate() — targets come from the LIVE APIs, never a checked-in list, so
 *                 a demo that ships tomorrow is covered tomorrow:
 *                   GET /v1/catalog        (public, paginated) kind=site
 *                   GET /v1/sites          (X-Org-Id + bearer) status=live
 *                   GET hanzo.app/templates → every /templates/<slug> detail
 *                 plus SURFACES below: the first-party product/marketing hosts,
 *                 which are NOT in the catalog (the catalog indexes lux/zoo
 *                 repos but zero lux/zoo sites) and so must be declared.
 *   render()    — measurement only. The in-page probe returns raw numbers and
 *                 never decides anything.
 *   grade()     — policy only. One place to argue about what counts as broken.
 *
 * WHITE-LABEL IS A CORRECTNESS RULE
 * A Lux or Zoo surface showing Hanzo branding is a defect, not a nit. But a
 * brand named in PROSE ("open source across Hanzo, Lux and Zoo") is editorial
 * and fine. Only the page CHROME — <title>, favicon, og:site_name, header logo,
 * footer copyright — asserts identity, so only chrome is graded.
 *
 * OPERATIONAL NOTE
 * A sweep this long WILL lose a browser process; the first run of this tool
 * died at 62s and reported 248 healthy sites as failures because they queued
 * behind a dead browser. Hence: one browser per worker, recycled every RECYCLE
 * targets, relaunched on crash, one retry per target. A crashed browser must
 * never be recorded as a broken site.
 *
 *   node scripts/visual-qc.mjs --out ./qc --conc 6
 *   node scripts/visual-qc.mjs --only lux-surface,zoo-surface   # one group
 *   node scripts/visual-qc.mjs --targets t.json                 # skip discovery
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// ---------------------------------------------------------------- config ---
const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf('--' + k);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const OUT = path.resolve(arg('out', './qc'));
const CONC = Number(arg('conc', process.env.QC_CONC || 6));
const RECYCLE = Number(arg('recycle', 12));
const API = arg('api', 'https://api.hanzo.ai');
const ORG = arg('org', 'hanzo');
const ONLY = (arg('only', '') || '').split(',').filter(Boolean);
const TOKEN = process.env.HANZO_TOKEN ||
  (fs.existsSync(arg('token-file', '')) ? fs.readFileSync(arg('token-file'), 'utf8').trim() : '');

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  laptop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};
// isMobile/hasTouch are fixed at context creation but width is not, so two
// contexts cover all four sizes instead of four.
const LANES = [
  { mobile: false, vps: ['desktop', 'laptop'] },
  { mobile: true, vps: ['tablet', 'mobile'] },
];

// First-party web surfaces, by owning org. Org drives the white-label rule.
const SURFACES = {
  hanzo: ['hanzo.app', 'gallery.hanzo.ai', 'docs.hanzo.ai', 'console.hanzo.ai',
          'cms.hanzo.ai', 'studio.hanzo.ai', 'world.hanzo.ai', 'admin.hanzo.ai',
          'cd.hanzo.ai', 'karma.style', 'hanzo.id'],
  lux: ['lux.network', 'blog.lux.network', 'papers.lux.network',
        'lux.audio', 'lux.credit', 'lux.fund'],
  zoo: ['zoo.ngo', 'zoo.network'],
};
const ORG_BRAND = { hanzo: 'hanzo', lux: 'lux', zoo: 'zoo' };
const NARROW = new Set(['tablet', 'mobile']);
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex').slice(0, 16);

// Per-host pacing. hanzo.app enforces 200 requests per ~20s window per IP
// (X-Ratelimit-Limit: 200, Retry-After: 20) and one Next.js page pulls ~50
// subresources, so an unthrottled 5-way sweep spends its budget in seconds and
// then screenshots the limiter's error page. Measured that way, all 106
// /templates/<slug> pages look "broken" AND byte-identical to each other --
// entirely an artifact of the crawler. A QC tool must never report its own
// rate limit as a site defect, so: cap concurrent work per host, and treat a
// 429 as backpressure to obey rather than a result to record.
const HOST_CONC = Number(arg('host-conc', 2));
const gates = new Map();
function hostGate(url) {
  const h = new URL(url).host;
  if (!gates.has(h)) gates.set(h, { n: 0, q: [] });
  const g = gates.get(h);
  return {
    async acquire() {
      if (g.n < HOST_CONC) { g.n++; return; }
      await new Promise((r) => g.q.push(r));   // resumed already holding the slot
    },
    release() {
      const next = g.q.shift();
      if (next) next(); else g.n--;
    },
  };
}

// ------------------------------------------------------------- enumerate ---
async function enumerate() {
  const targets = [], seen = new Set();
  const add = (slug, url, group, org = 'hanzo') => {
    if (seen.has(url)) return;
    seen.add(url);
    targets.push({ slug: slug.replace(/[^a-zA-Z0-9._-]/g, '_'), url, group, org });
  };
  const j = async (url, headers) => {
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`${url} -> ${r.status}`);
    return r.json();
  };

  // catalog: paginated, public
  let off = 0, cat = [];
  for (;;) {
    const d = await j(`${API}/v1/catalog?limit=200&offset=${off}`);
    cat.push(...d.data);
    if (cat.length >= d.total || !d.data.length) break;
    off += 200;
  }
  for (const r of cat) if (r.kind === 'site' && r.url) add(r.name, r.url, 'site-demo', r.org || 'hanzo');

  // /v1/sites: org-scoped, authed. Superset of the catalog in practice.
  if (TOKEN) {
    const sites = await j(`${API}/v1/sites`, { 'X-Org-Id': ORG, Authorization: 'Bearer ' + TOKEN });
    for (const s of sites) if (s.status === 'live' && s.url) add(s.slug, s.url, 'site-demo');
  }

  // hanzo.app core pages + every template detail page it links
  for (const p of ['', '/catalog', '/templates', '/gallery']) {
    add('hanzo.app' + p.replace(/\//g, '_'), 'https://hanzo.app' + p, 'hanzo.app');
  }
  const html = await (await fetch('https://hanzo.app/templates')).text();
  const slugs = [...new Set([...html.matchAll(/\/templates\/([a-z0-9][a-z0-9-]{1,60})/g)].map((m) => m[1]))].sort();
  for (const s of slugs) add('tpl_' + s, `https://hanzo.app/templates/${s}`, 'template-detail');

  for (const [org, hosts] of Object.entries(SURFACES)) {
    for (const h of hosts) add(h, 'https://' + h, org + '-surface', org);
  }
  const keep = ONLY.length ? targets.filter((t) => ONLY.includes(t.group)) : targets;
  console.error(`enumerated: catalog=${cat.length} sites=${cat.filter((r) => r.kind === 'site').length} ` +
    `templateSlugs=${slugs.length} targets=${keep.length} renders=${keep.length * 4}`);
  return keep;
}

// ----------------------------------------------------------------- probe ---
// Runs in the page. Returns raw measurements only — no verdicts.
const PROBE = () => {
  const R = {}, de = document.documentElement;
  R.title = (document.title || '').slice(0, 200);
  const text = (document.body ? document.body.innerText || '' : '').replace(/\s+/g, ' ').trim();
  R.textLen = text.length;
  R.html = document.body ? document.body.innerHTML.length : 0;
  R.vw = window.innerWidth;
  R.scrollW = Math.max(de.scrollWidth, document.body ? document.body.scrollWidth : 0);
  R.overflowPx = R.scrollW - R.vw;

  R.overflowers = [];
  if (R.overflowPx > 1) {
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (r.right > R.vw + 1 || r.left < -1) {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' && cs.visibility === 'hidden') continue;
        R.overflowers.push({ sel: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
          (typeof el.className === 'string' && el.className.trim()
            ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''),
          right: Math.round(r.right) });
        if (R.overflowers.length >= 6) break;
      }
    }
  }

  R.brokenImgs = [];
  for (const im of document.images) {
    if (im.naturalWidth === 0 && (im.currentSrc || im.src)) {
      const r = im.getBoundingClientRect();
      if (!r.width && !r.height) continue;           // hidden / lazy placeholder
      R.brokenImgs.push((im.currentSrc || im.src).slice(0, 160));
      if (R.brokenImgs.length >= 8) break;
    }
  }
  R.imgCount = document.images.length;

  const t = R.title.toLowerCase(), head = text.slice(0, 400).toLowerCase();
  R.dirIndex = /^index of \//.test(t) || /^directory listing/.test(t) ||
    (/index of \//.test(head) && !!document.querySelector('pre'));
  R.rawFile = !!(document.body && document.querySelector('body > pre') && document.body.children.length === 1);

  // Ink: elements that actually put something on screen above the fold.
  let ink = 0, seen = 0;
  const walk = document.createTreeWalker(document.body || de, NodeFilter.SHOW_ELEMENT);
  for (let n; (n = walk.nextNode()) && seen < 3000;) {
    seen++;
    const r = n.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.top > window.innerHeight || r.bottom < 0) continue;
    const cs = getComputedStyle(n);
    if (cs.visibility === 'hidden' || cs.opacity === '0' || cs.display === 'none') continue;
    const hasText = [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
    const hasBg = cs.backgroundImage !== 'none' ||
      (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent');
    if (hasText || hasBg || ['IMG', 'CANVAS', 'SVG', 'VIDEO'].includes(n.tagName)) ink++;
  }
  R.ink = ink;

  // Canvas/WebGL apps (Flutter web, Godot, Unity, three.js games) paint no DOM
  // text and no <img>, so the plain ink/text test calls a fully working game
  // "blank". Measure how much of the viewport a *visible* canvas covers; that
  // is the signal that separates "renders into a canvas" from "renders nothing"
  // -- a Flutter build that failed to boot never creates its canvas at all.
  R.canvasArea = 0;
  for (const c of document.querySelectorAll('canvas')) {
    const r = c.getBoundingClientRect();
    const cs = getComputedStyle(c);
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue;
    R.canvasArea = Math.max(R.canvasArea, (r.width * r.height) / (window.innerWidth * window.innerHeight));
  }

  // Clipped text: content wider/taller than its own clipping box. Deliberate
  // truncation (ellipsis, line-clamp) is design, not a defect.
  R.clipped = [];
  for (const el of document.querySelectorAll('h1,h2,h3,h4,p,a,span,button,li,td,th,label')) {
    if (![...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim().length > 1)) continue;
    const cs = getComputedStyle(el);
    if (!(cs.overflow === 'hidden' || cs.overflowX === 'hidden')) continue;
    if (cs.textOverflow === 'ellipsis') continue;
    if (cs.webkitLineClamp && cs.webkitLineClamp !== 'none') continue;
    // .sr-only / visually-hidden clip a full label into a 1x1 box on purpose.
    // That is accessibility working, not text being cut off.
    if (el.clientWidth <= 1 || el.clientHeight <= 1) continue;
    if (el.scrollWidth > el.clientWidth + 4 || el.scrollHeight > el.clientHeight + 4) {
      R.clipped.push({ sel: el.tagName.toLowerCase(), t: el.innerText.slice(0, 60),
        sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight });
      if (R.clipped.length >= 5) break;
    }
  }

  // Overlapping text: two in-flow text leaves sharing >35% of the smaller box.
  // Positioned elements are excluded — layering there is intentional.
  const leaves = [];
  for (const el of document.querySelectorAll('h1,h2,h3,p,a,span,button,li')) {
    if (![...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim().length > 2)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8 || r.top > window.innerHeight * 2) continue;
    const cs = getComputedStyle(el);
    if (cs.position === 'absolute' || cs.position === 'fixed') continue;
    leaves.push({ el, r });
    if (leaves.length >= 220) break;
  }
  R.overlaps = [];
  outer: for (let i = 0; i < leaves.length; i++) {
    for (let k = i + 1; k < leaves.length; k++) {
      const a = leaves[i], b = leaves[k];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const ix = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const iy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (ix <= 2 || iy <= 2) continue;
      const pct = (ix * iy) / Math.min(a.r.width * a.r.height, b.r.width * b.r.height);
      if (pct > 0.35) {
        R.overlaps.push({ a: a.el.innerText.slice(0, 40), b: b.el.innerText.slice(0, 40), pct: Math.round(pct * 100) });
        if (R.overlaps.length >= 4) break outer;
      }
    }
  }

  // Nav: on a narrow viewport it must collapse to a toggle, or fit.
  R.nav = null;
  const nav = document.querySelector('header nav, nav, header, [role=navigation]');
  if (nav) {
    const vis = (e) => {
      const q = e.getBoundingClientRect(), cs = getComputedStyle(e);
      return q.width > 0 && q.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
    };
    const links = [...nav.querySelectorAll('a,button')].filter(vis);
    const toggle = [...nav.querySelectorAll('button,[aria-label],[class*=burger],[class*=hamburger],[class*=menu-toggle],[class*=mobile-menu],svg')]
      .some((b) => {
        if (!vis(b)) return false;
        const q = b.getBoundingClientRect();
        const s = ((b.getAttribute('aria-label') || '') + ' ' +
          (typeof b.className === 'string' ? b.className : '')).toLowerCase();
        return /menu|burger|nav|toggle|open/.test(s) || (q.width < 64 && q.height < 64 && b.tagName === 'BUTTON');
      });
    let widest = 0;
    for (const a of links) widest = Math.max(widest, a.getBoundingClientRect().right);
    R.nav = { links: links.length, toggle, widest: Math.round(widest), overflows: widest > window.innerWidth + 1 };
  }

  // Fingerprint for byte-identical detection.
  const clone = document.body ? document.body.cloneNode(true) : document.createElement('div');
  clone.querySelectorAll('script,style,noscript').forEach((e) => e.remove());
  R.domSig = (clone.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 20000) + '|' +
    document.querySelectorAll('*').length;

  // Brand in CHROME only — the parts of a page that assert an identity.
  const bits = [];
  const cp = (where, s) => { if (s && String(s).trim()) bits.push({ where, s: String(s).slice(0, 180) }); };
  cp('title', document.title);
  document.querySelectorAll('link[rel*=icon],link[rel=apple-touch-icon],link[rel=manifest]')
    .forEach((e) => cp('favicon', e.getAttribute('href')));
  document.querySelectorAll('meta[property="og:site_name"],meta[name="application-name"],meta[name="apple-mobile-web-app-title"],meta[property="og:title"],meta[name="twitter:title"]')
    .forEach((e) => cp('meta:' + (e.getAttribute('property') || e.getAttribute('name')), e.content));
  const hdr = document.querySelector('header, [role=banner], nav');
  if (hdr) {
    hdr.querySelectorAll('img,svg,a').forEach((e) => {
      const q = e.getBoundingClientRect();
      if (!q.width || !q.height) return;
      if (e.tagName === 'IMG') cp('header-img', (e.alt || '') + ' ' + (e.currentSrc || e.src || ''));
      else if (e.tagName === 'A' && q.left < window.innerWidth * 0.45) cp('header-link', e.textContent);
      else if (e.tagName.toLowerCase() === 'svg') {
        cp('header-svg', ((e.querySelector('title') || {}).textContent || '') + ' ' + (e.getAttribute('aria-label') || ''));
      }
    });
  }
  const ftr = document.querySelector('footer, [role=contentinfo]');
  if (ftr) {
    const m = (ftr.innerText || '').match(/.{0,80}(?:©|copyright|all rights reserved).{0,80}/i);
    if (m) cp('footer-copyright', m[0].replace(/\s+/g, ' '));
  }
  R.chromeBrand = {}; R.chromeHits = [];
  for (const b of ['hanzo', 'lux', 'zoo']) {
    const hits = bits.filter((c) => new RegExp(b, 'i').test(c.s));
    R.chromeBrand[b] = hits.length;
    for (const h of hits.slice(0, 4)) {
      R.chromeHits.push({ b, w: h.where, s: h.s.replace(/\s+/g, ' ').trim().slice(0, 120) });
    }
  }
  R.chromeHits = R.chromeHits.slice(0, 12);
  return R;
};

// ---------------------------------------------------------------- render ---
const launch = () => chromium.launch({
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none',
         '--disable-gpu', '--hide-scrollbars'],
});

async function shoot(browser, t) {
  const rec = { slug: t.slug, url: t.url, group: t.group, org: t.org, viewports: {} };
  const dir = path.join(OUT, t.slug);
  fs.mkdirSync(dir, { recursive: true });

  for (const lane of LANES) {
    const first = VIEWPORTS[lane.vps[0]];
    const ctx = await browser.newContext({
      viewport: { width: first.width, height: first.height },
      deviceScaleFactor: 1,
      isMobile: lane.mobile,
      hasTouch: lane.mobile,
      userAgent: lane.mobile
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        : undefined,
      ignoreHTTPSErrors: true,
    });
    let cur = null;                       // bucket the listeners write into
    const page = await ctx.newPage();
    page.on('console', (m) => {
      if (cur && m.type() === 'error' && cur.consoleErrors.length < 10) cur.consoleErrors.push(m.text().slice(0, 240));
    });
    page.on('pageerror', (e) => { if (cur && cur.pageErrors.length < 6) cur.pageErrors.push(String(e.message).slice(0, 240)); });
    page.on('response', (r) => {
      if (cur && r.status() >= 400 && cur.netFail.length < 15) cur.netFail.push({ s: r.status(), u: r.url().slice(0, 180) });
    });
    page.on('requestfailed', (r) => {
      const e = r.failure()?.errorText || '';
      if (cur && !/ERR_ABORTED/.test(e) && cur.netFail.length < 15) cur.netFail.push({ s: 'FAIL', u: r.url().slice(0, 180), e });
    });

    for (const vp of lane.vps) {
      const cfg = VIEWPORTS[vp];
      const v = { consoleErrors: [], pageErrors: [], netFail: [], status: null };
      cur = v;
      const gate = hostGate(t.url);
      await gate.acquire();
      try {
        await page.setViewportSize(cfg);
        // Reload at each width: media queries, JS breakpoint logic and lazy
        // images must evaluate for that size. A resize alone tests stale layout.
        let resp;
        for (let tryN = 0; ; tryN++) {
          resp = await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 35000 });
          v.status = resp ? resp.status() : null;
          if (v.status !== 429 || tryN >= 2) break;
          // Back off exactly as long as the server asked, then discard the
          // noise the rejected load produced so it cannot pollute the verdict.
          const ra = Math.min(Number(resp.headers()['retry-after'] || 20) || 20, 30);
          v.rateLimitWaits = (v.rateLimitWaits || 0) + 1;
          await page.waitForTimeout(ra * 1000 + 500);
          v.netFail.length = 0; v.consoleErrors.length = 0; v.pageErrors.length = 0;
        }
        await page.waitForLoadState('networkidle', { timeout: 9000 }).catch(() => {});
        await page.waitForTimeout(1100);          // fonts / canvas / hydration
        const png = await page.screenshot({ path: path.join(dir, vp + '.png') });
        v.shotHash = sha(png);
        // Corroborating pixel evidence: a single flat colour compresses to a
        // floor (~8.5KB at 1920x1080). Cheap second opinion on "did it paint".
        v.shotBytes = png.length;
        const probe = await page.evaluate(PROBE);
        Object.assign(v, probe);
        v.domHash = sha(Buffer.from(probe.domSig, 'utf8'));
        delete v.domSig;
        v.ok = true;
      } catch (e) {
        v.ok = false;
        v.error = String(e.message).split('\n')[0].slice(0, 200);
      } finally {
        gate.release();
      }
      cur = null;
      rec.viewports[vp] = v;
    }
    await ctx.close().catch(() => {});
  }
  return rec;
}

// Under heavy machine load chromium.launch()/newContext()/close() can block
// past any internal timeout and wedge a worker forever -- observed: six workers
// silently stuck, zero output for minutes. Every browser-lifecycle call is
// therefore fenced by an explicit deadline, and each target has a hard cap.
const withTimeout = (p, ms, label) => Promise.race([
  p,
  new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms: ${label}`)), ms).unref()),
]);
const TARGET_MS = Number(arg('target-ms', 210000));

async function render(targets, jsonl) {
  const out = [];
  let i = 0, done = 0, relaunches = 0, retries = 0;
  const t0 = Date.now();
  await Promise.all(Array.from({ length: CONC }, async () => {
    let br = null, used = 0;
    const fresh = async () => {
      if (br) { withTimeout(br.close(), 15000, 'close').catch(() => {}); }   // never await a hung close
      br = await withTimeout(launch(), 90000, 'launch');
      used = 0; relaunches++;
    };
    await fresh();
    while (i < targets.length) {
      const t = targets[i++];
      let rec = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (!br || !br.isConnected() || used >= RECYCLE) await fresh();
          rec = await withTimeout(shoot(br, t), TARGET_MS, 'target ' + t.slug);
          used++;
        } catch (e) {
          const msg = String(e.message).slice(0, 200);
          try { await fresh(); } catch { br = null; }
          if (attempt === 0) { retries++; continue; }
          rec = { slug: t.slug, url: t.url, group: t.group, org: t.org, fatal: msg, viewports: {} };
        }
        const vs = Object.values(rec.viewports || {});
        const browserDied = vs.length && vs.every((v) => !v.ok && /browser has been closed|Target closed|crash/i.test(v.error || ''));
        if (browserDied && attempt === 0) { retries++; try { await fresh(); } catch { br = null; } continue; }
        break;
      }
      out.push(rec);
      // Append as we go: a crash or a kill costs only the in-flight target,
      // and --resume picks up exactly where this left off.
      fs.appendFileSync(jsonl, JSON.stringify(rec) + '\n');
      if (++done % 10 === 0) {
        const el = (Date.now() - t0) / 1000;
        process.stderr.write(`${done}/${targets.length} ${el.toFixed(0)}s eta ${((el / done) * (targets.length - done)).toFixed(0)}s relaunch=${relaunches} retry=${retries}\n`);
      }
    }
    if (br) withTimeout(br.close(), 15000, 'close').catch(() => {});
  }));
  console.error(`rendered ${out.length} targets in ${((Date.now() - t0) / 1000).toFixed(0)}s (relaunch=${relaunches} retry=${retries})`);
  return out;
}

// ----------------------------------------------------------------- grade ---
function grade(results) {
  const shotIx = new Map(), domIx = new Map();
  const bump = (m, k, slug) => { if (!m.has(k)) m.set(k, new Set()); m.get(k).add(slug); };
  for (const r of results) {
    for (const [vp, v] of Object.entries(r.viewports)) {
      if (v.shotHash) bump(shotIx, vp + '|' + v.shotHash, r.slug);
      if (v.domHash) bump(domIx, vp + '|' + v.domHash, r.slug);
    }
  }
  const rows = [], defects = [];
  const D = (r, vp, kind, detail) => defects.push({ slug: r.slug, url: r.url, org: r.org, viewport: vp, kind, detail });

  for (const r of results) {
    const vps = Object.values(r.viewports);
    if (r.fatal || (vps.length && vps.every((v) => !v.ok)) || !vps.length) {
      D(r, 'all', 'unreachable', r.fatal || vps.find((v) => v.error)?.error || 'no load');
      rows.push({ ...r, viewports: undefined, state: 'unreachable', kinds: ['unreachable'] });
      continue;
    }
    const kinds = new Set();
    for (const [vp, v] of Object.entries(r.viewports)) {
      if (!v.ok) { D(r, vp, 'render-error', v.error || '?'); kinds.add('render-error'); continue; }
      // A 429 that survived the backoff means the host throttles harder than
      // this sweep can pace. Report it as throttling, never as a page defect --
      // and stop here, because every other signal below was measured on the
      // limiter's error page, not on the real one.
      if (v.status === 429) {
        D(r, vp, 'rate-limited', `HTTP 429 after ${v.rateLimitWaits || 0} backoffs — page NOT measured`);
        kinds.add('rate-limited');
        continue;
      }
      if (v.status >= 400) { D(r, vp, 'http-error', 'HTTP ' + v.status); kinds.add('http-error'); }
      if (v.ink < 2 && v.textLen < 30 && v.imgCount === 0 && (v.canvasArea || 0) < 0.2) {
        D(r, vp, 'blank', `ink=${v.ink} text=${v.textLen} html=${v.html} canvas=${(v.canvasArea || 0).toFixed(2)} png=${v.shotBytes}B`);
        kinds.add('blank');
      }
      // A 200 that says "not found" is worse than a 404: no status check can
      // catch it, so it sits in the catalog looking live forever.
      if (v.status < 400 && /^(not found|404|page not found|site not found)$/i.test((v.title || '').trim())) {
        D(r, vp, 'soft-404', `HTTP ${v.status} but the page is titled "${v.title}"`);
        kinds.add('soft-404');
      }
      if (v.dirIndex) { D(r, vp, 'dir-index', v.title.slice(0, 80)); kinds.add('dir-index'); }
      else if (v.rawFile) { D(r, vp, 'raw-file', 'body is a single <pre>'); kinds.add('raw-file'); }
      if (NARROW.has(vp) && v.overflowPx > 8) {
        D(r, vp, 'h-overflow', `scrollW=${v.scrollW} vw=${v.vw} (+${v.overflowPx}px) ` +
          v.overflowers.slice(0, 3).map((o) => o.sel).join(','));
        kinds.add('h-overflow');
      }
      if (v.clipped?.length) {
        const c = v.clipped[0];
        D(r, vp, 'clipped-text', `${c.sel} ${c.sw}>${c.cw}w ${c.sh}>${c.ch}h :: ${c.t.slice(0, 40)}`);
        kinds.add('clipped-text');
      }
      if (v.overlaps?.length) {
        const o = v.overlaps[0];
        D(r, vp, 'overlap-text', `${o.pct}% '${o.a.slice(0, 28)}' x '${o.b.slice(0, 28)}'`);
        kinds.add('overlap-text');
      }
      if (v.nav && NARROW.has(vp)) {
        if (v.nav.overflows) { D(r, vp, 'nav-overflow', `widest link right=${v.nav.widest} > vw`); kinds.add('nav-overflow'); }
        else if (vp === 'mobile' && v.nav.links >= 6 && !v.nav.toggle) {
          D(r, vp, 'nav-no-collapse', `${v.nav.links} links visible, no toggle`); kinds.add('nav-no-collapse');
        }
      }
      if (v.brokenImgs?.length) {
        D(r, vp, 'broken-image', `${v.brokenImgs.length}x :: ` + v.brokenImgs.slice(0, 2).join('; '));
        kinds.add('broken-image');
      }
      const ce = [...(v.consoleErrors || []), ...(v.pageErrors || [])];
      if (ce.length) { D(r, vp, 'console-error', `${ce.length}x :: ` + ce[0].slice(0, 150)); kinds.add('console-error'); }
      const n404 = (v.netFail || []).filter((f) => f.s === 404);
      const nOther = (v.netFail || []).filter((f) => f.s !== 404);
      if (n404.length) { D(r, vp, 'net-404', `${n404.length}x :: ` + n404.slice(0, 2).map((f) => f.u).join('; ')); kinds.add('net-404'); }
      if (nOther.length) { D(r, vp, 'net-error', `${nOther.length}x :: ` + nOther.slice(0, 2).map((f) => f.s + ' ' + f.u).join('; ')); kinds.add('net-error'); }

      const own = ORG_BRAND[r.org];
      for (const [b, n] of Object.entries(v.chromeBrand || {})) {
        if (n && b !== own) {
          D(r, vp, 'brand-leak', `${b.toUpperCase()} branding on a ${String(r.org).toUpperCase()} surface :: ` +
            (v.chromeHits || []).filter((h) => h.b === b).slice(0, 3).map((h) => `${h.w}=${h.s.slice(0, 70)}`).join('; '));
          kinds.add('brand-leak');
        }
      }
      for (const [ix, kind, h] of [[shotIx, 'dup-screenshot', v.shotHash], [domIx, 'dup-dom', v.domHash]]) {
        const g = ix.get(vp + '|' + h);
        if (g && g.size > 1) {
          D(r, vp, kind, 'identical to: ' + [...g].filter((x) => x !== r.slug).join(', ').slice(0, 180));
          kinds.add(kind);
        }
      }
    }
    rows.push({ slug: r.slug, url: r.url, org: r.org, group: r.group,
      state: kinds.size ? 'defective' : 'clean', kinds: [...kinds].sort() });
  }

  const n = (s) => rows.filter((r) => r.state === s).length;
  const byKind = {};
  for (const d of defects) {
    byKind[d.kind] ??= { urls: new Set(), instances: 0 };
    byKind[d.kind].urls.add(d.slug);
    byKind[d.kind].instances++;
  }
  const counts = { total: rows.length, clean: n('clean'), defective: n('defective'),
    unreachable: n('unreachable'), renders: rows.length * 4, instances: defects.length };
  return { rows, defects, counts,
    byKind: Object.fromEntries(Object.entries(byKind)
      .sort((a, b) => b[1].instances - a[1].instances)
      .map(([k, x]) => [k, { urls: x.urls.size, instances: x.instances }])) };
}

// ------------------------------------------------------------------ main ---
const all = arg('targets')
  ? JSON.parse(fs.readFileSync(arg('targets'), 'utf8'))
  : await enumerate();
fs.mkdirSync(OUT, { recursive: true });

// Resume: results are appended per target, so a previous run's work is reusable
// verbatim. Without --resume the ledger is truncated and everything re-renders.
const JSONL = path.join(OUT, 'raw.jsonl');
const RESUME = argv.includes('--resume');
let prior = [];
if (RESUME && fs.existsSync(JSONL)) {
  prior = fs.readFileSync(JSONL, 'utf8').split('\n').filter(Boolean)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
} else {
  fs.writeFileSync(JSONL, '');
}
const doneSlugs = new Set(prior.map((r) => r.slug));
const todo = all.filter((t) => !doneSlugs.has(t.slug));
if (RESUME) console.error(`resume: ${doneSlugs.size} already done, ${todo.length} to render`);

const results = [...prior, ...await render(todo, JSONL)];
const report = grade(results);
fs.writeFileSync(arg('json', path.join(OUT, 'report.json')), JSON.stringify(report, null, 1));

const c = report.counts;
console.log(`\nTOTAL ${c.total}  CLEAN ${c.clean}  DEFECTIVE ${c.defective}  UNREACHABLE ${c.unreachable}`);
console.log(`renders ${c.renders}  defect instances ${c.instances}\n`);
console.log('DEFECT KIND            URLs  instances');
for (const [k, x] of Object.entries(report.byKind)) {
  console.log(`  ${k.padEnd(20)} ${String(x.urls).padStart(5)} ${String(x.instances).padStart(10)}`);
}
const g = {};
for (const r of report.rows) (g[r.group] ??= { clean: 0, defective: 0, unreachable: 0 })[r.state]++;
console.log('\nBY GROUP');
for (const [k, v] of Object.entries(g).sort()) {
  console.log(`  ${k.padEnd(18)} total ${String(v.clean + v.defective + v.unreachable).padStart(4)}  ` +
    `clean ${String(v.clean).padStart(4)}  defective ${String(v.defective).padStart(4)}  unreachable ${String(v.unreachable).padStart(3)}`);
}
process.exitCode = c.unreachable > 0 ? 1 : 0;
