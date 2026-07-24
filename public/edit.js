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
 * With no hanzo:repo the widget does nothing. Otherwise it renders a small
 * floating control that lets ANYONE suggest a fix, and lets a signed-in user with
 * credits (or an admin) run Hanzo's agent to fork→edit→PR the declared file. All
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

  // ---- UI -------------------------------------------------------------------

  var host = document.createElement('div');
  host.setAttribute('data-hanzo-edit', '');
  var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
  document.body.appendChild(host);

  var css =
    ':host{all:initial}' +
    '*{box-sizing:border-box;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}' +
    '.fab{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:inline-flex;align-items:center;gap:8px;' +
    'padding:10px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:#111;color:#fff;' +
    'font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.28);line-height:1}' +
    '.fab:hover{background:#1c1c1c}' +
    '.fab svg{width:15px;height:15px}' +
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
    '.spin{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;' +
    'border-radius:50%;animation:hz 0.7s linear infinite;vertical-align:-2px;margin-right:6px}' +
    '@keyframes hz{to{transform:rotate(360deg)}}';

  var style = document.createElement('style');
  style.textContent = css;
  root.appendChild(style);

  var PENCIL =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';

  var fab = document.createElement('button');
  fab.className = 'fab';
  fab.setAttribute('aria-label', 'Edit or improve this page');
  fab.innerHTML = PENCIL + '<span>Edit this page</span>';
  root.appendChild(fab);

  var panel = document.createElement('div');
  panel.className = 'panel';
  root.appendChild(panel);

  var ME = { authenticated: false, isGlobalAdmin: false, hasCredits: false, balance: null };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // Decide the primary CTA from identity + credits.
  function cta() {
    if (ME.isGlobalAdmin) return { label: 'Open PR — free', action: 'edit' };
    if (ME.authenticated && ME.hasCredits) return { label: 'Submit fix', action: 'edit', note: 'Uses your credits.' };
    if (ME.authenticated) return { label: 'Suggest a fix', action: 'suggest', top: true };
    return { label: 'Suggest a fix', action: 'suggest', login: true };
  }

  function renderForm() {
    var c = cta();
    var showPath = c.action === 'edit';
    panel.innerHTML =
      '<div class="hd"><div><b>Improve this page</b><div class="sub">' +
      esc(REPO) +
      (BRANCH ? ' · ' + esc(BRANCH) : '') +
      '</div></div><button class="x" aria-label="Close">×</button></div>' +
      '<div class="bd">' +
      '<textarea placeholder="Describe the change or fix…"></textarea>' +
      (showPath
        ? '<input class="path" placeholder="path/to/file (required to open a PR)" value="' + esc(PATH || '') + '"/>'
        : '') +
      '<div class="row">' +
      '<button class="btn primary">' + esc(c.label) + '</button>' +
      (c.action === 'edit' ? '<button class="btn sec" data-suggest>Suggest</button>' : '') +
      '</div>' +
      (c.note ? '<div class="note">' + esc(c.note) + '</div>' : '') +
      (c.top ? '<div class="note"><a class="link" href="' + BASE + '/billing" target="_blank" rel="noopener">Top up</a> to open a PR directly.</div>' : '') +
      (c.login ? '<div class="note"><a class="link" href="' + BASE + '/login" target="_blank" rel="noopener">Log in</a> to open a PR directly.</div>' : '') +
      '</div>';

    panel.querySelector('.x').onclick = close;
    var ta = panel.querySelector('textarea');
    var pathInput = panel.querySelector('.path');
    ta.focus();

    panel.querySelector('.btn.primary').onclick = function () {
      submit(c.action, ta.value, pathInput ? pathInput.value : PATH);
    };
    var sug = panel.querySelector('[data-suggest]');
    if (sug) sug.onclick = function () { submit('suggest', ta.value, pathInput ? pathInput.value : PATH); };
  }

  function showMessage(html, isErr) {
    panel.innerHTML =
      '<div class="hd"><div><b>Hanzo Edit</b></div><button class="x" aria-label="Close">×</button></div>' +
      '<div class="bd"><div class="msg' + (isErr ? ' err' : '') + '">' + html + '</div>' +
      '<div class="row"><button class="btn primary" data-again>New suggestion</button></div></div>';
    panel.querySelector('.x').onclick = close;
    panel.querySelector('[data-again]').onclick = renderForm;
  }

  function busy(label) {
    var b = panel.querySelector('.btn.primary');
    if (b) { b.disabled = true; b.innerHTML = '<span class="spin"></span>' + esc(label); }
    var s = panel.querySelector('[data-suggest]');
    if (s) s.disabled = true;
  }

  function submit(action, text, path) {
    text = (text || '').trim();
    if (!text) return;
    if (action === 'edit' && !(path || '').trim()) {
      // Need a file to edit — fall back to a suggestion rather than failing.
      showMessage('Add a file path to open a PR, or use <b>Suggest</b> instead.', true);
      return;
    }
    var ctx = selection();
    var payload = {
      repo: REPO,
      provider: PROVIDER,
      path: (path || '').trim() || undefined,
      branch: BRANCH,
      url: location.href,
      key: KEY || undefined,
      context: ctx || undefined,
    };

    if (action === 'suggest') {
      busy('Sending…');
      payload.suggestion = text;
      api('/v1/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(readJson)
        .then(function (r) {
          if (r.data && r.data.ok && r.data.issueUrl) {
            showMessage('Suggestion filed: <a class="link" href="' + esc(r.data.issueUrl) + '" target="_blank" rel="noopener">view issue ↗</a>');
          } else if (r.data && r.data.ok) {
            showMessage('Thanks — your suggestion was received.');
          } else {
            showMessage(esc((r.data && r.data.error) || 'Could not send the suggestion.'), true);
          }
        })
        .catch(function () { showMessage('Network error — please try again.', true); });
      return;
    }

    // action === 'edit'
    busy('Opening PR…');
    payload.instruction = text;
    api('/v1/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(readJson)
      .then(function (r) {
        var d = r.data || {};
        if (d.ok && d.prUrl) {
          showMessage(
            (d.forked ? 'Forked and opened' : 'Opened') +
              ' a pull request: <a class="link" href="' + esc(d.prUrl) + '" target="_blank" rel="noopener">' +
              esc(d.prUrl.replace(/^https?:\/\//, '')) + ' ↗</a>',
          );
        } else if (r.status === 401 || d.openLogin) {
          showMessage('<a class="link" href="' + BASE + '/login" target="_blank" rel="noopener">Log in</a> to open a PR.', true);
        } else if (r.status === 402 || d.needsCredits) {
          showMessage('You’re out of credits. <a class="link" href="' + BASE + '/billing" target="_blank" rel="noopener">Top up</a> to open a PR.', true);
        } else if (d.connect) {
          showMessage('Connect ' + esc(PROVIDER) + ' in your <a class="link" href="' + BASE + '/connectors" target="_blank" rel="noopener">Hanzo account</a> to open a PR.', true);
        } else {
          showMessage(esc(d.error || 'The edit failed.'), true);
        }
      })
      .catch(function () { showMessage('Network error — please try again.', true); });
  }

  function readJson(res) {
    return res.json().then(function (data) { return { status: res.status, data: data }; }).catch(function () {
      return { status: res.status, data: {} };
    });
  }

  function open() {
    panel.classList.add('open');
    fab.style.display = 'none';
    renderForm();
  }
  function close() {
    panel.classList.remove('open');
    fab.style.display = '';
  }
  fab.onclick = open;

  // Probe identity to shape the CTA (fail-open to the anonymous suggest state).
  api('/v1/me', { headers: { Accept: 'application/json' } })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d && typeof d === 'object') {
        ME.authenticated = !!d.authenticated;
        ME.isGlobalAdmin = !!d.isGlobalAdmin;
        ME.hasCredits = !!d.hasCredits;
        ME.balance = typeof d.balance === 'number' ? d.balance : null;
      }
    })
    .catch(function () { /* anonymous suggest still works */ });
})();
