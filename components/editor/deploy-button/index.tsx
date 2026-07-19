/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { MdSave } from "react-icons/md";

import { Button } from "@hanzo/ui";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hanzo/ui";
import { LoginModal } from "@/components/login-modal";
import { useUser } from "@/hooks/useUser";
import { Page } from "@/types";
import { DeployButtonContent } from "./content";

export function DeployButton({
  pages,
  prompts,
  disabled = false,
}: {
  pages: Page[];
  prompts: string[];
  // True while the AI is still generating — publishing now would ship a
  // truncated/blank page, so the trigger is disabled until generation settles.
  disabled?: boolean;
}) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-end gap-5">
      <div className="relative flex items-center justify-end">
        {user?.id ? (
          <Popover>
            <PopoverTrigger asChild>
              <div>
                <Button variant="default" size="sm" className="max-lg:hidden" disabled={disabled}>
                  <MdSave className="size-4" />
                  {disabled ? "Building…" : "Publish"}
                </Button>
                <Button variant="default" size="sm" className="lg:hidden" disabled={disabled}>
                  {disabled ? "Building…" : "Publish"}
                </Button>
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="w-72 !rounded-xl !p-0 !bg-neutral-950 !border-white/10 overflow-hidden shadow-2xl"
              align="end"
              sideOffset={8}
            >
              <DeployButtonContent pages={pages} prompts={prompts} />
            </PopoverContent>
          </Popover>
        ) : (
          <>
            <Button
              variant="default"
              size="sm"
              className="max-lg:hidden"
              onClick={() => setOpen(true)}
              disabled={disabled}
            >
              <MdSave className="size-4" />
              {disabled ? "Building…" : "Publish"}
            </Button>
            <Button
              variant="default"
              size="sm"
              className="lg:hidden"
              onClick={() => setOpen(true)}
              disabled={disabled}
            >
              {disabled ? "Building…" : "Publish"}
            </Button>
          </>
        )}
        <LoginModal
          open={open}
          onClose={() => setOpen(false)}
          pages={pages}
          title="Log In to publish your Project"
          description="Log in with your Hanzo account to publish your project and increase your monthly free limit."
        />
      </div>
    </div>
  );
}
