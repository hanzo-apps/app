/*
 * Hanzo Edit — the ever-present "contribute to this page" widget.
 *
 * Drop into ANY Hanzo app:  <script async src="https://hanzo.app/edit.js"></script>
 *
 * The page self-declares its source via <meta> tags:
 *   <meta name="hanzo:repo"     content="owner/repo">   (required)
 *   <meta name="hanzo:path"     content="path/to/file"> (optional default)
 *   <meta name="hanzo:branch"   content="main">         (optional, default main)
 *   <meta name="hanzo:provider" content="github">       (optional, default github)
 *   <meta name="hanzo:key"      content="pk_...">        (optional project key)
 *
 * ZERO manual path: the widget resolves the source file(s) for the CURRENT view
 * itself and pre-fills the field (the user may override). It ranks candidates
 * from the best available signal, in order:
 *   1. an explicit `hanzo:path` (a page that maps 1:1 to a file),
 *   2. a React `_debugSource` on the element in view (DEV builds only — absent
 *      in production, so never depended on),
 *   3. the app's build-time route manifest (`/edit-manifest.json`) — the App
 *      Router pathname → `app/…/page.tsx` (+ its layout chain), the reliable
 *      signal since it is derived from the same filesystem convention Next
 *      routes on. Absent on apps that don't ship one → step 4.
 *   4. a convention guess (`app/<segments>/page.tsx` + root layout).
 *
 * Every submission also carries a context trace so a reviewing agent/dev knows
 * exactly where + what: the route, the ranked candidate files, the DOM
 * breadcrumb of what was on screen, the app version, the analytics session id, a
 * present-when-available session-replay deep-link, and a short usage trace.
 *
 * With no hanzo:repo the widget does nothing. Otherwise it renders a small
 * floating control that lets ANYONE suggest a fix, and lets a signed-in user with
 * credits (or an admin) run Hanzo's agent to fork→edit→PR the resolved file. All
 * privilege is enforced SERVER-SIDE by /v1/edit; the widget only shapes the CTA
 * from /v1/me. Framework-free, Shadow-DOM isolated, theme-neutral. No deps.
 */
