'use client';

import { YStack, Paragraph, Anchor } from '@hanzo/gui';
import React, { useEffect } from 'react';
import type { TocItem } from '@/lib/hooks/use-table-of-contents';

interface TableOfContentsProps {
  items: TocItem[];
  activeId?: string;
  visibleIds?: string[];
  onItemClick?: (id: string) => void;
}

export function TableOfContents({ items, activeId, visibleIds = [], onItemClick }: TableOfContentsProps) {
  // Auto-scroll TOC to keep active item visible
  useEffect(() => {
    if (!activeId) return;

    // activeId is now the heading index as a string
    const activeElement = document.querySelector(`[data-toc-id="${activeId}"]`);
    if (activeElement) {
      activeElement.scrollIntoView({
        behavior: 'instant', // Use instant to avoid competing with content scroll
        block: 'nearest',
      });
    }
  }, [activeId]);

  if (items.length === 0) return null;

  const handleClick = (e: React.MouseEvent, item: TocItem) => {
    e.preventDefault();

    // Notify parent component about the click (using index as unique identifier)
    onItemClick?.(item.index.toString());

    // Use data-heading-index to target the specific heading
    const element = document.querySelector(`[data-heading-index="${item.index}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', `#${item.id}`);
    }
  };

  return (
    <YStack rowGap="$1">
      <Paragraph fontSize="$3" fontWeight="500" marginBottom="$3" color="$color">On This Page</Paragraph>
      <YStack>
        {items.map((item) => (
          <li key={`${item.id}-${item.index}`}>
            <Anchor
              href={`#${item.id}`}
              data-toc-id={item.index}
              onClick={(e) => handleClick(e, item)}
              paddingVertical="$1" borderLeftWidth={2} paddingLeft="$3" hoverStyle={{ color: "$color" }} {...(activeId === item.index.toString() ? { borderColor: "var(--primary)", color: "$color", fontWeight: "500" } : visibleIds.includes(item.index.toString())
                  ? { borderColor: "rgba(96,165,250,0.5)", color: "color-mix(in srgb, var(--foreground) 80%, transparent)" }
                  : { borderColor: "transparent", color: "$color11" })}
            >
              {item.text}
            </Anchor>
            {item.children && item.children.length > 0 && (
              <ul>
                {item.children.map((child) => (
                  <li key={`${child.id}-${child.index}`}>
                    <Anchor
                      href={`#${child.id}`}
                      data-toc-id={child.index}
                      onClick={(e) => handleClick(e, child)}
                      paddingVertical="$1" fontSize="$1" borderLeftWidth={2} hoverStyle={{ color: "$color" }} {...(activeId === child.index.toString() ? { borderColor: "var(--primary)", color: "$color", fontWeight: "500" } : visibleIds.includes(child.index.toString())
                          ? { borderColor: "rgba(96,165,250,0.5)", color: "color-mix(in srgb, var(--foreground) 80%, transparent)" }
                          : { borderColor: "transparent", color: "$color11" })}
                      style={{ paddingLeft: 'calc(0.75rem * 1.67)' }}
                    >
                      {child.text}
                    </Anchor>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </YStack>
    </YStack>
  );
}
