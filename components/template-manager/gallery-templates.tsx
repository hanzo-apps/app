'use client';

/**
 * GalleryTemplates — the REAL starter-kit picker.
 *
 * Sources the 69-strong hanzoai/gallery catalog from the same-origin
 * `/v1/templates` BFF (→ cloud `clients/templates`, the SAME catalog
 * console.hanzo.ai consumes) via `lib/api/templates`. Selecting a card opens it
 * in the builder through blue's existing `/dev?template=` wire. Monochrome, to
 * match console.hanzo.ai. Honest states: loading, live gallery, or an offline
 * banner over the built-in fallback set — never a fabricated card, never a crash.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  FileBox,
  Star,
  ArrowRight,
  Loader2,
  WifiOff,
  Package,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  fetchGalleryTemplates,
  templateBuilderLink,
  type GalleryTemplate,
} from '@/lib/api/templates';

export function GalleryTemplates() {
  const router = useRouter();
  const [templates, setTemplates] = useState<GalleryTemplate[]>([]);
  const [live, setLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [framework, setFramework] = useState('all');

  useEffect(() => {
    const ac = new AbortController();
    fetchGalleryTemplates(ac.signal)
      .then(({ templates, live }) => {
        setTemplates(templates);
        setLive(live);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, []);

  // Framework options derived from the REAL catalog (first token, e.g. "Next.js").
  const frameworks = useMemo(() => {
    const set = new Set<string>();
    for (const t of templates) {
      const fw = (t.framework || '').split(/[\s+]/)[0].trim();
      if (fw) set.add(fw);
    }
    return Array.from(set).sort();
  }, [templates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      if (framework !== 'all' && !t.framework.toLowerCase().startsWith(framework.toLowerCase()))
        return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.useCase.toLowerCase().includes(q) ||
        t.features.some((f) => f.toLowerCase().includes(q))
      );
    });
  }, [templates, query, framework]);

  const select = (t: GalleryTemplate) => router.push(templateBuilderLink(t));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading templates…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="pt-4 px-4 pb-3 sm:pt-6 sm:px-6 sm:pb-3 shrink-0">
        <div className="mx-auto max-w-7xl flex flex-col gap-3">
          {!live && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              <WifiOff className="h-4 w-4 shrink-0" />
              Showing built-in starters — the gallery is unreachable right now.
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {frameworks.length > 0 && (
              <Select value={framework} onValueChange={setFramework}>
                <SelectTrigger className="w-[150px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All frameworks</SelectItem>
                  {frameworks.map((fw) => (
                    <SelectItem key={fw} value={fw}>
                      {fw}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-3 pb-4 sm:px-6 sm:pt-3 sm:pb-6">
        <div className="mx-auto max-w-7xl">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md py-24">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No templates match your search</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Try a different query or framework.
                </p>
                <Button variant="outline" onClick={() => { setQuery(''); setFramework('all'); }}>
                  Clear filters
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((t) => (
                <button
                  key={t.slug}
                  onClick={() => select(t)}
                  className="group text-left border border-border rounded-lg overflow-hidden bg-card hover:border-foreground/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {/* Preview */}
                  <div className="relative w-full aspect-video bg-muted overflow-hidden">
                    {t.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.preview}
                        alt={t.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileBox className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-base line-clamp-1" title={t.title}>
                        {t.title}
                      </h3>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-0.5" />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2" title={t.description}>
                      {t.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {t.framework && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          {t.framework}
                        </Badge>
                      )}
                      {t.features.slice(0, 2).map((f) => (
                        <Badge key={f} variant="outline" className="text-xs px-1.5 py-0.5">
                          {f}
                        </Badge>
                      ))}
                      {t.features.length > 2 && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                          +{t.features.length - 2}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                      <span className="truncate">{t.category || t.useCase}</span>
                      {typeof t.rating === 'number' && (
                        <span className="flex items-center gap-1 shrink-0">
                          <Star className="h-3 w-3 fill-current" />
                          {t.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
