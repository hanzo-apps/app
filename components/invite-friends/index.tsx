'use client';

import { XStack, SizableText, Paragraph, YStack } from '@hanzo/ui';
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
            size="icon"
            variant="outline"
            group borderColor="$borderColor" hoverStyle={{ borderColor: "$borderColor" }}
          >
            <SizableText color="$color11" $group-hover={{ color: "$color" }}>
              <UserPlus size={16} />
            </SizableText>
          </Button>
        </DialogTrigger>
        <DialogContent borderRadius="$6" backgroundColor="$background" borderColor="$borderColor" $sm={{ maxWidth: 512 }} $lg={{ padding: "$6" }}>
          <DialogTitle display="none" />
          <main>
            <XStack alignItems="center" justifyContent="flex-start" columnGap="$4" marginBottom="$4.5">
              <XStack width={44} height={44} borderRadius="$10" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" elevation={1} alignItems="center" justifyContent="center">
                <SizableText fontSize="$8">😎</SizableText>
              </XStack>
              <XStack width={44} height={44} borderRadius="$10" backgroundColor="$color4" borderWidth={1} borderColor="$borderColor" elevation={1} alignItems="center" justifyContent="center" zIndex={2}>
                <SizableText fontSize="$8">😇</SizableText>
              </XStack>
              <XStack width={44} height={44} borderRadius="$10" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" elevation={1} alignItems="center" justifyContent="center">
                <SizableText fontSize="$8">😜</SizableText>
              </XStack>
            </XStack>
            <Paragraph fontSize="$7" fontWeight="500" color="$color" maxWidth={200} lineHeight="1.4">
              Invite someone to Hanzo
            </Paragraph>
            <Paragraph fontSize="$3" color="$color11" marginTop="$2" maxWidth={384}>
              Send them the link. They describe an app and watch it get built.
            </Paragraph>
            <YStack marginTop="$4" columnGap="$3.5">
              <a
                href="https://x.com/intent/post?url=https://hanzo.ai/&text=Describe%20an%20app%20and%20Hanzo%20builds%20it."
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <Twitter size={16} />
                  Share on X
                </Button>
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  copyToClipboard("https://hanzo.ai/");
                  toast.success("Invite link copied");
                }}
              >
                <Link size={16} />
                Copy invite link
              </Button>
            </YStack>
          </main>
        </DialogContent>
      </form>
    </Dialog>
  );
}
