'use client';

import { useMemo, useState } from 'react';
import { Input, Paragraph, SizableText, XStack, YStack, Button } from '@hanzo/ui';
import { FileText, LayoutGrid, List, PanelRight, Search } from 'lucide-react';

import { panel } from '@/lib/chrome';
import type { Page } from '@/types';

/**
 * The Files pane — every file in the project, and what one contains.
 *
 * Distinct from Code, which is an EDITOR: this is a browser. You come here to
 * find out what exists and how big it is; you go to Code to change it. Keeping
 * them apart is why neither has to compromise — Code can give the whole width
 * to the buffer, and this can afford a preview column.
 *
 * It reads `pages`, the project's real file list, and nothing else. There is no
 * separate files API to drift from: the same array the preview renders and the
 * editor writes is the one enumerated here, so a file cannot appear in one and
 * not the others.
 */
export function FilesPane({
  pages,
  currentPage,
  onSelectPage,
}: {
  pages: Page[];
  currentPage: string;
  onSelectPage: (path: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const [preview, setPreview] = useState(true);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((p) => p.path.toLowerCase().includes(q));
  }, [pages, query]);

  const open = pages.find((p) => p.path === currentPage) ?? null;

  return (
    <XStack position="absolute" top={0} right={0} bottom={0} left={0} zIndex={10} backgroundColor="$background">
      {/* THE BROWSER COLUMN. A fixed basis rather than a fraction: this column
          holds file names, whose length does not scale with the window, and a
          percentage made it luxuriously wide on a monitor and unusable on a
          laptop. The preview beside it takes the remainder, which IS the thing
          that wants every pixel available. */}
      <YStack width={340} flexShrink={0} minWidth={0} borderRightWidth={1} borderColor="$borderColor">
        <XStack alignItems="center" gap="$2" paddingHorizontal="$3" paddingVertical="$2.5">
          <XStack flex={1} minWidth={0} alignItems="center" gap="$2" borderRadius="$4" backgroundColor="$color2" paddingHorizontal="$2.5" data-field-box>
            <SizableText color="$color11"><Search size={14} /></SizableText>
            <Input
              flex={1}
              minWidth={0}
              value={query}
              onChangeText={setQuery}
              placeholder="Search files"
              aria-label="Search files"
              borderWidth={0}
              backgroundColor="transparent"
              paddingHorizontal="$0"
  />
          </XStack>
          {/* Layout and preview are two different questions, so they are two
              controls rather than a three-way cycle: a cycle makes "show the
              preview" cost up to two clicks depending on where you already are. */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            borderRadius="$4"
            title={layout === 'list' ? 'Show as grid' : 'Show as list'}
            aria-label={layout === 'list' ? 'Show as grid' : 'Show as list'}
            onClick={() => setLayout(layout === 'list' ? 'grid' : 'list')}
          >
            {layout === 'list' ? <LayoutGrid size={16} /> : <List size={16} />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            borderRadius="$4"
            title={preview ? 'Hide preview' : 'Show preview'}
            aria-label={preview ? 'Hide preview' : 'Show preview'}
            aria-pressed={preview}
            onClick={() => setPreview(!preview)}
          >
            <PanelRight size={16} />
          </Button>
        </XStack>

        {pages.length === 0 ? (
          <Empty
            title="You haven't generated any files yet."
            body="Once you create one, it will appear here."
  />
        ) : matches.length === 0 ? (
          <Empty
            title={`Nothing matches “${query.trim()}”.`}
            body="Search matches on the file's path."
  />
        ) : (
          <YStack minHeight={0} flex={1} overflow="scroll" paddingHorizontal="$2" paddingBottom="$2" gap="$0.5">
            {matches.map((p) => (
              <FileRow
                key={p.path}
                page={p}
                open={p.path === currentPage}
                grid={layout === 'grid'}
                onOpen={() => onSelectPage(p.path)}
  />
            ))}
          </YStack>
        )}
      </YStack>

      {preview && (
        <YStack flex={1} minWidth={0} alignItems="center" justifyContent="center" padding="$4">
          {open ? (
            <YStack {...panel} width="100%" height="100%" minHeight={0} overflow="hidden">
              <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$3" paddingVertical="$2" borderBottomWidth={1} borderColor="$borderColor">
                <SizableText fontFamily="$mono" fontSize="$1" color="$color11">{open.path}</SizableText>
                <SizableText fontSize="$1" color="$color11">{size(open.html)}</SizableText>
              </XStack>
              {/* The file's OWN bytes, rendered. A thumbnail would be a picture
                  of the file and this is the file — which matters because the
                  question the preview answers is "is this the one I meant". */}
              <iframe
                title={`Preview of ${open.path}`}
                srcDoc={open.html}
                sandbox="allow-scripts"
                style={{ border: 0, width: '100%', height: '100%', background: '#fff' }}
  />
            </YStack>
          ) : (
            <SizableText fontSize="$2" color="$color11">Select a file to preview it.</SizableText>
          )}
        </YStack>
      )}
    </XStack>
  );
}

function FileRow({
  page,
  open,
  grid,
  onOpen,
}: {
  page: Page;
  open: boolean;
  grid: boolean;
  onOpen: () => void;
}) {
  return (
    <XStack
      role="button"
      tabIndex={0}
      onPress={onOpen}
      alignItems="center"
      gap="$2"
      borderRadius="$4"
      paddingHorizontal="$2.5"
      paddingVertical={grid ? '$3' : '$2'}
      cursor="pointer"
      backgroundColor={open ? '$color3' : 'transparent'}
      hoverStyle={open ? undefined : { backgroundColor: '$color2' }}
    >
      <SizableText color="$color11"><FileText size={14} /></SizableText>
      <SizableText flex={1} minWidth={0} numberOfLines={1} fontFamily="$mono" fontSize="$1" color={open ? '$color' : '$color11'}>
        {page.path}
      </SizableText>
      <SizableText fontSize="$1" color="$color11">{size(page.html)}</SizableText>
    </XStack>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$2" padding="$5">
      <SizableText color="$color11"><FileText size={28} /></SizableText>
      <SizableText fontSize="$3" color="$color" textAlign="center">{title}</SizableText>
      <Paragraph fontSize="$2" color="$color11" textAlign="center">{body}</Paragraph>
    </YStack>
  );
}

/**
 * A file's size, in the units a person reads.
 *
 * `Blob` rather than `.length`: a string's length counts UTF-16 code units, so
 * any non-ASCII content — one emoji, one accented name — reports a size the
 * file does not have. It is a browser-only API and this component is
 * client-only, which is the condition that makes it safe to use.
 */
function size(text: string): string {
  const bytes = new Blob([text]).size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
