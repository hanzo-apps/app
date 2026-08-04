import { useRef, useState } from "react";
import { Plus, Upload, Sparkles } from "lucide-react";
import Image from "next/image";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/overlay";
import { Button } from "@hanzo/ui";
import { Page, Project } from "@/types";
import Loading from "@/components/loading";
import { RiCheckboxCircleFill } from "react-icons/ri";
import { useUser } from "@/hooks/useUser";
import { LoginModal } from "@/components/login-modal";
import { DeployButtonContent } from "../deploy-button/content";
import { imageFilesFrom, uploadProjectImages } from "@/lib/upload-project-images";
import { References } from "@/components/references";

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
            size="icon"
            variant="ghost"
            aria-label="Add images"
            className="rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Plus className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={8}
          className="min-w-xs overflow-hidden p-0 text-center"
        >
          {project?.space_id ? (
            <>
              <header className="bg-muted/40 p-6 border-b border-border">
                <div className="flex items-center justify-center -space-x-4 mb-3">
                  <div className="size-9 rounded-full bg-muted border border-border shadow-2xs flex items-center justify-center text-xl">
                    🎨
                  </div>
                  <div className="size-11 rounded-full bg-secondary border border-border shadow-lg flex items-center justify-center text-2xl z-2">
                    🖼️
                  </div>
                  <div className="size-9 rounded-full bg-muted border border-border shadow-2xs flex items-center justify-center text-xl">
                    💻
                  </div>
                </div>
                <p className="text-xl font-medium text-foreground">
                  Add Custom Images
                </p>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Upload images to your project and use them with Hanzo AI!
                </p>
              </header>
              <main className="space-y-4 p-5">
                <div>
                  <p className="text-xs text-left text-muted-foreground mb-2">
                    Uploaded Images
                  </p>
                  <div className="grid grid-cols-4 gap-1 flex-wrap max-h-40 overflow-y-auto">
                    {files.map((file) => (
                      <div
                        key={file}
                        className="select-none relative cursor-pointer bg-muted rounded-md border-[2px] border-border hover:shadow-2xl transition-all duration-300"
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
                            <RiCheckboxCircleFill className="size-6 text-[var(--brand-accent-muted)]" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-left text-muted-foreground mb-2">
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
                      className="flex-1 min-w-0 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                    />
                    <Button
                      className="shrink-0"
                      onClick={() => void generateImage()}
                      disabled={generating || !prompt.trim()}
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
                  <p className="text-xs text-left text-muted-foreground mb-2">
                    Or import images from your computer
                  </p>
                  <Button
                    className="relative w-full"
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
              {/* Bring images in from a board or folder instead of picking files
                  one at a time. Lives here because this popover is already
                  "where images come from" — a second place to add images would
                  be a second thing to find. */}
              <div className="border-t border-border text-left">
                <References project={project.space_id} />
              </div>
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
        size="icon"
        variant="ghost"
        aria-label="Add images"
        className="rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
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
