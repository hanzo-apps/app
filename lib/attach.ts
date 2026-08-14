/**
 * What a composer accepts when a file is dropped on it.
 *
 * `read` is the whole contract, and it is about what the BROWSER can do with the
 * bytes — not about what the file is for:
 *   "text"  — the bytes ARE the message. Read as text and inline it; every chat
 *             endpoint takes text.
 *   "image" — read as a data URL and send as an image content part.
 *   "open"  — a container the browser cannot open (PDF, DOCX). It travels by name
 *             and size; pulling text out of it needs a server, and api.hanzo.ai
 *             serves no /v1/files today. Saying so here is why the composer can
 *             promise what it shows.
 *
 * The extension decides and the MIME type is only the fallback, because browsers
 * disagree on a drop: Windows reports "" for .md, Safari reports "text/plain"
 * for .csv.
 */
export type Read = 'text' | 'image' | 'open';

export const KINDS: { ext: string; mime: string; read: Read }[] = [
  { ext: '.pdf', mime: 'application/pdf', read: 'open' },
  { ext: '.png', mime: 'image/png', read: 'image' },
  { ext: '.jpg', mime: 'image/jpeg', read: 'image' },
  { ext: '.gif', mime: 'image/gif', read: 'image' },
  { ext: '.webp', mime: 'image/webp', read: 'image' },
  { ext: '.txt', mime: 'text/plain', read: 'text' },
  { ext: '.md', mime: 'text/markdown', read: 'text' },
  { ext: '.csv', mime: 'text/csv', read: 'text' },
  { ext: '.json', mime: 'application/json', read: 'text' },
  {
    ext: '.docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    read: 'open',
  },
];

/** For an `<input type="file">`, so the picker offers exactly what a drop takes. */
export const ACCEPT = KINDS.map((k) => `${k.mime},${k.ext}`).join(',');

/** 20 MB. A data URL rides inside a JSON body, so this is the message ceiling too. */
export const LIMIT = 20 * 1024 * 1024;

export function kindOf(file: File) {
  const dot = file.name.lastIndexOf('.');
  const ext = dot < 0 ? '' : file.name.slice(dot).toLowerCase();
  return (
    KINDS.find((k) => k.ext === ext) ??
    KINDS.find((k) => k.mime === file.type) ??
    // .jpeg is the same picture as .jpg and the only alias worth carrying.
    (ext === '.jpeg' ? KINDS.find((k) => k.ext === '.jpg') : undefined)
  );
}

export type Attachment = { id: string; file: File; read: Read };

/**
 * Keeps what can be carried, and says why anything was turned away. Refusing
 * silently is the failure here: a dropped file that simply vanishes reads as a
 * broken page.
 */
export function take(files: File[]): { kept: Attachment[]; refused: string[] } {
  const kept: Attachment[] = [];
  const refused: string[] = [];
  for (const file of files) {
    const kind = kindOf(file);
    if (!kind) refused.push(`${file.name} — not a kind we read`);
    else if (file.size > LIMIT) refused.push(`${file.name} — over 20 MB`);
    else kept.push({ id: `${file.name}:${file.size}:${file.lastModified}`, file, read: kind.read });
  }
  return { kept, refused };
}

/** Reads what can be read. An "open" kind carries its name and nothing else. */
export async function contents(list: Attachment[]) {
  return Promise.all(
    list.map(
      ({ file, read }) =>
        new Promise<{ name: string; read: Read; body: string }>((resolve) => {
          if (read === 'open') return resolve({ name: file.name, read, body: '' });
          const reader = new FileReader();
          reader.onload = () => resolve({ name: file.name, read, body: String(reader.result ?? '') });
          // A file that will not read is still a file the user attached, so it
          // degrades to its name rather than disappearing.
          reader.onerror = () => resolve({ name: file.name, read: 'open', body: '' });
          if (read === 'image') reader.readAsDataURL(file);
          else reader.readAsText(file);
        })
    )
  );
}

/**
 * How much of a readable file goes into a prompt.
 *
 * LIMIT is what a file may WEIGH; this is what it may SAY. A 20 MB .json is a
 * legal attachment and an illegal prompt, so the text is cut here and the cut is
 * announced — a silently truncated file is a wrong answer with no explanation.
 */
export const INLINE = 200_000;

/** The attachments as prompt text: what we can read, inline; the rest by name. */
export async function inline(list: Attachment[]) {
  const read = await contents(list);
  return read
    .map(({ name, read: kind, body }) => {
      if (kind !== 'text') return `[attached: ${name}]`;
      const cut = body.length > INLINE;
      return `--- ${name}${cut ? ` (first ${INLINE} characters)` : ''} ---\n${body.slice(0, INLINE)}`;
    })
    .join('\n\n');
}

/**
 * The composer hands its attachments to the builder here.
 *
 * IndexedDB, because a File is not JSON and the trip is not always short. A
 * signed-in visitor goes to the builder by `router.push`, which keeps the JS
 * context — a `window.__initialFiles` would have been enough for them. A
 * logged-out visitor is bounced through login, a TOP-LEVEL navigation that
 * destroys the context, and that is the path most first-time visitors take. So
 * the store has to outlive the page, and IndexedDB is the one that both survives
 * navigation and structured-clones a File without turning it into base64.
 *
 * Text never comes through here: the composer has already read it into the
 * prompt, and the prompt travels in localStorage. Only pictures make this trip.
 */
const DB = 'hanzo-attach';
const STORE = 'seed';
const KEY = 'files';

/** One request, one transaction. Resolves undefined on any failure — a handoff
 *  that cannot happen must not take the submit down with it. */
function withStore<T>(
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest
): Promise<T | undefined> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(undefined);
    let open: IDBOpenDBRequest;
    try {
      open = indexedDB.open(DB, 1);
    } catch {
      return resolve(undefined);
    }
    open.onupgradeneeded = () => open.result.createObjectStore(STORE);
    open.onerror = () => resolve(undefined);
    open.onsuccess = () => {
      const db = open.result;
      let req: IDBRequest;
      try {
        req = run(db.transaction(STORE, mode).objectStore(STORE));
      } catch {
        db.close();
        return resolve(undefined);
      }
      req.onsuccess = () => {
        resolve(req.result as T);
        db.close();
      };
      req.onerror = () => {
        resolve(undefined);
        db.close();
      };
    };
  });
}

export const seed = (list: Attachment[]) => withStore('readwrite', (s) => s.put(list, KEY));

/** Reads the handoff and clears it: a seed is spent once. */
export async function claim(): Promise<Attachment[]> {
  const got = await withStore<Attachment[]>('readonly', (s) => s.get(KEY));
  await withStore('readwrite', (s) => s.delete(KEY));
  return got ?? [];
}
