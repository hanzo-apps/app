// Shim for react-resizable-panels legacy exports (Group, Separator)
// @hanzo/ui re-exports these names but they were removed in react-resizable-panels v2+
// This re-exports the modern API under the old names.
//
// IMPORTANT: import the package's real dist ENTRY, not the bare specifier.
// next.config aliases the bare `react-resizable-panels` → this file; a bare
// re-export here aliases back to itself → infinite SSR recursion (crashed every
// dev-mode page). The `/dist/...` subpath bypasses the exact-match alias.
export {
  PanelGroup as Group,
  PanelResizeHandle as Separator,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels/dist/react-resizable-panels.js';
