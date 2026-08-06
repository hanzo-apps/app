/**
 * A project has to be able to hold its own typography.
 *
 * Fonts were absent from the supported set, and absence there is not "skipped" —
 * `isFileSupported` rejects an unlisted extension, so storing a face threw and
 * no font blob could exist for the preview to point a `@font-face` at.
 */
import {
  getFileTypeFromPath,
  getSpecificMimeType,
  isFileSupported,
  FILE_SIZE_LIMITS,
} from '@/lib/vfs/types';

const FACES = ['woff2', 'woff', 'ttf', 'otf', 'eot'] as const;

describe('fonts are files a project can own', () => {
  it.each(FACES)('accepts a .%s face', (ext) => {
    expect(isFileSupported(`/fonts/satoshi.${ext}`)).toBe(true);
  });

  it.each(FACES)('types a .%s face as binary, so its bytes are carried', (ext) => {
    expect(getFileTypeFromPath(`/fonts/satoshi.${ext}`)).toBe('binary');
  });

  it('gives a binary face a size limit to be checked against', () => {
    expect(FILE_SIZE_LIMITS.binary).toBeGreaterThan(0);
  });

  it.each([
    ['woff2', 'font/woff2'],
    ['woff', 'font/woff'],
    ['ttf', 'font/ttf'],
    ['otf', 'font/otf'],
    ['eot', 'application/vnd.ms-fontobject'],
  ])('serves a .%s face as %s, not octet-stream', (ext, mime) => {
    expect(getSpecificMimeType(`/fonts/satoshi.${ext}`)).toBe(mime);
  });

  it('still knows the kinds it already knew', () => {
    expect(getSpecificMimeType('/css/style.css')).toBe('text/css');
    expect(getFileTypeFromPath('/index.html')).toBe('html');
    expect(getFileTypeFromPath('/images/a.png')).toBe('image');
  });
});
