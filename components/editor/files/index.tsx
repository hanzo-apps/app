'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Input, Paragraph, SizableText, XStack, YStack, Button } from '@hanzo/ui';
import { Download, FileText, LayoutGrid, List, PanelRight, RefreshCcw, Search } from 'lucide-react';

import { panel } from '@/lib/chrome';
import { useSandbox } from '@/components/editor/console/log';
import { glyphFor } from '@/components/editor/file-tree/glyph';
import { artifactUrl, artifacts, previewable } from './artifacts';
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

  // The workspace's held pod — the same slot the shell and the agent use, so
  // "one sandbox, one checkout" stays true here too. Empty until something has
  // opened one, and this pane never opens one itself: a browser that billed a
  // pod per visit would be a strange browser.
  const sandboxId = useSandbox();
  // null = no pod or not asked; [] = asked, pod is empty of extras.
  const [pod, setPod] = useState<string[] | null>(null);
  const [artifact, setArtifact] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!sandboxId) {
      setPod(null);
      return;
    }
    let alive = true;
    fetch(`/v1/shell/files?sandbox=${encodeURIComponent(sandboxId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive) setPod(Array.isArray(d?.files) ? d.files : null);
      })
      .catch(() => alive && setPod(null));
    return () => {
      alive = false;
    };
  }, [sandboxId]);

  useEffect(() => refresh(), [refresh]);

  const extras = useMemo(() => artifacts(pod ?? [], pages), [pod, pages]);

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
      {/* Full width on a phone, a fixed 340 beside the preview on a desktop.
          The inline preview is a desktop luxury — 340px of it on a ~360px phone
          left a ~20px sliver of preview, so below $md the list takes the whole
          pane and the preview column steps out (the builder's own Preview tab
          is the phone's way to see a page). */}
      <YStack width="100%" flexShrink={0} minWidth={0} $md={{ width: 340 }} borderRightWidth={1} borderColor="$borderColor">
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
            // Desktop only: the inline preview it toggles does not render below
            // $md, so the toggle would flip a state with nothing to show.
            display="none" $md={{ display: "flex" }}
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
                onOpen={() => {
                  setArtifact(null);
                  onSelectPage(p.path);
                }}
  />
            ))}
            {/* SANDBOX — what the pod holds beyond the app: the deck an agent
                wrote, the CSV a command produced. Shown only when a pod exists
                and answered; a project whose shell was never opened has no
                group, not an empty one. Each row downloads through the
                sandbox-file door; the refresh is manual because artifacts are
                written mid-run and a one-shot listing goes stale. */}
            {sandboxId && pod !== null && (
              <>
                <XStack alignItems="center" gap="$1.5" paddingHorizontal="$2.5" paddingTop="$3" paddingBottom="$1">
                  <SizableText flex={1} minWidth={0} fontSize="$1" color="$color11">
                    Sandbox
                  </SizableText>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    borderRadius="$4"
                    title="Refresh sandbox files"
                    aria-label="Refresh sandbox files"
                    onClick={() => refresh()}
                  >
                    <RefreshCcw size={13} />
                  </Button>
                </XStack>
                {extras.length === 0 ? (
                  <SizableText paddingHorizontal="$2.5" fontSize="$1" color="$color11">
                    Nothing beyond the app's own files yet.
                  </SizableText>
                ) : (
                  extras.map((path) => (
                    <ArtifactRow
                      key={path}
                      path={path}
                      sandbox={sandboxId}
                      open={artifact === path}
                      onOpen={() => setArtifact(path)}
  />
                  ))
                )}
              </>
            )}
          </YStack>
        )}
      </YStack>

      {preview && (
        <YStack display="none" $md={{ display: "flex" }} flex={1} minWidth={0} alignItems="center" justifyContent="center" padding="$4">
          {artifact && sandboxId ? (
            <ArtifactPreview sandbox={sandboxId} path={artifact} />
          ) : open ? (
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

function ArtifactRow({
  path,
  sandbox,
  open,
  onOpen,
}: {
  path: string;
  sandbox: string;
  open: boolean;
  onOpen: () => void;
}) {
  const Glyph = glyphFor(path.split('/').pop() ?? path);
  return (
    <XStack
      role="button"
      tabIndex={0}
      onPress={onOpen}
      alignItems="center"
      gap="$2"
      borderRadius="$4"
      paddingHorizontal="$2.5"
      paddingVertical="$2"
      cursor="pointer"
      backgroundColor={open ? '$color3' : 'transparent'}
      hoverStyle={open ? undefined : { backgroundColor: '$color2' }}
    >
      <SizableText color="$color11"><Glyph size={14} /></SizableText>
      <SizableText flex={1} minWidth={0} numberOfLines={1} fontFamily="$mono" fontSize="$1" color={open ? '$color' : '$color11'}>
        {path}
      </SizableText>
      {/* A plain anchor, because a download IS a navigation: the session
          cookie rides the same-origin request and the door answers with
          Content-Disposition. Stopping propagation keeps the row's own
          select-for-preview separate from taking the bytes. */}
      <a
        href={artifactUrl(sandbox, path)}
        download
        aria-label={`Download ${path}`}
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'inline-flex', color: 'inherit' }}
      >
        <SizableText color="$color11" hoverStyle={{ color: '$color' }}><Download size={14} /></SizableText>
      </a>
    </XStack>
  );
}

/**
 * What the preview column can honestly show for a sandbox file.
 *
 * An image renders; small text renders; everything else says what it is and
 * offers the bytes. A .pptx gets no fake thumbnail — a picture of a deck that
 * is not the deck is exactly the kind of plausible-but-wrong this pane bans.
 */
function ArtifactPreview({ sandbox, path }: { sandbox: string; path: string }) {
  const kind = previewable(path);
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    setText(null);
    if (kind !== 'text') return;
    let alive = true;
    fetch(artifactUrl(sandbox, path))
      .then((r) => (r.ok ? r.text() : null))
      .then((t) => alive && setText(t))
      .catch(() => alive && setText(null));
    return () => {
      alive = false;
    };
  }, [sandbox, path, kind]);

  return (
    <YStack {...panel} width="100%" height="100%" minHeight={0} overflow="hidden">
      <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$3" paddingVertical="$2" borderBottomWidth={1} borderColor="$borderColor">
        <SizableText fontFamily="$mono" fontSize="$1" color="$color11">{path}</SizableText>
        <a href={artifactUrl(sandbox, path)} download aria-label={`Download ${path}`} style={{ display: 'inline-flex', color: 'inherit', textDecoration: 'none' }}>
          <SizableText fontSize="$1" color="$color11" hoverStyle={{ color: '$color' }}>Download</SizableText>
        </a>
      </XStack>
      <YStack flex={1} minHeight={0} alignItems="center" justifyContent="center" overflow="scroll" padding={kind === 'text' ? '$3' : 0}>
        {kind === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={artifactUrl(sandbox, path)} alt={path} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        ) : kind === 'text' ? (
          text === null ? (
            <SizableText fontSize="$2" color="$color11">Loading…</SizableText>
          ) : (
            <SizableText alignSelf="stretch" whiteSpace="pre-wrap" fontFamily="$mono" fontSize="$1" color="$color">
              {text.slice(0, 20000)}
            </SizableText>
          )
        ) : (
          <YStack alignItems="center" gap="$2">
            <SizableText fontSize="$2" color="$color11">No preview for this file type.</SizableText>
            <SizableText fontSize="$1" color="$color11">Download it to open it.</SizableText>
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}
