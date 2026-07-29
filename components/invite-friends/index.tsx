'use client';

import { XStack, SizableText, Paragraph, YStack } from '@hanzo/gui';
import { Link, Twitter, UserPlus } from "lucide-react";
import { useCopyToClipboard } from "react-use";
import { toast, Button, Dialog, DialogContent, DialogTitle, DialogTrigger } from '@hanzo/ui';


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
            borderColor="$borderColor" color="$color11" hoverStyle={{ borderColor: "$borderColor", color: "$color" }}
          >
            <UserPlus size={16} />
          </Button>
        </DialogTrigger>
        <DialogContent borderRadius="$6" backgroundColor="$background" color="$color" borderColor="$borderColor" $sm={{ maxWidth: 512 }} $lg={{ padding: "$6" }}>
          <DialogTitle display="none" />
          <main>
            <XStack alignItems="center" justifyContent="flex-start" columnGap="$4" marginBottom="$4.5">
              <SizableText width={44} height={44} borderRadius="$10" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" elevation={1} alignItems="center" justifyContent="center" fontSize="$8" display="flex" flexDirection="row">
                😎
              </SizableText>
              <SizableText width={44} height={44} borderRadius="$10" backgroundColor="$color4" borderWidth={1} borderColor="$borderColor" elevation={1} alignItems="center" justifyContent="center" fontSize="$8" zIndex={2} display="flex" flexDirection="row">
                😇
              </SizableText>
              <SizableText width={44} height={44} borderRadius="$10" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" elevation={1} alignItems="center" justifyContent="center" fontSize="$8" display="flex" flexDirection="row">
                😜
              </SizableText>
            </XStack>
            <Paragraph fontSize="$7" fontWeight="500" color="$color" maxWidth={200}>
              Invite your friends to join us!
            </Paragraph>
            <Paragraph fontSize="$3" color="$color11" marginTop="$2" maxWidth={384}>
              Support us and share the love and let them know about our awesome
              platform.
            </Paragraph>
            <YStack marginTop="$4" columnGap="$3.5">
              <a
                href="https://x.com/intent/post?url=https://hanzo.ai/&text=Checkout%20this%20awesome%20Ai%20Tool!%20Vibe%20coding%20has%20never%20been%20so%20easy✨"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <Twitter size={16} />
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
                <Link size={16} />
                Copy Invite Link
              </Button>
            </YStack>
          </main>
        </DialogContent>
      </form>
    </Dialog>
  );
}
