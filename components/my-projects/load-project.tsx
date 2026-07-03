"use client";
import { useState } from "react";
import { Import } from "lucide-react";

import { Project } from "@/types";
import { Button } from "@hanzo/ui";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import Loading from "@/components/loading";
import { toast } from "sonner";
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
            className="max-lg:hidden"
            onClick={() => setOpenLoginModal(true)}
          >
            <Import className="size-4 mr-1.5" />
            Load existing Project
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setOpenLoginModal(true)}
          >
            {fullXsBtn && <Import className="size-3.5 mr-1" />}
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
              <Button variant="outline" className="max-lg:hidden">
                <Import className="size-4 mr-1.5" />
                Load existing Project
              </Button>
              <Button variant="outline" size="sm" className="lg:hidden">
                {fullXsBtn && <Import className="size-3.5 mr-1" />}
                Load
                {fullXsBtn && " existing Project"}
              </Button>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md !p-0 !rounded-3xl !bg-white !border-neutral-100 overflow-hidden text-center">
            <DialogTitle className="hidden" />
            <header className="bg-neutral-50 p-6 border-b border-neutral-200/60">
              <div className="flex items-center justify-center -space-x-4 mb-3">
                <div className="size-11 rounded-full bg-pink-200 shadow-2xs flex items-center justify-center text-2xl opacity-50">
                  🎨
                </div>
                <div className="size-13 rounded-full bg-amber-200 shadow-2xl flex items-center justify-center text-3xl z-2">
                  🥳
                </div>
                <div className="size-11 rounded-full bg-sky-200 shadow-2xs flex items-center justify-center text-2xl opacity-50">
                  💎
                </div>
              </div>
              <p className="text-2xl font-semibold text-neutral-950">
                Import a Project
              </p>
              <p className="text-base text-neutral-500 mt-1.5">
                Enter the URL of your Hanzo project to import an existing
                project.
              </p>
            </header>
            <main className="space-y-4 px-9 pb-9 pt-2">
              <div>
                <p className="text-sm text-neutral-700 mb-2">
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
                  className="!bg-white !border-neutral-300 !text-neutral-800 !placeholder:text-neutral-400 selection:!bg-blue-100"
                />
              </div>
              <div>
                <p className="text-sm text-neutral-700 mb-2">
                  Then, let&apos;s import it!
                </p>
                <Button
                  variant="black"
                  onClick={handleClick}
                  className="relative w-full"
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
