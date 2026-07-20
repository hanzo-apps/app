'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TemplateManager } from '@/components/template-manager';
import {
  type GalleryTemplate,
  snapshotCatalog,
  catalogCategories,
} from '@/lib/gallery-catalog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TemplateThumb } from '@/components/template-thumb';
import { Search, Star, Code, Eye, Sparkles, Package } from 'lucide-react';

interface TemplatesViewProps {
  onProjectSelect?: (project: { id: string }) => void;
  onNavigate?: (view: string) => void;
}

type Mode = 'gallery' | 'custom';

// Start a real gallery template in the builder — the ONE established wire
// (`/dev?template=hanzo-apps/<slug>`), shared with `/gallery` and dev-onboarding.
// `/dev` resolves the slug to seed metadata (resolveTemplateSeedMeta) and
// auto-starts the first generation; middleware preserves the deep link through
// any login bounce, so this is a single robust click for authed and anon users.
function forkHref(t: GalleryTemplate) {
  return `/dev?template=hanzo-apps/${t.slug}&action=edit`;
}

export function TemplatesView({ onProjectSelect }: TemplatesViewProps) {
  const router = useRouter();

  const handleProjectCreated = (projectId: string) => {
    if (onProjectSelect) {
      onProjectSelect({ id: projectId });
    } else {
      router.push(`/workspace/${projectId}`);
    }
  };

  const [mode, setMode] = useState<Mode>('gallery');

  // Gallery templates: the bundled snapshot seeds the first paint (instant,
  // never empty), then the live catalog (gallery.hanzo.ai, via the same-origin
  // `/v1/gallery` proxy) replaces it. Live always wins — the snapshot only ever
  // stands in when the catalog is briefly unreachable, so it never masks it.
  const [templates, setTemplates] = useState<GalleryTemplate[]>(
    () => snapshotCatalog().templates,
  );
  const [syncing, setSyncing] = useState(true);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    fetch('/v1/gallery')
      .then((r) => r.json())
      .then((d) => {
        if (alive && Array.isArray(d.templates) && d.templates.length) {
          setTemplates(d.templates);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setSyncing(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const categories = useMemo(() => catalogCategories(templates), [templates]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return templates.filter((t) => {
      const matchesCategory = category === 'All' || t.category === category;
      const matchesQuery =
        !q ||
        t.displayName.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.features.some((f) => f.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [templates, category, query]);

  return (
    <div className="h-full flex flex-col">
      {/* Mode toggle: the great gallery templates vs. your imported/built-in ones */}
      <div className="pt-4 px-4 pb-3 sm:pt-6 sm:px-6 shrink-0">
        <div className="mx-auto max-w-7xl flex items-center gap-2">
          <div className="flex rounded-full border p-0.5">
            <button
              onClick={() => setMode('gallery')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                mode === 'gallery'
                  ? 'bg-secondary text-secondary-foreground'
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
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Package className="h-4 w-4" />
              My Templates
            </button>
          </div>
          {mode === 'gallery' && (
            <Badge variant="secondary" className="ml-auto">
              {filtered.length} template{filtered.length === 1 ? '' : 's'}
              {syncing ? ' · syncing…' : ''}
            </Badge>
          )}
        </div>
      </div>

      {mode === 'custom' ? (
        <div className="flex-1 min-h-0">
          <TemplateManager onProjectCreated={handleProjectCreated} />
        </div>
      ) : (
        <>
          {/* Gallery search + category filters */}
          <div className="px-4 pb-3 sm:px-6 shrink-0">
            <div className="mx-auto max-w-7xl flex flex-col gap-3">
              <div className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto sm:flex-wrap [scrollbar-width:none]">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`rounded-full px-3 py-2 sm:py-1.5 text-xs font-medium shrink-0 whitespace-nowrap transition-colors ${
                      category === cat
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Gallery grid — every card starts a new project from that template */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="mx-auto max-w-7xl">
              {filtered.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center max-w-md">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No templates found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Nothing matches your search. Try a different term or category.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuery('');
                        setCategory('All');
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map((t) => (
                    <div
                      key={t.slug}
                      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-foreground/30 hover:-translate-y-0.5"
                    >
                      <button
                        onClick={() => router.push(forkHref(t))}
                        className="relative block aspect-[16/10] bg-muted overflow-hidden text-left"
                        aria-label={`Start from ${t.displayName}`}
                      >
                        <TemplateThumb
                          name={t.displayName}
                          category={t.category}
                          slug={t.slug}
                          className="transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[11px] text-white">
                          <Star className="h-3 w-3 fill-white" />
                          {t.rating}
                        </div>
                        <Badge className="absolute top-2 right-2 bg-black/70 text-white border-transparent text-[11px]">
                          {t.category}
                        </Badge>
                      </button>

                      <div className="flex flex-col flex-1 p-4">
                        <h3 className="font-medium line-clamp-1" title={t.displayName}>
                          {t.displayName}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2.5rem]">
                          {t.description || t.useCase || `${t.framework} template`}
                        </p>
                        <p className="text-[11px] text-muted-foreground/70 mt-2">{t.framework}</p>

                        <div className="flex gap-2 mt-auto pt-3">
                          <Button
                            size="sm"
                            className="flex-1 gap-1 h-10 sm:h-9"
                            onClick={() => router.push(forkHref(t))}
                          >
                            <Code className="h-3 w-3" />
                            Use template
                          </Button>
                          <a href={t.templateUrl} target="_blank" rel="noreferrer">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-10 w-10 sm:h-9 sm:w-9"
                              aria-label={`Preview ${t.displayName}`}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
