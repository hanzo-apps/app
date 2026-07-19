'use client';

/**
 * /resources — "Start from a template to build your next project."
 *
 * The rich template gallery, sourced from the real catalog (lib/gallery-catalog
 * live/snapshot) merged with the games catalog (lib/resources-catalog — the
 * games→templates merge: games are a CATEGORY here, not a top-level surface).
 *
 * A template card → preview modal → "Use template" → the Remix dialog
 * (ownership acknowledgment) → the animated Remix progress (real create +
 * provision + seed) → the builder. Game cards open their existing detail page.
 */

import { useEffect, useMemo, useState } from 'react';
import { Badge, Input } from '@hanzo/ui';
import { Search, Star, Sparkles, Gamepad2, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { snapshotCatalog } from '@/lib/gallery-catalog';
import {
  mergeResources,
  resourceCategories,
  type ResourceItem,
} from '@/lib/resources-catalog';
import { TemplatePreviewModal } from '@/components/remix/template-preview-modal';
import { RemixDialog } from '@/components/remix/remix-dialog';
import { RemixProgress } from '@/components/remix/remix-progress';

export default function ResourcesPage() {
  const [items, setItems] = useState<ResourceItem[]>(() =>
    mergeResources(snapshotCatalog().templates),
  );
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');

  // Remix flow state.
  const [selected, setSelected] = useState<ResourceItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [remixOpen, setRemixOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [remixName, setRemixName] = useState('');

  // Refresh templates from the live gallery (games are static, local).
  useEffect(() => {
    let alive = true;
    fetch('/v1/gallery')
      .then((r) => r.json())
      .then((d) => {
        if (alive && Array.isArray(d.templates) && d.templates.length) {
          setItems(mergeResources(d.templates));
        }
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const categories = useMemo(() => resourceCategories(items), [items]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return items.filter((it) => {
      const matchesCat = category === 'All' || it.category === category;
      const matchesSearch =
        !q ||
        it.title.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q) ||
        it.framework.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [items, category, query]);

  const openPreview = (item: ResourceItem) => {
    setSelected(item);
    setPreviewOpen(true);
  };

  const startRemix = (item: ResourceItem) => {
    setSelected(item);
    setPreviewOpen(false);
    setRemixOpen(true);
  };

  const confirmRemix = (name: string) => {
    setRemixName(name);
    setRemixOpen(false);
    setProgressOpen(true);
  };

  return (
    <AppShell currentView="resources">
      <div className="flex-1 overflow-y-auto bg-black text-white">
        {/* Hero */}
        <header className="border-b border-neutral-900 bg-gradient-to-b from-neutral-950 to-black">
          <div className="container mx-auto px-6 py-10">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-medium">Resources</h1>
              <Badge variant="secondary" className="ml-1">
                {items.length}
              </Badge>
            </div>
            <p className="max-w-2xl text-neutral-400">
              Start from a template to build your next project. Every template forks into the
              builder and deploys to a live <code className="text-neutral-300">*.hanzo.app</code>{' '}
              URL — including a growing library of open-source games.
            </p>
          </div>
        </header>

        {/* Filters */}
        <div className="sticky top-0 z-30 border-b border-neutral-900 bg-black/95 backdrop-blur">
          <div className="container mx-auto flex flex-wrap items-center gap-3 px-6 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <Input
                placeholder="Search resources…"
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                className="w-64 border-neutral-800 bg-neutral-900 pl-9 text-white"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    category === cat
                      ? 'bg-white text-black'
                      : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <Badge variant="secondary" className="ml-auto">
              {filtered.length} shown{loading ? ' · syncing…' : ''}
            </Badge>
          </div>
        </div>

        {/* Grid */}
        <div className="container mx-auto px-6 py-8">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <ResourceCard key={item.id} item={item} onOpen={openPreview} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-20 text-center">
              {loading ? (
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-500" />
              ) : (
                <>
                  <p className="text-lg text-neutral-400">Nothing matches your search.</p>
                  <button
                    onClick={() => {
                      setCategory('All');
                      setQuery('');
                    }}
                    className="mt-2 text-white underline"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Remix flow */}
      <TemplatePreviewModal
        item={selected}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onUse={startRemix}
      />
      <RemixDialog
        templateTitle={selected?.title ?? ''}
        open={remixOpen}
        onOpenChange={setRemixOpen}
        onConfirm={confirmRemix}
      />
      <RemixProgress
        open={progressOpen}
        projectName={remixName}
        templateSlug={selected?.templateSlug ?? ''}
        onOpenChange={setProgressOpen}
      />
    </AppShell>
  );
}

function ResourceCard({
  item,
  onOpen,
}: {
  item: ResourceItem;
  onOpen: (item: ResourceItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="group flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 text-left transition-all hover:-translate-y-1 hover:border-white/50"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-950">
        {item.hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={`${item.title} preview`}
            loading="lazy"
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-neutral-500">
            <Gamepad2 className="h-8 w-8" />
            <span className="text-xs">{item.framework}</span>
          </div>
        )}
        {item.kind === 'game' ? (
          <Badge className="absolute right-2 top-2 border-neutral-700 bg-black/70 text-[11px] text-white">
            Game
          </Badge>
        ) : (
          <Badge className="absolute right-2 top-2 border-neutral-700 bg-black/70 text-[11px] text-white">
            {item.category}
          </Badge>
        )}
        {typeof item.rating === 'number' && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[11px] text-neutral-200">
            <Star className="h-3 w-3 fill-neutral-200" />
            {item.rating}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-medium text-white">{item.title}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-xs text-neutral-500">{item.description}</p>
        <p className="mt-2 text-[11px] text-neutral-600">{item.meta || item.framework}</p>
      </div>
    </button>
  );
}
