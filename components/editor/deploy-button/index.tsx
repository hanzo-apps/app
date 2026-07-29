'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { XStack } from '@hanzo/gui';
import { useState } from "react";
import { MdSave } from "react-icons/md";

import { Button, Popover, PopoverContent, PopoverTrigger } from '@hanzo/ui';
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
    <XStack position="relative" alignItems="center">
      <XStack position="relative" alignItems="center">
        {user?.id ? (
          <Popover>
            <PopoverTrigger asChild>
              <div>
                <Button
                  variant="default"
                  size="sm"
                  height={28} gap="$1.5" paddingHorizontal="$2.5" fontSize="$1" $lg={{ display: "none" }}
                  disabled={disabled}
                >
                  <MdSave size={14} />
                  {disabled ? "Building…" : "Publish"}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  height={28} paddingHorizontal="$2.5" fontSize="$1" $lg={{ display: "none" }}
                  disabled={disabled}
                >
                  {disabled ? "Building…" : "Publish"}
                </Button>
              </div>
            </PopoverTrigger>
            <PopoverContent
              width={288} overflow="hidden" padding="$0"
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
              height={28} gap="$1.5" paddingHorizontal="$2.5" fontSize="$1" $lg={{ display: "none" }}
              onClick={() => setOpen(true)}
              disabled={disabled}
            >
              <MdSave size={14} />
              {disabled ? "Building…" : "Publish"}
            </Button>
            <Button
              variant="default"
              size="sm"
              height={28} paddingHorizontal="$2.5" fontSize="$1" $lg={{ display: "none" }}
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
      </XStack>
    </XStack>
  );
}
