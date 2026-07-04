/**
 * Hand-off store for a dropped project between `/new` (where it's read) and
 * `/dev` (where it seeds the editor).
 *
 * IndexedDB, not localStorage: a real project's text can exceed the ~5 MB
 * localStorage ceiling, and IndexedDB stores structured data without a JSON
 * re-encode. One DB, one object store, one record (`current`) — the last drop
 * wins. Same-origin, so `/dev` reads exactly what `/new` wrote. The record is
 * cleared the moment `/dev` consumes it, so a project is imported once.
 */
import type { StagedFile } from './read-drop';

const DB_NAME = 'hanzo-import';
const STORE = 'staged';
const KEY = 'current';

export interface StagedProject {
  name: string;
  files: StagedFile[];
  createdAt: number;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = run(tx.objectStore(STORE));
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

/** Persist the dropped project for the /dev seam to pick up. */
export async function stageProject(name: string, files: StagedFile[]): Promise<void> {
  const project: StagedProject = { name, files, createdAt: Date.now() };
  await withStore<IDBValidKey>('readwrite', (s) => s.put(project, KEY));
}

/** Read the staged project (or null). */
export async function readStagedProject(): Promise<StagedProject | null> {
  try {
    const v = await withStore<StagedProject | undefined>('readonly', (s) => s.get(KEY));
    return v ?? null;
  } catch {
    return null;
  }
}

/** Clear the staged project once it's been consumed. */
export async function clearStagedProject(): Promise<void> {
  try {
    await withStore<undefined>('readwrite', (s) => s.delete(KEY));
  } catch {
    /* best-effort */
  }
}
