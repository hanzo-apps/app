'use client';

/**
 * Remix dialog — the ownership/acknowledgment gate before creating the copy.
 *
 * "By remixing a project, you'll create a copy that you own." Prefills a project
 * name ("Remix of {Template}"), requires a one-time responsibility acknowledgment
 * (the remix button stays disabled until it's ticked), then hands the chosen name
 * to the progress modal which does the real create + provision + seed.
 */

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, Button, Input, Checkbox } from '@hanzo/ui';

const ACK_TEXT =
  'When remixing a template, I take responsibility over project security, compliance, data, and operations. Templates are provided as starting points and don’t guarantee functionality or security out of the box.';

export function RemixDialog({
  templateTitle,
  open,
  onOpenChange,
  onConfirm,
}: {
  templateTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (projectName: string) => void;
}) {
  const [name, setName] = useState('');
  const [ack, setAck] = useState(false);

  // Reset the form each time it opens for a (possibly different) template.
  useEffect(() => {
    if (open) {
      setName(`Remix of ${templateTitle}`);
      setAck(false);
    }
  }, [open, templateTitle]);

  const confirm = () => {
    const trimmed = name.trim();
    if (!trimmed || !ack) return;
    onConfirm(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-card text-foreground">
        <DialogTitle className="text-lg font-medium">Remix project</DialogTitle>
        <DialogDescription className="text-muted-foreground">
          By remixing a project, you’ll create a copy that you own.
        </DialogDescription>

        <div className="mt-2 space-y-4">
          <div>
            <label htmlFor="remix-name" className="mb-1.5 block text-sm text-foreground">
              Project name
            </label>
            <Input
              id="remix-name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter') confirm();
              }}
              className="border-border bg-muted text-foreground"
              autoFocus
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2.5">
            <Checkbox
              checked={ack}
              onCheckedChange={(v: boolean | 'indeterminate') => setAck(v === true)}
              className="mt-0.5 border-border"
            />
            <span className="text-xs leading-relaxed text-muted-foreground">{ACK_TEXT}</span>
          </label>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-foreground">
            Cancel
          </Button>
          <Button
            onClick={confirm}
            disabled={!ack || !name.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            Acknowledge and remix
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RemixDialog;
