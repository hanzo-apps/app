/**
 * Read a dropped/selected project into staged text files — the client side of
 * "drag & drop your project".
 *
 * Sources, one honest path each:
 *   - a `.zip`            → unzipped in-browser with fflate (small, fast)
 *   - a folder            → walked via the File System Entries API (webkitEntry)
 *   - loose files         → taken as-is
 *
 * The builder edits self-contained text files (HTML pages + their CSS/JS), so we
 * keep text and DROP the noise: junk dirs (`node_modules/`, `.git/`, build
 * output), secrets (`.env*`), lockfiles, and binaries (detected by a NUL byte).
 * Everything is bounded (zip size, file count, per-file + total bytes) so a giant
 * or hostile drop can't hang the tab or blow memory — over-cap files are skipped
 * and reported, never silently swallowed.
 */
import { unzip, type Unzipped } from 'fflate';

export interface StagedFile {
  /** Project-relative path, e.g. `index.html`, `assets/app.css`. */
  path: string;
  /** UTF-8 text content. */
  text: string;
}

export interface DropReadResult {
  files: StagedFile[];
  /** Count of inputs skipped (junk, secrets, binary, or over a cap). */
  skipped: number;
  /** Best-effort project name from the dropped folder / zip. */
  name: string;
  /** Fatal reason when nothing usable could be read (e.g. zip too large). */
  error?: string;
}

const MAX_ZIP_BYTES = 50 * 1024 * 1024; // reject a zip larger than this outright
const MAX_FILES = 500; // publish caps at 500 pages — stay within it
const MAX_PER_FILE = 2 * 1024 * 1024; // 2 MiB per text file
const MAX_TOTAL = 12 * 1024 * 1024; // 12 MiB total (matches the publish budget)

const JUNK_DIR =
  /(^|\/)(node_modules|\.git|\.next|\.turbo|\.cache|\.parcel-cache|dist|build|out|coverage|\.vercel|\.netlify|\.svn|\.hg|__pycache__|\.venv|venv|vendor|\.idea|\.vscode)(\/|$)/i;
const JUNK_FILE =
  /(^|\/)(\.DS_Store|Thumbs\.db|\.env(\.[\w.-]+)?|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb)$/i;

/** A path we never import: build/dep noise, secrets, lockfiles. */
function isJunk(path: string): boolean {
  return JUNK_DIR.test(path) || JUNK_FILE.test(path);
}

/** Text unless it carries a NUL in the first 8 KiB (a reliable binary tell). */
function isProbablyText(bytes: Uint8Array): boolean {
  const n = Math.min(bytes.length, 8192);
  for (let i = 0; i < n; i++) if (bytes[i] === 0) return false;
  return true;
}

const decoder = new TextDecoder('utf-8', { fatal: false });

/** Normalize a raw entry path to a clean project-relative posix path. */
function cleanPath(raw: string): string {
  return raw.replace(/\\/g, '/').replace(/^\.?\//, '').replace(/^\/+/, '');
}

/**
 * Accumulates staged files under all caps. Returns false once a hard cap
 * (count/total) is hit so the caller can stop early and report the remainder.
 */
class Collector {
  files: StagedFile[] = [];
  skipped = 0;
  total = 0;
  capped = false;

  add(rawPath: string, bytes: Uint8Array): boolean {
    const path = cleanPath(rawPath);
    if (!path || path.endsWith('/')) return true; // directory marker
    if (isJunk(path)) {
      this.skipped++;
      return true;
    }
    if (bytes.length > MAX_PER_FILE || !isProbablyText(bytes)) {
      this.skipped++;
      return true;
    }
    if (this.files.length >= MAX_FILES || this.total + bytes.length > MAX_TOTAL) {
      this.skipped++;
      this.capped = true;
      return false;
    }
    this.files.push({ path, text: decoder.decode(bytes) });
    this.total += bytes.length;
    return true;
  }
}

/** Strip a single shared top-level dir so `proj/index.html` → `index.html`. */
function stripCommonRoot(files: StagedFile[]): StagedFile[] {
  if (files.length === 0) return files;
  const first = files[0].path.split('/')[0];
  if (!first) return files;
  const shared = files.every((f) => f.path === first || f.path.startsWith(first + '/'));
  if (!shared) return files;
  return files.map((f) => ({
    path: f.path.slice(first.length + 1) || f.path,
    text: f.text,
  }));
}

function unzipAsync(data: Uint8Array): Promise<Unzipped> {
  return new Promise((resolve, reject) => {
    unzip(data, (err, out) => (err ? reject(err) : resolve(out)));
  });
}

async function collectZip(file: File, c: Collector): Promise<void> {
  if (file.size > MAX_ZIP_BYTES) throw new Error('zip-too-large');
  const buf = new Uint8Array(await file.arrayBuffer());
  const entries = await unzipAsync(buf);
  for (const [path, bytes] of Object.entries(entries)) {
    if (!c.add(path, bytes)) break;
  }
}

// ── File System Entries API (folder drops) ────────────────────────────────────

interface FsEntry {
  isFile: boolean;
  isDirectory: boolean;
  fullPath: string;
  file?: (cb: (f: File) => void, err: (e: unknown) => void) => void;
  createReader?: () => {
    readEntries: (cb: (e: FsEntry[]) => void, err: (e: unknown) => void) => void;
  };
}

function entryFile(entry: FsEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file!(resolve, reject));
}

