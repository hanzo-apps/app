import type { ProjectTemplate } from '../project-templates';

/**
 * Hanzo Full-Stack template.
 *
 * A complete AI app wired to the Hanzo cloud out of the box:
 *   - Base   → persistent data, read/written through the /api/base proxy with
 *              the signed-in user's Hanzo IAM token (per-user records).
 *   - IAM    → the user is already authenticated by Hanzo; /api/me reflects them.
 *   - LLM    → the `ask` edge function calls api.hanzo.ai (400+ models) using a
 *              HANZO_API_KEY secret.
 *
 * The frontend is plain HTML/JS so it runs in any runtime; the cloud wiring is
 * what the template demonstrates.
 */

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hanzo Notes</title>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <main>
    <header>
      <h1>Hanzo Notes</h1>
      <p id="who" class="muted">Signed in via Hanzo</p>
    </header>

    <section class="card">
      <h2>Add a note</h2>
      <textarea id="note" placeholder="Write a note…"></textarea>
      <div class="row">
        <button id="save">Save to Base</button>
        <button id="improve" class="secondary">Improve with AI</button>
      </div>
    </section>

    <section>
      <h2>Your notes</h2>
      <ul id="notes"></ul>
    </section>
  </main>
  <script src="/app.js"></script>
</body>
</html>
`;

const STYLES_CSS = `:root { color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #000; color: #fff; }
main { max-width: 640px; margin: 0 auto; padding: 32px 20px 80px; }
header h1 { margin: 0 0 4px; font-size: 28px; }
.muted { color: #8a8a8a; font-size: 13px; margin: 0; }
.card { background: #0d0d0d; border: 1px solid #1f1f1f; border-radius: 12px; padding: 16px; margin: 24px 0; }
h2 { font-size: 15px; text-transform: uppercase; letter-spacing: .04em; color: #b0b0b0; }
textarea { width: 100%; min-height: 90px; background: #000; color: #fff; border: 1px solid #2a2a2a; border-radius: 8px; padding: 10px; font: inherit; resize: vertical; }
.row { display: flex; gap: 8px; margin-top: 10px; }
button { background: #fff; color: #000; border: 0; border-radius: 8px; padding: 9px 14px; font-weight: 600; cursor: pointer; }
button.secondary { background: #1a1a1a; color: #fff; border: 1px solid #2a2a2a; }
button:disabled { opacity: .5; cursor: default; }
ul { list-style: none; padding: 0; }
li { background: #0d0d0d; border: 1px solid #1f1f1f; border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; display: flex; justify-content: space-between; gap: 10px; }
li .del { background: none; color: #777; border: 0; cursor: pointer; font-size: 18px; padding: 0; }
`;

// Talks to Base through the builder-origin proxy (/api/base) and to the LLM
// edge function (functions/ask). In preview, the proxy uses the developer's
// session; when deployed, each visitor's Hanzo session.
const APP_JS = `const BASE = '/api/base';
const COLLECTION = 'notes';
const notesEl = document.getElementById('notes');
const noteEl = document.getElementById('note');
const saveBtn = document.getElementById('save');
const improveBtn = document.getElementById('improve');

async function me() {
  try {
    const r = await fetch('/api/me');
    if (!r.ok) return;
    const { user } = await r.json();
    if (user && (user.fullname || user.name)) {
      document.getElementById('who').textContent = 'Signed in as ' + (user.fullname || user.name);
    }
  } catch {}
}

async function load() {
  const r = await fetch(BASE + '/collections/' + COLLECTION + '/records?sort=-created');
  if (!r.ok) { notesEl.innerHTML = '<li class="muted">Sign in to load notes.</li>'; return; }
  const data = await r.json();
  notesEl.innerHTML = '';
  for (const rec of (data.items || [])) {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = rec.body;
    const del = document.createElement('button');
    del.className = 'del'; del.textContent = '×';
    del.onclick = () => remove(rec.id);
    li.append(span, del);
    notesEl.appendChild(li);
  }
}

async function save() {
  const body = noteEl.value.trim();
  if (!body) return;
  saveBtn.disabled = true;
  await fetch(BASE + '/collections/' + COLLECTION + '/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
  noteEl.value = '';
  saveBtn.disabled = false;
  load();
}

async function remove(id) {
  await fetch(BASE + '/collections/' + COLLECTION + '/records/' + id, { method: 'DELETE' });
  load();
}

async function improve() {
  const body = noteEl.value.trim();
  if (!body) return;
  improveBtn.disabled = true;
  improveBtn.textContent = 'Thinking…';
  try {
    const r = await fetch('functions/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Improve this note, keep it concise:\\n' + body }),
    });
    const data = await r.json();
    if (data.text) noteEl.value = data.text;
  } finally {
    improveBtn.disabled = false;
    improveBtn.textContent = 'Improve with AI';
  }
}

saveBtn.onclick = save;
improveBtn.onclick = improve;
me();
load();
`;

export const HANZO_FULLSTACK_PROJECT_TEMPLATE: ProjectTemplate = {
  name: 'Hanzo Full-Stack',
  description: 'AI app pre-wired to Hanzo Base (data), IAM (auth), and the Hanzo LLM API.',
  directories: [],
  files: [
    { path: '/index.html', content: INDEX_HTML },
    { path: '/styles.css', content: STYLES_CSS },
    { path: '/app.js', content: APP_JS },
  ],
};
