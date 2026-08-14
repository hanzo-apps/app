import type { ProjectTemplate } from '../project-templates';

/**
 * Team Vibe Check — a realtime demo that PROVES the Hanzo Base realtime path.
 *
 * One-tap voting writes to the org-scoped `votes` collection through the
 * builder-origin proxy (/v1/base, with /api/base kept only as the legacy alias),
 * and a live results bar updates for every viewer over the Base realtime SSE
 * subscription — no polling, no refresh. Plain fetch + EventSource (no React
 * SDK) so it runs verbatim in the static runtime and on the deployed site.
 *
 * The `votes` collection is provisioned from the databaseSchema in
 * registry.ts (id: 'vibe-check'). Single self-contained file: the Hanzo design sheet + JS.
 */

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Team Vibe Check · Hanzo Base</title>
  <link rel="stylesheet" href="https://hanzo.app/vendor/design/styles.css"/>
  <style>
    /* The sheet above brings the ground, the ink, Geist and the controls. What
       is left is this page's own layout, written against its tokens. */
    body { -webkit-tap-highlight-color: transparent; }
    .page { display: flex; flex-direction: column; min-height: 100dvh;
            max-width: 42rem; margin-inline: auto; padding: var(--space-6) var(--gutter); }

    header { display: flex; align-items: center; justify-content: space-between; }
    .mark { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); }
    .glyph { display: inline-flex; align-items: center; justify-content: center;
             width: 24px; height: 24px; border-radius: var(--radius-sm);
             background: var(--primary); color: var(--primary-foreground); font-weight: var(--weight-bold); }
    .dim { color: var(--text-tertiary); }
    .status { display: flex; align-items: center; gap: var(--space-2);
              border: 1px solid var(--border); border-radius: var(--radius-full);
              padding: var(--space-1) var(--space-3); font-size: var(--text-xs); }
    #statusDot { width: 8px; height: 8px; border-radius: var(--radius-full); background: var(--text-tertiary); }
    #statusDot.pulse { animation: hanzo-pulse-dot 1.6s ease-in-out infinite; }
    #statusDot.live { background: var(--state-online); }

    main { display: flex; flex: 1; flex-direction: column; justify-content: center; padding-block: var(--space-8); }
    .eyebrow { font-size: var(--text-xs); font-weight: var(--weight-semibold);
               letter-spacing: var(--tracking-widest); text-transform: uppercase; color: var(--text-tertiary); }
    h1 { margin-top: var(--space-2); font-size: var(--text-3xl);
         font-weight: var(--weight-semibold); letter-spacing: var(--tracking-tight); }
    .lead { margin-top: var(--space-2); color: var(--text-secondary); }
    @media (min-width: 640px) { h1 { font-size: var(--text-4xl); } }

    #notice { margin-top: var(--space-5); border: 1px solid var(--border);
              border-radius: var(--radius-lg); padding: var(--space-3) var(--space-4);
              font-size: var(--text-sm); color: var(--text-secondary); }
    #notice.signin { border-color: var(--state-error); color: var(--state-error-text); }
    [hidden] { display: none !important; }

    #vibes { display: grid; grid-template-columns: repeat(5, 1fr);
             gap: var(--space-2); margin-top: var(--space-6); }
    .vibe { display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
            border: 1px solid var(--border); border-radius: var(--radius-lg);
            background: var(--surface-1); padding: var(--space-3) var(--space-2); cursor: pointer; }
    .vibe:hover:not(:disabled) { background: var(--surface-2); border-color: var(--border-strong); }
    .vibe:disabled { opacity: .4; cursor: not-allowed; }
    .vibe[aria-pressed="true"] { border-color: var(--foreground); background: var(--surface-3); }
    .vibe .emoji { font-size: var(--text-2xl); line-height: var(--leading-none); }
    .vibe .name { font-size: var(--text-xs); font-weight: var(--weight-medium); color: var(--text-tertiary); }
    .vibe:hover .name, .vibe[aria-pressed="true"] .name { color: var(--foreground); }
    .vibe.pop { animation: pop .28s var(--ease-out); }
    @keyframes pop { 0% { transform: scale(.9) } 60% { transform: scale(1.06) } 100% { transform: scale(1) } }

    .results { margin-top: var(--space-8); border: 1px solid var(--border);
               border-radius: var(--radius-xl); background: var(--surface-card); padding: var(--space-5); }
    .results-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: var(--space-4); }
    .results h2 { font-size: var(--text-xs); font-weight: var(--weight-semibold);
                  letter-spacing: var(--tracking-widest); text-transform: uppercase; color: var(--text-tertiary); }
    .tally { font-family: var(--font-mono); font-size: var(--text-sm); color: var(--text-tertiary); }
    .tally #total { color: var(--foreground); }
    #bars { display: flex; flex-direction: column; gap: var(--space-3); }
    .bar { display: grid; grid-template-columns: 5.5rem 1fr 3.5rem; align-items: center; gap: var(--space-3); }
    @media (min-width: 640px) { .bar { grid-template-columns: 8rem 1fr 4rem; } }
    .bar .who { display: flex; align-items: center; gap: var(--space-2);
                font-size: var(--text-sm); color: var(--text-secondary); }
    .track { height: 10px; overflow: hidden; border-radius: var(--radius-full); background: var(--white-06); }
    /* Rank reads as OPACITY — the ink ladder is the palette. A five-colour
       sentiment spectrum would be decoration, which this system does not spend
       colour on; the emoji already carry the mood. */
    .fill { height: 100%; border-radius: var(--radius-full); background: var(--foreground);
            width: 0%; transition: width var(--duration-slow) var(--ease-out); }
    .bar .num { text-align: right; font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-tertiary); }
    .bar .count { color: var(--text-primary); }
    #empty { padding-block: var(--space-6); text-align: center;
             font-size: var(--text-sm); color: var(--text-tertiary); }

    footer { border-top: 1px solid var(--border); padding-top: var(--space-5);
             font-size: var(--text-xs); line-height: var(--leading-relaxed); color: var(--text-tertiary); }
    footer code { border-radius: var(--radius-sm); background: var(--white-08);
                  padding: 1px var(--space-1); color: var(--text-secondary); }

    #toast { position: fixed; inset-inline: 0; bottom: var(--space-6); display: flex; justify-content: center;
             opacity: 0; pointer-events: none; transition: opacity var(--duration-base) var(--ease-out); }
    #toast.on { opacity: 1; }
    #toast div { display: flex; align-items: center; gap: var(--space-2);
                 border: 1px solid var(--border); border-radius: var(--radius-full);
                 background: var(--surface-overlay); box-shadow: var(--shadow-floating);
                 padding: var(--space-2) var(--space-4); font-size: var(--text-sm); }
    #toast .dot { width: 6px; height: 6px; border-radius: var(--radius-full); background: var(--state-online); }
  </style>
