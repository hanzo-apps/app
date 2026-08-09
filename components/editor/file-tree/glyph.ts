import {
  Braces,
  FileCode2,
  FileJson,
  FileText,
  FileType,
  Hash,
  Image,
  Settings2,
  type LucideIcon,
} from 'lucide-react';

/**
 * A file's icon, from its extension.
 *
 * Every row used to be `FileCode2`, so a stylesheet, a README and a favicon
 * were the same shape and the tree carried no information you could read
 * without going word by word.
 *
 * The glyph VARIES; the colour does not. Reference file browsers tint by type —
 * orange for HTML, blue for TS — and this app's chrome is monochrome by law,
 * with colour reserved for meaning (green live, red error). A green `.env` icon
 * would say "healthy" in the one vocabulary the rest of the product uses for
 * exactly that, so type is carried by shape, which is free.
 */
const BY_EXTENSION: Record<string, LucideIcon> = {
  html: FileCode2,
  htm: FileCode2,
  css: Hash,
  scss: Hash,
  js: Braces,
  mjs: Braces,
  cjs: Braces,
  jsx: Braces,
  ts: FileType,
  tsx: FileType,
  json: FileJson,
  md: FileText,
  mdx: FileText,
  txt: FileText,
  svg: Image,
  png: Image,
  jpg: Image,
  jpeg: Image,
  gif: Image,
  webp: Image,
  ico: Image,
  toml: Settings2,
  yml: Settings2,
  yaml: Settings2,
  env: Settings2,
};

export function glyphFor(name: string): LucideIcon {
  // `dotfiles` have no extension in the usual sense — `.env` splits to
  // `['', 'env']`, so reading the LAST segment is what makes it a settings file
  // rather than an unknown one.
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return BY_EXTENSION[ext] ?? FileText;
}
