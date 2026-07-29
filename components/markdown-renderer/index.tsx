'use client';

import { Separator } from '@hanzo/ui';
import { YStack, H1, H2, H3, H4, Paragraph, SizableText, Anchor } from '@hanzo/gui';
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
  className?: string;
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

export function MarkdownRenderer({ content, className, skipNormalization = false, compact = false }: MarkdownRendererProps) {
  const router = useRouter();

  // Normalize content to fix common LLM formatting issues
  const processedContent = skipNormalization ? content : normalizeContent(content);

  // Per-element class sets — the ONLY thing density changes. `prose` uses
  // :where() (0 specificity), so these explicit classes always win.
  const S = compact
    ? {
        wrap: 'prose prose-sm dark:prose-invert max-w-none text-[13px] leading-relaxed',
        h1: 'text-[15px] font-semibold mt-3 mb-1.5 first:mt-0',
        h2: 'text-[14px] font-semibold mt-3 mb-1 first:mt-0',
        h3: 'text-[13px] font-semibold mt-2.5 mb-1',
        h4: 'text-[13px] font-medium mt-2 mb-1 text-muted-foreground',
        p: 'my-1.5 leading-relaxed first:mt-0 last:mb-0',
        ul: 'list-disc pl-5 my-1.5 space-y-1',
        ol: 'list-decimal pl-5 my-1.5 space-y-1',
        li: 'leading-relaxed',
        preWrap: 'relative my-2 group',
        pre: 'p-3 rounded-lg bg-muted/60 border border-border/60 overflow-x-auto text-[12px]',
        hr: 'my-3 border-border',
        blockquote: 'border-l-2 border-border pl-3 pr-3 py-1 my-2 italic text-muted-foreground',
      }
    : {
        wrap: 'prose prose-sm dark:prose-invert max-w-none',
        h1: 'text-3xl font-medium mb-4 mt-8 first:mt-0',
        h2: 'text-2xl font-medium mb-3 mt-8 pb-2 border-b border-border/50 first:mt-0',
        h3: 'text-xl font-medium mb-2 mt-6',
        h4: 'text-lg font-medium mb-2 mt-4',
        p: 'mb-4 leading-relaxed last:mb-0',
        ul: 'list-disc pl-6 mb-4 space-y-2',
        ol: 'list-decimal pl-6 mb-4 space-y-2',
        li: 'text-sm leading-relaxed',
        preWrap: 'relative mb-4 group',
        pre: 'p-4 rounded-lg bg-muted/50 border border-border/50 overflow-x-auto',
        hr: 'my-8 border-border',
        blockquote: 'border-l-4 border-primary/30 bg-muted/30 pl-4 pr-4 py-3 mb-4 italic text-muted-foreground rounded-r',
      };

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
    <YStack className={`${S.wrap} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        h1: ({ children }) => {
          const text = children?.toString() || '';
          const id = slugify(text);
          return <H1 id={id} className={`${S.h1}`}>{children}</H1>;
        },
        h2: ({ children }) => {
          const text = children?.toString() || '';
          const id = slugify(text);
          const key = `2-${text}`;
          const index = headingIndexMap.get(key);
          return (
            <H2 id={id} data-heading-index={index} className={`${S.h2}`}>
              {children}
            </H2>
          );
        },
        h3: ({ children }) => {
          const text = children?.toString() || '';
          const id = slugify(text);
          const key = `3-${text}`;
          const index = headingIndexMap.get(key);
          return (
            <H3 id={id} data-heading-index={index} className={`${S.h3}`}>
              {children}
            </H3>
          );
        },
        h4: ({ children }) => {
          const text = children?.toString() || '';
          const id = slugify(text);
          const key = `4-${text}`;
          const index = headingIndexMap.get(key);
          return (
            <H4 id={id} data-heading-index={index} className={`${S.h4}`}>
              {children}
            </H4>
          );
        },

        p: ({ children }) => <Paragraph className={`${S.p}`}>{children}</Paragraph>,

        ul: ({ children }) => <YStack className={`${S.ul}`}>{children}</YStack>,
        ol: ({ children }) => <YStack className={`${S.ol}`}>{children}</YStack>,
        li: ({ children }) => <SizableText className={`${S.li}`}>{children}</SizableText>,

        pre: ({ children, ...props }) => {
          // Extract language from code block if present
          const codeElement = React.Children.toArray(children).find(
            (child) => React.isValidElement(child) && child.type === 'code'
          ) as React.ReactElement<{ className?: string }> | undefined;

          const codeClassName = codeElement?.props?.className || '';
          const match = /language-(\w+)/.exec(codeClassName);
          const language = match ? match[1] : null;

          return (
            <YStack className={`${S.preWrap}`}>
              {language && (
                <SizableText position="absolute" top="$2" right="$2" paddingHorizontal="$1.5" paddingVertical="$0.5" fontSize={10} fontWeight="500" color="$color11" backgroundColor="$background" borderRadius="$2" borderWidth={1} borderColor="$borderColor" backdropFilter="blur(4px)" display="flex" flexDirection="column">
                  {language}
                </SizableText>
              )}
              <SizableText fontFamily="$mono" whiteSpace="pre" className={`${S.pre}`} {...props}>
                {children}
              </SizableText>
            </YStack>
          );
        },

        code: ({ className: codeClassName, children, ...props }) => {
          const match = /language-(\w+)/.exec(codeClassName || '');
          const isInline = !match;

          if (isInline) {
            return (
              <SizableText paddingHorizontal="$1.5" paddingVertical="$0.5" borderRadius="$2" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" fontFamily="$mono" color="0.85em" {...props}>
                {children}
              </SizableText>
            );
          }

          // Fenced code block with language
          return (
            <SizableText fontFamily="$mono" fontSize={12} lineHeight={1.625} {...props}>
              {children}
            </SizableText>
          );
        },

        blockquote: ({ children }) => (
          <SizableText className={`rounded-r ${S.blockquote}`}>
            {children}
          </SizableText>
        ),

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
          const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
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

        hr: () => <Separator className={`${S.hr}`} />,

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
