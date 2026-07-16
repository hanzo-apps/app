import { Wrench } from "lucide-react";
import classNames from "classnames";

import { Button } from "@hanzo/ui";
import { Tooltip, TooltipTrigger, TooltipContent } from "@hanzo/ui";

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
          size="xs"
          variant={active ? "default" : "outline"}
          onClick={onToggle}
          aria-pressed={active}
          className={classNames("h-[28px]", {
            "!text-neutral-400 hover:!text-neutral-200 !border-neutral-600 !hover:!border-neutral-500":
              !active,
          })}
        >
          <Wrench className="size-4" />
          Fix
        </Button>
      </TooltipTrigger>
      <TooltipContent
        align="start"
        className="bg-neutral-950 text-xs text-neutral-200 py-1 px-2 rounded-md -translate-y-0.5 max-w-[220px]"
      >
        Fix the current design to match a reference. Attach reference images —
        drop or paste them here, or pick from your uploads — then send.
      </TooltipContent>
    </Tooltip>
  );
}
