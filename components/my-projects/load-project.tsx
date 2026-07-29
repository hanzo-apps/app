"use client";
import { useState } from "react";
import { Import } from "lucide-react";

import { Project } from "@/types";
import { Button } from "@hanzo/ui-shadcn";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@hanzo/ui-shadcn";
import { Input } from "@/components/control";
import Loading from "@/components/loading";
import { toast } from "@hanzo/ui-shadcn";
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
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 px-2.5 text-xs !border-border !bg-muted !text-foreground transition-colors duration-150 hover:!bg-accent max-lg:hidden"
            onClick={() => setOpenLoginModal(true)}
          >
            <Import className="size-3.5" />
            Load existing Project
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 px-2.5 text-xs !border-border !bg-muted !text-foreground transition-colors duration-150 hover:!bg-accent lg:hidden"
            onClick={() => setOpenLoginModal(true)}
          >
            {fullXsBtn && <Import className="size-3.5" />}
            Load
            {fullXsBtn && " existing Project"}
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
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 px-2.5 text-xs !border-border !bg-muted !text-foreground transition-colors duration-150 hover:!bg-muted max-lg:hidden"
              >
                <Import className="size-3.5" />
                Load
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 px-2.5 text-xs !border-border !bg-muted !text-foreground transition-colors duration-150 hover:!bg-muted lg:hidden"
              >
                {fullXsBtn && <Import className="size-3.5" />}
                Load
              </Button>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md !p-0 !rounded-xl bg-card text-foreground border-border overflow-hidden text-center">
            <DialogTitle className="hidden" />
            <header className="bg-muted/40 p-6 border-b border-border">
              <div className="flex items-center justify-center -space-x-4 mb-3">
                <div className="size-11 rounded-full bg-muted border border-border shadow-2xs flex items-center justify-center text-2xl">
                  🎨
                </div>
                <div className="size-13 rounded-full bg-secondary border border-border shadow-lg flex items-center justify-center text-3xl z-2">
                  🥳
                </div>
                <div className="size-11 rounded-full bg-muted border border-border shadow-2xs flex items-center justify-center text-2xl">
                  💎
                </div>
              </div>
              <p className="text-2xl font-medium text-foreground">
                Import a Project
              </p>
              <p className="text-base text-muted-foreground mt-1.5">
                Enter the URL of your Hanzo project to import an existing
                project.
              </p>
            </header>
            <main className="space-y-4 px-9 pb-9 pt-2">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Enter your Hanzo project URL
                </p>
                <Input
                  type="text"
                  placeholder="https://hanzo.ai/projects/username/project"
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
                  Then, let&apos;s import it!
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
                      Fetching your Space...
                    </>
                  ) : (
                    <>Import your Space</>
                  )}
                </Button>
              </div>
            </main>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
