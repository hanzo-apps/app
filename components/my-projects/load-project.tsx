"use client";
import { View, YStack, XStack, SizableText, Paragraph } from '@hanzo/gui';
import { useState } from "react";
import { Import } from "lucide-react";

import { Project } from "@/types";
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger, Input, toast } from '@hanzo/ui';
import Loading from "@/components/loading";
import { api } from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import { LoginModal } from "../login-modal";
import { useRouter } from "next/navigation";

export const LoadProject = ({
  fullXsBtn = false,
  onSuccess,
}: {
  fullXsBtn?: boolean;
  onSuccess: (project: Project) => void;
}) => {
  const { user } = useUser();
  const router = useRouter();

  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const checkIfUrlIsValid = (url: string) => {
    // Match a Hanzo project URL like: https://hanzo.ai/projects/username/project or https://hanzo.app/projects/username/project
    const urlPattern = new RegExp(
      /^(https?:\/\/)?(hanzo\.ai|hanzo\.app)\/projects\/([\w-]+)\/([\w-]+)$/,
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
      toast.error("Please enter a valid Hanzo project URL.");
      return;
    }

    const [username, namespace] = url
      .replace(/https?:\/\/(hanzo\.ai|hanzo\.app)\/projects\//, "")
      .split("/");

    setIsLoading(true);
    try {
      const response = await api.post(`/me/projects/${username}/${namespace}`);
      toast.success("Project imported successfully!");
      setOpen(false);
      setUrl("");
      onSuccess(response.data.project);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error?.response?.data?.redirect) {
        return router.push(error.response.data.redirect);
      }
      toast.error(
        error?.response?.data?.error ?? "Failed to import the project."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!user ? (
        <>
          {/* ONE Load. See deploy-button: a whole button per breakpoint renders
              twice the moment a variant fails to compile, and the toolbar showed
              Load above Load. The breakpoint now moves only the words that differ. */}
          <Button
            variant="outline"
            size="sm"
            height={28} gap="$1.5" paddingHorizontal="$2.5" borderColor="$borderColor" backgroundColor="$color3" hoverStyle={{ backgroundColor: "$color3" }}
            onClick={() => setOpenLoginModal(true)}
          >
            <View $lg={{ display: "none" }}>
              <Import size={14} />
            </View>
            <SizableText fontSize="$1">Load</SizableText><SizableText fontSize="$2" $lg={{ display: "none" }}> existing Project</SizableText>
          </Button>
          <LoginModal
            open={openLoginModal}
            onClose={setOpenLoginModal}
            title="Log In to load your Project"
            description="Log In to load an existing project and increase your free limit!"
  />
        </>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <div>
              {/* ONE Load — the breakpoint moves the icon, not the control. */}
              <Button
                variant="outline"
                size="sm"
                height={28} gap="$1.5" paddingHorizontal="$2.5" borderColor="$borderColor" backgroundColor="$color3" hoverStyle={{ backgroundColor: "$color3" }}
              >
                <View $lg={{ display: "none" }}>
                  <Import size={14} />
                </View>
                <SizableText fontSize="$1">Load</SizableText>
              </Button>
            </div>
          </DialogTrigger>
          <DialogContent padding="$0" borderRadius="$6" backgroundColor="$background" borderColor="$borderColor" overflow="hidden" $sm={{ maxWidth: 448 }}>
            <DialogTitle display="none" />
            <YStack backgroundColor="$color3" padding="$5" borderBottomWidth={1} borderColor="$borderColor">
              <XStack alignItems="center" justifyContent="center" columnGap="$4" marginBottom="$3">
                <XStack width={44} height={44} borderRadius="$10" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" elevation={1} alignItems="center" justifyContent="center">
                  <SizableText fontSize="$8">🎨</SizableText>
                </XStack>
                <XStack borderRadius="$10" backgroundColor="$color4" borderWidth={1} borderColor="$borderColor" elevation={4} alignItems="center" justifyContent="center" zIndex={2} height={52} width={52}>
                  <SizableText fontSize="$10">🥳</SizableText>
                </XStack>
                <XStack width={44} height={44} borderRadius="$10" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" elevation={1} alignItems="center" justifyContent="center">
                  <SizableText fontSize="$8">💎</SizableText>
                </XStack>
              </XStack>
              <Paragraph fontSize="$8" fontWeight="500" color="$color" textAlign="center">
                Import a Project
              </Paragraph>
              <Paragraph fontSize="$4" color="$color11" marginTop="$1.5" textAlign="center">
                Enter the URL of your Hanzo project to import an existing
                project.
              </Paragraph>
            </YStack>
            <YStack rowGap="$4" paddingHorizontal={36} paddingBottom={36} paddingTop="$2">
              <div>
                <Paragraph fontSize="$3" color="$color11" marginBottom="$2" textAlign="center">
                  Enter your Hanzo project URL
                </Paragraph>
                <Input
                  type="text"
                  placeholder="https://hanzo.ai/projects/username/project"
                  value={url}
                  onChangeText={(v: string) => setUrl(v)}
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
                <Paragraph fontSize="$3" color="$color11" marginBottom="$2" textAlign="center">
                  Then, let&apos;s import it!
                </Paragraph>
                <Button
                  position="relative" width="100%"
                  onClick={handleClick}
                >
                  {isLoading ? (
                    <>
                      <Loading overlay={false} size={16} />
                      Fetching your Space...
                    </>
                  ) : (
                    <>Import your Space</>
                  )}
                </Button>
              </div>
            </YStack>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