function readDir(entry: FsEntry): Promise<FsEntry[]> {
  const reader = entry.createReader!();
  const all: FsEntry[] = [];
  return new Promise((resolve, reject) => {
    const step = () =>
      reader.readEntries((batch) => {
        if (batch.length === 0) resolve(all);
        else {
          all.push(...batch);
          step(); // readEntries returns in chunks — keep going until empty
        }
      }, reject);
    step();
  });
}

async function walkEntry(entry: FsEntry, c: Collector): Promise<void> {
  if (c.capped) return;
  if (entry.isDirectory) {
    if (isJunk(cleanPath(entry.fullPath) + '/')) return; // prune junk subtrees
    for (const child of await readDir(entry)) {
      if (c.capped) return;
      await walkEntry(child, c);
    }
    return;
  }
  if (!entry.isFile) return;
  const file = await entryFile(entry);
  const path = entry.fullPath || file.name;
  if (/\.zip$/i.test(file.name)) {
    await collectZip(file, c);
    return;
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  c.add(path, bytes);
}

function bestName(entries: FsEntry[], firstZip?: File): string {
  const dir = entries.find((e) => e.isDirectory);
  if (dir) return cleanPath(dir.fullPath) || 'project';
  if (firstZip) return firstZip.name.replace(/\.zip$/i, '') || 'project';
  return 'project';
}

/**
 * Read a drop's `DataTransfer`. Entries MUST be captured synchronously (the item
 * list is invalidated after the first await), so we snapshot them up front.
 */
export async function readDrop(dt: DataTransfer): Promise<DropReadResult> {
  const c = new Collector();
  // Snapshot synchronously: the DataTransfer's items/files are invalidated once
  // the drop handler's tick ends, so capture everything BEFORE the first await.
  const items = Array.from(dt.items).filter((i) => i.kind === 'file');
  const entries = items
    .map((i) => (i.webkitGetAsEntry?.() as FsEntry | null) ?? null)
    .filter((e): e is FsEntry => e != null);
  const looseFiles = Array.from(dt.files);

  try {
    if (entries.length > 0) {
      const firstZip = looseFiles.find((f) => /\.zip$/i.test(f.name));
      for (const entry of entries) await walkEntry(entry, c);
      const files = stripCommonRoot(c.files);
      return finalize(files, c, bestName(entries, firstZip));
    }
    // No entries API (rare) — fall back to the flat FileList.
    return await readFiles(looseFiles, c);
  } catch (e) {
    if (e instanceof Error && e.message === 'zip-too-large') {
      return { files: [], skipped: 0, name: 'project', error: 'That .zip is over the 50 MB limit.' };
    }
    return { files: [], skipped: 0, name: 'project', error: 'Could not read that drop.' };
  }
}

/** Read a picked FileList (`<input type=file>` / `webkitdirectory`). */
export async function readFileList(list: FileList | File[]): Promise<DropReadResult> {
  try {
    return await readFiles(Array.from(list), new Collector());
  } catch (e) {
    if (e instanceof Error && e.message === 'zip-too-large') {
      return { files: [], skipped: 0, name: 'project', error: 'That .zip is over the 50 MB limit.' };
    }
    return { files: [], skipped: 0, name: 'project', error: 'Could not read those files.' };
  }
}

async function readFiles(list: File[], c: Collector): Promise<DropReadResult> {
  const zips = list.filter((f) => /\.zip$/i.test(f.name));
  for (const zip of zips) {
    await collectZip(zip, c);
    if (c.capped) break;
  }
  for (const f of list) {
    if (c.capped) break;
    if (/\.zip$/i.test(f.name)) continue;
    // webkitRelativePath preserves folder structure from a directory picker.
    const path = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
    const bytes = new Uint8Array(await f.arrayBuffer());
    c.add(path, bytes);
  }
  const name = zips[0]?.name.replace(/\.zip$/i, '') || 'project';
  return finalize(stripCommonRoot(c.files), c, name);
}

function finalize(files: StagedFile[], c: Collector, name: string): DropReadResult {
  if (files.length === 0) {
    return {
      files: [],
      skipped: c.skipped,
      name,
      error: 'No importable text files found (binaries, build output, and secrets are skipped).',
    };
  }
  return { files, skipped: c.skipped, name };
}
