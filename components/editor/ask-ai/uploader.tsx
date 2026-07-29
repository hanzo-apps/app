'use client';

import { YStack, XStack, SizableText, Paragraph } from '@hanzo/gui';
import { useRef, useState } from "react";
import { CircleCheck, Plus, Sparkles, Upload } from "lucide-react";
import Image from "next/image";

import { Popover, PopoverContent, PopoverTrigger, Button, Input } from '@hanzo/ui';
import { Page, Project } from "@/types";
import Loading from "@/components/loading";
import { useUser } from "@/hooks/useUser";
import { LoginModal } from "@/components/login-modal";
import { DeployButtonContent } from "../deploy-button/content";
import { imageFilesFrom, uploadProjectImages } from "@/lib/upload-project-images";

export const Uploader = ({
  pages,
  onLoading,
  isLoading,
  onFiles,
  onSelectFile,
  selectedFiles,
  files,
  project,
}: {
  pages: Page[];
  onLoading: (isLoading: boolean) => void;
  isLoading: boolean;
  files: string[];
  // Receives the newly-uploaded durable URLs; the bar unions + persists them.
  onFiles: (urls: string[]) => void;
  onSelectFile: (file: string) => void;
  selectedFiles: string[];
  project?: Project | null;
}) => {
  const { user } = useUser();

  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist image File(s) to the project's own storage and hand the returned
  // durable URLs to the bar. Shared by upload + AI generation, via the ONE
  // upload path in lib/upload-project-images.
  const persistFiles = async (images: File[]) => {
    const urls = await uploadProjectImages(project?.space_id, images);
    if (urls.length) onFiles(urls);
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || !project) return;
    onLoading(true);
    await persistFiles(imageFilesFrom(files));
    onLoading(false);
  };

  // Generate an image from a prompt via the per-user metered /v1/images BFF, then
  // persist it to the project so the published site embeds a durable Hanzo asset.
  const generateImage = async () => {
    if (!prompt.trim() || !project?.space_id) return;
    setGenerating(true);
    setGenError(null);
    onLoading(true);
    try {
      const res = await fetch("/v1/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json?.b64_json) {
        throw new Error(json?.message || `Generation failed (${res.status}).`);
      }
      const bin = atob(json.b64_json);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const mime: string = json.mime_type || "image/png";
      const ext = mime.includes("jpeg") ? "jpg" : mime.split("/")[1] || "png";
      const file = new File([bytes], `generated-${Date.now()}.${ext}`, {
        type: mime,
      });
      await persistFiles([file]);
      setPrompt("");
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(false);
      onLoading(false);
    }
  };

  return user?.id ? (
    <Popover open={open} onOpenChange={setOpen}>
      <form>
        <PopoverTrigger asChild>
          <Button
            size="iconXs"
            variant="ghost"
            aria-label="Add images"
            borderRadius="$10" color="$color11" hoverStyle={{ backgroundColor: "$color3", color: "$color" }}
          >
            <Plus size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={8}
          overflow="hidden" padding="$0" textAlign="center" className="min-w-xs"
        >
          {project?.space_id ? (
            <>
              <YStack backgroundColor="$color3" padding="$5" borderBottomWidth={1} borderColor="$borderColor">
                <XStack alignItems="center" justifyContent="center" columnGap="$4" marginBottom="$3">
                  <SizableText width={36} height={36} borderRadius="$10" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" elevation={1} alignItems="center" justifyContent="center" fontSize="$7" display="flex" flexDirection="row">
                    🎨
                  </SizableText>
                  <SizableText width={44} height={44} borderRadius="$10" backgroundColor="$color4" borderWidth={1} borderColor="$borderColor" elevation={4} alignItems="center" justifyContent="center" fontSize="$8" zIndex={2} display="flex" flexDirection="row">
                    🖼️
                  </SizableText>
                  <SizableText width={36} height={36} borderRadius="$10" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" elevation={1} alignItems="center" justifyContent="center" fontSize="$7" display="flex" flexDirection="row">
                    💻
                  </SizableText>
                </XStack>
                <Paragraph fontSize="$7" fontWeight="500" color="$color">
                  Add Custom Images
                </Paragraph>
                <Paragraph fontSize="$3" color="$color11" marginTop="$1.5">
                  Upload images to your project and use them with Hanzo AI!
                </Paragraph>
              </YStack>
              <YStack rowGap="$4" padding="$4.5">
                <div>
                  <Paragraph fontSize="$1" textAlign="left" color="$color11" marginBottom="$2">
                    Uploaded Images
                  </Paragraph>
                  <YStack gap="$1" flexWrap="wrap" maxHeight="$17" overflow="scroll">
                    {files.map((file) => (
                      <YStack
                        key={file}
                        userSelect="none" position="relative" cursor="pointer" backgroundColor="$color3" borderRadius="$3" borderColor="$borderColor" hoverStyle={{ elevation: 6 }}
                        onClick={() => onSelectFile(file)}
                      >
                        <Image
                          src={file}
                          alt="uploaded image"
                          width={56}
                          height={56}
                          objectFit="cover" width="100%" borderRadius="$1"
  />
                        {selectedFiles.includes(file) && (
                          <XStack position="absolute" top="$0" right="$0" height="100%" width="100%" alignItems="center" justifyContent="center" backgroundColor="black" borderRadius="$3">
                            <CircleCheck size={24} color="var(--brand-accent-muted)" />
                          </XStack>
                        )}
                      </YStack>
                    ))}
                  </YStack>
                </div>
                <div>
                  <Paragraph fontSize="$1" textAlign="left" color="$color11" marginBottom="$2">
                    Generate an image with AI
                  </Paragraph>
                  <XStack alignItems="center" gap="$2">
                    <Input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !generating) {
                          e.preventDefault();
                          void generateImage();
                        }
                      }}
                      placeholder="Describe an image…"
                      disabled={generating}
                      flex={1} minWidth={0} borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color3" paddingHorizontal="$3" paddingVertical="$2" fontSize="$3" color="$color" placeholderTextColor="$color11" focusStyle={{ outlineWidth: 0, borderColor: "$color8" }}
  />
                    <Button
                      flexShrink={0}
                      onClick={() => void generateImage()}
                      disabled={generating || !prompt.trim()}
                    >
                      {generating ? (
                        <Loading
                          overlay={false}
                          className="size-4 animate-spin"
  />
                      ) : (
                        <Sparkles size={16} />
                      )}
                      Generate
                    </Button>
                  </XStack>
                  {genError && (
                    <Paragraph fontSize="$1" textAlign="left" color="$red9" marginTop="$1.5">
                      {genError}
                    </Paragraph>
                  )}
                </div>
                <div>
                  <Paragraph fontSize="$1" textAlign="left" color="$color11" marginBottom="$2">
                    Or import images from your computer
                  </Paragraph>
                  <Button
                    position="relative" width="100%"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isLoading ? (
                      <>
                        <Loading
                          overlay={false}
                          className="ml-2 size-4 animate-spin"
  />
                        Uploading image(s)...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Upload Images
                      </>
                    )}
                  </Button>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    display="none"
                    multiple
                    accept="image/*"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => uploadFiles(e.target.files)}
  />
                </div>
              </YStack>
            </>
          ) : (
            <DeployButtonContent
              pages={pages}
              prompts={[]}
              options={{
                description: "Publish your project first to add custom images.",
              }}
  />
          )}
        </PopoverContent>
      </form>
    </Popover>
  ) : (
    <>
      <Button
        size="iconXs"
        variant="ghost"
        aria-label="Add images"
        borderRadius="$10" color="$color11" hoverStyle={{ backgroundColor: "$color3", color: "$color" }}
        onClick={() => setOpen(true)}
      >
        <Plus size={16} />
      </Button>
      <LoginModal
        open={open}
        onClose={() => setOpen(false)}
        pages={pages}
        title="Log In to add Custom Images"
        description="Sign in with your Hanzo account to publish your project and increase your monthly limit."
  />
    </>
  );
};
