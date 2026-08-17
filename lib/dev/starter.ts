"use client";

/**
 * THE app a new build starts from — one, and the same one every time.
 *
 * A prompt used to open an EMPTY builder: the model invented a whole page from
 * nothing, and until it finished there was nothing on screen, nothing to
 * publish, and no backend. So a submit now lays this document down first and the
 * prompt is applied ON TOP of it. The builder reads that as an EDIT rather than
 * a build from nothing (`isSameHtml` is false from the first paint, so the seed
 * takes the follow-up path), which is why the wiring below survives the first
 * turn: it is already there, and the model changes the app around it.
 *
 * It is BASE-WIRED, which is the whole reason it exists rather than being a
 * pretty page: the schema is declared as DDL where the platform provisions it
 * from, records go through `/v1/base/<collection>` (the collection is the first
 * path segment — there is no `/collections/` and no `/records/`), and the
 * signed-in person comes from `/v1/me`. That is the same contract
 * `BASE_SYSTEM_PROMPT` teaches, so the starter and a generated page are the same
 * shape of app; `start()` writes the Base flag on with it, so what the page
 * promises is what the build is set up to do.
 *
 * ONE starter. A second would be a fork in what "new" means, and a CHOICE of
 * starting point already has a home — the catalog, through
 * `/dev?template=<slug>&action=edit`. This is the default nobody chose.
 *
 * It is a `Page[]` because that is the builder's shape: one self-contained
 * document, no external CSS or JS of its own. The style layer is the one sheet
 * every generated page links (`lib/vendor` decides that URL, here as everywhere).
 *
 * The preview frame paints on an opaque origin, so the data calls answer only
 * once the app is published and signed in. The page therefore never pretends:
 * it renders its whole design immediately and SAYS which of the two it got.
 */

import type { Page } from "@/types";
import { TAGS } from "@/lib/vendor";
import { setBaseEnabled } from "@/lib/base/flag";
import { UNTITLED, saveWorkspace, startNewBuild } from "./workspace";

const HTML = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Notes</title>
${TAGS.design}
<style>
  body { margin: 0; }
  main { max-width: 46rem; margin: 0 auto; padding: 3rem 1.25rem 6rem; }
  header { margin-bottom: 2rem; }
  h1 { margin: 0 0 .35rem; }
  #who { margin: 0; color: var(--text-secondary, #a1a1a1); font-size: .875rem; }
  form { display: flex; gap: .5rem; margin-bottom: 1rem; }
  form input { flex: 1; min-width: 0; }
  #state { margin: 0 0 1rem; color: var(--text-secondary, #a1a1a1); font-size: .875rem; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; gap: .5rem; }
  li { display: flex; align-items: flex-start; gap: 1rem; padding: .875rem 1rem;
       border: 1px solid var(--border, rgba(255,255,255,.1)); border-radius: .625rem; }
  li p { margin: 0; flex: 1; overflow-wrap: anywhere; }
  time { color: var(--text-tertiary, #7a7a7a); font-size: .75rem; white-space: nowrap; }
</style>
</head>
<body>
<main>
  <header>
    <h1>Notes</h1>
    <p id="who">Checking your Hanzo account&hellip;</p>
  </header>

  <form id="write">
    <input id="body" type="text" placeholder="Write a note&hellip;" autocomplete="off" required/>
    <button type="submit">Save</button>
  </form>

  <p id="state">Loading&hellip;</p>
  <ul id="list"></ul>
</main>

<script>
/* hanzo-base-schema: CREATE TABLE notes (body TEXT NOT NULL); */
(function () {
  var list = document.getElementById('list');
  var state = document.getElementById('state');
  var who = document.getElementById('who');
  var write = document.getElementById('write');
  var body = document.getElementById('body');

  function say(text) { state.textContent = text; }

  function draw(notes) {
    list.replaceChildren();
    if (!notes.length) { say('No notes yet.'); return; }
    say('');
    notes.forEach(function (note) {
      var row = document.createElement('li');
      var text = document.createElement('p');
      text.textContent = note.body || '';
      var when = document.createElement('time');
      when.textContent = note.created ? new Date(note.created).toLocaleDateString() : '';
      row.append(text, when);
      list.append(row);
    });
  }

  function load() {
    return fetch('/v1/base/notes?sort=-created')
      .then(function (res) { if (!res.ok) throw res; return res.json(); })
      .then(function (data) { draw(data.items || []); })
      // Honest, and it names the one thing that fixes it. A fabricated row here
      // would read as a working app that quietly loses every note.
      .catch(function () { say('Notes load once this app is published and you are signed in.'); });
  }

  write.addEventListener('submit', function (event) {
    event.preventDefault();
    var text = body.value.trim();
    if (!text) return;
    fetch('/v1/base/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text })
    })
      .then(function (res) { if (!res.ok) throw res; body.value = ''; return load(); })
      // Same rule as the identity read: the write failed, and from a preview the
      // reason is that there is nothing to write to yet. "Sign in and try again"
      // named a cause this page cannot know and the reader has usually already
      // done.
      .catch(function () { say('That note did not save. Notes save once this app is published.'); });
  });

  // Who is signed in — Hanzo verifies it server-side, so the page never handles
  // a password, a token or a session of its own.
  //
  // THREE STATES, NOT TWO. An answer of "not authenticated" is the reader's to
  // act on; a request that could not be MADE is ours, and the preview frame is
  // that case every time — it paints on an opaque origin, so this fetch fails
  // transport and never reaches an identity. Collapsing the two told a signed-in
  // builder to sign in, on a screen they had already signed in to reach.
  fetch('/v1/me')
    .then(function (res) { return res.json(); })
    .then(function (me) {
      who.textContent = me && me.authenticated
        ? 'Signed in with Hanzo. Your notes are saved to this app\\'s database.'
        : 'Sign in with Hanzo to save notes.';
    })
    .catch(function () {
      who.textContent = 'Your Hanzo account appears here once this app is published.';
    });

  load();
  // Someone else's note should appear without a reload.
  setInterval(load, 5000);
})();
</script>
</body>
</html>
`;

/** The one starter, as the builder's own shape. */
export const STARTER: Page[] = [{ path: "index.html", html: HTML }];

/**
 * Begin a new build from it.
 *
 * Three things, because a new build is all three at once and splitting them is
 * how they drift: forget the previous unsaved build (its minted repo id, its
 * name and its working copy — otherwise this prompt commits into that project's
 * history), turn the Base backend ON (an explicit write, so someone who once
 * switched it off still gets a data plane with the app that needs one), and lay
 * the starter down as the working copy the builder restores on mount.
 *
 * Never throws: storage can be unavailable, and a build that opens empty is far
 * better than a submit that dies on the way.
 */
export function start(): void {
  if (typeof window === "undefined") return;
  startNewBuild();
  // A new build has no name yet, and a stale one from a template opened earlier
  // in this session would send the restore looking under that project's key.
  try {
    delete (window as { __projectName?: string }).__projectName;
  } catch {
    /* nothing to do */
  }
  setBaseEnabled(true);
  saveWorkspace(UNTITLED, STARTER, []);
}
