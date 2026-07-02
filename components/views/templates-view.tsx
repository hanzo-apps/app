'use client';

import { GalleryTemplates } from '@/components/template-manager/gallery-templates';

interface TemplatesViewProps {
  onProjectSelect?: (project: { id: string }) => void;
  onNavigate?: (view: string) => void;
}

/**
 * The Templates picker — now the REAL hanzoai/gallery (69 starter kits) via the
 * same-origin `/v1/templates` BFF (the SAME catalog console.hanzo.ai consumes),
 * NOT the old local placeholders. Selecting a template opens it in the builder
 * through blue's `/dev?template=` wire; the gallery client degrades gracefully to
 * the built-in starter set (with an honest banner) when the endpoint is
 * unreachable. `onProjectSelect`/`onNavigate` are retained for API compatibility
 * (the builder handoff happens via the `/dev?template=` deep-link).
 */
export function TemplatesView(_props: TemplatesViewProps) {
  return <GalleryTemplates />;
}
