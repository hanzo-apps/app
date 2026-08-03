/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { MdSave } from "react-icons/md";

import { Button } from "@hanzo/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/overlay";
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

  // No outer gap wrapper — the header's action row owns the inter-button gap; a
  // local `gap-5` here made Publish float apart from Share/Push and read as a
  // different-weight control. Just the button (+ portal-rendered login modal).
  return (
    <div className="relative flex items-center">
      <div className="relative flex items-center">
        {user?.id ? (
          <Popover>
            <PopoverTrigger asChild>
              <div>
                {/* ONE Publish. It used to be two whole buttons, one per
                    breakpoint (max-lg:hidden / lg:hidden), which renders twice
                    the moment either variant fails to compile — and it did: the
                    toolbar showed Publish above Publish. A control that exists
                    twice can also be CLICKED twice, so the duplicate was not
                    only ugly.

                    Now the breakpoint moves the smallest thing that differs —
                    the icon — so the worst a CSS failure can do is show an icon
                    on a narrow screen, never a second Publish. */}
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5 px-2.5 text-xs"
                  disabled={disabled}
                >
                  <MdSave className="size-3.5 max-lg:hidden" />
                  {disabled ? "Building…" : "Publish"}
                </Button>
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="w-72 overflow-hidden p-0"
              align="end"
              sideOffset={8}
            >
              <DeployButtonContent pages={pages} prompts={prompts} />
            </PopoverContent>
          </Popover>
        ) : (
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 px-2.5 text-xs"
            onClick={() => setOpen(true)}
            disabled={disabled}
          >
            <MdSave className="size-3.5 max-lg:hidden" />
            {disabled ? "Building…" : "Publish"}
          </Button>
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
