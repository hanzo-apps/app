/**
 * Local type shims for @hanzo/usage's /panel and /connected subpaths.
 *
 * The package's exports map points those subpaths' `types` at its raw
 * `src/*.tsx` (no dist .d.ts is shipped), so tsc pulls the package SOURCE
 * into our program and reports ~26 of ITS internal errors as ours. Runtime is
 * fine (next transpiles it); these ambient declarations shadow the src types
 * so our typecheck sees a clean boundary. Delete when @hanzo/usage ships
 * dist/panel.d.ts + dist/connected.d.ts.
 */
declare module '@hanzo/usage/panel' {
  import type { ComponentType } from 'react';
  // Untyped boundary on purpose — the real prop types live in the package's
  // src (which we must NOT pull into the program); any is honest here.
  export const UsagePanel: ComponentType<any>;
}

declare module '@hanzo/usage/connected' {
  import type { ComponentType } from 'react';
  export const ConnectedUsage: ComponentType<any>;
}
