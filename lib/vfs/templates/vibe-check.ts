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
 * registry.ts (id: 'vibe-check'). Single self-contained file: Tailwind CDN + JS.
 */

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Team Vibe Check · Hanzo Base</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    // Guarded so a slow/blocked CDN never throws — the app logic is CDN-independent.
    if (window.tailwind) tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Inter', 'sans-serif'],
            mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Geist Mono', 'monospace'],
          },
        },
      },
    };
  </script>
  <style>
    @keyframes livepulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.82); } }
    .live-dot { animation: livepulse 1.6s ease-in-out infinite; }
    @keyframes pop { 0% { transform: scale(.9); } 60% { transform: scale(1.06); } 100% { transform: scale(1); } }
    .pop { animation: pop .28s ease-out; }
    body { -webkit-tap-highlight-color: transparent; }
  </style>
</head>
<body class="min-h-screen bg-black font-sans text-white antialiased selection:bg-white/20">
  <div class="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-7">

    <!-- Top bar -->
    <header class="flex items-center justify-between">
      <div class="flex items-center gap-2 text-sm">
        <span class="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white font-bold text-black">H</span>
        <span class="font-medium tracking-tight">Hanzo Base</span>
        <span class="text-white/25">·</span>
        <span class="text-white/45">realtime</span>
      </div>
      <div class="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs">
        <span id="statusDot" class="h-2 w-2 rounded-full bg-amber-400 live-dot"></span>
        <span id="statusText" class="text-white/70">Connecting…</span>
      </div>
    </header>

    <!-- Hero -->
    <main class="flex flex-1 flex-col justify-center py-9">
      <div class="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Team vibe check</div>
      <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">How's the team feeling today?</h1>
      <p class="mt-2 text-white/50">One tap. Everyone on your team sees it update live — no refresh.</p>

      <!-- Notice banner (auth / backend states) -->
      <div id="notice" class="mt-5 hidden rounded-xl border px-4 py-3 text-sm"></div>

      <!-- Vote buttons -->
      <div id="vibes" class="mt-7 grid grid-cols-5 gap-2 sm:gap-3"></div>

      <!-- Results -->
      <section class="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div class="mb-4 flex items-baseline justify-between">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-white/45">Live results</h2>
          <div class="font-mono text-sm text-white/50"><span id="total" class="text-white">0</span> votes</div>
        </div>
        <div id="bars" class="space-y-3"></div>
        <div id="empty" class="py-6 text-center text-sm text-white/30">No check-ins yet — be the first.</div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="border-t border-white/[0.06] pt-5 text-xs leading-relaxed text-white/35">
      Each tap writes to the org-scoped <code class="rounded bg-white/10 px-1 py-0.5 font-mono text-white/60">votes</code>
      collection in Hanzo Base through <code class="rounded bg-white/10 px-1 py-0.5 font-mono text-white/60">/v1/base</code>,
      and every change streams back over the Base realtime SSE subscription. Open this in two windows to watch them sync.
    </footer>
  </div>

  <!-- realtime toast -->
  <div id="toast" class="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center opacity-0 transition-opacity duration-300">
    <div class="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/90 px-4 py-2 text-sm shadow-2xl backdrop-blur">
      <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span><span id="toastText"></span>
    </div>
  </div>

  <script>
  (function () {
    'use strict';

    // ── The five vibes (value → label, emoji, mood colour) ──────────────────
    // The colour spectrum is semantic: it encodes sentiment, warm (good) → cool (spent).
    const VIBES = [
      { key: 'fired', label: 'Fired up',  emoji: '🔥', color: '#34d399' },
      { key: 'good',  label: 'Good',      emoji: '😄', color: '#a3e635' },
      { key: 'meh',   label: 'Meh',       emoji: '😐', color: '#fbbf24' },
      { key: 'rough', label: 'Rough',     emoji: '😕', color: '#fb923c' },
      { key: 'spent', label: 'Burnt out', emoji: '😴', color: '#fb7185' },
    ];
    const LABEL = Object.fromEntries(VIBES.map(v => [v.key, v.label]));
    const COLLECTION = 'votes';

    // The builder-origin proxy prefix. Canonical is /v1/base; /api/base is the
    // legacy alias kept only so this demo works either side of that cutover.
    // resolveBase() picks whichever the deployment actually mounts.
    const CANDIDATES = ['/v1/base', '/api/base'];
    let BASE = CANDIDATES[0];

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
      btn.className = 'vibe group flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-3 outline-none transition hover:-translate-y-0.5 hover:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-white/40';
      btn.innerHTML =
        '<span class="text-2xl leading-none">' + v.emoji + '</span>' +
        '<span class="text-[11px] font-medium text-white/55 group-hover:text-white/90">' + v.label + '</span>';
      btn.addEventListener('click', () => vote(v.key));
      v.btn = btn;
      vibesEl.appendChild(btn);

      const row = document.createElement('div');
      row.className = 'grid grid-cols-[5.5rem,1fr,3.5rem] items-center gap-3 sm:grid-cols-[8rem,1fr,4rem]';
      row.innerHTML =
        '<div class="flex items-center gap-2 text-sm"><span>' + v.emoji + '</span>' +
        '<span class="truncate text-white/70">' + v.label + '</span></div>' +
        '<div class="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">' +
        '<div class="fill h-full rounded-full transition-[width] duration-500 ease-out" style="width:0%;background:' + v.color + '"></div></div>' +
        '<div class="text-right font-mono text-xs text-white/45"><span class="count text-white/80">0</span></div>';
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
      emptyEl.classList.toggle('hidden', total > 0);
      barsEl.classList.toggle('hidden', total === 0);

      for (const v of VIBES) {
        const c = counts[v.key];
        const pct = total ? Math.round((c / total) * 100) : 0;
        v.fill.style.width = pct + '%';
        v.count.textContent = c;
        // Highlight the option this browser currently holds.
        const mine = myChoice === v.key;
        v.btn.style.boxShadow = mine ? ('inset 0 0 0 1.5px ' + v.color) : '';
        v.btn.style.background = mine ? (v.color + '1f') : '';
        v.btn.firstElementChild.nextElementSibling.className =
          'text-[11px] font-medium ' + (mine ? 'text-white' : 'text-white/55 group-hover:text-white/90');
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
    const DOT = {
      connecting: 'bg-amber-400 live-dot',
      live: 'bg-emerald-400 live-dot',
      offline: 'bg-zinc-500',
      signin: 'bg-amber-400',
    };
    function setStatus(kind, text) {
      statusDot.className = 'h-2 w-2 rounded-full ' + (DOT[kind] || 'bg-zinc-500');
      statusText.textContent = text;
      statusText.className = kind === 'live' ? 'text-white/80' : 'text-white/60';
    }

    function setAuth(ok) {
      authed = ok;
      for (const v of VIBES) { v.btn.disabled = !ok; v.btn.classList.toggle('opacity-40', !ok); v.btn.classList.toggle('cursor-not-allowed', !ok); }
      if (!ok) { setStatus('signin', 'Sign in'); flashNotice('signin'); }
      else { noticeEl.classList.add('hidden'); }
    }

    function flashNotice(kind) {
      if (kind === 'signin') {
        noticeEl.className = 'mt-5 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-200/90';
        noticeEl.textContent = 'Sign in with Hanzo to check in — your vote is scoped to your team.';
      } else {
        noticeEl.className = 'mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60';
        noticeEl.textContent = 'This backend has no Base data plane configured.';
      }
      noticeEl.classList.remove('hidden');
    }

    let toastTimer = null;
    function toast(msg) {
      toastText.textContent = msg;
      toastEl.classList.remove('opacity-0');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastEl.classList.add('opacity-0'), 2200);
    }

    // ── Boot: pick the live proxy prefix, then load + connect ────────────────
    async function resolveBase() {
      for (const prefix of CANDIDATES) {
        try {
          const res = await fetch(prefix + '/collections/' + COLLECTION + '/records?perPage=1', { headers: { accept: 'application/json' } });
          // A JSON body (200 / 401 / 404-collection) means this proxy route is live.
          // An HTML 404 means the route isn't mounted here → try the next candidate.
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('json')) { BASE = prefix; return true; }
        } catch (_) {}
      }
      return false;
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
