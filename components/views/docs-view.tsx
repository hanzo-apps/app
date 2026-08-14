'use client';

import { YStack, XStack, Paragraph, H1 } from '@hanzo/ui';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { TableOfContents } from '@/components/table-of-contents';
import { useTableOfContents } from '@/lib/hooks/use-table-of-contents';
import { AlertCircle } from 'lucide-react';
import { DOCS_ITEMS } from '@/lib/constants/docs';

function DocsViewContent() {
  const searchParams = useSearchParams();
  const docId = searchParams.get('doc') || 'overview';

  const selectedDoc = DOCS_ITEMS.find(d => d.id === docId) || DOCS_ITEMS[0];
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string>('');
  const [visibleIds, setVisibleIds] = useState<string[]>([]);

  const isManualScrolling = useRef(false);
  const scrollDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tocItems = useTableOfContents(content);

  useEffect(() => {
    async function loadDoc() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/v1/docs/${selectedDoc.file}`);
        if (!response.ok) {
          throw new Error(`Failed to load document: ${response.statusText}`);
        }
        const text = await response.text();
        setContent(text);

        // Scroll to hash if present in URL
        setTimeout(() => {
          if (window.location.hash) {
            const element = document.getElementById(window.location.hash.slice(1));
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          } else {
            // Scroll to top if no hash
            const contentArea = document.querySelector('.docs-content-area');
            if (contentArea) {
              contentArea.scrollTop = 0;
            }
          }
        }, 100);
      } catch (err) {
        console.error('Failed to load doc:', err);
        setError(err instanceof Error ? err.message : 'The page did not load, and the server gave no reason. Pick it again from the list.');
        setContent('');
      } finally {
        setLoading(false);
      }
    }

    loadDoc();
  }, [selectedDoc]);

  // Handle TOC item clicks
  const handleTocClick = useCallback((id: string) => {
    // Set active immediately when user clicks
    setActiveId(id);

    // Immediately update visible IDs to include only the clicked item
    // This prevents stale blue highlights during the scroll
    setVisibleIds([id]);

    // Disable auto-tracking during manual scroll
    isManualScrolling.current = true;

    // Re-enable auto-tracking after scroll animation completes
    // and then trigger an immediate update
    setTimeout(() => {
      isManualScrolling.current = false;

      // Trigger immediate recalculation of visible items after scroll completes
      const scrollContainer = document.querySelector('.docs-content-area');
      if (!scrollContainer) return;

      const headings = document.querySelectorAll('.docs-content-area [data-heading-index]');
      if (headings.length === 0) return;

      const containerTop = scrollContainer.getBoundingClientRect().top;
      const visible: string[] = [];

      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        const viewportTop = containerTop;
        const viewportBottom = viewportTop + scrollContainer.clientHeight;

        if (rect.top >= viewportTop && rect.bottom <= viewportBottom) {
          const index = heading.getAttribute('data-heading-index');
          if (index) {
            visible.push(index);
          }
        }
      });

      setVisibleIds(visible);
    }, 1000); // Smooth scroll takes ~500-800ms, add buffer
  }, []);

  // Scroll-based active section tracking with debouncing
  useEffect(() => {
    if (tocItems.length === 0) return;

    const scrollContainer = document.querySelector('.docs-content-area');
    if (!scrollContainer) return;

    const updateActiveSection = () => {
      // Skip if user is manually scrolling from TOC click
      if (isManualScrolling.current) {
        return;
      }

      // Select headings by data-heading-index attribute for unique identification
      const headings = document.querySelectorAll('.docs-content-area [data-heading-index]');
      if (headings.length === 0) return;

      const containerTop = scrollContainer.getBoundingClientRect().top;

      // Find the heading that's currently at the top of the viewport
      let activeHeading = headings[0];
      let minDistance = Infinity;

      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        const distance = Math.abs(rect.top - containerTop - 100); // 100px offset

        if (rect.top - containerTop < 200 && distance < minDistance) {
          minDistance = distance;
          activeHeading = heading;
        }
      });

      // Collect IDs of all headings in viewport
      const visible: string[] = [];
      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        const viewportTop = containerTop;
        const viewportBottom = viewportTop + scrollContainer.clientHeight;

        // Check if heading is in viewport
        if (rect.top >= viewportTop && rect.bottom <= viewportBottom) {
          const index = heading.getAttribute('data-heading-index');
          if (index) {
            visible.push(index);
          }
        }
      });

      // Use data-heading-index as the unique identifier
      const headingIndex = activeHeading?.getAttribute('data-heading-index');
      if (headingIndex) {
        setActiveId(headingIndex);
      }

      // Update visible IDs for TOC range highlighting
      setVisibleIds(visible);
    };

    // Debounced scroll handler
    const handleScroll = () => {
      // Clear existing timer
      if (scrollDebounceTimer.current) {
        clearTimeout(scrollDebounceTimer.current);
      }

      // Set new timer - only update after scrolling stops for 50ms
      scrollDebounceTimer.current = setTimeout(updateActiveSection, 50);
    };

    // Initial update - delay to ensure markdown heading indices are set
    // Increase delay to 500ms to ensure MarkdownRenderer's useEffect completes
    const timeout = setTimeout(() => {
      updateActiveSection();
    }, 500);

    // Update on scroll with debouncing
    scrollContainer.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timeout);
      if (scrollDebounceTimer.current) {
        clearTimeout(scrollDebounceTimer.current);
      }
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [tocItems, content]);

  const showToc = tocItems.length >= 3;

  return (
    <YStack height="100%">
      {/* Two-column layout: Content + TOC */}
      <YStack flex={1} overflow="hidden">
        {/* Main Content Area - scrollable */}
        <YStack height="100%" backgroundColor="$background" overflow="scroll" className="docs-content-area">
          <YStack
            padding="$5" maxWidth={896} alignSelf="center" $sm={{ padding: "$6" }}
            onClick={(e) => {
              // Handle anchor link clicks
              const target = e.target as HTMLElement;
              if (target.tagName === 'A') {
                const href = target.getAttribute('href');
                if (href?.startsWith('#')) {
                  e.preventDefault();
                  const element = document.getElementById(href.slice(1));
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                    window.history.pushState(null, '', href);
                  }
                }
              }
            }}
          >
          {loading && (
            <XStack alignItems="center" justifyContent="center" height="100%">
              <YStack alignItems="center">
                <YStack borderRadius="$10" height="$8" width="$8" borderBottomWidth={2} borderColor="$color11" alignSelf="center" />
                <Paragraph marginTop="$4" color="$color11">Loading the page…</Paragraph>
              </YStack>
            </XStack>
          )}

          {error && (
            <XStack alignItems="center" gap="$3" padding="$4" backgroundColor="transparent" borderWidth={1} borderColor="$red9" borderRadius="$5">
              <AlertCircle size={20} />
              <div>
                <Paragraph fontWeight="500">This page didn&apos;t load</Paragraph>
                <Paragraph fontSize="$3">{error}</Paragraph>
              </div>
            </XStack>
          )}

          {!loading && !error && content && (
            <>
              {/* Document Title */}
              <YStack marginBottom="$5" paddingBottom="$4" borderBottomWidth={1}>
                <XStack alignItems="center" gap="$3" marginBottom="$2">
                  <selectedDoc.icon size={32} color="var(--primary)" />
                  <H1 fontSize="$10" fontWeight="500">{selectedDoc.title}</H1>
                </XStack>
              </YStack>

              {/* Markdown Content */}
              <MarkdownRenderer content={content} />
            </>
          )}
          </YStack>
        </YStack>

        {/* Table of Contents Sidebar - independent scrollable column */}
        {showToc && (
          <YStack display="none" $lg={{ display: "flex" }} height="100%" borderLeftWidth={1} borderColor="$borderColor" backgroundColor="$color2" overflow="scroll">
            <YStack padding="$5" position="sticky" top="$0">
              <TableOfContents items={tocItems} activeId={activeId} visibleIds={visibleIds} onItemClick={handleTocClick} />
            </YStack>
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}

// Wrapper component with Suspense boundary for Next.js 15
export function DocsView() {
  return (
    <Suspense fallback={<XStack alignItems="center" justifyContent="center" height="100%">Loading the docs…</XStack>}>
      <DocsViewContent />
    </Suspense>
  );
}
