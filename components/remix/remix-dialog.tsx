'use client';

/**
 * Remix dialog — the ownership/acknowledgment gate before creating the copy.
 *
 * "By remixing a project, you'll create a copy that you own." Prefills a project
 * name ("Remix of {Template}"), requires a one-time responsibility acknowledgment
 * (the remix button stays disabled until it's ticked), then hands the chosen name
 * to the progress modal which does the real create + provision + seed.
 */

import { YStack, SizableText, XStack } from '@hanzo/gui';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, Button, Checkbox, Input, Label } from '@hanzo/ui';

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
      <DialogContent maxWidth={448} borderColor="$borderColor" backgroundColor="$background">
        <DialogTitle fontSize="$6" fontWeight="500">Remix project</DialogTitle>
        <DialogDescription color="$color11">
          By remixing a project, you’ll create a copy that you own.
        </DialogDescription>

        <YStack marginTop="$2" rowGap="$4">
          <div>
            <Label htmlFor="remix-name" marginBottom="$1.5" fontSize="$3" color="$color">
              Project name
            </Label>
            <Input
              id="remix-name"
              value={name}
              onChangeText={(t) => setName(t)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter') confirm();
              }}
              borderColor="$borderColor" backgroundColor="$color3" color="$color"
              autoFocus
  />
          </div>

          <Label cursor="pointer" alignItems="flex-start" gap="$2.5">
            <Checkbox
              checked={ack}
              onCheckedChange={(v: boolean | 'indeterminate') => setAck(v === true)}
              marginTop="$0.5" borderColor="$borderColor"
  />
            <SizableText fontSize="$1" lineHeight={1.625} color="$color11">{ACK_TEXT}</SizableText>
          </Label>
        </YStack>

        <XStack marginTop="$2" justifyContent="flex-end" gap="$2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={confirm}
            disabled={!ack || !name.trim()}
            backgroundColor="$color12" hoverStyle={{ backgroundColor: "$color12" }} disabledStyle={{ opacity: 0.4 }}
          >
            Acknowledge and remix
          </Button>
        </XStack>
      </DialogContent>
    </Dialog>
  );
}

export default RemixDialog;
