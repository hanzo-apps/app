// One module that answers to BOTH generations of this package's names.
//
// `react-resizable-panels` renamed its primitives across majors: v2/v3 called
// them `PanelGroup`/`PanelResizeHandle`, v4 calls them `Group`/`Separator`.
// `@hanzo/ui`'s `resizable` module still imports the v2 names and the barrel
// pulls that module in, so the bare specifier has to carry both. next.config
// aliases `react-resizable-panels` (exact match) here.
//
// The mapping direction is derived FROM THE INSTALLED PACKAGE, never from the
// consumer: this re-exports what v4 actually ships and adds the legacy aliases.
// It used to do the reverse — `export { PanelGroup as Group }` — which under v4
// reads a name the package no longer has. webpack reports a missing named
// export as a WARNING, not an error, so the build stayed green while both
// legacy names were `undefined` at runtime and `<ResizablePanelGroup>` rendered
// "Element type is invalid".
//
// IMPORTANT: import the package's real dist ENTRY, not the bare specifier. A
// bare re-export here aliases back to itself → infinite SSR recursion (crashed
// every dev-mode page). The `/dist/...` subpath bypasses the exact-match alias.
export {
  Group,
  Group as PanelGroup,
  Panel,
  Separator,
  Separator as PanelResizeHandle,
} from 'react-resizable-panels/dist/react-resizable-panels.js';
