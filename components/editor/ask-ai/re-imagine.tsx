'use client';

import { YStack, XStack, SizableText, Paragraph } from '@hanzo/gui';
import { useState } from "react";
import { Paintbrush } from "lucide-react";
import { toast, Button, Popover, PopoverContent, PopoverTrigger, Input } from '@hanzo/ui';

import Loading from "@/components/loading";
import { api } from "@/lib/api";

export function ReImagine({
  onRedesign,
}: {
  onRedesign: (md: string) => void;
}) {
  const [url, setUrl] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkIfUrlIsValid = (url: string) => {
    const urlPattern = new RegExp(
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
      "i"
    );
    return urlPattern.test(url);
  };

  const handleClick = async () => {
    if (isLoading) return; // Prevent multiple clicks while loading
    if (!url) {
      toast.error("Please enter a URL.");
      return;
    }
    if (!checkIfUrlIsValid(url)) {
      toast.error("Please enter a valid URL.");
      return;
    }
    setIsLoading(true);
    const response = await api.put("/re-design", {
      url: url.trim(),
    });
    if (response?.data?.ok) {
      setOpen(false);
      setUrl("");
      onRedesign(response.data.markdown);
      toast.success("Hanzo AI is redesigning your site! Let it cook... 🔥");
    } else {
      toast.error(response?.data?.error || "Failed to redesign the site.");
    }
    setIsLoading(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <form>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Redesign from a URL"
            title="Redesign: recreate an existing site's look from its URL"
            borderRadius="$10" color="$color11" hoverStyle={{ backgroundColor: "$color3", color: "$color" }}
          >
            <Paintbrush size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={8}
          overflow="hidden" padding="$0" textAlign="center" minWidth={320}
        >
          <YStack backgroundColor="$color3" padding="$5" borderBottomWidth={1} borderColor="$borderColor">
            <XStack alignItems="center" justifyContent="center" columnGap="$4" marginBottom="$3">
              <SizableText width={36} height={36} borderRadius="$10" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" elevation={1} alignItems="center" justifyContent="center" fontSize="$7" display="flex" flexDirection="row">
                🎨
              </SizableText>
              <SizableText width={44} height={44} borderRadius="$10" backgroundColor="$color4" borderWidth={1} borderColor="$borderColor" elevation={4} alignItems="center" justifyContent="center" fontSize="$8" zIndex={2} display="flex" flexDirection="row">
                🥳
              </SizableText>
              <SizableText width={36} height={36} borderRadius="$10" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" elevation={1} alignItems="center" justifyContent="center" fontSize="$7" display="flex" flexDirection="row">
                💎
              </SizableText>
            </XStack>
            <Paragraph fontSize="$7" fontWeight="500" color="$color">
              Redesign your Site!
            </Paragraph>
            <Paragraph fontSize="$3" color="$color11" marginTop="$1.5">
              Try our new Redesign feature to give your site a fresh look.
            </Paragraph>
          </YStack>
          <YStack rowGap="$4" padding="$5">
            <div>
              <Paragraph fontSize="$3" color="$color11" marginBottom="$2">
                Enter your website URL to get started:
              </Paragraph>
              <Input
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  const inputUrl = e.target.value.trim();
                  if (!inputUrl) {
                    setUrl("");
                    return;
                  }
                  if (!checkIfUrlIsValid(inputUrl)) {
                    toast.error("Please enter a valid URL.");
                    return;
                  }
                  setUrl(inputUrl);
                }}
                textAlign="left"
  />
            </div>
            <div>
              <Paragraph fontSize="$3" color="$color11" marginBottom="$2">
                Then, let&apos;s redesign it!
              </Paragraph>
              <Button
                position="relative" width="100%"
                onClick={handleClick}
              >
                {isLoading ? (
                  <>
                    <Loading overlay={false} size={16} />
                    Fetching your site...
                  </>
                ) : (
                  <>
                    Redesign <Paintbrush size={16} />
                  </>
                )}
              </Button>
            </div>
          </YStack>
        </PopoverContent>
      </form>
    </Popover>
  );
}
