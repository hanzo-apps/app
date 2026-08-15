'use client';

/**
 * /templates — "Start from a template to build your next project."
 *
 * The rich template gallery, sourced from the real catalog (lib/gallery-catalog
 * live/snapshot) merged with the games catalog (lib/resources-catalog — the
 * games→templates merge: games are a CATEGORY here, not a top-level surface).
 *
 * A template card → preview modal → "Use template" → the Remix dialog
 * (ownership acknowledgment) → the animated Remix progress (real create +
 * provision + seed) → the builder. Game cards open their existing detail page.
 */

import { SizableText, YStack, XStack, H1, Paragraph, H3 } from '@hanzo/ui';
import { glass } from "@/lib/chrome";
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge, Input, Button } from '@hanzo/ui';
import { Search, Star, Sparkles, Gamepad2 } from 'lucide-react';
import Header from '@/components/layout/header';
import SiteFooter from '@/components/landing/site-footer';
import { snapshotCatalog } from '@/lib/gallery-catalog';
import { fetchPublishedSlugs } from '@/lib/api/templates';
import {
  mergeResources,
  resourceCategories,
  type ResourceItem,
} from '@/lib/resources-catalog';
import { bySpectrum, tint } from '@/lib/template-hues';
import { TemplateThumb } from '@/components/template-thumb';
import { TemplatePreviewModal } from '@/components/remix/template-preview-modal';
import { RemixDialog } from '@/components/remix/remix-dialog';
import { RemixProgress } from '@/components/remix/remix-progress';
import { Spinner } from '@/components/ui/spinner';

/** The page proper. Wrapped below because `useSearchParams` suspends, and the
 *  App Router requires a boundary rather than letting the whole route go dynamic. */
