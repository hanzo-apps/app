"use client";

import { ArrowUp } from "lucide-react";
import { PiGearSixFill } from "react-icons/pi";
import { TiUserAdd } from "react-icons/ti";

import { Button } from "@hanzo/ui";

export const AskAi = () => {
  return (
    <>
      <div className="bg-muted border border-border rounded-2xl ring-[4px] focus-within:ring-ring/30 focus-within:border-border ring-transparent group">
        <textarea
          rows={3}
          className="w-full bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground p-4 resize-none mb-1"
          placeholder="Ask Hanzo anything..."
          onChange={() => {}}
          onKeyDown={() => {}}
        />
        <div className="flex items-center justify-between gap-2 px-4 pb-3">
          <div className="flex-1 flex justify-start">
            <Button
              size="iconXs"
              variant="outline"
              className="!border-border !text-muted-foreground !hover:!border-foreground/30 hover:!text-foreground"
            >
              <TiUserAdd className="size-4" />
            </Button>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="black" size="sm">
              <PiGearSixFill className="size-4" />
              Settings
            </Button>
            <Button size="iconXs">
              <ArrowUp className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