</head>
<body>
  <div class="page">

    <header>
      <div class="mark">
        <span class="glyph">H</span>
        <span style="font-weight:var(--weight-medium);letter-spacing:var(--tracking-tight)">Hanzo Base</span>
        <span class="dim">·</span>
        <span class="dim">realtime</span>
      </div>
      <div class="status">
        <span id="statusDot" class="pulse"></span>
        <span id="statusText" class="dim">Connecting…</span>
      </div>
    </header>

    <main>
      <div class="eyebrow">Team vibe check</div>
      <h1>How's the team feeling today?</h1>
      <p class="lead">One tap. Everyone on your team sees it update live — no refresh.</p>

      <div id="notice" hidden></div>

      <div id="vibes"></div>

      <section class="results">
        <div class="results-head">
          <h2>Live results</h2>
          <div class="tally"><span id="total">0</span> votes</div>
        </div>
        <div id="bars"></div>
        <div id="empty">No check-ins yet — be the first.</div>
      </section>
    </main>

    <footer>
      Each tap writes to the org-scoped <code>votes</code>
      collection in Hanzo Base through <code>/v1/base</code>,
      and every change streams back over the Base realtime SSE subscription. Open this in two windows to watch them sync.
    </footer>
  </div>

  <div id="toast">
    <div><span class="dot"></span><span id="toastText"></span></div>
  </div>

  <script>
  (function () {
    'use strict';

    // ── The five vibes (value → label, emoji, mood colour) ──────────────────
    // Rank is drawn as OPACITY, not as hue — the design system's ladder. The
    // emoji carry the mood; the bar carries the count.
    const VIBES = [
      { key: 'fired', label: 'Fired up',  emoji: '🔥', ink: 'var(--white-80)' },
      { key: 'good',  label: 'Good',      emoji: '😄', ink: 'var(--white-60)' },
      { key: 'meh',   label: 'Meh',       emoji: '😐', ink: 'var(--white-40)' },
      { key: 'rough', label: 'Rough',     emoji: '😕', ink: 'var(--white-30)' },
      { key: 'spent', label: 'Burnt out', emoji: '😴', ink: 'var(--white-20)' },
    ];
    const LABEL = Object.fromEntries(VIBES.map(v => [v.key, v.label]));
    const COLLECTION = 'votes';

    // The builder-origin proxy prefix. There is one: /v1/base. resolveBase()
    // no longer chooses between prefixes — it only confirms the route is mounted.
    const BASE = '/v1/base';

    // ── Local identity: one stable voter id per browser, so a person has one
    //    current vote that they can change (PATCH), not a pile of duplicates. ──
    function uid() {
      try { return crypto.randomUUID(); } catch (_) {}
      return 'v-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    }
    function get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
    function set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
    function del(k) { try { localStorage.removeItem(k); } catch (_) {} }

    let voterId = get('vibe.voter');
    if (!voterId) { voterId = uid(); set('vibe.voter', voterId); }
    let myRecordId = get('vibe.record') || null;
    let myChoice = get('vibe.choice') || null;
    let authed = true;

    // ── State: records keyed by id → reconciles create/update/delete from
    //    anyone (including our own optimistic write) idempotently. ────────────
    const records = new Map(); // id → { choice, voter }

    // ── DOM refs ────────────────────────────────────────────────────────────
    const el = (id) => document.getElementById(id);
    const vibesEl = el('vibes'), barsEl = el('bars'), emptyEl = el('empty');
    const totalEl = el('total'), noticeEl = el('notice');
    const statusDot = el('statusDot'), statusText = el('statusText');
    const toastEl = el('toast'), toastText = el('toastText');

    // Build the vote buttons and result bars once; render() only mutates them
    // afterwards so the width transitions animate instead of snapping.
    for (const v of VIBES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.key = v.key;
      btn.setAttribute('aria-label', 'Vote ' + v.label);
      btn.setAttribute('aria-pressed', 'false');
      btn.className = 'vibe';
      btn.innerHTML =
        '<span class="emoji">' + v.emoji + '</span>' +
        '<span class="name">' + v.label + '</span>';
      btn.addEventListener('click', () => vote(v.key));
      v.btn = btn;
      vibesEl.appendChild(btn);

      const row = document.createElement('div');
      row.className = 'bar';
      row.innerHTML =
        '<div class="who"><span>' + v.emoji + '</span><span>' + v.label + '</span></div>' +
        '<div class="track"><div class="fill" style="background:' + v.ink + '"></div></div>' +
        '<div class="num"><span class="count">0</span></div>';
      v.fill = row.querySelector('.fill');
      v.count = row.querySelector('.count');
      barsEl.appendChild(row);
    }

    // ── Render: tally the map, update totals / bars / my highlighted pick ─────
    function render() {
      const counts = {}; for (const v of VIBES) counts[v.key] = 0;
      for (const r of records.values()) if (counts[r.choice] !== undefined) counts[r.choice]++;
      const total = records.size;

      totalEl.textContent = total;
      emptyEl.hidden = total > 0;
      barsEl.hidden = total === 0;

      for (const v of VIBES) {
        const c = counts[v.key];
        const pct = total ? Math.round((c / total) * 100) : 0;
        v.fill.style.width = pct + '%';
        v.count.textContent = c;
        // Highlight the option this browser currently holds. aria-pressed is
        // both the state a screen reader announces and the CSS hook, so the two
        // cannot disagree.
        v.btn.setAttribute('aria-pressed', String(myChoice === v.key));
      }
    }

    // ── HTTP helper: throws { status } on non-2xx so callers can branch ──────
    async function api(method, path, body) {
      const res = await fetch(BASE + path, {
        method,
        headers: Object.assign({ accept: 'application/json' }, body ? { 'content-type': 'application/json' } : {}),
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) { const e = new Error('http ' + res.status); e.status = res.status; throw e; }
      return res.status === 204 ? null : res.json();
    }
    const recsPath = () => '/collections/' + COLLECTION + '/records';
    const recPath = (id) => recsPath() + '/' + encodeURIComponent(id);

    // ── Voting: optimistic, one current vote per browser (create then patch) ─
    async function vote(choice) {
      if (!authed) { flashNotice('signin'); return; }
      if (choice === myChoice) return;

      const prevChoice = myChoice, prevRecord = myRecordId;
      myChoice = choice; set('vibe.choice', choice);
      if (myRecordId) records.set(myRecordId, { choice, voter: voterId });
      render();
      VIBES.find(v => v.key === choice).btn.classList.remove('pop');
      void VIBES.find(v => v.key === choice).btn.offsetWidth;
      VIBES.find(v => v.key === choice).btn.classList.add('pop');

      try {
        await persist(choice);
        render();
      } catch (e) {
        myChoice = prevChoice; myRecordId = prevRecord; // roll back
        if (prevChoice) set('vibe.choice', prevChoice); else del('vibe.choice');
        if (e.status === 401) setAuth(false);
        render();
      }
    }

    async function persist(choice) {
      if (myRecordId) {
        try { await api('PATCH', recPath(myRecordId), { choice, voter: voterId }); return; }
        catch (e) { if (e.status !== 404) throw e; myRecordId = null; del('vibe.record'); } // record vanished → recreate
      }
      const rec = await api('POST', recsPath(), { choice, voter: voterId });
      myRecordId = rec.id; set('vibe.record', rec.id);
      records.set(rec.id, { choice, voter: voterId });
    }

    // ── Initial load ────────────────────────────────────────────────────────
    async function load() {
      let data;
      try {
        data = await api('GET', recsPath() + '?perPage=500&sort=created');
      } catch (e) {
        if (e.status === 401) { setAuth(false); return; }
        setStatus('offline', 'Backend unreachable'); return;
      }
      setAuth(true);
      records.clear();
      for (const rec of (data.items || [])) {
        records.set(rec.id, { choice: rec.choice, voter: rec.voter });
        if (rec.voter === voterId) { myRecordId = rec.id; myChoice = rec.choice; } // recover my vote
      }
      if (myRecordId) set('vibe.record', myRecordId);
      if (myChoice) set('vibe.choice', myChoice);
      render();
    }

    // ── Realtime: EventSource SSE, exactly as the Hanzo Base client speaks it ─
    //   1. open EventSource(BASE + '/realtime')  (proxy authenticates via cookie)
    //   2. named CONNECT event carries our clientId
    //   3. POST { clientId, subscriptions:['votes/*'] } to register interest
    //   4. change events arrive on the default message channel as {action,record}
    //   EventSource auto-reconnects; each reconnect yields a fresh CONNECT, so we
    //   simply re-submit subscriptions there.
    let clientId = null, es = null;

    function connectRealtime() {
      setStatus('connecting', 'Connecting…');
      es = new EventSource(BASE + '/realtime');

      es.addEventListener('CONNECT', (ev) => {
        let d; try { d = JSON.parse(ev.data); } catch (_) { return; }
        clientId = d.clientId;
        setStatus('live', 'Live');
        submitSubscriptions();
      });

      es.onmessage = (ev) => {
        let p; try { p = JSON.parse(ev.data); } catch (_) { return; }
        const rec = p && p.record;
        if (!rec || !rec.id) return;
        if (rec.collectionName && rec.collectionName !== COLLECTION) return;

        if (p.action === 'delete') {
          records.delete(rec.id);
        } else {
          records.set(rec.id, { choice: rec.choice, voter: rec.voter });
        }
        render();
        if (rec.voter !== voterId && (p.action === 'create' || p.action === 'update')) {
          toast('A teammate voted ' + (LABEL[rec.choice] || rec.choice));
        }
      };

      es.onerror = () => {
        clientId = null;
        setStatus('offline', 'Reconnecting…'); // EventSource retries on its own
      };
    }

    async function submitSubscriptions() {
      if (!clientId) return;
      try {
        await fetch(BASE + '/realtime', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ clientId, subscriptions: [COLLECTION + '/*'] }),
        });
      } catch (_) {}
    }

    // ── Status pill + notices + toast ───────────────────────────────────────
    // connecting/signin pulse to say "waiting"; live is a steady --state-online
    // dot; offline is the resting ink. One class each, the sheet draws them.
    const DOT = { connecting: 'pulse', live: 'live', offline: '', signin: 'pulse' };
    function setStatus(kind, text) {
      statusDot.className = DOT[kind] || '';
      statusText.textContent = text;
      statusText.className = kind === 'live' ? '' : 'dim';
    }

    function setAuth(ok) {
      authed = ok;
      for (const v of VIBES) v.btn.disabled = !ok; // :disabled carries the look
      if (!ok) { setStatus('signin', 'Sign in'); flashNotice('signin'); }
      else { noticeEl.hidden = true; }
    }

    function flashNotice(kind) {
      noticeEl.className = kind === 'signin' ? 'signin' : '';
      noticeEl.textContent = kind === 'signin'
        ? 'Sign in with Hanzo to check in — your vote is scoped to your team.'
        : 'This backend has no Base data plane configured.';
      noticeEl.hidden = false;
    }

    let toastTimer = null;
    function toast(msg) {
      toastText.textContent = msg;
      toastEl.classList.add('on');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastEl.classList.remove('on'), 2200);
    }

    // ── Boot: pick the live proxy prefix, then load + connect ────────────────
    async function resolveBase() {
      try {
        const res = await fetch(BASE + '/collections/' + COLLECTION + '/records?perPage=1', { headers: { accept: 'application/json' } });
        // A JSON body (200 / 401 / 404-collection) means the proxy route is live.
        // An HTML 404 means it is not mounted on this deployment.
        return (res.headers.get('content-type') || '').includes('json');
      } catch (_) { return false; }
    }

    (async function boot() {
      render();
      const ok = await resolveBase();
      if (!ok) { setStatus('offline', 'No backend'); flashNotice('nobackend'); return; }
      await load();
      connectRealtime();
    })();
  })();
  </script>
</body>
</html>
`;

export const VIBE_CHECK_PROJECT_TEMPLATE: ProjectTemplate = {
  name: 'Team Vibe Check',
  description: 'Realtime team pulse — one-tap voting on Hanzo Base with a live SSE results bar.',
  directories: [],
  files: [{ path: '/index.html', content: INDEX_HTML }],
};
