import { TiUserAdd } from "react-icons/ti";
import { Link } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { useCopyToClipboard } from "react-use";
import { toast } from "@hanzo/ui";

import { Button } from "@hanzo/ui";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@hanzo/ui";

export function InviteFriends() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, copyToClipboard] = useCopyToClipboard();

  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button
            size="iconXs"
            variant="outline"
            className="!border-border !text-muted-foreground hover:!border-border hover:!text-foreground"
          >
            <TiUserAdd className="size-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg lg:!p-8 !rounded-xl bg-card text-foreground border-border">
          <DialogTitle className="hidden" />
          <main>
            <div className="flex items-center justify-start -space-x-4 mb-5">
              <div className="size-11 rounded-full bg-muted border border-border shadow-2xs flex items-center justify-center text-2xl">
                😎
              </div>
              <div className="size-11 rounded-full bg-secondary border border-border shadow-2xs flex items-center justify-center text-2xl z-2">
                😇
              </div>
              <div className="size-11 rounded-full bg-muted border border-border shadow-2xs flex items-center justify-center text-2xl">
                😜
              </div>
            </div>
            <p className="text-xl font-medium text-foreground max-w-[200px]">
              Invite your friends to join us!
            </p>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Support us and share the love and let them know about our awesome
              platform.
            </p>
            <div className="mt-4 space-x-3.5">
              <a
                href="https://x.com/intent/post?url=https://hanzo.ai/&text=Checkout%20this%20awesome%20Ai%20Tool!%20Vibe%20coding%20has%20never%20been%20so%20easy✨"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <FaXTwitter className="size-4" />
                  Share on
                </Button>
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  copyToClipboard("https://hanzo.ai/");
                  toast.success("Invite link copied to clipboard!");
                }}
              >
                <Link className="size-4" />
                Copy Invite Link
              </Button>
            </div>
          </main>
        </DialogContent>
      </form>
    </Dialog>
  );
}
