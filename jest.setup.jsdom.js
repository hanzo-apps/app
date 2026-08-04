// Browser APIs jsdom does not implement, installed BEFORE the test framework.
//
// `setupFiles`, not `setupFilesAfterEnv`: these have to exist while the test
// module's imports are evaluating, which is earlier than any hook can reach.
//
// This file belongs to the jsdom project alone. Projects in a Jest `projects`
// array inherit NOTHING from the root config — each is a complete config — so a
// polyfill placed in the shared setup silently applied to no project at all.
// Scoping it here makes the omission unrepresentable rather than merely fixed.

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
