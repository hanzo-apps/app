/**
 * Copy the pinned library bytes out of node_modules and into `public/vendor/`.
 *
 * Runs on install and before build, so the files a generated site loads are
 * whatever `package.json` pins — never whatever a CDN is serving today.
 *
 * It FAILS the build if a source is missing. The alternative is a silent skip,
 * and a silent skip here means every generated page loads a 404 for Tailwind
 * and renders unstyled: a defect that survives every check we have, because the
 * app itself is fine and only the customers' sites are broken.
 */
import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Read the map from lib/vendor.ts rather than restating it. A second copy of
// this list is a second thing to keep in step, and the one that drifts is
// always the one nobody is looking at.
const source = readFileSync(join(root, 'lib/vendor.ts'), 'utf8');
const entries = [...source.matchAll(/from:\s*'([^']+)',\s*file:\s*'([^']+)'/g)].map((m) => ({
  from: m[1],
  file: m[2],
}));
if (!entries.length) throw new Error('vendor: no libraries parsed out of lib/vendor.ts');

const out = join(root, 'public', 'vendor');
mkdirSync(out, { recursive: true });

let total = 0;
for (const { from, file } of entries) {
  // TWO WAYS IN, because packages disagree about which one they leave open.
  //
  // Asking for the file directly is the honest question, and it is the only one
  // that works for `@hanzo/design`: its `exports` map is strict and does not
  // list `./package.json`, so resolving the root throws
  // ERR_PACKAGE_PATH_NOT_EXPORTED even though the file is right there.
  //
  // Resolving the ROOT and joining is what works for a package whose `exports`
  // lists only its entry points — `feather-icons/dist/feather.min.js` is a real
  // file that the map does not name, and asking for it directly throws for the
  // mirror-image reason.
  //
  // Neither alone covers the list, so try the subpath, then the root.
  const parts = from.split('/');
  const pkg = from.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  const sub = from.slice(pkg.length + 1);
  const attempt = (f) => {
    const p = f();
    statSync(p);
    return p;
  };
  let src;
  try {
    src = attempt(() => require.resolve(from));
  } catch {
    try {
      src = attempt(() => join(dirname(require.resolve(`${pkg}/package.json`)), sub));
    } catch {
      throw new Error(`vendor: cannot resolve ${from} — is ${pkg} in package.json?`);
    }
  }
  const dest = join(out, file);
  mkdirSync(dirname(dest), { recursive: true }); // `images/marker-icon.png` is nested
  copyFileSync(src, dest);
  const bytes = statSync(dest).size;
  if (!bytes) throw new Error(`vendor: ${file} copied as 0 bytes`);
  total += bytes;
  console.log(`  vendor  ${file.padEnd(14)} ${(bytes / 1024).toFixed(0).padStart(5)} KB  <- ${from}`);
}
console.log(`  vendor  ${entries.length} files, ${(total / 1024).toFixed(0)} KB total`);
