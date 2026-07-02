import { Rocket } from "lucide-react";
import Image from "next/image";

import Loading from "@/components/loading";
import { Button } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import SpaceIcon from "@/assets/space.svg";
import { Page } from "@/types";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";

export const DeployButtonContent = ({
  pages,
  options,
  prompts,
}: {
  pages: Page[];
  options?: {
    title?: string;
    description?: string;
  };
  prompts: string[];
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [config, setConfig] = useState({
    title: "",
  });

  const createSpace = async () => {
    if (!config.title) {
      toast.error("Please enter a title for your space.");
      return;
    }
    setLoading(true);

    try {
      const res = await api.post("/me/projects", {
        title: config.title,
        pages,
        prompts,
      });
      if (res.data.ok) {
        // Add to public gallery
        try {
          const mainHtml = pages.find(p => p.path === 'index.html')?.html || pages[0]?.html || '';
          await api.post("/gallery", {
            project: {
              id: res.data.path?.split('/').pop() || config.title.toLowerCase().replace(/\s+/g, '-'),
              name: config.title,
              prompt: prompts[0] || '',
              emoji: '🚀',
              html: mainHtml,
              tags: ['ai-generated', 'hanzo'],
            }
          });
          toast.success("Project added to public gallery!");
        } catch (galleryError) {
          console.error("Failed to add to gallery:", galleryError);
          // Don't fail the main operation if gallery fails
        }

        router.push(`/projects/${res.data.path}?deploy=true`);
      } else {
        toast.error(res?.data?.error || "Failed to create space");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="bg-neutral-50 p-6 border-b border-neutral-200/60">
        <div className="flex items-center justify-center -space-x-4 mb-3">
          <div className="size-9 rounded-full bg-amber-200 shadow-2xs flex items-center justify-center text-xl opacity-50">
            🚀
          </div>
          <div className="size-11 rounded-full bg-red-200 shadow-2xl flex items-center justify-center z-2">
            <Image src={SpaceIcon} alt="Space Icon" className="size-7" />
          </div>
          <div className="size-9 rounded-full bg-sky-200 shadow-2xs flex items-center justify-center text-xl opacity-50">
            👻
          </div>
        </div>
        <p className="text-xl font-semibold text-neutral-950">
          Publish to Hanzo Cloud
        </p>
        <p className="text-sm text-neutral-500 mt-1.5">
          {options?.description ??
            "Save and publish your project to Hanzo Cloud — a fast way to share your app with the world on a live URL."}
        </p>
      </header>
      <main className="space-y-4 p-6">
        <div>
          <p className="text-sm text-neutral-700 mb-2">
            Choose a title for your project:
          </p>
          <Input
            type="text"
            placeholder="My Awesome Website"
            value={config.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, title: e.target.value })}
            className="!bg-white !border-neutral-300 !text-neutral-800 !placeholder:text-neutral-400 selection:!bg-blue-100"
          />
        </div>
        <div>
          <p className="text-sm text-neutral-700 mb-2">
            Then, let&apos;s publish it!
          </p>
          <Button
            variant="black"
            onClick={createSpace}
            className="relative w-full"
            disabled={loading}
          >
            Publish to Hanzo Cloud <Rocket className="size-4" />
            {loading && <Loading className="ml-2 size-4 animate-spin" />}
          </Button>
        </div>
      </main>
    </>
  );
};
