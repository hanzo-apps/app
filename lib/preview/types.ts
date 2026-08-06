export interface ProcessedFile {
  path: string;
  content: string | ArrayBuffer;
  mimeType: string;
  blobUrl?: string;
}

export interface Route {
  path: string;
  file: string;
  title?: string;
}

export interface CompiledProject {
  entryPoint: string;
  files: ProcessedFile[];
  routes: Route[];
  blobUrls: Map<string, string>;
}

/** Where the clicked element came from in SOURCE, when that is knowable.
 *  `at` is the edit target an agent acts on — "pricing.tsx:42". `via` records
 *  which mechanism answered: 'gui' is the compiler's own annotation (exact,
 *  post-flatten), 'react' is the dev fiber's _debugSource (works on projects
 *  we did not generate). Absent in a production bundle, which carries neither
 *  — correctly, since there is no source on the other end to edit. */
export interface SourceRef {
  at: string;
  component?: string;
  usedIn?: string;
  file?: string;
  line?: number;
  via: 'gui' | 'react';
}

export interface FocusContextPayload {
  domPath: string;
  tagName: string;
  attributes: Record<string, string>;
  source?: SourceRef;
  outerHTML: string;
}

export type PreviewMessage =
  | { type: 'navigate'; path: string }
  | { type: 'reload' }
  | { type: 'error'; error: string }
  | { type: 'selector-selection'; payload: FocusContextPayload }
  | { type: 'selector-cancelled' };

export type PreviewHostMessage = { type: 'selector-toggle'; active: boolean };