function ResourcesBrowser() {
  const [items, setItems] = useState<ResourceItem[]>(() =>
    mergeResources(snapshotCatalog().templates),
  );
  const [loading, setLoading] = useState(true);
  // The category is deep-linkable: `?category=Games` is what /games redirects to,
  // and it is how any category can be linked at all. The URL is read once as the
  // initial value rather than subscribed to — the chips below own it afterwards,
  // and a filter that fought the URL on every click would be two owners of one
  // piece of state.
  const params = useSearchParams();
  const [category, setCategory] = useState(() => params?.get('category') || 'All');
  const [query, setQuery] = useState('');

  // Remix flow state.
  const [selected, setSelected] = useState<ResourceItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [remixOpen, setRemixOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [remixName, setRemixName] = useState('');

  // Which templates the platform publishes SOURCE for. Empty until it answers,
  // and empty forever if it does not — see fetchPublishedSlugs: an unreachable
  // warehouse must not accuse every card of having no source.
  const [published, setPublished] = useState<Set<string>>(() => new Set());

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
    // Independent of the gallery: the two catalogs disagree, which is the whole
    // reason both are asked. One request for all 63, never one per card.
    fetchPublishedSlugs().then((s) => alive && setPublished(s));
    return () => {
      alive = false;
    };
  }, []);

  const categories = useMemo(() => resourceCategories(items), [items]);

  // Spectrum order, so the grid reads as one gradient from purple down to the
  // greyscale tail. It sorts the FILTERED list: narrowing to a category or a
  // search still leaves the survivors in colour order.
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const matches = items.filter((it) => {
      const matchesCat = category === 'All' || it.category === category;
      const matchesSearch =
        !q ||
        it.title.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q) ||
        it.framework.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
    return bySpectrum(matches, (it) => it.templateSlug);
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
    <YStack minHeight="100%" backgroundColor="$background">
      <Header />
      {/* No inner scroll region on a public page — the document scrolls. This
          wrapper carried flex={1} (RN semantics: flex-basis 0) + overflow
          scroll, and under a minHeight root a basis-0 child resolves to ZERO
          height: 5,600px of grid mounted invisible, on prod. The shell's
          scroll region belongs to signed-in surfaces only. */}
      <YStack backgroundColor="$background">
        {/* Hero */}
        <YStack borderBottomWidth={1} borderColor="$borderColor">
          <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5" paddingVertical="$7">
            {/* The badge carries shrink-0 and this row did not wrap, so at 375px
                the count was pushed past the right edge and clipped mid-word —
                the document overflowed by 14px, and by 69px at 320. Neither the
                title nor the badge can give, so the row has to.

                Via `style`, not the `flexWrap` prop: measured in a production
                build, the prop does not reach the DOM here (the row still
                computed `flex-wrap: nowrap` and the overflow was unchanged to
                the pixel). A raw style is the one form that survives. */}
            <XStack marginBottom="$2" alignItems="center" gap="$3" style={{ flexWrap: 'wrap' }}>
              <XStack height="$7" width="$7" alignItems="center" justifyContent="center" borderRadius="$5" backgroundColor="$color3">
                <Sparkles size={24} />
              </XStack>
              {/* "Templates" — the word on the nav, on the URL and in the page
                  title. `/resources` already redirects here for exactly that
                  reason; the H1 was the last place the synonym survived. */}
              <H1 fontSize="$8" $md={{ fontSize: "$10" }} fontWeight="500">Templates</H1>
              {/* ONE child, not two. A Badge lays its children out as a COLUMN, so
                  `{n} resources` — which JSX hands over as two children — stacks the
                  count above the word and the pill, sized for one line, crops the
                  second. Measured on /templates: clientHeight 24, scrollHeight 34,
                  two block spans of 16px. One interpolated string is one child. */}
              <Badge variant="secondary">{`${items.length} templates`}</Badge>
            </XStack>
            <Paragraph maxWidth={672} color="$color11">
              Start from a template to build your next project. Every template forks into the
              builder and deploys to a live <SizableText color="$color11">*.hanzo.app</SizableText>{' '}
              URL — including a growing library of open-source games.
            </Paragraph>
          </YStack>
        </YStack>

        {/* Filters */}
        <YStack {...glass(2)} position="sticky" top="$0" zIndex={30} borderBottomWidth={1}>
          <XStack width="100%" maxWidth={1280} alignSelf="center" flexWrap="wrap" alignItems="flex-start" gap="$3" paddingHorizontal="$5" paddingVertical="$3">
            {/* The glyph goes IN the field, which is what `startAdornment` is
                for. As a plain sibling it was never positioned, so it stacked
                above the box and the 36px gutter held a space nothing sat in —
                measured on prod, icon bottom 291 against field top 291 at both
                widths. */}
            <YStack width="100%" $sm={{ width: "auto" }}>
              <Input
                placeholder="Search templates…"
                value={query}
                onChangeText={(v: string) => setQuery(v)}
                startAdornment={<Search size={16} />}
                width="100%" borderColor="$borderColor" backgroundColor="$background" color="$color" $sm={{ width: 256 }}
  />
            </YStack>
            {/* `flexShrink={1}` is load-bearing. gui's base rule gives every
                View `flex-shrink: 0`, so this row sat at its max-content
                1380px inside a 1232px content box and pushed the DOCUMENT
                wide at every width — +1014px at 390, +44px at 1440. Nothing
                could shrink it, so `flexWrap: wrap` (already on from 640 up)
                never had a reason to wrap and `overflow="scroll"` never had
                anything to scroll: the box was never smaller than its content.
                Letting it shrink is what turns both of those back on. */}
            <XStack flexWrap="nowrap" alignItems="center" gap="$1.5" flexShrink={1} overflow="scroll" $sm={{ flexWrap: "wrap" }} className="no-scrollbar">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  /* Selected is a RAISED surface, not an inversion. `$color12`
                     is the lightest step in the ramp, so the active chip painted
                     a white slab with black text on a true-black page — the one
                     bright rectangle in a monochrome column, and louder than the
                     header's own primary. Selection reads from a lifted ground
                     plus full-strength text instead.

                     `$color5` and not `$color4`: the ramp mixes solid steps with
                     ALPHA ones, and `$color4` is `rgb(255 255 255 / .10)` — over
                     black that composites to ~rgb(26,26,26), DARKER than these
                     chips' own rgb(36,36,36) rest state, so the selected one
                     receded. `$color5` is hsl 20% = rgb(51,51,51), which is the
                     exact ground the header's primary already uses. */
                  borderRadius="$10" paddingHorizontal="$3" paddingVertical="$2" flexShrink={0} $sm={{ paddingVertical: "$1.5" }} {...{ backgroundColor: category === cat ? "$color5" : "$background", borderWidth: 1, borderColor: category === cat ? "$color7" : "$borderColor", hoverStyle: category === cat ? undefined : { backgroundColor: "$color3" } }}
                >
                  <SizableText fontSize="$1" fontWeight="500" whiteSpace="nowrap" color={category === cat ? "$color" : "$color11"}>{cat}</SizableText>
                </Button>
              ))}
            </XStack>
            {/* `className="ml-auto"` here matched no rule in any stylesheet —
                Tailwind is gone, so the count was never right-aligned. A Badge
                is typed as span props and takes no layout of its own, so the
                margin belongs to a stack around it. */}
            <YStack marginLeft="auto">
              <Badge variant="secondary">
                {`${filtered.length} shown${loading ? ' · syncing…' : ''}`}
              </Badge>
            </YStack>
          </XStack>
        </YStack>

        {/* Grid — `.shot-grid`, the showcase measure: auto-fit/minmax like
            `.card-grid` but on a 340px floor, so the column count still follows
            the width with no breakpoints and the tile is big enough to read the
            design in it. */}
        <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5" paddingVertical="$6">
          {/* A plain div, like `.hiw-grid`: `.is_View` on a YStack also sets
              `display`, at the same specificity, so which one won would come
              down to sheet order. The grid owns its own box. */}
          <div className="shot-grid">
            {filtered.map((item) => (
              <ResourceCard
                key={item.id}
                item={item}
                onOpen={openPreview}
                // Only templates make the promise, and only once the warehouse
                // has answered — an empty set marks nothing.
                rebuilt={
                  item.kind === 'template' &&
                  published.size > 0 &&
                  !!item.templateSlug &&
                  !published.has(item.templateSlug)
                }
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <YStack paddingVertical="$11" alignItems="center">
              {loading ? (
                <Spinner size={24} />
              ) : (
                <>
                  <Paragraph fontSize="$6" color="$color11">No template matches that search and category.</Paragraph>
                  <Button
                    onClick={() => {
                      setCategory('All');
                      setQuery('');
                    }}
                    backgroundColor="transparent" marginTop="$2"
                  >
                    <SizableText color="$color" textDecorationLine="underline">Clear filters</SizableText>
                  </Button>
                </>
              )}
            </YStack>
          )}
        </YStack>
      </YStack>

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
      <SiteFooter />
    </YStack>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense
      fallback={
        <YStack minHeight="100%" backgroundColor="$background">
          <Header />
          <YStack flex={1} />
          <SiteFooter />
        </YStack>
      }
    >
      <ResourcesBrowser />
    </Suspense>
  );
}