(function () {
  'use strict';

  // The origin the script was served from is the backend base (works when this
  // runs cross-origin on another Hanzo app). Captured synchronously (currentScript
  // is null inside async callbacks).
  var SELF = document.currentScript;
  if (window.__hanzoEdit) return; // idempotent
  window.__hanzoEdit = true;

  function meta(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? (el.getAttribute('content') || '').trim() : '';
  }

  var REPO = meta('hanzo:repo');
  if (!REPO) return; // page does not declare a repo → nothing to do

  var PATH = meta('hanzo:path');
  var BRANCH = meta('hanzo:branch') || 'main';
  var PROVIDER = meta('hanzo:provider') || 'github';
  var KEY = meta('hanzo:key');

  var BASE = 'https://hanzo.app';
  try {
    if (SELF && SELF.src) BASE = new URL(SELF.src).origin;
  } catch (e) {
    /* keep default */
  }

  // A same-site httpOnly cookie rides automatically (credentials:'include'); a
  // different-site Hanzo app can expose its IAM token as window.HANZO_TOKEN (or a
  // readable hanzo_token cookie) which we forward as a bearer.
  function bearer() {
    if (window.HANZO_TOKEN) return String(window.HANZO_TOKEN);
    var m = document.cookie.match(/(?:^|;\s*)hanzo_token=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function api(path, opts) {
    opts = opts || {};
    var headers = opts.headers || {};
    var t = bearer();
    if (t) headers['Authorization'] = 'Bearer ' + t;
    opts.headers = headers;
    opts.credentials = 'include';
    return fetch(BASE + path, opts);
  }

  function selection() {
    try {
      var s = window.getSelection ? String(window.getSelection()) : '';
      return s.trim().slice(0, 2000);
    } catch (e) {
      return '';
    }
  }

  // ---- Session, replay & usage trace ("what the user was doing") -------------

  // The analytics/insights session id (@hanzo/event's localStorage `hz_session`
  // = {id,last}); fall back to the stable anon id, else a widget-local id. This
  // is the SAME id session-replay is keyed on, so the fix ties to the recording.
  function readJSON(store, k) {
    try {
      return JSON.parse(store.getItem(k) || 'null');
    } catch (e) {
      return null;
    }
  }
  function sessionId() {
    try {
      var ls = window.localStorage;
      var s = readJSON(ls, 'hz_session');
      if (s && s.id) return String(s.id);
      var anon = ls.getItem('hz_anon_id');
      if (anon) return String(anon);
      var own = ls.getItem('hz_edit_sid');
      if (!own) {
        own = 'edit-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        ls.setItem('hz_edit_sid', own);
      }
      return own;
    } catch (e) {
      return '';
    }
  }

  // Session-replay lives on Hanzo Insights. Replay INGEST is a separate, not-yet-
  // live workstream, so this is a present-when-available attachment: the deep-link
  // is well-formed now and simply "lights up" once ingest lands. Never blocks.
  function replayRef() {
    var sid = sessionId();
    if (!sid) return undefined;
    return { sessionId: sid, deepLink: 'https://insights.hanzo.ai/replay/' + encodeURIComponent(sid) };
  }

  // A short ring buffer of recent route events, captured from load. Degrades to
  // just the initial view when the page never client-navigates.
  var USAGE = [];
  function pushUsage(kind) {
    try {
      USAGE.push({ t: Date.now(), route: location.pathname + location.search, kind: kind });
      if (USAGE.length > 12) USAGE.shift();
    } catch (e) {
      /* ignore */
    }
  }
  pushUsage('load');
  (function hookHistory() {
    try {
      ['pushState', 'replaceState'].forEach(function (m) {
        var orig = history[m];
        if (typeof orig !== 'function') return;
        history[m] = function () {
          var r = orig.apply(this, arguments);
          pushUsage('nav');
          return r;
        };
      });
      window.addEventListener('popstate', function () {
        pushUsage('nav');
      });
    } catch (e) {
      /* history not patchable → single-entry trace, still fine */
    }
  })();
  function usageTrace() {
    if (!USAGE.length) return undefined;
    // Normalize timestamps to seconds-ago so the trace reads at a glance.
    var now = Date.now();
    return USAGE.slice(-8).map(function (e) {
      return { agoMs: now - e.t, route: e.route, kind: e.kind };
    });
  }

  // The element most recently interacted with — the thing the user was looking
  // at when they opened the widget (retargets to the shadow host for our own UI,
  // which we ignore).
  var lastEl = null;
  var host = document.createElement('div');
  host.setAttribute('data-hanzo-edit', '');
  ['pointerdown', 'click', 'focusin'].forEach(function (t) {
    document.addEventListener(
      t,
      function (e) {
        if (e.target && e.target !== host) lastEl = e.target;
      },
      true,
    );
  });

  // ---- DOM breadcrumb (what was on screen) ----------------------------------

  function attr(el, n) {
    return el && el.getAttribute ? el.getAttribute(n) : null;
  }
  function nodeToken(el) {
    var tag = el.tagName ? el.tagName.toLowerCase() : '';
    var slot = attr(el, 'data-slot') || attr(el, 'data-component') || attr(el, 'data-testid');
    if (slot) return tag + '[' + slot + ']';
    if (el.id) return tag + '#' + el.id;
    var aria = attr(el, 'aria-label');
    if (aria) return tag + '[aria=' + aria.slice(0, 24) + ']';
    var role = attr(el, 'role');
    if (role) return tag + '[role=' + role + ']';
    var cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : '';
    return tag + (cls ? '.' + cls : '');
  }
  function breadcrumb() {
    var el = lastEl && lastEl.isConnected ? lastEl : document.querySelector('main') || document.body;
    var parts = [];
    var hints = [];
    var hops = 0;
    while (el && el.nodeType === 1 && hops < 6) {
      parts.unshift(nodeToken(el));
      var slot = attr(el, 'data-slot') || attr(el, 'data-component');
      if (slot) hints.push(slot);
      if (el === document.body) break;
      el = el.parentElement;
      hops++;
    }
    return { crumb: parts.join(' > ').slice(0, 400), hints: hints };
  }

  // A React `_debugSource` on/above the element in view → the exact source file
  // & line. Present only in DEV builds (the automatic JSX runtime strips it in
  // production), so this is a bonus when available, never a dependency.
  function firstPartyRel(fileName) {
    var m = String(fileName || '').match(/(?:^|\/)((?:app|components|lib|src)\/.+)$/);
    return m ? m[1] : null;
  }
  function fiberSource(el) {
    try {
      for (var k in el) {
        if (k.indexOf('__reactFiber$') === 0 || k.indexOf('__reactInternalInstance$') === 0) {
          var f = el[k];
          var hops = 0;
          while (f && hops < 40) {
            if (f._debugSource && f._debugSource.fileName) {
              var rel = firstPartyRel(f._debugSource.fileName);
              if (rel) return { path: rel, line: f._debugSource.lineNumber };
            }
            f = f.return;
            hops++;
          }
        }
      }
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  // ---- Route → source file resolution ---------------------------------------

  var MANIFEST; // cached promise
  function loadManifest() {
    if (MANIFEST) return MANIFEST;
    // The app being viewed serves its OWN manifest (same-origin), not hanzo.app's.
    MANIFEST = fetch(location.origin + '/edit-manifest.json', { credentials: 'omit' })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (m) {
        // Only trust file paths that describe THIS repo.
        if (m && m.repo && REPO && m.repo !== REPO) return null;
        return m && Array.isArray(m.routes) ? m : null;
      })
      .catch(function () {
        return null;
      });
    return MANIFEST;
  }

  function pathParts(pathname) {
    return (pathname || '/').split(/[?#]/)[0].split('/').filter(Boolean);
  }
  // Match a manifest route's segments against the current path; return a
  // specificity score (static ≫ dynamic) or null when it doesn't match.
  function matchSpec(segs, parts) {
    var i = 0;
    var spec = 0;
    for (var si = 0; si < segs.length; si++) {
      var s = segs[si];
      if (s.k === 's') {
        if (parts[i] !== s.v) return null;
        i++;
        spec += 3;
      } else if (s.k === 'd') {
        if (i >= parts.length) return null;
        i++;
        spec += 1;
      } else if (s.k === 'c') {
        if (i >= parts.length) return null;
        i = parts.length;
      } else if (s.k === 'o') {
        i = parts.length;
      }
    }
    return i === parts.length ? spec : null;
  }
  function fromManifest(manifest, parts) {
    var best = null;
    var bestSpec = -1;
    for (var i = 0; i < manifest.routes.length; i++) {
      var r = manifest.routes[i];
      var spec = matchSpec(r.segments || [], parts);
      if (spec === null) continue;
      if (spec > bestSpec || (spec === bestSpec && (r.segments || []).length > (best.segments || []).length)) {
        best = r;
        bestSpec = spec;
      }
    }
    if (!best) return [];
    var out = [{ path: best.page, score: 0.9, why: 'route → page' }];
    (best.layouts || []).forEach(function (l, idx) {
      out.push({ path: l, score: 0.55 - idx * 0.05, why: 'route layout' });
    });
    return out;
  }
  function fromConvention(parts) {
    var dir = parts.length ? 'app/' + parts.join('/') : 'app';
    return [
      { path: dir + '/page.tsx', score: 0.4, why: 'convention guess' },
      { path: 'app/layout.tsx', score: 0.3, why: 'root layout' },
    ];
  }

  // Resolve a ranked, de-duplicated candidate list for the current view.
  function resolveCandidates() {
    var parts = pathParts(location.pathname);
    return loadManifest().then(function (manifest) {
      var out = [];
      if (PATH) out.push({ path: PATH, score: 1.0, why: 'declared (hanzo:path)' });
      var el = lastEl && lastEl.isConnected ? lastEl : null;
      var fib = el ? fiberSource(el) : null;
      if (fib) out.push({ path: fib.path, score: 0.95, why: 'react source (dev)' + (fib.line ? ':' + fib.line : '') });
      out = out.concat(manifest ? fromManifest(manifest, parts) : fromConvention(parts));
      if (manifest && out.filter(function (c) { return c.why.indexOf('route') === 0; }).length === 0) {
        // Manifest loaded but no route matched (e.g. an unlisted path) → still
        // give the convention guess something to chew on.
        out = out.concat(fromConvention(parts));
      }
      // De-dupe by path, keeping the highest score; sort desc; cap.
      var seen = {};
      var ranked = [];
      out
        .sort(function (a, b) {
          return b.score - a.score;
        })
        .forEach(function (c) {
          if (seen[c.path]) return;
          seen[c.path] = 1;
          ranked.push({ path: c.path, score: Math.round(c.score * 100) / 100, why: c.why });
        });
      return { candidates: ranked.slice(0, 6), version: manifest ? manifest.version : undefined };
    });
  }

  // ---- UI -------------------------------------------------------------------

  var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;

  // This script is loaded `async` and is often placed in <head>, so it can run
  // before <body> is parsed — in which case `document.body` is null and the
  // append throws, aborting the IIFE and leaving the widget absent. The shadow
  // root is already attached and usable while detached, so build into it now
  // and mount once the body exists.
  function mount() {
    document.body.appendChild(host);
  }
  if (document.body) {
    mount();
  } else {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  }

  var css =
    ':host{all:initial}' +
    '*{box-sizing:border-box;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}' +
    // The trigger is the ensō mark alone — one affordance for every AI action
    // on the page (ask, edit, suggest). It glows rather than grows, so it never
    // reflows content or competes with the page's own controls.
    '.fab{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:inline-flex;' +
    'align-items:center;justify-content:center;width:44px;height:44px;padding:0;' +
    'border-radius:999px;border:1px solid rgba(255,255,255,.16);background:#111;color:#fff;' +
    'cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.28);line-height:0;' +
    'transition:box-shadow .2s ease,border-color .2s ease,transform .2s ease}' +
    '.fab:hover,.fab:focus-visible{border-color:rgba(255,255,255,.42);' +
    'box-shadow:0 0 0 1px rgba(255,255,255,.14),0 0 18px 2px rgba(255,255,255,.22),0 6px 24px rgba(0,0,0,.34)}' +
    '.fab:active{transform:scale(.96)}' +
    '.fab svg{width:20px;height:20px;display:block}' +
    '@media (prefers-reduced-motion:reduce){.fab{transition:none}}' +
    '.panel{position:fixed;right:16px;bottom:16px;z-index:2147483001;width:360px;max-width:92vw;background:#0e0e0e;' +
    'color:#f4f4f5;border:1px solid rgba(255,255,255,.14);border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.5);' +
    'overflow:hidden;display:none}' +
    '.panel.open{display:block}' +
    '.hd{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.08)}' +
    '.hd b{font-size:13px;font-weight:600}' +
    '.hd .sub{font-size:11px;color:#9a9a9a;margin-top:2px}' +
    '.x{background:none;border:none;color:#9a9a9a;cursor:pointer;font-size:18px;line-height:1;padding:2px 4px}' +
    '.x:hover{color:#fff}' +
    '.bd{padding:14px}' +
    'textarea{width:100%;min-height:84px;resize:vertical;background:#171717;color:#fff;border:1px solid rgba(255,255,255,.14);' +
    'border-radius:8px;padding:9px 10px;font-size:13px;outline:none}' +
    'textarea:focus{border-color:#666}' +
    'input.path{width:100%;margin-top:8px;background:#171717;color:#cfcfcf;border:1px solid rgba(255,255,255,.12);' +
    'border-radius:8px;padding:8px 10px;font-size:12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;outline:none}' +
    'input.path:focus{border-color:#666}' +
    '.cands{margin-top:7px;display:flex;flex-wrap:wrap;gap:6px}' +
    '.cand{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:#cfcfcf;background:#151515;' +
    'border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:3px 7px;cursor:pointer;max-width:100%;overflow:hidden;' +
    'text-overflow:ellipsis;white-space:nowrap}' +
    '.cand:hover{border-color:#666;color:#fff}' +
    '.cand.on{border-color:#8ab4ff;color:#fff}' +
    '.ctx{font-size:11px;color:#7a7a7a;margin-top:9px;line-height:1.5;word-break:break-word}' +
    '.row{display:flex;gap:8px;margin-top:12px;align-items:center}' +
    '.btn{flex:1;padding:10px 12px;border-radius:8px;border:none;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer}' +
    '.btn:hover{background:#e8e8e8}' +
    '.btn:disabled{opacity:.55;cursor:default}' +
    '.btn.sec{flex:0 0 auto;background:transparent;color:#cfcfcf;border:1px solid rgba(255,255,255,.16);font-weight:500}' +
    '.btn.sec:hover{background:rgba(255,255,255,.06)}' +
    '.note{font-size:11px;color:#8a8a8a;margin-top:9px}' +
    '.link{color:#8ab4ff;text-decoration:none}' +
    '.link:hover{text-decoration:underline}' +
    '.msg{font-size:13px;line-height:1.5;word-break:break-word}' +
    '.msg.err{color:#ff9d9d}' +
    // Admin review: the proposed-change diff before a live commit.
    '.diff{margin-top:10px;max-height:38vh;overflow:auto;background:#0e0e0e;border:1px solid rgba(255,255,255,.12);' +
    'border-radius:8px;padding:8px 10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;' +
    'line-height:1.45;white-space:pre;tab-size:2}' +
    '.diff .a{color:#7ee787;background:rgba(46,160,67,.12);display:block}' +
    '.diff .d{color:#ff9d9d;background:rgba(248,81,73,.12);display:block}' +
    '.diff .c{color:#8a8a8a;display:block}' +
    '.warn{font-size:11px;color:#e3b341;margin-top:9px}' +
    'code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;background:#1c1c1c;' +
    'border:1px solid rgba(255,255,255,.12);border-radius:5px;padding:1px 5px}' +
    // Admin affordances: the "admin" chip + the ghost inline-edit button.
    '.adm{color:#8ab4ff;font-weight:600;text-transform:uppercase;letter-spacing:.04em;font-size:10px}' +
    '.btn.ghost{width:100%;margin-top:8px;background:transparent;color:#cfcfcf;border:1px dashed rgba(255,255,255,.22);' +
    'font-weight:500;padding:9px 12px;border-radius:8px;cursor:pointer}' +
    '.btn.ghost:hover{border-color:#8ab4ff;color:#fff}' +
    '.spin{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;' +
    'border-radius:50%;animation:hz 0.7s linear infinite;vertical-align:-2px;margin-right:6px}' +
    '@keyframes hz{to{transform:rotate(360deg)}}' +
    // Mobile: the panel becomes a bottom-sheet (full-width, rounded top, safe-area
    // inset) with larger touch targets; the FAB tucks above the home indicator.
    '@media (max-width:560px){' +
    '.fab{right:12px;bottom:calc(12px + env(safe-area-inset-bottom))}' +
    '.panel{left:0;right:0;bottom:0;top:auto;width:100%;max-width:100%;border-radius:16px 16px 0 0;' +
    'border-left:none;border-right:none;border-bottom:none;max-height:88vh;overflow-y:auto;' +
    'padding-bottom:env(safe-area-inset-bottom)}' +
    '.hd{padding:14px 16px}.bd{padding:16px}' +
    'textarea{min-height:96px;font-size:16px}' + // 16px ⇒ iOS never zooms on focus
    'input.path{font-size:14px;padding:11px 12px}' +
    '.btn{padding:14px 14px;font-size:15px}.btn.sec{padding:14px 16px}.btn.ghost{padding:13px 14px}' +
    '.cand{padding:6px 10px;font-size:12px}' +
    '.x{font-size:24px;padding:6px 10px}' +
    '}';

  var style = document.createElement('style');
  style.textContent = css;
  root.appendChild(style);

  var PENCIL =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';

  // The ensō — Hanzo's AI mark, identical geometry to the one on /enso.
  var ENSO =
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
    '<circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round"/></svg>';

  var fab = document.createElement('button');
  fab.className = 'fab';
  fab.setAttribute('aria-label', 'Ask or edit this page');
  fab.setAttribute('title', 'Ask or edit this page');
  fab.innerHTML = ENSO;
  root.appendChild(fab);

  var panel = document.createElement('div');
  panel.className = 'panel';
  root.appendChild(panel);

  var ME = { authenticated: false, isAdmin: false, hasCredits: false, balance: null };

  // Resolved-once-per-open view context.
  var CTX = { candidates: [], version: undefined, chosen: '' };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // Decide the primary CTA from identity + credits. Admin's primary is the
  // "goes live" direct commit; the server re-checks sudo for that mode,
  // so this only shapes the UI.
  function cta() {
    if (ME.isAdmin)
      return {
        label: 'Apply live',
        action: 'edit',
        mode: 'direct',
        admin: true,
        note: 'Commits directly to ' + BRANCH + ' — goes live.',
      };
    if (ME.authenticated && ME.hasCredits) return { label: 'Submit fix', action: 'edit', note: 'Uses your credits.' };
    if (ME.authenticated) return { label: 'Suggest a fix', action: 'suggest', top: true };
    return { label: 'Suggest a fix', action: 'suggest', login: true };
  }

  function renderForm() {
    var c = cta();
    var showPath = c.action === 'edit';
    var chosen = CTX.chosen || (CTX.candidates[0] && CTX.candidates[0].path) || PATH || '';
    var candChips = CTX.candidates.length
      ? '<div class="cands">' +
        CTX.candidates
          .map(function (cand) {
            return (
              '<button type="button" class="cand' +
              (cand.path === chosen ? ' on' : '') +
              '" data-path="' +
              esc(cand.path) +
              '" title="' +
              esc(cand.why) +
              '">' +
              esc(cand.path) +
              '</button>'
            );
          })
          .join('') +
        '</div>'
      : '';
    panel.innerHTML =
      '<div class="hd"><div><b>' +
      (c.admin ? 'Command this page' : 'Improve this page') +
      '</b><div class="sub">' +
      esc(REPO) +
      (BRANCH ? ' · ' + esc(BRANCH) : '') +
      (c.admin ? ' · <span class="adm">admin</span>' : '') +
      '</div></div><button class="x" aria-label="Close">×</button></div>' +
      '<div class="bd">' +
      '<textarea placeholder="' +
      (c.admin
        ? 'Command — e.g. “change the hero headline to Ship faster”'
        : 'Describe the change or fix…') +
      '"></textarea>' +
      (showPath
        ? '<input class="path" placeholder="auto-detected file — edit to override" value="' + esc(chosen) + '"/>' + candChips
        : '') +
      (c.admin
        ? '<button type="button" class="btn ghost" data-inline>✎ Edit text directly on the page</button>'
        : '') +
      '<div class="row">' +
      '<button class="btn primary">' +
      esc(c.label) +
      '</button>' +
      (c.admin
        ? '<button class="btn sec" data-pr>Open PR</button>'
        : c.action === 'edit'
          ? '<button class="btn sec" data-suggest>Suggest</button>'
          : '') +
      '</div>' +
      (c.note ? '<div class="note">' + esc(c.note) + '</div>' : '') +
      (c.top
        ? '<div class="note"><a class="link" href="' + BASE + '/billing" target="_blank" rel="noopener">Top up</a> to open a PR directly.</div>'
        : '') +
      (c.login
        ? '<div class="note"><a class="link" href="' + BASE + '/login" target="_blank" rel="noopener">Log in</a> to open a PR directly.</div>'
        : '') +
      '<div class="ctx">Context attached: <b>' +
      esc(location.pathname) +
      '</b>' +
      (CTX.candidates.length ? ' · ' + CTX.candidates.length + ' candidate file' + (CTX.candidates.length > 1 ? 's' : '') : '') +
      (CTX.version ? ' · v' + esc(CTX.version) : '') +
      '</div>' +
      '</div>';

    panel.querySelector('.x').onclick = close;
    var ta = panel.querySelector('textarea');
    var pathInput = panel.querySelector('.path');
    ta.focus();

    // Candidate chips set the path field (and remember the choice).
    Array.prototype.forEach.call(panel.querySelectorAll('.cand'), function (chip) {
      chip.onclick = function () {
        CTX.chosen = chip.getAttribute('data-path');
        if (pathInput) pathInput.value = CTX.chosen;
        Array.prototype.forEach.call(panel.querySelectorAll('.cand'), function (o) {
          o.classList.toggle('on', o === chip);
        });
      };
    });
    if (pathInput)
      pathInput.oninput = function () {
        CTX.chosen = pathInput.value;
      };

    var pathOf = function () {
      return pathInput ? pathInput.value : chosen;
    };
    panel.querySelector('.btn.primary').onclick = function () {
      submit(c.action, ta.value, pathOf(), c.mode);
    };
    var sug = panel.querySelector('[data-suggest]');
    if (sug)
      sug.onclick = function () {
        submit('suggest', ta.value, pathOf());
      };
    // Admin: "Open PR" runs the same agent edit but as a PR (mode omitted).
    var pr = panel.querySelector('[data-pr]');
    if (pr)
      pr.onclick = function () {
        submit('edit', ta.value, pathOf(), 'pr');
      };
    // Admin: inline click-to-edit the tracked element → a precise instruction.
    var inl = panel.querySelector('[data-inline]');
    if (inl)
      inl.onclick = function () {
        inlineEdit(pathOf());
      };
  }

  function showMessage(html, isErr) {
    panel.innerHTML =
      '<div class="hd"><div><b>Hanzo Edit</b></div><button class="x" aria-label="Close">×</button></div>' +
      '<div class="bd"><div class="msg' +
      (isErr ? ' err' : '') +
      '">' +
      html +
      '</div>' +
      '<div class="row"><button class="btn primary" data-again>New suggestion</button></div></div>';
    panel.querySelector('.x').onclick = close;
    panel.querySelector('[data-again]').onclick = renderForm;
  }

  function busy(label) {
    var b = panel.querySelector('.btn.primary');
    if (b) {
      b.disabled = true;
      b.innerHTML = '<span class="spin"></span>' + esc(label);
    }
    var s = panel.querySelector('[data-suggest]');
    if (s) s.disabled = true;
  }

  // The rich context every submission carries — enough for an agent or dev to
  // review and finish the fix.
  function contextTrace() {
    var bc = breadcrumb();
    return {
      route: location.pathname,
      candidateFiles: CTX.candidates,
      domBreadcrumb: bc.crumb || undefined,
      appVersion: CTX.version || meta('hanzo:version') || undefined,
      sessionId: sessionId() || undefined,
      replayRef: replayRef(),
      usageTrace: usageTrace(),
    };
  }

  // The shared payload skeleton every submission carries.
  function editPayload(effectivePath) {
    var trace = contextTrace();
    return {
      repo: REPO,
      provider: PROVIDER,
      path: effectivePath || undefined,
      branch: BRANCH,
      url: location.href,
      key: KEY || undefined,
      context: selection() || undefined,
      route: trace.route,
      candidateFiles: trace.candidateFiles && trace.candidateFiles.length ? trace.candidateFiles : undefined,
      domBreadcrumb: trace.domBreadcrumb,
      appVersion: trace.appVersion,
      sessionId: trace.sessionId,
      replayRef: trace.replayRef,
      usageTrace: trace.usageTrace,
    };
  }

  function submit(action, text, path, mode) {
    text = (text || '').trim();
    if (!text) return;
    var effectivePath = (path || '').trim() || (CTX.candidates[0] && CTX.candidates[0].path) || PATH || '';

    if (action === 'suggest') {
      var payload = editPayload(effectivePath);
      payload.suggestion = text;
      busy('Sending…');
      api('/v1/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(readJson)
        .then(function (r) {
          if (r.data && r.data.ok && r.data.issueUrl) {
            showMessage(
              'Suggestion filed: <a class="link" href="' +
                esc(r.data.issueUrl) +
                '" target="_blank" rel="noopener">view issue ↗</a>',
            );
          } else if (r.data && r.data.ok) {
            showMessage('Thanks — your suggestion was received.');
          } else {
            showMessage(esc((r.data && r.data.error) || 'Could not send the suggestion.'), true);
          }
        })
        .catch(function () {
          showMessage('Network error — please try again.', true);
        });
      return;
    }

    postEdit(text, effectivePath, mode);
  }

  // Timestamp of the in-flight edit, so a direct commit can report ~elapsed
  // seconds ("live in ~Ns").
  var editT0 = 0;

  // Run the agent edit: mode 'direct' asks the server to commit straight to the
  // default branch (honored ONLY for an admin — the server re-checks); anything
  // else is the fork→PR flow. All privilege lives server-side; mode is a hint.
  // The in-flight direct edit, remembered so the CONFIRM phase can resend the
  // same instruction + path alongside the admin-approved bytes.
  var lastEdit = null;

  function postEdit(instruction, path, mode) {
    instruction = (instruction || '').trim();
    if (!instruction) return;
    var effectivePath = (path || '').trim() || (CTX.candidates[0] && CTX.candidates[0].path) || PATH || '';
    if (!effectivePath) {
      showMessage('Couldn’t detect a source file for this view — use <b>Suggest</b> instead.', true);
      return;
    }
    lastEdit = { instruction: instruction, path: effectivePath };
    var payload = editPayload(effectivePath);
    payload.instruction = instruction;
    if (mode) payload.mode = mode;
    // Direct mode returns a PROPOSAL first (nothing commits until the admin
    // confirms), so the button reads "Reviewing…" not "Applying…".
    busy(mode === 'direct' ? 'Reviewing…' : 'Opening PR…');
    editT0 = Date.now();
    api('/v1/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(readJson)
      .then(renderEditResult)
      .catch(function () {
        showMessage('Network error — please try again.', true);
      });
  }

  // CONFIRM phase: the admin has reviewed the proposal; commit the EXACT approved
  // bytes straight to the default branch, optimistic-locked to the reviewed sha.
  function confirmEdit(proposed, baseSha) {
    if (!lastEdit) return;
    var payload = editPayload(lastEdit.path);
    payload.instruction = lastEdit.instruction;
    payload.mode = 'direct';
    payload.reviewed = proposed;
    payload.baseSha = baseSha;
    showMessageBusy('Applying…');
    editT0 = Date.now();
    api('/v1/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(readJson)
      .then(renderEditResult)
      .catch(function () {
        showMessage('Network error — please try again.', true);
      });
  }

  // Render a diff string ("+ "/"- "/"  " line prefixes) as colored lines.
  function renderDiff(diff) {
    return diff
      .split('\n')
      .map(function (ln) {
        var k = ln.charAt(0) === '+' ? 'a' : ln.charAt(0) === '-' ? 'd' : 'c';
        return '<span class="' + k + '">' + esc(ln) + '</span>';
      })
      .join('');
  }

  // The admin review gate: show the proposed change (diff, or full contents when
  // the file is too large to diff) and require an explicit "Apply live" before
  // anything reaches the default branch.
  function renderPreview(d) {
    var body = d.diff
      ? '<div class="diff">' + renderDiff(d.diff) + '</div>'
      : '<div class="warn">Large file — review the full proposed contents below.</div>' +
        '<div class="diff">' + esc(String(d.proposed || '')) + '</div>';
    panel.innerHTML =
      '<div class="hd"><div><b>Review before it goes live</b><div class="sub">' +
      esc(d.path || (lastEdit && lastEdit.path) || '') +
      ' · ' + esc(d.branch || BRANCH) +
      ' · <span class="adm">admin</span></div></div><button class="x" aria-label="Close">×</button></div>' +
      '<div class="bd">' +
      body +
      '<div class="warn">This commits directly to ' + esc(d.branch || BRANCH) + ' and goes live to all visitors.</div>' +
      '<div class="row">' +
      '<button class="btn primary" data-apply>Apply live</button>' +
      '<button class="btn sec" data-cancel>Cancel</button>' +
      '</div></div>';
    panel.querySelector('.x').onclick = close;
    panel.querySelector('[data-cancel]').onclick = renderForm;
    panel.querySelector('[data-apply]').onclick = function () {
      var b = panel.querySelector('[data-apply]');
      if (b) {
        b.disabled = true;
        b.innerHTML = '<span class="spin"></span>Applying…';
      }
      confirmEdit(d.proposed, d.baseSha);
    };
  }

  function renderEditResult(r) {
    var d = r.data || {};
    if (d.ok && d.preview) {
      renderPreview(d);
    } else if (d.ok && d.committed) {
      var secs = Math.max(1, Math.round((Date.now() - editT0) / 1000));
      var commit = d.commitUrl
        ? ' <a class="link" href="' + esc(d.commitUrl) + '" target="_blank" rel="noopener">view commit ↗</a>'
        : d.commitSha
          ? ' <code>' + esc(String(d.commitSha).slice(0, 7)) + '</code>'
          : '';
      var live = d.liveUrl
        ? '<div class="note">Live at <a class="link" href="' +
          esc(d.liveUrl) +
          '" target="_blank" rel="noopener">' +
          esc(d.liveUrl.replace(/^https?:\/\//, '')) +
          '</a> — refresh to see the change.</div>'
        : '';
      showMessage('Committed to <b>' + esc(d.branch || BRANCH) + '</b> — live in ~' + secs + 's.' + commit + live);
    } else if (d.ok && d.prUrl) {
      showMessage(
        (d.forked ? 'Forked and opened' : 'Opened') +
          ' a pull request: <a class="link" href="' +
          esc(d.prUrl) +
          '" target="_blank" rel="noopener">' +
          esc(d.prUrl.replace(/^https?:\/\//, '')) +
          ' ↗</a>',
      );
    } else if (r.status === 401 || d.openLogin) {
      showMessage('<a class="link" href="' + BASE + '/login" target="_blank" rel="noopener">Log in</a> to open a PR.', true);
    } else if (r.status === 402 || d.needsCredits) {
      showMessage(
        'You’re out of credits. <a class="link" href="' + BASE + '/billing" target="_blank" rel="noopener">Top up</a> to open a PR.',
        true,
      );
    } else if (d.connect) {
      showMessage(
        'Connect ' +
          esc(PROVIDER) +
          ' in your <a class="link" href="' +
          BASE +
          '/connectors" target="_blank" rel="noopener">Hanzo account</a> to open a PR.',
        true,
      );
    } else {
      showMessage(esc(d.error || 'The edit failed.'), true);
    }
  }

  // Inline click-to-edit (admin): make the tracked element's text editable in
  // place; on commit (Enter / blur) turn the before→after diff into a precise
  // instruction and apply it live. Escape cancels + restores. Text-only — never
  // touches structure or attributes.
  var inlineActive = false;
  function inlineEdit(path) {
    if (inlineActive) return;
    var el = lastEl && lastEl.isConnected ? lastEl : null;
    // Climb to the nearest element that actually carries text (skip empty wrappers).
    while (el && el !== document.body && !(el.innerText || el.textContent || '').trim()) el = el.parentElement;
    if (!el || el === document.body) {
      showMessage('Click the text you want to change first, then reopen and choose “Edit text directly”.', true);
      return;
    }
    inlineActive = true;
    var before = (el.innerText || el.textContent || '').trim();
    var label = nodeToken(el);
    var prevCE = el.getAttribute('contenteditable');
    var prevOutline = el.style.outline;
    close(); // reveal the element so the admin can type over it
    el.setAttribute('contenteditable', 'true');
    el.style.outline = '2px solid #8ab4ff';
    el.focus();
    // Select all the text so typing replaces it.
    try {
      var range = document.createRange();
      range.selectNodeContents(el);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) {
      /* selection is a nicety */
    }

    function restore() {
      el.style.outline = prevOutline;
      if (prevCE === null) el.removeAttribute('contenteditable');
      else el.setAttribute('contenteditable', prevCE);
      el.removeEventListener('keydown', onKey, true);
      el.removeEventListener('blur', onBlur, true);
      inlineActive = false;
    }
    function commit() {
      var after = (el.innerText || el.textContent || '').trim();
      var changed = after && after !== before;
      if (!changed) {
        el.textContent = before;
        restore();
        return;
      }
      restore();
      var instruction =
        'Change the visible text of the ' + label + ' element from "' + before + '" to "' + after + '". Change only that text.';
      fab.style.display = 'none';
      panel.classList.add('open');
      showMessageBusy('Applying…');
      postEdit(instruction, path, 'direct');
    }
    function onKey(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        commit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        el.textContent = before;
        restore();
      }
    }
    function onBlur() {
      commit();
    }
    el.addEventListener('keydown', onKey, true);
    el.addEventListener('blur', onBlur, true);
  }

  // A minimal "working" panel used when a flow starts without a form on screen
  // (inline edit). The subsequent renderEditResult replaces it.
  function showMessageBusy(label) {
    panel.innerHTML =
      '<div class="hd"><div><b>Hanzo Edit</b></div><button class="x" aria-label="Close">×</button></div>' +
      '<div class="bd"><div class="msg"><span class="spin"></span>' +
      esc(label) +
      '</div></div>';
    panel.querySelector('.x').onclick = close;
  }

  function readJson(res) {
    return res
      .json()
      .then(function (data) {
        return { status: res.status, data: data };
      })
      .catch(function () {
        return { status: res.status, data: {} };
      });
  }

  function open() {
    panel.classList.add('open');
    fab.style.display = 'none';
    CTX.chosen = '';
    renderForm(); // render immediately (candidates fill in when resolved)
    resolveCandidates()
      .then(function (res) {
        CTX.candidates = res.candidates;
        CTX.version = res.version;
        if (panel.classList.contains('open')) renderForm();
      })
      .catch(function () {
        /* keep the form usable with no candidates */
      });
  }
  function close() {
    panel.classList.remove('open');
    fab.style.display = '';
  }
  fab.onclick = open;

  // Register this property as a project so it "ties back" and shows in
  // hanzo.app's projects list. Fire-and-forget, idempotent (the server only
  // creates when no project already links this repo), and SIGNED-IN ONLY. The
  // org is derived server-side from the bearer — the browser never picks it.
  var REGISTERED = false;
  function registerProperty() {
    if (REGISTERED) return;
    REGISTERED = true;
    api('/v1/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo: REPO }),
    }).catch(function () {
      /* registration is a convenience — never blocks editing */
    });
  }

  // Probe identity to shape the CTA (fail-open to the anonymous suggest state).
  api('/v1/me', { headers: { Accept: 'application/json' } })
    .then(function (r) {
      return r.json();
    })
    .then(function (d) {
      if (d && typeof d === 'object') {
        ME.authenticated = !!d.authenticated;
        ME.isAdmin = !!d.isAdmin;
        ME.hasCredits = !!d.hasCredits;
        ME.balance = typeof d.balance === 'number' ? d.balance : null;
      }
      if (ME.authenticated) registerProperty();
    })
    .catch(function () {
      /* anonymous suggest still works */
    });
})();
