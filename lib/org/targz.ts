/**
 * Pure-Node tar.gz builder (no external deps) for the projects deploy artifact.
 *
 * The cloud projects `/deploy` endpoint accepts a tar or tar.gz of the BUILT
 * site (index.html at the root). We build a minimal, spec-correct ustar archive
 * in memory and gzip it with Node's built-in zlib — so publishing needs no npm
 * `tar` dependency (which isn't a top-level dep in this app).
 */
import 'server-only';

import { gzipSync } from 'node:zlib';

const BLOCK = 512;

export interface TarEntry {
  /** Relative site path, e.g. "index.html" or "assets/app.css". */
  name: string;
  /** File bytes. */
  data: Buffer;
}

/** Write an octal number into `len` bytes: (len-1) octal digits + a NUL. */
function writeOctal(buf: Buffer, offset: number, value: number, len: number): void {
  const s = value.toString(8).padStart(len - 1, '0') + '\0';
  buf.write(s, offset, len, 'ascii');
}

/** Build a single 512-byte ustar header for a regular file. */
function header(name: string, size: number, mtime: number): Buffer {
  const h = Buffer.alloc(BLOCK, 0);
  // name (100)
  h.write(name, 0, 100, 'utf8');
  writeOctal(h, 100, 0o644, 8); // mode
  writeOctal(h, 108, 0, 8); // uid
  writeOctal(h, 116, 0, 8); // gid
  writeOctal(h, 124, size, 12); // size
  writeOctal(h, 136, mtime, 12); // mtime
  h.write('        ', 148, 8, 'ascii'); // checksum placeholder (8 spaces)
  h.write('0', 156, 1, 'ascii'); // typeflag: regular file
  h.write('ustar\0', 257, 6, 'ascii'); // magic
  h.write('00', 263, 2, 'ascii'); // version

  // checksum = sum of all header bytes (with the checksum field as spaces)
  let sum = 0;
  for (let i = 0; i < BLOCK; i++) sum += h[i];
  h.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'ascii');
  return h;
}

/** Pad `data` up to the next 512-byte boundary. */
function pad(size: number): Buffer {
  const rem = size % BLOCK;
  return rem === 0 ? Buffer.alloc(0) : Buffer.alloc(BLOCK - rem, 0);
}

/** Build a gzipped tar (tar.gz) of the given entries. */
export function buildTarGz(entries: TarEntry[]): Buffer {
  const mtime = Math.floor(Date.now() / 1000);
  const parts: Buffer[] = [];
  for (const e of entries) {
    const name = e.name.replace(/^\/+/, '');
    if (!name || name.length > 100) continue; // ustar name limit; site paths are short
    parts.push(header(name, e.data.length, mtime));
    parts.push(e.data);
    parts.push(pad(e.data.length));
  }
  // Two zero blocks terminate the archive.
  parts.push(Buffer.alloc(BLOCK * 2, 0));
  return gzipSync(Buffer.concat(parts));
}