function ResourceCard({
  item,
  onOpen,
  rebuilt,
}: {
  item: ResourceItem;
  onOpen: (item: ResourceItem) => void;
  /** This template publishes no source, so opening it recreates it. */
  rebuilt?: boolean;
}) {
  // The card's hairline carries the shot's own colour at low alpha — enough to
  // make the spectrum order legible as you scan, not enough to be chrome. Cards
  // with no dominant colour keep the monochrome border, which is the whole point
  // of having measured one.
  //
  // Hover brightens that same hue rather than going white. Partly because the
  // spectrum should survive being pointed at, and partly because rest and hover
  // then come from ONE expression: a dynamic value and a theme token are placed
  // by different paths in gui, and the runtime-inserted rule for the dynamic one
  // carries the same specificity as the pseudo-state rule it would have to lose
  // to (`:root ._btc-x._btc-x` against `:root ._btc-hover:hover`, both 0,3,0), so
  // which one won came down to insertion order. That is not a thing to build on.
  const colour = tint(item.templateSlug);
  const hairline = colour ? `hsl(${colour.hue} 65% 55% / 0.35)` : "$borderColor";
  const lit = colour ? `hsl(${colour.hue} 75% 62% / 0.8)` : "$color";
  return (
    /* A CARD, not a control. @hanzo/ui's Button pins its size variant's height
       over anything the caller passes, and overflow="hidden" then crops the
       card to that band — measured here at 30px holding 425px of content, 46
       cards deep. A clickable stack sizes from its content instead. This is the
       same shape the landing strip already uses. */
    <YStack
      role="button"
      tabIndex={0}
      aria-label={`Preview ${item.title}`}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(item);
        }
      }}
      cursor="pointer" group className="zoom-scope" flexDirection="column" overflow="hidden" borderRadius="$6" borderWidth={1} borderColor={hairline} backgroundColor="$background" hoverStyle={{ y: "$-1", borderColor: lit }}
    >
      {/* `TemplateThumb` is the app's ONE template preview: the self-hosted shot
          at public/templates/<slug>.webp when there is one, the drawn schematic
          when there is not. This card used to point at
          gallery.hanzo.ai/screenshots/<slug>.png and hide the <img> on error —
          measured on /templates, 0 of 66 loaded and 48 were confirmed broken, so
          every card was an empty box with its alt text showing through. A remote
          origin the app does not own cannot be the picture of the product. */}
      <YStack position="relative" overflow="hidden" aspectRatio={16 / 10} backgroundColor="$background">
        {item.kind === 'template' ? (
          <TemplateThumb
            name={item.title}
            category={item.category}
            slug={item.templateSlug}
            className="zoom-target"
  />
        ) : (
          <YStack height="100%" alignItems="center" justifyContent="center" gap="$1.5">
            <Gamepad2 size={32} />
            <SizableText fontSize="$1" color="$color11">{item.framework}</SizableText>
          </YStack>
        )}
        {/* POSITIONED WITH STYLE PROPS, because `absolute right-2 top-2` was
            Tailwind and Tailwind is gone from this app — the same death the count
            badge above already carries a note about. The class named nothing, so
            the badge stayed in flow as the second child of a frame whose height
            is pinned by aspectRatio 16/10: it landed exactly one image-height
            down, past the bottom edge, and overflow:hidden cropped it. Measured
            on /templates: frame 485→668, badge top 668. */}
        <Badge variant="outline" style={{ position: 'absolute', right: 8, top: 8 }}>
          {item.kind === 'game' ? 'Game' : item.category}
        </Badge>
        {typeof item.rating === 'number' && (
          <XStack position="absolute" left="$2" top="$2" alignItems="center" gap="$1" borderRadius="$10" backgroundColor="$background" paddingHorizontal="$2" paddingVertical="$0.5">
            <Star size={12} />
            <SizableText fontSize="$1" color="$color">{item.rating}</SizableText>
          </XStack>
        )}
      </YStack>
      {/* `flex={1}` is `flex: 1 1 0` — a ZERO basis. A gui stack also carries
          `min-height: 0`, so a zero-basis block contributes nothing to the
          card's intrinsic height, the card sizes to its picture alone, and
          `overflow="hidden"` slices the title off. Measured on prod: all 100
          cards cropped, the worst by 154px. Grow into a stretched row, but
          never below the words. */}
      <YStack flexGrow={1} flexBasis="auto" flexShrink={0} padding="$4">
        <H3 fontWeight="500" color="$color">{item.title}</H3>
        <Paragraph marginTop="$1" numberOfLines={2} minHeight="2.5rem" fontSize="$1" color="$color11">{item.description}</Paragraph>
        {/* The picture is a promise, and for 43 of the 72 on this page the
            platform cannot keep it: it publishes no source for them, so opening
            one gets a fresh build from the description rather than the design in
            the shot. Said HERE because this is where the choice is made — the
            builder already says it, but only after the remix is committed. */}
        <Paragraph marginTop="auto" paddingTop="$3" numberOfLines={1} fontSize="$1" color="$color11">
          {[item.meta || item.framework, rebuilt ? "rebuilt from its description" : ""]
            .filter(Boolean)
            .join(" · ")}
        </Paragraph>
      </YStack>
    </YStack>
  );
}
