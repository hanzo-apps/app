'use client';

/**
 * Template preview modal — the first step of the remix flow.
 *
 * A large preview of the template (its real screenshot rendered big, with a link
 * to the live page), titled with "by Hanzo" and a "Use template" action top-right
 * that advances to the Remix dialog. Games (no screenshot) show a schematic tile
 * and link straight to their existing detail page instead.
 */

import { Dialog, DialogContent, DialogTitle, Button } from '@hanzo/ui';
import { ExternalLink, Sparkles, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import type { ResourceItem } from '@/lib/resources-catalog';

export function TemplatePreviewModal({
  item,
  open,
  onOpenChange,
  onUse,
}: {
  item: ResourceItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUse: (item: ResourceItem) => void;
}) {
  if (!item) return null;
  const isGame = item.kind === 'game';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden border-border bg-card p-0 text-foreground">
        <DialogTitle className="sr-only">{item.title} preview</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-medium">{item.title}</h2>
            <p className="text-xs text-muted-foreground">
              {isGame ? `by Hanzo · ${item.framework}` : 'by Hanzo'}
            </p>
          </div>
          {isGame ? (
            <Link href={item.href || '#'} onClick={() => onOpenChange(false)}>
              <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                <Gamepad2 className="h-4 w-4" />
                Open game
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => onUse(item)}
            >
              <Sparkles className="h-4 w-4" />
              Use template
            </Button>
          )}
        </div>

        {/* Preview body */}
        <div className="p-5">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border bg-card">
            {item.hasImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image}
                alt={`${item.title} preview`}
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <Gamepad2 className="h-10 w-10" />
                <span className="text-sm">{item.framework}</span>
                {item.meta && <span className="text-xs text-muted-foreground">{item.meta}</span>}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-start justify-between gap-4">
            <p className="text-sm text-muted-foreground">{item.description}</p>
            {item.previewUrl && (
              <a
                href={item.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Live preview
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TemplatePreviewModal;
