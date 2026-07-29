'use client';

import { Wrench } from "lucide-react";
import { Button, Tooltip, TooltipTrigger, TooltipContent } from '@hanzo/ui';

// Fix — a bar toggle sibling to Re-imagine. Re-imagine seeds a NEW design from a
// URL; Fix corrects the CURRENT design to match attached reference images. It is
// a single mode flag: while active the ask-ai bar composes a fix-intent preamble
// in front of the prompt and the references ride the unchanged follow-up path.
export function Fix({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="iconXs"
          variant={active ? "default" : "ghost"}
          onClick={onToggle}
          aria-pressed={active}
          aria-label="Fix design to match a reference"
          borderRadius="$10" {...{ color: !active ? "$color11" : undefined, hoverStyle: !active ? {"backgroundColor":"$color3","color":"$color"} : undefined }}
        >
          <Wrench size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent align="start" maxWidth={220}>
        Fix the current design to match a reference. Attach reference images —
        drop or paste them here, or pick from your uploads — then send.
      </TooltipContent>
    </Tooltip>
  );
}
