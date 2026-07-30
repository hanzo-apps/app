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

import { SizableText, YStack, XStack, H1, Paragraph, Image, H3 } from '@hanzo/gui';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Input, Button } from '@hanzo/ui';
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
      <SizableText flex={1} backgroundColor="$background" color="$color" overflow="scroll" display="flex" flexDirection="column">
        {/* Hero */}
        <YStack borderBottomWidth={1} borderColor="$borderColor">
          <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5" paddingVertical="$7">
            <XStack marginBottom="$2" alignItems="center" gap="$3">
              <XStack height="$7" width="$7" alignItems="center" justifyContent="center" borderRadius="$5" backgroundColor="$color3">
                <Sparkles size={24} color="$color" />
              </XStack>
              <H1 fontSize="$10" fontWeight="500">Resources</H1>
              <Badge variant="secondary" marginLeft="$1">
                {items.length} resources
              </Badge>
            </XStack>
            <Paragraph maxWidth={672} color="$color11">
              Start from a template to build your next project. Every template forks into the
              builder and deploys to a live <SizableText color="$color11">*.hanzo.app</SizableText>{' '}
              URL — including a growing library of open-source games.
            </Paragraph>
          </YStack>
        </YStack>

        {/* Filters */}
        <YStack position="sticky" top="$0" zIndex={30} borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$background" backdropFilter="blur(8px)">
          <XStack width="100%" maxWidth={1280} alignSelf="center" flexWrap="wrap" alignItems="flex-start" gap="$3" paddingHorizontal="$5" paddingVertical="$3">
            <YStack position="relative" width="100%" $sm={{ width: "auto" }}>
              <Search size={16} color="$color11" />
              <Input
                placeholder="Search resources…"
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                width="100%" borderColor="$borderColor" backgroundColor="$background" paddingLeft={36} color="$color" $sm={{ width: 256 }}
  />
            </YStack>
            <XStack flexWrap="nowrap" alignItems="center" gap="$1.5" overflow="scroll" $sm={{ flexWrap: "wrap" }} className="no-scrollbar">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  borderRadius="$10" paddingHorizontal="$3" paddingVertical="$2" fontSize="$1" fontWeight="500" flexShrink={0} whiteSpace="nowrap" $sm={{ paddingVertical: "$1.5" }} {...{ backgroundColor: category === cat ? "$color12" : "$background", color: category === cat ? "$background" : "$color11", hoverStyle: category === cat ? undefined : {"backgroundColor":"$color3","color":"$color"} }}
                >
                  {cat}
                </Button>
              ))}
            </XStack>
            <Badge variant="secondary" marginLeft="auto">
              {filtered.length} shown{loading ? ' · syncing…' : ''}
            </Badge>
          </XStack>
        </YStack>

        {/* Grid */}
        <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5" paddingVertical="$6">
          <YStack gap="$4.5">
            {filtered.map((item) => (
              <ResourceCard key={item.id} item={item} onOpen={openPreview} />
            ))}
          </YStack>

          {filtered.length === 0 && (
            <SizableText paddingVertical="$11" textAlign="center" display="flex" flexDirection="column">
              {loading ? (
                <Loader2 size={24} color="$color11" />
              ) : (
                <>
                  <Paragraph fontSize="$6" color="$color11">Nothing matches your search.</Paragraph>
                  <Button
                    onClick={() => {
                      setCategory('All');
                      setQuery('');
                    }}
                    marginTop="$2" color="$color" textDecorationLine="underline"
                  >
                    Clear filters
                  </Button>
                </>
              )}
            </SizableText>
          )}
        </YStack>
      </SizableText>

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
    <Button
      type="button"
      onClick={() => onOpen(item)}
      group className="zoom-scope" flexDirection="column" overflow="hidden" borderRadius="$6" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" textAlign="left" hoverStyle={{ y: "-1", borderColor: "$color" }}
    >
      <YStack position="relative" overflow="hidden" backgroundColor="$background">
        {item.hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <Image
            src={item.image}
            alt={`${item.title} preview`}
            loading="lazy"
            height="100%" width="100%" objectFit="cover" objectPosition="top" className="zoom-target"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
  />
        ) : (
          <SizableText height="100%" flexDirection="column" alignItems="center" justifyContent="center" gap="$1.5" color="$color11" display="flex">
            <Gamepad2 size={32} />
            <SizableText fontSize="$1">{item.framework}</SizableText>
          </SizableText>
        )}
        {item.kind === 'game' ? (
          <Badge position="absolute" right="$2" top="$2" borderColor="$borderColor" backgroundColor="$background" fontSize={11} color="$color">
            Game
          </Badge>
        ) : (
          <Badge position="absolute" right="$2" top="$2" borderColor="$borderColor" backgroundColor="$background" fontSize={11} color="$color">
            {item.category}
          </Badge>
        )}
        {typeof item.rating === 'number' && (
          <SizableText position="absolute" left="$2" top="$2" alignItems="center" gap="$1" borderRadius="$10" backgroundColor="$background" paddingHorizontal="$2" paddingVertical="$0.5" fontSize={11} color="$color" display="flex" flexDirection="row">
            <Star size={12} />
            {item.rating}
          </SizableText>
        )}
      </YStack>
      <YStack flex={1} padding="$4">
        <H3 fontWeight="500" color="$color">{item.title}</H3>
        <Paragraph marginTop="$1" numberOfLines={2} minHeight="2.5rem" fontSize="$1" color="$color11">{item.description}</Paragraph>
        <Paragraph marginTop="auto" paddingTop="$3" fontSize={11} color="$color11">{item.meta || item.framework}</Paragraph>
      </YStack>
    </Button>
  );
}
