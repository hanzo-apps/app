'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { View, XStack, SizableText } from '@hanzo/ui';
import { useState } from "react";

import { Button, Popover, PopoverContent, PopoverTrigger } from '@hanzo/ui';
import { LoginModal } from "@/components/login-modal";
import { useUser } from "@/hooks/useUser";
import { Page } from "@/types";
import { DeployButtonContent } from "./content";
import { accent } from "@/lib/chrome";
import { Save } from "lucide-react";

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
                {/* ONE Publish. It used to be two whole buttons, one per
                    breakpoint (narrow-only / wide-only), which renders twice
                    the moment either variant fails to compile — and it did: the
                    toolbar showed Publish above Publish. A control that exists
                    twice can also be CLICKED twice, so the duplicate was not
                    only ugly.

                    Now the breakpoint moves the smallest thing that differs —
                    the icon — so the worst a media-query failure can do is show
                    an icon on a narrow screen, never a second Publish. */}
                <Button
                  {...accent}
                  size="sm"
                  height={32} gap="$1.5" paddingHorizontal="$3" borderRadius={999} borderWidth={0}
                  disabled={disabled}
                >
                  <View $lg={{ display: "none" }}>
                    <Save size={14} />
                  </View>
                  <SizableText fontSize="$1" color="$color12">{disabled ? "Building…" : "Publish"}</SizableText>
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
          <Button
            {...accent}
            size="sm"
            height={32} gap="$1.5" paddingHorizontal="$3" borderRadius={999} borderWidth={0}
            onClick={() => setOpen(true)}
            disabled={disabled}
          >
            <View $lg={{ display: "none" }}>
              <Save size={14} />
            </View>
            <SizableText fontSize="$1" color="$color12">{disabled ? "Building…" : "Publish"}</SizableText>
          </Button>
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
