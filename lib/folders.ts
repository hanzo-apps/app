/**
 * Project folders — app-side grouping over the cloud projects list.
 *
 * BACKEND GAP (flagged honestly): the cloud projectsvc `Project` model has NO
 * folder/parent field (see lib/api/projects.ts — id, org, slug, name, repo,
 * framework, status, timestamps only). So folders are persisted HERE, in the
 * browser (localStorage), as a real-but-local grouping: a folder list + a
 * slug→folderId assignment map. This persists across reloads on THIS device but
 * does not yet sync across devices/teammates — that needs a `folderId` on the
 * projectsvc record (or a `/v1/folders` store). We do the real local part rather
 * than fake a cloud folder that wouldn't persist.
 *
 * Reactive: mutations emit `hanzo:folders-changed` so `useFolders` consumers
 * (sidebar, dashboard) re-read in sync.
 */

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

const FOLDERS_KEY = 'hanzo-app-folders';
const ASSIGN_KEY = 'hanzo-app-folder-assignments';
const CHANGED_EVENT = 'hanzo:folders-changed';

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(CHANGED_EVENT));
  } catch {
    // storage full/unavailable — folders are best-effort, never fatal
  }
}

export const FOLDERS_CHANGED_EVENT = CHANGED_EVENT;

export function listFolders(): Folder[] {
  return readJson<Folder[]>(FOLDERS_KEY, []).sort((a, b) => a.createdAt - b.createdAt);
}

export function createFolder(name: string): Folder {
  const folder: Folder = {
    id: `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim() || 'Untitled folder',
    createdAt: Date.now(),
  };
  writeJson(FOLDERS_KEY, [...listFolders(), folder]);
  return folder;
}

export function renameFolder(id: string, name: string): void {
  writeJson(
    FOLDERS_KEY,
    listFolders().map((f) => (f.id === id ? { ...f, name: name.trim() || f.name } : f)),
  );
}

export function deleteFolder(id: string): void {
  writeJson(
    FOLDERS_KEY,
    listFolders().filter((f) => f.id !== id),
  );
  const assign = readJson<Record<string, string>>(ASSIGN_KEY, {});
  for (const slug of Object.keys(assign)) if (assign[slug] === id) delete assign[slug];
  writeJson(ASSIGN_KEY, assign);
}

/** Assign a project (by slug) to a folder, or pass null to remove it. */
export function assignProjectToFolder(slug: string, folderId: string | null): void {
  const assign = readJson<Record<string, string>>(ASSIGN_KEY, {});
  if (folderId) assign[slug] = folderId;
  else delete assign[slug];
  writeJson(ASSIGN_KEY, assign);
}

export function folderOf(slug: string): string | null {
  return readJson<Record<string, string>>(ASSIGN_KEY, {})[slug] ?? null;
}

export function slugsInFolder(folderId: string): string[] {
  const assign = readJson<Record<string, string>>(ASSIGN_KEY, {});
  return Object.keys(assign).filter((slug) => assign[slug] === folderId);
}
