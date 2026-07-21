'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TemplateManager } from '@/components/template-manager';
import { TemplateGallery } from '@/components/template-gallery';
import { Sparkles, Package } from 'lucide-react';

interface TemplatesViewProps {
  onProjectSelect?: (project: { id: string }) => void;
  onNavigate?: (view: string) => void;
}

type Mode = 'gallery' | 'custom';

// The in-app Templates view. Gallery mode renders the SAME `TemplateGallery` as
// the public `/gallery` route — one categorized surface over the SEO catalog SOT
// (lib/templates-catalog), no live gallery.hanzo.ai fetch. "My Templates" keeps
// the existing custom/imported template manager. Cards open the detail page
// /templates/<slug>; "Use template" forks into the builder.
export function TemplatesView({ onProjectSelect }: TemplatesViewProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('gallery');

  const handleProjectCreated = (projectId: string) => {
    if (onProjectSelect) {
      onProjectSelect({ id: projectId });
    } else {
      router.push(`/workspace/${projectId}`);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* Mode toggle: the curated gallery vs. your imported/built-in templates. */}
      <div className="shrink-0 px-5 pt-5 sm:px-8 sm:pt-6">
        <div className="mx-auto flex max-w-7xl items-center">
          <div className="flex rounded-full border border-border p-0.5">
            <button
              onClick={() => setMode('gallery')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                mode === 'gallery'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Gallery
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                mode === 'custom'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Package className="h-4 w-4" />
              My Templates
            </button>
          </div>
        </div>
      </div>

      {mode === 'custom' ? (
        <div className="min-h-0 flex-1">
          <TemplateManager onProjectCreated={handleProjectCreated} />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <TemplateGallery />
        </div>
      )}
    </div>
  );
}
