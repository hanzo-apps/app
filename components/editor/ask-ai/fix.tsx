import { Wrench } from "lucide-react";
import classNames from "classnames";

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
      {/* Native <button> (NOT @hanzo/ui <Button>): a single element the Radix
          Trigger clones cleanly — the shared Button array-wraps icon+text and
          trips Slot's React.Children.only under `asChild`. */}
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={active}
          className={classNames(
            "inline-flex h-[28px] items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
            active
              ? "bg-white text-neutral-900"
              : "text-neutral-400 hover:bg-white/10 hover:!text-neutral-200",
          )}
        >
          <Wrench className="size-4" />
          Fix
        </button>
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
