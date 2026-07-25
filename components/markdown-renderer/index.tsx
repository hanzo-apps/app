'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
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
    <div className={cn(S.wrap, className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        h1: ({ children }) => {
          const text = children?.toString() || '';
          const id = slugify(text);
          return <h1 id={id} className={S.h1}>{children}</h1>;
        },
        h2: ({ children }) => {
          const text = children?.toString() || '';
          const id = slugify(text);
          const key = `2-${text}`;
          const index = headingIndexMap.get(key);
          return (
            <h2 id={id} data-heading-index={index} className={S.h2}>
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
            <h3 id={id} data-heading-index={index} className={S.h3}>
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
            <h4 id={id} data-heading-index={index} className={S.h4}>
              {children}
            </h4>
          );
        },

        p: ({ children }) => <p className={S.p}>{children}</p>,

        ul: ({ children }) => <ul className={S.ul}>{children}</ul>,
        ol: ({ children }) => <ol className={S.ol}>{children}</ol>,
        li: ({ children }) => <li className={S.li}>{children}</li>,

        pre: ({ children, ...props }) => {
          // Extract language from code block if present
          const codeElement = React.Children.toArray(children).find(
            (child) => React.isValidElement(child) && child.type === 'code'
          ) as React.ReactElement<{ className?: string }> | undefined;

          const codeClassName = codeElement?.props?.className || '';
          const match = /language-(\w+)/.exec(codeClassName);
          const language = match ? match[1] : null;

          return (
            <div className={S.preWrap}>
              {language && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-background/80 rounded border border-border/50 backdrop-blur-sm">
                  {language}
                </div>
              )}
              <pre className={S.pre} {...props}>
                {children}
              </pre>
            </div>
          );
        },

        code: ({ className: codeClassName, children, ...props }) => {
          const match = /language-(\w+)/.exec(codeClassName || '');
          const isInline = !match;

          if (isInline) {
            return (
              <code className="px-1.5 py-0.5 rounded bg-muted/70 border border-border/30 font-mono text-[0.85em]" {...props}>
                {children}
              </code>
            );
          }

          // Fenced code block with language
          return (
            <code className="font-mono text-[12px] block leading-relaxed" {...props}>
              {children}
            </code>
          );
        },

        blockquote: ({ children }) => (
          <blockquote className={cn(S.blockquote, !compact && 'rounded-r')}>
            {children}
          </blockquote>
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
            <a
              href={href}
              onClick={handleClick}
              className={cn(
                "text-foreground underline underline-offset-2 decoration-border hover:decoration-foreground cursor-pointer",
                isExternal && "inline-flex items-center gap-1"
              )}
              target={shouldOpenNewTab ? '_blank' : undefined}
              rel={shouldOpenNewTab ? 'noopener noreferrer' : undefined}
            >
              {children}
              {isExternal && <ExternalLink className="h-3 w-3 inline" />}
            </a>
          );
        },

        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,

        em: ({ children }) => <em className="italic">{children}</em>,

        hr: () => <hr className={S.hr} />,

        table: ({ children }) => (
          <div className={cn("overflow-x-auto rounded-lg border border-border", compact ? "my-2" : "mb-6")}>
            <table className="min-w-full divide-y divide-border">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
        tbody: ({ children }) => <tbody className="divide-y divide-border bg-background">{children}</tbody>,
        tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors">{children}</tr>,
        th: ({ children }) => <th className={cn("text-left font-medium tracking-wide", compact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-3 text-xs")}>{children}</th>,
        td: ({ children }) => <td className={cn(compact ? "px-2.5 py-1.5 text-[12px]" : "px-4 py-3 text-sm")}>{children}</td>,
      }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
