// Shim for react-resizable-panels legacy exports (Group, Separator)
// @hanzo/ui re-exports these names but they were removed in react-resizable-panels v2+
// This re-exports the modern API under the old names.
export {
  PanelGroup as Group,
  PanelResizeHandle as Separator,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels';
