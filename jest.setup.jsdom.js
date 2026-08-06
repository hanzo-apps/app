// Browser APIs jsdom does not implement, installed BEFORE the test framework.
//
// `setupFiles`, not `setupFilesAfterEnv`: these have to exist while the test
// module's imports are evaluating, which is earlier than any hook can reach.
//
// This file belongs to the jsdom project alone. Projects in a Jest `projects`
// array inherit NOTHING from the root config — each is a complete config — so a
// polyfill placed in the shared setup silently applied to no project at all.
// Scoping it here makes the omission unrepresentable rather than merely fixed.

// IndexedDB stores values by structured clone, and jsdom defines neither the
// algorithm nor the global. Node's is the same algorithm, so borrow it rather
// than substituting JSON round-tripping, which would quietly turn the Dates on
// every project and checkpoint record into strings.
// Node's own `structuredClone` is NOT usable here: it returns objects built
// from Node's intrinsics, and jsdom is a separate realm, so a cloned buffer
// fails `x instanceof ArrayBuffer` against the window's ArrayBuffer. The VFS
// branches on exactly that check to decide a file is binary, so a cross-realm
// clone makes binary files vanish from checkpoints — a harness artifact that
// looks precisely like a data-loss bug. Rebuild in the caller's realm instead.
if (typeof globalThis.structuredClone !== 'function') {
  const clone = (v, seen) => {
    if (v === null || typeof v !== 'object') return v;
    if (seen.has(v)) return seen.get(v);
    let out;
    if (v instanceof Date) out = new Date(v.getTime());
    else if (v instanceof ArrayBuffer) out = v.slice(0);
    else if (ArrayBuffer.isView(v)) {
      out = new v.constructor(clone(v.buffer, seen), v.byteOffset, v.length);
    } else if (Array.isArray(v)) {
      out = []; seen.set(v, out);
      for (const item of v) out.push(clone(item, seen));
    } else if (v instanceof Map) {
      out = new Map(); seen.set(v, out);
      for (const [k, val] of v) out.set(clone(k, seen), clone(val, seen));
    } else if (v instanceof Set) {
      out = new Set(); seen.set(v, out);
      for (const item of v) out.add(clone(item, seen));
    } else {
      out = {}; seen.set(v, out);
      for (const k of Object.keys(v)) out[k] = clone(v[k], seen);
    }
    seen.set(v, out);
    return out;
  };
  globalThis.structuredClone = (value) => clone(value, new Map());
}

// IndexedDB. jsdom has none, and the VFS is built on it — so `vfs.init()`
// failed, left `initialized` false, and every subsequent call threw
// "VirtualFileSystem not initialized". That took out the whole VFS and
// checkpoint suites: the project store and the revision history, i.e. exactly
// the behaviour worth testing. The failure was invisible because those suites
// matched no Jest project and never ran at all.
require('fake-indexeddb/auto');

// jsdom ships `crypto.getRandomValues` but not `randomUUID`, and the VFS mints
// every project and checkpoint id with it. Delegate to Node's real
// implementation rather than inventing ids — a test that generates weaker ids
// than production is testing something else.
if (typeof globalThis.crypto?.randomUUID !== 'function') {
  const { randomUUID } = require('node:crypto');
  Object.defineProperty(globalThis.crypto, 'randomUUID', { value: randomUUID, configurable: true });
}

// @hanzogui/select calls window.matchMedia while its MODULE is evaluating, not
// on render, so every suite that so much as imported @hanzo/ui died at import
// time with "window.matchMedia is not a function" — six unrelated suites, and
// with them every release, since the test gate gives no image on a red run.
//
// It answers "no match", which is the honest reply: jsdom has no viewport and no
// user preferences, so nothing CAN truly match. A suite that cares about a
// particular query overrides this per case rather than leaning on a global lie.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    // Deprecated in the spec, still called by older listeners.
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}
