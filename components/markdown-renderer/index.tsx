'use client';

import { YStack, SizableText } from '@hanzo/ui';
// `Anchor` is not on @hanzo/ui's barrel yet — the dts build drops it, the
// same way it drops the GuiElement type. Tracked; everything else in this
// file comes from @hanzo/ui.
import { Anchor } from '@hanzo/gui';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { normalizeContent } from './content-normalizer';
import { ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Helper to generate slug from heading text
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start
    .replace(/-+$/, '');      // Trim - from end
}

interface MarkdownRendererProps {
  content: string;
  /** Render the whole block in the muted register (transcript summaries). */
  muted?: boolean;
  skipNormalization?: boolean;
  /**
   * Compact density — the tight monochrome treatment for inline surfaces like the
   * builder chat thread (small headings, terse spacing). Default (false) is the
   * doc density used by the docs view / chat panel. ONE renderer, two densities —
   * so assistant chat output renders formatted markdown in the same type register
   * as the rest of the builder, never raw "## …" / "**…**" text.
   */
  compact?: boolean;
}

export function MarkdownRenderer({ content, muted = false, skipNormalization = false, compact = false }: MarkdownRendererProps) {
  const router = useRouter();

  // Normalize content to fix common LLM formatting issues
  const processedContent = skipNormalization ? content : normalizeContent(content);

  // Typography lives in assets/globals.css under the `.md` scope — the ONE
  // prose register. Density is the only knob, and it is one class.
  // Pre-calculate all heading data from the markdown
  // This runs once per content change and is stable across re-renders
  const headingData = React.useMemo(() => {
    const lines = processedContent.split('\n');
    const headings: Array<{ level: number; text: string; index: number }> = [];
    let index = 0;

    for (const line of lines) {
      // Match H2, H3, H4 (skip H1 as it's not in TOC)
      const match = line.match(/^(#{2,4})\s+(.+)$/);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2].trim(),
          index: index++,
        });
      }
    }

    return headings;
  }, [processedContent]);

  // Create a map from heading text to index for quick lookup during render
  const headingIndexMap = React.useMemo(() => {
    const map = new Map<string, number>();
    headingData.forEach(h => {
      const key = `${h.level}-${h.text}`;
      if (!map.has(key)) {
        map.set(key, h.index);
      }
    });
    return map;
  }, [headingData]);

  return (
    // A gui View defaults to React-Native flex semantics — `flexShrink: 0` —
    // so as a flex ITEM this root takes its MAX-CONTENT width and simply
    // overflows. Measured in the builder's chat pane: an assistant reply
    // rendered 1816px wide inside a 592px column, i.e. the entire paragraph on
    // one unwrapped line, clipped mid-word at the pane edge ("…so its fra").
    // It reads as truncated text; it is really a flex item that never shrank.
    //
    // `minWidth: 0` is the other half and is not optional: a flex item's
    // automatic minimum size is its content, which pins the width back even
    // once shrinking is allowed.
    //
    // Fixed HERE rather than at the call site because a renderer wider than its
    // container is wrong for every consumer, and chat is only where it showed.
    <YStack
      className={compact ? "md md-compact" : "md"}
      flexShrink={1}
      minWidth={0}
      maxWidth="100%"
      {...(muted ? { color: "$color11" } : null)}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        h1: ({ children }) => {
          const text = children?.toString() || '';
          const id = slugify(text);
          return <h1 id={id}>{children}</h1>;
        },
        h2: ({ children }) => {
          const text = children?.toString() || '';
          const id = slugify(text);
          const key = `2-${text}`;
          const index = headingIndexMap.get(key);
          return (
            <h2 id={id} data-heading-index={index}>
              {children}
            </h2>
          );
        },
        h3: ({ children }) => {
          const text = children?.toString() || '';
          const id = slugify(text);
          const key = `3-${text}`;
          const index = headingIndexMap.get(key);
          return (
            <h3 id={id} data-heading-index={index}>
              {children}
            </h3>
          );
        },
        h4: ({ children }) => {
          const text = children?.toString() || '';
          const id = slugify(text);
          const key = `4-${text}`;
          const index = headingIndexMap.get(key);
          return (
            <h4 id={id} data-heading-index={index}>
              {children}
            </h4>
          );
        },

        pre: ({ children, ...props }) => {
          // Extract language from code block if present
          const codeElement = React.Children.toArray(children).find(
            (child) => React.isValidElement(child) && child.type === 'code'
          ) as React.ReactElement<{ className?: string }> | undefined;

          const codeClassName = codeElement?.props?.className || '';
          const match = /language-(\w+)/.exec(codeClassName);
          const language = match ? match[1] : null;

          return (
            <YStack position="relative">
              {language && (
                <YStack position="absolute" top="$2" right="$2" paddingHorizontal="$1.5" paddingVertical="$0.5" backgroundColor="$background" borderRadius="$2" borderWidth={1} borderColor="$borderColor" backdropFilter="blur(4px)">
                  <SizableText fontSize={10} fontWeight="500" color="$color11">{language}</SizableText>
                </YStack>
              )}
              <pre {...props}>{children}</pre>
            </YStack>
          );
        },

        code: ({ className: codeClassName, children }) => {
          const match = /language-(\w+)/.exec(codeClassName || '');
          const isInline = !match;

          if (isInline) {
            return (
              <SizableText paddingHorizontal="$1.5" paddingVertical="$0.5" borderRadius="$2" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" fontFamily="$mono">
                {children}
              </SizableText>
            );
          }

          // Fenced code block with language
          return (
            <SizableText fontFamily="$mono" fontSize={12} lineHeight="1.625">
              {children}
            </SizableText>
          );
        },

        a: ({ href, children }) => {
          if (!href) return <a>{children}</a>;

          // Internal doc links (?doc=...)
          const isInternalDoc = href.startsWith('?doc=');
          // Internal navigation links (?nav=...)
          const isNavLink = href.startsWith('?nav=');
          // External links (http://, https://)
          const isExternal = href.startsWith('http://') || href.startsWith('https://');

          // Internal links (doc links, nav links, or anchors) stay in same tab
          const shouldOpenNewTab = isExternal;

          // Handle special link types with router navigation
          const handleClick = (e: React.MouseEvent<HTMLElement>) => {
            if (isInternalDoc) {
              e.preventDefault();
              router.push(`/${href}`);
            } else if (isNavLink) {
              e.preventDefault();
              const view = href.replace('?nav=', '');
              const isServerMode = process.env.NEXT_PUBLIC_SERVER_MODE === 'true';

              if (isServerMode) {
                router.push(`/admin/${view}`);
              } else {
                // Browser mode - dispatch event for navigation
                window.dispatchEvent(new CustomEvent('nav-to-view', { detail: { view } }));
                router.push('/');
              }
            }
          };

          return (
            <Anchor
              href={href}
              onClick={handleClick}
              color="$color" textDecorationLine="underline" cursor="pointer" {...{ alignItems: isExternal ? "center" : undefined, gap: isExternal ? "$1" : undefined }}
              target={shouldOpenNewTab ? '_blank' : undefined}
              rel={shouldOpenNewTab ? 'noopener noreferrer' : undefined}
            >
              {children}
              {isExternal && <ExternalLink size={12} />}
            </Anchor>
          );
        },

        strong: ({ children }) => <SizableText fontWeight="600" color="$color">{children}</SizableText>,

        em: ({ children }) => <SizableText fontStyle="italic">{children}</SizableText>,

        table: ({ children }) => (
          <YStack borderRadius="$5" borderWidth={1} borderColor="$borderColor" overflow="scroll" {...{ marginVertical: compact ? "$2" : undefined, marginBottom: compact ? undefined : "$5" }}>
            <YStack minWidth="100%">{children}</YStack>
          </YStack>
        ),
        thead: ({ children }) => <YStack backgroundColor="$color3">{children}</YStack>,
        tbody: ({ children }) => <YStack backgroundColor="$background">{children}</YStack>,
        tr: ({ children }) => <YStack hoverStyle={{ backgroundColor: "$color3" }}>{children}</YStack>,
        th: ({ children }) => <SizableText textAlign="left" fontWeight="500" letterSpacing={0.4} {...{ paddingHorizontal: compact ? "$2.5" : "$4", paddingVertical: compact ? "$1.5" : "$3", fontSize: compact ? 11 : "$1" }}>{children}</SizableText>,
        td: ({ children }) => <SizableText {...{ paddingHorizontal: compact ? "$2.5" : "$4", paddingVertical: compact ? "$1.5" : "$3", fontSize: compact ? 12 : "$3" }}>{children}</SizableText>,
      }}
      >
        {processedContent}
      </ReactMarkdown>
    </YStack>
  );
}
