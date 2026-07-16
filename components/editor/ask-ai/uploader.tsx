import { useRef, useState } from "react";
import { Images, Upload, Sparkles } from "lucide-react";
import Image from "next/image";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hanzo/ui";
import { Button } from "@hanzo/ui";
import { Page, Project } from "@/types";
import Loading from "@/components/loading";
import { RiCheckboxCircleFill } from "react-icons/ri";
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
            variant="outline"
            className="!border-neutral-600 !text-neutral-400 !hover:!border-neutral-500 hover:!text-neutral-300"
          >
            <Images className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="!rounded-2xl !p-0 !bg-white !border-neutral-100 min-w-xs text-center overflow-hidden"
        >
          {project?.space_id ? (
            <>
              <header className="bg-neutral-50 p-6 border-b border-neutral-200/60">
                <div className="flex items-center justify-center -space-x-4 mb-3">
                  <div className="size-9 rounded-full bg-pink-200 shadow-2xs flex items-center justify-center text-xl opacity-50">
                    🎨
                  </div>
                  <div className="size-11 rounded-full bg-neutral-200 shadow-2xl flex items-center justify-center text-2xl z-2">
                    🖼️
                  </div>
                  <div className="size-9 rounded-full bg-neutral-300 shadow-2xs flex items-center justify-center text-xl opacity-50">
                    💻
                  </div>
                </div>
                <p className="text-xl font-medium text-neutral-950">
                  Add Custom Images
                </p>
                <p className="text-sm text-neutral-500 mt-1.5">
                  Upload images to your project and use them with Hanzo AI!
                </p>
              </header>
              <main className="space-y-4 p-5">
                <div>
                  <p className="text-xs text-left text-neutral-700 mb-2">
                    Uploaded Images
                  </p>
                  <div className="grid grid-cols-4 gap-1 flex-wrap max-h-40 overflow-y-auto">
                    {files.map((file) => (
                      <div
                        key={file}
                        className="select-none relative cursor-pointer bg-white rounded-md border-[2px] border-white hover:shadow-2xl transition-all duration-300"
                        onClick={() => onSelectFile(file)}
                      >
                        <Image
                          src={file}
                          alt="uploaded image"
                          width={56}
                          height={56}
                          className="object-cover w-full rounded-sm aspect-square"
                        />
                        {selectedFiles.includes(file) && (
                          <div className="absolute top-0 right-0 h-full w-full flex items-center justify-center bg-black/50 rounded-md">
                            <RiCheckboxCircleFill className="size-6 text-neutral-100" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-left text-neutral-700 mb-2">
                    Generate an image with AI
                  </p>
                  <div className="flex items-center gap-2">
                    <input
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
                      className="flex-1 min-w-0 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
                    />
                    <Button
                      variant="black"
                      onClick={() => void generateImage()}
                      disabled={generating || !prompt.trim()}
                      className="shrink-0"
                    >
                      {generating ? (
                        <Loading
                          overlay={false}
                          className="size-4 animate-spin"
                        />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      Generate
                    </Button>
                  </div>
                  {genError && (
                    <p className="text-xs text-left text-red-500 mt-1.5">
                      {genError}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-left text-neutral-700 mb-2">
                    Or import images from your computer
                  </p>
                  <Button
                    variant="black"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-full"
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
                        <Upload className="size-4" />
                        Upload Images
                      </>
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => uploadFiles(e.target.files)}
                  />
                </div>
              </main>
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
        variant="outline"
        className="!border-neutral-600 !text-neutral-400 !hover:!border-neutral-500 hover:!text-neutral-300"
        onClick={() => setOpen(true)}
      >
        <Images className="size-4" />
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
