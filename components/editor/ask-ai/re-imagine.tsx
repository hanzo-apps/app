import { useState } from "react";
import { Paintbrush } from "lucide-react";
import { toast } from "@hanzo/ui";

import { Button } from "@hanzo/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/overlay";
import { Input } from "@/components/control";
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
            size="iconXs"
            variant="ghost"
            aria-label="Redesign from a URL"
            title="Redesign: recreate an existing site's look from its URL"
            className="rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Paintbrush className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={8}
          className="min-w-xs overflow-hidden p-0 text-center"
        >
          <header className="bg-muted/40 p-6 border-b border-border">
            <div className="flex items-center justify-center -space-x-4 mb-3">
              <div className="size-9 rounded-full bg-muted border border-border shadow-2xs flex items-center justify-center text-xl">
                🎨
              </div>
              <div className="size-11 rounded-full bg-secondary border border-border shadow-lg flex items-center justify-center text-2xl z-2">
                🥳
              </div>
              <div className="size-9 rounded-full bg-muted border border-border shadow-2xs flex items-center justify-center text-xl">
                💎
              </div>
            </div>
            <p className="text-xl font-medium text-foreground">
              Redesign your Site!
            </p>
            <p className="text-sm text-muted-foreground mt-1.5">
              Try our new Redesign feature to give your site a fresh look.
            </p>
          </header>
          <main className="space-y-4 p-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Enter your website URL to get started:
              </p>
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
                className="text-left"
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Then, let&apos;s redesign it!
              </p>
              <Button
                className="relative w-full"
                onClick={handleClick}
              >
                {isLoading ? (
                  <>
                    <Loading
                      overlay={false}
                      className="ml-2 size-4 animate-spin"
                    />
                    Fetching your site...
                  </>
                ) : (
                  <>
                    Redesign <Paintbrush className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </main>
        </PopoverContent>
      </form>
    </Popover>
  );
}
